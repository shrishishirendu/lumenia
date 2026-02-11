import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedExpandingBrackets() {
  console.log("Seeding Expanding Brackets content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Expanding Brackets";

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
    console.log("Expanding Brackets topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const indexLawsTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Index Laws")));
  const prerequisiteId = indexLawsTopic.length > 0 ? indexLawsTopic[0].id : null;

  await db
    .update(topics)
    .set({ orderIndex: 4 })
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Linear Equations")));

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description:
        "Use the distributive law to expand single brackets, handle negative multipliers, and simplify expressions after expansion.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 3,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log("Created topic:", topic.id, topic.title);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary:
      "Expanding brackets uses the distributive law: multiply every term inside the bracket, then simplify.",
    notesMarkdown: `# Expanding Brackets — Year 9 Reference

## Core Idea
**Expanding** (or "distributing") removes brackets by multiplying each term inside the bracket by the term outside.

## Key Rules

| Rule | Pattern | Example |
|------|---------|---------|
| Distributive law | a(b + c) = ab + ac | 3(x + 4) = 3x + 12 |
| Subtraction inside | a(b − c) = ab − ac | 5(2x − 3) = 10x − 15 |
| Negative multiplier | −a(b + c) = −ab − ac | −2(x + 7) = −2x − 14 |
| Negative with subtraction | −a(b − c) = −ab + ac | −4(3x − 2) = −12x + 8 |
| Minus sign only | −(b + c) = −b − c | −(x + 5) = −x − 5 |
| Minus sign with sub | −(b − c) = −b + c | −(x − 3) = −x + 3 |

## Steps to Expand
1. **Multiply** the outside term by the first term inside the bracket.
2. **Multiply** the outside term by the second term inside the bracket.
3. **Watch your signs** — a negative times a negative gives a positive.
4. **Combine like terms** if there are any.

## Common Mistakes
- Forgetting to multiply the outside term by **every** term inside the bracket (not just the first one).
- Sign errors with negative multipliers: −3(x − 4) = −3x + 12, **not** −3x − 12.
- Forgetting that −(x + 5) means −1(x + 5) = −x − 5.
- Not simplifying after expansion: 2(3x + 1) + 4x = 6x + 2 + 4x = **10x + 2**.`,
    keyFormulas: JSON.stringify([
      "a(b + c) = ab + ac (distributive law)",
      "a(b − c) = ab − ac",
      "−a(b + c) = −ab − ac",
      "−a(b − c) = −ab + ac",
      "−(b + c) = −b − c",
      "−(b − c) = −b + c",
    ]),
    commonMistakes: JSON.stringify([
      "Only multiplying the first term inside the bracket and forgetting the second",
      "Sign errors with negative multipliers: −3(x − 4) = −3x + 12, NOT −3x − 12",
      "Forgetting −(x + 5) means −1 × (x + 5) = −x − 5",
      "Not combining like terms after expanding",
    ]),
  });
  console.log("Created topic notes for Expanding Brackets");

  const lessonData = [
    {
      title: "Distributive Law Basics",
      description:
        "Learn to expand a(b + c) and a(b − c) by multiplying every term inside the bracket.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Expand a(b + c) and a(b − c)",
        "Multiply every term inside the bracket",
        "Simplify simple results",
      ],
    },
    {
      title: "Negatives and Subtraction in Brackets",
      description:
        "Handle negative multipliers and subtraction inside brackets without sign errors.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Expand −a(b ± c) correctly",
        "Handle subtraction inside brackets without sign errors",
        "Check reasonableness of signs",
      ],
    },
    {
      title: "Expanding with Variables and Simplifying",
      description:
        "Expand expressions like 2(3x − 4) and −3(2x + 5), then combine like terms.",
      orderIndex: 3,
      estimatedMinutes: 15,
      objectives: [
        "Expand expressions such as 2(3x − 4) and −3(2x + 5)",
        "Combine like terms after expansion",
        "Produce fully simplified expressions",
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
          title: "What Is Expanding?",
          type: "explanation",
          content:
            "Expanding brackets means removing the brackets by multiplying each term inside by the term outside. This is called the distributive law.\n\nThe rule is simple:\n• a(b + c) = ab + ac\n• a(b − c) = ab − ac\n\nThink of it as the outside number 'visiting' each term inside the bracket, one at a time.",
          whiteboardContent: null,
          tutorScript:
            "Let's break it down step by step. When you see brackets in algebra, the number outside is multiplied by everything inside. It's like handing out — the outside number gives itself to each term.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Basic Expansion",
          type: "example",
          content:
            "Example 1: Expand 3(x + 4)\nStep 1: 3 × x = 3x\nStep 2: 3 × 4 = 12\nAnswer: 3x + 12\n\nExample 2: Expand 5(2x − 3)\nStep 1: 5 × 2x = 10x\nStep 2: 5 × (−3) = −15\nAnswer: 10x − 15",
          whiteboardContent:
            "3(x + 4)\n= 3·x + 3·4\n= 3x + 12 ✓\n\n5(2x − 3)\n= 5·2x + 5·(−3)\n= 10x − 15 ✓",
          tutorScript:
            "Notice how I multiply the outside number by EACH term inside. In the second example, 5 times negative 3 gives negative 15 — always watch the sign of the second term.",
          orderIndex: 2,
        },
        {
          title: "Practice — Basic Expansion",
          type: "practice",
          content:
            "Try these yourself:\n1. Expand 4(x + 2)\n2. Expand 6(x − 1)\n3. Expand 2(3x + 5)\n4. Expand 7(x − 4)\n5. Expand 3(2x + 1)\n6. Expand 8(x + 3)",
          whiteboardContent: null,
          tutorScript:
            "Remember: multiply the outside number by the first term, then by the second term. Check your signs carefully — if there's a minus inside the bracket, the second product will be negative.",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 1,
      segments: [
        {
          title: "Negative Multipliers",
          type: "explanation",
          content:
            "When the number outside the bracket is negative, every product picks up a sign change:\n• −a(b + c) = −ab − ac (both become negative)\n• −a(b − c) = −ab + ac (the subtraction flips to addition)\n\nA common special case is −(b + c), which really means −1(b + c) = −b − c.\n\nThe key rule: negative × positive = negative, and negative × negative = positive.",
          whiteboardContent: null,
          tutorScript:
            "This is where most students make mistakes. When the multiplier is negative, think carefully about each sign. Negative times positive gives negative. Negative times negative gives positive. Take it one term at a time.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Negative Multipliers",
          type: "example",
          content:
            "Example 1: Expand −2(x + 7)\nStep 1: −2 × x = −2x\nStep 2: −2 × 7 = −14\nAnswer: −2x − 14\n\nExample 2: Expand −4(3x − 2)\nStep 1: −4 × 3x = −12x\nStep 2: −4 × (−2) = +8\nAnswer: −12x + 8",
          whiteboardContent:
            "−2(x + 7)\n= (−2)·x + (−2)·7\n= −2x − 14 ✓\n\n−4(3x − 2)\n= (−4)·3x + (−4)·(−2)\n= −12x + 8 ✓",
          tutorScript:
            "In the second example, notice that −4 times −2 gives POSITIVE 8. A negative times a negative always gives a positive. This is the most common source of errors, so take your time with it.",
          orderIndex: 2,
        },
        {
          title: "Practice — Negative Multipliers",
          type: "practice",
          content:
            "Try these yourself:\n1. Expand −3(x + 5)\n2. Expand −(x + 4)\n3. Expand −5(2x − 1)\n4. Expand −2(4x + 3)\n5. Expand −(3x − 7)\n6. Expand −6(x − 2)",
          whiteboardContent: null,
          tutorScript:
            "For each one, ask yourself: what is the sign of the multiplier? Then multiply it by each term inside, being very careful about negatives. Remember, −(x + 4) means −1 × (x + 4).",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 2,
      segments: [
        {
          title: "Expanding and Simplifying",
          type: "explanation",
          content:
            "Sometimes after expanding you need to combine like terms to simplify the expression:\n• Expand each bracket\n• Group the x-terms together and the constant terms together\n• Add or subtract to simplify\n\nFor example: 2(3x + 1) + 4x\nStep 1: Expand → 6x + 2 + 4x\nStep 2: Combine like terms → (6x + 4x) + 2 = 10x + 2",
          whiteboardContent: null,
          tutorScript:
            "Expanding is step one. But if there are extra terms outside the bracket, or multiple brackets, you'll need to combine like terms afterwards. Always look for terms with x that can be added together, and constants that can be combined.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples — Expand and Simplify",
          type: "example",
          content:
            "Example 1: Expand and simplify 3(2x − 4) + 5\nStep 1: 3 × 2x = 6x, 3 × (−4) = −12\nStep 2: 6x − 12 + 5\nStep 3: 6x + (−12 + 5) = 6x − 7\n\nExample 2: Expand and simplify −2(x + 3) + 8x\nStep 1: −2 × x = −2x, −2 × 3 = −6\nStep 2: −2x − 6 + 8x\nStep 3: (−2x + 8x) − 6 = 6x − 6",
          whiteboardContent:
            "3(2x − 4) + 5\n= 6x − 12 + 5\n= 6x − 7 ✓\n\n−2(x + 3) + 8x\n= −2x − 6 + 8x\n= 6x − 6 ✓",
          tutorScript:
            "After expanding, look for like terms. In the first example, −12 and +5 are both constants so they combine to −7. In the second, −2x and 8x are both x-terms so they combine to 6x.",
          orderIndex: 2,
        },
        {
          title: "Practice — Expand and Simplify",
          type: "practice",
          content:
            "Try these yourself:\n1. Expand and simplify 4(x + 3) + 2x\n2. Expand and simplify 5(2x − 1) − 3x\n3. Expand and simplify −3(x − 4) + 2\n4. Expand and simplify 2(5x + 3) − 7\n5. Expand and simplify −(2x + 6) + 9x\n6. Expand and simplify 6(3x − 2) + 5",
          whiteboardContent: null,
          tutorScript:
            "Expand first, then combine. Group x-terms together and constants together. Remember to watch your signs when combining negative terms.",
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

  const L1 = createdLessons[0].id;
  const L2 = createdLessons[1].id;
  const L3 = createdLessons[2].id;

  const questionBank: Array<{
    questionText: string;
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    points: number;
    lessonId: number | null;
  }> = [
    // ======== EASY (difficulty=1) — 15 questions — numeric-only distributive law ========
    { questionText: "Expand: 2(3 + 4)", correctAnswer: "14", explanation: "2 × 3 + 2 × 4 = 6 + 8 = 14.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 3(5 + 2)", correctAnswer: "21", explanation: "3 × 5 + 3 × 2 = 15 + 6 = 21.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 4(6 + 1)", correctAnswer: "28", explanation: "4 × 6 + 4 × 1 = 24 + 4 = 28.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 5(3 + 7)", correctAnswer: "50", explanation: "5 × 3 + 5 × 7 = 15 + 35 = 50.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 2(9 + 1)", correctAnswer: "20", explanation: "2 × 9 + 2 × 1 = 18 + 2 = 20.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 6(2 + 3)", correctAnswer: "30", explanation: "6 × 2 + 6 × 3 = 12 + 18 = 30.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 7(4 + 1)", correctAnswer: "35", explanation: "7 × 4 + 7 × 1 = 28 + 7 = 35.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 3(8 − 2)", correctAnswer: "18", explanation: "3 × 8 − 3 × 2 = 24 − 6 = 18.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 4(7 − 3)", correctAnswer: "16", explanation: "4 × 7 − 4 × 3 = 28 − 12 = 16.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 5(6 − 1)", correctAnswer: "25", explanation: "5 × 6 − 5 × 1 = 30 − 5 = 25.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 8(3 + 2)", correctAnswer: "40", explanation: "8 × 3 + 8 × 2 = 24 + 16 = 40.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 9(2 + 1)", correctAnswer: "27", explanation: "9 × 2 + 9 × 1 = 18 + 9 = 27.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 6(5 − 2)", correctAnswer: "18", explanation: "6 × 5 − 6 × 2 = 30 − 12 = 18.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 7(3 − 1)", correctAnswer: "14", explanation: "7 × 3 − 7 × 1 = 21 − 7 = 14.", difficulty: 1, points: 1, lessonId: L1 },
    { questionText: "Expand: 2(8 + 5)", correctAnswer: "26", explanation: "2 × 8 + 2 × 5 = 16 + 10 = 26.", difficulty: 1, points: 1, lessonId: L1 },

    // ======== MEDIUM (difficulty=2) — 30 questions — single variable x, simple ========
    { questionText: "Expand: 2(x + 3)", correctAnswer: "2x + 6", explanation: "2 × x = 2x, 2 × 3 = 6. Answer: 2x + 6.", difficulty: 2, points: 2, lessonId: L1 },
    { questionText: "Expand: 3(x + 5)", correctAnswer: "3x + 15", explanation: "3 × x = 3x, 3 × 5 = 15. Answer: 3x + 15.", difficulty: 2, points: 2, lessonId: L1 },
    { questionText: "Expand: 4(x − 2)", correctAnswer: "4x − 8", explanation: "4 × x = 4x, 4 × (−2) = −8. Answer: 4x − 8.", difficulty: 2, points: 2, lessonId: L1 },
    { questionText: "Expand: 5(x + 1)", correctAnswer: "5x + 5", explanation: "5 × x = 5x, 5 × 1 = 5. Answer: 5x + 5.", difficulty: 2, points: 2, lessonId: L1 },
    { questionText: "Expand: 6(x − 3)", correctAnswer: "6x − 18", explanation: "6 × x = 6x, 6 × (−3) = −18. Answer: 6x − 18.", difficulty: 2, points: 2, lessonId: L1 },
    { questionText: "Expand: 7(x + 4)", correctAnswer: "7x + 28", explanation: "7 × x = 7x, 7 × 4 = 28. Answer: 7x + 28.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 8(x − 5)", correctAnswer: "8x − 40", explanation: "8 × x = 8x, 8 × (−5) = −40. Answer: 8x − 40.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 9(x + 2)", correctAnswer: "9x + 18", explanation: "9 × x = 9x, 9 × 2 = 18. Answer: 9x + 18.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 3(x − 7)", correctAnswer: "3x − 21", explanation: "3 × x = 3x, 3 × (−7) = −21. Answer: 3x − 21.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 2(x + 9)", correctAnswer: "2x + 18", explanation: "2 × x = 2x, 2 × 9 = 18. Answer: 2x + 18.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 4(x + 6)", correctAnswer: "4x + 24", explanation: "4 × x = 4x, 4 × 6 = 24. Answer: 4x + 24.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 5(x − 4)", correctAnswer: "5x − 20", explanation: "5 × x = 5x, 5 × (−4) = −20. Answer: 5x − 20.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 2(2x + 3)", correctAnswer: "4x + 6", explanation: "2 × 2x = 4x, 2 × 3 = 6. Answer: 4x + 6.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 3(2x + 1)", correctAnswer: "6x + 3", explanation: "3 × 2x = 6x, 3 × 1 = 3. Answer: 6x + 3.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 4(3x + 2)", correctAnswer: "12x + 8", explanation: "4 × 3x = 12x, 4 × 2 = 8. Answer: 12x + 8.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 5(2x − 3)", correctAnswer: "10x − 15", explanation: "5 × 2x = 10x, 5 × (−3) = −15. Answer: 10x − 15.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 2(4x + 1)", correctAnswer: "8x + 2", explanation: "2 × 4x = 8x, 2 × 1 = 2. Answer: 8x + 2.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 6(2x − 1)", correctAnswer: "12x − 6", explanation: "6 × 2x = 12x, 6 × (−1) = −6. Answer: 12x − 6.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 3(4x − 5)", correctAnswer: "12x − 15", explanation: "3 × 4x = 12x, 3 × (−5) = −15. Answer: 12x − 15.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 7(2x + 3)", correctAnswer: "14x + 21", explanation: "7 × 2x = 14x, 7 × 3 = 21. Answer: 14x + 21.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 8(x + 1)", correctAnswer: "8x + 8", explanation: "8 × x = 8x, 8 × 1 = 8. Answer: 8x + 8.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 9(x − 3)", correctAnswer: "9x − 27", explanation: "9 × x = 9x, 9 × (−3) = −27. Answer: 9x − 27.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 4(2x − 7)", correctAnswer: "8x − 28", explanation: "4 × 2x = 8x, 4 × (−7) = −28. Answer: 8x − 28.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 2(5x + 4)", correctAnswer: "10x + 8", explanation: "2 × 5x = 10x, 2 × 4 = 8. Answer: 10x + 8.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 6(x + 7)", correctAnswer: "6x + 42", explanation: "6 × x = 6x, 6 × 7 = 42. Answer: 6x + 42.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 3(3x + 4)", correctAnswer: "9x + 12", explanation: "3 × 3x = 9x, 3 × 4 = 12. Answer: 9x + 12.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 5(3x + 2)", correctAnswer: "15x + 10", explanation: "5 × 3x = 15x, 5 × 2 = 10. Answer: 15x + 10.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 7(x − 6)", correctAnswer: "7x − 42", explanation: "7 × x = 7x, 7 × (−6) = −42. Answer: 7x − 42.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 2(3x − 8)", correctAnswer: "6x − 16", explanation: "2 × 3x = 6x, 2 × (−8) = −16. Answer: 6x − 16.", difficulty: 2, points: 2, lessonId: L3 },
    { questionText: "Expand: 4(x + 8)", correctAnswer: "4x + 32", explanation: "4 × x = 4x, 4 × 8 = 32. Answer: 4x + 32.", difficulty: 2, points: 2, lessonId: L3 },

    // ======== HIGH (difficulty=3) — 25 questions — negative multipliers ========
    { questionText: "Expand: −2(x + 3)", correctAnswer: "−2x − 6", explanation: "−2 × x = −2x, −2 × 3 = −6. Answer: −2x − 6.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −3(x + 5)", correctAnswer: "−3x − 15", explanation: "−3 × x = −3x, −3 × 5 = −15. Answer: −3x − 15.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −4(x − 2)", correctAnswer: "−4x + 8", explanation: "−4 × x = −4x, −4 × (−2) = +8. Answer: −4x + 8.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −5(x − 1)", correctAnswer: "−5x + 5", explanation: "−5 × x = −5x, −5 × (−1) = +5. Answer: −5x + 5.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(x + 7)", correctAnswer: "−x − 7", explanation: "−1 × x = −x, −1 × 7 = −7. Answer: −x − 7.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(x − 4)", correctAnswer: "−x + 4", explanation: "−1 × x = −x, −1 × (−4) = +4. Answer: −x + 4.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −2(3x + 1)", correctAnswer: "−6x − 2", explanation: "−2 × 3x = −6x, −2 × 1 = −2. Answer: −6x − 2.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −3(2x − 4)", correctAnswer: "−6x + 12", explanation: "−3 × 2x = −6x, −3 × (−4) = +12. Answer: −6x + 12.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −4(2x + 5)", correctAnswer: "−8x − 20", explanation: "−4 × 2x = −8x, −4 × 5 = −20. Answer: −8x − 20.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −5(3x − 2)", correctAnswer: "−15x + 10", explanation: "−5 × 3x = −15x, −5 × (−2) = +10. Answer: −15x + 10.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −6(x + 4)", correctAnswer: "−6x − 24", explanation: "−6 × x = −6x, −6 × 4 = −24. Answer: −6x − 24.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −7(x − 3)", correctAnswer: "−7x + 21", explanation: "−7 × x = −7x, −7 × (−3) = +21. Answer: −7x + 21.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(2x + 9)", correctAnswer: "−2x − 9", explanation: "−1 × 2x = −2x, −1 × 9 = −9. Answer: −2x − 9.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(3x − 5)", correctAnswer: "−3x + 5", explanation: "−1 × 3x = −3x, −1 × (−5) = +5. Answer: −3x + 5.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −2(4x − 3)", correctAnswer: "−8x + 6", explanation: "−2 × 4x = −8x, −2 × (−3) = +6. Answer: −8x + 6.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −3(x + 8)", correctAnswer: "−3x − 24", explanation: "−3 × x = −3x, −3 × 8 = −24. Answer: −3x − 24.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −8(x − 1)", correctAnswer: "−8x + 8", explanation: "−8 × x = −8x, −8 × (−1) = +8. Answer: −8x + 8.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −9(x + 2)", correctAnswer: "−9x − 18", explanation: "−9 × x = −9x, −9 × 2 = −18. Answer: −9x − 18.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(4x + 6)", correctAnswer: "−4x − 6", explanation: "−1 × 4x = −4x, −1 × 6 = −6. Answer: −4x − 6.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −(5x − 8)", correctAnswer: "−5x + 8", explanation: "−1 × 5x = −5x, −1 × (−8) = +8. Answer: −5x + 8.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −6(2x − 3)", correctAnswer: "−12x + 18", explanation: "−6 × 2x = −12x, −6 × (−3) = +18. Answer: −12x + 18.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −2(5x + 7)", correctAnswer: "−10x − 14", explanation: "−2 × 5x = −10x, −2 × 7 = −14. Answer: −10x − 14.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −4(x + 9)", correctAnswer: "−4x − 36", explanation: "−4 × x = −4x, −4 × 9 = −36. Answer: −4x − 36.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −7(2x + 1)", correctAnswer: "−14x − 7", explanation: "−7 × 2x = −14x, −7 × 1 = −7. Answer: −14x − 7.", difficulty: 3, points: 3, lessonId: L2 },
    { questionText: "Expand: −3(4x + 2)", correctAnswer: "−12x − 6", explanation: "−3 × 4x = −12x, −3 × 2 = −6. Answer: −12x − 6.", difficulty: 3, points: 3, lessonId: L2 },

    // ======== CHALLENGE (difficulty=4) — 20 questions — multi-step simplify ========
    { questionText: "Expand and simplify: 2(3x + 4) + 5", correctAnswer: "6x + 13", explanation: "2 × 3x = 6x, 2 × 4 = 8. So 6x + 8 + 5 = 6x + 13.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 3(2x − 1) + 4x", correctAnswer: "10x − 3", explanation: "3 × 2x = 6x, 3 × (−1) = −3. So 6x − 3 + 4x = 10x − 3.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 4(x + 5) − 3", correctAnswer: "4x + 17", explanation: "4 × x = 4x, 4 × 5 = 20. So 4x + 20 − 3 = 4x + 17.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 5(x − 2) + 3x", correctAnswer: "8x − 10", explanation: "5 × x = 5x, 5 × (−2) = −10. So 5x − 10 + 3x = 8x − 10.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: −2(x + 4) + 10", correctAnswer: "−2x + 2", explanation: "−2 × x = −2x, −2 × 4 = −8. So −2x − 8 + 10 = −2x + 2.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: −3(2x − 1) + 8x", correctAnswer: "2x + 3", explanation: "−3 × 2x = −6x, −3 × (−1) = 3. So −6x + 3 + 8x = 2x + 3.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 4(2x + 3) − 2x", correctAnswer: "6x + 12", explanation: "4 × 2x = 8x, 4 × 3 = 12. So 8x + 12 − 2x = 6x + 12.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 6(x − 1) + 3x", correctAnswer: "9x − 6", explanation: "6 × x = 6x, 6 × (−1) = −6. So 6x − 6 + 3x = 9x − 6.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 3(x + 2) − x", correctAnswer: "2x + 6", explanation: "3 × x = 3x, 3 × 2 = 6. So 3x + 6 − x = 2x + 6.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 5(x + 1) + 7", correctAnswer: "5x + 12", explanation: "5 × x = 5x, 5 × 1 = 5. So 5x + 5 + 7 = 5x + 12.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 4(3x − 2) − 5x", correctAnswer: "7x − 8", explanation: "4 × 3x = 12x, 4 × (−2) = −8. So 12x − 8 − 5x = 7x − 8.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: −(x + 5) + 4x", correctAnswer: "3x − 5", explanation: "−x − 5 + 4x = 3x − 5.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 2(x − 6) + 15", correctAnswer: "2x + 3", explanation: "2 × x = 2x, 2 × (−6) = −12. So 2x − 12 + 15 = 2x + 3.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 7(x + 1) − 4x", correctAnswer: "3x + 7", explanation: "7 × x = 7x, 7 × 1 = 7. So 7x + 7 − 4x = 3x + 7.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: −2(3x + 4) + 9x", correctAnswer: "3x − 8", explanation: "−6x − 8 + 9x = 3x − 8.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 8(x − 2) + 3", correctAnswer: "8x − 13", explanation: "8 × x = 8x, 8 × (−2) = −16. So 8x − 16 + 3 = 8x − 13.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 2(4x + 5) − 6x", correctAnswer: "2x + 10", explanation: "2 × 4x = 8x, 2 × 5 = 10. So 8x + 10 − 6x = 2x + 10.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 3(x − 3) + 11", correctAnswer: "3x + 2", explanation: "3 × x = 3x, 3 × (−3) = −9. So 3x − 9 + 11 = 3x + 2.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: −4(x − 2) + 6x", correctAnswer: "2x + 8", explanation: "−4 × x = −4x, −4 × (−2) = +8. So −4x + 8 + 6x = 2x + 8.", difficulty: 4, points: 4, lessonId: L3 },
    { questionText: "Expand and simplify: 9(x + 2) − 5x", correctAnswer: "4x + 18", explanation: "9 × x = 9x, 9 × 2 = 18. So 9x + 18 − 5x = 4x + 18.", difficulty: 4, points: 4, lessonId: L3 },

    // ======== WORD PROMPTS (difficulty=3) — 10 questions ========
    { questionText: "Expand and simplify: 3(x + 4)", correctAnswer: "3x + 12", explanation: "3 × x = 3x, 3 × 4 = 12. Answer: 3x + 12.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: 5(2x − 3)", correctAnswer: "10x − 15", explanation: "5 × 2x = 10x, 5 × (−3) = −15. Answer: 10x − 15.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: −2(x + 6)", correctAnswer: "−2x − 12", explanation: "−2 × x = −2x, −2 × 6 = −12. Answer: −2x − 12.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: −4(3x − 1)", correctAnswer: "−12x + 4", explanation: "−4 × 3x = −12x, −4 × (−1) = +4. Answer: −12x + 4.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: 7(x − 5)", correctAnswer: "7x − 35", explanation: "7 × x = 7x, 7 × (−5) = −35. Answer: 7x − 35.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: −(2x − 8)", correctAnswer: "−2x + 8", explanation: "−1 × 2x = −2x, −1 × (−8) = +8. Answer: −2x + 8.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: 6(3x + 2)", correctAnswer: "18x + 12", explanation: "6 × 3x = 18x, 6 × 2 = 12. Answer: 18x + 12.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: −3(x − 9)", correctAnswer: "−3x + 27", explanation: "−3 × x = −3x, −3 × (−9) = +27. Answer: −3x + 27.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: 8(2x + 1)", correctAnswer: "16x + 8", explanation: "8 × 2x = 16x, 8 × 1 = 8. Answer: 16x + 8.", difficulty: 3, points: 3, lessonId: null },
    { questionText: "Expand and simplify: −5(x + 4)", correctAnswer: "−5x − 20", explanation: "−5 × x = −5x, −5 × 4 = −20. Answer: −5x − 20.", difficulty: 3, points: 3, lessonId: null },
  ];

  const rows = questionBank.map((q) => ({
    topicId: topic.id,
    subjectId: SUBJECT_ID,
    lessonId: q.lessonId,
    questionText: q.questionText,
    questionType: "short_answer" as const,
    options: null as string[] | null,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    points: q.points,
  }));

  await db.insert(quizQuestions).values(rows);

  const counts = { easy: 0, medium: 0, high: 0, challenge: 0, total: rows.length };
  for (const q of questionBank) {
    if (q.difficulty === 1) counts.easy++;
    else if (q.difficulty === 2) counts.medium++;
    else if (q.difficulty === 3) counts.high++;
    else if (q.difficulty === 4) counts.challenge++;
  }

  console.log(`Created ${counts.total} quiz questions:`, JSON.stringify(counts));
  console.log("Seed complete! Topic ID:", topic.id);
  return topic.id;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedExpandingBrackets()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
