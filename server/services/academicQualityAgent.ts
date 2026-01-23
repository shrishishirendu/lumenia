import OpenAI from "openai";
import type { AcademicQualitySettings, Profile } from "@shared/schema";
import { tutoringStorage } from "../storage";

const hasOpenAICredentials = !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const openai = hasOpenAICredentials ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
}) : null;

export interface StudentAnalysisResult {
  status: "healthy" | "needs_attention" | "at_risk" | "critical";
  overallScore: number;
  alerts: AlertRecommendation[];
  insights: string[];
  recommendations: string[];
  aiConfidence: number;
}

export interface AlertRecommendation {
  alertType: "low_mastery" | "declining_progress" | "low_engagement" | "struggling_topic" | "at_risk" | "improvement_opportunity";
  severity: "low" | "medium" | "high" | "critical";
  subject?: string;
  topic?: string;
  metric: string;
  currentValue: number;
  threshold: number;
  trend?: string;
  recommendation: string;
  reasoning: string;
}

interface PerformanceData {
  avgMasteryLevel: number;
  completionRate: number;
  engagementScore: number;
  lastActivityDate: Date | null;
  subjectBreakdown: { subject: string; mastery: number; sessions: number }[];
}

function determineBasicAlerts(
  performance: PerformanceData,
  settings: AcademicQualitySettings
): AlertRecommendation[] {
  const alerts: AlertRecommendation[] = [];

  if (performance.avgMasteryLevel < settings.masteryThreshold) {
    const severity = performance.avgMasteryLevel < 30 ? "critical" 
      : performance.avgMasteryLevel < 45 ? "high" 
      : "medium";
    
    alerts.push({
      alertType: "low_mastery",
      severity,
      metric: "mastery_level",
      currentValue: performance.avgMasteryLevel,
      threshold: settings.masteryThreshold,
      recommendation: `Student needs additional support to improve mastery level from ${performance.avgMasteryLevel}% to at least ${settings.masteryThreshold}%.`,
      reasoning: `Average mastery level (${performance.avgMasteryLevel}%) is below the threshold of ${settings.masteryThreshold}%.`
    });
  }

  if (performance.engagementScore < settings.engagementThreshold) {
    const daysSinceActivity = performance.lastActivityDate 
      ? Math.floor((Date.now() - performance.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const severity = daysSinceActivity > 14 ? "high" : "medium";
    
    alerts.push({
      alertType: "low_engagement",
      severity,
      metric: "engagement_score",
      currentValue: performance.engagementScore,
      threshold: settings.engagementThreshold,
      trend: daysSinceActivity > 7 ? "declining" : "stagnant",
      recommendation: `Student hasn't been active for ${daysSinceActivity} days. Consider reaching out to re-engage.`,
      reasoning: `Engagement score (${performance.engagementScore}%) is below threshold of ${settings.engagementThreshold}%.`
    });
  }

  for (const subject of performance.subjectBreakdown) {
    if (subject.mastery < settings.masteryThreshold - 20) {
      alerts.push({
        alertType: "struggling_topic",
        severity: subject.mastery < 30 ? "high" : "medium",
        subject: subject.subject,
        metric: "subject_mastery",
        currentValue: subject.mastery,
        threshold: settings.masteryThreshold,
        recommendation: `Focus additional tutoring on ${subject.subject} where mastery is only ${subject.mastery}%.`,
        reasoning: `Subject-specific mastery for ${subject.subject} (${subject.mastery}%) is significantly below threshold.`
      });
    }
  }

  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high").length;
  if (criticalAlerts >= 2 || (performance.avgMasteryLevel < 35 && performance.engagementScore < 30)) {
    alerts.push({
      alertType: "at_risk",
      severity: "critical",
      metric: "overall_risk",
      currentValue: Math.min(performance.avgMasteryLevel, performance.engagementScore),
      threshold: settings.masteryThreshold,
      recommendation: "Immediate intervention required. Consider scheduling a parent conference and adjusting the learning plan.",
      reasoning: "Multiple critical indicators suggest this student needs immediate attention."
    });
  }

  return alerts;
}

async function getAIEnhancedAnalysis(
  profile: Profile,
  performance: PerformanceData,
  basicAlerts: AlertRecommendation[],
  settings: AcademicQualitySettings
): Promise<{ insights: string[]; recommendations: string[]; confidence: number }> {
  if (!openai) {
    return {
      insights: ["AI analysis unavailable - using heuristic analysis."],
      recommendations: basicAlerts.length > 0 
        ? ["Review the alerts and take appropriate action based on thresholds."]
        : ["Student performance appears within acceptable parameters."],
      confidence: 60
    };
  }

  try {
    const prompt = `You are an educational AI assistant analyzing student performance data. Provide insights and recommendations.

Student Profile:
- Grade Level: Year ${profile.grade || "Unknown"}
- Role: ${profile.role}

Performance Metrics:
- Average Mastery Level: ${performance.avgMasteryLevel}%
- Completion Rate: ${performance.completionRate}%
- Engagement Score: ${performance.engagementScore}%
- Days Since Last Activity: ${performance.lastActivityDate 
  ? Math.floor((Date.now() - performance.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
  : "Never active"}

Subject Breakdown:
${performance.subjectBreakdown.map(s => `- ${s.subject}: ${s.mastery}% mastery, ${s.sessions} sessions`).join("\n")}

Current Alerts Detected:
${basicAlerts.map(a => `- ${a.alertType} (${a.severity}): ${a.reasoning}`).join("\n") || "No alerts"}

Settings Thresholds:
- Mastery Threshold: ${settings.masteryThreshold}%
- Engagement Threshold: ${settings.engagementThreshold}%

Please provide:
1. 2-3 key insights about this student's learning journey
2. 2-3 specific, actionable recommendations for intervention

Respond in JSON format:
{
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": 85
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 70
    };
  } catch (error) {
    console.error("[Academic Quality Agent] AI analysis error:", error);
    return {
      insights: ["Unable to generate AI insights at this time."],
      recommendations: ["Review student performance manually."],
      confidence: 50
    };
  }
}

export async function analyzeStudent(studentId: number): Promise<StudentAnalysisResult> {
  let settings = await tutoringStorage.getAcademicQualitySettings();
  if (!settings) {
    settings = {
      id: 0,
      autonomyLevel: 1,
      masteryThreshold: 60,
      engagementThreshold: 40,
      progressDeclineThreshold: 15,
      inactivityDays: 7,
      autoNotifyParent: false,
      autoNotifyTutor: true,
      scanFrequency: "daily",
      isActive: true,
      updatedAt: new Date()
    };
  }

  const profile = await tutoringStorage.getProfileById(studentId);
  if (!profile) {
    throw new Error(`Student profile not found: ${studentId}`);
  }

  const performance = await tutoringStorage.getStudentPerformanceMetrics(studentId);
  const basicAlerts = determineBasicAlerts(performance, settings);

  let status: StudentAnalysisResult["status"] = "healthy";
  if (basicAlerts.some(a => a.alertType === "at_risk")) {
    status = "critical";
  } else if (basicAlerts.some(a => a.severity === "high")) {
    status = "at_risk";
  } else if (basicAlerts.length > 0) {
    status = "needs_attention";
  }

  const overallScore = Math.round(
    (performance.avgMasteryLevel * 0.4) +
    (performance.completionRate * 0.3) +
    (performance.engagementScore * 0.3)
  );

  const aiAnalysis = await getAIEnhancedAnalysis(profile, performance, basicAlerts, settings);

  return {
    status,
    overallScore,
    alerts: basicAlerts,
    insights: aiAnalysis.insights,
    recommendations: aiAnalysis.recommendations,
    aiConfidence: aiAnalysis.confidence
  };
}

export async function scanAllStudents(): Promise<{
  scannedCount: number;
  alertsCreated: number;
  atRiskStudents: number[];
}> {
  const settings = await tutoringStorage.getAcademicQualitySettings();
  if (!settings?.isActive) {
    return { scannedCount: 0, alertsCreated: 0, atRiskStudents: [] };
  }

  const students = await tutoringStorage.getProfilesByRole("student");
  let alertsCreated = 0;
  const atRiskStudents: number[] = [];

  for (const student of students) {
    try {
      const analysis = await analyzeStudent(student.id);
      
      if (analysis.status === "critical" || analysis.status === "at_risk") {
        atRiskStudents.push(student.id);
      }

      for (const alert of analysis.alerts) {
        const existingAlerts = await tutoringStorage.getAcademicAlertsByStudent(student.id);
        const hasActiveAlert = existingAlerts.some(
          e => e.alertType === alert.alertType && 
               e.status === "active" && 
               e.subject === alert.subject
        );

        if (!hasActiveAlert) {
          await tutoringStorage.createAcademicAlert({
            studentId: student.id,
            alertType: alert.alertType,
            severity: alert.severity,
            subject: alert.subject,
            topic: alert.topic,
            metric: alert.metric,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            trend: alert.trend,
            recommendation: alert.recommendation,
            reasoning: alert.reasoning,
            aiConfidence: analysis.aiConfidence,
            status: "active"
          });
          alertsCreated++;
        }
      }
    } catch (error) {
      console.error(`[Academic Quality Agent] Error scanning student ${student.id}:`, error);
    }
  }

  return {
    scannedCount: students.length,
    alertsCreated,
    atRiskStudents
  };
}
