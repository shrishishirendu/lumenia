import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedPerfectAndDifferenceOfSquares() {
  console.log("Seeding Perfect Squares and Difference of Squares content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Perfect Squares and Difference of Squares";

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
    console.log("Perfect Squares and Difference of Squares topic already exists (id=" + topicId + "). Checking for missing data...");

    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) {
      await insertTopicNotes(topicId);
    }

    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) {
      await insertQuizQuestions(topicId, SUBJECT_ID);
    }

    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const expandingBinomialTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Expanding Binomial Products")));
  const prerequisiteId = expandingBinomialTopic.length > 0 ? expandingBinomialTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description:
        "Recognize and expand perfect square identities (x + a)^2, (x - a)^2 and difference of squares (x + a)(x - a). Simplify combined expressions.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 12,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log("Created topic:", topic.id, topic.title);

  await insertTopicNotes(topic.id);

  const lessonData = [
    {
      title: "Perfect Square Identities",
      description: "Expand (x + a)^2 and (x - a)^2 using the perfect square identity.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Expand (x + a)^2 = x^2 + 2ax + a^2",
        "Expand (x - a)^2 = x^2 - 2ax + a^2",
        "Identify the middle term as double the product",
      ],
    },
    {
      title: "Difference of Squares",
      description: "Recognise and expand (x + a)(x - a) = x^2 - a^2.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Recognise the difference of squares pattern",
        "Apply (x + a)(x - a) = x^2 - a^2",
        "Handle non-monic difference of squares (mx + a)(mx - a)",
      ],
    },
    {
      title: "Combined Expressions and Structural Patterns",
      description: "Combine perfect squares and difference of squares in multi-step problems.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Expand and simplify combined expressions",
        "Recognise structural patterns for quick simplification",
        "Apply identities to simplify (x + a)^2 - (x - a)^2",
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
          title: "What Are Perfect Squares?",
          type: "explanation",
          content:
            "A perfect square binomial is when you multiply a binomial by itself:\n\n• (x + a)^2 = x^2 + 2ax + a^2\n• (x - a)^2 = x^2 - 2ax + a^2\n\nThe key insight is that the middle term is always TWICE the product of the two terms in the bracket. The last term is always the square of the constant.\n\nCommon mistake: (x + 3)^2 ≠ x^2 + 9. You must include the middle term: x^2 + 6x + 9.",
          whiteboardContent: null,
          tutorScript:
            "Think of it this way — when you square a binomial, you get three terms: the first squared, twice the product, and the last squared. Never forget the middle term!",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Perfect Squares",
          type: "example",
          content:
            "Example 1: Expand (x + 4)^2\nUse identity: (x + a)^2 = x^2 + 2ax + a^2\nSubstitute a = 4\n= x^2 + 2(4)x + 4^2\n= x^2 + 8x + 16\n\nExample 2: Expand (x - 5)^2\nUse identity: (x - a)^2 = x^2 - 2ax + a^2\nSubstitute a = 5\n= x^2 - 2(5)x + 5^2\n= x^2 - 10x + 25",
          whiteboardContent:
            "(x + 4)^2 = x^2 + 8x + 16 ✓\n(x - 5)^2 = x^2 - 10x + 25 ✓",
          tutorScript:
            "Notice the sign of the middle term matches the sign inside the bracket. If it's (x + a)^2, the middle term is positive. If (x - a)^2, the middle term is negative.",
          orderIndex: 2,
        },
        {
          title: "Practice — Perfect Squares",
          type: "practice",
          content:
            "Try these:\n1. Expand (x + 3)^2\n2. Expand (x - 6)^2\n3. Expand (x + 7)^2\n4. Expand (x - 2)^2\n5. Expand (x + 1)^2\n6. Expand (x - 9)^2",
          whiteboardContent: null,
          tutorScript:
            "Remember: the middle term is always 2 × a × x, and the last term is always a^2. Check your signs!",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 1,
      segments: [
        {
          title: "The Difference of Squares Pattern",
          type: "explanation",
          content:
            "When you multiply conjugate pairs — binomials that are the same except for the sign between them — the middle terms cancel:\n\n(x + a)(x - a) = x^2 - a^2\n\nThis is called the 'difference of squares' because the result is one square minus another.\n\nFor non-monic versions:\n(mx + a)(mx - a) = m^2x^2 - a^2\n\nThe middle terms always cancel, leaving only two terms.",
          whiteboardContent: null,
          tutorScript:
            "The key to recognising a difference of squares is seeing a conjugate pair — same terms, opposite signs. The middle terms always cancel out.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Difference of Squares",
          type: "example",
          content:
            "Example 1: Expand (x + 5)(x - 5)\nRecognize difference of squares\n(x + a)(x - a) = x^2 - a^2\n= x^2 - 25\n\nExample 2: Expand (3x + 4)(3x - 4)\n(mx + a)(mx - a) = (mx)^2 - a^2\n= 9x^2 - 16",
          whiteboardContent:
            "(x + 5)(x - 5) = x^2 - 25 ✓\n(3x + 4)(3x - 4) = 9x^2 - 16 ✓",
          tutorScript:
            "For the non-monic version, remember to square the coefficient as well: (3x)^2 = 9x^2, not 3x^2.",
          orderIndex: 2,
        },
        {
          title: "Practice — Difference of Squares",
          type: "practice",
          content:
            "Try these:\n1. Expand (x + 3)(x - 3)\n2. Expand (x + 8)(x - 8)\n3. Expand (2x + 1)(2x - 1)\n4. Expand (x - 7)(x + 7)\n5. Expand (4x + 3)(4x - 3)\n6. Expand (5x - 2)(5x + 2)",
          whiteboardContent: null,
          tutorScript:
            "These should be quick — just square both terms and subtract. No middle term!",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 2,
      segments: [
        {
          title: "Combining Special Products",
          type: "explanation",
          content:
            "In harder problems, you'll need to combine multiple special products:\n\n1. (x + a)^2 - (x - a)^2 = 4ax (the x^2 and a^2 terms cancel)\n2. (x + a)(x - a) + (x + b)^2 — expand each part, then combine\n3. (x + a)^2 - (x + b)(x - b) — expand and subtract\n\nThese problems test your ability to recognise patterns and simplify efficiently.\n\nTip: Look for cancellations before expanding everything fully.",
          whiteboardContent: null,
          tutorScript:
            "The trick with combined expressions is to expand each part separately, then carefully add or subtract. Watch your signs when subtracting entire expressions.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Combined",
          type: "example",
          content:
            "Example 1: Simplify (x + 3)^2 - (x - 3)^2\nExpand (x + 3)^2 = x^2 + 6x + 9\nExpand (x - 3)^2 = x^2 - 6x + 9\nSubtract: (x^2 + 6x + 9) - (x^2 - 6x + 9)\n= 6x + 6x = 12x\n\nExample 2: Expand (x + 2)(x - 2) + (x + 3)^2\n= x^2 - 4 + x^2 + 6x + 9\n= 2x^2 + 6x + 5",
          whiteboardContent:
            "(x + 3)^2 - (x - 3)^2 = 12x ✓\n(x + 2)(x - 2) + (x + 3)^2 = 2x^2 + 6x + 5 ✓",
          tutorScript:
            "Notice how in the first example, both x^2 and the constant terms cancel, leaving only the middle terms. This always happens with (x + a)^2 - (x - a)^2.",
          orderIndex: 2,
        },
        {
          title: "Practice — Combined Expressions",
          type: "practice",
          content:
            "Try these:\n1. Simplify (x + 5)^2 - (x - 5)^2\n2. Expand and simplify (x + 4)(x - 4) + (x + 1)^2\n3. Expand and simplify (x + 2)^2 + (x - 3)^2\n4. Simplify (x + 6)^2 - (x + 2)^2\n5. Expand (x + 3)^2 - (x + 1)(x - 1)",
          whiteboardContent: null,
          tutorScript:
            "Take your time — expand each part carefully, then combine. Look for terms that cancel or simplify.",
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

  console.log("Perfect Squares and Difference of Squares seed complete.");
  return topic.id;
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary:
      "Perfect square identities and difference of squares are special expansion patterns that allow quick simplification without full FOIL.",
    notesMarkdown: `# Perfect Squares and Difference of Squares — Year 9 Reference

## Perfect Square Identities

| Pattern | Formula | Example |
|---------|---------|---------|
| (x + a)^2 | x^2 + 2ax + a^2 | (x + 3)^2 = x^2 + 6x + 9 |
| (x - a)^2 | x^2 - 2ax + a^2 | (x - 4)^2 = x^2 - 8x + 16 |

**Key insight:** The middle term is always **twice** the product of the two terms.

## Difference of Squares

| Pattern | Formula | Example |
|---------|---------|---------|
| (x + a)(x - a) | x^2 - a^2 | (x + 5)(x - 5) = x^2 - 25 |
| (mx + a)(mx - a) | m^2x^2 - a^2 | (3x + 2)(3x - 2) = 9x^2 - 4 |

**Key insight:** Conjugate pairs always produce just **two terms** — the middle terms cancel.

## Combined Patterns
- (x + a)^2 - (x - a)^2 = 4ax
- Always expand each part separately, then combine
- Watch for cancellations

## Common Mistakes
- Forgetting the middle term: (x + 3)^2 ≠ x^2 + 9
- Sign errors in (x - a)^2: the middle term is negative, but the last term is positive
- In non-monic forms, forgetting to square the coefficient: (3x)^2 = 9x^2`,
    keyFormulas: JSON.stringify([
      "(x + a)^2 = x^2 + 2ax + a^2",
      "(x - a)^2 = x^2 - 2ax + a^2",
      "(x + a)(x - a) = x^2 - a^2",
      "(mx + a)(mx - a) = m^2x^2 - a^2",
      "(x + a)^2 - (x - a)^2 = 4ax",
    ]),
    commonMistakes: JSON.stringify([
      "Forgetting the middle term: (x + 3)^2 ≠ x^2 + 9, it equals x^2 + 6x + 9",
      "Sign error: in (x - a)^2, the last term is +a^2 not -a^2",
      "Not squaring the coefficient: (3x)^2 = 9x^2, not 3x^2",
      "Forgetting middle terms cancel in difference of squares",
    ]),
  });
  console.log("Created topic notes for Perfect Squares and Difference of Squares");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questionBank = [
    { questionText: "Expand (x + 3)^2", correctAnswer: "x^2 + 6x + 9", explanation: "Use identity: (x + a)^2 = x^2 + 2ax + a^2. Substitute a = 3: x^2 + 6x + 9.", difficulty: 1, points: 1 },
    { questionText: "Expand (x + 1)^2", correctAnswer: "x^2 + 2x + 1", explanation: "Use identity: (x + a)^2 = x^2 + 2ax + a^2. Substitute a = 1: x^2 + 2x + 1.", difficulty: 1, points: 1 },
    { questionText: "Expand (x - 2)^2", correctAnswer: "x^2 - 4x + 4", explanation: "Use identity: (x - a)^2 = x^2 - 2ax + a^2. Substitute a = 2: x^2 - 4x + 4.", difficulty: 1, points: 1 },
    { questionText: "Expand (x - 5)^2", correctAnswer: "x^2 - 10x + 25", explanation: "Use identity: (x - a)^2 = x^2 - 2ax + a^2. Substitute a = 5: x^2 - 10x + 25.", difficulty: 1, points: 1 },
    { questionText: "Expand (x + 7)^2", correctAnswer: "x^2 + 14x + 49", explanation: "(x + 7)^2 = x^2 + 2(7)x + 49 = x^2 + 14x + 49.", difficulty: 1, points: 1 },

    { questionText: "Expand (2x + 3)^2", correctAnswer: "4x^2 + 12x + 9", explanation: "(2x + 3)^2 = (2x)^2 + 2(2x)(3) + 9 = 4x^2 + 12x + 9.", difficulty: 2, points: 2 },
    { questionText: "Expand (3x - 1)^2", correctAnswer: "9x^2 - 6x + 1", explanation: "(3x - 1)^2 = 9x^2 - 2(3)(1)x + 1 = 9x^2 - 6x + 1.", difficulty: 2, points: 2 },
    { questionText: "Expand (x + 6)(x - 6)", correctAnswer: "x^2 - 36", explanation: "Difference of squares: x^2 - 6^2 = x^2 - 36.", difficulty: 2, points: 2 },
    { questionText: "Expand (x + 9)(x - 9)", correctAnswer: "x^2 - 81", explanation: "Difference of squares: x^2 - 81.", difficulty: 2, points: 2 },
    { questionText: "Expand (x - 4)(x + 4)", correctAnswer: "x^2 - 16", explanation: "Difference of squares: x^2 - 16.", difficulty: 2, points: 2 },

    { questionText: "Expand (3x + 2)(3x - 2)", correctAnswer: "9x^2 - 4", explanation: "Difference of squares: (3x)^2 - 4 = 9x^2 - 4.", difficulty: 3, points: 3 },
    { questionText: "Expand (4x + 5)(4x - 5)", correctAnswer: "16x^2 - 25", explanation: "Difference of squares: (4x)^2 - 25 = 16x^2 - 25.", difficulty: 3, points: 3 },
    { questionText: "Expand (2x - 7)^2", correctAnswer: "4x^2 - 28x + 49", explanation: "(2x - 7)^2 = 4x^2 - 2(2)(7)x + 49 = 4x^2 - 28x + 49.", difficulty: 3, points: 3 },
    { questionText: "Expand (5x + 1)^2", correctAnswer: "25x^2 + 10x + 1", explanation: "(5x + 1)^2 = 25x^2 + 2(5)(1)x + 1 = 25x^2 + 10x + 1.", difficulty: 3, points: 3 },
    { questionText: "Expand and simplify (x + 3)^2 + (x - 2)^2", correctAnswer: "2x^2 + 2x + 13", explanation: "(x+3)^2 = x^2+6x+9. (x-2)^2 = x^2-4x+4. Sum: 2x^2+2x+13.", difficulty: 3, points: 3 },

    { questionText: "Simplify (x + 4)^2 - (x - 4)^2", correctAnswer: "16x", explanation: "(x+4)^2 = x^2+8x+16. (x-4)^2 = x^2-8x+16. Difference: 16x.", difficulty: 4, points: 4 },
    { questionText: "Expand and simplify (x + 3)(x - 3) + (x + 2)^2", correctAnswer: "2x^2 + 4x - 5", explanation: "(x+3)(x-3) = x^2-9. (x+2)^2 = x^2+4x+4. Sum: 2x^2+4x-5.", difficulty: 4, points: 4 },
    { questionText: "Expand and simplify (x + 5)^2 - (x + 3)(x - 3)", correctAnswer: "10x + 34", explanation: "(x+5)^2 = x^2+10x+25. (x+3)(x-3) = x^2-9. Subtract: x^2+10x+25-(x^2-9) = 10x+25+9 = 10x+34.", difficulty: 4, points: 4 },
    { questionText: "Simplify (x + 6)^2 - (x + 2)^2", correctAnswer: "8x + 32", explanation: "(x+6)^2 = x^2+12x+36. (x+2)^2 = x^2+4x+4. Difference: 8x+32.", difficulty: 4, points: 4 },
    { questionText: "Expand and simplify (x + 1)(x - 1) + (x - 3)^2", correctAnswer: "2x^2 - 6x + 8", explanation: "(x+1)(x-1) = x^2-1. (x-3)^2 = x^2-6x+9. Sum: 2x^2-6x+8.", difficulty: 4, points: 4 },
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
  console.log(`Inserted ${rows.length} quiz questions for Perfect Squares and Difference of Squares`);
}
