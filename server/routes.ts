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

  return httpServer;
}
