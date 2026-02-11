import OpenAI from "openai";
import type { QuizQuestion } from "@shared/schema";

const hasOpenAICredentials = !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const openai = hasOpenAICredentials
  ? new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;

export interface VariantQuestion {
  id: string;
  isVariant: true;
  sourceQuestionId: number;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  points: number;
  topicId: number | null;
  subjectId: number | null;
  lessonId: number | null;
}

interface RawVariant {
  questionText: string;
  correctAnswer: string;
  explanation: string;
}

function validateVariant(
  source: QuizQuestion,
  variant: RawVariant
): boolean {
  if (
    !variant.questionText ||
    !variant.correctAnswer ||
    !variant.explanation
  ) {
    return false;
  }

  if (variant.questionText.trim() === source.questionText.trim()) {
    return false;
  }

  if (variant.questionText.length < 8 || variant.questionText.length > 500) {
    return false;
  }

  if (variant.explanation.length < 10) {
    return false;
  }

  const sourceNums = source.questionText.match(/-?\d+/g) || [];
  const variantNums = variant.questionText.match(/-?\d+/g) || [];
  if (sourceNums.length > 0 && variantNums.length === 0) {
    return false;
  }

  if (
    sourceNums.length > 0 &&
    variantNums.length > 0 &&
    sourceNums.join(",") === variantNums.join(",")
  ) {
    return false;
  }

  return true;
}

export async function generateVariant(
  source: QuizQuestion
): Promise<VariantQuestion | null> {
  if (!openai) {
    return null;
  }

  try {
    const isWordProblem = source.questionText.length > 60 && !source.questionText.startsWith("Solve:");

    let prompt: string;
    if (isWordProblem) {
      prompt = `You are a Year 9 Mathematics question writer for the Australian Curriculum.

Given this word problem:
"${source.questionText}"
Correct answer: ${source.correctAnswer}
Difficulty level: ${source.difficulty}/5

Create ONE new word problem that:
- Uses a DIFFERENT real-world context (different scenario, different objects)
- Requires the SAME mathematical structure (same type of equation to solve)
- Has DIFFERENT numbers that produce a clean integer answer
- Is Year 9 appropriate
- Has difficulty ${source.difficulty}/5

Respond ONLY with valid JSON:
{"questionText": "...", "correctAnswer": "x = <number>", "explanation": "Step 1: ... Step 2: ... etc."}`;
    } else {
      prompt = `You are a Year 9 Mathematics question writer for the Australian Curriculum.

Given this equation:
"${source.questionText}"
Correct answer: ${source.correctAnswer}
Difficulty level: ${source.difficulty}/5

Create ONE new equation that:
- Has the SAME structural form (same operations, same number of steps)
- Uses DIFFERENT numbers (coefficients and constants must change)
- Produces a clean integer answer (no fractions or decimals)
- Keeps difficulty at level ${source.difficulty}/5
- Starts with "Solve: " if the original does

Respond ONLY with valid JSON:
{"questionText": "...", "correctAnswer": "x = <number>", "explanation": "Step 1: ... Step 2: ... etc."}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate math question variants. Respond ONLY with a single JSON object. No markdown, no code fences, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed: RawVariant = JSON.parse(cleaned);

    if (!validateVariant(source, parsed)) {
      console.log(
        `[VariantGenerator] Validation failed for source q${source.id}: variant text="${parsed.questionText?.substring(0, 40)}..."`
      );
      return null;
    }

    return {
      id: `variant-${source.id}-${Date.now()}`,
      isVariant: true,
      sourceQuestionId: source.id,
      questionText: parsed.questionText,
      questionType: source.questionType,
      options: source.options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      difficulty: source.difficulty,
      points: source.points,
      topicId: source.topicId,
      subjectId: source.subjectId,
      lessonId: source.lessonId,
    };
  } catch (error) {
    console.error(
      `[VariantGenerator] Error generating variant for q${source.id}:`,
      error
    );
    return null;
  }
}

export async function generateVariants(
  sources: QuizQuestion[],
  count: number
): Promise<VariantQuestion[]> {
  if (!openai || sources.length === 0 || count <= 0) {
    return [];
  }

  const selected = sources.length <= count
    ? sources
    : shuffleArray(sources).slice(0, count);

  const results = await Promise.allSettled(
    selected.map((q) => generateVariant(q))
  );

  const variants: VariantQuestion[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      variants.push(result.value);
    }
  }

  console.log(
    `[VariantGenerator] Generated ${variants.length}/${selected.length} variants successfully`
  );
  return variants;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
