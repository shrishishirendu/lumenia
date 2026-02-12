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
import { generateVariantsForTopic, generateVariants, type VariantQuestion } from "./services/variantGenerator";
import { generatePool, generateMixedPool, type GeneratedQuestion } from "./services/questionEngine/linearEquations";
import { generatePool as generateIneqPool, generateMixedPool as generateIneqMixedPool } from "./services/questionEngine/inequalities";
import { generatePool as generateFracIdxPool, generateMixedPool as generateFracIdxMixedPool } from "./services/questionEngine/fractionalIndices";
import { generatePool as generateSurdsPool, generateMixedPool as generateSurdsMixedPool } from "./services/questionEngine/surdsIntro";
import { generatePool as generateSimplSurdsPool, generateMixedPool as generateSimplSurdsMixedPool } from "./services/questionEngine/simplifyingSurds";
import { getGenerator, resolveTopicSlug } from "./services/questionEngine/registry";
import { getTopicBySlug } from "@shared/topicCatalog";

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

  // ════════════════════════════════════════════════════════════════
  // ACADEMIC QUALITY AGENT API ROUTES
  // ════════════════════════════════════════════════════════════════

  // Get dashboard stats
  app.get("/api/academic-quality/stats", requireAdminRole, async (req: any, res) => {
    try {
      const stats = await tutoringStorage.getAcademicQualityStats();
      res.json(stats);
    } catch (error) {
      console.error("[Academic Quality Agent] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get all alerts
  app.get("/api/academic-quality/alerts", requireAdminRole, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      let alerts;
      
      if (status === "active") {
        alerts = await tutoringStorage.getActiveAcademicAlerts();
      } else if (status) {
        alerts = await tutoringStorage.getAcademicAlertsByStatus(status as any);
      } else {
        alerts = await tutoringStorage.getAllAcademicAlerts();
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("[Academic Quality Agent] Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Get alerts for a specific student
  app.get("/api/academic-quality/student/:studentId/alerts", requireAdminRole, async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const alerts = await tutoringStorage.getAcademicAlertsByStudent(studentId);
      res.json(alerts);
    } catch (error) {
      console.error("[Academic Quality Agent] Error fetching student alerts:", error);
      res.status(500).json({ error: "Failed to fetch student alerts" });
    }
  });

  // Analyze a specific student
  app.post("/api/academic-quality/analyze/:studentId", requireAdminRole, async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const profile = await tutoringStorage.getProfileById(studentId);
      if (!profile) {
        return res.status(404).json({ error: "Student not found" });
      }

      const { analyzeStudent } = await import("./services/academicQualityAgent");
      const analysis = await analyzeStudent(studentId);
      
      res.json(analysis);
    } catch (error) {
      console.error("[Academic Quality Agent] Error analyzing student:", error);
      res.status(500).json({ error: "Failed to analyze student" });
    }
  });

  // Scan all students for issues
  app.post("/api/academic-quality/scan", requireAdminRole, async (req: any, res) => {
    try {
      const { scanAllStudents } = await import("./services/academicQualityAgent");
      const result = await scanAllStudents();
      res.json(result);
    } catch (error) {
      console.error("[Academic Quality Agent] Error scanning students:", error);
      res.status(500).json({ error: "Failed to scan students" });
    }
  });

  // Get student performance metrics
  app.get("/api/academic-quality/student/:studentId/metrics", requireAdminRole, async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const metrics = await tutoringStorage.getStudentPerformanceMetrics(studentId);
      res.json(metrics);
    } catch (error) {
      console.error("[Academic Quality Agent] Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Update alert status (acknowledge, resolve, dismiss)
  app.patch("/api/academic-quality/alerts/:id", requireAdminRole, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid alert ID" });
      }

      const alertSchema = z.object({
        status: z.enum(["active", "acknowledged", "in_progress", "resolved", "dismissed"]).optional(),
        resolutionNotes: z.string().optional()
      });

      const parsed = alertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid alert data", details: parsed.error.errors });
      }

      const alert = await tutoringStorage.getAcademicAlert(id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const userId = req.user?.claims?.sub;
      const updates: any = { ...parsed.data };
      
      if (parsed.data.status === "acknowledged" && alert.status !== "acknowledged") {
        updates.acknowledgedBy = userId;
        updates.acknowledgedAt = new Date();
      }
      if (parsed.data.status === "resolved" && alert.status !== "resolved") {
        updates.resolvedBy = userId;
        updates.resolvedAt = new Date();
      }

      const updated = await tutoringStorage.updateAcademicAlert(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("[Academic Quality Agent] Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Get academic quality settings
  app.get("/api/academic-quality/settings", requireAdminRole, async (req: any, res) => {
    try {
      let settings = await tutoringStorage.getAcademicQualitySettings();
      if (!settings) {
        settings = {
          id: 0,
          autonomyLevel: 1,
          masteryThreshold: 60,
          engagementThreshold: 40,
          progressDeclineThreshold: 15,
          inactivityDays: 7,
          autoNotifyParent: false,
          autoNotifyTutor: true,
          scanFrequency: "daily",
          isActive: true,
          updatedAt: new Date()
        };
      }
      res.json(settings);
    } catch (error) {
      console.error("[Academic Quality Agent] Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update academic quality settings
  app.put("/api/academic-quality/settings", requireAdminRole, async (req: any, res) => {
    try {
      const settingsSchema = z.object({
        autonomyLevel: z.number().min(1).max(3).optional(),
        masteryThreshold: z.number().min(0).max(100).optional(),
        engagementThreshold: z.number().min(0).max(100).optional(),
        progressDeclineThreshold: z.number().min(0).max(100).optional(),
        inactivityDays: z.number().min(1).max(90).optional(),
        autoNotifyParent: z.boolean().optional(),
        autoNotifyTutor: z.boolean().optional(),
        scanFrequency: z.enum(["daily", "weekly"]).optional(),
        isActive: z.boolean().optional()
      });

      const parsed = settingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid settings data", details: parsed.error.errors });
      }

      const settings = await tutoringStorage.upsertAcademicQualitySettings(parsed.data);
      res.json(settings);
    } catch (error) {
      console.error("[Academic Quality Agent] Error updating settings:", error);
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
          todayMinutesCompleted: 0,
          yearLevel: profile.grade || 9,
        },
        grade: profile.grade || 9,
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
        topicId: topicId || "unknown",
        topicName: topicName || "Unknown Topic"
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

      if (updates.endedAt && updates.timeSpentSec) {
        const profile = await tutoringStorage.getProfileByUserId(userId);
        if (profile) {
          const minutesCompleted = Math.max(1, Math.round(updates.timeSpentSec / 60));
          const existingMemory = await tutoringStorage.getStudentMemory(profile.id);
          const currentMinutes = existingMemory?.todayMinutesCompleted ?? 0;
          await tutoringStorage.upsertStudentMemory({
            studentId: profile.id,
            todayMinutesCompleted: currentMinutes + minutesCompleted,
            lastActiveDate: new Date(),
            streakCount: existingMemory?.streakCount ?? 0,
            dailyGoalMinutes: existingMemory?.dailyGoalMinutes ?? 15,
            lastSubject: existingMemory?.lastSubject ?? null,
            lastTopicId: existingMemory?.lastTopicId ?? null,
            lastTopicName: existingMemory?.lastTopicName ?? null,
          });
        }
      }

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

      // Get student year level for AI context (profiles.grade preferred, fall back to query param)
      let yearLevel: number | undefined;
      try {
        const studentProfile = await tutoringStorage.getProfileById(session.studentId);
        yearLevel = studentProfile?.grade ?? undefined;
      } catch {}
      if (!yearLevel && req.body.year) {
        yearLevel = parseInt(req.body.year);
        if (isNaN(yearLevel)) yearLevel = undefined;
      }

      // Fetch topic notes summary for AI context
      let topicNoteSummary: string | undefined;
      if (req.body.topicId) {
        try {
          const notes = await tutoringStorage.getTopicNotes(parseInt(req.body.topicId));
          if (notes?.summary) topicNoteSummary = notes.summary;
        } catch {}
      }

      // Generate AI response using selected teaching style
      const { generateTutoringResponse } = await import("./ai-tutor");
      const response = await generateTutoringResponse(
        history || [],
        message,
        session.topic,
        wolframAnswer,
        subject,
        teachingStyle || "socratic",
        yearLevel,
        topicNoteSummary
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

  // Topic resolution endpoint
  app.get("/api/topics/resolve", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { subject, title, grade } = req.query;
      if (!subject || !title || !grade) {
        return res.status(400).json({ error: "subject, title, and grade query params required" });
      }

      const subjectNameLower = String(subject).toLowerCase();
      const subjectId = subjectNameLower.includes("math") ? 1 : 2;
      const gradeLevel = parseInt(String(grade));

      const topic = await tutoringStorage.getTopicBySubjectAndGrade(subjectId, gradeLevel, String(title));
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const topicLessons = await tutoringStorage.getLessonsByTopic(topic.id);
      const questions = await tutoringStorage.getQuizQuestionsByTopic(topic.id);

      res.json({
        topic,
        lessons: topicLessons,
        questionCount: questions.length,
      });
    } catch (error) {
      console.error("Error resolving topic:", error);
      res.status(500).json({ error: "Failed to resolve topic" });
    }
  });

  // Full topic content for SessionFlow (lessons + segments + questions)
  app.get("/api/topics/:topicId/content", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const topicId = parseInt(req.params.topicId);
      const topic = await tutoringStorage.getTopic(topicId);
      if (!topic) return res.status(404).json({ error: "Topic not found" });

      const topicLessons = await tutoringStorage.getLessonsByTopic(topicId);
      const lessonsWithSegments = await Promise.all(
        topicLessons.map(async (lesson) => {
          const segments = await tutoringStorage.getLessonSegments(lesson.id);
          const questions = await tutoringStorage.getQuizQuestionsByLesson(lesson.id);
          return { ...lesson, segments, questions };
        })
      );

      const topicQuestions = await tutoringStorage.getQuizQuestionsByTopic(topicId);
      const exitTicketQuestions = topicQuestions.filter((q) => q.lessonId === null);

      res.json({
        topic,
        lessons: lessonsWithSegments,
        exitTicketQuestions,
      });
    } catch (error) {
      console.error("Error fetching topic content:", error);
      res.status(500).json({ error: "Failed to fetch topic content" });
    }
  });

  app.get("/api/topics/:topicId/session-questions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const topicId = parseInt(req.params.topicId);
      const allQuestions = await tutoringStorage.getQuizQuestionsByTopic(topicId);

      const topic = await tutoringStorage.getTopic(topicId);
      const topicName = topic?.title || "";
      const topicSlug = topicName.toLowerCase().replace(/\s+/g, "_");

      const previousIds: string[] = [];
      const previousSourceIds = new Set<number>();
      try {
        const allAttempts = await tutoringStorage.getSessionAttemptsByStudent(profile.id);
        const topicAttempts = allAttempts.filter(a => a.topicName === topicName && a.endedAt);
        for (const topicAttempt of topicAttempts.slice(0, 3)) {
          for (const field of ["warmupResults", "exitTicketResults", "practiceResults"] as const) {
            const raw = (topicAttempt as any)[field];
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                (parsed.questions || []).forEach((q: any) => {
                  previousIds.push(String(q.id));
                  if (q.sourceQuestionId) previousSourceIds.add(q.sourceQuestionId);
                  if (typeof q.id === "number") previousSourceIds.add(q.id);
                });
              } catch {}
            }
          }
        }
      } catch {}

      const prevSet = new Set(previousIds);

      const shuffle = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const pickRandom = <T extends { id: number }>(pool: T[], count: number, exclude: Set<string>): T[] => {
        const preferred = pool.filter(q => !exclude.has(String(q.id)));
        const source = preferred.length >= count ? preferred : pool;
        return shuffle(source).slice(0, count);
      };

      const topicLevel = allQuestions.filter(q => q.lessonId === null);
      const diff1 = topicLevel.filter(q => q.difficulty === 1);
      const diff2 = topicLevel.filter(q => q.difficulty === 2);
      const diff3 = topicLevel.filter(q => q.difficulty === 3);
      const diff4 = topicLevel.filter(q => q.difficulty >= 4);
      const lessonDiff1 = allQuestions.filter(q => q.lessonId !== null && q.difficulty <= 1);
      const allDiff1 = [...diff1, ...lessonDiff1];

      const warmupCount = Math.min(3, Math.max(2, allDiff1.length));
      const warmupQuestions = pickRandom(allDiff1, warmupCount, prevSet);

      const usedInWarmup = new Set(warmupQuestions.map(q => String(q.id)));
      const exitExclude = new Set([...Array.from(prevSet), ...Array.from(usedInWarmup)]);

      const anyPool = topicLevel.length > 0 ? topicLevel : allQuestions;

      const exit1 = pickRandom(diff2.length > 0 ? diff2 : anyPool, 1, exitExclude);
      exit1.forEach(q => exitExclude.add(String(q.id)));
      const exit2 = pickRandom(diff3.length > 0 ? diff3 : anyPool, 1, exitExclude);
      exit2.forEach(q => exitExclude.add(String(q.id)));

      const wordProblems = diff4.filter(q => q.questionText.length > 60);
      let exit3: typeof allQuestions = [];
      if (wordProblems.length > 0) {
        exit3 = pickRandom(wordProblems, 1, exitExclude);
      } else {
        const fallbackPool = diff2.length > 1 ? diff2 : (diff3.length > 0 ? diff3 : anyPool);
        exit3 = pickRandom(fallbackPool, 1, exitExclude);
      }
      exit3.forEach(q => exitExclude.add(String(q.id)));

      let exit4: typeof allQuestions = [];
      const remaining = anyPool.filter(q => !exitExclude.has(String(q.id)));
      if (remaining.length > 0) {
        exit4 = pickRandom(remaining, 1, exitExclude);
      }

      const exitTicketQuestions = [...exit1, ...exit2, ...exit3, ...exit4];

      const practiceCanonical = pickRandom(
        allQuestions.filter(q => q.difficulty >= 2 && q.difficulty <= 3),
        3,
        exitExclude
      );

      let warmupVariants: VariantQuestion[] = [];
      let exitVariants: VariantQuestion[] = [];
      let practiceVariants: VariantQuestion[] = [];
      try {
        const [wv, ev, pv] = await Promise.all([
          generateVariantsForTopic({
            topicId,
            topicSlug,
            difficulty: 1,
            count: 2,
            sourceQuestions: allDiff1,
            excludeSourceIds: previousSourceIds,
          }),
          generateVariantsForTopic({
            topicId,
            topicSlug,
            difficulty: 3,
            count: 2,
            sourceQuestions: [...diff2, ...diff3],
            excludeSourceIds: previousSourceIds,
          }),
          generateVariantsForTopic({
            topicId,
            topicSlug,
            difficulty: 2,
            count: 2,
            sourceQuestions: [...diff2, ...diff3],
            excludeSourceIds: previousSourceIds,
          }),
        ]);
        warmupVariants = wv;
        exitVariants = ev;
        practiceVariants = pv;
      } catch (variantErr) {
        console.error("[session-questions] Variant generation failed, using canonical only:", variantErr);
      }

      let engineWarmup: any[] = [];
      let engineExit: any[] = [];
      const engineFn = getGenerator(topicSlug);
      if (engineFn) {
        try {
          const seed = Date.now();
          const warmupGen = engineFn([{ difficulty: "easy", count: 2 }, { difficulty: "medium", count: 2 }], seed);
          engineWarmup = warmupGen.map(g => ({
            id: g.id,
            questionText: g.prompt,
            questionType: "short_answer",
            options: null,
            correctAnswer: g.answer,
            explanation: g.worked_solution.join(" "),
            difficulty: g.difficulty === "easy" ? 1 : g.difficulty === "medium" ? 2 : g.difficulty === "hard" ? 3 : 4,
            points: g.difficulty === "easy" ? 1 : g.difficulty === "medium" ? 2 : g.difficulty === "hard" ? 3 : 4,
            isVariant: true,
            sourceQuestionId: null,
            topicId,
            subjectId: null,
            lessonId: null,
          }));
          const exitGen = engineFn([{ difficulty: "medium", count: 1 }, { difficulty: "hard", count: 1 }], seed + 1);
          engineExit = exitGen.map(g => ({
            id: g.id,
            questionText: g.prompt,
            questionType: "short_answer",
            options: null,
            correctAnswer: g.answer,
            explanation: g.worked_solution.join(" "),
            difficulty: g.difficulty === "easy" ? 1 : g.difficulty === "medium" ? 2 : g.difficulty === "hard" ? 3 : 4,
            points: g.difficulty === "easy" ? 1 : g.difficulty === "medium" ? 2 : g.difficulty === "hard" ? 3 : 4,
            isVariant: true,
            sourceQuestionId: null,
            topicId,
            subjectId: null,
            lessonId: null,
          }));
        } catch (engineErr) {
          console.error("[session-questions] Question engine failed:", engineErr);
        }
      }

      const finalWarmup = shuffle([...warmupQuestions, ...warmupVariants, ...engineWarmup]);
      const finalExit = shuffle([...exitTicketQuestions, ...exitVariants, ...engineExit]);
      const finalPractice = shuffle([...practiceCanonical, ...practiceVariants]);

      console.log(
        `[session-questions] topicId=${topicId} slug=${topicSlug} | warmup=${warmupQuestions.length}+${warmupVariants.length}v+${engineWarmup.length}e exit=${exitTicketQuestions.length}+${exitVariants.length}v+${engineExit.length}e practice=${practiceCanonical.length}+${practiceVariants.length}v`
      );

      res.json({
        warmupQuestions: finalWarmup,
        exitTicketQuestions: finalExit,
        practiceQuestions: finalPractice,
      });
    } catch (error) {
      console.error("Error fetching session questions:", error);
      res.status(500).json({ error: "Failed to fetch session questions" });
    }
  });

  app.get("/api/question-engine/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const difficulty = req.query.difficulty as string;
      const n = parseInt(req.query.n as string) || 4;
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;

      const validDiffs = ["easy", "medium", "hard", "challenge"] as const;
      if (difficulty && !validDiffs.includes(difficulty as any)) {
        return res.status(400).json({ error: "Invalid difficulty. Must be: easy, medium, hard, challenge" });
      }

      if (difficulty) {
        const questions = generatePool(difficulty as any, Math.min(n, 20), seed, true);
        return res.json({ questions, count: questions.length, difficulty, seed });
      }

      const config = JSON.parse((req.query.config as string) || '[{"difficulty":"easy","count":2},{"difficulty":"medium","count":2}]');
      const questions = generateMixedPool(config, seed);
      res.json({ questions, count: questions.length, seed });
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  app.get("/api/question-engine/warmup", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const topicParam = req.query.topic as string;
      if (!topicParam) {
        return res.status(400).json({ error: "Missing required query parameter: topic" });
      }
      const generator = getGenerator(topicParam);
      if (!generator) {
        return res.status(400).json({ error: `No generator found for topic: ${topicParam}` });
      }
      const questions = generator([
        { difficulty: "easy", count: 2 },
        { difficulty: "medium", count: 2 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "warmup", topic: topicParam });
    } catch (error) {
      console.error("Error generating warmup:", error);
      res.status(500).json({ error: "Failed to generate warmup questions" });
    }
  });

  app.get("/api/question-engine/exit-ticket", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const topicParam = req.query.topic as string;
      if (!topicParam) {
        return res.status(400).json({ error: "Missing required query parameter: topic" });
      }
      const generator = getGenerator(topicParam);
      if (!generator) {
        return res.status(400).json({ error: `No generator found for topic: ${topicParam}` });
      }
      const questions = generator([
        { difficulty: "medium", count: 1 },
        { difficulty: "hard", count: 1 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "exit_ticket", topic: topicParam });
    } catch (error) {
      console.error("Error generating exit ticket:", error);
      res.status(500).json({ error: "Failed to generate exit ticket questions" });
    }
  });

  app.get("/api/question-engine/inequalities/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const difficulty = req.query.difficulty as string;
      const n = parseInt(req.query.n as string) || 4;
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;

      const validDiffs = ["easy", "medium", "hard", "challenge"] as const;
      if (difficulty && !validDiffs.includes(difficulty as any)) {
        return res.status(400).json({ error: "Invalid difficulty. Must be: easy, medium, hard, challenge" });
      }

      if (difficulty) {
        const questions = generateIneqPool(difficulty as any, Math.min(n, 20), seed, true);
        return res.json({ questions, count: questions.length, difficulty, seed });
      }

      const config = JSON.parse((req.query.config as string) || '[{"difficulty":"easy","count":2},{"difficulty":"medium","count":2}]');
      const questions = generateIneqMixedPool(config, seed);
      res.json({ questions, count: questions.length, seed });
    } catch (error) {
      console.error("Error generating inequalities questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  app.get("/api/question-engine/inequalities/warmup", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const questions = generateIneqMixedPool([
        { difficulty: "easy", count: 3 },
        { difficulty: "medium", count: 3 },
        { difficulty: "hard", count: 2 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "warmup" });
    } catch (error) {
      console.error("Error generating inequalities warmup:", error);
      res.status(500).json({ error: "Failed to generate warmup questions" });
    }
  });

  app.get("/api/question-engine/inequalities/exit-ticket", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const questions = generateIneqMixedPool([
        { difficulty: "medium", count: 1 },
        { difficulty: "hard", count: 1 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "exit_ticket" });
    } catch (error) {
      console.error("Error generating inequalities exit ticket:", error);
      res.status(500).json({ error: "Failed to generate exit ticket questions" });
    }
  });

  app.get("/api/question-engine/fractional-indices/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const difficulty = req.query.difficulty as string;
      const n = parseInt(req.query.n as string) || 4;
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;

      const validDiffs = ["easy", "medium", "hard", "challenge"] as const;
      if (difficulty && !validDiffs.includes(difficulty as any)) {
        return res.status(400).json({ error: "Invalid difficulty. Must be: easy, medium, hard, challenge" });
      }

      if (difficulty) {
        const questions = generateFracIdxPool(difficulty as any, Math.min(n, 20), seed, true);
        return res.json({ questions, count: questions.length, difficulty, seed });
      }

      const config = JSON.parse((req.query.config as string) || '[{"difficulty":"easy","count":2},{"difficulty":"medium","count":2}]');
      const questions = generateFracIdxMixedPool(config, seed);
      res.json({ questions, count: questions.length, seed });
    } catch (error) {
      console.error("Error generating fractional indices questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  app.get("/api/question-engine/fractional-indices/warmup", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const questions = generateFracIdxMixedPool([
        { difficulty: "easy", count: 3 },
        { difficulty: "medium", count: 3 },
        { difficulty: "hard", count: 2 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "warmup" });
    } catch (error) {
      console.error("Error generating fractional indices warmup:", error);
      res.status(500).json({ error: "Failed to generate warmup questions" });
    }
  });

  app.get("/api/question-engine/fractional-indices/exit-ticket", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const questions = generateFracIdxMixedPool([
        { difficulty: "medium", count: 1 },
        { difficulty: "hard", count: 1 },
      ], seed);

      res.json({ questions, count: questions.length, seed, type: "exit_ticket" });
    } catch (error) {
      console.error("Error generating fractional indices exit ticket:", error);
      res.status(500).json({ error: "Failed to generate exit ticket questions" });
    }
  });

  app.get("/api/question-engine/surds-intro/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const difficulty = req.query.difficulty as string;
      const n = parseInt(req.query.n as string) || 4;
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;

      const validDiffs = ["easy", "medium", "hard", "challenge"] as const;
      if (difficulty && !validDiffs.includes(difficulty as any)) {
        return res.status(400).json({ error: "Invalid difficulty. Must be: easy, medium, hard, challenge" });
      }

      if (difficulty) {
        const questions = generateSurdsPool(difficulty as any, Math.min(n, 20), seed, true);
        return res.json({ questions, count: questions.length, difficulty, seed });
      }

      const config = JSON.parse((req.query.config as string) || '[{"difficulty":"easy","count":2},{"difficulty":"medium","count":2}]');
      const questions = generateSurdsMixedPool(config, seed);
      res.json({ questions, count: questions.length, seed });
    } catch (error) {
      console.error("Error generating surds intro questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  app.get("/api/question-engine/simplifying-surds/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const difficulty = req.query.difficulty as string;
      const n = parseInt(req.query.n as string) || 4;
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;

      const validDiffs = ["easy", "medium", "hard", "challenge"] as const;
      if (difficulty && !validDiffs.includes(difficulty as any)) {
        return res.status(400).json({ error: "Invalid difficulty. Must be: easy, medium, hard, challenge" });
      }

      if (difficulty) {
        const questions = generateSimplSurdsPool(difficulty as any, Math.min(n, 20), seed, true);
        return res.json({ questions, count: questions.length, difficulty, seed });
      }

      const config = JSON.parse((req.query.config as string) || '[{"difficulty":"easy","count":2},{"difficulty":"medium","count":2}]');
      const questions = generateSimplSurdsMixedPool(config, seed);
      res.json({ questions, count: questions.length, seed });
    } catch (error) {
      console.error("Error generating simplifying surds questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // Get topics for a subject filtered by grade
  app.get("/api/topics/by-grade", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const grade = parseInt(req.query.grade as string) || 9;
      const subjectId = parseInt(req.query.subjectId as string) || 1;

      const allTopics = await tutoringStorage.getTopicsBySubject(subjectId);
      const gradeTopics = allTopics.filter(t => t.gradeLevel === grade);

      res.json({ topics: gradeTopics, grade, subjectId });
    } catch (error) {
      console.error("Error fetching topics by grade:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  // Practice questions by topic with optional difficulty filter
  app.get("/api/topics/:topicId/questions", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const topicId = parseInt(req.params.topicId);
      if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

      const allQuestions = await tutoringStorage.getQuizQuestionsByTopic(topicId);
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : null;
      const filtered = difficulty ? allQuestions.filter(q => q.difficulty === difficulty) : allQuestions;

      const distribution: Record<number, number> = {};
      for (const q of allQuestions) {
        distribution[q.difficulty] = (distribution[q.difficulty] || 0) + 1;
      }

      res.json({ questions: filtered, total: allQuestions.length, distribution });
    } catch (error) {
      console.error("Error fetching practice questions:", error);
      res.status(500).json({ error: "Failed to fetch practice questions" });
    }
  });

  // Topic Notes
  app.get("/api/topics/:topicId/notes", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const topicId = parseInt(req.params.topicId);
      if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });
      const notes = await tutoringStorage.getTopicNotes(topicId);
      res.json(notes || null);
    } catch (error) {
      console.error("Error fetching topic notes:", error);
      res.status(500).json({ error: "Failed to fetch topic notes" });
    }
  });

  app.post("/api/topics/:topicId/notes", requireAdminRole, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

      const topic = await tutoringStorage.getTopic(topicId);
      if (!topic) return res.status(404).json({ error: "Topic not found" });

      const { summary, notesMarkdown } = req.body;
      if (!summary || typeof summary !== "string") return res.status(400).json({ error: "summary is required" });
      if (!notesMarkdown || typeof notesMarkdown !== "string") return res.status(400).json({ error: "notesMarkdown is required" });

      const notes = await tutoringStorage.upsertTopicNotes({
        topicId,
        summary,
        notesMarkdown,
        keyFormulas: Array.isArray(req.body.keyFormulas) ? req.body.keyFormulas : null,
        commonMistakes: Array.isArray(req.body.commonMistakes) ? req.body.commonMistakes : null,
      });
      res.json(notes);
    } catch (error) {
      console.error("Error upserting topic notes:", error);
      res.status(500).json({ error: "Failed to save topic notes" });
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

  // Get active subjects with student's teaching plan status
  app.get("/api/student/subjects", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const allSubjects = await tutoringStorage.getAllSubjects();
      const plans = await tutoringStorage.getTeachingPlansByStudent(profile.id);

      const subjectsWithPlans = allSubjects.map((s) => {
        const plan = plans.find((p) => p.subjectId === s.id);
        return {
          ...s,
          hasTeachingPlan: !!plan,
          teachingPlanId: plan?.id ?? null,
          currentTopicId: plan?.currentTopicId ?? null,
        };
      });

      res.json({ subjects: subjectsWithPlans, grade: profile.grade });
    } catch (error) {
      console.error("Error fetching student subjects:", error);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  // Get or create teaching plan for a subject, return curriculum
  app.get("/api/student/course/:subjectId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const profile = await tutoringStorage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const subjectId = parseInt(req.params.subjectId);
      const subject = await tutoringStorage.getSubject(subjectId);
      if (!subject) return res.status(404).json({ error: "Subject not found" });

      const grade = profile.grade || 7;

      const plans = await tutoringStorage.getTeachingPlansByStudent(profile.id);
      let plan = plans.find((p) => p.subjectId === subjectId);

      if (!plan) {
        const topics = await tutoringStorage.getTopicsBySubject(subjectId);
        const gradeTopic = topics.find((t) => t.gradeLevel === grade) || topics[0];
        plan = await tutoringStorage.createTeachingPlan({
          studentId: profile.id,
          subjectId,
          currentTopicId: gradeTopic?.id ?? null,
          targetGrade: grade,
          status: "active",
        });
      }

      const { getCurriculum } = await import("@shared/curriculum");
      const subjectNameLower = subject.name.toLowerCase();
      const subjectSlug = (subjectNameLower.includes("math") ? "mathematics" : "english") as "mathematics" | "english";
      const clampedGrade = Math.min(Math.max(grade, 6), 12);
      const yearLevel = clampedGrade as 6 | 7 | 8 | 9 | 10 | 11 | 12;
      let curriculum = null;
      try {
        curriculum = getCurriculum(subjectSlug, yearLevel);
      } catch {
        // curriculum not available for this combination
      }

      const allTopics = await tutoringStorage.getTopicsBySubject(subjectId);
      const gradeTopics = allTopics.filter((t) => t.gradeLevel === yearLevel);
      const dbTopicsWithLessons = await Promise.all(
        gradeTopics.map(async (t) => {
          const topicLessons = await tutoringStorage.getLessonsByTopic(t.id);
          return { ...t, lessonCount: topicLessons.length };
        })
      );

      res.json({ subject, plan, curriculum, grade: yearLevel, dbTopics: dbTopicsWithLessons });
    } catch (error) {
      console.error("Error fetching student course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
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
