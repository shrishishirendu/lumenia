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
