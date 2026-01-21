export interface BrandVoice {
  toneGuidelines: string;
  forbiddenClaims: string[];
  requiredDisclaimers: string[];
}

export interface ChannelConfig {
  enabled: boolean;
  allowedActions: ("draft" | "schedule" | "publish")[];
  optInRequired?: boolean;
}

export interface MarketingPolicy {
  id: string;
  version: number;
  updatedAt: Date;
  updatedBy: string;
  
  systemPrompt: string;
  
  brandVoice: BrandVoice;
  
  autonomy: {
    level: 0 | 1 | 2 | 3;
    confidenceThreshold: number;
    requireApprovalForNewStrategy: boolean;
  };
  
  budget: {
    monthlyCap: number;
    dailyCap: number;
    currency: string;
    alertThresholdPct: number;
  };
  
  channels: {
    googleAds: ChannelConfig;
    metaAds: ChannelConfig;
    email: ChannelConfig;
    smsWhatsapp: ChannelConfig;
    organicSocial: ChannelConfig;
    websiteLanding: ChannelConfig;
  };
  
  capacityGuardrails: {
    maxNewStudentsPerWeek: number;
    maxTutorUtilizationPct: number;
  };
  
  outcomeGuardrails: {
    min2WeekRetentionPct: number;
    maxComplaintRatePct: number;
  };
  
  aiControls: {
    modelName: string;
    maxTokens: number;
    maxProposalsPerHour: number;
    timeoutMs: number;
    emergencyStopEnabled: boolean;
  };
}

export interface MarketingStrategyMemory {
  id: string;
  updatedAt: Date;
  currentThesis: string;
  targetSegments: string[];
  messageAngles: string[];
  whatWorked: string[];
  whatFailed: string[];
  seasonalityNotes: string[];
}

export interface SituationSnapshot {
  capacity: {
    currentStudents: number;
    maxCapacity: number;
    utilizationPct: number;
    weeklySlots: number;
  };
  outcomes: {
    retentionRate2Week: number;
    complaintRate: number;
    npsScore: number;
  };
  funnel: {
    leadsThisWeek: number;
    trialsThisWeek: number;
    conversionsThisWeek: number;
    estimatedCPA: number;
  };
}

export interface CampaignDraft {
  id: string;
  type: "meta_ad" | "google_search_ad" | "email_sequence" | "organic_post" | "landing_copy";
  title: string;
  primaryText: string;
  variants: { headline: string; body: string }[];
  creativePrompt: string;
  cta: string;
  complianceChecklist: {
    noGuarantees: boolean;
    noManipulativeUrgency: boolean;
    privacyOK: boolean;
  };
}

export interface BudgetPlan {
  recommendedDailySpend: number;
  recommendedMonthlySpend: number;
  allocationByChannel: {
    channel: string;
    amount: number;
    percentage: number;
  }[];
}

export interface DecisionLogEntry {
  what: string;
  why: string;
  alternatives: { option: string; whyRejected: string }[];
  confidence: number;
  autonomyLevel: number;
}

export interface MarketingProposal {
  id: string;
  createdAt: Date;
  createdBy: "ai" | "human";
  status: "draft" | "in_review" | "approved" | "rejected" | "archived";
  parentProposalId?: string;
  
  intentNarrative: string;
  
  situationSnapshot: SituationSnapshot;
  
  strategy: {
    segment: string;
    messageAngle: string;
    channels: string[];
    timeline: string;
    assumptions: string[];
  };
  
  campaignDrafts: CampaignDraft[];
  
  budgetPlan: BudgetPlan;
  
  risksAndSafeguards: {
    risks: string[];
    stopConditions: string[];
  };
  
  decisionLogEntry: DecisionLogEntry;
  
  humanRequests: {
    approvalsNeeded: string[];
    questions: string[];
  };
  
  humanFeedback?: {
    approvedBy?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
    edits?: string;
  };
}

export interface MarketingDecisionLogItem {
  id: string;
  timestamp: Date;
  actionType: "proposal_created" | "policy_changed" | "proposal_approved" | "proposal_rejected" | "proposal_archived" | "emergency_stop" | "ai_call";
  details: {
    proposalId?: string;
    policyVersion?: number;
    description: string;
    trigger?: string;
    reasoning?: string;
    alternatives?: string[];
  };
  autonomyLevelAtTime: number;
  confidence?: number;
  userId?: string;
}

export interface IntentNarrative {
  headline: string;
  whyNow: string[];
  assumptions: string[];
  stopConditions: string[];
}

export interface PolicyVersion {
  version: number;
  savedAt: Date;
  policy: MarketingPolicy;
}

const STORAGE_KEYS = {
  POLICY: "marketing_policy",
  POLICY_HISTORY: "marketing_policy_history",
  STRATEGY_MEMORY: "marketing_strategy_memory",
  PROPOSALS: "marketing_proposals",
  DECISION_LOG: "marketing_decision_log",
  RATE_LIMIT: "marketing_rate_limit"
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const DEFAULT_SYSTEM_PROMPT = `You are the Marketing Agent for Virtual Human Tutor, an AI-powered K-12 tutoring platform for Australian students (Years 6-12) focusing on Mathematics and English.

ROLE: You are a Growth Strategist, not an ad bot. You propose marketing strategies that balance:
- Learning quality and student outcomes
- Capacity limits and tutor availability
- Brand ethics and compliance
- Budget efficiency

CONSTRAINTS:
- Never make claims about guaranteed results
- Never use manipulative urgency tactics
- Always respect privacy requirements
- Align messaging with calm, encouraging brand voice
- Consider capacity before recommending acquisition campaigns

OUTPUT: Always provide structured proposals with:
1. Clear intent narrative (what you're trying to achieve)
2. Strategy rationale (why this approach)
3. Campaign drafts with compliance checklists
4. Budget allocation recommendations
5. Risks and stop conditions
6. Confidence score and alternatives considered

Remember: In Phase 1, you only PROPOSE. Humans approve before any action.`;

export const getDefaultPolicy = (): MarketingPolicy => ({
  id: generateId(),
  version: 1,
  updatedAt: new Date(),
  updatedBy: "system",
  
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  
  brandVoice: {
    toneGuidelines: "Calm, encouraging, supportive. Focus on student growth and confidence rather than competitive rankings or pressure.",
    forbiddenClaims: [
      "Guaranteed results",
      "Best tutoring in Australia",
      "Your child will definitely improve",
      "Limited spots remaining (false urgency)",
      "Other tutoring services are inferior"
    ],
    requiredDisclaimers: [
      "Results may vary based on individual effort",
      "Free trial available - no commitment required"
    ]
  },
  
  autonomy: {
    level: 0,
    confidenceThreshold: 70,
    requireApprovalForNewStrategy: true
  },
  
  budget: {
    monthlyCap: 5000,
    dailyCap: 200,
    currency: "AUD",
    alertThresholdPct: 80
  },
  
  channels: {
    googleAds: { enabled: true, allowedActions: ["draft"] },
    metaAds: { enabled: true, allowedActions: ["draft"] },
    email: { enabled: true, allowedActions: ["draft"] },
    smsWhatsapp: { enabled: false, allowedActions: ["draft"], optInRequired: true },
    organicSocial: { enabled: true, allowedActions: ["draft"] },
    websiteLanding: { enabled: true, allowedActions: ["draft"] }
  },
  
  capacityGuardrails: {
    maxNewStudentsPerWeek: 20,
    maxTutorUtilizationPct: 85
  },
  
  outcomeGuardrails: {
    min2WeekRetentionPct: 75,
    maxComplaintRatePct: 5
  },
  
  aiControls: {
    modelName: "gpt-4o-mini",
    maxTokens: 4000,
    maxProposalsPerHour: 5,
    timeoutMs: 30000,
    emergencyStopEnabled: false
  }
});

export const getDefaultStrategyMemory = (): MarketingStrategyMemory => ({
  id: generateId(),
  updatedAt: new Date(),
  currentThesis: "Focus on parents of Year 10-12 students preparing for HSC, emphasizing personalized AI tutoring that adapts to each student's learning pace.",
  targetSegments: [
    "Parents of Year 10-12 students",
    "Students struggling with math confidence",
    "Families seeking flexible tutoring schedules"
  ],
  messageAngles: [
    "Build confidence before exams",
    "Personalized AI that adapts to your child",
    "Learn at your own pace, no pressure"
  ],
  whatWorked: [
    "Free trial offers with no commitment",
    "Parent testimonials about reduced stress",
    "Focus on confidence vs performance"
  ],
  whatFailed: [
    "Discount-heavy messaging (attracted low-quality leads)",
    "Comparison to other tutoring services",
    "Urgency-based CTAs"
  ],
  seasonalityNotes: [
    "Q1: Back to school - high intent",
    "Q2: Mid-year assessments - moderate",
    "Q3: Trial exams - high urgency",
    "Q4: HSC prep - peak demand"
  ]
});

export const getMockSituationSnapshot = (): SituationSnapshot => ({
  capacity: {
    currentStudents: 67,
    maxCapacity: 100,
    utilizationPct: 67,
    weeklySlots: 8
  },
  outcomes: {
    retentionRate2Week: 82,
    complaintRate: 2.1,
    npsScore: 72
  },
  funnel: {
    leadsThisWeek: 24,
    trialsThisWeek: 8,
    conversionsThisWeek: 3,
    estimatedCPA: 45
  }
});

export class MarketingAgentStorage {
  loadPolicy(): MarketingPolicy {
    const stored = localStorage.getItem(STORAGE_KEYS.POLICY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, updatedAt: new Date(parsed.updatedAt) };
      } catch {
        return getDefaultPolicy();
      }
    }
    return getDefaultPolicy();
  }

  savePolicy(policy: MarketingPolicy, userId: string): MarketingPolicy {
    const history = this.loadPolicyHistory();
    const currentPolicy = this.loadPolicy();
    
    if (history.length >= 5) {
      history.shift();
    }
    history.push({
      version: currentPolicy.version,
      savedAt: new Date(),
      policy: currentPolicy
    });
    localStorage.setItem(STORAGE_KEYS.POLICY_HISTORY, JSON.stringify(history));
    
    const updated: MarketingPolicy = {
      ...policy,
      version: currentPolicy.version + 1,
      updatedAt: new Date(),
      updatedBy: userId
    };
    localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(updated));
    
    this.addDecisionLog({
      actionType: "policy_changed",
      details: {
        policyVersion: updated.version,
        description: `Policy updated to version ${updated.version}`
      },
      autonomyLevelAtTime: updated.autonomy.level,
      userId
    });
    
    return updated;
  }

  loadPolicyHistory(): PolicyVersion[] {
    const stored = localStorage.getItem(STORAGE_KEYS.POLICY_HISTORY);
    if (stored) {
      try {
        return JSON.parse(stored).map((v: any) => ({
          ...v,
          savedAt: new Date(v.savedAt),
          policy: { ...v.policy, updatedAt: new Date(v.policy.updatedAt) }
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  restorePolicy(version: number): MarketingPolicy | null {
    const history = this.loadPolicyHistory();
    const found = history.find(h => h.version === version);
    if (found) {
      localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(found.policy));
      return found.policy;
    }
    return null;
  }

  resetPolicyToDefault(userId: string): MarketingPolicy {
    const defaultPolicy = getDefaultPolicy();
    return this.savePolicy(defaultPolicy, userId);
  }

  loadStrategyMemory(): MarketingStrategyMemory {
    const stored = localStorage.getItem(STORAGE_KEYS.STRATEGY_MEMORY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, updatedAt: new Date(parsed.updatedAt) };
      } catch {
        return getDefaultStrategyMemory();
      }
    }
    return getDefaultStrategyMemory();
  }

  saveStrategyMemory(memory: MarketingStrategyMemory): MarketingStrategyMemory {
    const updated = { ...memory, updatedAt: new Date() };
    localStorage.setItem(STORAGE_KEYS.STRATEGY_MEMORY, JSON.stringify(updated));
    return updated;
  }

  loadProposals(): MarketingProposal[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
    if (stored) {
      try {
        return JSON.parse(stored).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          humanFeedback: p.humanFeedback ? {
            ...p.humanFeedback,
            approvedAt: p.humanFeedback.approvedAt ? new Date(p.humanFeedback.approvedAt) : undefined,
            rejectedAt: p.humanFeedback.rejectedAt ? new Date(p.humanFeedback.rejectedAt) : undefined
          } : undefined
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  saveProposal(proposal: MarketingProposal): MarketingProposal {
    const proposals = this.loadProposals();
    const existingIndex = proposals.findIndex(p => p.id === proposal.id);
    if (existingIndex >= 0) {
      proposals[existingIndex] = proposal;
    } else {
      proposals.unshift(proposal);
    }
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
    return proposal;
  }

  createProposal(proposalData: Omit<MarketingProposal, "id" | "createdAt">): MarketingProposal {
    const proposal: MarketingProposal = {
      ...proposalData,
      id: generateId(),
      createdAt: new Date()
    };
    this.saveProposal(proposal);
    
    this.addDecisionLog({
      actionType: "proposal_created",
      details: {
        proposalId: proposal.id,
        description: `New proposal created: ${proposal.intentNarrative.substring(0, 100)}...`,
        trigger: proposalData.createdBy === "ai" ? "AI generation" : "Human creation",
        reasoning: proposal.decisionLogEntry.why
      },
      autonomyLevelAtTime: proposal.decisionLogEntry.autonomyLevel,
      confidence: proposal.decisionLogEntry.confidence
    });
    
    return proposal;
  }

  approveProposal(proposalId: string, userId: string): MarketingProposal | null {
    const proposals = this.loadProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return null;
    
    proposal.status = "approved";
    proposal.humanFeedback = {
      ...proposal.humanFeedback,
      approvedBy: userId,
      approvedAt: new Date()
    };
    this.saveProposal(proposal);
    
    this.addDecisionLog({
      actionType: "proposal_approved",
      details: {
        proposalId,
        description: `Proposal approved by ${userId}`
      },
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      userId
    });
    
    return proposal;
  }

  rejectProposal(proposalId: string, userId: string, reason: string): MarketingProposal | null {
    const proposals = this.loadProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return null;
    
    proposal.status = "rejected";
    proposal.humanFeedback = {
      ...proposal.humanFeedback,
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionReason: reason
    };
    this.saveProposal(proposal);
    
    this.addDecisionLog({
      actionType: "proposal_rejected",
      details: {
        proposalId,
        description: `Proposal rejected: ${reason}`
      },
      autonomyLevelAtTime: this.loadPolicy().autonomy.level,
      userId
    });
    
    return proposal;
  }

  archiveProposal(proposalId: string): MarketingProposal | null {
    const proposals = this.loadProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return null;
    
    proposal.status = "archived";
    this.saveProposal(proposal);
    
    this.addDecisionLog({
      actionType: "proposal_archived",
      details: {
        proposalId,
        description: "Proposal archived"
      },
      autonomyLevelAtTime: this.loadPolicy().autonomy.level
    });
    
    return proposal;
  }

  duplicateProposal(proposalId: string, userId: string): MarketingProposal | null {
    const proposals = this.loadProposals();
    const original = proposals.find(p => p.id === proposalId);
    if (!original) return null;
    
    const duplicate: MarketingProposal = {
      ...original,
      id: generateId(),
      createdAt: new Date(),
      createdBy: "human",
      status: "draft",
      parentProposalId: original.id,
      humanFeedback: undefined
    };
    
    return this.createProposal(duplicate);
  }

  loadDecisionLog(): MarketingDecisionLogItem[] {
    const stored = localStorage.getItem(STORAGE_KEYS.DECISION_LOG);
    if (stored) {
      try {
        return JSON.parse(stored).map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  addDecisionLog(entry: Omit<MarketingDecisionLogItem, "id" | "timestamp">): MarketingDecisionLogItem {
    const logs = this.loadDecisionLog();
    const newEntry: MarketingDecisionLogItem = {
      ...entry,
      id: generateId(),
      timestamp: new Date()
    };
    logs.unshift(newEntry);
    if (logs.length > 100) {
      logs.pop();
    }
    localStorage.setItem(STORAGE_KEYS.DECISION_LOG, JSON.stringify(logs));
    return newEntry;
  }

  checkRateLimit(): { allowed: boolean; remaining: number; resetAt: Date } {
    const policy = this.loadPolicy();
    const maxPerHour = policy.aiControls.maxProposalsPerHour;
    
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
    let rateData = { count: 0, resetAt: new Date(Date.now() + 3600000).toISOString() };
    
    if (stored) {
      try {
        rateData = JSON.parse(stored);
        if (new Date(rateData.resetAt) < new Date()) {
          rateData = { count: 0, resetAt: new Date(Date.now() + 3600000).toISOString() };
        }
      } catch {
        // Reset on error
      }
    }
    
    return {
      allowed: rateData.count < maxPerHour,
      remaining: Math.max(0, maxPerHour - rateData.count),
      resetAt: new Date(rateData.resetAt)
    };
  }

  incrementRateLimit(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
    let rateData = { count: 0, resetAt: new Date(Date.now() + 3600000).toISOString() };
    
    if (stored) {
      try {
        rateData = JSON.parse(stored);
        if (new Date(rateData.resetAt) < new Date()) {
          rateData = { count: 0, resetAt: new Date(Date.now() + 3600000).toISOString() };
        }
      } catch {
        // Reset on error
      }
    }
    
    rateData.count++;
    localStorage.setItem(STORAGE_KEYS.RATE_LIMIT, JSON.stringify(rateData));
  }

  setEmergencyStop(enabled: boolean, userId: string): void {
    const policy = this.loadPolicy();
    policy.aiControls.emergencyStopEnabled = enabled;
    this.savePolicy(policy, userId);
    
    if (enabled) {
      this.addDecisionLog({
        actionType: "emergency_stop",
        details: {
          description: "Emergency stop activated - AI calls disabled"
        },
        autonomyLevelAtTime: policy.autonomy.level,
        userId
      });
    }
  }
}

export const marketingStorage = new MarketingAgentStorage();
