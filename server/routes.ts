import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { tutoringStorage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      
      const session = await tutoringStorage.createSession({
        studentId: profile.id,
        topic: req.body.topic || "General Math",
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
      const { sessionId, message, history } = req.body;
      
      // Get session for context
      const session = await tutoringStorage.getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      // Store user message
      await tutoringStorage.createSessionMessage({
        sessionId,
        role: "user",
        content: message
      });

      // Generate AI response using Socratic method
      const { generateTutoringResponse } = await import("./ai-tutor");
      const response = await generateTutoringResponse(
        history || [],
        message,
        session.topic
      );

      // Store AI response
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
      const { audio } = req.body;
      if (!audio) return res.status(400).json({ error: "Audio data required" });

      const { transcribeSpeech } = await import("./ai-tutor");
      const audioBuffer = Buffer.from(audio, "base64");
      const text = await transcribeSpeech(audioBuffer);

      res.json({ text });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Text-to-speech endpoint
  app.post("/api/tutor/speak", async (req: any, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Text required" });

      const { generateTextToSpeech } = await import("./ai-tutor");
      const audioBuffer = await generateTextToSpeech(text);

      res.set("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  return httpServer;
}
