import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedOperationsWithSurds() {
  console.log("Seeding Operations with Surds content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Operations with Surds";

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
    console.log("Operations with Surds topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Add, subtract, multiply surds, expand brackets with surds, and apply difference of squares",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 8,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "Adding and Subtracting Like Surds",
      description: "Combine like surd terms by adding or subtracting their coefficients.",
      orderIndex: 1,
      estimatedMinutes: 12,
      objectives: ["Identify like surds", "Add and subtract like surds", "Simplify before combining when necessary"],
      segments: [
        {
          title: "What Are Like Surds?",
          type: "explanation",
          content: "Like surds have the same radicand (number under the √). For example, 3√5 and 7√5 are like surds because both have √5. We can add or subtract like surds the same way we combine like terms: k√n + m√n = (k + m)√n.",
          tutorScript: "Think of √5 like a variable: 3√5 + 7√5 is just like 3x + 7x = 10x. Same idea!",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 2√3 + 5√3 = (2 + 5)√3 = 7√3\nExample 2: 8√7 − 3√7 = (8 − 3)√7 = 5√7\nExample 3: √2 + 4√2 = (1 + 4)√2 = 5√2\nExample 4: 6√5 − √5 = (6 − 1)√5 = 5√5",
          tutorScript: "Notice how we just add or subtract the coefficients and keep the surd part the same.",
        },
        {
          title: "Simplify Before Combining",
          type: "example",
          content: "Sometimes surds don't look alike but become like surds after simplification:\n√12 + √27 = 2√3 + 3√3 = 5√3\n3√8 + 2√18 = 6√2 + 6√2 = 12√2\n4√12 − √27 = 8√3 − 3√3 = 5√3",
          tutorScript: "Always simplify each surd first, then check if they have the same radicand.",
        },
      ],
    },
    {
      title: "Multiplying Surds",
      description: "Multiply surd expressions using the rule √a × √b = √(ab) and simplify the result.",
      orderIndex: 2,
      estimatedMinutes: 12,
      objectives: ["Apply √a × √b = √(ab)", "Multiply surds with coefficients", "Simplify the product"],
      segments: [
        {
          title: "The Multiplication Rule",
          type: "explanation",
          content: "The key rule for multiplying surds is: √a × √b = √(ab). When surds have coefficients, multiply them separately: (k√a)(m√b) = (km)√(ab). Then simplify √(ab) if possible.",
          tutorScript: "Coefficients multiply with coefficients, and radicands multiply with radicands.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: √3 × √5 = √15\nExample 2: √2 × √8 = √16 = 4\nExample 3: (2√3)(3√5) = 6√15\nExample 4: (3√2)(4√6) = 12√12 = 12 × 2√3 = 24√3\nExample 5: (5√3)(2√3) = 10 × 3 = 30",
          tutorScript: "When a × b is a perfect square, the answer simplifies to a whole number!",
        },
      ],
    },
    {
      title: "Expanding Brackets with Surds",
      description: "Expand products of binomials containing surds using FOIL.",
      orderIndex: 3,
      estimatedMinutes: 15,
      objectives: ["Expand (a + b√n)(c + d√n) using FOIL", "Collect rational and surd terms", "Recognise difference of squares patterns"],
      segments: [
        {
          title: "FOIL with Surds",
          type: "explanation",
          content: "When expanding (a + b√n)(c + d√n), use FOIL:\nFirst: a × c\nOuter: a × d√n\nInner: b√n × c\nLast: b√n × d√n = bd × n\nThen combine the rational terms and the surd terms.",
          tutorScript: "The Last term always gives a rational number because √n × √n = n.",
        },
        {
          title: "Worked Example",
          type: "example",
          content: "Expand (2 + 3√5)(1 + 2√5):\nFirst: 2 × 1 = 2\nOuter: 2 × 2√5 = 4√5\nInner: 3√5 × 1 = 3√5\nLast: 3√5 × 2√5 = 6 × 5 = 30\nRational: 2 + 30 = 32\nSurd: 4√5 + 3√5 = 7√5\nAnswer: 32 + 7√5",
          tutorScript: "Combine rational parts separately from surd parts, then write the final answer.",
        },
      ],
    },
    {
      title: "Conjugates and Difference of Squares",
      description: "Use conjugate pairs and the difference of squares identity with surds.",
      orderIndex: 4,
      estimatedMinutes: 12,
      objectives: ["Identify conjugate surd pairs", "Apply (a + b)(a − b) = a² − b²", "Expand (√a + √b)² and (√a − √b)²"],
      segments: [
        {
          title: "Conjugate Pairs",
          type: "explanation",
          content: "Conjugate pairs like (a + √b)(a − √b) or (√a + √b)(√a − √b) always produce rational answers:\n(a + √b)(a − √b) = a² − b\n(√a + √b)(√a − √b) = a − b\nThis is the difference of squares identity applied to surds.",
          tutorScript: "Conjugates eliminate surds entirely — the answer is always rational.",
        },
        {
          title: "Squaring Binomials with Surds",
          type: "example",
          content: "(√a + √b)² = a + 2√(ab) + b\n(√a − √b)² = a − 2√(ab) + b\n\nExample: (√3 + √5)² = 3 + 2√15 + 5 = 8 + 2√15\nExample: (2 + √3)² = 4 + 4√3 + 3 = 7 + 4√3",
          tutorScript: "Don't forget the middle term — it's 2 × product of the two terms.",
        },
      ],
    },
  ];

  for (const lesson of lessonData) {
    const [inserted] = await db
      .insert(lessons)
      .values({
        topicId: topic.id,
        title: lesson.title,
        description: lesson.description,
        orderIndex: lesson.orderIndex,
        estimatedMinutes: lesson.estimatedMinutes,
        objectives: lesson.objectives,
        isActive: true,
      })
      .returning();

    for (let i = 0; i < lesson.segments.length; i++) {
      const seg = lesson.segments[i];
      await db.insert(lessonSegments).values({
        lessonId: inserted.id,
        title: seg.title,
        type: seg.type,
        content: seg.content,
        tutorScript: seg.tutorScript,
        orderIndex: i + 1,
      });
    }
  }

  console.log(`  Created ${lessonData.length} lessons with segments for topic ${topic.id}`);

  const practiceQuestions = [
    { questionText: "Simplify 3√2 + 5√2", correctAnswer: "8√2", explanation: "Like surds: 3√2 + 5√2 = (3+5)√2 = 8√2", difficulty: 1, points: 1 },
    { questionText: "Simplify 7√3 − 2√3", correctAnswer: "5√3", explanation: "Like surds: 7√3 − 2√3 = (7−2)√3 = 5√3", difficulty: 1, points: 1 },
    { questionText: "Simplify √5 × √7", correctAnswer: "√35", explanation: "√5 × √7 = √(5×7) = √35", difficulty: 1, points: 1 },
    { questionText: "Simplify √3 × √12", correctAnswer: "6", explanation: "√3 × √12 = √36 = 6", difficulty: 1, points: 1 },
    { questionText: "Simplify 4√5 + 9√5", correctAnswer: "13√5", explanation: "Like surds: (4+9)√5 = 13√5", difficulty: 1, points: 1 },
    { questionText: "Simplify √12 + √27", correctAnswer: "5√3", explanation: "√12 = 2√3, √27 = 3√3. 2√3 + 3√3 = 5√3", difficulty: 2, points: 2 },
    { questionText: "Simplify 3√8 + 2√18", correctAnswer: "12√2", explanation: "3√8 = 6√2, 2√18 = 6√2. 6√2 + 6√2 = 12√2", difficulty: 2, points: 2 },
    { questionText: "Simplify 4√12 − √27", correctAnswer: "5√3", explanation: "4√12 = 8√3, √27 = 3√3. 8√3 − 3√3 = 5√3", difficulty: 2, points: 2 },
    { questionText: "Simplify (2√3)(3√5)", correctAnswer: "6√15", explanation: "2×3=6, √3×√5=√15. Result: 6√15", difficulty: 2, points: 2 },
    { questionText: "Simplify (3√2)(4√6)", correctAnswer: "24√3", explanation: "3×4=12, √2×√6=√12=2√3. 12×2√3=24√3", difficulty: 2, points: 2 },
    { questionText: "Simplify 5√20 + 2√45", correctAnswer: "16√5", explanation: "5√20 = 10√5, 2√45 = 6√5. 10√5 + 6√5 = 16√5", difficulty: 2, points: 2 },
    { questionText: "Expand (2 + 3√5)(1 + 2√5)", correctAnswer: "32 + 7√5", explanation: "FOIL: 2 + 4√5 + 3√5 + 30 = 32 + 7√5", difficulty: 3, points: 3 },
    { questionText: "Expand (3 + √2)(3 − √2)", correctAnswer: "7", explanation: "Diff of squares: 9 − 2 = 7", difficulty: 3, points: 3 },
    { questionText: "Expand (√5 + √3)(√5 − √3)", correctAnswer: "2", explanation: "Diff of squares: 5 − 3 = 2", difficulty: 3, points: 3 },
    { questionText: "Simplify 2√3 + √12 − √27", correctAnswer: "√3", explanation: "2√3 + 2√3 − 3√3 = √3", difficulty: 3, points: 3 },
    { questionText: "Simplify 3√8 − √18 + √50", correctAnswer: "8√2", explanation: "6√2 − 3√2 + 5√2 = 8√2", difficulty: 3, points: 3 },
    { questionText: "Expand (√2 + √3)²", correctAnswer: "5 + 2√6", explanation: "2 + 2√6 + 3 = 5 + 2√6", difficulty: 4, points: 4 },
    { questionText: "Expand (3 + √2)²", correctAnswer: "11 + 6√2", explanation: "9 + 6√2 + 2 = 11 + 6√2", difficulty: 4, points: 4 },
    { questionText: "Simplify 2√50 + √75 − 3√8", correctAnswer: "4√2 + 5√3", explanation: "10√2 + 5√3 − 6√2 = 4√2 + 5√3", difficulty: 4, points: 4 },
    { questionText: "Expand (√3 − √2)²", correctAnswer: "5 − 2√6", explanation: "3 − 2√6 + 2 = 5 − 2√6", difficulty: 4, points: 4 },
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
  console.log(`  Inserted ${rows.length} practice questions for Operations with Surds`);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary: "Operations with surds covers adding, subtracting, multiplying surds, expanding brackets, and applying difference of squares.",
    notesMarkdown: `## Adding and Subtracting Surds

Only **like surds** (same radicand) can be combined:
- k√n + m√n = (k + m)√n
- k√n − m√n = (k − m)√n
- Always **simplify first**, then check if surds are alike

**Examples:**
- 3√5 + 7√5 = 10√5
- √12 + √27 = 2√3 + 3√3 = 5√3

## Multiplying Surds

- √a × √b = √(ab)
- (k√a)(m√b) = (km)√(ab)
- Simplify √(ab) if possible

**Examples:**
- √3 × √5 = √15
- (2√3)(3√2) = 6√6
- √2 × √8 = √16 = 4

## Expanding Brackets

Use FOIL: (a + b√n)(c + d√n)
- The "Last" term gives a rational: b√n × d√n = bd·n
- Collect rational terms and surd terms

**Example:**
(2 + 3√5)(1 + 2√5) = 2 + 4√5 + 3√5 + 30 = 32 + 7√5

## Difference of Squares

- (a + √b)(a − √b) = a² − b
- (√a + √b)(√a − √b) = a − b
- Conjugate pairs always produce rational results

## Squaring Binomials

- (√a + √b)² = a + 2√(ab) + b
- (√a − √b)² = a − 2√(ab) + b
- (k + √a)² = k² + 2k√a + a`,
    keyFormulas: [
      "k√n + m√n = (k + m)√n",
      "√a × √b = √(ab)",
      "(a + √b)(a − √b) = a² − b",
      "(√a + √b)² = a + 2√(ab) + b",
    ],
    commonMistakes: [
      "Adding unlike surds: √2 + √3 ≠ √5",
      "Forgetting to simplify before checking if surds are alike",
      "Missing the middle term when squaring: (√a + √b)² ≠ a + b",
      "Forgetting that √a × √a = a (not √(a²))",
      "Not simplifying the product: √6 × √10 = √60 = 2√15",
    ],
  });

  console.log(`  Created topic notes for Operations with Surds`);

  return topic.id;
}
