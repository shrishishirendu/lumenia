import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedSimplifyingSurds() {
  console.log("Seeding Simplifying Surds content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Simplifying Surds";

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
    console.log("Simplifying Surds topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Simplify surd expressions by extracting perfect square factors, simplify with coefficients, and combine like surds",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 7,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "Extracting Perfect Square Factors",
      description: "Learn to simplify surds by identifying and extracting the largest perfect square factor.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: ["Identify perfect square factors of a number", "Use √(ab) = √a × √b to simplify", "Find the largest perfect square factor for efficient simplification"],
      segments: [
        {
          title: "The Simplification Method",
          type: "explanation",
          content: "To simplify √n, find the largest perfect square that divides n. Write n = (perfect square) × (remainder), then √n = √(square) × √(remainder). For example, √72 = √(36 × 2) = 6√2. Always use the LARGEST perfect square factor to simplify in one step.",
          tutorScript: "The key question is: what is the biggest square number that goes into n? Start checking from the top: 144, 121, 100, 81, 64, 49, 36, 25, 16, 9, 4.",
        },
        {
          title: "Worked Examples — Small Numbers",
          type: "example",
          content: "Example 1: √8 = √(4 × 2) = 2√2\nExample 2: √12 = √(4 × 3) = 2√3\nExample 3: √18 = √(9 × 2) = 3√2\nExample 4: √50 = √(25 × 2) = 5√2\nExample 5: √75 = √(25 × 3) = 5√3",
          tutorScript: "For each, ask: what perfect square divides this? 8 = 4×2, 12 = 4×3, 18 = 9×2, 50 = 25×2, 75 = 25×3.",
        },
        {
          title: "Practice — Simplify Single Surds",
          type: "practice",
          content: "Simplify each surd:\n1) √20\n2) √27\n3) √45\n4) √48\n5) √72\n6) √98\n\nHint: Find the largest perfect square factor of each number.",
          tutorScript: "Check: 20 = 4×5, 27 = 9×3, 45 = 9×5, 48 = 16×3, 72 = 36×2, 98 = 49×2.",
        },
      ],
    },
    {
      title: "Simplifying Surds with Coefficients",
      description: "Simplify expressions of the form k√n by first simplifying the surd, then multiplying coefficients.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: ["Simplify k√n by first simplifying √n", "Multiply the outside coefficient by the extracted factor", "Express the result in simplest form"],
      segments: [
        {
          title: "Coefficients and Surds",
          type: "explanation",
          content: "When you have k√n where √n can be simplified, first simplify √n, then multiply. For example: 3√48 → √48 = 4√3 → 3 × 4√3 = 12√3. Always simplify the surd part first, then handle the coefficient.",
          tutorScript: "Two steps: (1) simplify the surd, (2) multiply the coefficients together.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 2√50 = 2 × 5√2 = 10√2\nExample 2: 3√12 = 3 × 2√3 = 6√3\nExample 3: 4√18 = 4 × 3√2 = 12√2\nExample 4: 5√28 = 5 × 2√7 = 10√7",
          tutorScript: "First simplify the surd inside: √50 = 5√2, √12 = 2√3, etc. Then multiply the outside number by the extracted coefficient.",
        },
        {
          title: "Practice — Coefficient Surds",
          type: "practice",
          content: "Simplify:\n1) 3√8\n2) 2√75\n3) 4√27\n4) 6√20\n5) 3√32\n\nHint: Simplify the surd first, then multiply coefficients.",
          tutorScript: "3√8 = 3 × 2√2 = 6√2. Follow the same pattern for all.",
        },
      ],
    },
    {
      title: "Combining Like Surds",
      description: "Add and subtract surds by simplifying first to reveal like surds, then combining coefficients.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: ["Recognise like and unlike surds", "Simplify surds before attempting to combine", "Add and subtract like surds"],
      segments: [
        {
          title: "Like Surds",
          type: "explanation",
          content: "Like surds have the same number under the root. You can only add or subtract like surds: 3√2 + 5√2 = 8√2, but 3√2 + 5√3 cannot be combined. The key skill: simplify each surd first to reveal hidden like surds. For example, √8 + √18 = 2√2 + 3√2 = 5√2.",
          tutorScript: "Think algebra: 3x + 5x = 8x, but 3x + 5y stays as is. Same with surds — the surd part must match.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: √12 + √27 = 2√3 + 3√3 = 5√3\nExample 2: 3√8 + 2√18 = 6√2 + 6√2 = 12√2\nExample 3: 5√12 − √75 = 10√3 − 5√3 = 5√3\nExample 4: √8 + √27 = 2√2 + 3√3 (unlike — cannot simplify further)",
          tutorScript: "Step 1: Simplify each surd. Step 2: Check if they're like surds. Step 3: If like, combine coefficients. If unlike, leave as is.",
        },
        {
          title: "Practice — Combine Surds",
          type: "practice",
          content: "Simplify:\n1) √50 + √18\n2) 4√12 − √27\n3) 3√20 + 2√45\n4) √8 + √50\n5) 2√75 − 3√12\n6) √45 − √32 (careful — unlike surds!)\n\nHint: Simplify each surd first, then check if they're like surds.",
          tutorScript: "For Q6, √45 = 3√5 and √32 = 4√2 — these are unlike surds and cannot be combined further.",
        },
      ],
    },
    {
      title: "Multi-Term Expressions and Challenging Simplifications",
      description: "Tackle three-term expressions, expand-and-simplify problems, and mixed like/unlike surd terms.",
      orderIndex: 4,
      estimatedMinutes: 25,
      objectives: ["Simplify three-term surd expressions", "Expand brackets involving surds then simplify", "Handle mixed expressions with both like and unlike surd terms"],
      segments: [
        {
          title: "Three-Term Expressions",
          type: "explanation",
          content: "With three or more surd terms, simplify each term individually, then group and combine like surds. For example: 3√12 + 2√27 − √3 = 6√3 + 6√3 − √3 = 11√3. In mixed expressions, group like surds together and leave unlike surds separate.",
          tutorScript: "Simplify every term first, then collect like surds. Some terms might not combine — that's okay.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 2√45 − 3√20 + √5 = 6√5 − 6√5 + √5 = √5\nExample 2: √50 + √12 − √18 = 5√2 + 2√3 − 3√2 = 2√2 + 2√3\nExample 3: (√12 + √27)² = (2√3 + 3√3)² = (5√3)² = 75",
          tutorScript: "Example 2 shows a mixed case: group the √2 terms and the √3 terms separately.",
        },
        {
          title: "Practice — Challenge Problems",
          type: "practice",
          content: "Simplify:\n1) 4√18 − √50 + 2√8\n2) √75 + √8 − √27\n3) (√8 + √2)²\n4) √(72/8)\n5) 5√28 − 2√63 + √112\n\nHint: Simplify every term first, then look for like surds to combine.",
          tutorScript: "For Q3, simplify inside first: √8 = 2√2, so (2√2 + √2)² = (3√2)² = 18. For Q4, simplify the fraction under the root first.",
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
    { questionText: "Simplify √8", correctAnswer: "2√2", explanation: "8 = 4 × 2, so √8 = √4 × √2 = 2√2", difficulty: 1, points: 1 },
    { questionText: "Simplify √12", correctAnswer: "2√3", explanation: "12 = 4 × 3, so √12 = √4 × √3 = 2√3", difficulty: 1, points: 1 },
    { questionText: "Simplify √18", correctAnswer: "3√2", explanation: "18 = 9 × 2, so √18 = √9 × √2 = 3√2", difficulty: 1, points: 1 },
    { questionText: "Simplify √20", correctAnswer: "2√5", explanation: "20 = 4 × 5, so √20 = √4 × √5 = 2√5", difficulty: 1, points: 1 },
    { questionText: "Simplify √50", correctAnswer: "5√2", explanation: "50 = 25 × 2, so √50 = √25 × √2 = 5√2", difficulty: 1, points: 1 },
    { questionText: "Simplify √72", correctAnswer: "6√2", explanation: "72 = 36 × 2, so √72 = √36 × √2 = 6√2", difficulty: 1, points: 1 },
    { questionText: "Simplify 3√48", correctAnswer: "12√3", explanation: "√48 = 4√3, so 3 × 4√3 = 12√3", difficulty: 2, points: 2 },
    { questionText: "Simplify 2√50", correctAnswer: "10√2", explanation: "√50 = 5√2, so 2 × 5√2 = 10√2", difficulty: 2, points: 2 },
    { questionText: "Simplify 4√18", correctAnswer: "12√2", explanation: "√18 = 3√2, so 4 × 3√2 = 12√2", difficulty: 2, points: 2 },
    { questionText: "Simplify √288", correctAnswer: "12√2", explanation: "288 = 144 × 2, so √288 = √144 × √2 = 12√2", difficulty: 2, points: 2 },
    { questionText: "Simplify √300", correctAnswer: "10√3", explanation: "300 = 100 × 3, so √300 = √100 × √3 = 10√3", difficulty: 2, points: 2 },
    { questionText: "Simplify 5√12", correctAnswer: "10√3", explanation: "√12 = 2√3, so 5 × 2√3 = 10√3", difficulty: 2, points: 2 },
    { questionText: "Simplify: √12 + √27", correctAnswer: "5√3", explanation: "√12 = 2√3, √27 = 3√3. So 2√3 + 3√3 = 5√3", difficulty: 3, points: 3 },
    { questionText: "Simplify: 3√8 + 2√18", correctAnswer: "12√2", explanation: "3√8 = 6√2, 2√18 = 6√2. So 6√2 + 6√2 = 12√2", difficulty: 3, points: 3 },
    { questionText: "Simplify: 5√12 − √75", correctAnswer: "5√3", explanation: "5√12 = 10√3, √75 = 5√3. So 10√3 − 5√3 = 5√3", difficulty: 3, points: 3 },
    { questionText: "Simplify: √50 + √18", correctAnswer: "8√2", explanation: "√50 = 5√2, √18 = 3√2. So 5√2 + 3√2 = 8√2", difficulty: 3, points: 3 },
    { questionText: "Simplify: 4√27 − √48", correctAnswer: "8√3", explanation: "4√27 = 12√3, √48 = 4√3. So 12√3 − 4√3 = 8√3", difficulty: 3, points: 3 },
    { questionText: "Simplify: 3√12 + 2√27 − √3", correctAnswer: "11√3", explanation: "3√12 = 6√3, 2√27 = 6√3. So 6√3 + 6√3 − √3 = 11√3", difficulty: 4, points: 4 },
    { questionText: "Simplify: (√12 + √27)²", correctAnswer: "75", explanation: "√12 = 2√3, √27 = 3√3. (2√3 + 3√3)² = (5√3)² = 25 × 3 = 75", difficulty: 4, points: 4 },
    { questionText: "Simplify: √50 + √12 − √18", correctAnswer: "2√2 + 2√3", explanation: "√50 = 5√2, √12 = 2√3, √18 = 3√2. Group: (5√2 − 3√2) + 2√3 = 2√2 + 2√3", difficulty: 4, points: 4 },
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
  console.log(`  Inserted ${rows.length} practice questions for Simplifying Surds`);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary: "Simplifying surds means extracting perfect square factors to write √n in its simplest form a√b where b is square-free.",
    notesMarkdown: `## Simplifying a Single Surd

To simplify √n:
1. Find the **largest perfect square factor** of n
2. Write n = (perfect square) × (remainder)
3. Apply √(a × b) = √a × √b
4. Simplify √(perfect square) to an integer

**Examples:**
- √8 = √(4 × 2) = 2√2
- √72 = √(36 × 2) = 6√2
- √75 = √(25 × 3) = 5√3

## Simplifying with Coefficients

For k√n:
1. Simplify √n first
2. Multiply the coefficient k by the extracted factor

**Examples:**
- 3√48: √48 = 4√3, so 3 × 4√3 = 12√3
- 2√50: √50 = 5√2, so 2 × 5√2 = 10√2

## Combining Like Surds

Like surds have the **same radicand** (number under the root):
- 3√2 + 5√2 = 8√2 ✓
- 3√2 + 5√3 = cannot simplify ✗

**Key technique:** Simplify each surd first to reveal hidden like surds:
- √8 + √18 = 2√2 + 3√2 = 5√2

## Recognising Unlike Surds

After simplifying, if the radicands differ, the terms **cannot be combined**:
- √8 + √27 = 2√2 + 3√3 (unlike — final answer)

## Perfect Squares to Know

4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225`,
    keyFormulas: [
      "√(a × b) = √a × √b",
      "k√n: simplify √n first, then multiply coefficients",
      "Like surds: a√x + b√x = (a + b)√x",
      "Unlike surds cannot be combined further",
    ],
    commonMistakes: [
      "Not finding the LARGEST perfect square factor (e.g., using 4 instead of 36 for √72)",
      "Trying to add unlike surds: √2 + √3 ≠ √5",
      "Forgetting to simplify surds before checking if they're like surds",
      "Multiplying radicands when adding: √8 + √2 ≠ √10",
      "Stopping too early: √48 = 2√12 is not fully simplified (should be 4√3)",
    ],
  });
  console.log(`  Created topic notes for Simplifying Surds`);

  return topic.id;
}
