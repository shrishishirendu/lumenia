import OpenAI from "openai";

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
  topic?: string
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content || "I'm here to help you think through this. What's your first thought?";
}

export async function validateMathAnswer(
  problem: string,
  studentAnswer: string
): Promise<{ correct: boolean; explanation: string }> {
  // Use GPT to validate mathematical correctness
  // In production, you'd integrate WolframAlpha API here
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
    return JSON.parse(response);
  } catch {
    return { correct: false, explanation: "Unable to validate answer format" };
  }
}

export async function generateTextToSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova", // Warm, professional female voice
    input: text,
    speed: 1.0,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
  
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  return transcription.text;
}
