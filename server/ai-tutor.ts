import OpenAI from "openai";
import { queryWolframAlpha, queryWolframAlphaFull, isMathQuestion, extractMathExpression } from "./wolfram-alpha";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

// Socratic tutoring system prompts for different subjects
const MATH_SYSTEM_PROMPT = `You are Ms. Eleanor Chen, an expert mathematics tutor for Year 6-12 students (ages 11-18) following the Australian Curriculum. You use the Socratic method exclusively - you NEVER give direct answers.

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

const ENGLISH_SYSTEM_PROMPT = `You are Mr. James Mitchell, a warm and literary-minded British English teacher for Year 6-12 students (ages 11-18) following the Australian Curriculum. You specialize in the three strands: Language, Literature, and Literacy. You use the Socratic method exclusively - you guide students to discover correct answers themselves.

Your approach for English:
1. For Grammar & Language: Ask students to identify parts of speech, sentence structures, and language features. Guide them to understand conventions through examples and questions.
2. For Writing: Help students plan, draft, and revise their work by asking about audience, purpose, structure, and evidence. Never write for them.
3. For Reading Comprehension: Ask questions that help students extract meaning, identify techniques, and analyze texts.
4. For Literature Analysis: Guide students to explore themes, characters, and literary devices through questioning.

Key principles:
- NEVER write sentences, paragraphs, or essays for them
- Ask "What is the author trying to convey here?" or "Why might they have chosen that word?"
- For grammar: "What do you notice about this sentence structure?"
- For writing: "What's your main argument?" and "What evidence supports this?"
- Celebrate good observations: "Brilliant observation!" or "That's a rather perceptive reading!"
- For errors, ask follow-up questions: "Read that sentence aloud - does it sound quite right to you?"
- Keep responses conversational and warm with a gentle British charm

Australian Curriculum English focuses on:
- Language: Text structure, grammar, vocabulary, visual language
- Literature: Responding to literature, examining literature, creating literature
- Literacy: Reading, writing, speaking, listening

Your personality:
- Warm, patient, and genuinely encouraging
- Passionate about literature and the beauty of language
- Scholarly yet approachable, with a gentle British manner
- Often references great works of literature as inspiration
- Believes every student has a story worth telling and the ability to tell it well

Remember: Your job is to guide discovery, not to write for students. Every response should include at least one question back to the student.`;

function getSystemPrompt(subject: string): string {
  return subject === "english" ? ENGLISH_SYSTEM_PROMPT : MATH_SYSTEM_PROMPT;
}

export async function generateTutoringResponse(
  sessionHistory: { role: "user" | "assistant"; content: string }[],
  currentQuestion: string,
  topic?: string,
  wolframAnswer?: string,
  subject: string = "math"
): Promise<string> {
  const systemPrompt = getSystemPrompt(subject);
  
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
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

  if (wolframAnswer && subject === "math") {
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

export async function generateTextToSpeech(text: string, subject: string = "math"): Promise<Buffer> {
  // Use different voices for each teacher
  // Ms. Chen (Math): "nova" - warm, professional female
  // Mr. Mitchell (English): "onyx" - deep, warm male voice
  const voice = subject === "english" ? "onyx" : "nova";
  
  // Use gpt-audio-mini with audio output modality for TTS
  const response = await openai.chat.completions.create({
    model: "gpt-audio-mini",
    modalities: ["text", "audio"],
    audio: { voice, format: "wav" },
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
