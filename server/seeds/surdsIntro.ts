import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedSurdsIntro() {
  console.log("Seeding Introduction to Surds content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Introduction to Surds";

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
    console.log("Introduction to Surds topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Identify surds, simplify surd expressions, combine like surds, multiply surds, expand brackets involving surds, and rationalise denominators",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 6,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "What is a Surd?",
      description: "Understand the definition of a surd and distinguish between surds and rational square roots.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: ["Define what a surd is", "Identify whether a square root is rational or irrational", "Recognise perfect squares up to 144"],
      segments: [
        {
          title: "Defining Surds",
          type: "explanation",
          content: "A surd is a root that cannot be simplified to a whole number or fraction. For example, √2, √3, √5 are surds because they are irrational. However, √4 = 2 and √9 = 3 are NOT surds — they simplify to rational numbers. A surd is an exact value, unlike a decimal approximation.",
          tutorScript: "Think of a surd as a root that 'won't come out nicely'. If you can't find a whole number answer, it's a surd.",
        },
        {
          title: "Identifying Surds — Examples",
          type: "example",
          content: "Example 1: Is √16 a surd? No — √16 = 4 (perfect square)\nExample 2: Is √7 a surd? Yes — 7 is not a perfect square, so √7 is irrational\nExample 3: Is √25 a surd? No — √25 = 5\nExample 4: Is √10 a surd? Yes — 10 has no perfect square root",
          tutorScript: "To check: can you find a whole number × itself that equals the number under the root? If yes, it's not a surd.",
        },
        {
          title: "Practice — Surd or Not?",
          type: "practice",
          content: "Classify each as a surd or not:\n1) √36\n2) √11\n3) √49\n4) √15\n5) √100\n6) √2\n\nHint: Check if the number under the root is a perfect square.",
          tutorScript: "Perfect squares to know: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.",
        },
      ],
    },
    {
      title: "Simplifying Surds",
      description: "Simplify surds by extracting the largest perfect square factor.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: ["Find the largest perfect square factor of a number", "Simplify surds using √(ab) = √a × √b", "Express surds in simplest form"],
      segments: [
        {
          title: "The Simplification Method",
          type: "explanation",
          content: "To simplify a surd like √n, find the largest perfect square factor of n. Then use the rule: √(a × b) = √a × √b. For example, √12 = √(4 × 3) = √4 × √3 = 2√3. Always look for the LARGEST perfect square factor to simplify in one step.",
          tutorScript: "The key step is factoring: break the number under the root into a perfect square times something else.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: √18 = √(9 × 2) = 3√2\nExample 2: √50 = √(25 × 2) = 5√2\nExample 3: √72 = √(36 × 2) = 6√2\nExample 4: √75 = √(25 × 3) = 5√3\nExample 5: √48 = √(16 × 3) = 4√3",
          tutorScript: "Always check: is there a bigger perfect square factor? For 72, use 36 × 2 (not 4 × 18 or 9 × 8).",
        },
        {
          title: "Practice — Simplify",
          type: "practice",
          content: "Simplify each surd:\n1) √8\n2) √20\n3) √27\n4) √45\n5) √32\n6) √98\n\nHint: Find the largest perfect square factor first.",
          tutorScript: "Check your factor pairs. For √32: 32 = 16 × 2, so √32 = 4√2.",
        },
      ],
    },
    {
      title: "Adding and Subtracting Surds",
      description: "Combine like surds by simplifying first, then adding or subtracting coefficients.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: ["Identify like surds", "Simplify surds before combining", "Add and subtract surd expressions"],
      segments: [
        {
          title: "Like Surds",
          type: "explanation",
          content: "Like surds have the same number under the root sign. You can only add or subtract like surds, just like you can only add like terms in algebra. For example: 3√2 + 5√2 = 8√2, but 3√2 + 5√3 cannot be simplified further. Sometimes you need to simplify surds first to reveal like surds.",
          tutorScript: "Think of it like algebra: 3x + 5x = 8x, but 3x + 5y stays as it is. Same idea with surds.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 4√3 + 2√3 = 6√3\nExample 2: 7√5 − 3√5 = 4√5\nExample 3: √12 + √27 = 2√3 + 3√3 = 5√3\nExample 4: 3√8 − √18 = 6√2 − 3√2 = 3√2",
          tutorScript: "In Examples 3 and 4, the surds look different but become like surds after simplifying.",
        },
        {
          title: "Practice — Combine Surds",
          type: "practice",
          content: "Simplify:\n1) 5√2 + 3√2\n2) 6√7 − 2√7\n3) √8 + √32\n4) √50 − √18\n5) 2√12 + 3√27\n\nHint: Simplify each surd first, then combine like surds.",
          tutorScript: "Step 1: Simplify each surd. Step 2: Check if they're like surds. Step 3: Combine coefficients.",
        },
      ],
    },
    {
      title: "Multiplying Surds and Rationalising Denominators",
      description: "Multiply surd expressions, expand brackets, and rationalise denominators.",
      orderIndex: 4,
      estimatedMinutes: 25,
      objectives: ["Multiply surds using √a × √b = √(ab)", "Expand brackets involving surds", "Rationalise denominators by multiplying by the surd or its conjugate"],
      segments: [
        {
          title: "Multiplying and Expanding",
          type: "explanation",
          content: "Multiplication rule: √a × √b = √(ab). Key results: √a × √a = a. When expanding brackets: (√a + √b)(√a − √b) = a − b (difference of squares). (a + √b)² = a² + 2a√b + b. To rationalise 1/√a, multiply top and bottom by √a. For 1/(a + √b), multiply by the conjugate (a − √b).",
          tutorScript: "The difference of squares pattern is very useful — it eliminates the surds completely!",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: √3 × √7 = √21\nExample 2: (√5 + √3)(√5 − √3) = 5 − 3 = 2\nExample 3: Rationalise 1/√2 = √2/2\nExample 4: Rationalise 1/(3 + √2) = (3 − √2)/(9 − 2) = (3 − √2)/7",
          tutorScript: "For conjugate rationalisation, the denominator always becomes a difference of squares — no surds left!",
        },
        {
          title: "Practice — Multiply and Rationalise",
          type: "practice",
          content: "Simplify or rationalise:\n1) √2 × √8\n2) (√7 + √3)(√7 − √3)\n3) 1/√5\n4) (√3 + 1)²\n5) 1/(2 + √3)\n\nHint: For rationalisation, multiply by 1 in a clever form.",
          tutorScript: "For Q5, multiply by (2 − √3)/(2 − √3) to use the conjugate method.",
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
    { questionText: "Is √9 a surd?", correctAnswer: "No, √9 = 3", explanation: "9 is a perfect square: 3 × 3 = 9, so √9 = 3 (rational)", difficulty: 1, points: 1 },
    { questionText: "Is √5 a surd?", correctAnswer: "Yes", explanation: "5 is not a perfect square, so √5 is irrational — it is a surd", difficulty: 1, points: 1 },
    { questionText: "Simplify √12", correctAnswer: "2√3", explanation: "12 = 4 × 3, so √12 = √4 × √3 = 2√3", difficulty: 1, points: 1 },
    { questionText: "Simplify √18", correctAnswer: "3√2", explanation: "18 = 9 × 2, so √18 = √9 × √2 = 3√2", difficulty: 1, points: 1 },
    { questionText: "Simplify √50", correctAnswer: "5√2", explanation: "50 = 25 × 2, so √50 = √25 × √2 = 5√2", difficulty: 1, points: 1 },
    { questionText: "Simplify √75", correctAnswer: "5√3", explanation: "75 = 25 × 3, so √75 = √25 × √3 = 5√3", difficulty: 1, points: 1 },
    { questionText: "Simplify: 3√2 + 5√2", correctAnswer: "8√2", explanation: "Like surds: combine coefficients 3 + 5 = 8", difficulty: 2, points: 2 },
    { questionText: "Simplify: √8 + √32", correctAnswer: "6√2", explanation: "√8 = 2√2, √32 = 4√2. So 2√2 + 4√2 = 6√2", difficulty: 2, points: 2 },
    { questionText: "Simplify: √12 + √27", correctAnswer: "5√3", explanation: "√12 = 2√3, √27 = 3√3. So 2√3 + 3√3 = 5√3", difficulty: 2, points: 2 },
    { questionText: "Simplify: √3 × √5", correctAnswer: "√15", explanation: "√3 × √5 = √(3 × 5) = √15", difficulty: 2, points: 2 },
    { questionText: "Simplify: √2 × √2", correctAnswer: "2", explanation: "√2 × √2 = (√2)² = 2", difficulty: 2, points: 2 },
    { questionText: "Simplify: 2√3 × 4√5", correctAnswer: "8√15", explanation: "Multiply coefficients: 2 × 4 = 8. Multiply surds: √3 × √5 = √15. Result: 8√15", difficulty: 2, points: 2 },
    { questionText: "Expand: (√5 + √3)(√5 − √3)", correctAnswer: "2", explanation: "Difference of squares: (√5)² − (√3)² = 5 − 3 = 2", difficulty: 3, points: 3 },
    { questionText: "Expand: (3 + √2)(3 − √2)", correctAnswer: "7", explanation: "Difference of squares: 3² − (√2)² = 9 − 2 = 7", difficulty: 3, points: 3 },
    { questionText: "Rationalise: 1/√3", correctAnswer: "√3/3", explanation: "Multiply by √3/√3: √3/(√3 × √3) = √3/3", difficulty: 3, points: 3 },
    { questionText: "Rationalise: 2/√5", correctAnswer: "2√5/5", explanation: "Multiply by √5/√5: 2√5/(√5 × √5) = 2√5/5", difficulty: 3, points: 3 },
    { questionText: "Expand: (√3 + √2)²", correctAnswer: "5 + 2√6", explanation: "(√3)² + 2(√3)(√2) + (√2)² = 3 + 2√6 + 2 = 5 + 2√6", difficulty: 3, points: 3 },
    { questionText: "Simplify: 3√12 + 2√27 − √3", correctAnswer: "11√3", explanation: "3√12 = 6√3, 2√27 = 6√3. So 6√3 + 6√3 − √3 = 11√3", difficulty: 4, points: 4 },
    { questionText: "Rationalise: 1/(2 + √3)", correctAnswer: "(2 − √3)/1 = 2 − √3", explanation: "Multiply by conjugate: (2 − √3)/((2)² − (√3)²) = (2 − √3)/(4 − 3) = 2 − √3", difficulty: 4, points: 4 },
    { questionText: "Simplify: √2(√8 + √18)", correctAnswer: "10", explanation: "√2 × √8 = √16 = 4. √2 × √18 = √36 = 6. So 4 + 6 = 10", difficulty: 4, points: 4 },
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
  console.log(`  Inserted ${rows.length} practice questions for Introduction to Surds`);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary: "Surds are irrational roots that cannot be simplified to whole numbers. Simplify by extracting perfect square factors, combine like surds, and rationalise denominators.",
    notesMarkdown: `## What is a Surd?
A surd is a root (usually a square root) that **cannot be simplified to a rational number**. For example, √2, √3, √5 are surds. But √4 = 2 is not a surd.

## Simplifying Surds
Find the **largest perfect square factor** and use the rule: √(a × b) = √a × √b
- √12 = √(4 × 3) = 2√3
- √50 = √(25 × 2) = 5√2
- √72 = √(36 × 2) = 6√2

## Adding and Subtracting Surds
You can only combine **like surds** (same number under the root):
- 3√2 + 5√2 = 8√2 ✓
- 3√2 + 5√3 = cannot simplify ✗
- Sometimes simplify first: √8 + √18 = 2√2 + 3√2 = 5√2

## Multiplying Surds
- √a × √b = √(ab)
- √a × √a = a
- k√a × m√b = km√(ab)

## Expanding Brackets
- **(√a + √b)(√a − √b) = a − b** (difference of squares — surds cancel!)
- (a + √b)² = a² + 2a√b + b

## Rationalising Denominators
Remove surds from the denominator:
- Simple: 1/√a → multiply by √a/√a → √a/a
- Conjugate: 1/(a + √b) → multiply by (a − √b)/(a − √b) → uses difference of squares`,
    keyFormulas: [
      "√(a × b) = √a × √b",
      "√a × √a = a",
      "(√a + √b)(√a − √b) = a − b",
      "1/√a = √a/a (rationalise by multiplying by √a/√a)",
      "1/(a + √b): multiply by conjugate (a − √b)/(a − √b)",
    ],
    commonMistakes: [
      "Trying to add unlike surds: √2 + √3 ≠ √5",
      "Not finding the LARGEST perfect square factor when simplifying",
      "Forgetting to simplify surds before trying to combine them",
      "Leaving a surd in the denominator without rationalising",
      "Sign errors when expanding (a − √b)² — the cross term is negative",
    ],
  });
  console.log(`  Created topic notes for Introduction to Surds`);

  return topic.id;
}
