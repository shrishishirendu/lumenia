import OpenAI from "openai";
import { queryWolframAlpha, queryWolframAlphaFull, isMathQuestion, extractMathExpression } from "./wolfram-alpha";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

import type { WhiteboardContent, WhiteboardBlock } from "../shared/whiteboard-types";

// Teaching style type
type TeachingStyle = "socratic" | "direct";

// Socratic tutoring system prompts for different subjects
const MATH_SOCRATIC_PROMPT = `You are Ms. Eleanor Chen, an expert mathematics tutor for Year 6-12 students (ages 11-18) following the Australian Curriculum. You use the Socratic method exclusively - you NEVER give direct answers.

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

const ENGLISH_SOCRATIC_PROMPT = `You are Mr. James Mitchell, a warm and literary-minded British English teacher for Year 6-12 students (ages 11-18) following the Australian Curriculum. You specialize in the three strands: Language, Literature, and Literacy. You use the Socratic method exclusively - you guide students to discover correct answers themselves.

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

const MATH_DIRECT_PROMPT = `You are Ms. Eleanor Chen, an expert mathematics tutor for Year 6-12 students (ages 11-18) following the Australian Curriculum. You teach directly by explaining concepts clearly and showing step-by-step solutions.

Your approach:
1. Explain concepts clearly with examples
2. Show step-by-step solutions to problems
3. Use visual representations when helpful (describe diagrams, graphs)
4. Provide worked examples before practice problems
5. Summarize key points at the end

Key principles:
- Explain the "why" behind each step
- Use clear, simple language appropriate for the student's level
- Provide multiple examples when helpful
- Connect concepts to real-world applications
- End with a summary or key takeaways

Your personality:
- Clear and articulate
- Patient and thorough
- Encouraging and supportive
- Makes math feel accessible and logical`;

const ENGLISH_DIRECT_PROMPT = `You are Mr. James Mitchell, a warm and literary-minded British English teacher for Year 6-12 students (ages 11-18) following the Australian Curriculum. You teach directly by explaining concepts clearly and providing examples.

Your approach for English:
1. Explain grammar rules clearly with examples
2. Demonstrate writing techniques with model sentences
3. Analyze texts step-by-step, pointing out key features
4. Provide clear explanations of literary devices
5. Show how to structure different types of writing

Key principles:
- Give clear explanations with examples
- Show model sentences and paragraphs
- Explain the "why" behind grammar rules
- Provide templates and structures for writing
- Use excerpts from literature to illustrate points

Australian Curriculum English focuses on:
- Language: Text structure, grammar, vocabulary, visual language
- Literature: Responding to literature, examining literature, creating literature
- Literacy: Reading, writing, speaking, listening

Your personality:
- Clear and articulate with a gentle British manner
- Passionate about literature and language
- Makes English feel accessible and enjoyable
- Provides helpful examples and models`;

function getSystemPrompt(subject: string, teachingStyle: TeachingStyle = "socratic"): string {
  if (subject === "english") {
    return teachingStyle === "direct" ? ENGLISH_DIRECT_PROMPT : ENGLISH_SOCRATIC_PROMPT;
  }
  return teachingStyle === "direct" ? MATH_DIRECT_PROMPT : MATH_SOCRATIC_PROMPT;
}

export async function generateTutoringResponse(
  sessionHistory: { role: "user" | "assistant"; content: string }[],
  currentQuestion: string,
  topic?: string,
  wolframAnswer?: string,
  subject: string = "math",
  teachingStyle: TeachingStyle = "socratic"
): Promise<string> {
  const systemPrompt = getSystemPrompt(subject, teachingStyle);
  
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

export async function analyzeStudentDrawing(
  imageData: string,
  subject: string = "math",
  context: string = ""
): Promise<{ interpretation: string; workAnalysis: string }> {
  const subjectContext = subject === "english" 
    ? "The student is working on English/writing. Look for written text, diagrams, essay outlines, or notes."
    : "The student is working on mathematics. Look for equations, calculations, graphs, or mathematical notation.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert tutor analyzing a student's handwritten work. ${subjectContext}

Your job is to:
1. Interpret what the student has written or drawn
2. Identify the problem they're working on
3. Analyze their work for correctness
4. Note any errors or misconceptions

Respond with JSON: {"interpretation": "what the student wrote/drew", "workAnalysis": "analysis of their work, any errors, and what they might need help with"}`
      },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: context ? `Context: ${context}\n\nPlease analyze this student's handwritten work:` : "Please analyze this student's handwritten work:"
          },
          {
            type: "image_url",
            image_url: { url: imageData }
          }
        ]
      }
    ],
    max_tokens: 1000,
  });

  try {
    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { interpretation: content, workAnalysis: "Unable to parse analysis" };
  } catch {
    return { 
      interpretation: response.choices[0]?.message?.content || "Unable to interpret",
      workAnalysis: "Analysis parsing error"
    };
  }
}

export async function confirmStudentDoubt(
  question: string,
  subject: string = "math"
): Promise<string> {
  const tutorName = subject === "english" ? "Mr. James Mitchell" : "Ms. Eleanor Chen";
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are ${tutorName}, a warm and supportive tutor. A student has asked a question. Your job is to briefly confirm your understanding of what they're asking before helping them. This shows you're listening and ensures you understand correctly.

Be natural and brief - just 1-2 sentences to rephrase their question and confirm. End with a question like "Is that right?" or "Have I understood correctly?"`
      },
      {
        role: "user",
        content: question
      }
    ],
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content || `I understand you're asking about ${question}. Is that correct?`;
}
