import { useState, useEffect, useCallback } from "react";

export type AutonomyLevel = 0 | 1 | 2 | 3;

export interface AutonomyLevelConfig {
  level: AutonomyLevel;
  name: string;
  description: string;
  canDo: string[];
  cannotDo: string[];
  humanActions: string[];
}

export const AUTONOMY_LEVELS: AutonomyLevelConfig[] = [
  {
    level: 0,
    name: "Observe Only",
    description: "Agent analyzes and proposes but cannot execute anything",
    canDo: [
      "Analyze market data",
      "Propose strategies",
      "Draft campaigns",
      "Generate creatives (ads, posts, emails)"
    ],
    cannotDo: [
      "Publish any content",
      "Spend any budget",
      "Execute campaigns"
    ],
    humanActions: [
      "Review all proposals",
      "Approve or reject ideas",
      "Make all execution decisions"
    ]
  },
  {
    level: 1,
    name: "Assisted Execution",
    description: "Agent can publish approved content only",
    canDo: [
      "Publish pre-approved content",
      "Schedule posts",
      "Run A/B tests on approved creatives"
    ],
    cannotDo: [
      "Launch new campaigns",
      "Increase budget",
      "Change strategy"
    ],
    humanActions: [
      "Approve campaign starts",
      "Set spend limits",
      "Approve all new content"
    ]
  },
  {
    level: 2,
    name: "Semi-Autonomous",
    description: "Agent can launch within approved strategy bounds",
    canDo: [
      "Launch campaigns within approved strategy",
      "Adjust daily budgets within cap",
      "Pause underperforming ads",
      "Optimize targeting"
    ],
    cannotDo: [
      "Change overall strategy",
      "Exceed budget caps",
      "Launch outside approved channels"
    ],
    humanActions: [
      "Approve strategy shifts",
      "Monitor outcomes",
      "Set guardrails"
    ]
  },
  {
    level: 3,
    name: "Autonomous with Guardrails",
    description: "Full autonomy with logging, alerts, and oversight",
    canDo: [
      "Launch and optimize campaigns",
      "Adjust targeting and creatives",
      "Pause marketing when capacity full",
      "Make real-time optimizations"
    ],
    cannotDo: [
      "Exceed total budget limit",
      "Ignore capacity constraints",
      "Act without logging"
    ],
    humanActions: [
      "Ethics oversight",
      "Crisis intervention",
      "Budget approval",
      "Emergency stop"
    ]
  }
];

export interface MarketSituation {
  id: string;
  timestamp: Date;
  capacityStatus: {
    currentStudents: number;
    maxCapacity: number;
    utilizationPercent: number;
    trend: "growing" | "stable" | "declining";
  };
  retentionHealth: {
    activeStudents: number;
    atRiskStudents: number;
    churnedLastMonth: number;
    retentionRate: number;
  };
  tutorAvailability: {
    totalTutors: number;
    availableHours: number;
    bookedPercent: number;
  };
  signals: {
    type: "positive" | "warning" | "critical";
    message: string;
  }[];
}

export interface MarketingStrategy {
  id: string;
  name: string;
  status: "draft" | "pending_approval" | "approved" | "active" | "paused" | "completed";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  targetAudience: {
    description: string;
    demographics: string[];
    painPoints: string[];
    yearLevels: string[];
  };
  messageAngle: {
    primary: string;
    secondary: string;
    tone: "confidence" | "clarity" | "exam_prep" | "stress_relief" | "achievement";
  };
  channels: {
    name: string;
    priority: "high" | "medium" | "low";
    reasoning: string;
    risk: string;
    budgetAllocation: number;
  }[];
  riskAssessment: {
    level: "low" | "medium" | "high";
    factors: string[];
    mitigations: string[];
  };
  successMetrics: {
    metric: string;
    target: number;
    current: number;
  }[];
}

export interface Campaign {
  id: string;
  strategyId: string;
  name: string;
  channel: "google_ads" | "meta_ads" | "youtube" | "email" | "whatsapp" | "sms" | "organic_social" | "website";
  status: "draft" | "pending_approval" | "approved" | "scheduled" | "running" | "paused" | "completed";
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  content: {
    headline: string;
    body: string;
    cta: string;
    ctaReasoning: string;
    visualPrompt?: string;
  };
  variants?: {
    id: string;
    headline: string;
    body: string;
    performance?: number;
  }[];
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cpa: number;
    ctr: number;
  };
  agentNotes: string;
}

export interface Lead {
  id: string;
  timestamp: Date;
  source: string;
  campaignId?: string;
  campaignName?: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
  };
  student: {
    name: string;
    yearLevel: string;
    subjects: string[];
  };
  intent: "high" | "medium" | "low";
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  suggestedAction: string;
  notes: string;
  humanNotified: boolean;
}

export interface DecisionLog {
  id: string;
  timestamp: Date;
  autonomyLevel: AutonomyLevel;
  actionType: "analysis" | "strategy" | "campaign_create" | "campaign_launch" | "campaign_pause" | "budget_adjust" | "lead_action" | "optimization";
  action: string;
  reasoning: string;
  alternatives: { option: string; whyRejected: string }[];
  confidenceScore: number;
  requiresApproval: boolean;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface HumanInstruction {
  id: string;
  timestamp: Date;
  type: "strategy_change" | "constraint" | "rejection" | "idea" | "pause" | "reset";
  instruction: string;
  agentAcknowledgment: string;
  behaviorChange: string;
}

export interface BudgetControl {
  monthlyBudget: number;
  currentSpend: number;
  dailyLimit: number;
  alertThreshold: number;
  alerts: {
    timestamp: Date;
    type: "warning" | "limit_reached" | "overspend";
    message: string;
  }[];
}

export interface MarketingAgentState {
  autonomyLevel: AutonomyLevel;
  autonomyHistory: { timestamp: Date; level: AutonomyLevel; changedBy: string; reason: string }[];
  isActive: boolean;
  isPaused: boolean;
  currentSituation: MarketSituation | null;
  currentStrategy: MarketingStrategy | null;
  strategies: MarketingStrategy[];
  campaigns: Campaign[];
  leads: Lead[];
  decisionLogs: DecisionLog[];
  humanInstructions: HumanInstruction[];
  budget: BudgetControl;
  lockedActions: string[];
}

const STORAGE_KEY = "marketing_agent_state";

const generateId = () => Math.random().toString(36).substring(2, 9);

const CONFIDENCE_APPROVAL_THRESHOLD = 70;

interface GuardResult {
  allowed: boolean;
  reason?: string;
}

const checkActionAllowed = (
  state: MarketingAgentState,
  action: string,
  requiredLevel: AutonomyLevel
): GuardResult => {
  if (state.isPaused) {
    return { allowed: false, reason: "Agent is paused. Resume to continue." };
  }
  if (state.lockedActions.includes(action)) {
    return { allowed: false, reason: `Action "${action}" is locked by human override.` };
  }
  if (state.autonomyLevel < requiredLevel) {
    return { 
      allowed: false, 
      reason: `Autonomy Level ${state.autonomyLevel} cannot perform "${action}". Requires Level ${requiredLevel}.` 
    };
  }
  return { allowed: true };
};

const getInitialState = (): MarketingAgentState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        autonomyHistory: parsed.autonomyHistory?.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })) || [],
        leads: parsed.leads?.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })) || [],
        decisionLogs: parsed.decisionLogs?.map((d: any) => ({ ...d, timestamp: new Date(d.timestamp) })) || [],
        humanInstructions: parsed.humanInstructions?.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })) || [],
        strategies: parsed.strategies?.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), approvedAt: s.approvedAt ? new Date(s.approvedAt) : undefined })) || [],
        campaigns: parsed.campaigns?.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), startDate: c.startDate ? new Date(c.startDate) : undefined, endDate: c.endDate ? new Date(c.endDate) : undefined })) || [],
        currentSituation: parsed.currentSituation ? { ...parsed.currentSituation, timestamp: new Date(parsed.currentSituation.timestamp) } : null,
        budget: parsed.budget || { monthlyBudget: 5000, currentSpend: 0, dailyLimit: 200, alertThreshold: 80, alerts: [] }
      };
    } catch {
      return getDefaultState();
    }
  }
  return getDefaultState();
};

const getDefaultState = (): MarketingAgentState => ({
  autonomyLevel: 0,
  autonomyHistory: [{ timestamp: new Date(), level: 0, changedBy: "System", reason: "Initial setup" }],
  isActive: true,
  isPaused: false,
  currentSituation: null,
  currentStrategy: null,
  strategies: [],
  campaigns: [],
  leads: [],
  decisionLogs: [],
  humanInstructions: [],
  budget: {
    monthlyBudget: 5000,
    currentSpend: 0,
    dailyLimit: 200,
    alertThreshold: 80,
    alerts: []
  },
  lockedActions: []
});

export function useMarketingAgent() {
  const [state, setState] = useState<MarketingAgentState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const changeAutonomyLevel = useCallback((newLevel: AutonomyLevel, changedBy: string, reason: string) => {
    setState(prev => ({
      ...prev,
      autonomyLevel: newLevel,
      autonomyHistory: [
        ...prev.autonomyHistory,
        { timestamp: new Date(), level: newLevel, changedBy, reason }
      ]
    }));
    
    return {
      previousLevel: state.autonomyLevel,
      newLevel,
      config: AUTONOMY_LEVELS[newLevel]
    };
  }, [state.autonomyLevel]);

  const pauseAgent = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
    addDecisionLog({
      actionType: "campaign_pause",
      action: "Agent paused by human",
      reasoning: "Human requested pause of all agent activities",
      alternatives: [],
      confidenceScore: 100,
      requiresApproval: false,
      approved: true
    });
  }, []);

  const resumeAgent = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const emergencyStop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true,
      autonomyLevel: 0,
      campaigns: prev.campaigns.map(c => 
        c.status === "running" ? { ...c, status: "paused" as const } : c
      )
    }));
  }, []);

  const lockAction = useCallback((action: string) => {
    setState(prev => ({
      ...prev,
      lockedActions: [...prev.lockedActions, action]
    }));
  }, []);

  const unlockAction = useCallback((action: string) => {
    setState(prev => ({
      ...prev,
      lockedActions: prev.lockedActions.filter(a => a !== action)
    }));
  }, []);

  const addDecisionLog = useCallback((log: Omit<DecisionLog, "id" | "timestamp" | "autonomyLevel">) => {
    const newLog: DecisionLog = {
      ...log,
      id: generateId(),
      timestamp: new Date(),
      autonomyLevel: state.autonomyLevel
    };
    setState(prev => ({
      ...prev,
      decisionLogs: [newLog, ...prev.decisionLogs]
    }));
    return newLog;
  }, [state.autonomyLevel]);

  const analyzeSituation = useCallback(() => {
    const situation: MarketSituation = {
      id: generateId(),
      timestamp: new Date(),
      capacityStatus: {
        currentStudents: Math.floor(Math.random() * 50) + 30,
        maxCapacity: 100,
        utilizationPercent: Math.floor(Math.random() * 40) + 40,
        trend: ["growing", "stable", "declining"][Math.floor(Math.random() * 3)] as any
      },
      retentionHealth: {
        activeStudents: Math.floor(Math.random() * 40) + 40,
        atRiskStudents: Math.floor(Math.random() * 10) + 2,
        churnedLastMonth: Math.floor(Math.random() * 5),
        retentionRate: Math.floor(Math.random() * 15) + 80
      },
      tutorAvailability: {
        totalTutors: 8,
        availableHours: Math.floor(Math.random() * 100) + 50,
        bookedPercent: Math.floor(Math.random() * 30) + 50
      },
      signals: [
        { type: "positive", message: "Trial conversion rate up 12% this week" },
        { type: "warning", message: "3 students showing reduced engagement" },
        { type: "positive", message: "Parent satisfaction score at 4.6/5" }
      ]
    };

    setState(prev => ({ ...prev, currentSituation: situation }));

    addDecisionLog({
      actionType: "analysis",
      action: "Completed market situation analysis",
      reasoning: `Analyzed capacity (${situation.capacityStatus.utilizationPercent}% utilized), retention (${situation.retentionHealth.retentionRate}% rate), and tutor availability (${situation.tutorAvailability.bookedPercent}% booked)`,
      alternatives: [],
      confidenceScore: 92,
      requiresApproval: false
    });

    return situation;
  }, [addDecisionLog]);

  const proposeStrategy = useCallback((params: {
    targetDescription: string;
    primaryAngle: string;
    channels: string[];
  }) => {
    const strategy: MarketingStrategy = {
      id: generateId(),
      name: `${params.primaryAngle} Campaign - ${new Date().toLocaleDateString()}`,
      status: state.autonomyLevel >= 2 ? "pending_approval" : "draft",
      createdAt: new Date(),
      targetAudience: {
        description: params.targetDescription,
        demographics: ["Parents aged 35-50", "Middle to upper income", "Value education"],
        painPoints: ["Child struggling with math", "Exam stress", "Need flexible scheduling"],
        yearLevels: ["Year 9", "Year 10", "Year 11", "Year 12"]
      },
      messageAngle: {
        primary: params.primaryAngle,
        secondary: "Personalized AI-powered learning",
        tone: "confidence"
      },
      channels: params.channels.map((ch, i) => ({
        name: ch,
        priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
        reasoning: `${ch} selected for strong reach to parent demographic`,
        risk: "Moderate - requires consistent content quality",
        budgetAllocation: Math.floor(100 / params.channels.length)
      })),
      riskAssessment: {
        level: "medium",
        factors: ["Market competition", "Seasonal enrollment patterns", "Budget constraints"],
        mitigations: ["A/B testing", "Phased rollout", "Weekly performance reviews"]
      },
      successMetrics: [
        { metric: "Cost per Lead", target: 25, current: 0 },
        { metric: "Trial Signups", target: 50, current: 0 },
        { metric: "Conversion Rate", target: 20, current: 0 }
      ]
    };

    setState(prev => ({
      ...prev,
      strategies: [...prev.strategies, strategy],
      currentStrategy: strategy
    }));

    addDecisionLog({
      actionType: "strategy",
      action: `Proposed new marketing strategy: ${strategy.name}`,
      reasoning: `Based on current capacity (${state.currentSituation?.capacityStatus.utilizationPercent || 50}% utilized) and target audience analysis, recommended ${params.channels.join(", ")} channels with ${params.primaryAngle} messaging`,
      alternatives: [
        { option: "Focus on retention only", whyRejected: "Capacity allows for growth" },
        { option: "Aggressive paid campaign", whyRejected: "Budget constraints and quality focus" }
      ],
      confidenceScore: 78,
      requiresApproval: state.autonomyLevel < 2
    });

    return strategy;
  }, [state.autonomyLevel, state.currentSituation, addDecisionLog]);

  const approveStrategy = useCallback((strategyId: string, approver: string) => {
    const strategy = state.strategies.find(s => s.id === strategyId);
    
    setState(prev => ({
      ...prev,
      strategies: prev.strategies.map(s =>
        s.id === strategyId
          ? { ...s, status: "approved" as const, approvedAt: new Date(), approvedBy: approver }
          : s
      ),
      currentStrategy: prev.currentStrategy?.id === strategyId
        ? { ...prev.currentStrategy, status: "approved" as const, approvedAt: new Date(), approvedBy: approver }
        : prev.currentStrategy
    }));

    addDecisionLog({
      actionType: "strategy",
      action: `Strategy approved: ${strategy?.name || strategyId}`,
      reasoning: `Human approved strategy after review. Approved by: ${approver}`,
      alternatives: [],
      confidenceScore: 100,
      requiresApproval: false,
      approved: true,
      approvedBy: approver,
      approvedAt: new Date()
    });
  }, [state.strategies, addDecisionLog]);

  const createCampaign = useCallback((params: {
    strategyId: string;
    name: string;
    channel: Campaign["channel"];
    headline: string;
    body: string;
    cta: string;
    dailyBudget: number;
    totalBudget: number;
  }) => {
    const campaign: Campaign = {
      id: generateId(),
      strategyId: params.strategyId,
      name: params.name,
      channel: params.channel,
      status: state.autonomyLevel >= 1 ? "pending_approval" : "draft",
      createdAt: new Date(),
      content: {
        headline: params.headline,
        body: params.body,
        cta: params.cta,
        ctaReasoning: "Direct action verb with urgency to drive immediate response"
      },
      budget: {
        daily: params.dailyBudget,
        total: params.totalBudget,
        spent: 0
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cpa: 0,
        ctr: 0
      },
      agentNotes: `Campaign created for ${params.channel} channel with focus on parent engagement. Recommend A/B testing headline variants.`
    };

    setState(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, campaign]
    }));

    addDecisionLog({
      actionType: "campaign_create",
      action: `Created campaign: ${params.name}`,
      reasoning: `${params.channel} campaign designed to reach target parents with ${params.headline.substring(0, 30)}... messaging`,
      alternatives: [
        { option: "Video ad format", whyRejected: "Higher production cost, text performs well for this audience" }
      ],
      confidenceScore: 85,
      requiresApproval: state.autonomyLevel < 2
    });

    return campaign;
  }, [state.autonomyLevel, addDecisionLog]);

  const approveCampaign = useCallback((campaignId: string, approver?: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    
    setState(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: "approved" as const } : c
      )
    }));

    addDecisionLog({
      actionType: "campaign_create",
      action: `Campaign approved: ${campaign?.name || campaignId}`,
      reasoning: `Human approved campaign content and budget after review.`,
      alternatives: [],
      confidenceScore: 100,
      requiresApproval: false,
      approved: true,
      approvedBy: approver || "Admin",
      approvedAt: new Date()
    });
  }, [state.campaigns, addDecisionLog]);

  const launchCampaign = useCallback((campaignId: string): { success?: boolean; error?: string; requiresApproval?: boolean } => {
    const guard = checkActionAllowed(state, "campaign_launch", 1);
    if (!guard.allowed) {
      return { error: guard.reason };
    }

    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return { error: "Campaign not found" };

    if (campaign.status !== "approved") {
      return { error: "Campaign must be approved before launch" };
    }

    const confidenceScore = 90;
    const requiresApproval = confidenceScore < CONFIDENCE_APPROVAL_THRESHOLD || state.autonomyLevel < 2;

    if (requiresApproval && state.autonomyLevel < 2) {
      addDecisionLog({
        actionType: "campaign_launch",
        action: `Requested approval to launch campaign: ${campaign.name}`,
        reasoning: `Campaign ready for launch. Budget: $${campaign.budget.daily}/day. Awaiting human approval.`,
        alternatives: [],
        confidenceScore,
        requiresApproval: true,
        approved: false
      });
      return { requiresApproval: true, error: "Human approval required to launch at this autonomy level" };
    }

    setState(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: "running" as const, startDate: new Date() } : c
      )
    }));

    addDecisionLog({
      actionType: "campaign_launch",
      action: `Launched campaign: ${campaign.name}`,
      reasoning: `Campaign approved and ready. Budget: $${campaign.budget.daily}/day. Expected reach based on channel benchmarks.`,
      alternatives: [],
      confidenceScore,
      requiresApproval: false,
      approved: true
    });

    return { success: true };
  }, [state, addDecisionLog]);

  const pauseCampaign = useCallback((campaignId: string, reason: string): { success?: boolean; error?: string } => {
    const guard = checkActionAllowed(state, "campaign_pause", 0);
    if (!guard.allowed) {
      return { error: guard.reason };
    }

    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return { error: "Campaign not found" };

    setState(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c =>
        c.id === campaignId ? { ...c, status: "paused" as const } : c
      )
    }));

    addDecisionLog({
      actionType: "campaign_pause",
      action: `Paused campaign: ${campaign.name}`,
      reasoning: reason,
      alternatives: [
        { option: "Reduce budget instead", whyRejected: "Pause more effective for investigation" }
      ],
      confidenceScore: 88,
      requiresApproval: false,
      approved: true
    });

    return { success: true };
  }, [state, addDecisionLog]);

  const addLead = useCallback((leadData: Omit<Lead, "id" | "timestamp" | "humanNotified">) => {
    const lead: Lead = {
      ...leadData,
      id: generateId(),
      timestamp: new Date(),
      humanNotified: false
    };

    setState(prev => ({
      ...prev,
      leads: [lead, ...prev.leads]
    }));

    addDecisionLog({
      actionType: "lead_action",
      action: `New lead captured: ${lead.contact.name}`,
      reasoning: `Lead from ${lead.source} with ${lead.intent} intent. Student: ${lead.student.name} (${lead.student.yearLevel})`,
      alternatives: [],
      confidenceScore: 95,
      requiresApproval: false
    });

    return lead;
  }, [addDecisionLog]);

  const markLeadNotified = useCallback((leadId: string) => {
    setState(prev => ({
      ...prev,
      leads: prev.leads.map(l =>
        l.id === leadId ? { ...l, humanNotified: true } : l
      )
    }));
  }, []);

  const updateLeadStatus = useCallback((leadId: string, status: Lead["status"], notes?: string) => {
    setState(prev => ({
      ...prev,
      leads: prev.leads.map(l =>
        l.id === leadId ? { ...l, status, notes: notes || l.notes } : l
      )
    }));
  }, []);

  const addHumanInstruction = useCallback((instruction: Omit<HumanInstruction, "id" | "timestamp">) => {
    const newInstruction: HumanInstruction = {
      ...instruction,
      id: generateId(),
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      humanInstructions: [newInstruction, ...prev.humanInstructions]
    }));

    return newInstruction;
  }, []);

  const updateBudget = useCallback((updates: Partial<BudgetControl>) => {
    const changes = Object.entries(updates)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");
    
    setState(prev => ({
      ...prev,
      budget: { ...prev.budget, ...updates }
    }));

    addDecisionLog({
      actionType: "budget_adjust",
      action: `Budget settings updated`,
      reasoning: `Human adjusted budget parameters: ${changes}`,
      alternatives: [],
      confidenceScore: 100,
      requiresApproval: false,
      approved: true
    });
  }, [addDecisionLog]);

  const simulateSpend = useCallback((amount: number) => {
    setState(prev => {
      const newSpend = prev.budget.currentSpend + amount;
      const percentUsed = (newSpend / prev.budget.monthlyBudget) * 100;
      const alerts = [...prev.budget.alerts];

      if (percentUsed >= prev.budget.alertThreshold && percentUsed < 100) {
        alerts.push({
          timestamp: new Date(),
          type: "warning",
          message: `Budget usage at ${percentUsed.toFixed(0)}% of monthly limit`
        });
      } else if (percentUsed >= 100) {
        alerts.push({
          timestamp: new Date(),
          type: "limit_reached",
          message: "Monthly budget limit reached"
        });
      }

      return {
        ...prev,
        budget: { ...prev.budget, currentSpend: newSpend, alerts }
      };
    });
  }, []);

  const resetAgent = useCallback(() => {
    const newState = getDefaultState();
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  return {
    state,
    autonomyLevels: AUTONOMY_LEVELS,
    changeAutonomyLevel,
    pauseAgent,
    resumeAgent,
    emergencyStop,
    lockAction,
    unlockAction,
    analyzeSituation,
    proposeStrategy,
    approveStrategy,
    createCampaign,
    approveCampaign,
    launchCampaign,
    pauseCampaign,
    addLead,
    markLeadNotified,
    updateLeadStatus,
    addDecisionLog,
    addHumanInstruction,
    updateBudget,
    simulateSpend,
    resetAgent
  };
}
