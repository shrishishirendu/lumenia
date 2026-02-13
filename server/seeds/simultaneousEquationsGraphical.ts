import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedSimultaneousEquationsGraphical() {
  console.log("Seeding Simultaneous Equations – Graphical content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Simultaneous Equations – Graphical";

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
    console.log("Simultaneous Equations – Graphical topic already exists (id=" + topicId + "). Checking for missing data...");

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

  const findingEqTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Finding Equations of Lines")));
  const prerequisiteId = findingEqTopic.length > 0 ? findingEqTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Solve simultaneous equations graphically by finding the intersection point of two lines, including parallel (no solution) and coincident (infinite solutions) cases.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 16,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);
  const topicId = topic.id;

  const lessonData = [
    {
      title: "Reading Intersection Points",
      description: "Learn to find where two lines cross on a coordinate graph and read the solution as (x, y).",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand that each linear equation represents a straight line",
        "Identify the intersection point of two lines from a graph",
        "Write the solution as a coordinate pair (x, y)",
      ],
    },
    {
      title: "Verifying Graphical Solutions",
      description: "Confirm that the intersection point satisfies both equations by substitution.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Substitute the intersection coordinates into both equations",
        "Check that both sides of each equation are equal",
        "Understand why the intersection satisfies the system",
      ],
    },
    {
      title: "Special Cases: Parallel and Coincident Lines",
      description: "Recognise when a system has no solution (parallel lines) or infinitely many solutions (same line).",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Identify parallel lines by equal gradients and different intercepts",
        "Recognise coincident lines as having the same equation",
        "Classify systems as having one, zero, or infinitely many solutions",
      ],
    },
  ];

  const segmentContents: Record<string, { explanation: string; example: string; practice: string }> = {
    "Reading Intersection Points": {
      explanation: `## What Are Simultaneous Equations?\n\nWhen we have **two equations** with two unknowns (usually x and y), we call them **simultaneous equations**. The solution is the pair of values (x, y) that makes **both** equations true at the same time.\n\n## Graphical Method\n\nEach linear equation (like y = 2x + 1) represents a **straight line** on a coordinate plane. When we draw both lines on the same graph:\n\n- The **intersection point** — where the two lines cross — gives us the solution.\n- The x-coordinate of that point is the value of x, and the y-coordinate is the value of y.\n\n## How to Read the Intersection\n\n1. Look at where the two lines **cross each other**.\n2. Drop a vertical line down to the x-axis to read the **x-value**.\n3. Draw a horizontal line across to the y-axis to read the **y-value**.\n4. Write the answer as a coordinate pair: **(x, y)**.\n\n## Key Points\n\n- The intersection point satisfies **both** equations simultaneously.\n- If the lines cross at (3, 1), it means x = 3 and y = 1 is the solution.\n- Always read coordinates carefully using the grid lines — don't estimate between grid lines unless you have to.`,
      example: `## Worked Example: Finding the Intersection\n\n**Question:** The graph shows two lines. Find the solution where the two lines intersect.\n\nImagine the graph shows:\n- **Line L₁** (blue): y = 2x − 1\n- **Line L₂** (red dashed): y = −x + 5\n\n### Step 1: Locate the Crossing Point\nLook at the graph carefully. The two lines cross at one specific point.\n\n### Step 2: Read the Coordinates\n- Follow the crossing point **down** to the x-axis → x = **2**\n- Follow the crossing point **across** to the y-axis → y = **3**\n\n### Step 3: Write the Answer\nThe intersection point is **(2, 3)**.\n\n### Step 4: Quick Check\n- In L₁: y = 2(2) − 1 = 4 − 1 = **3** ✓\n- In L₂: y = −(2) + 5 = −2 + 5 = **3** ✓\n\nBoth equations give y = 3 when x = 2, confirming **(2, 3)** is correct.\n\n---\n\n**Another Example:** Two lines cross at (−1, 4).\n- Read from the graph: go left to x = −1, up to y = 4.\n- Answer: **(−1, 4)**.`,
      practice: `## Practice: Reading Intersection Points\n\nTry these exercises. For each graph, identify the intersection point and write it as (x, y).\n\n**Exercise 1:** Two lines cross at a point in the first quadrant (top-right area of the graph). The crossing point lines up with x = 1 on the horizontal axis and y = 3 on the vertical axis.\n- **Answer:** (1, 3)\n\n**Exercise 2:** Two lines intersect in the third quadrant. The crossing point is at x = −2 and y = −1.\n- **Answer:** (−2, −1)\n\n**Exercise 3:** A horizontal line y = 2 crosses a sloped line. They meet directly above x = 4.\n- **Answer:** (4, 2)\n\n### Tips for Reading Graphs Accurately\n- Use the **grid lines** to help you — line up the intersection with the nearest marks on both axes.\n- If the intersection falls **between** grid lines, look very carefully and estimate to the nearest half-unit.\n- Always check by substituting back into both equations if they are given.\n\n### Common Mistakes to Avoid\n- Mixing up x and y coordinates (remember: x comes first, y comes second).\n- Misreading the scale on the axes.\n- Forgetting negative signs when the point is in the second, third, or fourth quadrant.`,
    },
    "Verifying Graphical Solutions": {
      explanation: `## Why Verify Your Answer?\n\nReading a graph can sometimes lead to small errors — you might misread a coordinate by one unit, or mix up the x and y values. **Verification by substitution** is a quick way to check your answer is correct.\n\n## How to Verify\n\nOnce you have read the intersection point (x, y) from the graph:\n\n1. **Substitute** the x-value into **Equation 1** and check that you get the y-value.\n2. **Substitute** the x-value into **Equation 2** and check that you also get the y-value.\n3. If **both** equations give the correct y-value, your answer is confirmed.\n\n## What If It Doesn't Work?\n\n- If one or both equations don't match, **re-read the graph** more carefully.\n- Double-check you haven't swapped x and y.\n- Make sure you are using the correct sign (positive or negative).\n\n## Why This Works\n\nThe intersection point is the **only** point that lies on **both** lines. So when you plug x into either equation, you should get exactly the same y. If you do, you've proven the point is correct.`,
      example: `## Worked Example: Verifying a Solution\n\n**Question:** The graph shows y = 3x − 4 and y = −x + 8. The lines appear to cross at (3, 5). Verify this is the correct solution.\n\n### Step 1: Substitute into Equation 1\ny = 3x − 4\ny = 3(3) − 4\ny = 9 − 4\ny = **5** ✓ (matches the y-coordinate)\n\n### Step 2: Substitute into Equation 2\ny = −x + 8\ny = −(3) + 8\ny = −3 + 8\ny = **5** ✓ (matches the y-coordinate)\n\n### Step 3: Conclusion\nSince both equations give y = 5 when x = 3, the solution **(3, 5)** is verified.\n\n---\n\n**Example 2:** Lines y = 2x + 1 and y = −x − 2 appear to cross at (−1, −1).\n\n- Equation 1: y = 2(−1) + 1 = −2 + 1 = **−1** ✓\n- Equation 2: y = −(−1) − 2 = 1 − 2 = **−1** ✓\n\nBoth check out, so **(−1, −1)** is confirmed as the solution.`,
      practice: `## Practice: Verifying Solutions\n\nFor each problem, you are given the equations and the intersection point read from the graph. Verify by substitution.\n\n**Exercise 1:** y = x + 2 and y = −2x + 8. Intersection appears to be (2, 4).\n- Check Eq 1: y = 2 + 2 = **4** ✓\n- Check Eq 2: y = −2(2) + 8 = −4 + 8 = **4** ✓\n- **Verified: (2, 4)** is correct.\n\n**Exercise 2:** y = −x + 3 and y = 2x − 3. Intersection appears to be (2, 1).\n- Check Eq 1: y = −(2) + 3 = **1** ✓\n- Check Eq 2: y = 2(2) − 3 = 4 − 3 = **1** ✓\n- **Verified: (2, 1)** is correct.\n\n**Exercise 3:** y = x − 1 and y = −3x + 7. A student reads the intersection as (3, 2). Is this correct?\n- Check Eq 1: y = 3 − 1 = **2** ✓\n- Check Eq 2: y = −3(3) + 7 = −9 + 7 = **−2** ✗\n- **The student made an error!** The answer (3, 2) does NOT satisfy Equation 2.\n- Correct answer: Set x − 1 = −3x + 7 → 4x = 8 → x = 2, y = 1. The correct solution is **(2, 1)**.\n\n### Lesson\nAlways verify — it only takes 30 seconds and catches reading mistakes!`,
    },
    "Special Cases: Parallel and Coincident Lines": {
      explanation: `## Special Cases: Not All Systems Have One Solution\n\nSo far, we have seen systems where two lines cross at exactly one point. But there are two special cases where this doesn't happen.\n\n## Case 1: Parallel Lines → No Solution\n\nTwo lines are **parallel** when they have the **same gradient** (slope) but **different y-intercepts**.\n\nFor example: y = 2x + 3 and y = 2x − 1\n- Both have gradient 2, so they go in the same direction.\n- But they start at different heights (y-intercepts 3 and −1).\n- They will **never meet** — no matter how far you extend them.\n- **Answer: "no solution"**\n\n### How to Spot Parallel Lines on a Graph\n- The lines look like they go in the same direction.\n- The gap between them stays the same — they never get closer or further apart.\n\n## Case 2: Coincident Lines → Infinitely Many Solutions\n\nTwo equations are **coincident** when they produce the **exact same line**.\n\nFor example: y = x + 2 and 2y = 2x + 4 (which simplifies to y = x + 2)\n- They have the same gradient AND the same y-intercept.\n- On the graph, you only see **one line** — because they overlap completely.\n- Every point on the line is a solution.\n- **Answer: "infinitely many solutions"**\n\n## Summary Table\n\n| Lines | Gradients | Y-intercepts | Solutions |\n|-------|-----------|-------------|----------|\n| Cross at one point | Different | Any | **One solution** (x, y) |\n| Parallel | Same | Different | **No solution** |\n| Identical | Same | Same | **Infinitely many** |`,
      example: `## Worked Example: Identifying Special Cases\n\n**Example 1: No Solution (Parallel Lines)**\n\nThe graph shows y = −x + 4 and y = −x + 1.\n\n- Both lines have gradient **−1** (they slope downward at the same angle).\n- But their y-intercepts are different: 4 and 1.\n- On the graph, the lines run side by side and **never cross**.\n- **Answer: no solution**\n\n---\n\n**Example 2: Infinitely Many Solutions (Coincident Lines)**\n\nA student graphs y = 2x − 3 and 4x − 2y = 6.\n\nRearranging the second equation:\n4x − 2y = 6 → −2y = −4x + 6 → y = 2x − 3\n\nBoth equations simplify to y = 2x − 3. The graph shows **only one line** because they are identical.\n\n- **Answer: infinitely many solutions**\n\n---\n\n**Example 3: One Solution (Different Gradients)**\n\nThe graph shows y = x + 1 and y = −2x + 7.\n\n- The gradients are 1 and −2 — they are **different**.\n- The lines must cross somewhere.\n- From the graph, they cross at **(2, 3)**.\n- Verify: 2 + 1 = 3 ✓ and −2(2) + 7 = 3 ✓.\n- **Answer: (2, 3)**`,
      practice: `## Practice: Classifying Systems\n\nFor each system below, determine whether it has one solution, no solution, or infinitely many solutions.\n\n**Exercise 1:** y = 3x + 2 and y = 3x − 5\n- Gradients: both **3** (same)\n- Y-intercepts: 2 and −5 (different)\n- **Answer: no solution** — the lines are parallel.\n\n**Exercise 2:** y = −2x + 4 and y = x + 1\n- Gradients: −2 and 1 (different)\n- The lines must cross.\n- Set −2x + 4 = x + 1 → 3 = 3x → x = 1, y = 2.\n- **Answer: one solution, (1, 2)**\n\n**Exercise 3:** y = x − 3 and 2y − 2x = −6\n- Rearrange: 2y = 2x − 6 → y = x − 3.\n- Both equations are y = x − 3 — the same line!\n- **Answer: infinitely many solutions**\n\n**Exercise 4:** y = −x + 5 and y = 2x − 1\n- Gradients: −1 and 2 (different)\n- Set −x + 5 = 2x − 1 → 6 = 3x → x = 2, y = 3.\n- **Answer: one solution, (2, 3)**\n\n### Quick Decision Guide\n1. Compare the gradients first.\n2. If different → **one solution** (find the intersection).\n3. If same → check the y-intercepts.\n4. Same intercept too → **infinitely many solutions**.\n5. Different intercepts → **no solution**.`,
    },
  };

  for (const ld of lessonData) {
    const [lesson] = await db
      .insert(lessons)
      .values({ ...ld, topicId: topic.id, isActive: true })
      .returning();

    const content = segmentContents[ld.title];
    const segments = [
      { lessonId: lesson.id, segmentType: "explanation" as const, title: `${ld.title} — Explanation`, content: content.explanation, orderIndex: 1 },
      { lessonId: lesson.id, segmentType: "example" as const, title: `${ld.title} — Worked Example`, content: content.example, orderIndex: 2 },
      { lessonId: lesson.id, segmentType: "practice" as const, title: `${ld.title} — Practice`, content: content.practice, orderIndex: 3 },
    ];
    await db.insert(lessonSegments).values(segments);
  }

  console.log(`  Created 3 lessons with segments for topic ${topicId}`);

  await insertQuizQuestions(topicId, SUBJECT_ID);
  await insertTopicNotes(topicId);

  return topicId;
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questions = [
    { questionText: "Two lines intersect at the point (3, 1). What is the solution to the system?", correctAnswer: "(3,1)", explanation: "The intersection point of two lines is the solution. Answer: (3, 1).", difficulty: 1, points: 1 },
    { questionText: "From the graph, two lines cross at (0, 2). State the solution.", correctAnswer: "(0,2)", explanation: "The lines meet at the y-axis at y = 2. Solution: (0, 2).", difficulty: 1, points: 1 },
    { questionText: "Two lines meet at (-1, 4). Write the solution as a coordinate pair.", correctAnswer: "(-1,4)", explanation: "The intersection is at x = -1, y = 4. Answer: (-1, 4).", difficulty: 1, points: 1 },
    { questionText: "The lines y = x + 1 and y = -x + 3 are graphed. Find their intersection.", correctAnswer: "(1,2)", explanation: "Setting x + 1 = -x + 3 gives 2x = 2, x = 1, y = 2. Answer: (1, 2).", difficulty: 1, points: 1 },
    { questionText: "From the graph, two lines cross at (2, -1). What is the solution?", correctAnswer: "(2,-1)", explanation: "Reading from the graph, the intersection is at (2, -1).", difficulty: 1, points: 1 },
    { questionText: "Lines y = 2x - 1 and y = -x + 5 are graphed. Read the intersection.", correctAnswer: "(2,3)", explanation: "Setting 2x - 1 = -x + 5: 3x = 6, x = 2, y = 3. Answer: (2, 3).", difficulty: 2, points: 2 },
    { questionText: "The lines y = 3x - 4 and y = x + 2 intersect. Find the point.", correctAnswer: "(3,5)", explanation: "3x - 4 = x + 2 gives 2x = 6, x = 3, y = 5. Answer: (3, 5).", difficulty: 2, points: 2 },
    { questionText: "Two lines y = -2x + 3 and y = x are graphed. State the intersection.", correctAnswer: "(1,1)", explanation: "-2x + 3 = x gives 3 = 3x, x = 1, y = 1. Answer: (1, 1).", difficulty: 2, points: 2 },
    { questionText: "From the graph of y = x + 4 and y = -2x + 1, read the intersection and verify by substitution.", correctAnswer: "(-1,3)", explanation: "x + 4 = -2x + 1 gives 3x = -3, x = -1, y = 3. Check: -1 + 4 = 3 ✓, -2(-1) + 1 = 3 ✓.", difficulty: 2, points: 2 },
    { questionText: "The lines y = 2x + 1 and y = 2x - 3 are graphed. What is the solution?", correctAnswer: "no solution", explanation: "Both lines have gradient 2 but different y-intercepts, so they are parallel. No intersection exists.", difficulty: 3, points: 3 },
    { questionText: "Two lines y = -x + 2 and y = -x + 5 are shown. How many solutions?", correctAnswer: "no solution", explanation: "Same gradient (-1) but different intercepts means parallel lines. No solution.", difficulty: 3, points: 3 },
    { questionText: "The graph shows y = 3x - 2 and y = -x + 6. The lines appear to cross at (2, 4). Verify.", correctAnswer: "(2,4)", explanation: "Check: y = 3(2) - 2 = 4 ✓ and y = -(2) + 6 = 4 ✓. The solution is (2, 4).", difficulty: 3, points: 3 },
    { questionText: "Lines y = 2x + 3 and y = -3x - 2 cross at (-1, 1). Verify this solution.", correctAnswer: "(-1,1)", explanation: "Check: y = 2(-1) + 3 = 1 ✓ and y = -3(-1) - 2 = 1 ✓. Solution verified: (-1, 1).", difficulty: 3, points: 3 },
    { questionText: "From the graph of y = -2x + 1 and y = 3x - 4, find the intersection.", correctAnswer: "(1,-1)", explanation: "-2x + 1 = 3x - 4 gives 5 = 5x, x = 1, y = -1. Answer: (1, -1).", difficulty: 3, points: 3 },
    { questionText: "Two equations produce the same line on the graph: y = 2x + 1. How many solutions?", correctAnswer: "infinitely many solutions", explanation: "Coincident lines share every point. The system has infinitely many solutions.", difficulty: 4, points: 4 },
    { questionText: "A graph shows only one line. Both equations give y = -x + 3. Classify the system.", correctAnswer: "infinitely many solutions", explanation: "The equations are identical, producing coincident lines with infinitely many solutions.", difficulty: 4, points: 4 },
    { questionText: "Classify the system: y = 3x + 1 and y = 3x - 2. One solution, no solution, or infinitely many?", correctAnswer: "no solution", explanation: "Same gradient (3), different intercepts (1 vs -2). Parallel lines: no solution.", difficulty: 4, points: 4 },
    { questionText: "The graph shows y = x - 1 and y = -2x + 5. Classify and solve.", correctAnswer: "(2,1)", explanation: "Different gradients (1 and -2), so one solution. x - 1 = -2x + 5 gives 3x = 6, x = 2, y = 1.", difficulty: 4, points: 4 },
    { questionText: "Lines y = -x + 4 and y = 2x - 5 are graphed. Determine the number of solutions and state the answer.", correctAnswer: "(3,1)", explanation: "-x + 4 = 2x - 5 gives 9 = 3x, x = 3, y = 1. One solution: (3, 1).", difficulty: 4, points: 4 },
    { questionText: "A graph shows y = -3x + 2 and y = -3x + 2. What type of system is this?", correctAnswer: "infinitely many solutions", explanation: "The two equations are identical. Every point on the line is a solution.", difficulty: 4, points: 4 },
  ];

  await db.insert(quizQuestions).values(
    questions.map(q => ({
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
    }))
  );
  console.log(`  Inserted ${questions.length} quiz questions`);
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary: "Simultaneous equations can be solved graphically by finding where two lines intersect on a coordinate plane.",
    notesMarkdown: `## Core Idea
Two linear equations form a **system of simultaneous equations**. Each equation represents a straight line. The **solution** is the point (x, y) where both lines intersect.

## How to Solve Graphically
1. **Draw** (or read) both lines on the same coordinate grid.
2. **Find** the point where the lines cross — this is the intersection.
3. **Read** the x and y coordinates of this point.
4. **Verify** by substituting into both equations.

## Types of Solutions
| Situation | Gradients | Intercepts | Solutions |
|-----------|-----------|------------|-----------|
| Lines cross | Different | Any | **One solution** (the intersection point) |
| Lines parallel | Same | Different | **No solution** |
| Lines identical | Same | Same | **Infinitely many solutions** |

## Key Vocabulary
- **Intersection point**: Where the two lines cross — this is the solution.
- **Parallel lines**: Same gradient, never meet — no solution.
- **Coincident lines**: Same line — infinitely many solutions.

## Checking Your Answer
Always substitute your answer (x, y) back into **both** original equations:
- If both equations give the correct y-value, your answer is correct.
- If one or both fail, re-read the graph more carefully.`,
    keyFormulas: [
      "Solution = intersection point (x, y)",
      "Parallel lines: same gradient, different intercepts → no solution",
      "Coincident lines: same equation → infinitely many solutions",
      "Always verify by substituting back into both equations",
    ],
    commonMistakes: [
      "Misreading the intersection coordinates from the graph",
      "Forgetting that parallel lines (same gradient) have no solution",
      "Not checking the answer by substituting into both equations",
      "Confusing 'no solution' with 'infinitely many solutions'",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}
