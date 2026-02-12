import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedExpandingBinomialProducts() {
  console.log("Seeding Expanding Binomial Products content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Expanding Binomial Products";

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
    const topicId = existing[0].id;
    console.log("Expanding Binomial Products topic already exists (id=" + topicId + "). Checking for missing data...");

    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) {
      await insertTopicNotes(topicId);
    }

    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) {
      await insertQuizQuestions(topicId, SUBJECT_ID);
    }

    return topicId;
  }

  const expandingBracketsTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Expanding Brackets")));
  const prerequisiteId = expandingBracketsTopic.length > 0 ? expandingBracketsTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description:
        "Expand products of two binomials using FOIL, perfect squares, and difference of squares. Simplify results in standard polynomial form.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 11,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log("Created topic:", topic.id, topic.title);

  await insertTopicNotes(topic.id);

  const lessonData = [
    {
      title: "FOIL Method for Monic Binomials",
      description: "Expand (x + a)(x + b) using the FOIL method — First, Outer, Inner, Last.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Expand (x + a)(x + b) using FOIL",
        "Combine like terms to get standard form Ax^2 + Bx + C",
        "Handle positive and negative constants",
      ],
    },
    {
      title: "Perfect Squares and Difference of Squares",
      description: "Recognise and expand (x + a)^2, (x - a)^2, and (x + a)(x - a).",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Expand (x + a)^2 = x^2 + 2ax + a^2",
        "Expand (x - a)^2 = x^2 - 2ax + a^2",
        "Apply the difference of squares formula",
      ],
    },
    {
      title: "Non-Monic Binomials and Combined Expressions",
      description: "Expand products like (ax + b)(cx + d) and simplify multi-term expressions.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Expand non-monic binomial products (ax + b)(cx + d)",
        "Combine expanded expressions",
        "Apply FOIL with larger coefficients",
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

  const segmentData = [
    {
      lessonIndex: 0,
      segments: [
        {
          title: "What Is FOIL?",
          type: "explanation",
          content:
            "FOIL stands for First, Outer, Inner, Last — a method for expanding the product of two binomials.\n\nWhen you see (x + a)(x + b), you multiply:\n• First terms: x × x = x^2\n• Outer terms: x × b = bx\n• Inner terms: a × x = ax\n• Last terms: a × b = ab\n\nThen combine like terms (the x-terms) to get: x^2 + (a + b)x + ab",
          whiteboardContent: null,
          tutorScript:
            "Think of FOIL like making sure every term in the first bracket meets every term in the second bracket. It's like a handshake — everyone shakes hands with everyone.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — FOIL",
          type: "example",
          content:
            "Example 1: Expand (x + 2)(x + 3)\nF: x × x = x^2\nO: x × 3 = 3x\nI: 2 × x = 2x\nL: 2 × 3 = 6\nCombine: x^2 + 3x + 2x + 6 = x^2 + 5x + 6\n\nExample 2: Expand (x + 4)(x - 2)\nF: x^2\nO: -2x\nI: 4x\nL: -8\nCombine: x^2 + 2x - 8",
          whiteboardContent:
            "(x + 2)(x + 3)\n= x^2 + 3x + 2x + 6\n= x^2 + 5x + 6 ✓\n\n(x + 4)(x - 2)\n= x^2 - 2x + 4x - 8\n= x^2 + 2x - 8 ✓",
          tutorScript:
            "Notice how the middle term is always the sum of the two constants (2 + 3 = 5, and 4 + (-2) = 2), and the last term is always their product.",
          orderIndex: 2,
        },
        {
          title: "Practice — FOIL",
          type: "practice",
          content:
            "Try these:\n1. Expand (x + 1)(x + 5)\n2. Expand (x + 3)(x - 4)\n3. Expand (x - 2)(x + 6)\n4. Expand (x - 3)(x - 5)\n5. Expand (x + 7)(x + 2)\n6. Expand (x - 1)(x + 8)",
          whiteboardContent: null,
          tutorScript:
            "Use FOIL each time. Watch your signs carefully — when you have negatives, the inner/outer products may be negative.",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 1,
      segments: [
        {
          title: "Perfect Squares",
          type: "explanation",
          content:
            "A perfect square binomial is when you multiply a binomial by itself:\n\n• (x + a)^2 = x^2 + 2ax + a^2\n• (x - a)^2 = x^2 - 2ax + a^2\n\nThe middle term is ALWAYS double the product of x and a.\n\nDifference of squares:\n• (x + a)(x - a) = x^2 - a^2\nThe middle terms cancel out, leaving only the difference of the squares.",
          whiteboardContent: null,
          tutorScript:
            "Perfect squares are special because the middle term is always twice the product. And the difference of squares is even simpler — the x-terms cancel, leaving just x^2 minus a^2.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Special Products",
          type: "example",
          content:
            "Example 1: Expand (x + 5)^2\n= x^2 + 2(5)x + 25\n= x^2 + 10x + 25\n\nExample 2: Expand (x - 3)^2\n= x^2 - 2(3)x + 9\n= x^2 - 6x + 9\n\nExample 3: Expand (x + 4)(x - 4)\n= x^2 - 16",
          whiteboardContent:
            "(x + 5)^2 = x^2 + 10x + 25 ✓\n(x - 3)^2 = x^2 - 6x + 9 ✓\n(x + 4)(x - 4) = x^2 - 16 ✓",
          tutorScript:
            "For perfect squares, the last term is always the constant squared. For difference of squares, you just square both terms and subtract.",
          orderIndex: 2,
        },
        {
          title: "Practice — Special Products",
          type: "practice",
          content:
            "Try these:\n1. Expand (x + 6)^2\n2. Expand (x - 4)^2\n3. Expand (x + 7)(x - 7)\n4. Expand (x - 8)^2\n5. Expand (x + 3)(x - 3)\n6. Expand (x + 1)^2",
          whiteboardContent: null,
          tutorScript:
            "Remember: perfect squares have a middle term, difference of squares don't. The sign of the middle term matches the sign in the bracket.",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 2,
      segments: [
        {
          title: "Non-Monic Binomials",
          type: "explanation",
          content:
            "When the x-coefficient is not 1, you need to be more careful with FOIL:\n\n(ax + b)(cx + d)\n• F: ax × cx = acx^2\n• O: ax × d = adx\n• I: b × cx = bcx\n• L: b × d = bd\n\nResult: acx^2 + (ad + bc)x + bd\n\nThe leading coefficient is no longer 1, so the middle term requires more careful calculation.",
          whiteboardContent: null,
          tutorScript:
            "The process is the same — FOIL still works. But now you're multiplying coefficients together, so take your time with the arithmetic.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Non-Monic",
          type: "example",
          content:
            "Example 1: Expand (2x + 3)(x + 4)\nF: 2x × x = 2x^2\nO: 2x × 4 = 8x\nI: 3 × x = 3x\nL: 3 × 4 = 12\nCombine: 2x^2 + 11x + 12\n\nExample 2: Expand (3x - 2)(2x + 5)\nF: 6x^2\nO: 15x\nI: -4x\nL: -10\nCombine: 6x^2 + 11x - 10",
          whiteboardContent:
            "(2x + 3)(x + 4)\n= 2x^2 + 8x + 3x + 12\n= 2x^2 + 11x + 12 ✓\n\n(3x - 2)(2x + 5)\n= 6x^2 + 15x - 4x - 10\n= 6x^2 + 11x - 10 ✓",
          tutorScript:
            "For non-monic binomials, the leading coefficient of x^2 is the product of both x-coefficients. Double-check your arithmetic on each step.",
          orderIndex: 2,
        },
        {
          title: "Practice — Non-Monic Binomials",
          type: "practice",
          content:
            "Try these:\n1. Expand (2x + 1)(x + 3)\n2. Expand (3x + 2)(2x - 1)\n3. Expand (4x - 3)(x + 2)\n4. Expand (2x + 5)(3x - 4)\n5. Expand (3x + 1)^2\n6. Expand (2x + 3)(2x - 3)",
          whiteboardContent: null,
          tutorScript:
            "Apply FOIL carefully. Remember that for non-monic difference of squares like (2x + 3)(2x - 3), the result is (2x)^2 - 9 = 4x^2 - 9.",
          orderIndex: 3,
        },
      ],
    },
  ];

  const allSegments: Array<{
    lessonId: number;
    title: string;
    segmentType: "explanation" | "example" | "practice";
    content: string;
    whiteboardContent: string | null;
    tutorScript: string | null;
    orderIndex: number;
  }> = [];

  for (const sd of segmentData) {
    const lesson = createdLessons[sd.lessonIndex];
    for (const seg of sd.segments) {
      allSegments.push({
        lessonId: lesson.id,
        title: seg.title,
        segmentType: seg.type as "explanation" | "example" | "practice",
        content: seg.content,
        whiteboardContent: seg.whiteboardContent,
        tutorScript: seg.tutorScript,
        orderIndex: seg.orderIndex,
      });
    }
  }

  await db.insert(lessonSegments).values(allSegments);
  console.log("Created", allSegments.length, "lesson segments");

  await insertQuizQuestions(topic.id, SUBJECT_ID);

  console.log("Expanding Binomial Products seed complete.");
  return topic.id;
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary:
      "Expanding binomial products means multiplying two brackets using FOIL. Special cases include perfect squares and difference of squares.",
    notesMarkdown: `# Expanding Binomial Products — Year 9 Reference

## Core Idea
**Expanding** two binomials means multiplying every term in the first bracket by every term in the second bracket, then combining like terms.

## FOIL Method
For (x + a)(x + b):

| Step | Multiply | Result |
|------|----------|--------|
| First | x × x | x^2 |
| Outer | x × b | bx |
| Inner | a × x | ax |
| Last | a × b | ab |

**Result:** x^2 + (a + b)x + ab

## Special Products

| Pattern | Formula | Example |
|---------|---------|---------|
| Perfect square (positive) | (x + a)^2 = x^2 + 2ax + a^2 | (x + 3)^2 = x^2 + 6x + 9 |
| Perfect square (negative) | (x - a)^2 = x^2 - 2ax + a^2 | (x - 4)^2 = x^2 - 8x + 16 |
| Difference of squares | (x + a)(x - a) = x^2 - a^2 | (x + 5)(x - 5) = x^2 - 25 |

## Non-Monic Binomials
For (ax + b)(cx + d):
- Leading term: acx^2
- Middle term: (ad + bc)x
- Constant: bd

## Common Mistakes
- Forgetting the middle term in perfect squares: (x + 3)^2 ≠ x^2 + 9
- Sign errors with negative constants
- Missing the cross-multiplication in non-monic products`,
    keyFormulas: JSON.stringify([
      "(x + a)(x + b) = x^2 + (a + b)x + ab",
      "(x + a)^2 = x^2 + 2ax + a^2",
      "(x - a)^2 = x^2 - 2ax + a^2",
      "(x + a)(x - a) = x^2 - a^2",
      "(ax + b)(cx + d) = acx^2 + (ad + bc)x + bd",
    ]),
    commonMistakes: JSON.stringify([
      "Forgetting the middle term in perfect squares: (x + 3)^2 ≠ x^2 + 9, it equals x^2 + 6x + 9",
      "Sign errors: (x - 4)(x + 2) has last term -8 not +8",
      "Forgetting to combine like terms after FOIL",
      "In non-monic products, miscalculating the middle coefficient",
    ]),
  });
  console.log("Created topic notes for Expanding Binomial Products");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questionBank = [
    { questionText: "Expand (x + 1)(x + 2)", correctAnswer: "x^2 + 3x + 2", explanation: "FOIL: x^2 + 2x + x + 2 = x^2 + 3x + 2.", difficulty: 1, points: 1 },
    { questionText: "Expand (x + 3)(x + 4)", correctAnswer: "x^2 + 7x + 12", explanation: "FOIL: x^2 + 4x + 3x + 12 = x^2 + 7x + 12.", difficulty: 1, points: 1 },
    { questionText: "Expand (x + 2)(x + 5)", correctAnswer: "x^2 + 7x + 10", explanation: "FOIL: x^2 + 5x + 2x + 10 = x^2 + 7x + 10.", difficulty: 1, points: 1 },
    { questionText: "Expand (x + 1)(x - 3)", correctAnswer: "x^2 - 2x - 3", explanation: "FOIL: x^2 - 3x + x - 3 = x^2 - 2x - 3.", difficulty: 1, points: 1 },
    { questionText: "Expand (x - 2)(x - 4)", correctAnswer: "x^2 - 6x + 8", explanation: "FOIL: x^2 - 4x - 2x + 8 = x^2 - 6x + 8.", difficulty: 1, points: 1 },

    { questionText: "Expand (x + 5)^2", correctAnswer: "x^2 + 10x + 25", explanation: "(x + 5)^2 = x^2 + 2(5)x + 25 = x^2 + 10x + 25.", difficulty: 2, points: 2 },
    { questionText: "Expand (x - 3)^2", correctAnswer: "x^2 - 6x + 9", explanation: "(x - 3)^2 = x^2 - 2(3)x + 9 = x^2 - 6x + 9.", difficulty: 2, points: 2 },
    { questionText: "Expand (x + 4)(x - 4)", correctAnswer: "x^2 - 16", explanation: "Difference of squares: x^2 - 4^2 = x^2 - 16.", difficulty: 2, points: 2 },
    { questionText: "Expand (x + 6)(x - 6)", correctAnswer: "x^2 - 36", explanation: "Difference of squares: x^2 - 36.", difficulty: 2, points: 2 },
    { questionText: "Expand (x - 7)^2", correctAnswer: "x^2 - 14x + 49", explanation: "(x - 7)^2 = x^2 - 14x + 49.", difficulty: 2, points: 2 },
    { questionText: "Expand (x + 8)(x - 2)", correctAnswer: "x^2 + 6x - 16", explanation: "FOIL: x^2 - 2x + 8x - 16 = x^2 + 6x - 16.", difficulty: 2, points: 2 },

    { questionText: "Expand (2x + 1)(x + 3)", correctAnswer: "2x^2 + 7x + 3", explanation: "FOIL: 2x^2 + 6x + x + 3 = 2x^2 + 7x + 3.", difficulty: 3, points: 3 },
    { questionText: "Expand (3x + 2)(x - 4)", correctAnswer: "3x^2 - 10x - 8", explanation: "FOIL: 3x^2 - 12x + 2x - 8 = 3x^2 - 10x - 8.", difficulty: 3, points: 3 },
    { questionText: "Expand (2x - 3)(2x + 3)", correctAnswer: "4x^2 - 9", explanation: "Difference of squares: (2x)^2 - 9 = 4x^2 - 9.", difficulty: 3, points: 3 },
    { questionText: "Expand (2x + 5)^2", correctAnswer: "4x^2 + 20x + 25", explanation: "(2x + 5)^2 = 4x^2 + 2(2x)(5) + 25 = 4x^2 + 20x + 25.", difficulty: 3, points: 3 },
    { questionText: "Expand (3x - 1)(2x + 5)", correctAnswer: "6x^2 + 13x - 5", explanation: "FOIL: 6x^2 + 15x - 2x - 5 = 6x^2 + 13x - 5.", difficulty: 3, points: 3 },

    { questionText: "Expand and simplify (x + 2)(x + 3) + (x + 1)(x + 4)", correctAnswer: "2x^2 + 10x + 10", explanation: "First: x^2 + 5x + 6. Second: x^2 + 5x + 4. Sum: 2x^2 + 10x + 10.", difficulty: 4, points: 4 },
    { questionText: "Expand (x + 1)(x + 2)(x + 3)", correctAnswer: "x^3 + 6x^2 + 11x + 6", explanation: "First (x+1)(x+2) = x^2+3x+2. Then multiply by (x+3) = x^3+6x^2+11x+6.", difficulty: 4, points: 4 },
    { questionText: "Expand and simplify (x + 3)^2 + (x + 2)(x - 2)", correctAnswer: "2x^2 + 6x + 5", explanation: "(x+3)^2 = x^2+6x+9. (x+2)(x-2) = x^2-4. Sum: 2x^2+6x+5.", difficulty: 4, points: 4 },
    { questionText: "Expand (3x - 4)(3x + 4)", correctAnswer: "9x^2 - 16", explanation: "Difference of squares: (3x)^2 - 16 = 9x^2 - 16.", difficulty: 4, points: 4 },
  ];

  const rows = questionBank.map(q => ({
    topicId,
    subjectId,
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
  console.log(`Inserted ${rows.length} quiz questions for Expanding Binomial Products`);
}
