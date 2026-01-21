import type { MarketingPolicy, MarketingStrategyMemory, SituationSnapshot, IntentNarrative } from "./marketingAgentModels";

interface GenerateIntentParams {
  policy: MarketingPolicy;
  strategyMemory: MarketingStrategyMemory;
  situationSnapshot: SituationSnapshot;
  recentPerformance?: {
    leadsLastWeek: number;
    conversionsLastWeek: number;
    avgCPA: number;
  };
}

export function generateIntentNarrative(params: GenerateIntentParams): IntentNarrative {
  const { policy, strategyMemory, situationSnapshot, recentPerformance } = params;
  const { capacity, outcomes, funnel } = situationSnapshot;

  const isHighRisk = 
    outcomes.retentionRate2Week < policy.outcomeGuardrails.min2WeekRetentionPct ||
    outcomes.complaintRate > policy.outcomeGuardrails.maxComplaintRatePct;

  const isAtCapacity = 
    capacity.utilizationPct >= policy.capacityGuardrails.maxTutorUtilizationPct;

  const enabledChannels = Object.entries(policy.channels)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => formatChannelName(name));

  const primarySegment = strategyMemory.targetSegments[0] || "prospective families";
  const primaryAngle = strategyMemory.messageAngles[0] || "personalized learning";

  const estimatedCPA = funnel.estimatedCPA || 50;
  const budgetBasedMax = Math.floor(policy.budget.dailyCap * 7 / estimatedCPA);
  const capacityBasedMax = capacity.weeklySlots;
  const riskFactor = isHighRisk ? 0.3 : 1;

  const maxNewStudents = Math.min(
    budgetBasedMax,
    capacityBasedMax,
    policy.capacityGuardrails.maxNewStudentsPerWeek
  );
  const conservativeTarget = Math.floor(maxNewStudents * riskFactor);
  const minTarget = Math.max(1, Math.floor(conservativeTarget * 0.5));
  const maxTarget = conservativeTarget;

  let headline: string;
  let whyNow: string[];
  let assumptions: string[];
  let stopConditions: string[];

  if (isHighRisk) {
    headline = `Stabilize outcomes and pause scaling this week. Focus on retention and student success while keeping complaint rate below ${policy.outcomeGuardrails.maxComplaintRatePct}%.`;
    
    whyNow = [
      `Retention rate (${outcomes.retentionRate2Week}%) is below target (${policy.outcomeGuardrails.min2WeekRetentionPct}%)`,
      `Complaint rate (${outcomes.complaintRate}%) needs attention`,
      "Prioritizing quality over growth until metrics stabilize",
      "Nurturing existing students builds stronger foundations for future growth"
    ];

    assumptions = [
      "Current students need more engagement support",
      "Pausing acquisition will free resources for retention",
      "Educational content campaigns will improve sentiment",
      "2-3 weeks needed to see retention improvements"
    ];

    stopConditions = [
      "Resume acquisition when 2-week retention exceeds 80%",
      "Resume if complaint rate drops below 3%",
      "Emergency: pause all if NPS drops below 50"
    ];
  } else if (isAtCapacity) {
    headline = `Maintain brand presence with minimal spend this week. Tutor utilization at ${capacity.utilizationPct}% - focus on waitlist building rather than immediate conversions.`;
    
    whyNow = [
      `Tutor capacity is ${capacity.utilizationPct}% utilized (threshold: ${policy.capacityGuardrails.maxTutorUtilizationPct}%)`,
      "Adding students now would strain quality",
      "Building waitlist maintains pipeline for when capacity opens",
      "Brand awareness campaigns keep us top-of-mind"
    ];

    assumptions = [
      "Capacity will open within 2-4 weeks",
      "Waitlist converts at 40-50% when contacted",
      "Brand campaigns have delayed but valuable effect"
    ];

    stopConditions = [
      "Resume acquisition when utilization drops below 75%",
      "Pause brand spend if no capacity opens in 4 weeks",
      "Redirect budget to retention if churn increases"
    ];
  } else {
    headline = `Acquire ${minTarget}–${maxTarget} ${primarySegment} this week using "${primaryAngle}" messaging via ${enabledChannels.slice(0, 2).join(" & ")}, while keeping CPA below $${estimatedCPA * 1.2} and retention above ${policy.outcomeGuardrails.min2WeekRetentionPct}%.`;
    
    whyNow = [
      `Capacity available: ${capacity.weeklySlots} slots this week`,
      `Current utilization (${capacity.utilizationPct}%) allows growth`,
      `Retention healthy at ${outcomes.retentionRate2Week}%`,
      recentPerformance 
        ? `Recent performance: ${recentPerformance.conversionsLastWeek} conversions at $${recentPerformance.avgCPA} CPA`
        : `Estimated CPA: $${estimatedCPA} based on funnel data`
    ];

    assumptions = [
      `Target segment (${primarySegment}) responds to "${primaryAngle}" messaging`,
      `Budget of $${policy.budget.dailyCap}/day supports ${minTarget}-${maxTarget} new students`,
      strategyMemory.whatWorked[0] ? `"${strategyMemory.whatWorked[0]}" continues to perform` : "Current strategy remains effective",
      "Market conditions stable for this audience"
    ];

    stopConditions = [
      `Pause if CPA exceeds $${Math.floor(estimatedCPA * 1.5)}`,
      `Pause if 2-week retention drops below ${policy.outcomeGuardrails.min2WeekRetentionPct}%`,
      `Pause if tutor utilization exceeds ${policy.capacityGuardrails.maxTutorUtilizationPct}%`,
      `Pause if complaint rate exceeds ${policy.outcomeGuardrails.maxComplaintRatePct}%`,
      "Emergency stop if any compliance violation detected"
    ];
  }

  return {
    headline,
    whyNow,
    assumptions,
    stopConditions
  };
}

function formatChannelName(key: string): string {
  const names: Record<string, string> = {
    googleAds: "Google Ads",
    metaAds: "Meta Ads",
    email: "Email",
    smsWhatsapp: "SMS/WhatsApp",
    organicSocial: "Organic Social",
    websiteLanding: "Website"
  };
  return names[key] || key;
}

export function generateProposalObjective(situationSnapshot: SituationSnapshot, policy: MarketingPolicy): string {
  const { capacity, outcomes } = situationSnapshot;
  
  if (outcomes.retentionRate2Week < policy.outcomeGuardrails.min2WeekRetentionPct) {
    return "nurture";
  }
  if (outcomes.complaintRate > policy.outcomeGuardrails.maxComplaintRatePct) {
    return "brand_trust";
  }
  if (capacity.utilizationPct >= policy.capacityGuardrails.maxTutorUtilizationPct) {
    return "brand_trust";
  }
  return "acquisition";
}
