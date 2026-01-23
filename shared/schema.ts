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

// ============================================
// STUDENT LEARNING LOOP MVP TABLES
// ============================================

// Topic Mastery - detailed mastery tracking per topic per student
export const topicMastery = pgTable("topic_mastery", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(), // "math" | "english"
  topicId: text("topic_id").notNull(), // e.g., "linear_equations", "reading_comprehension"
  topicName: text("topic_name").notNull(),
  masteryStatus: text("mastery_status").notNull().default("not_started"), // not_started, learning, practiced, mastered
  accuracyRolling: integer("accuracy_rolling").default(0), // Last 10 attempts percentage (0-100)
  hintsRolling: integer("hints_rolling").default(0), // Average hints used in last 10 attempts
  attemptsCount: integer("attempts_count").default(0),
  lastSeenAt: timestamp("last_seen_at"),
  mistakeTags: text("mistake_tags").array(), // Common mistake patterns
  confidence: integer("confidence").default(50), // 0-100 confidence score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session Attempt - structured session flow data
export const sessionAttempts = pgTable("session_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  topicId: text("topic_id").notNull(),
  topicName: text("topic_name").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  
  // Step results stored as JSON strings
  warmupResults: text("warmup_results"), // JSON: {questions, answers, score}
  lessonCompleted: boolean("lesson_completed").default(false),
  lessonExplanationStyle: text("lesson_explanation_style"), // step_by_step, visual, analogy, concise
  practiceResults: text("practice_results"), // JSON: {questions, answers, hintsUsed, difficulty}
  reflectionText: text("reflection_text"),
  exitTicketResults: text("exit_ticket_results"), // JSON: {questions, answers, passed}
  
  hintsUsed: integer("hints_used").default(0),
  timeSpentSec: integer("time_spent_sec").default(0),
  outcomeStatus: text("outcome_status").default("in_progress"), // in_progress, mastered, practicing, needs_help
  sessionSummary: text("session_summary"), // Generated summary text
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student Memory - personalization preferences
export const studentMemory = pgTable("student_memory", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  preferredExplanationStyle: text("preferred_explanation_style").default("step_by_step"), // step_by_step, visual, analogy, concise
  motivationPreference: text("motivation_preference").default("gentle"), // gentle, energetic
  lastSubject: text("last_subject"),
  lastTopicId: text("last_topic_id"),
  lastTopicName: text("last_topic_name"),
  lastMistakeTags: text("last_mistake_tags").array(),
  streakCount: integer("streak_count").default(0),
  lastActiveDate: timestamp("last_active_date"),
  dailyGoalMinutes: integer("daily_goal_minutes").default(15),
  todayMinutesCompleted: integer("today_minutes_completed").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas - Student Learning Loop
export const insertTopicMasterySchema = createInsertSchema(topicMastery).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionAttemptSchema = createInsertSchema(sessionAttempts).omit({ id: true, startedAt: true, createdAt: true });
export const insertStudentMemorySchema = createInsertSchema(studentMemory).omit({ id: true, createdAt: true, updatedAt: true });

// Types - Student Learning Loop
export type TopicMastery = typeof topicMastery.$inferSelect;
export type InsertTopicMastery = z.infer<typeof insertTopicMasterySchema>;
export type SessionAttempt = typeof sessionAttempts.$inferSelect;
export type InsertSessionAttempt = z.infer<typeof insertSessionAttemptSchema>;
export type StudentMemory = typeof studentMemory.$inferSelect;
export type InsertStudentMemory = z.infer<typeof insertStudentMemorySchema>;

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

// ════════════════════════════════════════════════════════════════
// GROWTH ENGINE - Single Source of Truth for Leads & Attribution
// ════════════════════════════════════════════════════════════════

// Lead Status Enum
export const leadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "ENGAGED",
  "CONVERTED",
  "DORMANT",
  "LOST"
]);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

// Lead Source Type Enum
export const leadSourceTypeEnum = z.enum([
  "landing_form",
  "referral",
  "social",
  "paid",
  "organic",
  "partner",
  "manual"
]);
export type LeadSourceType = z.infer<typeof leadSourceTypeEnum>;

// Lead Event Type Enum
export const leadEventTypeEnum = z.enum([
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "NOTE_ADDED",
  "CONTACT_ATTEMPT",
  "MESSAGE_SENT",
  "MEETING_BOOKED",
  "TRIAL_STARTED",
  "CONVERTED",
  "MARKED_DORMANT",
  "MARKED_LOST",
  "ASSIGNED"
]);
export type LeadEventType = z.infer<typeof leadEventTypeEnum>;

// Lead Actor Type
export const leadActorTypeEnum = z.enum(["human", "system", "agent"]);
export type LeadActorType = z.infer<typeof leadActorTypeEnum>;

// Leads table - Single Source of Truth
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  
  // Person info
  parentName: text("parent_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Student context
  childYearLevel: integer("child_year_level"),
  subjectsInterested: text("subjects_interested"), // JSON array as string: ["Math","English"]
  
  // Status & lifecycle
  status: text("status").notNull().default("NEW"), // LeadStatus
  
  // Owner/assignment
  assignedToUserId: text("assigned_to_user_id"),
  assignedAt: timestamp("assigned_at"),
  
  // Attribution
  sourceType: text("source_type").notNull().default("landing_form"), // LeadSourceType
  sourceName: text("source_name"), // e.g., "lumenia.au form", "Instagram"
  campaignId: integer("campaign_id"),
  medium: text("medium"),
  content: text("content"),
  referrerUrl: text("referrer_url"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  
  // Scoring
  leadScore: integer("lead_score").default(0),
  scoreReason: text("score_reason"),
  
  // Notes & timeline
  notes: text("notes"),
  message: text("message"), // Original message from form (backward compat)
  
  // Timestamps
  lastContactedAt: timestamp("last_contacted_at"),
  nextActionAt: timestamp("next_action_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lead Events - Activity Timeline
export const leadEvents = pgTable("lead_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // LeadEventType
  actor: text("actor").notNull().default("system"), // LeadActorType
  actorUserId: text("actor_user_id"), // If human, which user
  metadata: text("metadata"), // JSON string for additional data
  description: text("description"), // Human-readable description
});

// Campaigns - Attribution Catalog
export const growthCampaigns = pgTable("growth_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  channel: text("channel").notNull(), // "email"|"social"|"paid_search"|"paid_social"|"referral"|"partner"|"content"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budgetPlanned: integer("budget_planned"),
  status: text("status").notNull().default("draft"), // "draft"|"active"|"paused"|"ended"
  tags: text("tags"), // JSON array as string
  linkedMarketingAgentProposals: text("linked_proposals"), // JSON array of proposal IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Integration Configs - Stubs for CRM/Ad platforms
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "crm"|"meta_ads"|"google_ads"|"email_provider"
  name: text("name").notNull(), // Display name
  enabled: boolean("enabled").notNull().default(false),
  status: text("status").notNull().default("not_configured"), // "not_configured"|"configured"|"error"
  config: text("config"), // JSON (encrypted if secrets)
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Growth Metric Snapshots - Daily aggregates (optional for v0.1)
export const growthMetricSnapshots = pgTable("growth_metric_snapshots", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  leadsNew: integer("leads_new").default(0),
  leadsContacted: integer("leads_contacted").default(0),
  leadsEngaged: integer("leads_engaged").default(0),
  leadsConverted: integer("leads_converted").default(0),
  leadsDormant: integer("leads_dormant").default(0),
  leadsLost: integer("leads_lost").default(0),
  conversionRate: integer("conversion_rate"), // Percentage * 100
  acquisitionByChannel: text("acquisition_by_channel"), // JSON breakdown
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas and Types
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export const insertLeadEventSchema = createInsertSchema(leadEvents).omit({ id: true, timestamp: true });
export type LeadEvent = typeof leadEvents.$inferSelect;
export type InsertLeadEvent = z.infer<typeof insertLeadEventSchema>;

export const insertGrowthCampaignSchema = createInsertSchema(growthCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type GrowthCampaign = typeof growthCampaigns.$inferSelect;
export type InsertGrowthCampaign = z.infer<typeof insertGrowthCampaignSchema>;

export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;

export const insertGrowthMetricSnapshotSchema = createInsertSchema(growthMetricSnapshots).omit({ id: true, createdAt: true });
export type GrowthMetricSnapshot = typeof growthMetricSnapshots.$inferSelect;
export type InsertGrowthMetricSnapshot = z.infer<typeof insertGrowthMetricSnapshotSchema>;

// =========================================
// ADMISSIONS AGENT
// =========================================

// Admissions Assessment Status
export const admissionsStatusEnum = z.enum([
  "pending_review",
  "auto_qualified",
  "auto_rejected",
  "human_approved",
  "human_rejected",
  "nurturing"
]);
export type AdmissionsStatus = z.infer<typeof admissionsStatusEnum>;

// Expectation Alignment
export const expectationAlignmentEnum = z.enum(["aligned", "needs_discussion", "misaligned"]);
export type ExpectationAlignment = z.infer<typeof expectationAlignmentEnum>;

// Recommended Action
export const recommendedActionEnum = z.enum(["auto_enroll", "human_review", "nurture", "reject"]);
export type RecommendedAction = z.infer<typeof recommendedActionEnum>;

// Admissions Assessments table
export const admissionsAssessments = pgTable("admissions_assessments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  qualificationScore: integer("qualification_score").notNull().default(0), // 0-100
  fitScore: integer("fit_score").notNull().default(0), // 0-100
  expectationAlignment: text("expectation_alignment").notNull().default("needs_discussion"),
  recommendedAction: text("recommended_action").notNull().default("human_review"),
  reasoning: text("reasoning").notNull(),
  aiConfidence: integer("ai_confidence").notNull().default(50), // 0-100
  status: text("status").notNull().default("pending_review"),
  reviewerNotes: text("reviewer_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Admissions Settings table
export const admissionsSettings = pgTable("admissions_settings", {
  id: serial("id").primaryKey(),
  autonomyLevel: integer("autonomy_level").notNull().default(1), // 1-3
  autoQualifyThreshold: integer("auto_qualify_threshold").notNull().default(90), // confidence %
  autoRejectThreshold: integer("auto_reject_threshold").notNull().default(20), // fit score %
  minYearLevel: integer("min_year_level").notNull().default(6),
  maxYearLevel: integer("max_year_level").notNull().default(12),
  acceptedSubjects: text("accepted_subjects").notNull().default("Mathematics,English"),
  flagKeywords: text("flag_keywords").notNull().default("urgent,immediate,quick fix,2 weeks"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admissions Schemas and Types
export const insertAdmissionsAssessmentSchema = createInsertSchema(admissionsAssessments).omit({ 
  id: true, 
  assessedAt: true, 
  reviewedAt: true 
});
export type AdmissionsAssessment = typeof admissionsAssessments.$inferSelect;
export type InsertAdmissionsAssessment = z.infer<typeof insertAdmissionsAssessmentSchema>;

export const insertAdmissionsSettingsSchema = createInsertSchema(admissionsSettings).omit({ 
  id: true, 
  updatedAt: true 
});
export type AdmissionsSettings = typeof admissionsSettings.$inferSelect;
export type InsertAdmissionsSettings = z.infer<typeof insertAdmissionsSettingsSchema>;

// ============================================
// Academic Quality Agent
// ============================================

// Alert Types
export const academicAlertTypeEnum = z.enum([
  "low_mastery",
  "declining_progress",
  "low_engagement",
  "struggling_topic",
  "at_risk",
  "improvement_opportunity"
]);
export type AcademicAlertType = z.infer<typeof academicAlertTypeEnum>;

// Alert Severity
export const alertSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export type AlertSeverity = z.infer<typeof alertSeverityEnum>;

// Alert Status
export const academicAlertStatusEnum = z.enum([
  "active",
  "acknowledged",
  "in_progress",
  "resolved",
  "dismissed"
]);
export type AcademicAlertStatus = z.infer<typeof academicAlertStatusEnum>;

// Academic Alerts table
export const academicAlerts = pgTable("academic_alerts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // low_mastery, declining_progress, etc.
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  subject: text("subject"), // Mathematics, English
  topic: text("topic"), // Specific topic if applicable
  metric: text("metric").notNull(), // mastery_level, completion_rate, engagement_score
  currentValue: integer("current_value").notNull(), // Current metric value
  threshold: integer("threshold").notNull(), // Threshold that triggered alert
  trend: text("trend"), // declining, stagnant, improving
  recommendation: text("recommendation").notNull(), // AI-generated intervention recommendation
  reasoning: text("reasoning").notNull(), // AI explanation
  aiConfidence: integer("ai_confidence").notNull().default(50), // 0-100
  status: text("status").notNull().default("active"),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
});

// Academic Quality Settings table
export const academicQualitySettings = pgTable("academic_quality_settings", {
  id: serial("id").primaryKey(),
  autonomyLevel: integer("autonomy_level").notNull().default(1), // 1: monitor only, 2: alert + recommend, 3: auto-intervene
  masteryThreshold: integer("mastery_threshold").notNull().default(60), // Alert if below this
  engagementThreshold: integer("engagement_threshold").notNull().default(40), // Alert if below this
  progressDeclineThreshold: integer("progress_decline_threshold").notNull().default(15), // % decline to trigger alert
  inactivityDays: integer("inactivity_days").notNull().default(7), // Days without activity to flag
  autoNotifyParent: boolean("auto_notify_parent").notNull().default(false),
  autoNotifyTutor: boolean("auto_notify_tutor").notNull().default(true),
  scanFrequency: text("scan_frequency").notNull().default("daily"), // daily, weekly
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Academic Quality Schemas and Types
export const insertAcademicAlertSchema = createInsertSchema(academicAlerts).omit({ 
  id: true, 
  createdAt: true, 
  acknowledgedAt: true,
  resolvedAt: true 
});
export type AcademicAlert = typeof academicAlerts.$inferSelect;
export type InsertAcademicAlert = z.infer<typeof insertAcademicAlertSchema>;

export const insertAcademicQualitySettingsSchema = createInsertSchema(academicQualitySettings).omit({ 
  id: true, 
  updatedAt: true 
});
export type AcademicQualitySettings = typeof academicQualitySettings.$inferSelect;
export type InsertAcademicQualitySettings = z.infer<typeof insertAcademicQualitySettingsSchema>;

// Re-export from auth
import { users } from "./models/auth";
