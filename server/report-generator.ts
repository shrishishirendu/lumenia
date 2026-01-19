import { tutoringStorage } from "./storage";
import { generateTextToSpeech } from "./ai-tutor";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

export async function generateParentReport(studentId: number): Promise<string> {
  // Get student progress data
  const progressData = await tutoringStorage.getProgressByStudent(studentId);
  
  // Generate personalized report using GPT
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are Ms. Eleanor Chen, a warm and encouraging math tutor. Write a brief, personalized video script (2-3 sentences) for parents about their child's progress. Be specific, positive, and include actionable next steps. Address the parent directly.`
      },
      {
        role: "user",
        content: `Student progress data: ${JSON.stringify(progressData)}. Write a parent update.`
      }
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  const reportText = completion.choices[0]?.message?.content || "Your child is making great progress!";
  
  // Store the report
  await tutoringStorage.createParentReport({
    studentId,
    reportType: "session_summary",
    content: reportText,
  });

  return reportText;
}

export async function generateProgressSummary(studentId: number): Promise<{
  totalSessions: number;
  topicsLearned: string[];
  masteryAverage: number;
  nextSteps: string[];
}> {
  const progressData = await tutoringStorage.getProgressByStudent(studentId);

  const totalSessions = progressData.reduce((sum, p) => sum + p.problemsAttempted, 0);
  const topicsLearned = progressData.map(p => p.topic);
  const masteryAverage = progressData.length > 0 
    ? Math.round(progressData.reduce((sum, p) => sum + p.masteryLevel, 0) / progressData.length)
    : 0;

  const nextSteps = progressData
    .filter(p => p.masteryLevel < 70)
    .slice(0, 3)
    .map(p => `Continue practicing ${p.topic}`);

  return {
    totalSessions,
    topicsLearned,
    masteryAverage,
    nextSteps: nextSteps.length > 0 ? nextSteps : ["Keep up the great work!"]
  };
}
