import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedInequalities() {
  console.log("Seeding Inequalities content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Inequalities";

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
    console.log("Inequalities topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Solve one-variable linear inequalities, including sign-flip rules and word problems",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 4,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);

  const lessonData = [
    {
      title: "One-Step Inequalities",
      description: "Learn to solve simple inequalities using inverse operations and understand solution sets.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: ["Understand what an inequality represents", "Solve one-step inequalities using inverse operations", "Graph solutions on a number line"],
      segments: [
        {
          title: "What is an Inequality?",
          type: "explanation",
          content: "An inequality compares two values and shows that one is greater than, less than, or not equal to the other. The symbols are: > (greater than), < (less than), ≥ (greater than or equal to), ≤ (less than or equal to). Unlike equations which have one answer, inequalities describe a range of values.",
          tutorScript: "Think of an inequality like a see-saw that tilts one way. Instead of finding one exact answer, we find all the numbers that make the statement true.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: x + 3 > 7\nSubtract 3 from both sides → x > 4\nAny number greater than 4 works!\n\nExample 2: 2x ≤ 10\nDivide both sides by 2 → x ≤ 5\nAny number up to and including 5 works.\n\nExample 3: x − 5 ≥ 2\nAdd 5 to both sides → x ≥ 7",
          tutorScript: "Notice how we solve these exactly like equations — use inverse operations — but we keep the inequality sign instead of an equals sign.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these on your own:\n1) x + 4 > 9\n2) 3x < 15\n3) x − 2 ≥ 6\n4) x ÷ 4 ≤ 3\n\nHint: Use the same inverse operations as with equations. The inequality sign stays the same when adding, subtracting, multiplying, or dividing by a positive number.",
          tutorScript: "Remember: treat it just like an equation, but keep the inequality symbol instead of the equals sign.",
        },
      ],
    },
    {
      title: "Two-Step Inequalities",
      description: "Solve inequalities requiring two inverse operations and interpret the solution.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: ["Apply two inverse operations to isolate the variable", "Solve two-step inequalities fluently", "Check solutions by testing values"],
      segments: [
        {
          title: "Two Steps to Solve",
          type: "explanation",
          content: "Two-step inequalities need two inverse operations, just like two-step equations. Always undo addition or subtraction first, then undo multiplication or division. The inequality sign direction is preserved when operating with positive numbers.",
          tutorScript: "The process is identical to two-step equations: peel back the layers in reverse order of operations.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: 3x + 2 > 11\nStep 1: Subtract 2 → 3x > 9\nStep 2: Divide by 3 → x > 3\n\nExample 2: 5x − 4 ≤ 16\nStep 1: Add 4 → 5x ≤ 20\nStep 2: Divide by 5 → x ≤ 4\n\nExample 3: 2(x + 3) < 14\nStep 1: Expand → 2x + 6 < 14\nStep 2: Subtract 6 → 2x < 8\nStep 3: Divide by 2 → x < 4",
          tutorScript: "Always deal with the constant term first, then the coefficient. With brackets, expand first.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) 4x + 1 ≥ 13\n2) 6x − 3 < 21\n3) 2x + 7 ≤ 19\n4) 3(x − 2) > 9\n\nHint: Undo addition/subtraction first, then multiplication/division.",
          tutorScript: "Take your time with each step. Check your answer by plugging in a number that should work.",
        },
      ],
    },
    {
      title: "Inequalities with Negative Coefficients",
      description: "Learn the sign-flip rule when multiplying or dividing by negative numbers.",
      orderIndex: 3,
      estimatedMinutes: 15,
      objectives: ["Understand why the inequality sign flips with negative multipliers", "Solve inequalities involving negative coefficients", "Avoid common sign-flip errors"],
      segments: [
        {
          title: "The Sign-Flip Rule",
          type: "explanation",
          content: "CRITICAL RULE: When you multiply or divide both sides of an inequality by a NEGATIVE number, you must FLIP the inequality sign. This is because multiplying by a negative reverses the order of numbers on the number line. For example, 2 < 5, but −2 > −5.",
          tutorScript: "This is the single most important difference between equations and inequalities. Many students forget this rule, so let us practise it carefully.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: −3x > 12\nDivide by −3 AND FLIP the sign → x < −4\nCheck: x = −5 → −3(−5) = 15 > 12 ✓\n\nExample 2: −2x + 5 ≤ 11\nSubtract 5 → −2x ≤ 6\nDivide by −2 AND FLIP → x ≥ −3\nCheck: x = 0 → −2(0) + 5 = 5 ≤ 11 ✓\n\nExample 3: −4(x + 2) > 8\nExpand → −4x − 8 > 8\nAdd 8 → −4x > 16\nDivide by −4 AND FLIP → x < −4",
          tutorScript: "Every time you see a negative coefficient, a red flag should go up in your mind: I need to flip the sign when I divide!",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these (watch for the sign flip!):\n1) −5x < 20\n2) −2x + 6 ≥ 10\n3) −3(x − 1) > 15\n4) (x + 6) ÷ (−2) ≥ −3\n\nHint: Only flip the sign when multiplying or dividing by a NEGATIVE number. Adding or subtracting never causes a flip.",
          tutorScript: "Ask yourself before each step: Am I multiplying or dividing by a negative? If yes, flip!",
        },
      ],
    },
    {
      title: "Inequality Word Problems",
      description: "Translate real-world scenarios into inequalities, solve, and interpret results.",
      orderIndex: 4,
      estimatedMinutes: 15,
      objectives: ["Translate word problems into algebraic inequalities", "Solve the resulting inequality", "Interpret and validate the solution in context"],
      segments: [
        {
          title: "From Words to Inequalities",
          type: "explanation",
          content: 'Word problems use phrases that signal inequalities: "at least" means ≥, "at most" means ≤, "more than" means >, "fewer than" or "less than" means <, "no more than" means ≤, "no fewer than" means ≥. Identify the variable, write the inequality, solve, and interpret.',
          tutorScript: "The trickiest part is translating the English into maths. Look for key phrases and match them to inequality symbols.",
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: A student needs at least 70 marks average over 4 tests. After 3 tests (65, 72, 68), what minimum score is needed on the 4th test?\nLet x = 4th test score\n(65 + 72 + 68 + x) ÷ 4 ≥ 70\n205 + x ≥ 280\nx ≥ 75\nThe student needs at least 75.\n\nExample 2: A phone plan costs $15 base plus $0.50 per GB. Budget is $40 max. How many GB can be used?\n15 + 0.5g ≤ 40\n0.5g ≤ 25\ng ≤ 50\nUp to 50 GB can be used.",
          tutorScript: "Always state what the variable represents, write the inequality, solve it, then answer in words.",
        },
        {
          title: "Guided Practice",
          type: "practice",
          content: "Try these:\n1) A bus holds at most 48 passengers. If 31 are already on, how many more can board?\n2) Sam earns $12/hour. How many hours must he work to earn more than $200?\n3) A rectangle has width 5 cm. Its perimeter must be less than 40 cm. What lengths are possible?\n\nHint: Identify the key phrase (at most, more than, less than) and match it to the correct inequality symbol.",
          tutorScript: "Remember: translate the words carefully, solve the inequality, then answer in a full sentence.",
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
    { questionText: "Solve: x + 3 > 7", correctAnswer: "x > 4", explanation: "Subtract 3 from both sides: x > 7 − 3 = 4", difficulty: 1, points: 1 },
    { questionText: "Solve: 2x < 10", correctAnswer: "x < 5", explanation: "Divide both sides by 2: x < 10 ÷ 2 = 5", difficulty: 1, points: 1 },
    { questionText: "Solve: x − 5 ≥ 2", correctAnswer: "x ≥ 7", explanation: "Add 5 to both sides: x ≥ 2 + 5 = 7", difficulty: 1, points: 1 },
    { questionText: "Solve: x ÷ 3 ≤ 4", correctAnswer: "x ≤ 12", explanation: "Multiply both sides by 3: x ≤ 4 × 3 = 12", difficulty: 1, points: 1 },
    { questionText: "Solve: 6 + x > 10", correctAnswer: "x > 4", explanation: "Subtract 6: x > 4", difficulty: 1, points: 1 },
    { questionText: "Solve: 8x > 24", correctAnswer: "x > 3", explanation: "Divide by 8: x > 3", difficulty: 1, points: 1 },
    { questionText: "Solve: 3x + 2 > 11", correctAnswer: "x > 3", explanation: "Subtract 2: 3x > 9. Divide by 3: x > 3", difficulty: 2, points: 2 },
    { questionText: "Solve: 5x − 4 ≤ 16", correctAnswer: "x ≤ 4", explanation: "Add 4: 5x ≤ 20. Divide by 5: x ≤ 4", difficulty: 2, points: 2 },
    { questionText: "Solve: 2(x + 3) < 14", correctAnswer: "x < 4", explanation: "Expand: 2x + 6 < 14. Subtract 6: 2x < 8. Divide by 2: x < 4", difficulty: 2, points: 2 },
    { questionText: "Solve: 4x + 1 ≥ 2x + 9", correctAnswer: "x ≥ 4", explanation: "Subtract 2x: 2x + 1 ≥ 9. Subtract 1: 2x ≥ 8. Divide by 2: x ≥ 4", difficulty: 2, points: 2 },
    { questionText: "Solve: 7x − 3 < 2x + 12", correctAnswer: "x < 3", explanation: "Subtract 2x: 5x − 3 < 12. Add 3: 5x < 15. Divide by 5: x < 3", difficulty: 2, points: 2 },
    { questionText: "Solve: 3(2x − 1) ≥ 15", correctAnswer: "x ≥ 3", explanation: "Expand: 6x − 3 ≥ 15. Add 3: 6x ≥ 18. Divide by 6: x ≥ 3", difficulty: 2, points: 2 },
    { questionText: "Solve: −3x > 12", correctAnswer: "x < −4", explanation: "Divide by −3 and flip sign: x < −4", difficulty: 3, points: 3 },
    { questionText: "Solve: −2x + 5 ≤ 11", correctAnswer: "x ≥ −3", explanation: "Subtract 5: −2x ≤ 6. Divide by −2 and flip: x ≥ −3", difficulty: 3, points: 3 },
    { questionText: "Solve: −4(x + 2) > 8", correctAnswer: "x < −4", explanation: "Expand: −4x − 8 > 8. Add 8: −4x > 16. Divide by −4, flip: x < −4", difficulty: 3, points: 3 },
    { questionText: "Solve: (x + 6) ÷ (−2) ≥ −3", correctAnswer: "x ≤ 0", explanation: "Multiply by −2, flip: x + 6 ≤ 6. Subtract 6: x ≤ 0", difficulty: 3, points: 3 },
    { questionText: "Solve: −5x + 10 < 35", correctAnswer: "x > −5", explanation: "Subtract 10: −5x < 25. Divide by −5, flip: x > −5", difficulty: 3, points: 3 },
    { questionText: "A student needs at least 70 marks average over 4 tests. After 3 tests (65, 72, 68), what minimum score is needed?", correctAnswer: "x ≥ 75", explanation: "Sum needed: 280. So far: 205. Need x ≥ 280 − 205 = 75", difficulty: 4, points: 4 },
    { questionText: "A phone plan has a $15 base fee plus $0.50 per GB. Budget is $40. Maximum GB?", correctAnswer: "50 GB", explanation: "15 + 0.5g ≤ 40 → 0.5g ≤ 25 → g ≤ 50", difficulty: 4, points: 4 },
    { questionText: "A bus can hold no more than 48 passengers. If 31 are already on, how many more can board?", correctAnswer: "p ≤ 17", explanation: "31 + p ≤ 48, so p ≤ 17", difficulty: 4, points: 4 },
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
  console.log(`  Inserted ${rows.length} practice questions for Inequalities`);

  await db.insert(topicNotes).values({
    topicId: topic.id,
    summary: "Inequalities are solved like equations, but the sign flips when multiplying or dividing by a negative.",
    notesMarkdown: `## Core Idea
An inequality shows that one expression is greater than, less than, or not equal to another. The solution is a **range of values**, not a single number.

## Inequality Symbols
- \\( > \\) greater than
- \\( < \\) less than
- \\( \\geq \\) greater than or equal to
- \\( \\leq \\) less than or equal to

## Steps to Solve
1. **Simplify** each side if needed (expand brackets, combine like terms).
2. **Move constants** to one side using inverse operations (add/subtract).
3. **Divide or multiply** to isolate the variable.
4. **FLIP the sign** if you multiply or divide by a **negative number**.

## The Sign-Flip Rule
When you multiply or divide both sides by a negative number, the inequality sign **reverses direction**:
- \\( -2x > 6 \\) becomes \\( x < -3 \\)
- This happens because negation reverses order on the number line.

## Word Problem Key Phrases
- "at least" → ≥
- "at most" → ≤
- "more than" → >
- "fewer than" / "less than" → <`,
    keyFormulas: [
      "Flip the inequality sign when multiplying or dividing by a negative",
      "at least → ≥, at most → ≤",
      "Solve like an equation but keep the inequality sign",
      "Check answer by substituting a value from the solution set",
    ],
    commonMistakes: [
      "Forgetting to flip the sign when dividing by a negative number",
      "Confusing > with ≥ (strict vs non-strict inequality)",
      "Wrong translation of word problem phrases to inequality symbols",
      "Applying sign-flip when adding/subtracting a negative (only flip for multiply/divide)",
    ],
  });
  console.log(`  Created topic notes for Inequalities`);

  return topic.id;
}
