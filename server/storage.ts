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
  type InsertActivityLog
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
}

export const tutoringStorage = new TutoringStorage();
