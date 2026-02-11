import { 
  profiles, 
  tutoringSessions, 
  progress, 
  sessionMessages, 
  parentReports,
  humanTutorRequests,
  subjects,
  topics,
  teachingPlans,
  tutorProfiles,
  tutorAssignments,
  parentStudentLinks,
  appointments,
  supportTickets,
  activityLogs,
  lessons,
  lessonSegments,
  quizQuestions,
  quizAttempts,
  quizAnswers,
  lessonProgress,
  topicMastery,
  sessionAttempts,
  studentMemory,
  leads,
  leadEvents,
  growthCampaigns,
  integrationConfigs,
  growthMetricSnapshots,
  admissionsAssessments,
  admissionsSettings,
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
  type InsertHumanTutorRequest,
  type Subject,
  type InsertSubject,
  type Topic,
  type InsertTopic,
  type TeachingPlan,
  type InsertTeachingPlan,
  type TutorProfile,
  type InsertTutorProfile,
  type TutorAssignment,
  type InsertTutorAssignment,
  type ParentStudentLink,
  type InsertParentStudentLink,
  type Appointment,
  type InsertAppointment,
  type SupportTicket,
  type InsertSupportTicket,
  type ActivityLog,
  type InsertActivityLog,
  type Lesson,
  type InsertLesson,
  type LessonSegment,
  type InsertLessonSegment,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuizAnswer,
  type InsertQuizAnswer,
  type LessonProgress as LessonProgressType,
  type InsertLessonProgress,
  type TopicMastery,
  type InsertTopicMastery,
  type SessionAttempt,
  type InsertSessionAttempt,
  type StudentMemory,
  type InsertStudentMemory,
  type Lead,
  type InsertLead,
  type LeadEvent,
  type InsertLeadEvent,
  type GrowthCampaign,
  type InsertGrowthCampaign,
  type IntegrationConfig,
  type InsertIntegrationConfig,
  type GrowthMetricSnapshot,
  type InsertGrowthMetricSnapshot,
  type LeadStatus,
  type AdmissionsAssessment,
  type InsertAdmissionsAssessment,
  type AdmissionsSettings,
  type InsertAdmissionsSettings,
  type AdmissionsStatus,
  type AcademicAlert,
  type InsertAcademicAlert,
  type AcademicQualitySettings,
  type InsertAcademicQualitySettings,
  type AcademicAlertStatus,
  academicAlerts,
  academicQualitySettings,
  topicNotes,
  type TopicNotes,
  type InsertTopicNotes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface ITutoringStorage {
  // Profiles
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getProfileById(id: number): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  getProfilesByRole(role: string): Promise<Profile[]>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, updates: Partial<Profile>): Promise<Profile>;
  
  // Sessions
  createSession(session: InsertTutoringSession): Promise<TutoringSession>;
  getSession(id: number): Promise<TutoringSession | undefined>;
  getSessionsByStudent(studentId: number): Promise<TutoringSession[]>;
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
  
  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, updates: Partial<Subject>): Promise<Subject>;
  
  // Topics
  getTopicsBySubject(subjectId: number): Promise<Topic[]>;
  getTopicsByGrade(gradeLevel: number): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | undefined>;
  getTopicBySubjectAndGrade(subjectId: number, gradeLevel: number, title: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Teaching Plans
  getTeachingPlansByStudent(studentId: number): Promise<TeachingPlan[]>;
  getTeachingPlan(id: number): Promise<TeachingPlan | undefined>;
  createTeachingPlan(plan: InsertTeachingPlan): Promise<TeachingPlan>;
  updateTeachingPlan(id: number, updates: Partial<TeachingPlan>): Promise<TeachingPlan>;
  
  // Tutor Profiles
  getAllTutorProfiles(): Promise<TutorProfile[]>;
  getTutorProfile(id: number): Promise<TutorProfile | undefined>;
  getTutorProfileByProfileId(profileId: number): Promise<TutorProfile | undefined>;
  createTutorProfile(profile: InsertTutorProfile): Promise<TutorProfile>;
  updateTutorProfile(id: number, updates: Partial<TutorProfile>): Promise<TutorProfile>;
  
  // Tutor Assignments
  getTutorAssignmentsByTutor(tutorProfileId: number): Promise<TutorAssignment[]>;
  getTutorAssignmentsByStudent(studentId: number): Promise<TutorAssignment[]>;
  createTutorAssignment(assignment: InsertTutorAssignment): Promise<TutorAssignment>;
  updateTutorAssignment(id: number, updates: Partial<TutorAssignment>): Promise<TutorAssignment>;
  
  // Parent-Student Links
  getLinkedStudents(parentProfileId: number): Promise<ParentStudentLink[]>;
  getLinkedParents(studentProfileId: number): Promise<ParentStudentLink[]>;
  createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink>;
  
  // Appointments
  getAppointmentsByRequestor(requestorId: number): Promise<Appointment[]>;
  getAppointmentsByTutor(tutorProfileId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment>;
  
  // Support Tickets
  getSupportTicketsBySubmitter(submitterId: number): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  
  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByProfile(profileId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  
  // Lessons
  getLessonsByTopic(topicId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Lesson Segments
  getLessonSegments(lessonId: number): Promise<LessonSegment[]>;
  getLessonSegment(id: number): Promise<LessonSegment | undefined>;
  createLessonSegment(segment: InsertLessonSegment): Promise<LessonSegment>;
  
  // Quiz Questions
  getQuizQuestionsByLesson(lessonId: number): Promise<QuizQuestion[]>;
  getQuizQuestionsByTopic(topicId: number): Promise<QuizQuestion[]>;
  getQuizQuestion(id: number): Promise<QuizQuestion | undefined>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Topic Notes
  getTopicNotes(topicId: number): Promise<TopicNotes | undefined>;
  upsertTopicNotes(notes: InsertTopicNotes): Promise<TopicNotes>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: number): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByStudent(studentId: number): Promise<QuizAttempt[]>;
  getLatestQuizAttempt(studentId: number, lessonId: number, quizType: string): Promise<QuizAttempt | undefined>;
  completeQuizAttempt(id: number, score: number, totalPoints: number, passed: boolean): Promise<QuizAttempt>;
  
  // Quiz Answers
  createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  getQuizAnswersByAttempt(attemptId: number): Promise<QuizAnswer[]>;
  
  // Lesson Progress
  getLessonProgressByStudent(studentId: number): Promise<LessonProgressType[]>;
  getLessonProgress(studentId: number, lessonId: number): Promise<LessonProgressType | undefined>;
  createOrUpdateLessonProgress(progress: InsertLessonProgress): Promise<LessonProgressType>;
  
  // Topic Mastery (Learning Loop)
  getTopicMasteryByStudent(studentId: number): Promise<TopicMastery[]>;
  getTopicMastery(studentId: number, subject: string, topicId: string): Promise<TopicMastery | undefined>;
  upsertTopicMastery(mastery: InsertTopicMastery): Promise<TopicMastery>;
  getWeakestTopic(studentId: number, subject: string): Promise<TopicMastery | undefined>;
  
  // Session Attempts (Learning Loop)
  createSessionAttempt(attempt: InsertSessionAttempt): Promise<SessionAttempt>;
  getSessionAttempt(id: number): Promise<SessionAttempt | undefined>;
  getSessionAttemptsByStudent(studentId: number): Promise<SessionAttempt[]>;
  getLatestSessionAttempt(studentId: number): Promise<SessionAttempt | undefined>;
  getLatestSessionAttemptByTopic(studentId: number, topicId: string): Promise<SessionAttempt | undefined>;
  updateSessionAttempt(id: number, updates: Partial<SessionAttempt>): Promise<SessionAttempt>;
  
  // Student Memory (Learning Loop)
  getStudentMemory(studentId: number): Promise<StudentMemory | undefined>;
  upsertStudentMemory(memory: InsertStudentMemory): Promise<StudentMemory>;
  
  // ════════════════════════════════════════════════════════════════
  // GROWTH ENGINE - Single Source of Truth
  // ════════════════════════════════════════════════════════════════
  
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead>;
  getLead(id: number): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  getLeadsByStatus(status: LeadStatus): Promise<Lead[]>;
  getLeadsByFilter(filters: {
    status?: LeadStatus;
    sourceType?: string;
    yearLevel?: number;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }>;
  
  // Lead Events (Activity Timeline)
  addLeadEvent(event: InsertLeadEvent): Promise<LeadEvent>;
  getLeadEvents(leadId: number): Promise<LeadEvent[]>;
  
  // Growth Campaigns (Attribution)
  createGrowthCampaign(campaign: InsertGrowthCampaign): Promise<GrowthCampaign>;
  updateGrowthCampaign(id: number, updates: Partial<GrowthCampaign>): Promise<GrowthCampaign>;
  getGrowthCampaign(id: number): Promise<GrowthCampaign | undefined>;
  getAllGrowthCampaigns(): Promise<GrowthCampaign[]>;
  
  // Integration Configs
  getIntegrationConfigs(): Promise<IntegrationConfig[]>;
  updateIntegrationConfig(id: number, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig>;
  
  // Growth Metrics
  getGrowthMetrics(): Promise<{
    totalLeads: number;
    leadsByStatus: Record<string, number>;
    newLeads7d: number;
    newLeads30d: number;
    conversionRate: number;
    acquisitionByChannel: Record<string, number>;
  }>;

  // ════════════════════════════════════════════════════════════════
  // ADMISSIONS AGENT
  // ════════════════════════════════════════════════════════════════
  
  // Assessments
  createAdmissionsAssessment(assessment: InsertAdmissionsAssessment): Promise<AdmissionsAssessment>;
  updateAdmissionsAssessment(id: number, updates: Partial<AdmissionsAssessment>): Promise<AdmissionsAssessment>;
  getAdmissionsAssessment(id: number): Promise<AdmissionsAssessment | undefined>;
  getAdmissionsAssessmentByLead(leadId: number): Promise<AdmissionsAssessment | undefined>;
  getAdmissionsQueue(status?: AdmissionsStatus): Promise<AdmissionsAssessment[]>;
  getAllAdmissionsAssessments(): Promise<AdmissionsAssessment[]>;
  
  // Settings
  getAdmissionsSettings(): Promise<AdmissionsSettings | undefined>;
  upsertAdmissionsSettings(settings: InsertAdmissionsSettings): Promise<AdmissionsSettings>;
  
  // Stats
  getAdmissionsStats(): Promise<{
    totalAssessments: number;
    pendingReview: number;
    autoQualified: number;
    autoRejected: number;
    humanApproved: number;
    humanRejected: number;
    nurturing: number;
    todayAssessments: number;
    avgConfidence: number;
  }>;

  // ════════════════════════════════════════════════════════════════
  // ACADEMIC QUALITY AGENT
  // ════════════════════════════════════════════════════════════════
  
  // Alerts
  createAcademicAlert(alert: InsertAcademicAlert): Promise<AcademicAlert>;
  updateAcademicAlert(id: number, updates: Partial<AcademicAlert>): Promise<AcademicAlert>;
  getAcademicAlert(id: number): Promise<AcademicAlert | undefined>;
  getAcademicAlertsByStudent(studentId: number): Promise<AcademicAlert[]>;
  getAcademicAlertsByStatus(status: AcademicAlertStatus): Promise<AcademicAlert[]>;
  getAllAcademicAlerts(): Promise<AcademicAlert[]>;
  getActiveAcademicAlerts(): Promise<AcademicAlert[]>;
  
  // Settings
  getAcademicQualitySettings(): Promise<AcademicQualitySettings | undefined>;
  upsertAcademicQualitySettings(settings: InsertAcademicQualitySettings): Promise<AcademicQualitySettings>;
  
  // Stats
  getAcademicQualityStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    acknowledgedToday: number;
    resolvedToday: number;
    atRiskStudents: number;
    avgResolutionTime: number;
  }>;

  // Student analysis
  getStudentPerformanceMetrics(studentId: number): Promise<{
    avgMasteryLevel: number;
    completionRate: number;
    engagementScore: number;
    lastActivityDate: Date | null;
    subjectBreakdown: { subject: string; mastery: number; sessions: number }[];
  }>;
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

  // New Profile methods
  async getProfileById(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return db.select().from(profiles).orderBy(desc(profiles.createdAt));
  }

  async getProfilesByRole(role: string): Promise<Profile[]> {
    return db.select().from(profiles).where(eq(profiles.role, role)).orderBy(desc(profiles.createdAt));
  }

  async updateProfile(id: number, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db.update(profiles).set({ ...updates, updatedAt: new Date() }).where(eq(profiles.id, id)).returning();
    return updated;
  }

  // Sessions by student
  async getSessionsByStudent(studentId: number): Promise<TutoringSession[]> {
    return db.select().from(tutoringSessions).where(eq(tutoringSessions.studentId, studentId)).orderBy(desc(tutoringSessions.startedAt));
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.isActive, true)).orderBy(subjects.name);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(subjectData).returning();
    return subject;
  }

  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject> {
    const [updated] = await db.update(subjects).set(updates).where(eq(subjects.id, id)).returning();
    return updated;
  }

  // Topics
  async getTopicsBySubject(subjectId: number): Promise<Topic[]> {
    return db.select().from(topics).where(and(eq(topics.subjectId, subjectId), eq(topics.isActive, true))).orderBy(topics.gradeLevel, topics.orderIndex);
  }

  async getTopicsByGrade(gradeLevel: number): Promise<Topic[]> {
    return db.select().from(topics).where(and(eq(topics.gradeLevel, gradeLevel), eq(topics.isActive, true))).orderBy(topics.subjectId, topics.orderIndex);
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getTopicBySubjectAndGrade(subjectId: number, gradeLevel: number, title: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(
      and(
        eq(topics.subjectId, subjectId),
        eq(topics.gradeLevel, gradeLevel),
        eq(topics.title, title)
      )
    );
    return topic;
  }

  async createTopic(topicData: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(topicData).returning();
    return topic;
  }

  // Teaching Plans
  async getTeachingPlansByStudent(studentId: number): Promise<TeachingPlan[]> {
    return db.select().from(teachingPlans).where(eq(teachingPlans.studentId, studentId));
  }

  async getTeachingPlan(id: number): Promise<TeachingPlan | undefined> {
    const [plan] = await db.select().from(teachingPlans).where(eq(teachingPlans.id, id));
    return plan;
  }

  async createTeachingPlan(planData: InsertTeachingPlan): Promise<TeachingPlan> {
    const [plan] = await db.insert(teachingPlans).values(planData).returning();
    return plan;
  }

  async updateTeachingPlan(id: number, updates: Partial<TeachingPlan>): Promise<TeachingPlan> {
    const [updated] = await db.update(teachingPlans).set({ ...updates, lastActivityAt: new Date() }).where(eq(teachingPlans.id, id)).returning();
    return updated;
  }

  // Tutor Profiles
  async getAllTutorProfiles(): Promise<TutorProfile[]> {
    return db.select().from(tutorProfiles).orderBy(desc(tutorProfiles.createdAt));
  }

  async getTutorProfile(id: number): Promise<TutorProfile | undefined> {
    const [profile] = await db.select().from(tutorProfiles).where(eq(tutorProfiles.id, id));
    return profile;
  }

  async getTutorProfileByProfileId(profileId: number): Promise<TutorProfile | undefined> {
    const [profile] = await db.select().from(tutorProfiles).where(eq(tutorProfiles.profileId, profileId));
    return profile;
  }

  async createTutorProfile(profileData: InsertTutorProfile): Promise<TutorProfile> {
    const [profile] = await db.insert(tutorProfiles).values(profileData).returning();
    return profile;
  }

  async updateTutorProfile(id: number, updates: Partial<TutorProfile>): Promise<TutorProfile> {
    const [updated] = await db.update(tutorProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(tutorProfiles.id, id)).returning();
    return updated;
  }

  // Tutor Assignments
  async getTutorAssignmentsByTutor(tutorProfileId: number): Promise<TutorAssignment[]> {
    return db.select().from(tutorAssignments).where(eq(tutorAssignments.tutorProfileId, tutorProfileId)).orderBy(desc(tutorAssignments.assignedAt));
  }

  async getTutorAssignmentsByStudent(studentId: number): Promise<TutorAssignment[]> {
    return db.select().from(tutorAssignments).where(eq(tutorAssignments.studentId, studentId)).orderBy(desc(tutorAssignments.assignedAt));
  }

  async createTutorAssignment(assignmentData: InsertTutorAssignment): Promise<TutorAssignment> {
    const [assignment] = await db.insert(tutorAssignments).values(assignmentData).returning();
    return assignment;
  }

  async updateTutorAssignment(id: number, updates: Partial<TutorAssignment>): Promise<TutorAssignment> {
    const [updated] = await db.update(tutorAssignments).set(updates).where(eq(tutorAssignments.id, id)).returning();
    return updated;
  }

  // Parent-Student Links
  async getLinkedStudents(parentProfileId: number): Promise<ParentStudentLink[]> {
    return db.select().from(parentStudentLinks).where(eq(parentStudentLinks.parentProfileId, parentProfileId));
  }

  async getLinkedParents(studentProfileId: number): Promise<ParentStudentLink[]> {
    return db.select().from(parentStudentLinks).where(eq(parentStudentLinks.studentProfileId, studentProfileId));
  }

  async createParentStudentLink(linkData: InsertParentStudentLink): Promise<ParentStudentLink> {
    const [link] = await db.insert(parentStudentLinks).values(linkData).returning();
    return link;
  }

  // Appointments
  async getAppointmentsByRequestor(requestorId: number): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.requestorId, requestorId)).orderBy(desc(appointments.scheduledAt));
  }

  async getAppointmentsByTutor(tutorProfileId: number): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.tutorProfileId, tutorProfileId)).orderBy(desc(appointments.scheduledAt));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments).orderBy(desc(appointments.scheduledAt));
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment> {
    const [updated] = await db.update(appointments).set({ ...updates, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    return updated;
  }

  // Support Tickets
  async getSupportTicketsBySubmitter(submitterId: number): Promise<SupportTicket[]> {
    return db.select().from(supportTickets).where(eq(supportTickets.submitterId, submitterId)).orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values(ticketData).returning();
    return ticket;
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const [updated] = await db.update(supportTickets).set(updates).where(eq(supportTickets.id, id)).returning();
    return updated;
  }

  // Activity Logs
  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogsByProfile(profileId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.profileId, profileId)).orderBy(desc(activityLogs.createdAt));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }

  // Lessons
  async getLessonsByTopic(topicId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.topicId, topicId)).orderBy(lessons.orderIndex);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(lessonData).returning();
    return lesson;
  }

  // Lesson Segments
  async getLessonSegments(lessonId: number): Promise<LessonSegment[]> {
    return db.select().from(lessonSegments).where(eq(lessonSegments.lessonId, lessonId)).orderBy(lessonSegments.orderIndex);
  }

  async getLessonSegment(id: number): Promise<LessonSegment | undefined> {
    const [segment] = await db.select().from(lessonSegments).where(eq(lessonSegments.id, id));
    return segment;
  }

  async createLessonSegment(segmentData: InsertLessonSegment): Promise<LessonSegment> {
    const [segment] = await db.insert(lessonSegments).values(segmentData).returning();
    return segment;
  }

  // Quiz Questions
  async getQuizQuestionsByLesson(lessonId: number): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.lessonId, lessonId));
  }

  async getQuizQuestionsByTopic(topicId: number): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
  }

  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id));
    return question;
  }

  async createQuizQuestion(questionData: InsertQuizQuestion): Promise<QuizQuestion> {
    const [question] = await db.insert(quizQuestions).values(questionData).returning();
    return question;
  }

  // Topic Notes
  async getTopicNotes(topicId: number): Promise<TopicNotes | undefined> {
    const [notes] = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    return notes;
  }

  async upsertTopicNotes(notes: InsertTopicNotes): Promise<TopicNotes> {
    const existing = await this.getTopicNotes(notes.topicId);
    if (existing) {
      const [updated] = await db.update(topicNotes)
        .set({ ...notes, updatedAt: new Date() })
        .where(eq(topicNotes.topicId, notes.topicId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(topicNotes).values(notes).returning();
    return created;
  }

  // Quiz Attempts
  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return attempt;
  }

  async getQuizAttempt(id: number): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getQuizAttemptsByStudent(studentId: number): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId)).orderBy(desc(quizAttempts.startedAt));
  }

  async getLatestQuizAttempt(studentId: number, lessonId: number, quizType: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts)
      .where(and(
        eq(quizAttempts.studentId, studentId),
        eq(quizAttempts.lessonId, lessonId),
        eq(quizAttempts.quizType, quizType)
      ))
      .orderBy(desc(quizAttempts.startedAt))
      .limit(1);
    return attempt;
  }

  async completeQuizAttempt(id: number, score: number, totalPoints: number, passed: boolean): Promise<QuizAttempt> {
    const [attempt] = await db.update(quizAttempts)
      .set({ completedAt: new Date(), score, totalPoints, passed })
      .where(eq(quizAttempts.id, id))
      .returning();
    return attempt;
  }

  // Quiz Answers
  async createQuizAnswer(answerData: InsertQuizAnswer): Promise<QuizAnswer> {
    const [answer] = await db.insert(quizAnswers).values(answerData).returning();
    return answer;
  }

  async getQuizAnswersByAttempt(attemptId: number): Promise<QuizAnswer[]> {
    return db.select().from(quizAnswers).where(eq(quizAnswers.attemptId, attemptId));
  }

  // Lesson Progress
  async getLessonProgressByStudent(studentId: number): Promise<LessonProgressType[]> {
    return db.select().from(lessonProgress).where(eq(lessonProgress.studentId, studentId));
  }

  async getLessonProgress(studentId: number, lessonId: number): Promise<LessonProgressType | undefined> {
    const [progress] = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async createOrUpdateLessonProgress(progressData: InsertLessonProgress): Promise<LessonProgressType> {
    const existing = await this.getLessonProgress(progressData.studentId, progressData.lessonId);
    if (existing) {
      const [updated] = await db.update(lessonProgress)
        .set({ ...progressData, lastAccessedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(lessonProgress).values({ ...progressData, lastAccessedAt: new Date() }).returning();
    return created;
  }

  // Topic Mastery (Learning Loop)
  async getTopicMasteryByStudent(studentId: number): Promise<TopicMastery[]> {
    return db.select().from(topicMastery).where(eq(topicMastery.studentId, studentId));
  }

  async getTopicMastery(studentId: number, subject: string, topicId: string): Promise<TopicMastery | undefined> {
    const [mastery] = await db.select().from(topicMastery)
      .where(and(
        eq(topicMastery.studentId, studentId),
        eq(topicMastery.subject, subject),
        eq(topicMastery.topicId, topicId)
      ));
    return mastery;
  }

  async upsertTopicMastery(masteryData: InsertTopicMastery): Promise<TopicMastery> {
    const existing = await this.getTopicMastery(masteryData.studentId, masteryData.subject, masteryData.topicId);
    if (existing) {
      const [updated] = await db.update(topicMastery)
        .set({ ...masteryData, updatedAt: new Date() })
        .where(eq(topicMastery.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(topicMastery).values(masteryData).returning();
    return created;
  }

  async getWeakestTopic(studentId: number, subject: string): Promise<TopicMastery | undefined> {
    const [weakest] = await db.select().from(topicMastery)
      .where(and(
        eq(topicMastery.studentId, studentId),
        eq(topicMastery.subject, subject)
      ))
      .orderBy(topicMastery.accuracyRolling)
      .limit(1);
    return weakest;
  }

  // Session Attempts (Learning Loop)
  async createSessionAttempt(attemptData: InsertSessionAttempt): Promise<SessionAttempt> {
    const [attempt] = await db.insert(sessionAttempts).values(attemptData).returning();
    return attempt;
  }

  async getSessionAttempt(id: number): Promise<SessionAttempt | undefined> {
    const [attempt] = await db.select().from(sessionAttempts).where(eq(sessionAttempts.id, id));
    return attempt;
  }

  async getSessionAttemptsByStudent(studentId: number): Promise<SessionAttempt[]> {
    return db.select().from(sessionAttempts)
      .where(eq(sessionAttempts.studentId, studentId))
      .orderBy(desc(sessionAttempts.startedAt));
  }

  async getLatestSessionAttempt(studentId: number): Promise<SessionAttempt | undefined> {
    const [attempt] = await db.select().from(sessionAttempts)
      .where(eq(sessionAttempts.studentId, studentId))
      .orderBy(desc(sessionAttempts.startedAt))
      .limit(1);
    return attempt;
  }

  async getLatestSessionAttemptByTopic(studentId: number, topicId: string): Promise<SessionAttempt | undefined> {
    const [attempt] = await db.select().from(sessionAttempts)
      .where(and(eq(sessionAttempts.studentId, studentId), eq(sessionAttempts.topicId, topicId)))
      .orderBy(desc(sessionAttempts.startedAt))
      .limit(1);
    return attempt;
  }

  async updateSessionAttempt(id: number, updates: Partial<SessionAttempt>): Promise<SessionAttempt> {
    const [updated] = await db.update(sessionAttempts)
      .set(updates)
      .where(eq(sessionAttempts.id, id))
      .returning();
    return updated;
  }

  // Student Memory (Learning Loop)
  async getStudentMemory(studentId: number): Promise<StudentMemory | undefined> {
    const [memory] = await db.select().from(studentMemory).where(eq(studentMemory.studentId, studentId));
    return memory;
  }

  async upsertStudentMemory(memoryData: InsertStudentMemory): Promise<StudentMemory> {
    const existing = await this.getStudentMemory(memoryData.studentId);
    if (existing) {
      const [updated] = await db.update(studentMemory)
        .set({ ...memoryData, updatedAt: new Date() })
        .where(eq(studentMemory.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(studentMemory).values(memoryData).returning();
    return created;
  }

  // ════════════════════════════════════════════════════════════════
  // GROWTH ENGINE - Single Source of Truth
  // ════════════════════════════════════════════════════════════════
  
  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values({
      ...leadData,
      status: leadData.status || "NEW",
      sourceType: leadData.sourceType || "landing_form",
      leadScore: leadData.leadScore || 0,
      updatedAt: new Date()
    }).returning();
    
    // Auto-create CREATED event
    await this.addLeadEvent({
      leadId: lead.id,
      type: "CREATED",
      actor: "system",
      description: `Lead created from ${lead.sourceType}`
    });
    
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead> {
    const [lead] = await db.update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByFilter(filters: {
    status?: LeadStatus;
    sourceType?: string;
    yearLevel?: number;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    let query = db.select().from(leads);
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters.sourceType) {
      conditions.push(eq(leads.sourceType, filters.sourceType));
    }
    if (filters.yearLevel) {
      conditions.push(eq(leads.childYearLevel, filters.yearLevel));
    }
    if (filters.assignedTo) {
      conditions.push(eq(leads.assignedToUserId, filters.assignedTo));
    }
    if (filters.search) {
      conditions.push(
        sql`(${leads.email} ILIKE ${'%' + filters.search + '%'} OR ${leads.parentName} ILIKE ${'%' + filters.search + '%'})`
      );
    }
    
    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = countResult[0]?.count || 0;
    
    // Get paginated results
    let resultsQuery = db.select().from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt));
    
    if (filters.limit) {
      resultsQuery = resultsQuery.limit(filters.limit) as typeof resultsQuery;
    }
    if (filters.offset) {
      resultsQuery = resultsQuery.offset(filters.offset) as typeof resultsQuery;
    }
    
    const results = await resultsQuery;
    return { leads: results, total };
  }

  async addLeadEvent(eventData: InsertLeadEvent): Promise<LeadEvent> {
    const [event] = await db.insert(leadEvents).values(eventData).returning();
    return event;
  }

  async getLeadEvents(leadId: number): Promise<LeadEvent[]> {
    return db.select().from(leadEvents)
      .where(eq(leadEvents.leadId, leadId))
      .orderBy(desc(leadEvents.timestamp));
  }

  async createGrowthCampaign(campaignData: InsertGrowthCampaign): Promise<GrowthCampaign> {
    const [campaign] = await db.insert(growthCampaigns).values(campaignData).returning();
    return campaign;
  }

  async updateGrowthCampaign(id: number, updates: Partial<GrowthCampaign>): Promise<GrowthCampaign> {
    const [campaign] = await db.update(growthCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(growthCampaigns.id, id))
      .returning();
    return campaign;
  }

  async getGrowthCampaign(id: number): Promise<GrowthCampaign | undefined> {
    const [campaign] = await db.select().from(growthCampaigns).where(eq(growthCampaigns.id, id));
    return campaign;
  }

  async getAllGrowthCampaigns(): Promise<GrowthCampaign[]> {
    return db.select().from(growthCampaigns).orderBy(desc(growthCampaigns.createdAt));
  }

  async getIntegrationConfigs(): Promise<IntegrationConfig[]> {
    return db.select().from(integrationConfigs).orderBy(integrationConfigs.type);
  }

  async updateIntegrationConfig(id: number, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const [config] = await db.update(integrationConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrationConfigs.id, id))
      .returning();
    return config;
  }

  async getGrowthMetrics(): Promise<{
    totalLeads: number;
    leadsByStatus: Record<string, number>;
    newLeads7d: number;
    newLeads30d: number;
    conversionRate: number;
    acquisitionByChannel: Record<string, number>;
  }> {
    const allLeads = await this.getAllLeads();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const leadsByStatus: Record<string, number> = {};
    const acquisitionByChannel: Record<string, number> = {};
    let newLeads7d = 0;
    let newLeads30d = 0;
    let converted = 0;
    
    for (const lead of allLeads) {
      // Count by status
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
      
      // Count by channel
      const channel = lead.sourceType || "unknown";
      acquisitionByChannel[channel] = (acquisitionByChannel[channel] || 0) + 1;
      
      // Count recent leads
      if (lead.createdAt >= sevenDaysAgo) {
        newLeads7d++;
      }
      if (lead.createdAt >= thirtyDaysAgo) {
        newLeads30d++;
      }
      
      // Count conversions
      if (lead.status === "CONVERTED") {
        converted++;
      }
    }
    
    const conversionRate = allLeads.length > 0 
      ? Math.round((converted / allLeads.length) * 100) 
      : 0;
    
    return {
      totalLeads: allLeads.length,
      leadsByStatus,
      newLeads7d,
      newLeads30d,
      conversionRate,
      acquisitionByChannel
    };
  }

  // ════════════════════════════════════════════════════════════════
  // ADMISSIONS AGENT
  // ════════════════════════════════════════════════════════════════

  async createAdmissionsAssessment(assessment: InsertAdmissionsAssessment): Promise<AdmissionsAssessment> {
    const [result] = await db.insert(admissionsAssessments).values(assessment).returning();
    return result;
  }

  async updateAdmissionsAssessment(id: number, updates: Partial<AdmissionsAssessment>): Promise<AdmissionsAssessment> {
    const [result] = await db.update(admissionsAssessments)
      .set(updates)
      .where(eq(admissionsAssessments.id, id))
      .returning();
    return result;
  }

  async getAdmissionsAssessment(id: number): Promise<AdmissionsAssessment | undefined> {
    const [result] = await db.select().from(admissionsAssessments).where(eq(admissionsAssessments.id, id));
    return result;
  }

  async getAdmissionsAssessmentByLead(leadId: number): Promise<AdmissionsAssessment | undefined> {
    const [result] = await db.select()
      .from(admissionsAssessments)
      .where(eq(admissionsAssessments.leadId, leadId))
      .orderBy(desc(admissionsAssessments.assessedAt))
      .limit(1);
    return result;
  }

  async getAdmissionsQueue(status?: AdmissionsStatus): Promise<AdmissionsAssessment[]> {
    if (status) {
      return db.select()
        .from(admissionsAssessments)
        .where(eq(admissionsAssessments.status, status))
        .orderBy(desc(admissionsAssessments.assessedAt));
    }
    return db.select()
      .from(admissionsAssessments)
      .where(eq(admissionsAssessments.status, "pending_review"))
      .orderBy(desc(admissionsAssessments.assessedAt));
  }

  async getAllAdmissionsAssessments(): Promise<AdmissionsAssessment[]> {
    return db.select().from(admissionsAssessments).orderBy(desc(admissionsAssessments.assessedAt));
  }

  async getAdmissionsSettings(): Promise<AdmissionsSettings | undefined> {
    const [result] = await db.select().from(admissionsSettings).limit(1);
    return result;
  }

  async upsertAdmissionsSettings(settings: InsertAdmissionsSettings): Promise<AdmissionsSettings> {
    const existing = await this.getAdmissionsSettings();
    if (existing) {
      const [result] = await db.update(admissionsSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(admissionsSettings.id, existing.id))
        .returning();
      return result;
    }
    const [result] = await db.insert(admissionsSettings).values(settings).returning();
    return result;
  }

  async getAdmissionsStats(): Promise<{
    totalAssessments: number;
    pendingReview: number;
    autoQualified: number;
    autoRejected: number;
    humanApproved: number;
    humanRejected: number;
    nurturing: number;
    todayAssessments: number;
    avgConfidence: number;
  }> {
    const allAssessments = await this.getAllAdmissionsAssessments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      totalAssessments: allAssessments.length,
      pendingReview: 0,
      autoQualified: 0,
      autoRejected: 0,
      humanApproved: 0,
      humanRejected: 0,
      nurturing: 0,
      todayAssessments: 0,
      avgConfidence: 0
    };
    
    let totalConfidence = 0;
    
    for (const assessment of allAssessments) {
      switch (assessment.status) {
        case "pending_review": stats.pendingReview++; break;
        case "auto_qualified": stats.autoQualified++; break;
        case "auto_rejected": stats.autoRejected++; break;
        case "human_approved": stats.humanApproved++; break;
        case "human_rejected": stats.humanRejected++; break;
        case "nurturing": stats.nurturing++; break;
      }
      
      if (assessment.assessedAt >= today) {
        stats.todayAssessments++;
      }
      
      totalConfidence += assessment.aiConfidence;
    }
    
    stats.avgConfidence = allAssessments.length > 0 
      ? Math.round(totalConfidence / allAssessments.length) 
      : 0;
    
    return stats;
  }

  // ════════════════════════════════════════════════════════════════
  // ACADEMIC QUALITY AGENT IMPLEMENTATION
  // ════════════════════════════════════════════════════════════════

  async createAcademicAlert(alert: InsertAcademicAlert): Promise<AcademicAlert> {
    const [created] = await db.insert(academicAlerts).values(alert).returning();
    return created;
  }

  async updateAcademicAlert(id: number, updates: Partial<AcademicAlert>): Promise<AcademicAlert> {
    const [updated] = await db
      .update(academicAlerts)
      .set(updates)
      .where(eq(academicAlerts.id, id))
      .returning();
    return updated;
  }

  async getAcademicAlert(id: number): Promise<AcademicAlert | undefined> {
    const [alert] = await db.select().from(academicAlerts).where(eq(academicAlerts.id, id));
    return alert;
  }

  async getAcademicAlertsByStudent(studentId: number): Promise<AcademicAlert[]> {
    return db
      .select()
      .from(academicAlerts)
      .where(eq(academicAlerts.studentId, studentId))
      .orderBy(desc(academicAlerts.createdAt));
  }

  async getAcademicAlertsByStatus(status: AcademicAlertStatus): Promise<AcademicAlert[]> {
    return db
      .select()
      .from(academicAlerts)
      .where(eq(academicAlerts.status, status))
      .orderBy(desc(academicAlerts.createdAt));
  }

  async getAllAcademicAlerts(): Promise<AcademicAlert[]> {
    return db.select().from(academicAlerts).orderBy(desc(academicAlerts.createdAt));
  }

  async getActiveAcademicAlerts(): Promise<AcademicAlert[]> {
    return db
      .select()
      .from(academicAlerts)
      .where(eq(academicAlerts.status, "active"))
      .orderBy(desc(academicAlerts.createdAt));
  }

  async getAcademicQualitySettings(): Promise<AcademicQualitySettings | undefined> {
    const [settings] = await db.select().from(academicQualitySettings);
    return settings;
  }

  async upsertAcademicQualitySettings(settings: InsertAcademicQualitySettings): Promise<AcademicQualitySettings> {
    const existing = await this.getAcademicQualitySettings();
    if (existing) {
      const [updated] = await db
        .update(academicQualitySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(academicQualitySettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(academicQualitySettings).values(settings).returning();
    return created;
  }

  async getAcademicQualityStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    acknowledgedToday: number;
    resolvedToday: number;
    atRiskStudents: number;
    avgResolutionTime: number;
  }> {
    const allAlerts = await this.getAllAcademicAlerts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      acknowledgedToday: 0,
      resolvedToday: 0,
      atRiskStudents: 0,
      avgResolutionTime: 0
    };

    const atRiskStudentIds = new Set<number>();
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of allAlerts) {
      if (alert.status === "active") stats.activeAlerts++;
      if (alert.severity === "critical") stats.criticalAlerts++;
      if (alert.severity === "high") stats.highAlerts++;
      
      if (alert.acknowledgedAt && alert.acknowledgedAt >= today) {
        stats.acknowledgedToday++;
      }
      if (alert.resolvedAt && alert.resolvedAt >= today) {
        stats.resolvedToday++;
      }
      
      if (alert.alertType === "at_risk" && alert.status === "active") {
        atRiskStudentIds.add(alert.studentId);
      }
      
      if (alert.resolvedAt && alert.createdAt) {
        totalResolutionTime += alert.resolvedAt.getTime() - alert.createdAt.getTime();
        resolvedCount++;
      }
    }

    stats.atRiskStudents = atRiskStudentIds.size;
    stats.avgResolutionTime = resolvedCount > 0 
      ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)) // hours
      : 0;

    return stats;
  }

  async getStudentPerformanceMetrics(studentId: number): Promise<{
    avgMasteryLevel: number;
    completionRate: number;
    engagementScore: number;
    lastActivityDate: Date | null;
    subjectBreakdown: { subject: string; mastery: number; sessions: number }[];
  }> {
    const studentProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.studentId, studentId));

    const studentSessions = await db
      .select()
      .from(tutoringSessions)
      .where(eq(tutoringSessions.studentId, studentId));

    // Calculate averages
    let totalMastery = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let lastActivity: Date | null = null;
    const subjectMap = new Map<string, { mastery: number; sessions: number; count: number }>();

    for (const p of studentProgress) {
      totalMastery += p.masteryLevel;
      totalAttempted += p.problemsAttempted || 0;
      totalCorrect += p.problemsCorrect || 0;
      
      if (p.lastPracticed && (!lastActivity || p.lastPracticed > lastActivity)) {
        lastActivity = p.lastPracticed;
      }

      const existing = subjectMap.get(p.subject) || { mastery: 0, sessions: 0, count: 0 };
      existing.mastery += p.masteryLevel;
      existing.count++;
      subjectMap.set(p.subject, existing);
    }

    for (const session of studentSessions) {
      if (session.startedAt && (!lastActivity || session.startedAt > lastActivity)) {
        lastActivity = session.startedAt;
      }
      
      const existing = subjectMap.get(session.subject) || { mastery: 0, sessions: 0, count: 0 };
      existing.sessions++;
      subjectMap.set(session.subject, existing);
    }

    const avgMasteryLevel = studentProgress.length > 0 
      ? Math.round(totalMastery / studentProgress.length) 
      : 0;
    
    const completionRate = totalAttempted > 0 
      ? Math.round((totalCorrect / totalAttempted) * 100) 
      : 0;

    // Engagement score based on recency and frequency
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    let engagementScore = 100;
    if (daysSinceLastActivity > 7) engagementScore -= 30;
    if (daysSinceLastActivity > 14) engagementScore -= 30;
    if (daysSinceLastActivity > 30) engagementScore -= 40;
    engagementScore = Math.max(0, engagementScore);

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      mastery: data.count > 0 ? Math.round(data.mastery / data.count) : 0,
      sessions: data.sessions
    }));

    return {
      avgMasteryLevel,
      completionRate,
      engagementScore,
      lastActivityDate: lastActivity,
      subjectBreakdown
    };
  }
}

export const tutoringStorage = new TutoringStorage();
