import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Auth models
export * from "./models/auth";
export * from "./models/chat";

// Student profiles with role information
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("student"), // student, parent, teacher, owner
  grade: integer("grade"), // 9, 10, 11, 12
  parentEmail: text("parent_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tutoring sessions
export const tutoringSessions = pgTable("tutoring_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(), // e.g., "Linear Equations", "Quadratic Functions"
  status: text("status").notNull().default("active"), // active, completed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  transcript: text("transcript"),
  problemsSolved: integer("problems_solved").default(0),
});

// Progress tracking for each topic
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  masteryLevel: integer("mastery_level").notNull().default(0), // 0-100
  problemsAttempted: integer("problems_attempted").default(0),
  problemsCorrect: integer("problems_correct").default(0),
  lastPracticed: timestamp("last_practiced").defaultNow(),
});

// Session messages for tutoring conversations
export const sessionMessages = pgTable("session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => tutoringSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  audioData: text("audio_data"), // base64 encoded audio if voice interaction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parent reports
export const parentReports = pgTable("parent_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull().default("session_summary"), // session_summary, weekly_progress
  content: text("content").notNull(),
  videoUrl: text("video_url"), // URL to generated video report
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Live human tutor requests
export const humanTutorRequests = pgTable("human_tutor_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").references(() => tutoringSessions.id),
  topic: text("topic").notNull(),
  reason: text("reason").notNull(), // Why the student needs human help
  urgency: text("urgency").notNull().default("normal"), // normal, urgent
  status: text("status").notNull().default("pending"), // pending, assigned, completed, cancelled
  assignedTutorId: integer("assigned_tutor_id").references(() => profiles.id),
  scheduledTime: timestamp("scheduled_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Zod schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTutoringSessionSchema = createInsertSchema(tutoringSessions).omit({ id: true, startedAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true });
export const insertSessionMessageSchema = createInsertSchema(sessionMessages).omit({ id: true, createdAt: true });
export const insertParentReportSchema = createInsertSchema(parentReports).omit({ id: true, sentAt: true });
export const insertHumanTutorRequestSchema = createInsertSchema(humanTutorRequests).omit({ id: true, createdAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type TutoringSession = typeof tutoringSessions.$inferSelect;
export type InsertTutoringSession = z.infer<typeof insertTutoringSessionSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
export type ParentReport = typeof parentReports.$inferSelect;
export type InsertParentReport = z.infer<typeof insertParentReportSchema>;
export type HumanTutorRequest = typeof humanTutorRequests.$inferSelect;
export type InsertHumanTutorRequest = z.infer<typeof insertHumanTutorRequestSchema>;

// Re-export from auth
import { users } from "./models/auth";
