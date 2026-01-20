import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { tutoringStorage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve static avatar image for D-ID
  app.use("/static/avatar", express.static(path.join(process.cwd(), "attached_assets/generated_images")));

  // Setup authentication first (MUST be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Register integration routes
  registerChatRoutes(app);
  registerAudioRoutes(app);
  registerImageRoutes(app);

  // Tutoring-specific routes
  // Get student profile
  app.get("/api/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create/update student profile
  app.post("/api/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.upsertProfile({
        userId,
        ...req.body
      });
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Get student progress
  app.get("/api/progress", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const progress = await tutoringStorage.getProgressByStudent(profile.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Start new tutoring session
  app.post("/api/sessions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const subject = req.body.subject || "math";
      const defaultTopic = subject === "english" ? "Grammar & Writing" : "Linear Equations";
      
      const session = await tutoringStorage.createSession({
        studentId: profile.id,
        subject,
        topic: req.body.topic || defaultTopic,
        status: "active"
      });
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Get session by ID
  app.get("/api/sessions/:id", async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await tutoringStorage.getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      
      const messages = await tutoringStorage.getSessionMessages(sessionId);
      res.json({ ...session, messages });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Complete a session
  app.patch("/api/sessions/:id/complete", async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await tutoringStorage.completeSession(sessionId, req.body.transcript || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  // AI Tutoring chat endpoint
  app.post("/api/tutor/chat", async (req: any, res) => {
    try {
      const { sessionId, message, history, teachingStyle } = req.body;
      
      // Get session for context
      const session = await tutoringStorage.getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      // Store user message
      await tutoringStorage.createSessionMessage({
        sessionId,
        role: "user",
        content: message
      });

      // Check if message contains math and get WolframAlpha result for accuracy (only for math subject)
      const { isMathQuestion, extractMathExpression, queryWolframAlpha, queryWolframAlphaFull } = await import("./wolfram-alpha");
      let wolframAnswer: string | undefined;
      
      const subject = session.subject || "math";
      
      if (subject === "math" && isMathQuestion(message)) {
        const mathExpr = extractMathExpression(message);
        if (mathExpr) {
          let wolframResult = await queryWolframAlpha(mathExpr);
          if (!wolframResult.success || !wolframResult.answer) {
            wolframResult = await queryWolframAlphaFull(mathExpr);
          }
          if (wolframResult.success && wolframResult.answer) {
            wolframAnswer = wolframResult.answer;
          }
        }
      }

      // Generate AI response using selected teaching style
      const { generateTutoringResponse } = await import("./ai-tutor");
      const response = await generateTutoringResponse(
        history || [],
        message,
        session.topic,
        wolframAnswer,
        subject,
        teachingStyle || "socratic"
      );

      // Store AI response (without the internal WolframAlpha note)
      await tutoringStorage.createSessionMessage({
        sessionId,
        role: "assistant",
        content: response
      });

      res.json({ response });
    } catch (error) {
      console.error("Error in tutoring chat:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Speech-to-text endpoint
  app.post("/api/tutor/transcribe", async (req: any, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) return res.status(400).json({ error: "Audio data required" });

      const { transcribeSpeech } = await import("./ai-tutor");
      const { convertWebmToWav } = await import("./audio-converter");
      
      const audioBuffer = Buffer.from(audio, "base64");
      console.log("Received audio for transcription, mimeType:", mimeType, "size:", audioBuffer.length);
      const wavBuffer = await convertWebmToWav(audioBuffer, mimeType || "audio/webm");
      const text = await transcribeSpeech(wavBuffer);

      console.log("Transcribed text:", text);
      res.json({ text });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Text-to-speech endpoint
  app.post("/api/tutor/speak", async (req: any, res) => {
    try {
      const { text, subject } = req.body;
      if (!text) return res.status(400).json({ error: "Text required" });

      const { generateTextToSpeech } = await import("./ai-tutor");
      const audioBuffer = await generateTextToSpeech(text, subject || "math");

      res.set("Content-Type", "audio/wav");
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // Parent report endpoints
  app.get("/api/parent/summary", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { generateProgressSummary } = await import("./report-generator");
      const summary = await generateProgressSummary(profile.id);
      res.json(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  app.post("/api/parent/generate-report", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { generateParentReport } = await import("./report-generator");
      const report = await generateParentReport(profile.id);
      res.json({ report });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/parent/reports", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const reports = await tutoringStorage.getReportsByStudent(profile.id);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Human Tutor Request endpoints
  app.post("/api/tutor/request-human", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { topic, reason, urgency, sessionId } = req.body;
      if (!topic || !reason) {
        return res.status(400).json({ error: "Topic and reason are required" });
      }

      const request = await tutoringStorage.createHumanTutorRequest({
        studentId: profile.id,
        sessionId: sessionId || null,
        topic,
        reason,
        urgency: urgency || "normal",
        status: "pending"
      });

      res.json(request);
    } catch (error) {
      console.error("Error creating human tutor request:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  app.get("/api/tutor/requests", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const requests = await tutoringStorage.getHumanTutorRequestsByStudent(profile.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching tutor requests:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/admin/tutor-requests/pending", async (req: any, res) => {
    try {
      const requests = await tutoringStorage.getPendingHumanTutorRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Analyze student drawing/handwriting
  app.post("/api/tutor/analyze-drawing", async (req: any, res) => {
    try {
      const { imageData, subject, context } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: "Image data required" });
      }

      const { analyzeStudentDrawing } = await import("./ai-tutor");
      const analysis = await analyzeStudentDrawing(imageData, subject || "math", context || "");
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing drawing:", error);
      res.status(500).json({ error: "Failed to analyze drawing" });
    }
  });

  // Confirm student doubt before answering
  app.post("/api/tutor/confirm-doubt", async (req: any, res) => {
    try {
      const { question, subject } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question required" });
      }

      const { confirmStudentDoubt } = await import("./ai-tutor");
      const confirmation = await confirmStudentDoubt(question, subject || "math");
      res.json({ confirmation });
    } catch (error) {
      console.error("Error confirming doubt:", error);
      res.status(500).json({ error: "Failed to confirm doubt" });
    }
  });

  // AI Agents endpoints
  app.post("/api/agents/chat", async (req: any, res) => {
    try {
      const { agentType, message, history } = req.body;
      const validTypes = ["marketing", "sales", "operations", "admissions"];
      if (!agentType || !message) {
        return res.status(400).json({ error: "Agent type and message required" });
      }
      if (!validTypes.includes(agentType)) {
        return res.status(400).json({ error: "Invalid agent type" });
      }

      const { generateAgentResponse } = await import("./ai-agents");
      const response = await generateAgentResponse(agentType, message, history || []);
      res.json({ response });
    } catch (error) {
      console.error("Agent chat error:", error);
      res.status(500).json({ error: "Failed to get agent response" });
    }
  });

  app.post("/api/agents/marketing/generate", async (req: any, res) => {
    try {
      const { contentType, context } = req.body;
      const { generateMarketingContent } = await import("./ai-agents");
      const content = await generateMarketingContent(contentType || "ad_copy", context);
      res.json(content);
    } catch (error) {
      console.error("Marketing generation error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  app.get("/api/agents/log/:agentType", async (req: any, res) => {
    try {
      const { agentType } = req.params;
      const validTypes = ["marketing", "sales", "operations", "admissions"];
      if (!validTypes.includes(agentType)) {
        return res.status(400).json({ error: "Invalid agent type" });
      }
      const { generateAgentLog } = await import("./ai-agents");
      const log = await generateAgentLog(agentType);
      res.json({ log, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Agent log error:", error);
      res.status(500).json({ error: "Failed to generate log" });
    }
  });

  app.post("/api/agents/sales/inquiry", async (req: any, res) => {
    try {
      const { message, leadContext } = req.body;
      const { handleSalesInquiry } = await import("./ai-agents");
      const result = await handleSalesInquiry(message, leadContext);
      res.json(result);
    } catch (error) {
      console.error("Sales inquiry error:", error);
      res.status(500).json({ error: "Failed to process inquiry" });
    }
  });

  app.post("/api/agents/admissions/process", async (req: any, res) => {
    try {
      const studentInfo = req.body;
      const { processAdmission } = await import("./ai-agents");
      const result = await processAdmission(studentInfo);
      res.json(result);
    } catch (error) {
      console.error("Admissions error:", error);
      res.status(500).json({ error: "Failed to process admission" });
    }
  });

  // D-ID Avatar endpoints
  app.post("/api/avatar/talk", async (req: any, res) => {
    try {
      const { text, subject } = req.body;
      if (!text) return res.status(400).json({ error: "Text required" });

      // Construct public URL for the appropriate avatar based on subject
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['host'] || req.headers['x-forwarded-host'];
      
      const avatarFile = subject === "english" 
        ? "mr_mitchell_english_teacher_portrait.png"
        : "photorealistic_female_teacher_avatar.png";
      const avatarUrl = `${protocol}://${host}/static/avatar/${avatarFile}`;

      const { createTalkingAvatar } = await import("./did-avatar");
      const result = await createTalkingAvatar(text, avatarUrl, subject || "math");
      res.json(result);
    } catch (error) {
      console.error("Error creating talking avatar:", error);
      res.status(500).json({ error: "Failed to create talking avatar" });
    }
  });

  app.post("/api/avatar/stream/start", async (req: any, res) => {
    try {
      // Construct public URL for Ms. Chen's avatar
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['host'] || req.headers['x-forwarded-host'];
      const msChenAvatarUrl = `${protocol}://${host}/static/avatar/photorealistic_female_teacher_avatar.png`;

      const { createStreamingSession } = await import("./did-avatar");
      const result = await createStreamingSession(msChenAvatarUrl);
      res.json(result);
    } catch (error) {
      console.error("Error starting avatar stream:", error);
      res.status(500).json({ error: "Failed to start avatar stream" });
    }
  });

  app.post("/api/avatar/stream/speak", async (req: any, res) => {
    try {
      const { sessionId, text } = req.body;
      if (!sessionId || !text) {
        return res.status(400).json({ error: "Session ID and text required" });
      }

      const { sendTextToStream } = await import("./did-avatar");
      await sendTextToStream(sessionId, text);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending text to stream:", error);
      res.status(500).json({ error: "Failed to send text to stream" });
    }
  });

  app.post("/api/avatar/stream/close", async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Session ID required" });

      const { closeStream } = await import("./did-avatar");
      await closeStream(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error closing stream:", error);
      res.status(500).json({ error: "Failed to close stream" });
    }
  });

  // ============ ADMIN ROUTES ============
  
  // Get all tutors (admin only)
  app.get("/api/admin/tutors", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const tutorProfiles = await tutoringStorage.getAllTutorProfiles();
      res.json(tutorProfiles);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).json({ error: "Failed to fetch tutors" });
    }
  });

  // Get all students (admin only)
  app.get("/api/admin/students", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const students = await tutoringStorage.getProfilesByRole("student");
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get all support tickets (admin only)
  app.get("/api/admin/tickets", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const tickets = await tutoringStorage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Update ticket status (admin only)
  app.patch("/api/admin/tickets/:id", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const ticketId = parseInt(req.params.id);
      const updated = await tutoringStorage.updateSupportTicket(ticketId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // Get activity logs (admin only)
  app.get("/api/admin/activities", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const activities = await tutoringStorage.getRecentActivityLogs(50);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Create new tutor (admin only)
  app.post("/api/admin/tutors", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // For now, just return success - full tutor creation requires user account creation
      res.json({ success: true, message: "Tutor invitation would be sent to " + req.body.email });
    } catch (error) {
      console.error("Error creating tutor:", error);
      res.status(500).json({ error: "Failed to create tutor" });
    }
  });

  // ============ TUTOR ROUTES ============
  
  // Get tutor's own profile
  app.get("/api/tutor/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const tutorProfile = await tutoringStorage.getTutorProfileByProfileId(profile.id);
      if (!tutorProfile) return res.status(404).json({ error: "Tutor profile not found" });
      
      res.json(tutorProfile);
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({ error: "Failed to fetch tutor profile" });
    }
  });

  // Update tutor profile
  app.patch("/api/tutor/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const tutorProfile = await tutoringStorage.getTutorProfileByProfileId(profile.id);
      if (!tutorProfile) return res.status(404).json({ error: "Tutor profile not found" });
      
      const updated = await tutoringStorage.updateTutorProfile(tutorProfile.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating tutor profile:", error);
      res.status(500).json({ error: "Failed to update tutor profile" });
    }
  });

  // Get tutor's assigned students
  app.get("/api/tutor/students", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const tutorProfile = await tutoringStorage.getTutorProfileByProfileId(profile.id);
      if (!tutorProfile) return res.status(404).json({ error: "Tutor profile not found" });
      
      const assignments = await tutoringStorage.getTutorAssignmentsByTutor(tutorProfile.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching tutor students:", error);
      res.status(500).json({ error: "Failed to fetch assigned students" });
    }
  });

  // ============ STUDENT ROUTES ============
  
  // Get student's teaching plans
  app.get("/api/student/teaching-plans", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const plans = await tutoringStorage.getTeachingPlansByStudent(profile.id);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching teaching plans:", error);
      res.status(500).json({ error: "Failed to fetch teaching plans" });
    }
  });

  // Get student's session history
  app.get("/api/student/sessions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const sessions = await tutoringStorage.getSessionsByStudent(profile.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get student's progress
  app.get("/api/student/progress", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const progress = await tutoringStorage.getProgressByStudent(profile.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // ============ PARENT ROUTES ============
  
  // Get parent's linked students
  app.get("/api/parent/students", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const links = await tutoringStorage.getLinkedStudents(profile.id);
      res.json(links);
    } catch (error) {
      console.error("Error fetching linked students:", error);
      res.status(500).json({ error: "Failed to fetch linked students" });
    }
  });

  // Create support ticket
  app.post("/api/parent/tickets", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const ticket = await tutoringStorage.createSupportTicket({
        submitterId: profile.id,
        ...req.body
      });
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  // Create appointment booking
  app.post("/api/parent/appointments", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const appointment = await tutoringStorage.createAppointment({
        requestorId: profile.id,
        ...req.body
      });
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Get parent's appointments
  app.get("/api/parent/appointments", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const appointments = await tutoringStorage.getAppointmentsByRequestor(profile.id);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  return httpServer;
}
