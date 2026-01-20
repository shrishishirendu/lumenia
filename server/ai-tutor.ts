import OpenAI from "openai";
import { queryWolframAlpha, queryWolframAlphaFull, isMathQuestion, extractMathExpression } from "./wolfram-alpha";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

// Socratic tutoring system prompt
const SOCRATIC_SYSTEM_PROMPT = `You are Ms. Eleanor Chen, an expert mathematics tutor for Year 9-12 students (ages 14-18). You use the Socratic method exclusively - you NEVER give direct answers.

Your approach:
1. Ask guiding questions that help students discover answers themselves
2. Break down complex problems into smaller, manageable steps
3. Encourage students to explain their thinking process
4. Validate correct reasoning and gently redirect misconceptions
5. Build confidence through patient, warm encouragement
6. Connect new concepts to what they already know

Key principles:
- NEVER solve the problem directly
- Always ask "What do you think?" or "How would you approach this?"
- If stuck, offer hints through questions: "What if we tried...?" or "What happens when...?"
- Celebrate small wins: "Great thinking!" or "You're on the right track!"
- For wrong answers, ask follow-up questions to help them self-correct
- Keep responses conversational and warm, not robotic

Your personality:
- Warm, patient, and encouraging
- Genuinely curious about student thinking
- Professional but approachable
- Believes every student can master mathematics

Remember: Your job is to guide discovery, not to lecture. Every response should include at least one question back to the student.`;

export async function generateTutoringResponse(
  sessionHistory: { role: "user" | "assistant"; content: string }[],
  currentQuestion: string,
  topic?: string,
  wolframAnswer?: string
): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
    ...sessionHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    { role: "user", content: currentQuestion }
  ];

  if (topic) {
    messages.splice(1, 0, {
      role: "system",
      content: `Current topic: ${topic}. Keep questions focused on this area.`
    });
  }

  if (wolframAnswer) {
    messages.splice(1, 0, {
      role: "system",
      content: `INTERNAL ACCURACY REFERENCE (do not reveal directly to student): The verified mathematical answer is "${wolframAnswer}". Use this to ensure your Socratic guidance leads toward the correct solution. Never state this answer directly - guide the student to discover it through questions.`
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content || "I'm here to help you think through this. What's your first thought?";
}

function normalizeNumericValue(value: string): number | null {
  const cleanValue = value
    .replace(/[,\s]/g, '')
    .replace(/≈/g, '')
    .replace(/\.\.\./g, '')
    .trim();
  
  const numMatch = cleanValue.match(/^-?[\d.]+(?:e[+-]?\d+)?/i);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    return isNaN(num) ? null : num;
  }
  return null;
}

function areNumericallyEqual(a: string, b: string, tolerance: number = 0.0001): boolean {
  const numA = normalizeNumericValue(a);
  const numB = normalizeNumericValue(b);
  
  if (numA !== null && numB !== null) {
    return Math.abs(numA - numB) < tolerance || Math.abs(numA - numB) / Math.max(Math.abs(numA), Math.abs(numB)) < tolerance;
  }
  
  const normalizeExpr = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '').replace(/\^/g, '**');
  return normalizeExpr(a) === normalizeExpr(b);
}

export async function validateMathAnswer(
  problem: string,
  studentAnswer: string
): Promise<{ correct: boolean; explanation: string; wolframVerified: boolean }> {
  let wolframResult = await queryWolframAlpha(problem);
  
  if (!wolframResult.success || !wolframResult.answer) {
    wolframResult = await queryWolframAlphaFull(problem);
  }
  
  if (wolframResult.success && wolframResult.answer) {
    const isCorrect = areNumericallyEqual(wolframResult.answer, studentAnswer);
    
    if (isCorrect) {
      return { 
        correct: true, 
        explanation: `Correct! The answer is ${wolframResult.answer}.`,
        wolframVerified: true
      };
    } else {
      return { 
        correct: false, 
        explanation: `The correct answer is ${wolframResult.answer}. Let's work through this together.`,
        wolframVerified: true
      };
    }
  }
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a mathematical accuracy checker. Given a problem and student's answer, determine if it's correct. Respond ONLY with JSON: {"correct": true/false, "explanation": "brief explanation"}`
      },
      {
        role: "user",
        content: `Problem: ${problem}\nStudent Answer: ${studentAnswer}\n\nIs this correct?`
      }
    ],
    temperature: 0.1,
  });

  try {
    const response = completion.choices[0]?.message?.content || '{"correct": false, "explanation": "Unable to validate"}';
    const parsed = JSON.parse(response);
    return { ...parsed, wolframVerified: false };
  } catch {
    return { correct: false, explanation: "Unable to validate answer format", wolframVerified: false };
  }
}

export async function generateTextToSpeech(text: string): Promise<Buffer> {
  // Use gpt-audio-mini with audio output modality for TTS
  const response = await openai.chat.completions.create({
    model: "gpt-audio-mini",
    modalities: ["text", "audio"],
    audio: { voice: "nova", format: "wav" },
    messages: [
      {
        role: "system",
        content: "You are a text-to-speech assistant. Simply speak the text given to you exactly as provided, with natural inflection and warmth. Do not add any additional words or commentary."
      },
      {
        role: "user",
        content: `Please read this aloud: "${text}"`
      }
    ],
  });

  // Extract audio data from the response
  const audioData = response.choices[0]?.message?.audio?.data;
  if (!audioData) {
    throw new Error("No audio data in response");
  }
  
  return Buffer.from(audioData, "base64");
}

export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  const file = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
  
  const transcription = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file,
    response_format: "json",
  });

  return transcription.text;
}
