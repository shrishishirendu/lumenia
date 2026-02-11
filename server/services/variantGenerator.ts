import OpenAI from "openai";
import type { QuizQuestion } from "@shared/schema";
import {
  getRulesForDifficulty,
  validateAgainstRules,
  type DifficultyRule,
} from "./variantRules";

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

function extractStructure(text: string): string {
  return text
    .replace(/"[^"]*"/g, "WORD_PROBLEM")
    .replace(/-?\d+(\.\d+)?/g, "N")
    .replace(/\s+/g, " ")
    .trim();
}

function verifyAnswer(questionText: string, claimedAnswer: string): boolean {
  const answerMatch = claimedAnswer.match(/x\s*=\s*(-?\d+)/);
  if (!answerMatch) return true;

  const x = parseInt(answerMatch[1]);
  const eqMatch = questionText.match(/^Solve:\s*(.+)$/i);
  if (!eqMatch) return true;

  const equation = eqMatch[1].trim();
  const sides = equation.split("=");
  if (sides.length !== 2) return true;

  try {
    const evalSide = (expr: string): number | null => {
      let s = expr.trim();
      s = s.replace(/(\d)\(/g, "$1*(");
      s = s.replace(/\)(\d)/g, ")*$1");
      s = s.replace(/\)\(/g, ")*(");
      s = s.replace(/−/g, "-");
      s = s.replace(/x/gi, `(${x})`);
      s = s.replace(/÷/g, "/");
      s = s.replace(/×/g, "*");
      s = s.replace(/[^0-9+\-*/().]/g, "");
      if (!s || s.length > 100) return null;
      try {
        const result = Function(`"use strict"; return (${s})`)();
        return typeof result === "number" && isFinite(result) ? result : null;
      } catch {
        return null;
      }
    };

    const left = evalSide(sides[0]);
    const right = evalSide(sides[1]);
    if (left !== null && right !== null) {
      return Math.abs(left - right) < 0.001;
    }
  } catch {}

  return true;
}

function validateVariant(
  source: QuizQuestion,
  variant: RawVariant,
  rule: DifficultyRule | null,
  topicSlug: string | null
): { valid: boolean; reason: string } {
  if (!variant.questionText || !variant.correctAnswer || !variant.explanation) {
    return { valid: false, reason: "Missing required fields" };
  }

  if (variant.questionText.trim() === source.questionText.trim()) {
    return { valid: false, reason: "Identical to source" };
  }

  if (variant.questionText.length < 8 || variant.questionText.length > 500) {
    return { valid: false, reason: `Text length ${variant.questionText.length} out of range` };
  }

  if (variant.explanation.length < 10) {
    return { valid: false, reason: "Explanation too short" };
  }

  const sourceNums = source.questionText.match(/-?\d+/g) || [];
  const variantNums = variant.questionText.match(/-?\d+/g) || [];
  if (sourceNums.length > 0 && variantNums.length === 0) {
    return { valid: false, reason: "Variant has no numbers" };
  }

  if (
    sourceNums.length > 0 &&
    variantNums.length > 0 &&
    sourceNums.join(",") === variantNums.join(",")
  ) {
    return { valid: false, reason: "Numbers unchanged from source" };
  }

  const isEquation = source.questionText.startsWith("Solve:");
  if (isEquation) {
    const sourceStruct = extractStructure(source.questionText);
    const variantStruct = extractStructure(variant.questionText);
    const sourceOps = sourceStruct.match(/[+\-*/()=]/g) || [];
    const variantOps = variantStruct.match(/[+\-*/()=]/g) || [];
    if (Math.abs(sourceOps.length - variantOps.length) > 2) {
      return { valid: false, reason: "Structural mismatch (operator count)" };
    }
  }

  if (isEquation && !verifyAnswer(variant.questionText, variant.correctAnswer)) {
    return { valid: false, reason: "Answer verification failed (equation check)" };
  }

  if (rule) {
    const ruleCheck = validateAgainstRules(variant.questionText, variant.correctAnswer, rule);
    if (!ruleCheck.valid) {
      return { valid: false, reason: `Rule violation: ${ruleCheck.reason}` };
    }
  }

  const answerMatch = variant.correctAnswer.match(/x\s*=\s*(-?\d+)/);
  if (answerMatch) {
    const val = parseInt(answerMatch[1]);
    const maxAnswer = rule ? Math.max(Math.abs(rule.answerRange[0]), Math.abs(rule.answerRange[1])) : 1000;
    if (Math.abs(val) > maxAnswer) {
      return { valid: false, reason: `Answer ${val} exceeds max ${maxAnswer}` };
    }
  }

  return { valid: true, reason: "OK" };
}

function buildRuleAwarePrompt(
  source: QuizQuestion,
  rule: DifficultyRule | null
): string {
  const isWordProblem =
    source.questionText.length > 60 && !source.questionText.startsWith("Solve:");

  const ruleConstraints = rule
    ? `
CONSTRAINTS for difficulty ${rule.difficulty}:
- Allowed equation forms: ${rule.allowedForms.join(", ")}
- Coefficient range: ${rule.coefficientRange[0]} to ${rule.coefficientRange[1]}
- Constant range: ${rule.constantRange[0]} to ${rule.constantRange[1]}
- Answer must be in range: ${rule.answerRange[0]} to ${rule.answerRange[1]}
- Fractions allowed: ${rule.allowFractions ? "yes" : "no"}
- Negative answers allowed: ${rule.allowNegativeAnswers ? "yes" : "no"}
- Variables on both sides: ${rule.allowVariablesOnBothSides ? "yes" : "no"}
- Max terms: ${rule.maxTerms}
${rule.formDescriptions.map((d) => `- ${d}`).join("\n")}`
    : "";

  if (isWordProblem) {
    return `You are a Year 9 Mathematics question writer for the Australian Curriculum.

Given this word problem:
"${source.questionText}"
Correct answer: ${source.correctAnswer}
Difficulty level: ${source.difficulty}/5
${ruleConstraints}

Create ONE new word problem that:
- Uses a DIFFERENT real-world context (different scenario, different objects)
- Requires the SAME mathematical structure (same type of equation to solve)
- Has DIFFERENT numbers that produce a clean integer answer
- Is Year 9 appropriate
- Has difficulty ${source.difficulty}/5

Respond ONLY with valid JSON:
{"questionText": "...", "correctAnswer": "x = <number>", "explanation": "Step 1: ... Step 2: ... etc."}`;
  }

  return `You are a Year 9 Mathematics question writer for the Australian Curriculum.

Given this equation:
"${source.questionText}"
Correct answer: ${source.correctAnswer}
Difficulty level: ${source.difficulty}/5
${ruleConstraints}

Create ONE new equation that:
- Has the SAME structural form (same operations, same number of steps)
- Uses DIFFERENT numbers (coefficients and constants must change)
- Produces a clean integer answer (no fractions or decimals in the answer)
- Keeps difficulty at level ${source.difficulty}/5
- Starts with "Solve: " if the original does
- Respects ALL constraints listed above

Respond ONLY with valid JSON:
{"questionText": "...", "correctAnswer": "x = <number>", "explanation": "Step 1: ... Step 2: ... etc."}`;
}

export async function generateVariant(
  source: QuizQuestion,
  topicSlug?: string
): Promise<VariantQuestion | null> {
  if (!openai) {
    return null;
  }

  const rule = topicSlug
    ? getRulesForDifficulty(topicSlug, source.difficulty)
    : null;

  try {
    const prompt = buildRuleAwarePrompt(source, rule);

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
    if (!content) {
      console.log(`[VariantEngine] Empty response for source q${source.id}`);
      return null;
    }

    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed: RawVariant = JSON.parse(cleaned);

    const validation = validateVariant(source, parsed, rule, topicSlug || null);
    if (!validation.valid) {
      console.log(
        `[VariantEngine] Rejected variant for q${source.id} (diff=${source.difficulty}): ${validation.reason} | text="${parsed.questionText?.substring(0, 50)}"`
      );
      return null;
    }

    console.log(
      `[VariantEngine] Accepted variant for q${source.id} (diff=${source.difficulty}): "${parsed.questionText.substring(0, 50)}"`
    );

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
      `[VariantEngine] Error generating variant for q${source.id}:`,
      error
    );
    return null;
  }
}

export interface GenerateForTopicOptions {
  topicId: number;
  topicSlug: string;
  difficulty: number;
  count: number;
  sourceQuestions: QuizQuestion[];
  excludeSourceIds?: Set<number>;
}

export async function generateVariantsForTopic(
  options: GenerateForTopicOptions
): Promise<VariantQuestion[]> {
  const { difficulty, count, sourceQuestions, topicSlug, excludeSourceIds } = options;

  if (!openai || sourceQuestions.length === 0 || count <= 0) {
    return [];
  }

  let pool = sourceQuestions.filter((q) => q.difficulty === difficulty);
  if (excludeSourceIds && excludeSourceIds.size > 0) {
    const filtered = pool.filter((q) => !excludeSourceIds.has(q.id));
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) {
    console.log(
      `[VariantEngine] No source questions for topic=${topicSlug} diff=${difficulty}`
    );
    return [];
  }

  const selected = pool.length <= count ? pool : shuffleArray(pool).slice(0, count);

  const results = await Promise.allSettled(
    selected.map((q) => generateVariant(q, topicSlug))
  );

  const variants: VariantQuestion[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      variants.push(result.value);
    }
  }

  console.log(
    `[VariantEngine] Topic=${topicSlug} diff=${difficulty}: ${variants.length}/${selected.length} variants accepted`
  );
  return variants;
}

export async function generateVariants(
  sources: QuizQuestion[],
  count: number,
  topicSlug?: string
): Promise<VariantQuestion[]> {
  if (!openai || sources.length === 0 || count <= 0) {
    return [];
  }

  const selected =
    sources.length <= count ? sources : shuffleArray(sources).slice(0, count);

  const results = await Promise.allSettled(
    selected.map((q) => generateVariant(q, topicSlug))
  );

  const variants: VariantQuestion[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      variants.push(result.value);
    }
  }

  console.log(
    `[VariantEngine] Batch: ${variants.length}/${selected.length} variants accepted`
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
