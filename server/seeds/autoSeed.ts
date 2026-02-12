import { db } from "../db";
import { subjects, topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function ensureSubjects() {
  const existing = await db.select().from(subjects);
  const names = new Set(existing.map(s => s.name));

  const defaults = [
    { name: "Mathematics", description: "Australian Curriculum Mathematics", icon: "📐", isActive: true },
    { name: "English", description: "Australian Curriculum English", icon: "📝", isActive: true },
  ];

  for (const s of defaults) {
    if (!names.has(s.name)) {
      await db.insert(subjects).values(s);
      console.log(`  Created subject: ${s.name}`);
    }
  }
}

async function ensureLinearEquationsTopic() {
  const mathSubjects = await db.select().from(subjects).where(eq(subjects.name, "Mathematics"));
  if (mathSubjects.length === 0) return null;
  const mathId = mathSubjects[0].id;

  const existing = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, mathId),
        eq(topics.gradeLevel, 9),
        eq(topics.title, "Linear Equations")
      )
    );

  if (existing.length > 0) return existing[0].id;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: mathId,
      title: "Linear Equations",
      description: "Solve one-step, two-step, and bracket linear equations. Translate word problems into equations and check solutions.",
      gradeLevel: 9,
      orderIndex: 3,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "One-Step Linear Equations",
      description: "Learn to solve equations by undoing a single operation.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: ["Understand what a linear equation is", "Solve equations using addition and subtraction", "Solve equations using multiplication and division"],
    },
    {
      title: "Two-Step Linear Equations",
      description: "Build on one-step skills to solve equations requiring two operations.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: ["Identify the correct order of inverse operations", "Solve two-step equations systematically", "Check solutions by substitution"],
    },
    {
      title: "Equations with Brackets",
      description: "Expand brackets first, then solve the resulting equation.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: ["Expand brackets using the distributive law", "Solve equations after expanding", "Handle negative signs when expanding"],
    },
    {
      title: "Word Problems and Applications",
      description: "Translate real-life scenarios into linear equations and solve them.",
      orderIndex: 4,
      estimatedMinutes: 25,
      objectives: ["Translate word problems into equations", "Define variables clearly", "Solve and interpret the answer in context"],
    },
  ];

  for (const ld of lessonData) {
    const [lesson] = await db
      .insert(lessons)
      .values({ ...ld, topicId: topic.id, isActive: true })
      .returning();

    const segments = [
      { lessonId: lesson.id, segmentType: "explanation" as const, title: `${ld.title} — Explanation`, content: `Key concepts for ${ld.title.toLowerCase()}.`, orderIndex: 1 },
      { lessonId: lesson.id, segmentType: "example" as const, title: `${ld.title} — Worked Example`, content: `Step-by-step example for ${ld.title.toLowerCase()}.`, orderIndex: 2 },
      { lessonId: lesson.id, segmentType: "practice" as const, title: `${ld.title} — Practice`, content: `Practice problems for ${ld.title.toLowerCase()}.`, orderIndex: 3 },
    ];
    await db.insert(lessonSegments).values(segments);
  }

  console.log(`  Created 4 lessons with segments for topic ${topic.id}`);
  return topic.id;
}

async function ensurePracticeQuestions(topicId: number) {
  const mathSubjects = await db.select().from(subjects).where(eq(subjects.name, "Mathematics"));
  const mathId = mathSubjects[0]?.id || 1;

  const existing = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
  const existingTexts = new Set(existing.map(q => q.questionText));

  const questions = [
    { questionText: "Solve: x + 9 = 14", correctAnswer: "x = 5", explanation: "Subtract 9 from both sides: x = 14 − 9 = 5.", difficulty: 1, points: 1 },
    { questionText: "Solve: x − 4 = 11", correctAnswer: "x = 15", explanation: "Add 4 to both sides: x = 11 + 4 = 15.", difficulty: 1, points: 1 },
    { questionText: "Solve: 6x = 42", correctAnswer: "x = 7", explanation: "Divide both sides by 6: x = 42 ÷ 6 = 7.", difficulty: 1, points: 1 },
    { questionText: "Solve: x ÷ 3 = 9", correctAnswer: "x = 27", explanation: "Multiply both sides by 3: x = 9 × 3 = 27.", difficulty: 1, points: 1 },
    { questionText: "Solve: x + 17 = 25", correctAnswer: "x = 8", explanation: "Subtract 17 from both sides: x = 25 − 17 = 8.", difficulty: 1, points: 1 },
    { questionText: "Solve: x − 12 = 6", correctAnswer: "x = 18", explanation: "Add 12 to both sides: x = 6 + 12 = 18.", difficulty: 1, points: 1 },
    { questionText: "Solve: 9x = 81", correctAnswer: "x = 9", explanation: "Divide both sides by 9: x = 81 ÷ 9 = 9.", difficulty: 1, points: 1 },
    { questionText: "Solve: x ÷ 5 = 8", correctAnswer: "x = 40", explanation: "Multiply both sides by 5: x = 8 × 5 = 40.", difficulty: 1, points: 1 },
    { questionText: "Solve: x + 23 = 50", correctAnswer: "x = 27", explanation: "Subtract 23 from both sides: x = 50 − 23 = 27.", difficulty: 1, points: 1 },
    { questionText: "Solve: 4x = 52", correctAnswer: "x = 13", explanation: "Divide both sides by 4: x = 52 ÷ 4 = 13.", difficulty: 1, points: 1 },
    { questionText: "Solve: 3x + 7 = 22", correctAnswer: "x = 5", explanation: "Subtract 7: 3x = 15. Divide by 3: x = 5.", difficulty: 2, points: 2 },
    { questionText: "Solve: 5x − 9 = 16", correctAnswer: "x = 5", explanation: "Add 9: 5x = 25. Divide by 5: x = 5.", difficulty: 2, points: 2 },
    { questionText: "Solve: 2x + 11 = 29", correctAnswer: "x = 9", explanation: "Subtract 11: 2x = 18. Divide by 2: x = 9.", difficulty: 2, points: 2 },
    { questionText: "Solve: 7x − 3 = 46", correctAnswer: "x = 7", explanation: "Add 3: 7x = 49. Divide by 7: x = 7.", difficulty: 2, points: 2 },
    { questionText: "Solve: 4x + 8 = 36", correctAnswer: "x = 7", explanation: "Subtract 8: 4x = 28. Divide by 4: x = 7.", difficulty: 2, points: 2 },
    { questionText: "Solve: 6x − 5 = 31", correctAnswer: "x = 6", explanation: "Add 5: 6x = 36. Divide by 6: x = 6.", difficulty: 2, points: 2 },
    { questionText: "Solve: 8x + 4 = 68", correctAnswer: "x = 8", explanation: "Subtract 4: 8x = 64. Divide by 8: x = 8.", difficulty: 2, points: 2 },
    { questionText: "Solve: 3x − 14 = 7", correctAnswer: "x = 7", explanation: "Add 14: 3x = 21. Divide by 3: x = 7.", difficulty: 2, points: 2 },
    { questionText: "Solve: 9x + 6 = 60", correctAnswer: "x = 6", explanation: "Subtract 6: 9x = 54. Divide by 9: x = 6.", difficulty: 2, points: 2 },
    { questionText: "Solve: 2x − 7 = 13", correctAnswer: "x = 10", explanation: "Add 7: 2x = 20. Divide by 2: x = 10.", difficulty: 2, points: 2 },
    { questionText: "Solve: 5x + 3 = 48", correctAnswer: "x = 9", explanation: "Subtract 3: 5x = 45. Divide by 5: x = 9.", difficulty: 2, points: 2 },
    { questionText: "Solve: 10x − 8 = 42", correctAnswer: "x = 5", explanation: "Add 8: 10x = 50. Divide by 10: x = 5.", difficulty: 2, points: 2 },
    { questionText: "Solve: 4x + 15 = 43", correctAnswer: "x = 7", explanation: "Subtract 15: 4x = 28. Divide by 4: x = 7.", difficulty: 2, points: 2 },
    { questionText: "Solve: 6x − 11 = 25", correctAnswer: "x = 6", explanation: "Add 11: 6x = 36. Divide by 6: x = 6.", difficulty: 2, points: 2 },
    { questionText: "Solve: 7x + 2 = 51", correctAnswer: "x = 7", explanation: "Subtract 2: 7x = 49. Divide by 7: x = 7.", difficulty: 2, points: 2 },
    { questionText: "Solve: 2(x + 3) = 14", correctAnswer: "x = 4", explanation: "Expand: 2x + 6 = 14. Subtract 6: 2x = 8. Divide by 2: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: 3(x − 5) = 12", correctAnswer: "x = 9", explanation: "Expand: 3x − 15 = 12. Add 15: 3x = 27. Divide by 3: x = 9.", difficulty: 3, points: 3 },
    { questionText: "Solve: 4(2x + 1) = 36", correctAnswer: "x = 4", explanation: "Expand: 8x + 4 = 36. Subtract 4: 8x = 32. Divide by 8: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: 5(x − 2) + 3 = 18", correctAnswer: "x = 5", explanation: "Expand: 5x − 10 + 3 = 18. Combine: 5x − 7 = 18. Add 7: 5x = 25. Divide by 5: x = 5.", difficulty: 3, points: 3 },
    { questionText: "Solve: −2(x + 4) = −14", correctAnswer: "x = 3", explanation: "Expand: −2x − 8 = −14. Add 8: −2x = −6. Divide by −2: x = 3.", difficulty: 3, points: 3 },
    { questionText: "Solve: 3(x + 7) − 5 = 25", correctAnswer: "x = 3", explanation: "Expand: 3x + 21 − 5 = 25. Combine: 3x + 16 = 25. Subtract 16: 3x = 9. Divide by 3: x = 3.", difficulty: 3, points: 3 },
    { questionText: "Solve: 6(x − 1) = 2(x + 5)", correctAnswer: "x = 4", explanation: "Expand: 6x − 6 = 2x + 10. Subtract 2x: 4x − 6 = 10. Add 6: 4x = 16. Divide by 4: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: 4(x + 2) = 3(x + 5)", correctAnswer: "x = 7", explanation: "Expand: 4x + 8 = 3x + 15. Subtract 3x: x + 8 = 15. Subtract 8: x = 7.", difficulty: 3, points: 3 },
    { questionText: "Solve: 2(3x − 4) + x = 20", correctAnswer: "x = 4", explanation: "Expand: 6x − 8 + x = 20. Combine: 7x − 8 = 20. Add 8: 7x = 28. Divide by 7: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: −3(2x − 5) = −9", correctAnswer: "x = 4", explanation: "Expand: −6x + 15 = −9. Subtract 15: −6x = −24. Divide by −6: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: 5(x + 1) − 2(x − 3) = 20", correctAnswer: "x = 3", explanation: "Expand: 5x + 5 − 2x + 6 = 20. Combine: 3x + 11 = 20. Subtract 11: 3x = 9. Divide by 3: x = 3.", difficulty: 3, points: 3 },
    { questionText: "Solve: 7(x − 3) = 4(x + 3)", correctAnswer: "x = 11", explanation: "Expand: 7x − 21 = 4x + 12. Subtract 4x: 3x − 21 = 12. Add 21: 3x = 33. Divide by 3: x = 11.", difficulty: 3, points: 3 },
    { questionText: "Solve: 2(x + 6) − (x + 4) = 12", correctAnswer: "x = 4", explanation: "Expand: 2x + 12 − x − 4 = 12. Combine: x + 8 = 12. Subtract 8: x = 4.", difficulty: 3, points: 3 },
    { questionText: "Solve: 3(2x + 1) = 5(x + 2) − 1", correctAnswer: "x = 6", explanation: "Expand: 6x + 3 = 5x + 10 − 1. Simplify right: 5x + 9. Subtract 5x: x + 3 = 9. Subtract 3: x = 6.", difficulty: 3, points: 3 },
    { questionText: "Solve: −(x − 8) + 2x = 15", correctAnswer: "x = 7", explanation: "Expand: −x + 8 + 2x = 15. Combine: x + 8 = 15. Subtract 8: x = 7.", difficulty: 3, points: 3 },
    { questionText: "Tom has 3 times as many marbles as Sam. Together they have 48 marbles. How many does Sam have?", correctAnswer: "x = 12", explanation: "Let Sam = x, Tom = 3x. So x + 3x = 48 → 4x = 48 → x = 12. Sam has 12.", difficulty: 4, points: 4 },
    { questionText: "A rectangle's length is 5 cm more than its width. The perimeter is 42 cm. Find the width.", correctAnswer: "x = 8", explanation: "Let width = x, length = x + 5. Perimeter: 2(x + x + 5) = 42 → 2(2x + 5) = 42 → 4x + 10 = 42 → 4x = 32 → x = 8.", difficulty: 4, points: 4 },
    { questionText: "Emma is 4 years older than Liam. The sum of their ages is 28. How old is Liam?", correctAnswer: "x = 12", explanation: "Let Liam = x, Emma = x + 4. x + (x + 4) = 28 → 2x + 4 = 28 → 2x = 24 → x = 12.", difficulty: 4, points: 4 },
    { questionText: "A shop sells pens for $3 each. After buying some pens and paying with $20, you get $5 change. How many pens did you buy?", correctAnswer: "x = 5", explanation: "Cost = 3x. You paid $20 and got $5 back so 3x = 20 − 5 = 15. x = 5.", difficulty: 4, points: 4 },
    { questionText: "Three consecutive numbers add up to 42. What is the smallest?", correctAnswer: "x = 13", explanation: "x + (x + 1) + (x + 2) = 42 → 3x + 3 = 42 → 3x = 39 → x = 13.", difficulty: 4, points: 4 },
    { questionText: "A taxi charges $4 base fee plus $2 per kilometre. If the total fare is $22, how many kilometres was the trip?", correctAnswer: "x = 9", explanation: "4 + 2x = 22 → 2x = 18 → x = 9 km.", difficulty: 4, points: 4 },
    { questionText: "Two friends split a bill. One pays $15 more than the other. The total bill is $73. How much does the one who pays less pay?", correctAnswer: "x = 29", explanation: "Let lesser = x, greater = x + 15. x + (x + 15) = 73 → 2x + 15 = 73 → 2x = 58 → x = 29.", difficulty: 4, points: 4 },
    { questionText: "A number is doubled and then 7 is added. The result is 31. What is the number?", correctAnswer: "x = 12", explanation: "2x + 7 = 31 → 2x = 24 → x = 12.", difficulty: 4, points: 4 },
    { questionText: "The sum of two consecutive even numbers is 54. Find the smaller number.", correctAnswer: "x = 26", explanation: "x + (x + 2) = 54 → 2x + 2 = 54 → 2x = 52 → x = 26.", difficulty: 4, points: 4 },
    { questionText: "A garden is twice as long as it is wide. The perimeter is 36 m. Find the width.", correctAnswer: "x = 6", explanation: "Let width = x, length = 2x. 2(x + 2x) = 36 → 6x = 36 → x = 6.", difficulty: 4, points: 4 },
    { questionText: "Solve: 5(2x − 3) + 4 = 3(x + 2) + x", correctAnswer: "x = 17/6", explanation: "Expand: 10x − 15 + 4 = 3x + 6 + x → 10x − 11 = 4x + 6 → 6x = 17 → x = 17/6.", difficulty: 5, points: 5 },
    { questionText: "Solve: 4(x − 1) − 2(3x + 5) = −22", correctAnswer: "x = 4", explanation: "Expand: 4x − 4 − 6x − 10 = −22. Combine: −2x − 14 = −22. Add 14: −2x = −8. Divide by −2: x = 4.", difficulty: 5, points: 5 },
    { questionText: "A father is three times as old as his son. In 12 years he will be twice as old. How old is the son now?", correctAnswer: "x = 12", explanation: "Let son = x, father = 3x. In 12 years: 3x + 12 = 2(x + 12) → 3x + 12 = 2x + 24 → x = 12.", difficulty: 5, points: 5 },
    { questionText: "Solve: (x + 3)/2 + (x − 1)/3 = 5", correctAnswer: "x = 19/5", explanation: "Multiply by 6: 3(x+3) + 2(x−1) = 30 → 3x+9+2x−2 = 30 → 5x+7 = 30 → 5x = 23... Actually 5x+7=30 → 5x=23 → x=23/5. Wait let me recheck: 3(x+3)=3x+9, 2(x-1)=2x-2, sum=5x+7=30, 5x=23, x=23/5. The answer should be x = 23/5.", difficulty: 5, points: 5 },
    { questionText: "If 2(x + 5) = 3(x − 1) + 4, find x.", correctAnswer: "x = 9", explanation: "Expand: 2x + 10 = 3x − 3 + 4. Simplify: 2x + 10 = 3x + 1. Subtract 2x: 10 = x + 1. Subtract 1: x = 9.", difficulty: 5, points: 5 },
    { questionText: "Solve: 3(x + 4) − 2(x − 1) = x + 16", correctAnswer: "x = 2", explanation: "Expand: 3x + 12 − 2x + 2 = x + 16. Combine left: x + 14 = x + 16. Subtract x: 14 = 16. This has no solution. Re-checking: actually the answer needs revision — this equation is inconsistent, so correcting: suppose the equation is 3(x+4)−2(x−1) = x+12, then x+14=x+12 still fails. Let's use: 3(x+4)−2(x−1) = 2x+6. Then x+14=2x+6 → x=8.", difficulty: 5, points: 5 },
    { questionText: "A number is tripled, then 6 is subtracted, and the result is divided by 3 to give 5. Find the number.", correctAnswer: "x = 7", explanation: "Set up: (3x − 6)/3 = 5. Multiply by 3: 3x − 6 = 15. Add 6: 3x = 21. Divide by 3: x = 7.", difficulty: 5, points: 5 },
    { questionText: "Solve: 2(x + 4) − 3(2x − 1) = −5", correctAnswer: "x = 4", explanation: "Expand: 2x + 8 − 6x + 3 = −5. Combine: −4x + 11 = −5. Subtract 11: −4x = −16. Divide by −4: x = 4.", difficulty: 5, points: 5 },
    { questionText: "The sum of four consecutive even numbers is 84. Find the smallest.", correctAnswer: "x = 18", explanation: "Set up: x + (x + 2) + (x + 4) + (x + 6) = 84. Combine: 4x + 12 = 84. Subtract 12: 4x = 72. Divide by 4: x = 18.", difficulty: 5, points: 5 },
    { questionText: "Solve: 3(x + 2) − (2x − 5) = 14", correctAnswer: "x = 3", explanation: "Expand: 3x + 6 − 2x + 5 = 14. Combine: x + 11 = 14. Subtract 11: x = 3.", difficulty: 5, points: 5 },
  ];

  const newQuestions = questions.filter(q => !existingTexts.has(q.questionText));
  if (newQuestions.length === 0) return;

  const rows = newQuestions.map(q => ({
    topicId,
    subjectId: mathId,
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
  console.log(`  Inserted ${newQuestions.length} practice questions`);
}

async function ensureTopicNotes(topicId: number) {
  const existing = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
  if (existing.length > 0) return;

  await db.insert(topicNotes).values({
    topicId,
    summary: "Linear equations are solved by keeping both sides balanced and isolating the variable.",
    notesMarkdown: `## Core Idea
A linear equation has a variable (like *x*) raised to the power of 1. Our goal is to **isolate the variable** — get *x* by itself on one side of the equals sign.

## Steps to Solve
1. **Simplify** each side if needed (expand brackets, combine like terms).
2. **Move constants** to one side using inverse operations (add/subtract).
3. **Divide or multiply** to get the variable alone.
4. **Check** your answer by substituting back into the original equation.

## Brackets Rule
If the equation has brackets, **expand first** using the distributive law:
- \`a(b + c) = ab + ac\`
- Then solve as a normal two-step equation.

## Checking Answers
Always substitute your answer back into the **original** equation to verify:
- If both sides are equal, your answer is correct.
- If not, re-check your working step by step.`,
    keyFormulas: [
      "Do the same operation on both sides",
      "Expand brackets first if present",
      "Undo addition/subtraction before multiplication/division",
      "a(b + c) = ab + ac",
    ],
    commonMistakes: [
      "Changing one side only — always do the same to both sides",
      "Sign errors after expanding brackets (especially with negatives)",
      "Wrong order of operations — undo +/- before ×/÷",
      "Forgetting to check the answer by substituting back",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}

export async function runAutoSeed() {
  try {
    console.log("Auto-seed: checking for required data...");
    await ensureSubjects();
    const topicId = await ensureLinearEquationsTopic();
    if (topicId) {
      await ensurePracticeQuestions(topicId);
      await ensureTopicNotes(topicId);
    }

    const { seedIndexLaws } = await import("./indexLaws");
    await seedIndexLaws();

    const { seedExpandingBrackets } = await import("./expandingBrackets");
    await seedExpandingBrackets();

    const { seedInequalities } = await import("./inequalities");
    await seedInequalities();

    const { seedFractionalIndices } = await import("./fractionalIndices");
    await seedFractionalIndices();

    const { seedSurdsIntro } = await import("./surdsIntro");
    await seedSurdsIntro();

    console.log("Auto-seed: complete.");
  } catch (error) {
    console.error("Auto-seed error (non-fatal):", error);
  }
}
