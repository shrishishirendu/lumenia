import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Auth models
export * from "./models/auth";
export * from "./models/chat";

// Subjects (Math, English, Science, etc.)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Mathematics", "English"
  description: text("description"),
  icon: text("icon"), // emoji or icon name
  teacherName: text("teacher_name"), // "Ms. Eleanor Chen", "Mr. James Mitchell"
  teacherVoice: text("teacher_voice"), // TTS voice identifier
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Topics within each subject
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // "Linear Equations", "Essay Writing"
  description: text("description"),
  gradeLevel: integer("grade_level").notNull(), // 6-12
  orderIndex: integer("order_index").notNull().default(0), // Order within grade
  prerequisiteTopicId: integer("prerequisite_topic_id"), // Previous topic that should be mastered
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  subject: text("subject").notNull().default("math"), // math, english
  topic: text("topic").notNull(), // e.g., "Linear Equations", "Essay Writing"
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
  subject: text("subject").notNull().default("math"), // math, english
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

// Teaching plans - personalized learning path for each student per subject
export const teachingPlans = pgTable("teaching_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  currentTopicId: integer("current_topic_id").references(() => topics.id),
  targetGrade: integer("target_grade"), // Target year level
  status: text("status").notNull().default("active"), // active, completed, paused
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at"),
});

// Tutor profiles - extended info for human tutors
export const tutorProfiles = pgTable("tutor_profiles", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  bio: text("bio"),
  qualifications: text("qualifications"),
  subjectExpertise: text("subject_expertise").array(), // Array of subject names
  hourlyRate: integer("hourly_rate"), // In cents
  availability: text("availability"), // JSON string of available times
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tutor assignments - which tutor is assigned to which student
export const tutorAssignments = pgTable("tutor_assignments", {
  id: serial("id").primaryKey(),
  tutorProfileId: integer("tutor_profile_id").notNull().references(() => tutorProfiles.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id),
  status: text("status").notNull().default("active"), // active, ended
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  notes: text("notes"),
});

// Parent-student relationships
export const parentStudentLinks = pgTable("parent_student_links", {
  id: serial("id").primaryKey(),
  parentProfileId: integer("parent_profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  studentProfileId: integer("student_profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull().default("parent"), // parent, guardian
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments - bookings between parents/students and tutors/admin
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  requestorId: integer("requestor_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), // Parent or student
  tutorProfileId: integer("tutor_profile_id").references(() => tutorProfiles.id), // Null if with admin
  studentId: integer("student_id").references(() => profiles.id), // The student being discussed
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  type: text("type").notNull().default("consultation"), // consultation, review, emergency
  notes: text("notes"),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support tickets - questions from parents to admin
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  submitterId: integer("submitter_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => profiles.id), // Related student if applicable
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  assignedToId: integer("assigned_to_id").references(() => profiles.id), // Admin or tutor handling it
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Activity logs for admin monitoring
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(), // login, session_start, session_end, quiz_taken, etc.
  entityType: text("entity_type"), // session, quiz, appointment, etc.
  entityId: integer("entity_id"),
  metadata: text("metadata"), // JSON additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lessons - structured content within each topic
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").default(30),
  objectives: text("objectives").array(), // Learning objectives
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lesson segments - individual teaching steps within a lesson
export const lessonSegments = pgTable("lesson_segments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("explanation"), // explanation, example, practice, summary
  content: text("content").notNull(), // Main content text
  whiteboardContent: text("whiteboard_content"), // JSON for whiteboard display
  tutorScript: text("tutor_script"), // What the AI tutor says
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz questions - can be for lessons or pre-session reviews
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, short_answer, true_false
  options: text("options").array(), // For multiple choice
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"), // Why the answer is correct
  difficulty: integer("difficulty").notNull().default(1), // 1-5
  points: integer("points").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student quiz attempts and answers
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  quizType: text("quiz_type").notNull().default("lesson"), // lesson, pre_session, topic_review
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  totalPoints: integer("total_points"),
  passed: boolean("passed"),
});

// Individual answers within a quiz attempt
export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  studentAnswer: text("student_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student lesson progress - tracks which segments they've completed
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  currentSegmentId: integer("current_segment_id").references(() => lessonSegments.id),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
});

// Zod schemas - Original
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTutoringSessionSchema = createInsertSchema(tutoringSessions).omit({ id: true, startedAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true });
export const insertSessionMessageSchema = createInsertSchema(sessionMessages).omit({ id: true, createdAt: true });
export const insertParentReportSchema = createInsertSchema(parentReports).omit({ id: true, sentAt: true });
export const insertHumanTutorRequestSchema = createInsertSchema(humanTutorRequests).omit({ id: true, createdAt: true });

// Zod schemas - New entities
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true });
export const insertTeachingPlanSchema = createInsertSchema(teachingPlans).omit({ id: true, startedAt: true });
export const insertTutorProfileSchema = createInsertSchema(tutorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTutorAssignmentSchema = createInsertSchema(tutorAssignments).omit({ id: true, assignedAt: true });
export const insertParentStudentLinkSchema = createInsertSchema(parentStudentLinks).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

// Zod schemas - Lessons and quizzes
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertLessonSegmentSchema = createInsertSchema(lessonSegments).omit({ id: true, createdAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, startedAt: true });
export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({ id: true, createdAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true });

// Types - Original
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

// Types - New entities
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type TeachingPlan = typeof teachingPlans.$inferSelect;
export type InsertTeachingPlan = z.infer<typeof insertTeachingPlanSchema>;
export type TutorProfile = typeof tutorProfiles.$inferSelect;
export type InsertTutorProfile = z.infer<typeof insertTutorProfileSchema>;
export type TutorAssignment = typeof tutorAssignments.$inferSelect;
export type InsertTutorAssignment = z.infer<typeof insertTutorAssignmentSchema>;
export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;
export type InsertParentStudentLink = z.infer<typeof insertParentStudentLinkSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Types - Lessons and quizzes
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type LessonSegment = typeof lessonSegments.$inferSelect;
export type InsertLessonSegment = z.infer<typeof insertLessonSegmentSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;

// Re-export from auth
import { users } from "./models/auth";
