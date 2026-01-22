import { Router, type Request, type Response } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { requireAdmin } from "../middleware/roleAuth";

const router = Router();

router.use(requireAdmin);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_PROPOSALS_PER_HOUR = 10;
let globalEmergencyStop = false;

const PolicySchema = z.object({
  systemPrompt: z.string().min(10),
  brandVoice: z.object({
    toneGuidelines: z.string(),
    forbiddenClaims: z.array(z.string()),
    requiredDisclaimers: z.array(z.string())
  }),
  autonomy: z.object({
    level: z.number().min(0).max(3),
    confidenceThreshold: z.number().min(0).max(100),
    requireApprovalForNewStrategy: z.boolean()
  }),
  budget: z.object({
    monthlyCap: z.number().min(0),
    dailyCap: z.number().min(0),
    currency: z.string(),
    alertThresholdPct: z.number()
  }),
  capacityGuardrails: z.object({
    maxNewStudentsPerWeek: z.number(),
    maxTutorUtilizationPct: z.number()
  }),
  outcomeGuardrails: z.object({
    min2WeekRetentionPct: z.number(),
    maxComplaintRatePct: z.number()
  }),
  aiControls: z.object({
    modelName: z.string(),
    maxTokens: z.number().max(8000),
    maxProposalsPerHour: z.number().max(20),
    timeoutMs: z.number().max(60000),
    emergencyStopEnabled: z.boolean()
  })
}).passthrough();

const AIProposalResponseSchema = z.object({
  intentNarrative: z.string(),
  strategy: z.object({
    segment: z.string(),
    messageAngle: z.string(),
    channels: z.array(z.string()),
    timeline: z.string(),
    assumptions: z.array(z.string())
  }),
  campaignDrafts: z.array(z.object({
    type: z.string(),
    title: z.string(),
    primaryText: z.string(),
    variants: z.array(z.object({ headline: z.string(), body: z.string() })).optional().default([]),
    creativePrompt: z.string().optional().default(""),
    cta: z.string(),
    complianceChecklist: z.object({
      noGuarantees: z.boolean(),
      noManipulativeUrgency: z.boolean(),
      privacyOK: z.boolean()
    })
  })).default([]),
  budgetPlan: z.object({
    recommendedDailySpend: z.number(),
    recommendedMonthlySpend: z.number(),
    allocationByChannel: z.array(z.object({
      channel: z.string(),
      amount: z.number(),
      percentage: z.number()
    }))
  }),
  risksAndSafeguards: z.object({
    risks: z.array(z.string()),
    stopConditions: z.array(z.string())
  }),
  decisionLogEntry: z.object({
    what: z.string(),
    why: z.string(),
    alternatives: z.array(z.object({ option: z.string(), whyRejected: z.string() })),
    confidence: z.number()
  }),
  humanRequests: z.object({
    approvalsNeeded: z.array(z.string()),
    questions: z.array(z.string())
  }).optional().default({ approvalsNeeded: [], questions: [] })
});

const ProposalRequestSchema = z.object({
  objective: z.enum(["acquisition", "nurture", "re_engage", "brand_trust"]).optional().default("acquisition"),
  notesFromHuman: z.string().optional().default(""),
  timeWindow: z.enum(["week", "month"]).optional().default("week"),
  systemPrompt: z.string().min(10),
  policy: PolicySchema,
  strategyMemory: z.object({
    currentThesis: z.string(),
    targetSegments: z.array(z.string()),
    messageAngles: z.array(z.string()),
    whatWorked: z.array(z.string()),
    whatFailed: z.array(z.string()),
    seasonalityNotes: z.array(z.string())
  }).passthrough(),
  situationSnapshot: z.object({
    capacity: z.object({
      currentStudents: z.number(),
      maxCapacity: z.number(),
      utilizationPct: z.number(),
      weeklySlots: z.number()
    }),
    outcomes: z.object({
      retentionRate2Week: z.number(),
      complaintRate: z.number(),
      npsScore: z.number()
    }),
    funnel: z.object({
      leadsThisWeek: z.number(),
      trialsThisWeek: z.number(),
      conversionsThisWeek: z.number(),
      estimatedCPA: z.number()
    })
  }),
  intentNarrative: z.object({
    headline: z.string(),
    whyNow: z.array(z.string()),
    assumptions: z.array(z.string()),
    stopConditions: z.array(z.string())
  }).optional()
});

function checkServerRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || userLimit.resetAt < now) {
    rateLimitStore.set(userId, { count: 0, resetAt: now + 3600000 });
  }
  
  const currentLimit = rateLimitStore.get(userId)!;
  return {
    allowed: currentLimit.count < MAX_PROPOSALS_PER_HOUR,
    remaining: Math.max(0, MAX_PROPOSALS_PER_HOUR - currentLimit.count),
    resetAt: new Date(currentLimit.resetAt)
  };
}

function incrementServerRateLimit(userId: string): void {
  const limit = rateLimitStore.get(userId);
  if (limit) {
    limit.count++;
  }
}

router.post("/emergency-stop", (req: Request, res: Response) => {
  const { enabled } = req.body;
  globalEmergencyStop = !!enabled;
  res.json({ emergencyStopEnabled: globalEmergencyStop });
});

router.get("/emergency-stop", (req: Request, res: Response) => {
  res.json({ emergencyStopEnabled: globalEmergencyStop });
});

const PROPOSAL_SCHEMA = `{
  "intentNarrative": "string - concise description of the marketing intent",
  "strategy": {
    "segment": "string - target audience segment",
    "messageAngle": "string - primary messaging approach",
    "channels": ["array of channel names"],
    "timeline": "string - execution timeline",
    "assumptions": ["array of key assumptions"]
  },
  "campaignDrafts": [
    {
      "type": "meta_ad|google_search_ad|email_sequence|organic_post|landing_copy",
      "title": "string - campaign title",
      "primaryText": "string - main ad/email copy",
      "variants": [{"headline": "string", "body": "string"}],
      "creativePrompt": "string - description for image/video generation",
      "cta": "string - call to action text",
      "complianceChecklist": {
        "noGuarantees": true,
        "noManipulativeUrgency": true,
        "privacyOK": true
      }
    }
  ],
  "budgetPlan": {
    "recommendedDailySpend": number,
    "recommendedMonthlySpend": number,
    "allocationByChannel": [
      {"channel": "string", "amount": number, "percentage": number}
    ]
  },
  "risksAndSafeguards": {
    "risks": ["array of identified risks"],
    "stopConditions": ["array of conditions to pause campaign"]
  },
  "decisionLogEntry": {
    "what": "string - what action is proposed",
    "why": "string - reasoning for this proposal",
    "alternatives": [{"option": "string", "whyRejected": "string"}],
    "confidence": number (0-100)
  },
  "humanRequests": {
    "approvalsNeeded": ["array of items needing approval"],
    "questions": ["array of questions for human"]
  }
}`;

router.post("/proposals/generate", async (req: Request, res: Response) => {
  try {
    if (globalEmergencyStop) {
      return res.status(403).json({ 
        error: "Server emergency stop is active. AI proposal generation is disabled." 
      });
    }

    const parseResult = ProposalRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request format",
        details: parseResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).slice(0, 5)
      });
    }

    const { 
      objective,
      notesFromHuman,
      timeWindow,
      systemPrompt,
      policy,
      strategyMemory,
      situationSnapshot,
      intentNarrative
    } = parseResult.data;

    if (policy.aiControls.emergencyStopEnabled) {
      return res.status(403).json({ 
        error: "Emergency stop is active. AI proposal generation is disabled." 
      });
    }

    const userId = (req as any).user?.email || "anonymous";
    const rateLimit = checkServerRateLimit(userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        remaining: 0,
        resetAt: rateLimit.resetAt.toISOString()
      });
    }

    const prompt = buildProposalPrompt({
      objective,
      notesFromHuman,
      timeWindow,
      systemPrompt,
      policy,
      strategyMemory,
      situationSnapshot,
      intentNarrative
    });

    const maxTokens = policy?.aiControls?.maxTokens || 4000;
    const modelName = policy?.aiControls?.modelName || "gpt-4o-mini";
    const timeoutMs = policy?.aiControls?.timeoutMs || 30000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      clearTimeout(timeout);

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        return res.status(500).json({ error: "Empty response from AI" });
      }

      let rawProposal;
      try {
        rawProposal = JSON.parse(responseText);
      } catch (parseError) {
        return res.status(500).json({ 
          error: "Failed to parse AI response as JSON",
          rawResponse: responseText.substring(0, 500)
        });
      }

      const validationResult = AIProposalResponseSchema.safeParse(rawProposal);
      let proposal;
      
      if (!validationResult.success) {
        console.warn("AI response validation failed, applying defaults:", validationResult.error.issues.slice(0, 3));
        proposal = {
          intentNarrative: rawProposal.intentNarrative || intentNarrative?.headline || "Proposal generated",
          strategy: rawProposal.strategy || { segment: "Unknown", messageAngle: "Unknown", channels: [], timeline: "This week", assumptions: [] },
          campaignDrafts: (rawProposal.campaignDrafts || []).map((draft: any) => ({
            ...draft,
            variants: draft.variants || [],
            creativePrompt: draft.creativePrompt || "",
            complianceChecklist: {
              noGuarantees: draft.complianceChecklist?.noGuarantees ?? true,
              noManipulativeUrgency: draft.complianceChecklist?.noManipulativeUrgency ?? true,
              privacyOK: draft.complianceChecklist?.privacyOK ?? true
            }
          })),
          budgetPlan: rawProposal.budgetPlan || { recommendedDailySpend: 0, recommendedMonthlySpend: 0, allocationByChannel: [] },
          risksAndSafeguards: rawProposal.risksAndSafeguards || { risks: [], stopConditions: [] },
          decisionLogEntry: {
            what: rawProposal.decisionLogEntry?.what || "Generate proposal",
            why: rawProposal.decisionLogEntry?.why || "AI-generated proposal",
            alternatives: rawProposal.decisionLogEntry?.alternatives || [],
            confidence: rawProposal.decisionLogEntry?.confidence || 50,
            autonomyLevel: policy.autonomy.level
          },
          humanRequests: rawProposal.humanRequests || { approvalsNeeded: [], questions: [] }
        };
      } else {
        proposal = {
          ...validationResult.data,
          decisionLogEntry: {
            ...validationResult.data.decisionLogEntry,
            autonomyLevel: policy.autonomy.level
          }
        };
      }

      for (const draft of proposal.campaignDrafts) {
        if (!draft.complianceChecklist.noGuarantees || 
            !draft.complianceChecklist.noManipulativeUrgency || 
            !draft.complianceChecklist.privacyOK) {
          console.warn("PHASE 1 COMPLIANCE CHECK: Campaign draft flagged non-compliant:", draft.title);
        }
      }

      incrementServerRateLimit(userId);

      res.json({
        success: true,
        proposal,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
          model: modelName
        },
        rateLimit: {
          remaining: checkServerRateLimit(userId).remaining
        }
      });
    } catch (aiError: any) {
      clearTimeout(timeout);
      if (aiError.name === "AbortError") {
        return res.status(408).json({ error: "AI request timed out" });
      }
      throw aiError;
    }
  } catch (error: any) {
    console.error("Error generating proposal:", error);
    res.status(500).json({ 
      error: "Failed to generate proposal",
      details: error.message 
    });
  }
});

router.post("/proposals/generate-mock", async (req: Request, res: Response) => {
  try {
    const body = req.body as ProposalGenerationRequest;
    const { objective = "acquisition", policy, situationSnapshot, intentNarrative } = body;

    const mockProposal = generateMockProposal(objective, policy, situationSnapshot, intentNarrative);
    
    res.json({
      success: true,
      proposal: mockProposal,
      usage: { mock: true }
    });
  } catch (error: any) {
    console.error("Error generating mock proposal:", error);
    res.status(500).json({ error: "Failed to generate mock proposal" });
  }
});

function buildProposalPrompt(params: ProposalGenerationRequest): string {
  const { objective, notesFromHuman, timeWindow, policy, strategyMemory, situationSnapshot, intentNarrative } = params;

  return `You are generating a marketing proposal for an AI tutoring platform.

CURRENT INTENT:
${intentNarrative?.headline || "Generate acquisition strategy"}

WHY NOW:
${intentNarrative?.whyNow?.join("\n- ") || "Standard planning cycle"}

OBJECTIVE: ${objective}
TIME WINDOW: ${timeWindow}

SITUATION SNAPSHOT:
- Current Students: ${situationSnapshot?.capacity?.currentStudents || "N/A"}
- Capacity Utilization: ${situationSnapshot?.capacity?.utilizationPct || "N/A"}%
- 2-Week Retention: ${situationSnapshot?.outcomes?.retentionRate2Week || "N/A"}%
- Complaint Rate: ${situationSnapshot?.outcomes?.complaintRate || "N/A"}%
- Leads This Week: ${situationSnapshot?.funnel?.leadsThisWeek || "N/A"}
- Estimated CPA: $${situationSnapshot?.funnel?.estimatedCPA || "N/A"}

STRATEGY MEMORY:
- Current Thesis: ${strategyMemory?.currentThesis || "N/A"}
- Target Segments: ${strategyMemory?.targetSegments?.join(", ") || "N/A"}
- Message Angles: ${strategyMemory?.messageAngles?.join(", ") || "N/A"}
- What Worked: ${strategyMemory?.whatWorked?.join(", ") || "N/A"}
- What Failed: ${strategyMemory?.whatFailed?.join(", ") || "N/A"}

POLICY CONSTRAINTS:
- Brand Voice: ${policy?.brandVoice?.toneGuidelines || "N/A"}
- Forbidden Claims: ${policy?.brandVoice?.forbiddenClaims?.join(", ") || "None"}
- Budget Cap: $${policy?.budget?.dailyCap || "N/A"}/day, $${policy?.budget?.monthlyCap || "N/A"}/month
- Max New Students/Week: ${policy?.capacityGuardrails?.maxNewStudentsPerWeek || "N/A"}
- Min Retention Target: ${policy?.outcomeGuardrails?.min2WeekRetentionPct || "N/A"}%

ENABLED CHANNELS:
${Object.entries(policy?.channels || {})
  .filter(([_, v]: [string, any]) => v?.enabled)
  .map(([k]) => `- ${k}`)
  .join("\n")}

HUMAN NOTES:
${notesFromHuman || "None provided"}

IMPORTANT:
- This is Phase 1: PROPOSE ONLY. Do not assume any action will be taken without human approval.
- Include compliance checklist for each campaign draft.
- Provide confidence score (0-100) based on data quality and strategy fit.
- List alternatives you considered and why you rejected them.
- Keep budget recommendations within policy limits.

OUTPUT: Respond with valid JSON matching this exact schema:
${PROPOSAL_SCHEMA}

Remember: No guaranteed results claims, no manipulative urgency, privacy-compliant only.`;
}

function generateMockProposal(objective: string, policy: any, situationSnapshot: any, intentNarrative: any): any {
  const isAcquisition = objective === "acquisition";
  const dailyBudget = Math.min(policy?.budget?.dailyCap || 200, 150);
  
  return {
    intentNarrative: intentNarrative?.headline || "Acquire new students through targeted campaigns",
    strategy: {
      segment: "Parents of Year 10-12 students",
      messageAngle: isAcquisition ? "Build confidence before exams" : "Support your child's learning journey",
      channels: ["Meta Ads", "Email", "Organic Social"],
      timeline: "This week",
      assumptions: [
        "Target audience is active on social media",
        "Exam season increases intent",
        "Current messaging resonates with parents"
      ]
    },
    campaignDrafts: [
      {
        id: `draft_${Date.now()}`,
        type: "meta_ad",
        title: "HSC Math Confidence Campaign",
        primaryText: "Is your Year 12 struggling with HSC Math? Our AI tutor adapts to their learning style, building confidence one concept at a time. No pressure, just progress.",
        variants: [
          { headline: "Build Math Confidence", body: "Personalized AI tutoring that adapts to your child" },
          { headline: "HSC Math Made Easier", body: "Learn at your own pace with patient AI support" }
        ],
        creativePrompt: "A calm, supportive image showing a student looking confident while studying math, with soft lighting and encouraging atmosphere. No stressed expressions.",
        cta: "Start Free Trial",
        complianceChecklist: {
          noGuarantees: true,
          noManipulativeUrgency: true,
          privacyOK: true
        }
      },
      {
        id: `draft_${Date.now() + 1}`,
        type: "email_sequence",
        title: "Trial Welcome Sequence",
        primaryText: "Welcome to Virtual Human Tutor! Your child's personalized learning journey begins today. Our AI tutors, Ms. Eleanor Chen (Math) and Mr. James Mitchell (English), are ready to help.",
        variants: [
          { headline: "Your Learning Journey Starts Here", body: "Discover how AI-powered tutoring works" }
        ],
        creativePrompt: "Friendly welcome email design with warm colors and clear next steps",
        cta: "Start First Session",
        complianceChecklist: {
          noGuarantees: true,
          noManipulativeUrgency: true,
          privacyOK: true
        }
      }
    ],
    budgetPlan: {
      recommendedDailySpend: dailyBudget,
      recommendedMonthlySpend: dailyBudget * 30,
      allocationByChannel: [
        { channel: "Meta Ads", amount: dailyBudget * 0.5, percentage: 50 },
        { channel: "Google Ads", amount: dailyBudget * 0.3, percentage: 30 },
        { channel: "Email", amount: dailyBudget * 0.2, percentage: 20 }
      ]
    },
    risksAndSafeguards: {
      risks: [
        "Market competition during exam season",
        "Ad fatigue if creative not refreshed",
        "CPA may increase as campaign scales"
      ],
      stopConditions: [
        "Pause if CPA exceeds $75",
        "Pause if complaint rate exceeds 5%",
        "Pause if retention drops below 75%"
      ]
    },
    decisionLogEntry: {
      what: `Generate ${objective} campaign proposal for this week`,
      why: "Current capacity allows for growth while maintaining quality standards. Retention metrics are healthy.",
      alternatives: [
        { option: "Aggressive scaling campaign", whyRejected: "Risk of quality degradation" },
        { option: "Pause all marketing", whyRejected: "Capacity available and metrics healthy" }
      ],
      confidence: 78,
      autonomyLevel: policy?.autonomy?.level || 0
    },
    humanRequests: {
      approvalsNeeded: [
        "Review and approve campaign creative",
        "Confirm budget allocation",
        "Verify compliance checklist"
      ],
      questions: [
        "Any specific messaging to emphasize this week?",
        "Are there capacity constraints we should know about?"
      ]
    }
  };
}

export default router;
