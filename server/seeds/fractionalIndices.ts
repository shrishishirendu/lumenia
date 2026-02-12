import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedFractionalIndices() {
  console.log("Seeding Fractional Indices content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Fractional Indices";

  const existing = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, TOPIC_TITLE)
      )
    );

  if (existing.length > 0) {
    console.log("Fractional Indices topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Evaluate and simplify expressions with fractional indices, convert between radical and index form, and apply index laws to fractional powers",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 5,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "Fractional Indices and Radicals",
      description: "Understand what fractional indices mean and convert between index and radical notation.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: ["Understand that a^(1/n) means the nth root of a", "Convert between radical and index notation", "Evaluate simple fractional indices with perfect powers"],
      segments: [
        {
          title: "What are Fractional Indices?",
          type: "explanation",
          content: "A fractional index (or fractional exponent) is another way to write roots. The key rule is: a^(1/n) = the nth root of a. For example, 9^(1/2) = √9 = 3, and 8^(1/3) = ∛8 = 2. The denominator of the fraction tells you which root to take.",
          tutorScript: "Think of the denominator as saying 'which root'. A denominator of 2 means square root, 3 means cube root, 4 means fourth root.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 25^(1/2) = √25 = 5\n\nExample 2: 64^(1/3) = ∛64 = 4 (because 4 × 4 × 4 = 64)\n\nExample 3: 81^(1/4) = 4√81 = 3 (because 3^4 = 81)\n\nExample 4: Write ∛x in index form → x^(1/3)",
          tutorScript: "For each example, ask yourself: what number, raised to the power of the denominator, gives the base?",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) Evaluate 36^(1/2)\n2) Evaluate 125^(1/3)\n3) Write √y using index notation\n4) Evaluate 16^(1/4)\n\nHint: The denominator tells you which root to take.",
          tutorScript: "Remember: the denominator is the root. a^(1/2) = square root, a^(1/3) = cube root.",
        },
      ],
    },
    {
      title: "Evaluating a^(m/n)",
      description: "Evaluate expressions where the index has both a numerator and denominator.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: ["Understand that a^(m/n) = (a^(1/n))^m", "Evaluate fractional indices with perfect power bases", "Choose the most efficient order of operations"],
      segments: [
        {
          title: "The m/n Rule",
          type: "explanation",
          content: "When the index is m/n, you can think of it as: first take the nth root, then raise to the power m. So a^(m/n) = (nth root of a)^m. It is usually easier to take the root first, then raise to the power. For example: 8^(2/3) — take the cube root of 8 first (= 2), then square it (= 4).",
          tutorScript: "Always take the root first to keep the numbers small. Root first, power second.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 8^(2/3)\nStep 1: 8^(1/3) = ∛8 = 2\nStep 2: 2^2 = 4\nAnswer: 4\n\nExample 2: 16^(3/4)\nStep 1: 16^(1/4) = 4√16 = 2\nStep 2: 2^3 = 8\nAnswer: 8\n\nExample 3: 27^(2/3)\nStep 1: 27^(1/3) = ∛27 = 3\nStep 2: 3^2 = 9\nAnswer: 9",
          tutorScript: "Notice the pattern: root first (denominator), then power (numerator). This keeps numbers manageable.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) Evaluate 4^(3/2)\n2) Evaluate 32^(2/5)\n3) Evaluate 9^(5/2)\n4) Evaluate 64^(2/3)\n\nHint: Take the root first (denominator), then raise to the power (numerator).",
          tutorScript: "If you get stuck, write out the two steps separately: root, then power.",
        },
      ],
    },
    {
      title: "Index Laws with Fractional Indices",
      description: "Apply multiplication, division, and power-of-a-power rules to fractional indices.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: ["Multiply powers with fractional indices (add indices)", "Divide powers with fractional indices (subtract indices)", "Apply power of a power rule (multiply indices)"],
      segments: [
        {
          title: "Index Laws Recap",
          type: "explanation",
          content: "The same index laws apply to fractional indices:\n• Multiplication: a^(p/q) × a^(r/s) → add the indices\n• Division: a^(p/q) ÷ a^(r/s) → subtract the indices\n• Power of a power: (a^(p/q))^n → multiply the indices\n\nYou may need to find common denominators when adding or subtracting fractions.",
          tutorScript: "These are the same laws you already know — the only new skill is working with fraction arithmetic.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: x^(1/2) × x^(1/3)\nAdd indices: 1/2 + 1/3 = 3/6 + 2/6 = 5/6\nAnswer: x^(5/6)\n\nExample 2: a^(3/4) ÷ a^(1/4)\nSubtract indices: 3/4 − 1/4 = 2/4 = 1/2\nAnswer: a^(1/2)\n\nExample 3: (y^(2/3))^6\nMultiply indices: 2/3 × 6 = 12/3 = 4\nAnswer: y^4",
          tutorScript: "The key skill here is fraction arithmetic. Make sure your fractions have common denominators before adding or subtracting.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) Simplify: a^(2/3) × a^(1/3)\n2) Simplify: x^(5/6) ÷ x^(1/6)\n3) Simplify: (m^(1/4))^8\n4) Simplify: p^(1/2) × p^(2/3)\n\nHint: Remember to find common denominators when adding fractions.",
          tutorScript: "For multiplication: add indices. For division: subtract. For power of a power: multiply.",
        },
      ],
    },
    {
      title: "Negative Fractional Indices",
      description: "Handle negative fractional indices and rationalise denominators.",
      orderIndex: 4,
      estimatedMinutes: 20,
      objectives: ["Understand that a^(-p/q) = 1/a^(p/q)", "Evaluate expressions with negative fractional indices", "Rationalise denominators involving surds"],
      segments: [
        {
          title: "Negative Indices Mean Reciprocals",
          type: "explanation",
          content: "A negative index means 'take the reciprocal'. So a^(-p/q) = 1 / a^(p/q). For example: 4^(-1/2) = 1 / 4^(1/2) = 1/√4 = 1/2. And 8^(-2/3) = 1 / 8^(2/3) = 1/(∛8)^2 = 1/4.",
          tutorScript: "The negative sign just means 'flip it'. First make the index positive by taking the reciprocal, then evaluate normally.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 9^(-1/2)\n= 1/9^(1/2) = 1/√9 = 1/3\n\nExample 2: 27^(-2/3)\n= 1/27^(2/3) = 1/(∛27)^2 = 1/3^2 = 1/9\n\nExample 3: Rationalise 1/√5\n= 1/√5 × √5/√5 = √5/5\n\nExample 4: 3 × 16^(-1/2)\n= 3 × 1/√16 = 3 × 1/4 = 3/4",
          tutorScript: "For negative indices: flip first, then evaluate. For rationalising: multiply top and bottom by the surd.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) Evaluate 25^(-1/2)\n2) Evaluate 8^(-1/3)\n3) Rationalise 1/√3\n4) Evaluate 2 × 49^(-1/2)\n\nHint: Negative index = reciprocal. Then evaluate as normal.",
          tutorScript: "Step 1: Make the index positive by flipping. Step 2: Evaluate. Step 3: Simplify.",
        },
      ],
    },
  ];

  for (const ld of lessonData) {
    const [lesson] = await db
      .insert(lessons)
      .values({
        topicId: topic.id,
        title: ld.title,
        description: ld.description,
        orderIndex: ld.orderIndex,
        estimatedMinutes: ld.estimatedMinutes,
        objectives: ld.objectives,
        isActive: true,
      })
      .returning();

    const segmentRows = ld.segments.map((seg, idx) => ({
      lessonId: lesson.id,
      title: seg.title,
      type: seg.type,
      content: seg.content,
      tutorScript: seg.tutorScript,
      orderIndex: idx + 1,
    }));
    await db.insert(lessonSegments).values(segmentRows);
  }

  console.log(`  Created 4 lessons with segments for topic ${topic.id}`);

  const practiceQuestions = [
    { questionText: "Evaluate 9^(1/2)", correctAnswer: "3", explanation: "9^(1/2) = √9 = 3", difficulty: 1, points: 1 },
    { questionText: "Evaluate 27^(1/3)", correctAnswer: "3", explanation: "27^(1/3) = ∛27 = 3", difficulty: 1, points: 1 },
    { questionText: "Evaluate 16^(1/4)", correctAnswer: "2", explanation: "16^(1/4) = 4√16 = 2 because 2^4 = 16", difficulty: 1, points: 1 },
    { questionText: "Evaluate 64^(1/2)", correctAnswer: "8", explanation: "64^(1/2) = √64 = 8", difficulty: 1, points: 1 },
    { questionText: "Evaluate 8^(2/3)", correctAnswer: "4", explanation: "8^(1/3) = 2, then 2^2 = 4", difficulty: 1, points: 1 },
    { questionText: "Write √x using index notation", correctAnswer: "x^(1/2)", explanation: "√x = x^(1/2)", difficulty: 1, points: 1 },
    { questionText: "Simplify: a^(1/3) × a^(2/3)", correctAnswer: "a^1 or a", explanation: "Add indices: 1/3 + 2/3 = 3/3 = 1", difficulty: 2, points: 2 },
    { questionText: "Simplify: x^(3/4) ÷ x^(1/4)", correctAnswer: "x^(1/2)", explanation: "Subtract indices: 3/4 − 1/4 = 2/4 = 1/2", difficulty: 2, points: 2 },
    { questionText: "Simplify: (y^2)^(1/3)", correctAnswer: "y^(2/3)", explanation: "Multiply indices: 2 × 1/3 = 2/3", difficulty: 2, points: 2 },
    { questionText: "Evaluate 16^(3/4)", correctAnswer: "8", explanation: "16^(1/4) = 2, then 2^3 = 8", difficulty: 2, points: 2 },
    { questionText: "Evaluate 32^(2/5)", correctAnswer: "4", explanation: "32^(1/5) = 2, then 2^2 = 4", difficulty: 2, points: 2 },
    { questionText: "Simplify: (a^(1/2))^4", correctAnswer: "a^2", explanation: "Multiply indices: 1/2 × 4 = 2", difficulty: 2, points: 2 },
    { questionText: "Evaluate 4^(-1/2)", correctAnswer: "1/2", explanation: "4^(-1/2) = 1/4^(1/2) = 1/√4 = 1/2", difficulty: 3, points: 3 },
    { questionText: "Evaluate 27^(-1/3)", correctAnswer: "1/3", explanation: "27^(-1/3) = 1/27^(1/3) = 1/∛27 = 1/3", difficulty: 3, points: 3 },
    { questionText: "Evaluate 8^(-2/3)", correctAnswer: "1/4", explanation: "8^(2/3) = 4, so 8^(-2/3) = 1/4", difficulty: 3, points: 3 },
    { questionText: "Rationalise: 1/√7", correctAnswer: "√7/7", explanation: "Multiply by √7/√7: √7/7", difficulty: 3, points: 3 },
    { questionText: "Evaluate 3 × 25^(-1/2)", correctAnswer: "3/5", explanation: "25^(-1/2) = 1/5, so 3 × 1/5 = 3/5", difficulty: 3, points: 3 },
    { questionText: "Express 8^(1/3) × 4^(1/2) as a power of 2", correctAnswer: "2^2", explanation: "8 = 2^3, so 8^(1/3) = 2. 4 = 2^2, so 4^(1/2) = 2. 2 × 2 = 4 = 2^2", difficulty: 4, points: 4 },
    { questionText: "Simplify: (a^(1/2) × a^(1/3)) ÷ a^(1/6)", correctAnswer: "a^(2/3)", explanation: "1/2 + 1/3 = 5/6. Then 5/6 − 1/6 = 4/6 = 2/3", difficulty: 4, points: 4 },
    { questionText: "Express 27^(2/3) × 9^(1/2) as a power of 3", correctAnswer: "3^3", explanation: "27 = 3^3, so 27^(2/3) = 3^2 = 9. 9 = 3^2, so 9^(1/2) = 3. 9 × 3 = 27 = 3^3", difficulty: 4, points: 4 },
  ];

  const rows = practiceQuestions.map(q => ({
    topicId: topic.id,
    subjectId: SUBJECT_ID,
    lessonId: null as number | null,
    questionText: q.questionText,
    questionType: "short_answer" as const,
    options: null as string[] | null,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    points: q.points,
  }));

  await db.insert(quizQuestions).values(rows);
  console.log(`  Inserted ${rows.length} practice questions for Fractional Indices`);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary: "Fractional indices represent roots. The denominator is the root, the numerator is the power. Negative indices mean reciprocals.",
    notesMarkdown: `## Core Rules

### Fractional Index = Root
- \\( a^{1/n} = \\sqrt[n]{a} \\) — the denominator tells you which root
- \\( a^{1/2} = \\sqrt{a} \\), \\( a^{1/3} = \\sqrt[3]{a} \\), \\( a^{1/4} = \\sqrt[4]{a} \\)

### The m/n Rule
- \\( a^{m/n} = (\\sqrt[n]{a})^m \\) — root first, then power
- Always take the root first to keep numbers small

### Index Laws Still Apply
- **Multiply**: \\( a^{p/q} \\times a^{r/s} = a^{p/q + r/s} \\)
- **Divide**: \\( a^{p/q} \\div a^{r/s} = a^{p/q - r/s} \\)
- **Power of a power**: \\( (a^{p/q})^n = a^{pn/q} \\)

### Negative Fractional Indices
- \\( a^{-p/q} = \\frac{1}{a^{p/q}} \\)
- Negative index = take the reciprocal

### Rationalising Denominators
- \\( \\frac{1}{\\sqrt{a}} = \\frac{\\sqrt{a}}{a} \\) — multiply top and bottom by \\( \\sqrt{a} \\)`,
    keyFormulas: [
      "a^(1/n) = nth root of a",
      "a^(m/n) = (nth root of a)^m",
      "a^(-p/q) = 1 / a^(p/q)",
      "Multiply same base: add indices",
      "Divide same base: subtract indices",
      "Power of a power: multiply indices",
    ],
    commonMistakes: [
      "Confusing numerator and denominator — the denominator is the root, not the power",
      "Forgetting to take the root first (leading to unnecessarily large numbers)",
      "Not simplifying the resulting fraction after adding/subtracting indices",
      "Forgetting that negative index means reciprocal, not negative answer",
      "Not rationalising when the denominator contains a surd",
    ],
  });
  console.log(`  Created topic notes for Fractional Indices`);

  return topic.id;
}
