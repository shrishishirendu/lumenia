import { 
  profiles, 
  tutoringSessions, 
  progress, 
  sessionMessages, 
  parentReports,
  humanTutorRequests,
  type Profile,
  type InsertProfile,
  type TutoringSession,
  type InsertTutoringSession,
  type Progress,
  type InsertProgress,
  type SessionMessage,
  type InsertSessionMessage,
  type ParentReport,
  type InsertParentReport,
  type HumanTutorRequest,
  type InsertHumanTutorRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface ITutoringStorage {
  // Profiles
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  
  // Sessions
  createSession(session: InsertTutoringSession): Promise<TutoringSession>;
  getSession(id: number): Promise<TutoringSession | undefined>;
  completeSession(id: number, transcript: string): Promise<void>;
  
  // Messages
  createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage>;
  getSessionMessages(sessionId: number): Promise<SessionMessage[]>;
  
  // Progress
  getProgressByStudent(studentId: number): Promise<Progress[]>;
  updateProgress(progress: InsertProgress): Promise<Progress>;
  
  // Reports
  createParentReport(report: InsertParentReport): Promise<ParentReport>;
  getReportsByStudent(studentId: number): Promise<ParentReport[]>;
  
  // Human Tutor Requests
  createHumanTutorRequest(request: InsertHumanTutorRequest): Promise<HumanTutorRequest>;
  getHumanTutorRequestsByStudent(studentId: number): Promise<HumanTutorRequest[]>;
  getPendingHumanTutorRequests(): Promise<HumanTutorRequest[]>;
  updateHumanTutorRequest(id: number, updates: Partial<HumanTutorRequest>): Promise<HumanTutorRequest>;
}

class TutoringStorage implements ITutoringStorage {
  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }

  async createSession(sessionData: InsertTutoringSession): Promise<TutoringSession> {
    const [session] = await db.insert(tutoringSessions).values(sessionData).returning();
    return session;
  }

  async getSession(id: number): Promise<TutoringSession | undefined> {
    const [session] = await db.select().from(tutoringSessions).where(eq(tutoringSessions.id, id));
    return session;
  }

  async completeSession(id: number, transcript: string): Promise<void> {
    await db.update(tutoringSessions)
      .set({ status: "completed", completedAt: new Date(), transcript })
      .where(eq(tutoringSessions.id, id));
  }

  async createSessionMessage(messageData: InsertSessionMessage): Promise<SessionMessage> {
    const [message] = await db.insert(sessionMessages).values(messageData).returning();
    return message;
  }

  async getSessionMessages(sessionId: number): Promise<SessionMessage[]> {
    return db.select().from(sessionMessages).where(eq(sessionMessages.sessionId, sessionId)).orderBy(sessionMessages.createdAt);
  }

  async getProgressByStudent(studentId: number): Promise<Progress[]> {
    return db.select().from(progress).where(eq(progress.studentId, studentId));
  }

  async updateProgress(progressData: InsertProgress): Promise<Progress> {
    const [existingProgress] = await db.select().from(progress)
      .where(and(eq(progress.studentId, progressData.studentId), eq(progress.topic, progressData.topic)));

    if (existingProgress) {
      const [updated] = await db.update(progress)
        .set({ ...progressData, lastPracticed: new Date() })
        .where(eq(progress.id, existingProgress.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(progress).values(progressData).returning();
      return created;
    }
  }

  async createParentReport(reportData: InsertParentReport): Promise<ParentReport> {
    const [report] = await db.insert(parentReports).values(reportData).returning();
    return report;
  }

  async getReportsByStudent(studentId: number): Promise<ParentReport[]> {
    return db.select().from(parentReports).where(eq(parentReports.studentId, studentId)).orderBy(desc(parentReports.sentAt));
  }

  async createHumanTutorRequest(requestData: InsertHumanTutorRequest): Promise<HumanTutorRequest> {
    const [request] = await db.insert(humanTutorRequests).values(requestData).returning();
    return request;
  }

  async getHumanTutorRequestsByStudent(studentId: number): Promise<HumanTutorRequest[]> {
    return db.select().from(humanTutorRequests).where(eq(humanTutorRequests.studentId, studentId)).orderBy(desc(humanTutorRequests.createdAt));
  }

  async getPendingHumanTutorRequests(): Promise<HumanTutorRequest[]> {
    return db.select().from(humanTutorRequests).where(eq(humanTutorRequests.status, "pending")).orderBy(desc(humanTutorRequests.createdAt));
  }

  async updateHumanTutorRequest(id: number, updates: Partial<HumanTutorRequest>): Promise<HumanTutorRequest> {
    const [updated] = await db.update(humanTutorRequests).set(updates).where(eq(humanTutorRequests.id, id)).returning();
    return updated;
  }
}

export const tutoringStorage = new TutoringStorage();
