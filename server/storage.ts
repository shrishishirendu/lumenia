import { 
  profiles, 
  tutoringSessions, 
  progress, 
  sessionMessages, 
  parentReports,
  type Profile,
  type InsertProfile,
  type TutoringSession,
  type InsertTutoringSession,
  type Progress,
  type InsertProgress,
  type SessionMessage,
  type InsertSessionMessage,
  type ParentReport,
  type InsertParentReport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
      .where(eq(progress.studentId, progressData.studentId))
      .where(eq(progress.topic, progressData.topic));

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
}

export const tutoringStorage = new TutoringStorage();
