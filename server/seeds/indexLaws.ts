import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedIndexLaws() {
  console.log("Seeding Index Laws content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Index Laws";

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
    console.log("Index Laws topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description:
        "Apply index laws to simplify expressions: product rule, quotient rule, power of a power, zero index, and power of a product/quotient.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 2,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log("Created topic:", topic.id, topic.title);

  // ---- TOPIC NOTES ----
  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary:
      "Index laws help you simplify powers by using consistent rules for multiplying, dividing, and raising powers.",
    notesMarkdown: `# Index Laws — Year 9 Reference

## Core Idea
An **index** (or exponent) tells you how many times to multiply a base by itself.  
For example, 3⁴ = 3 × 3 × 3 × 3 = 81.

## Key Laws

| Law | Rule | Example |
|-----|------|---------|
| Product rule | aᵐ × aⁿ = aᵐ⁺ⁿ | 2³ × 2⁴ = 2⁷ |
| Quotient rule | aᵐ ÷ aⁿ = aᵐ⁻ⁿ (m ≥ n) | 5⁵ ÷ 5² = 5³ |
| Power of a power | (aᵐ)ⁿ = aᵐˣⁿ | (3²)⁴ = 3⁸ |
| Power of a product | (ab)ⁿ = aⁿbⁿ | (2 × 5)³ = 2³ × 5³ |
| Power of a quotient | (a/b)ⁿ = aⁿ/bⁿ | (3/4)² = 9/16 |
| Zero index | a⁰ = 1 (a ≠ 0) | 7⁰ = 1 |

## Tips
- The product and quotient rules only work when the **bases are the same**.
- Always simplify inside brackets before applying the power rule.
- When in doubt, expand the expression to check your answer.`,
    keyFormulas: JSON.stringify([
      "aᵐ × aⁿ = aᵐ⁺ⁿ (product rule)",
      "aᵐ ÷ aⁿ = aᵐ⁻ⁿ, m ≥ n (quotient rule)",
      "(aᵐ)ⁿ = aᵐˣⁿ (power of a power)",
      "(ab)ⁿ = aⁿ × bⁿ (power of a product)",
      "(a/b)ⁿ = aⁿ / bⁿ (power of a quotient)",
      "a⁰ = 1, for a ≠ 0 (zero index)",
    ]),
    commonMistakes: JSON.stringify([
      "Adding bases instead of adding indices: 2³ × 2⁴ ≠ 4⁷ (bases don't change)",
      "Multiplying indices when using the product rule: 2³ × 2⁴ ≠ 2¹² (add, don't multiply)",
      "Forgetting brackets change the meaning: (2 × 3)² ≠ 2 × 3²",
      "Applying quotient rule when bases are different: 3⁵ ÷ 2³ cannot be simplified with the quotient rule",
    ]),
  });
  console.log("Created topic notes for Index Laws");

  // ---- LESSONS ----
  const lessonData = [
    {
      title: "Understanding Indices + Product & Quotient Rules",
      description:
        "Learn what indices mean and apply the product and quotient rules for same-base expressions.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Interpret aⁿ as repeated multiplication",
        "Simplify expressions using the product rule (same base)",
        "Simplify expressions using the quotient rule (same base, m ≥ n)",
      ],
    },
    {
      title: "Power Rules: Power of a Power, Product, and Quotient",
      description:
        "Simplify expressions involving power of a power, power of a product, and power of a quotient.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Simplify (aᵐ)ⁿ using the power-of-a-power rule",
        "Expand and simplify (ab)ⁿ and (a/b)ⁿ",
        "Keep results within Year 9 scope (no negative indices)",
      ],
    },
    {
      title: "Zero Index + Mixed Simplification",
      description:
        "Apply the zero-index rule and combine multiple index laws to simplify complex expressions.",
      orderIndex: 3,
      estimatedMinutes: 15,
      objectives: [
        "Apply a⁰ = 1 (for a ≠ 0)",
        "Simplify multi-step index expressions",
        "Check reasonableness of answers",
      ],
    },
  ];

  const createdLessons = await db
    .insert(lessons)
    .values(
      lessonData.map((l) => ({
        topicId: topic.id,
        title: l.title,
        description: l.description,
        orderIndex: l.orderIndex,
        estimatedMinutes: l.estimatedMinutes,
        objectives: l.objectives,
        isActive: true,
      }))
    )
    .returning();

  console.log("Created", createdLessons.length, "lessons");

  // ---- LESSON SEGMENTS ----
  const segmentData = [
    {
      lessonIndex: 0,
      segments: [
        {
          title: "What Are Indices?",
          type: "explanation",
          content:
            "An index (plural: indices) tells you how many times to multiply a base by itself. For example, 3⁴ means 3 × 3 × 3 × 3 = 81. The base is 3 and the index is 4.\n\nThe product rule says: when you multiply powers with the SAME base, you ADD the indices. So aᵐ × aⁿ = aᵐ⁺ⁿ.\n\nThe quotient rule says: when you divide powers with the SAME base, you SUBTRACT the indices. So aᵐ ÷ aⁿ = aᵐ⁻ⁿ (as long as m ≥ n).",
          whiteboardContent: null,
          tutorScript:
            "Let's start with the basics. An index is a shorthand for repeated multiplication. Once you understand that, the product and quotient rules make perfect sense — multiplying means more factors, so you add indices; dividing means fewer factors, so you subtract.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples: Product & Quotient Rules",
          type: "example",
          content:
            "Example 1 (Product rule): Simplify 2³ × 2⁵\nSame base (2), so add indices: 2³⁺⁵ = 2⁸\n\nExample 2 (Quotient rule): Simplify 5⁴ ÷ 5²\nSame base (5), so subtract indices: 5⁴⁻² = 5²",
          whiteboardContent: JSON.stringify({
            steps: [
              {
                label: "Product rule",
                work: "2³ × 2⁵ → same base → add indices → 2³⁺⁵ = 2⁸",
              },
              {
                label: "Quotient rule",
                work: "5⁴ ÷ 5² → same base → subtract indices → 5⁴⁻² = 5²",
              },
            ],
          }),
          tutorScript:
            "Notice in both examples the base stays the same — you never change the base. In the product rule you add the powers, and in the quotient rule you subtract them. Let's try some together.",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Simplify each expression:\n1) 3² × 3⁴\n2) 7⁵ ÷ 7³\n3) 4¹ × 4³\n4) 6⁴ ÷ 6¹\n5) 2² × 2³ × 2¹\n6) 9⁵ ÷ 9²\n\nHint: Check the bases are the same, then apply the correct rule.",
          whiteboardContent: null,
          tutorScript:
            "Try the first one: what do you get when you add the indices 2 and 4? For the quotient ones, make sure you subtract the smaller index from the larger one.",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 1,
      segments: [
        {
          title: "Power of a Power, Product, and Quotient",
          type: "explanation",
          content:
            "Power of a power: (aᵐ)ⁿ = aᵐˣⁿ. You multiply the indices.\n\nPower of a product: (ab)ⁿ = aⁿ × bⁿ. The power applies to every factor inside the brackets.\n\nPower of a quotient: (a/b)ⁿ = aⁿ / bⁿ. The power applies to both top and bottom.",
          whiteboardContent: null,
          tutorScript:
            "Think of it this way: (3²)⁴ means 3² multiplied by itself 4 times. That's 3² × 3² × 3² × 3² = 3⁸ by the product rule. So we multiply the indices: 2 × 4 = 8. The bracket rules just distribute the power to everything inside.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples: Power Rules",
          type: "example",
          content:
            "Example 1: Simplify (4²)³\nMultiply indices: 4²ˣ³ = 4⁶\n\nExample 2: Simplify (2 × 3)⁴\nApply power to each factor: 2⁴ × 3⁴ = 16 × 81 = 1296",
          whiteboardContent: JSON.stringify({
            steps: [
              {
                label: "Power of a power",
                work: "(4²)³ → multiply indices → 4²ˣ³ = 4⁶",
              },
              {
                label: "Power of a product",
                work: "(2 × 3)⁴ → 2⁴ × 3⁴ → 16 × 81 = 1296",
              },
            ],
          }),
          tutorScript:
            "For power of a power, you multiply the two exponents. For power of a product, the exponent goes to every factor inside the brackets. Make sure you don't miss any factor!",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Simplify each expression:\n1) (5²)³\n2) (3³)²\n3) (2 × 7)²\n4) (3/5)³\n5) (6²)²\n6) (4 × 2)³\n\nHint: For power of a power, multiply the indices. For products/quotients, apply the power to every part.",
          whiteboardContent: null,
          tutorScript:
            "Start with question 1: what do you get when you multiply 2 × 3? For question 4, apply the power to both the numerator and denominator.",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 2,
      segments: [
        {
          title: "Zero Index and Combining Laws",
          type: "explanation",
          content:
            "The zero index rule: a⁰ = 1, as long as a ≠ 0. This follows from the quotient rule: a³ ÷ a³ = a⁰ = 1.\n\nTo simplify complex expressions, apply the index laws step by step:\n1. Expand any brackets (power rules)\n2. Combine like bases (product/quotient rules)\n3. Simplify using zero index if needed",
          whiteboardContent: null,
          tutorScript:
            "The zero index trips people up, but it's actually logical. If you divide a power by itself, like 5³ ÷ 5³, you get 1. But the quotient rule gives 5⁰. So 5⁰ must equal 1!",
          orderIndex: 1,
        },
        {
          title: "Worked Examples: Mixed Simplification",
          type: "example",
          content:
            "Example 1: Simplify 8⁰\n8⁰ = 1 (zero index rule)\n\nExample 2: Simplify 3² × 3⁴ ÷ 3⁶\nStep 1: Product rule for numerator → 3²⁺⁴ = 3⁶\nStep 2: Quotient rule → 3⁶ ÷ 3⁶ = 3⁰ = 1",
          whiteboardContent: JSON.stringify({
            steps: [
              {
                label: "Zero index",
                work: "8⁰ = 1",
              },
              {
                label: "Mixed laws",
                work: "3² × 3⁴ ÷ 3⁶ → 3⁶ ÷ 3⁶ → 3⁰ = 1",
              },
            ],
          }),
          tutorScript:
            "See how everything can work together? First combine using the product rule, then the quotient rule, and the zero index pops out. Now let's try some mixed questions!",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Simplify each expression:\n1) 4⁰\n2) (7³)⁰\n3) 2³ × 2² ÷ 2⁵\n4) 5⁴ ÷ 5² × 5⁰\n5) (3²)² × 3¹ ÷ 3⁵\n6) 6³ × 6² ÷ 6⁵\n\nHint: Work step by step — product rule, quotient rule, then zero index.",
          whiteboardContent: null,
          tutorScript:
            "Remember: any nonzero base to the power of zero equals 1. For the multi-step questions, do one law at a time and keep track of your indices.",
          orderIndex: 3,
        },
      ],
    },
  ];

  const allSegments: {
    lessonId: number;
    title: string;
    type: string;
    content: string;
    whiteboardContent: string | null;
    tutorScript: string;
    orderIndex: number;
  }[] = [];

  for (const sd of segmentData) {
    const lesson = createdLessons[sd.lessonIndex];
    for (const seg of sd.segments) {
      allSegments.push({ lessonId: lesson.id, ...seg });
    }
  }

  await db.insert(lessonSegments).values(allSegments);
  console.log("Created", allSegments.length, "lesson segments");

  // ---- QUIZ QUESTIONS ----
  // Answer format standard: use index notation like "2^3", "5^2", or numeric "1", "81"
  // For simplification questions: answer is simplified index form e.g. "3^6"
  // For evaluation questions: answer is the numeric value e.g. "8"

  type Q = {
    questionText: string;
    questionType: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    points: number;
  };

  const lessonQuestions: { lessonIndex: number | null; questions: Q[] }[] = [
    {
      lessonIndex: 0,
      questions: [
        { questionText: "Simplify: 2^3 × 2^4", questionType: "short_answer", options: null, correctAnswer: "2^7", explanation: "Same base (2), add indices: 3 + 4 = 7. Answer: 2^7.", difficulty: 1, points: 1 },
        { questionText: "Simplify: 5^2 × 5^3", questionType: "short_answer", options: null, correctAnswer: "5^5", explanation: "Same base (5), add indices: 2 + 3 = 5. Answer: 5^5.", difficulty: 1, points: 1 },
        { questionText: "Simplify: 7^4 ÷ 7^2", questionType: "short_answer", options: null, correctAnswer: "7^2", explanation: "Same base (7), subtract indices: 4 − 2 = 2. Answer: 7^2.", difficulty: 1, points: 1 },
        { questionText: "Simplify: 3^5 ÷ 3^3", questionType: "short_answer", options: null, correctAnswer: "3^2", explanation: "Same base (3), subtract indices: 5 − 3 = 2. Answer: 3^2.", difficulty: 1, points: 1 },
      ],
    },
    {
      lessonIndex: 1,
      questions: [
        { questionText: "Simplify: (4^2)^3", questionType: "short_answer", options: null, correctAnswer: "4^6", explanation: "Power of a power: multiply indices: 2 × 3 = 6. Answer: 4^6.", difficulty: 2, points: 2 },
        { questionText: "Simplify: (3^3)^2", questionType: "short_answer", options: null, correctAnswer: "3^6", explanation: "Power of a power: multiply indices: 3 × 2 = 6. Answer: 3^6.", difficulty: 2, points: 2 },
        { questionText: "Simplify: (5^2)^2", questionType: "short_answer", options: null, correctAnswer: "5^4", explanation: "Power of a power: multiply indices: 2 × 2 = 4. Answer: 5^4.", difficulty: 2, points: 2 },
      ],
    },
    {
      lessonIndex: 2,
      questions: [
        { questionText: "Simplify: 6^0", questionType: "short_answer", options: null, correctAnswer: "1", explanation: "Any nonzero base raised to the power 0 equals 1. Answer: 1.", difficulty: 1, points: 1 },
        { questionText: "Simplify: 2^3 × 2^2 ÷ 2^5", questionType: "short_answer", options: null, correctAnswer: "1", explanation: "Product: 2^(3+2) = 2^5. Quotient: 2^5 ÷ 2^5 = 2^0 = 1.", difficulty: 3, points: 2 },
        { questionText: "Simplify: 5^4 ÷ 5^2 × 5^0", questionType: "short_answer", options: null, correctAnswer: "5^2", explanation: "5^4 ÷ 5^2 = 5^2. Then 5^2 × 5^0 = 5^2 × 1 = 5^2.", difficulty: 3, points: 2 },
      ],
    },
  ];

  // ---- TOPIC-LEVEL QUESTIONS (exit ticket pool) ----
  // Easy (difficulty=1): 15 total (4 lesson-linked above + 11 here)
  const easyQuestions: Q[] = [
    { questionText: "Simplify: 4^1 × 4^2", questionType: "short_answer", options: null, correctAnswer: "4^3", explanation: "Same base (4), add indices: 1 + 2 = 3. Answer: 4^3.", difficulty: 1, points: 1 },
    { questionText: "Simplify: 6^3 × 6^1", questionType: "short_answer", options: null, correctAnswer: "6^4", explanation: "Same base (6), add indices: 3 + 1 = 4. Answer: 6^4.", difficulty: 1, points: 1 },
    { questionText: "Simplify: 8^4 ÷ 8^2", questionType: "short_answer", options: null, correctAnswer: "8^2", explanation: "Same base (8), subtract indices: 4 − 2 = 2. Answer: 8^2.", difficulty: 1, points: 1 },
    { questionText: "Simplify: 9^3 ÷ 9^1", questionType: "short_answer", options: null, correctAnswer: "9^2", explanation: "Same base (9), subtract indices: 3 − 1 = 2. Answer: 9^2.", difficulty: 1, points: 1 },
    { questionText: "Evaluate: 2^3", questionType: "short_answer", options: null, correctAnswer: "8", explanation: "2^3 = 2 × 2 × 2 = 8.", difficulty: 1, points: 1 },
    { questionText: "Evaluate: 5^2", questionType: "short_answer", options: null, correctAnswer: "25", explanation: "5^2 = 5 × 5 = 25.", difficulty: 1, points: 1 },
    { questionText: "Evaluate: 3^3", questionType: "short_answer", options: null, correctAnswer: "27", explanation: "3^3 = 3 × 3 × 3 = 27.", difficulty: 1, points: 1 },
    { questionText: "Simplify: 3^2 × 3^1", questionType: "short_answer", options: null, correctAnswer: "3^3", explanation: "Same base (3), add indices: 2 + 1 = 3. Answer: 3^3.", difficulty: 1, points: 1 },
    { questionText: "Evaluate: 7^0", questionType: "short_answer", options: null, correctAnswer: "1", explanation: "Any nonzero number to the power 0 equals 1.", difficulty: 1, points: 1 },
    { questionText: "Simplify: 5^3 ÷ 5^2", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "Same base (5), subtract indices: 3 − 2 = 1. Answer: 5^1.", difficulty: 1, points: 1 },
    { questionText: "Evaluate: 4^2", questionType: "short_answer", options: null, correctAnswer: "16", explanation: "4^2 = 4 × 4 = 16.", difficulty: 1, points: 1 },
  ];

  // Medium (difficulty=2): 30 total (3 lesson-linked above + 27 here)
  const mediumQuestions: Q[] = [
    { questionText: "Simplify: 2^3 × 2^2", questionType: "short_answer", options: null, correctAnswer: "2^5", explanation: "Same base (2), add indices: 3 + 2 = 5. Answer: 2^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 6^5 ÷ 6^3", questionType: "short_answer", options: null, correctAnswer: "6^2", explanation: "Same base (6), subtract indices: 5 − 3 = 2. Answer: 6^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (2^3)^2", questionType: "short_answer", options: null, correctAnswer: "2^6", explanation: "Power of a power: multiply indices: 3 × 2 = 6. Answer: 2^6.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (7^1)^4", questionType: "short_answer", options: null, correctAnswer: "7^4", explanation: "Power of a power: multiply indices: 1 × 4 = 4. Answer: 7^4.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 8^3 ÷ 8^1", questionType: "short_answer", options: null, correctAnswer: "8^2", explanation: "Same base (8), subtract indices: 3 − 1 = 2. Answer: 8^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 4^2 × 4^3", questionType: "short_answer", options: null, correctAnswer: "4^5", explanation: "Same base (4), add indices: 2 + 3 = 5. Answer: 4^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 9^4 ÷ 9^2", questionType: "short_answer", options: null, correctAnswer: "9^2", explanation: "Same base (9), subtract indices: 4 − 2 = 2. Answer: 9^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (6^2)^2", questionType: "short_answer", options: null, correctAnswer: "6^4", explanation: "Power of a power: multiply indices: 2 × 2 = 4. Answer: 6^4.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 3^4 × 3^1", questionType: "short_answer", options: null, correctAnswer: "3^5", explanation: "Same base (3), add indices: 4 + 1 = 5. Answer: 3^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 7^5 ÷ 7^4", questionType: "short_answer", options: null, correctAnswer: "7^1", explanation: "Same base (7), subtract indices: 5 − 4 = 1. Answer: 7^1.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (8^1)^5", questionType: "short_answer", options: null, correctAnswer: "8^5", explanation: "Power of a power: multiply indices: 1 × 5 = 5. Answer: 8^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 5^2 × 5^2", questionType: "short_answer", options: null, correctAnswer: "5^4", explanation: "Same base (5), add indices: 2 + 2 = 4. Answer: 5^4.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (9^2)^1", questionType: "short_answer", options: null, correctAnswer: "9^2", explanation: "Power of a power: multiply indices: 2 × 1 = 2. Answer: 9^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 2^4 × 2^1", questionType: "short_answer", options: null, correctAnswer: "2^5", explanation: "Same base (2), add indices: 4 + 1 = 5. Answer: 2^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 4^4 ÷ 4^2", questionType: "short_answer", options: null, correctAnswer: "4^2", explanation: "Same base (4), subtract indices: 4 − 2 = 2. Answer: 4^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (3^1)^5", questionType: "short_answer", options: null, correctAnswer: "3^5", explanation: "Power of a power: multiply indices: 1 × 5 = 5. Answer: 3^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 6^2 × 6^3", questionType: "short_answer", options: null, correctAnswer: "6^5", explanation: "Same base (6), add indices: 2 + 3 = 5. Answer: 6^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 7^3 ÷ 7^1", questionType: "short_answer", options: null, correctAnswer: "7^2", explanation: "Same base (7), subtract indices: 3 − 1 = 2. Answer: 7^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (4^3)^1", questionType: "short_answer", options: null, correctAnswer: "4^3", explanation: "Power of a power: multiply indices: 3 × 1 = 3. Answer: 4^3.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 8^2 × 8^2", questionType: "short_answer", options: null, correctAnswer: "8^4", explanation: "Same base (8), add indices: 2 + 2 = 4. Answer: 8^4.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 3^3 × 3^2", questionType: "short_answer", options: null, correctAnswer: "3^5", explanation: "Same base (3), add indices: 3 + 2 = 5. Answer: 3^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 9^5 ÷ 9^3", questionType: "short_answer", options: null, correctAnswer: "9^2", explanation: "Same base (9), subtract indices: 5 − 3 = 2. Answer: 9^2.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (2^2)^2", questionType: "short_answer", options: null, correctAnswer: "2^4", explanation: "Power of a power: multiply indices: 2 × 2 = 4. Answer: 2^4.", difficulty: 2, points: 2 },
    { questionText: "Evaluate: (3^2)^1", questionType: "short_answer", options: null, correctAnswer: "9", explanation: "(3^2)^1 = 3^2 = 9.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 5^4 ÷ 5^3", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "Same base (5), subtract indices: 4 − 3 = 1. Answer: 5^1.", difficulty: 2, points: 2 },
    { questionText: "Simplify: 4^1 × 4^4", questionType: "short_answer", options: null, correctAnswer: "4^5", explanation: "Same base (4), add indices: 1 + 4 = 5. Answer: 4^5.", difficulty: 2, points: 2 },
    { questionText: "Simplify: (5^1)^3", questionType: "short_answer", options: null, correctAnswer: "5^3", explanation: "Power of a power: multiply indices: 1 × 3 = 3. Answer: 5^3.", difficulty: 2, points: 2 },
  ];

  // High (difficulty=3): 25 total
  const highQuestions: Q[] = [
    { questionText: "Simplify: 2^3 × 2^4 ÷ 2^5", questionType: "short_answer", options: null, correctAnswer: "2^2", explanation: "Product: 2^(3+4) = 2^7. Quotient: 2^7 ÷ 2^5 = 2^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (3^2)^3 ÷ 3^4", questionType: "short_answer", options: null, correctAnswer: "3^2", explanation: "Power of power: 3^6. Quotient: 3^6 ÷ 3^4 = 3^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 5^3 × 5^2 ÷ 5^4", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "Product: 5^5. Quotient: 5^5 ÷ 5^4 = 5^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (4^3)^2 ÷ 4^5", questionType: "short_answer", options: null, correctAnswer: "4^1", explanation: "Power of power: 4^6. Quotient: 4^6 ÷ 4^5 = 4^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 7^2 × 7^3 ÷ 7^5", questionType: "short_answer", options: null, correctAnswer: "1", explanation: "Product: 7^5. Quotient: 7^5 ÷ 7^5 = 7^0 = 1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (6^2)^2 × 6^1", questionType: "short_answer", options: null, correctAnswer: "6^5", explanation: "Power of power: 6^4. Product: 6^4 × 6^1 = 6^5.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 8^4 ÷ 8^2 × 8^1", questionType: "short_answer", options: null, correctAnswer: "8^3", explanation: "Quotient: 8^2. Product: 8^2 × 8^1 = 8^3.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (2^4)^1 ÷ 2^3", questionType: "short_answer", options: null, correctAnswer: "2^1", explanation: "Power of power: 2^4. Quotient: 2^4 ÷ 2^3 = 2^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 9^3 × 9^1 ÷ 9^2", questionType: "short_answer", options: null, correctAnswer: "9^2", explanation: "Product: 9^4. Quotient: 9^4 ÷ 9^2 = 9^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (5^2)^2 ÷ 5^3", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "Power of power: 5^4. Quotient: 5^4 ÷ 5^3 = 5^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 3^5 ÷ 3^2 × 3^1", questionType: "short_answer", options: null, correctAnswer: "3^4", explanation: "Quotient: 3^3. Product: 3^3 × 3^1 = 3^4.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (7^3)^1 × 7^2", questionType: "short_answer", options: null, correctAnswer: "7^5", explanation: "Power of power: 7^3. Product: 7^3 × 7^2 = 7^5.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 4^3 × 4^2 ÷ 4^4", questionType: "short_answer", options: null, correctAnswer: "4^1", explanation: "Product: 4^5. Quotient: 4^5 ÷ 4^4 = 4^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (8^2)^2 ÷ 8^3", questionType: "short_answer", options: null, correctAnswer: "8^1", explanation: "Power of power: 8^4. Quotient: 8^4 ÷ 8^3 = 8^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 6^4 ÷ 6^1 × 6^0", questionType: "short_answer", options: null, correctAnswer: "6^3", explanation: "Quotient: 6^3. 6^0 = 1, so 6^3 × 1 = 6^3.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 2^5 ÷ 2^3 × 2^2", questionType: "short_answer", options: null, correctAnswer: "2^4", explanation: "Quotient: 2^2. Product: 2^2 × 2^2 = 2^4.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (9^1)^4 ÷ 9^3", questionType: "short_answer", options: null, correctAnswer: "9^1", explanation: "Power of power: 9^4. Quotient: 9^4 ÷ 9^3 = 9^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 3^4 × 3^0 ÷ 3^2", questionType: "short_answer", options: null, correctAnswer: "3^2", explanation: "3^0 = 1, so 3^4 × 1 = 3^4. Quotient: 3^4 ÷ 3^2 = 3^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (4^2)^2 × 4^0", questionType: "short_answer", options: null, correctAnswer: "4^4", explanation: "Power of power: 4^4. 4^0 = 1, so 4^4 × 1 = 4^4.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 5^5 ÷ 5^3 ÷ 5^1", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "5^5 ÷ 5^3 = 5^2. Then 5^2 ÷ 5^1 = 5^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 7^4 × 7^1 ÷ 7^3", questionType: "short_answer", options: null, correctAnswer: "7^2", explanation: "Product: 7^5. Quotient: 7^5 ÷ 7^3 = 7^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (6^3)^1 ÷ 6^2", questionType: "short_answer", options: null, correctAnswer: "6^1", explanation: "Power of power: 6^3. Quotient: 6^3 ÷ 6^2 = 6^1.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 8^3 × 8^0 × 8^2", questionType: "short_answer", options: null, correctAnswer: "8^5", explanation: "8^0 = 1. Product: 8^3 × 1 × 8^2 = 8^5.", difficulty: 3, points: 2 },
    { questionText: "Simplify: (2^3)^2 ÷ 2^4", questionType: "short_answer", options: null, correctAnswer: "2^2", explanation: "Power of power: 2^6. Quotient: 2^6 ÷ 2^4 = 2^2.", difficulty: 3, points: 2 },
    { questionText: "Simplify: 9^4 ÷ 9^1 ÷ 9^2", questionType: "short_answer", options: null, correctAnswer: "9^1", explanation: "9^4 ÷ 9^1 = 9^3. Then 9^3 ÷ 9^2 = 9^1.", difficulty: 3, points: 2 },
  ];

  // Challenge (difficulty=4): 20 total
  const challengeQuestions: Q[] = [
    { questionText: "Simplify: (2^3)^2 × 2^2 ÷ 2^5", questionType: "short_answer", options: null, correctAnswer: "2^3", explanation: "Power of power: 2^6. Product: 2^6 × 2^2 = 2^8. Quotient: 2^8 ÷ 2^5 = 2^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (3^2)^3 × 3^1 ÷ 3^5", questionType: "short_answer", options: null, correctAnswer: "3^2", explanation: "Power of power: 3^6. Product: 3^6 × 3^1 = 3^7. Quotient: 3^7 ÷ 3^5 = 3^2.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 5^4 × (5^2)^2 ÷ 5^5", questionType: "short_answer", options: null, correctAnswer: "5^3", explanation: "Power of power: 5^4. Product: 5^4 × 5^4 = 5^8. Quotient: 5^8 ÷ 5^5 = 5^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (4^2)^3 ÷ (4^3)^1", questionType: "short_answer", options: null, correctAnswer: "4^3", explanation: "First: 4^6. Second: 4^3. Quotient: 4^6 ÷ 4^3 = 4^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (7^2)^2 × 7^3 ÷ 7^5", questionType: "short_answer", options: null, correctAnswer: "7^2", explanation: "Power of power: 7^4. Product: 7^4 × 7^3 = 7^7. Quotient: 7^7 ÷ 7^5 = 7^2.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 6^3 × 6^2 ÷ (6^1)^4", questionType: "short_answer", options: null, correctAnswer: "6^1", explanation: "Product: 6^5. Power of power: 6^4. Quotient: 6^5 ÷ 6^4 = 6^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (8^1)^5 × 8^0 ÷ 8^3", questionType: "short_answer", options: null, correctAnswer: "8^2", explanation: "Power of power: 8^5. 8^0 = 1. Quotient: 8^5 ÷ 8^3 = 8^2.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (9^2)^2 × 9^1 ÷ 9^4", questionType: "short_answer", options: null, correctAnswer: "9^1", explanation: "Power of power: 9^4. Product: 9^4 × 9^1 = 9^5. Quotient: 9^5 ÷ 9^4 = 9^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 2^5 × (2^1)^3 ÷ 2^4 ÷ 2^2", questionType: "short_answer", options: null, correctAnswer: "2^2", explanation: "Power of power: 2^3. Product: 2^5 × 2^3 = 2^8. Quotient: 2^8 ÷ 2^4 = 2^4. Then 2^4 ÷ 2^2 = 2^2.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (3^3)^2 ÷ 3^2 ÷ 3^3", questionType: "short_answer", options: null, correctAnswer: "3^1", explanation: "Power of power: 3^6. Quotient: 3^6 ÷ 3^2 = 3^4. Then 3^4 ÷ 3^3 = 3^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (5^2)^3 ÷ 5^4 × 5^1", questionType: "short_answer", options: null, correctAnswer: "5^3", explanation: "Power of power: 5^6. Quotient: 5^6 ÷ 5^4 = 5^2. Product: 5^2 × 5^1 = 5^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 4^5 ÷ (4^2)^2 × 4^0", questionType: "short_answer", options: null, correctAnswer: "4^1", explanation: "Power of power: 4^4. Quotient: 4^5 ÷ 4^4 = 4^1. 4^0 = 1, so answer is 4^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (6^2)^3 × (6^1)^2 ÷ 6^5", questionType: "short_answer", options: null, correctAnswer: "6^3", explanation: "First power: 6^6. Second power: 6^2. Product: 6^8. Quotient: 6^8 ÷ 6^5 = 6^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (7^3)^2 ÷ 7^4 ÷ 7^1", questionType: "short_answer", options: null, correctAnswer: "7^1", explanation: "Power of power: 7^6. 7^6 ÷ 7^4 = 7^2. Then 7^2 ÷ 7^1 = 7^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 8^4 × (8^2)^1 ÷ 8^5", questionType: "short_answer", options: null, correctAnswer: "8^1", explanation: "Power of power: 8^2. Product: 8^4 × 8^2 = 8^6. Quotient: 8^6 ÷ 8^5 = 8^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (2^2)^3 × (2^3)^1 ÷ 2^5", questionType: "short_answer", options: null, correctAnswer: "2^4", explanation: "First: 2^6. Second: 2^3. Product: 2^9. Quotient: 2^9 ÷ 2^5 = 2^4.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 9^5 ÷ (9^2)^2 × 9^0", questionType: "short_answer", options: null, correctAnswer: "9^1", explanation: "Power of power: 9^4. Quotient: 9^5 ÷ 9^4 = 9^1. 9^0 = 1, so answer is 9^1.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (3^2)^2 × 3^3 ÷ (3^1)^5", questionType: "short_answer", options: null, correctAnswer: "3^2", explanation: "First: 3^4. Product: 3^4 × 3^3 = 3^7. Second: 3^5. Quotient: 3^7 ÷ 3^5 = 3^2.", difficulty: 4, points: 3 },
    { questionText: "Simplify: (4^3)^2 ÷ 4^5 × 4^2", questionType: "short_answer", options: null, correctAnswer: "4^3", explanation: "Power of power: 4^6. Quotient: 4^6 ÷ 4^5 = 4^1. Product: 4^1 × 4^2 = 4^3.", difficulty: 4, points: 3 },
    { questionText: "Simplify: 5^3 × 5^2 × 5^0 ÷ (5^2)^2", questionType: "short_answer", options: null, correctAnswer: "5^1", explanation: "Products: 5^3 × 5^2 × 1 = 5^5. Power of power: 5^4. Quotient: 5^5 ÷ 5^4 = 5^1.", difficulty: 4, points: 3 },
  ];

  // Word problems (difficulty=3): 10
  const wordProblems: Q[] = [
    { questionText: "A bacteria colony doubles every hour. If there are 2^3 bacteria now, how many will there be in 4 hours? Give your answer in index form.", questionType: "short_answer", options: null, correctAnswer: "2^7", explanation: "Doubles 4 times means multiply by 2^4. So 2^3 × 2^4 = 2^7.", difficulty: 3, points: 2 },
    { questionText: "A square has side length 3^2 cm. What is the area of the square? Give your answer in index form.", questionType: "short_answer", options: null, correctAnswer: "3^4", explanation: "Area = side × side = 3^2 × 3^2 = 3^(2+2) = 3^4 cm².", difficulty: 3, points: 2 },
    { questionText: "A cube has edge length 2^2 cm. What is its volume? Give your answer in index form.", questionType: "short_answer", options: null, correctAnswer: "2^6", explanation: "Volume = edge³ = (2^2)^3 = 2^(2×3) = 2^6 cm³.", difficulty: 3, points: 2 },
    { questionText: "A computer processes 4^3 operations per second. How many operations in 4^2 seconds? Give your answer in index form.", questionType: "short_answer", options: null, correctAnswer: "4^5", explanation: "Total = 4^3 × 4^2 = 4^(3+2) = 4^5 operations.", difficulty: 3, points: 2 },
    { questionText: "A tree has 5^4 leaves. If 5^2 leaves fall, what fraction of leaves remains? Simplify using index laws.", questionType: "short_answer", options: null, correctAnswer: "5^2", explanation: "Remaining fraction uses quotient: simplified expression is 5^4 ÷ 5^2 = 5^2 times as many remain for every group that fell.", difficulty: 3, points: 2 },
    { questionText: "A factory produces 6^2 items per hour. After 6^3 hours, how many items total? Give your answer in index form.", questionType: "short_answer", options: null, correctAnswer: "6^5", explanation: "Total = 6^2 × 6^3 = 6^(2+3) = 6^5 items.", difficulty: 3, points: 2 },
    { questionText: "A photo is resized by squaring its dimensions. If the original width is 2^3 pixels, what is the new width after squaring? Answer in index form.", questionType: "short_answer", options: null, correctAnswer: "2^6", explanation: "Squaring: (2^3)^2 = 2^(3×2) = 2^6 pixels.", difficulty: 3, points: 2 },
    { questionText: "A library has 3^5 books split equally among 3^2 shelves. How many books per shelf? Answer in index form.", questionType: "short_answer", options: null, correctAnswer: "3^3", explanation: "Books per shelf = 3^5 ÷ 3^2 = 3^(5−2) = 3^3.", difficulty: 3, points: 2 },
    { questionText: "A garden is divided into 7^3 equal plots. If each plot is further divided into 7^1 sections, how many sections in total? Answer in index form.", questionType: "short_answer", options: null, correctAnswer: "7^4", explanation: "Total sections = 7^3 × 7^1 = 7^(3+1) = 7^4.", difficulty: 3, points: 2 },
    { questionText: "An investment grows by a factor of 2^2 each year. After 3 years, by what total factor has it grown? Answer in index form.", questionType: "short_answer", options: null, correctAnswer: "2^6", explanation: "Total growth = (2^2)^3 = 2^(2×3) = 2^6.", difficulty: 3, points: 2 },
  ];

  // Build all questions
  const allQuestions: {
    lessonId: number | null;
    topicId: number;
    subjectId: number;
    questionText: string;
    questionType: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    points: number;
  }[] = [];

  for (const qd of lessonQuestions) {
    const lessonId = qd.lessonIndex !== null ? createdLessons[qd.lessonIndex].id : null;
    for (const q of qd.questions) {
      allQuestions.push({ lessonId, topicId: topic.id, subjectId: SUBJECT_ID, ...q });
    }
  }

  for (const q of [...easyQuestions, ...mediumQuestions, ...highQuestions, ...challengeQuestions, ...wordProblems]) {
    allQuestions.push({ lessonId: null, topicId: topic.id, subjectId: SUBJECT_ID, ...q });
  }

  await db.insert(quizQuestions).values(allQuestions);

  const counts = {
    easy: allQuestions.filter(q => q.difficulty === 1).length,
    medium: allQuestions.filter(q => q.difficulty === 2).length,
    high: allQuestions.filter(q => q.difficulty === 3).length,
    challenge: allQuestions.filter(q => q.difficulty === 4).length,
    total: allQuestions.length,
  };

  console.log("Created", counts.total, "quiz questions:", JSON.stringify(counts));
  console.log("Seed complete! Topic ID:", topic.id);
  return topic.id;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedIndexLaws()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
