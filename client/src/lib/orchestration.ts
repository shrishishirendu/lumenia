import { useState, useEffect, useCallback } from "react";

export interface LearningPlan {
  id: string;
  studentId: string;
  studentName: string;
  subjects: string[];
  weeklyHours: number;
  monthlyHours: number;
  intensity: "light" | "moderate" | "intensive";
  allowedModalities: ("focus" | "flow" | "human")[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionRules {
  id: string;
  studentId: string;
  maxFocusSessionsPerWeek: number;
  maxFlowMinutesPerDay: number;
  cooldownMinutes: number;
  burnoutProtectionEnabled: boolean;
  breakReminderInterval: number;
}

export interface ParentProposal {
  id: string;
  studentId: string;
  studentName: string;
  parentEmail: string;
  proposedPlan: Partial<LearningPlan>;
  status: "pending" | "approved" | "rejected" | "negotiating";
  aiReasoning: string;
  tradeOffs: string[];
  createdAt: string;
}

export interface WorkflowAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: "stuck" | "overuse_flow" | "skipped_anchors" | "burnout_risk" | "low_engagement";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
  escalated: boolean;
  resolved: boolean;
  createdAt: string;
}

export interface AgentAction {
  id: string;
  timestamp: string;
  action: string;
  reasoning: string;
  outcome: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  type: "marketing" | "admissions" | "operations" | "academic_quality" | "admin";
  mandate: string;
  status: "active" | "paused" | "human_override";
  confidence: number;
  lastAction: string;
  actionsToday: number;
  recentActions: AgentAction[];
  escalationReason?: string;
}

export interface AdminAgentDecision {
  id: string;
  type: "plan_generation" | "goal_adjustment" | "parent_negotiation" | "escalation";
  studentId?: string;
  studentName?: string;
  decision: string;
  reasoning: string;
  confidence: number;
  requiresHumanReview: boolean;
  status: "pending" | "approved" | "rejected" | "auto_applied";
  createdAt: string;
}

const STORAGE_KEYS = {
  learningPlans: "vht_learning_plans",
  sessionRules: "vht_session_rules",
  parentProposals: "vht_parent_proposals",
  workflowAlerts: "vht_workflow_alerts",
  agentStatuses: "vht_agent_statuses",
  adminDecisions: "vht_admin_decisions"
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

const defaultAgentStatuses: AgentStatus[] = [
  {
    id: "marketing",
    name: "Marketing Agent",
    type: "marketing",
    mandate: "Generate and optimize marketing campaigns to attract qualified students while respecting capacity limits.",
    status: "active",
    confidence: 0.87,
    lastAction: "Paused social campaign due to 95% capacity",
    actionsToday: 12,
    recentActions: [
      { id: "m1", timestamp: new Date().toISOString(), action: "Paused Facebook campaign", reasoning: "Enrollment at 95% capacity, need to prevent over-enrollment", outcome: "Campaign paused successfully" },
      { id: "m2", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Adjusted Google Ads budget", reasoning: "Lower CPA observed on weekday evenings", outcome: "Budget reallocated, projected 15% efficiency gain" }
    ]
  },
  {
    id: "admissions",
    name: "Admissions Agent",
    type: "admissions",
    mandate: "Qualify incoming leads, set clear expectations, and reject misaligned enrollments to maintain quality.",
    status: "active",
    confidence: 0.92,
    lastAction: "Qualified 3 new leads, flagged 1 for review",
    actionsToday: 8,
    recentActions: [
      { id: "a1", timestamp: new Date().toISOString(), action: "Approved lead: Sarah M.", reasoning: "Year 10 student, maths focus, parent goals align with our methods", outcome: "Sent welcome sequence" },
      { id: "a2", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "Flagged lead for review", reasoning: "Parent expects rapid grade improvement in 2 weeks - unrealistic expectation", outcome: "Escalated to human admin" }
    ]
  },
  {
    id: "operations",
    name: "Operations Agent",
    type: "operations",
    mandate: "Monitor system health, manage AI-human handoffs, and ensure SLA adherence across the platform.",
    status: "active",
    confidence: 0.95,
    lastAction: "Scheduled maintenance window",
    actionsToday: 24,
    recentActions: [
      { id: "o1", timestamp: new Date().toISOString(), action: "Initiated human tutor handoff", reasoning: "Student Alex showing frustration signals after 3 failed attempts", outcome: "Human tutor assigned, session scheduled" },
      { id: "o2", timestamp: new Date(Date.now() - 1800000).toISOString(), action: "Health check passed", reasoning: "All services responding within SLA thresholds", outcome: "System healthy" }
    ]
  },
  {
    id: "academic_quality",
    name: "Academic Quality Agent",
    type: "academic_quality",
    mandate: "Monitor learning outcomes vs time invested, flag shallow learning patterns, and suggest curriculum adjustments.",
    status: "active",
    confidence: 0.78,
    lastAction: "Flagged potential shallow learning pattern",
    actionsToday: 6,
    recentActions: [
      { id: "q1", timestamp: new Date().toISOString(), action: "Flagged student progress", reasoning: "Student completing problems quickly but retention test scores declining - possible pattern matching without understanding", outcome: "Recommended more conceptual exercises" },
      { id: "q2", timestamp: new Date(Date.now() - 14400000).toISOString(), action: "Curriculum adjustment", reasoning: "Year 9 algebra module showing 40% struggle rate on word problems", outcome: "Suggested adding scaffolded word problem intro" }
    ]
  }
];

const defaultWorkflowAlerts: WorkflowAlert[] = [
  {
    id: "alert1",
    studentId: "s1",
    studentName: "Emma Wilson",
    type: "stuck",
    severity: "medium",
    message: "Student has been on the same problem for 15 minutes with no progress",
    suggestion: "Consider offering a hint or switching to a simpler related problem",
    escalated: false,
    resolved: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "alert2",
    studentId: "s2",
    studentName: "James Chen",
    type: "overuse_flow",
    severity: "low",
    message: "Student has used Flow mode for 3 hours today, approaching daily limit",
    suggestion: "Suggest a Focus session or break",
    escalated: false,
    resolved: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export function useLearningPlans() {
  const [plans, setPlans] = useState<LearningPlan[]>(() => 
    getFromStorage(STORAGE_KEYS.learningPlans, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.learningPlans, plans);
  }, [plans]);

  const addPlan = useCallback((plan: Omit<LearningPlan, "id" | "createdAt" | "updatedAt">) => {
    const newPlan: LearningPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPlans(prev => [...prev, newPlan]);
    return newPlan;
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<LearningPlan>) => {
    setPlans(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  return { plans, addPlan, updatePlan, deletePlan };
}

export function useSessionRules() {
  const [rules, setRules] = useState<SessionRules[]>(() => 
    getFromStorage(STORAGE_KEYS.sessionRules, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.sessionRules, rules);
  }, [rules]);

  const updateRules = useCallback((studentId: string, updates: Partial<SessionRules>) => {
    setRules(prev => {
      const existing = prev.find(r => r.studentId === studentId);
      if (existing) {
        return prev.map(r => r.studentId === studentId ? { ...r, ...updates } : r);
      }
      return [...prev, {
        id: `rules_${Date.now()}`,
        studentId,
        maxFocusSessionsPerWeek: 10,
        maxFlowMinutesPerDay: 120,
        cooldownMinutes: 15,
        burnoutProtectionEnabled: true,
        breakReminderInterval: 25,
        ...updates
      }];
    });
  }, []);

  return { rules, updateRules };
}

export function useParentProposals() {
  const [proposals, setProposals] = useState<ParentProposal[]>(() => 
    getFromStorage(STORAGE_KEYS.parentProposals, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.parentProposals, proposals);
  }, [proposals]);

  const addProposal = useCallback((proposal: Omit<ParentProposal, "id" | "createdAt">) => {
    const newProposal: ParentProposal = {
      ...proposal,
      id: `proposal_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setProposals(prev => [...prev, newProposal]);
    return newProposal;
  }, []);

  const updateProposal = useCallback((id: string, updates: Partial<ParentProposal>) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  return { proposals, addProposal, updateProposal };
}

export function useWorkflowAlerts() {
  const [alerts, setAlerts] = useState<WorkflowAlert[]>(() => 
    getFromStorage(STORAGE_KEYS.workflowAlerts, defaultWorkflowAlerts)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.workflowAlerts, alerts);
  }, [alerts]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }, []);

  const escalateAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, escalated: true } : a));
  }, []);

  const addAlert = useCallback((alert: Omit<WorkflowAlert, "id" | "createdAt">) => {
    const newAlert: WorkflowAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [...prev, newAlert]);
  }, []);

  return { alerts, resolveAlert, escalateAlert, addAlert };
}

export function useAgentStatuses() {
  const [agents, setAgents] = useState<AgentStatus[]>(() => 
    getFromStorage(STORAGE_KEYS.agentStatuses, defaultAgentStatuses)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.agentStatuses, agents);
  }, [agents]);

  const updateAgentStatus = useCallback((id: string, status: AgentStatus["status"]) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const addAgentAction = useCallback((agentId: string, action: Omit<AgentAction, "id" | "timestamp">) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const newAction: AgentAction = {
          ...action,
          id: `action_${Date.now()}`,
          timestamp: new Date().toISOString()
        };
        return {
          ...a,
          lastAction: action.action,
          actionsToday: a.actionsToday + 1,
          recentActions: [newAction, ...a.recentActions.slice(0, 9)]
        };
      }
      return a;
    }));
  }, []);

  return { agents, updateAgentStatus, addAgentAction };
}

export function useAdminDecisions() {
  const [decisions, setDecisions] = useState<AdminAgentDecision[]>(() => 
    getFromStorage(STORAGE_KEYS.adminDecisions, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.adminDecisions, decisions);
  }, [decisions]);

  const addDecision = useCallback((decision: Omit<AdminAgentDecision, "id" | "createdAt">) => {
    const newDecision: AdminAgentDecision = {
      ...decision,
      id: `decision_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setDecisions(prev => [newDecision, ...prev]);
    return newDecision;
  }, []);

  const updateDecision = useCallback((id: string, updates: Partial<AdminAgentDecision>) => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  return { decisions, addDecision, updateDecision };
}

export function generateAIPlan(studentName: string, grade: number): { plan: Partial<LearningPlan>; reasoning: string; confidence: number } {
  const intensityOptions: LearningPlan["intensity"][] = ["light", "moderate", "intensive"];
  const intensity = intensityOptions[Math.floor(Math.random() * 3)];
  
  const weeklyHours = intensity === "light" ? 3 : intensity === "moderate" ? 5 : 8;
  
  return {
    plan: {
      studentName,
      subjects: ["Mathematics"],
      weeklyHours,
      monthlyHours: weeklyHours * 4,
      intensity,
      allowedModalities: ["focus", "flow"]
    },
    reasoning: `Based on Year ${grade} curriculum requirements and typical learning patterns, I recommend a ${intensity} intensity plan with ${weeklyHours} hours per week. This allows for ${intensity === "light" ? "gentle progression without overwhelming the student" : intensity === "moderate" ? "balanced learning with room for deeper exploration" : "accelerated learning suitable for motivated students"}.`,
    confidence: 0.75 + Math.random() * 0.2
  };
}

export function generateParentNegotiationResponse(proposal: ParentProposal): { response: string; adjustedPlan: Partial<LearningPlan>; tradeOffs: string[] } {
  const tradeOffs = [
    "Increasing weekly hours may lead to faster progress but risks burnout",
    "Adding more subjects spreads focus but provides broader coverage",
    "Higher intensity requires more parental support for homework"
  ];
  
  return {
    response: `Thank you for your input on ${proposal.studentName}'s learning plan. I've considered your preferences and made some adjustments. The proposed ${proposal.proposedPlan.intensity || "moderate"} intensity with ${proposal.proposedPlan.weeklyHours || 5} hours per week balances progress with sustainable learning.`,
    adjustedPlan: proposal.proposedPlan,
    tradeOffs: tradeOffs.slice(0, 2)
  };
}
