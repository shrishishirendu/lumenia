import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { tutoringStorage } from "./storage";
import marketingAgentRoutes from "./routes/marketingAgent";
import { leadStatusEnum, leadEventTypeEnum } from "@shared/schema";

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
  
  // Marketing Agent API routes
  app.use("/api/marketing", marketingAgentRoutes);

  // Lead capture (public - no auth required) - Goes into Growth Engine
  app.post("/api/leads", async (req: any, res) => {
    try {
      const { 
        parentName, 
        email, 
        childYearLevel, 
        message,
        // Attribution fields
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        referrerUrl
      } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      const lead = await tutoringStorage.createLead({
        parentName: parentName || null,
        email,
        childYearLevel: childYearLevel || null,
        message: message || null,
        status: "NEW",
        sourceType: "landing_form",
        sourceName: "lumenia.au landing",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        referrerUrl: referrerUrl || null,
        leadScore: 10 // Default score for landing form leads
      });
      
      console.log(`[Growth Engine] New lead captured: ${email} for Year ${childYearLevel || 'N/A'}`);
      res.status(201).json({ success: true, id: lead.id });
    } catch (error) {
      console.error("[Growth Engine] Error capturing lead:", error);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  // ════════════════════════════════════════════════════════════════
  // GROWTH ENGINE API ROUTES (Admin-only)
  // ════════════════════════════════════════════════════════════════
  
  // Admin auth middleware - allows owner, admin, and teacher roles (matches AdminLayout)
  const requireAdminRole = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const profile = await tutoringStorage.getProfileByUserId(userId);
    if (!profile || !['owner', 'admin', 'teacher'].includes(profile.role)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.profile = profile;
    next();
  };
  
  // Growth Metrics Dashboard
  app.get("/api/growth/metrics", requireAdminRole, async (req: any, res) => {
    try {
      const metrics = await tutoringStorage.getGrowthMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("[Growth Engine] Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  
  // Get all leads with filtering
  app.get("/api/growth/leads", requireAdminRole, async (req: any, res) => {
    try {
      const { status, sourceType, yearLevel, assignedTo, search, limit, offset } = req.query;
      const result = await tutoringStorage.getLeadsByFilter({
        status: status as any,
        sourceType: sourceType as string,
        yearLevel: yearLevel ? parseInt(yearLevel as string) : undefined,
        assignedTo: assignedTo as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      });
      res.json(result);
    } catch (error) {
      console.error("[Growth Engine] Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });
  
  // Get single lead by ID
  app.get("/api/growth/leads/:id", requireAdminRole, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await tutoringStorage.getLead(leadId);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      
      const events = await tutoringStorage.getLeadEvents(leadId);
      res.json({ lead, events });
    } catch (error) {
      console.error("[Growth Engine] Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });
  
  // Zod schemas for Growth Engine validation
  const leadUpdateSchema = z.object({
    status: leadStatusEnum.optional(),
    parentName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    childYearLevel: z.number().int().min(1).max(12).nullable().optional(),
    subjectsInterested: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    leadScore: z.number().int().min(0).max(100).optional(),
    assignedToUserId: z.string().nullable().optional(),
    nextActionAt: z.string().datetime().nullable().optional().transform(v => v ? new Date(v) : null)
  }).strict();

  const leadEventSchema = z.object({
    type: leadEventTypeEnum.optional().default("NOTE_ADDED"),
    description: z.string().min(1).max(2000),
    metadata: z.record(z.any()).optional()
  }).strict();

  // Update lead
  app.patch("/api/growth/leads/:id", requireAdminRole, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const existing = await tutoringStorage.getLead(leadId);
      if (!existing) return res.status(404).json({ error: "Lead not found" });
      
      const parseResult = leadUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid update data", 
          details: parseResult.error.issues.map(i => i.message) 
        });
      }
      
      const updates = parseResult.data;
      const lead = await tutoringStorage.updateLead(leadId, updates);
      
      // Record status change event
      if (updates.status && updates.status !== existing.status) {
        await tutoringStorage.addLeadEvent({
          leadId,
          type: "STATUS_CHANGED",
          actor: "human",
          actorUserId: req.user?.claims?.sub,
          description: `Status changed from ${existing.status} to ${updates.status}`,
          metadata: JSON.stringify({ from: existing.status, to: updates.status })
        });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("[Growth Engine] Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });
  
  // Add lead event (note, contact attempt, etc.)
  app.post("/api/growth/leads/:id/events", requireAdminRole, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await tutoringStorage.getLead(leadId);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      
      const parseResult = leadEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid event data", 
          details: parseResult.error.issues.map(i => i.message) 
        });
      }
      
      const { type, description, metadata } = parseResult.data;
      const event = await tutoringStorage.addLeadEvent({
        leadId,
        type: type || "NOTE_ADDED",
        actor: "human",
        actorUserId: req.user?.claims?.sub,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("[Growth Engine] Error adding lead event:", error);
      res.status(500).json({ error: "Failed to add event" });
    }
  });
  
  // Get campaigns
  app.get("/api/growth/campaigns", requireAdminRole, async (req: any, res) => {
    try {
      const campaigns = await tutoringStorage.getAllGrowthCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("[Growth Engine] Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  
  // Create campaign
  app.post("/api/growth/campaigns", requireAdminRole, async (req: any, res) => {
    try {
      const campaign = await tutoringStorage.createGrowthCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("[Growth Engine] Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  
  // Get integration configs
  app.get("/api/growth/integrations", requireAdminRole, async (req: any, res) => {
    try {
      const configs = await tutoringStorage.getIntegrationConfigs();
      res.json(configs);
    } catch (error) {
      console.error("[Growth Engine] Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // ════════════════════════════════════════════════════════════════
  // ADMISSIONS AGENT API ROUTES
  // ════════════════════════════════════════════════════════════════

  // Get admissions stats
  app.get("/api/admissions/stats", requireAdminRole, async (req: any, res) => {
    try {
      const stats = await tutoringStorage.getAdmissionsStats();
      res.json(stats);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch admissions stats" });
    }
  });

  // Get admissions queue (pending review)
  app.get("/api/admissions/queue", requireAdminRole, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const queue = await tutoringStorage.getAdmissionsQueue(status as any);
      res.json(queue);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching queue:", error);
      res.status(500).json({ error: "Failed to fetch admissions queue" });
    }
  });

  // Get all admissions assessments
  app.get("/api/admissions/assessments", requireAdminRole, async (req: any, res) => {
    try {
      const assessments = await tutoringStorage.getAllAdmissionsAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  // Get assessment by lead ID
  app.get("/api/admissions/lead/:leadId", requireAdminRole, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      const assessment = await tutoringStorage.getAdmissionsAssessmentByLead(leadId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found for this lead" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching assessment by lead:", error);
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  // Get single assessment
  app.get("/api/admissions/assessments/:id", requireAdminRole, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid assessment ID" });
      }
      const assessment = await tutoringStorage.getAdmissionsAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching assessment:", error);
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  // Assess a lead (AI qualification)
  app.post("/api/admissions/assess/:leadId", requireAdminRole, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      const lead = await tutoringStorage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Check if already assessed
      const existing = await tutoringStorage.getAdmissionsAssessmentByLead(leadId);
      if (existing) {
        return res.status(400).json({ error: "Lead already assessed", assessment: existing });
      }

      // Import and run AI assessment
      const { assessLead } = await import("./services/admissionsAgent");
      const assessment = await assessLead(lead);
      
      // Create the assessment record
      const saved = await tutoringStorage.createAdmissionsAssessment({
        leadId,
        qualificationScore: assessment.qualificationScore,
        fitScore: assessment.fitScore,
        expectationAlignment: assessment.expectationAlignment,
        recommendedAction: assessment.recommendedAction,
        reasoning: assessment.reasoning,
        aiConfidence: assessment.aiConfidence,
        status: assessment.status
      });

      // Add lead event for assessment
      await tutoringStorage.addLeadEvent({
        leadId,
        type: "ai_assessment",
        actor: "ai",
        description: `AI assessed lead: ${assessment.recommendedAction} (confidence: ${assessment.aiConfidence}%)`,
        metadata: JSON.stringify({ assessmentId: saved.id, ...assessment })
      });

      // Apply auto decisions to Growth Engine based on autonomy level
      if (assessment.status === "auto_qualified") {
        // Auto-qualified: Update lead to CONTACTED status
        await tutoringStorage.updateLead(leadId, { 
          status: "CONTACTED",
          leadScore: Math.max(lead.leadScore || 0, assessment.qualificationScore)
        });
        await tutoringStorage.addLeadEvent({
          leadId,
          type: "status_change",
          actor: "ai",
          description: `Auto-qualified by AI (confidence: ${assessment.aiConfidence}%)`,
          metadata: JSON.stringify({ assessmentId: saved.id, newStatus: "CONTACTED" })
        });
      } else if (assessment.status === "auto_rejected") {
        // Auto-rejected: Update lead to LOST status
        await tutoringStorage.updateLead(leadId, { 
          status: "LOST",
          leadScore: Math.min(lead.leadScore || 0, assessment.fitScore)
        });
        await tutoringStorage.addLeadEvent({
          leadId,
          type: "status_change",
          actor: "ai",
          description: `Auto-rejected by AI (fit score: ${assessment.fitScore}%)`,
          metadata: JSON.stringify({ assessmentId: saved.id, newStatus: "LOST" })
        });
      }

      res.json(saved);
    } catch (error) {
      console.error("[Admissions Agent] Error assessing lead:", error);
      res.status(500).json({ error: "Failed to assess lead" });
    }
  });

  // Human decision on assessment
  app.post("/api/admissions/decision/:id", requireAdminRole, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid assessment ID" });
      }

      const decisionSchema = z.object({
        status: z.enum(["human_approved", "human_rejected", "nurturing"]),
        reviewerNotes: z.string().optional()
      });

      const parsed = decisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid decision data", details: parsed.error.errors });
      }

      const assessment = await tutoringStorage.getAdmissionsAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const userId = req.user?.claims?.sub;
      const updated = await tutoringStorage.updateAdmissionsAssessment(id, {
        status: parsed.data.status,
        reviewerNotes: parsed.data.reviewerNotes,
        reviewedBy: userId,
        reviewedAt: new Date()
      });

      // Update lead status based on decision
      let newLeadStatus: string | undefined;
      if (parsed.data.status === "human_approved") {
        newLeadStatus = "CONTACTED";
      } else if (parsed.data.status === "human_rejected") {
        newLeadStatus = "LOST";
      } else if (parsed.data.status === "nurturing") {
        newLeadStatus = "ENGAGED";
      }

      if (newLeadStatus) {
        await tutoringStorage.updateLead(assessment.leadId, { status: newLeadStatus });
        await tutoringStorage.addLeadEvent({
          leadId: assessment.leadId,
          type: "status_change",
          actor: "user",
          actorUserId: userId,
          description: `Human decision: ${parsed.data.status}`,
          metadata: JSON.stringify({ assessmentId: id, previousStatus: assessment.status })
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("[Admissions Agent] Error recording decision:", error);
      res.status(500).json({ error: "Failed to record decision" });
    }
  });

  // Get admissions settings
  app.get("/api/admissions/settings", requireAdminRole, async (req: any, res) => {
    try {
      let settings = await tutoringStorage.getAdmissionsSettings();
      if (!settings) {
        // Return defaults
        settings = {
          id: 0,
          autonomyLevel: 1,
          autoQualifyThreshold: 90,
          autoRejectThreshold: 20,
          minYearLevel: 6,
          maxYearLevel: 12,
          acceptedSubjects: "Mathematics,English",
          flagKeywords: "urgent,immediate,quick fix,2 weeks",
          isActive: true,
          updatedAt: new Date()
        };
      }
      res.json(settings);
    } catch (error) {
      console.error("[Admissions Agent] Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update admissions settings
  app.put("/api/admissions/settings", requireAdminRole, async (req: any, res) => {
    try {
      const settingsSchema = z.object({
        autonomyLevel: z.number().min(1).max(3).optional(),
        autoQualifyThreshold: z.number().min(0).max(100).optional(),
        autoRejectThreshold: z.number().min(0).max(100).optional(),
        minYearLevel: z.number().min(1).max(12).optional(),
        maxYearLevel: z.number().min(1).max(12).optional(),
        acceptedSubjects: z.string().optional(),
        flagKeywords: z.string().optional(),
        isActive: z.boolean().optional()
      });

      const parsed = settingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid settings data", details: parsed.error.errors });
      }

      const settings = await tutoringStorage.upsertAdmissionsSettings(parsed.data);
      res.json(settings);
    } catch (error) {
      console.error("[Admissions Agent] Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

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

  // Set user role (called after login with role selection)
  app.post("/api/profile/role", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { role } = req.body;
      const validRoles = ["student", "parent", "teacher", "owner"];
      
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const mappedRole = role === "tutor" ? "teacher" : role === "admin" ? "owner" : role;
      
      const profile = await tutoringStorage.upsertProfile({
        userId,
        role: mappedRole
      });
      res.json(profile);
    } catch (error) {
      console.error("Error setting role:", error);
      res.status(500).json({ error: "Failed to set role" });
    }
  });

  // Student Dashboard (Learning Loop)
  app.get("/api/student/dashboard", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const memory = await tutoringStorage.getStudentMemory(profile.id);
      const latestSession = await tutoringStorage.getLatestSessionAttempt(profile.id);
      
      res.json({
        memory: memory || {
          lastSubject: null,
          lastTopicId: null,
          lastTopicName: null,
          streakCount: 0,
          dailyGoalMinutes: 15,
          todayMinutesCompleted: 0
        },
        hasWarmupQuestions: !!latestSession,
        nextSession: null
      });
    } catch (error) {
      console.error("Error fetching student dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  // Update daily goal
  app.post("/api/student/goal", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const { dailyGoalMinutes } = req.body;
      if (!dailyGoalMinutes || dailyGoalMinutes < 5 || dailyGoalMinutes > 120) {
        return res.status(400).json({ error: "Invalid goal (5-120 minutes)" });
      }
      
      // Update or create student memory with new goal, preserving existing data
      const existingMemory = await tutoringStorage.getStudentMemory(profile.id);
      await tutoringStorage.upsertStudentMemory({
        studentId: profile.id,
        dailyGoalMinutes,
        streakCount: existingMemory?.streakCount ?? 0,
        todayMinutesCompleted: existingMemory?.todayMinutesCompleted ?? 0,
        lastActiveDate: existingMemory?.lastActiveDate ?? null,
        lastSubject: existingMemory?.lastSubject ?? null,
        lastTopicId: existingMemory?.lastTopicId ?? null,
        lastTopicName: existingMemory?.lastTopicName ?? null,
      });
      
      res.json({ success: true, dailyGoalMinutes });
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // Get topic mastery for student
  app.get("/api/student/mastery", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const mastery = await tutoringStorage.getTopicMasteryByStudent(profile.id);
      res.json(mastery);
    } catch (error) {
      console.error("Error fetching mastery:", error);
      res.status(500).json({ error: "Failed to fetch mastery" });
    }
  });

  // Get session attempts for student
  app.get("/api/student/sessions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const sessions = await tutoringStorage.getSessionAttemptsByStudent(profile.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Create new session attempt
  app.post("/api/student/sessions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const { subject, topicId, topicName } = req.body;
      
      const session = await tutoringStorage.createSessionAttempt({
        studentId: profile.id,
        subject: subject || "math",
        topicId: topicId || "linear_equations",
        topicName: topicName || "Linear Equations"
      });
      
      await tutoringStorage.upsertStudentMemory({
        studentId: profile.id,
        lastSubject: session.subject,
        lastTopicId: session.topicId,
        lastTopicName: session.topicName,
        lastActiveDate: new Date()
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Update session attempt
  app.patch("/api/student/sessions/:id", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      
      const session = await tutoringStorage.updateSessionAttempt(sessionId, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Update topic mastery
  app.post("/api/student/mastery", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      
      const { subject, topicId, topicName, masteryStatus, accuracyRolling, hintsRolling, mistakeTags } = req.body;
      
      const mastery = await tutoringStorage.upsertTopicMastery({
        studentId: profile.id,
        subject,
        topicId,
        topicName,
        masteryStatus,
        accuracyRolling,
        hintsRolling,
        mistakeTags,
        lastSeenAt: new Date()
      });
      
      res.json(mastery);
    } catch (error) {
      console.error("Error updating mastery:", error);
      res.status(500).json({ error: "Failed to update mastery" });
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

  // Lessons and structured content (auth required)
  app.get("/api/lessons/topic/:topicId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const topicId = parseInt(req.params.topicId);
      const lessons = await tutoringStorage.getLessonsByTopic(topicId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const lessonId = parseInt(req.params.id);
      const lesson = await tutoringStorage.getLesson(lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      
      const segments = await tutoringStorage.getLessonSegments(lessonId);
      res.json({ ...lesson, segments });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.get("/api/lessons/:id/segments", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const lessonId = parseInt(req.params.id);
      const segments = await tutoringStorage.getLessonSegments(lessonId);
      res.json(segments);
    } catch (error) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ error: "Failed to fetch segments" });
    }
  });

  // Quiz endpoints (auth required)
  app.get("/api/quiz/lesson/:lessonId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const lessonId = parseInt(req.params.lessonId);
      const questions = await tutoringStorage.getQuizQuestionsByLesson(lessonId);
      res.json(questions.map(q => ({
        ...q,
        correctAnswer: undefined // Don't expose correct answer
      })));
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Generate pre-session quiz from last completed lesson
  app.get("/api/quiz/pre-session", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { generatePreSessionQuiz } = await import("./ai-tutor");
      const progressList = await tutoringStorage.getLessonProgressByStudent(profile.id);
      
      const completedLessons = progressList.filter(p => p.status === "completed");
      if (completedLessons.length === 0) {
        return res.json({ questions: [], message: "No previous lessons to review" });
      }

      const lastCompleted = completedLessons.sort((a, b) => 
        (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      
      const lesson = await tutoringStorage.getLesson(lastCompleted.lessonId);
      if (!lesson) {
        return res.json({ questions: [], message: "Previous lesson not found" });
      }

      const existingQuestions = await tutoringStorage.getQuizQuestionsByLesson(lastCompleted.lessonId);
      if (existingQuestions.length > 0) {
        const shuffled = existingQuestions.sort(() => Math.random() - 0.5).slice(0, 3);
        return res.json({
          lessonId: lastCompleted.lessonId,
          lessonTitle: lesson.title,
          questions: shuffled.map(q => ({ 
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            difficulty: q.difficulty,
            points: q.points
          }))
        });
      }

      // Generate AI quiz and persist to database for proper grading
      const quiz = await generatePreSessionQuiz(lesson.title, lesson.description || "", profile.grade || 9);
      const savedQuestions = await Promise.all(
        quiz.questions.map(async (q) => {
          return tutoringStorage.createQuizQuestion({
            lessonId: lastCompleted.lessonId,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points
          });
        })
      );
      
      res.json({
        lessonId: lastCompleted.lessonId,
        lessonTitle: lesson.title,
        questions: savedQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          difficulty: q.difficulty,
          points: q.points
        }))
      });
    } catch (error) {
      console.error("Error generating pre-session quiz:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // Submit quiz answers
  app.post("/api/quiz/submit", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { lessonId, answers, quizType } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Answers array required" });
      }

      const attempt = await tutoringStorage.createQuizAttempt({
        studentId: profile.id,
        lessonId: lessonId || null,
        quizType: quizType || "lesson"
      });

      let totalScore = 0;
      let totalPoints = 0;
      const results: any[] = [];

      for (const ans of answers) {
        const question = await tutoringStorage.getQuizQuestion(ans.questionId);
        if (!question) continue;

        const isCorrect = question.correctAnswer.toLowerCase().trim() === 
          String(ans.answer).toLowerCase().trim();
        const pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;
        totalPoints += question.points;

        await tutoringStorage.createQuizAnswer({
          attemptId: attempt.id,
          questionId: ans.questionId,
          studentAnswer: String(ans.answer),
          isCorrect,
          pointsEarned
        });

        results.push({
          questionId: ans.questionId,
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
      }

      const passed = totalPoints > 0 ? (totalScore / totalPoints) >= 0.7 : false;
      const completedAttempt = await tutoringStorage.completeQuizAttempt(
        attempt.id, totalScore, totalPoints, passed
      );

      res.json({
        attemptId: attempt.id,
        score: totalScore,
        totalPoints,
        percentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
        passed,
        results
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Lesson progress
  app.get("/api/lessons/progress", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const progress = await tutoringStorage.getLessonProgressByStudent(profile.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching lesson progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/lessons/progress", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { lessonId, currentSegmentId, status } = req.body;
      if (!lessonId) return res.status(400).json({ error: "Lesson ID required" });

      const progress = await tutoringStorage.createOrUpdateLessonProgress({
        studentId: profile.id,
        lessonId,
        currentSegmentId: currentSegmentId || null,
        status: status || "in_progress",
        startedAt: new Date()
      });
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
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
