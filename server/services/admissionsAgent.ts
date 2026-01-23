import OpenAI from "openai";
import type { Lead, AdmissionsSettings } from "@shared/schema";
import { tutoringStorage } from "../storage";

const hasOpenAICredentials = !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const openai = hasOpenAICredentials ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
}) : null;

export interface AssessmentResult {
  qualificationScore: number;
  fitScore: number;
  expectationAlignment: "aligned" | "needs_discussion" | "misaligned";
  recommendedAction: "auto_enroll" | "human_review" | "nurture" | "reject";
  reasoning: string;
  aiConfidence: number;
  status: "pending_review" | "auto_qualified" | "auto_rejected";
}

interface AssessmentCriteria {
  yearLevelValid: boolean;
  subjectValid: boolean;
  hasUnrealisticExpectations: boolean;
  expectationKeywordsFound: string[];
}

function checkBasicCriteria(lead: Lead, settings: AdmissionsSettings): AssessmentCriteria {
  const yearLevel = lead.childYearLevel || 0;
  const yearLevelValid = yearLevel >= settings.minYearLevel && yearLevel <= settings.maxYearLevel;
  
  const acceptedSubjects = settings.acceptedSubjects.split(",").map(s => s.trim().toLowerCase());
  const leadSubject = (lead.subjectsInterested || "").toLowerCase();
  const subjectValid = !leadSubject || acceptedSubjects.some(s => leadSubject.includes(s));
  
  const flagKeywords = settings.flagKeywords.split(",").map(k => k.trim().toLowerCase());
  const message = (lead.message || "").toLowerCase();
  const expectationKeywordsFound = flagKeywords.filter(k => message.includes(k));
  const hasUnrealisticExpectations = expectationKeywordsFound.length > 0;
  
  return {
    yearLevelValid,
    subjectValid,
    hasUnrealisticExpectations,
    expectationKeywordsFound
  };
}

function calculateBasicScores(lead: Lead, criteria: AssessmentCriteria): { qualificationScore: number; fitScore: number } {
  let qualificationScore = 50;
  let fitScore = 50;
  
  if (criteria.yearLevelValid) {
    qualificationScore += 20;
    fitScore += 15;
  } else {
    qualificationScore -= 30;
    fitScore -= 20;
  }
  
  if (criteria.subjectValid) {
    qualificationScore += 15;
    fitScore += 10;
  } else {
    qualificationScore -= 20;
    fitScore -= 15;
  }
  
  if (lead.email) {
    qualificationScore += 10;
    fitScore += 5;
  }
  
  if (lead.parentName) {
    qualificationScore += 5;
    fitScore += 5;
  }
  
  if (criteria.hasUnrealisticExpectations) {
    fitScore -= 25;
  }
  
  if (lead.message && lead.message.length > 50) {
    qualificationScore += 5;
    fitScore += 10;
  }
  
  return {
    qualificationScore: Math.max(0, Math.min(100, qualificationScore)),
    fitScore: Math.max(0, Math.min(100, fitScore))
  };
}

export async function assessLead(lead: Lead): Promise<AssessmentResult> {
  let settings = await tutoringStorage.getAdmissionsSettings();
  if (!settings) {
    settings = {
      id: 0,
      autonomyLevel: 1,
      autoQualifyThreshold: 90,
      autoRejectThreshold: 20,
      minYearLevel: 6,
      maxYearLevel: 12,
      acceptedSubjects: "Mathematics,English",
      flagKeywords: "urgent,immediate,quick fix,2 weeks",
      isActive: true,
      updatedAt: new Date()
    };
  }

  const criteria = checkBasicCriteria(lead, settings);
  const basicScores = calculateBasicScores(lead, criteria);

  const prompt = `You are an admissions assessment AI for Lumenia, an educational tutoring platform for Years 6-12 students in Mathematics and English.

Assess this prospective student/parent lead and provide your analysis:

LEAD INFORMATION:
- Parent Name: ${lead.parentName || "Not provided"}
- Parent Email: ${lead.email || "Not provided"}
- Student Year Level: ${lead.childYearLevel || "Not provided"}
- Subject Interest: ${lead.subjectsInterested || "Not provided"}
- Message/Notes: ${lead.message || "No message"}
- Lead Score: ${lead.leadScore || 0}/100
- Source: ${lead.sourceType}
- UTM Campaign: ${lead.utmCampaign || "Direct"}

PLATFORM CRITERIA:
- Accepted Year Levels: ${settings.minYearLevel}-${settings.maxYearLevel}
- Offered Subjects: ${settings.acceptedSubjects}
- Flag Keywords (unrealistic expectations): ${settings.flagKeywords}

PRELIMINARY ANALYSIS:
- Year Level Valid: ${criteria.yearLevelValid ? "Yes" : "No"}
- Subject Valid: ${criteria.subjectValid ? "Yes" : "No"}
- Unrealistic Expectations Detected: ${criteria.hasUnrealisticExpectations ? "Yes - Keywords found: " + criteria.expectationKeywordsFound.join(", ") : "No"}
- Basic Qualification Score: ${basicScores.qualificationScore}/100
- Basic Fit Score: ${basicScores.fitScore}/100

Analyze this lead and respond with a JSON object containing:
{
  "expectationAlignment": "aligned" | "needs_discussion" | "misaligned",
  "reasoning": "Brief 2-3 sentence explanation of your assessment",
  "confidenceAdjustment": number between -20 and +20 to adjust base scores,
  "keyInsights": ["insight1", "insight2"]
}

Focus on:
1. Whether parent/student expectations align with our Socratic learning method
2. Any red flags in the message (unrealistic timelines, misunderstanding of tutoring)
3. Likelihood of successful learning outcomes`;

  if (!openai) {
    const expectationAlignment = criteria.hasUnrealisticExpectations 
      ? "misaligned" as const 
      : (criteria.yearLevelValid && criteria.subjectValid ? "aligned" as const : "needs_discussion" as const);
    
    const recommendedAction = basicScores.qualificationScore >= settings.autoQualifyThreshold 
      ? "auto_enroll" as const
      : basicScores.fitScore < settings.autoRejectThreshold 
        ? "reject" as const
        : "human_review" as const;
    
    let status: "pending_review" | "auto_qualified" | "auto_rejected" = "pending_review";
    if (settings.autonomyLevel >= 2 && basicScores.qualificationScore >= settings.autoQualifyThreshold) {
      status = "auto_qualified";
    } else if (settings.autonomyLevel >= 3 && basicScores.fitScore < settings.autoRejectThreshold) {
      status = "auto_rejected";
    }
    
    return {
      qualificationScore: basicScores.qualificationScore,
      fitScore: basicScores.fitScore,
      expectationAlignment,
      recommendedAction,
      reasoning: "AI analysis unavailable - using heuristic analysis based on criteria matching.",
      aiConfidence: Math.round((basicScores.qualificationScore + basicScores.fitScore) / 2),
      status
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an admissions assessment AI. Respond only with valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const confidenceAdjustment = Math.max(-20, Math.min(20, aiAnalysis.confidenceAdjustment || 0));
    const adjustedQualification = Math.max(0, Math.min(100, basicScores.qualificationScore + confidenceAdjustment));
    const adjustedFit = Math.max(0, Math.min(100, basicScores.fitScore + confidenceAdjustment));

    const aiConfidence = Math.round((adjustedQualification + adjustedFit) / 2);
    
    let status: "pending_review" | "auto_qualified" | "auto_rejected" = "pending_review";
    let recommendedAction: "auto_enroll" | "human_review" | "nurture" | "reject" = "human_review";

    if (settings.autonomyLevel >= 2) {
      if (aiConfidence >= settings.autoQualifyThreshold && aiAnalysis.expectationAlignment === "aligned") {
        status = "auto_qualified";
        recommendedAction = "auto_enroll";
      } else if (adjustedFit <= settings.autoRejectThreshold || !criteria.yearLevelValid) {
        if (settings.autonomyLevel >= 3) {
          status = "auto_rejected";
          recommendedAction = "reject";
        } else {
          recommendedAction = "reject";
        }
      }
    }

    if (aiAnalysis.expectationAlignment === "misaligned") {
      recommendedAction = "nurture";
    } else if (aiAnalysis.expectationAlignment === "needs_discussion") {
      recommendedAction = "human_review";
    }

    const keyInsights = aiAnalysis.keyInsights?.join(". ") || "";
    const reasoning = `${aiAnalysis.reasoning || "Assessment based on provided criteria."} ${keyInsights}`.trim();

    return {
      qualificationScore: adjustedQualification,
      fitScore: adjustedFit,
      expectationAlignment: aiAnalysis.expectationAlignment || "needs_discussion",
      recommendedAction,
      reasoning,
      aiConfidence,
      status
    };

  } catch (error) {
    console.error("[Admissions Agent] AI assessment failed, using basic scoring:", error);
    
    let recommendedAction: "auto_enroll" | "human_review" | "nurture" | "reject" = "human_review";
    let expectationAlignment: "aligned" | "needs_discussion" | "misaligned" = "needs_discussion";

    if (!criteria.yearLevelValid || !criteria.subjectValid) {
      recommendedAction = "reject";
      expectationAlignment = "misaligned";
    } else if (criteria.hasUnrealisticExpectations) {
      recommendedAction = "nurture";
      expectationAlignment = "needs_discussion";
    } else if (basicScores.qualificationScore >= 80 && basicScores.fitScore >= 70) {
      expectationAlignment = "aligned";
    }

    const reasons: string[] = [];
    if (!criteria.yearLevelValid) reasons.push("Year level outside accepted range");
    if (!criteria.subjectValid) reasons.push("Subject not offered");
    if (criteria.hasUnrealisticExpectations) reasons.push(`Unrealistic expectations detected: ${criteria.expectationKeywordsFound.join(", ")}`);
    if (reasons.length === 0) reasons.push("Basic criteria met, recommend human review for final decision");

    return {
      qualificationScore: basicScores.qualificationScore,
      fitScore: basicScores.fitScore,
      expectationAlignment,
      recommendedAction,
      reasoning: reasons.join(". ") + ".",
      aiConfidence: Math.round((basicScores.qualificationScore + basicScores.fitScore) / 2),
      status: "pending_review"
    };
  }
}

export async function assessNewLeads(): Promise<{ assessed: number; errors: number }> {
  const settings = await tutoringStorage.getAdmissionsSettings();
  if (!settings?.isActive) {
    return { assessed: 0, errors: 0 };
  }

  const { leads } = await tutoringStorage.getLeadsByFilter({ status: "NEW", limit: 50 });
  let assessed = 0;
  let errors = 0;

  for (const lead of leads) {
    const existing = await tutoringStorage.getAdmissionsAssessmentByLead(lead.id);
    if (existing) continue;

    try {
      const result = await assessLead(lead);
      await tutoringStorage.createAdmissionsAssessment({
        leadId: lead.id,
        ...result
      });
      
      await tutoringStorage.addLeadEvent({
        leadId: lead.id,
        type: "ai_assessment",
        actor: "ai",
        description: `Auto-assessed: ${result.recommendedAction} (confidence: ${result.aiConfidence}%)`,
        metadata: JSON.stringify(result)
      });

      assessed++;
    } catch (error) {
      console.error(`[Admissions Agent] Failed to assess lead ${lead.id}:`, error);
      errors++;
    }
  }

  return { assessed, errors };
}
