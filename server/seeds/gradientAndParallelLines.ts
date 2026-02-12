import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedGradientAndParallelLines() {
  console.log("Seeding Gradient and Parallel Lines content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Gradient and Parallel Lines";

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
    console.log("Gradient and Parallel Lines topic already exists (id=" + topicId + "). Checking for missing data...");

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

  const linearEqTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Linear Equations")));
  const prerequisiteId = linearEqTopic.length > 0 ? linearEqTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Find gradients from points and equations, identify parallel lines, and solve problems with perpendicular lines.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 12,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);
  const topicId = topic.id;

  const lessonData = [
    {
      title: "Understanding Gradient",
      description: "Learn what gradient (slope) means and how to calculate it from two points.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand gradient as rise over run",
        "Calculate gradient from two points using the formula",
        "Identify gradient from the equation y = mx + c",
      ],
    },
    {
      title: "Parallel Lines and Equal Gradients",
      description: "Discover the connection between parallel lines and their gradients.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: [
        "Know that parallel lines have equal gradients",
        "Determine if two lines are parallel by comparing gradients",
        "Find the equation of a parallel line through a given point",
      ],
    },
    {
      title: "Perpendicular Lines (Extension)",
      description: "Explore how the gradients of perpendicular lines are related.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Know that perpendicular gradients multiply to give -1",
        "Find the gradient of a perpendicular line",
        "Write equations of perpendicular lines through a point",
      ],
    },
  ];

  for (const ld of lessonData) {
    const [lesson] = await db
      .insert(lessons)
      .values({ ...ld, topicId, isActive: true })
      .returning();

    const segments = [
      { lessonId: lesson.id, segmentType: "explanation" as const, title: `${ld.title} — Explanation`, content: `Key concepts for ${ld.title.toLowerCase()}.`, orderIndex: 1 },
      { lessonId: lesson.id, segmentType: "example" as const, title: `${ld.title} — Worked Example`, content: `Step-by-step example for ${ld.title.toLowerCase()}.`, orderIndex: 2 },
      { lessonId: lesson.id, segmentType: "practice" as const, title: `${ld.title} — Practice`, content: `Practice problems for ${ld.title.toLowerCase()}.`, orderIndex: 3 },
    ];
    await db.insert(lessonSegments).values(segments);
  }

  console.log(`  Created 3 lessons with segments for topic ${topicId}`);

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  return topicId;
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary: "The gradient (slope) measures how steep a line is. Parallel lines always have the same gradient.",
    notesMarkdown: `## Gradient Formula
The gradient (or slope) of a line through two points (x1, y1) and (x2, y2) is:

**m = (y2 - y1) / (x2 - x1)**

This is sometimes called "rise over run".

## Gradient from an Equation
If a line is written as **y = mx + c**, the gradient is simply **m** — the coefficient of x.

## Parallel Lines
Two lines are **parallel** if and only if they have the **same gradient**.

For example, y = 3x + 1 and y = 3x - 5 are parallel because both have gradient 3.

## Perpendicular Lines (Extension)
Two lines are **perpendicular** if their gradients multiply to give **-1**:
- m1 x m2 = -1
- So m2 = -1 / m1

For example, if one line has gradient 2, a perpendicular line has gradient -1/2.

## Finding an Equation
Given gradient m and a point (a, b):
1. Start with y = mx + c
2. Substitute the point: b = m(a) + c
3. Solve for c`,
    keyFormulas: JSON.stringify([
      "m = (y2 - y1) / (x2 - x1)",
      "y = mx + c where m is gradient, c is y-intercept",
      "Parallel lines: m1 = m2",
      "Perpendicular lines: m1 x m2 = -1",
    ]),
    commonMistakes: JSON.stringify([
      "Mixing up rise and run: gradient is change in y divided by change in x, not the other way around",
      "Sign errors: double-check when subtracting negative coordinates",
      "Forgetting that parallel lines must have EQUAL gradients, not just similar ones",
      "For perpendicular lines, the product is -1, not +1",
    ]),
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questions = [
    { questionText: "Find the gradient of the line through (1, 3) and (4, 9).", correctAnswer: "2", explanation: "m = (9-3)/(4-1) = 6/3 = 2", difficulty: 1, points: 1 },
    { questionText: "Find the gradient of the line through (0, 5) and (2, 1).", correctAnswer: "-2", explanation: "m = (1-5)/(2-0) = -4/2 = -2", difficulty: 1, points: 1 },
    { questionText: "Find the gradient of the line through (2, 1) and (6, 3).", correctAnswer: "1/2", explanation: "m = (3-1)/(6-2) = 2/4 = 1/2", difficulty: 1, points: 1 },
    { questionText: "What is the gradient of y = 3x + 7?", correctAnswer: "3", explanation: "In y = mx + c, the gradient m = 3.", difficulty: 1, points: 1 },
    { questionText: "State the gradient of y = -2x + 1.", correctAnswer: "-2", explanation: "The coefficient of x is -2, so gradient = -2.", difficulty: 1, points: 1 },

    { questionText: "Are the lines y = 4x + 1 and y = 4x - 3 parallel?", correctAnswer: "Yes", explanation: "Both have gradient 4, so they are parallel.", difficulty: 2, points: 2 },
    { questionText: "Find the value of k so that y = kx + 5 is parallel to y = -3x + 2.", correctAnswer: "-3", explanation: "Parallel lines have equal gradients, so k = -3.", difficulty: 2, points: 2 },
    { questionText: "Are the lines y = 2x + 1 and y = -2x + 3 parallel?", correctAnswer: "No", explanation: "Gradients are 2 and -2, which are not equal.", difficulty: 2, points: 2 },
    { questionText: "Find the gradient of the line passing through (1, 4) and (3, 10).", correctAnswer: "3", explanation: "m = (10-4)/(3-1) = 6/2 = 3", difficulty: 2, points: 2 },
    { questionText: "What is the gradient of y = (1/2)x - 4?", correctAnswer: "1/2", explanation: "The coefficient of x is 1/2.", difficulty: 2, points: 2 },

    { questionText: "Find the equation of the line with gradient 2 passing through (1, 5).", correctAnswer: "y=2x+3", explanation: "5 = 2(1) + c => c = 3. Equation: y = 2x + 3.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of the line parallel to y = 3x - 1 passing through (2, 8).", correctAnswer: "y=3x+2", explanation: "Parallel gradient = 3. 8 = 3(2) + c => c = 2. y = 3x + 2.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of the line with gradient -1 through (3, 2).", correctAnswer: "y=-x+5", explanation: "2 = -1(3) + c => c = 5. y = -x + 5.", difficulty: 3, points: 3 },
    { questionText: "Which two lines are parallel? A: y = 2x + 1, B: y = 3x - 2, C: y = 2x - 5", correctAnswer: "A and C", explanation: "A and C both have gradient 2.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of the line parallel to y = -2x + 4 through (1, 3).", correctAnswer: "y=-2x+5", explanation: "m = -2. 3 = -2(1) + c => c = 5. y = -2x + 5.", difficulty: 3, points: 3 },

    { questionText: "Find the gradient of any line perpendicular to y = 2x + 1.", correctAnswer: "-1/2", explanation: "Perpendicular gradient = -1/m = -1/2.", difficulty: 4, points: 4 },
    { questionText: "A line passes through (0, 1) and (3, 7). Find the equation of the parallel line through (2, 0).", correctAnswer: "y=2x-4", explanation: "m = (7-1)/(3-0) = 2. 0 = 2(2) + c => c = -4. y = 2x - 4.", difficulty: 4, points: 4 },
    { questionText: "Find the equation of the line perpendicular to y = -x + 3 through (2, 5).", correctAnswer: "y=x+3", explanation: "Perp gradient = -1/(-1) = 1. 5 = 1(2) + c => c = 3. y = x + 3.", difficulty: 4, points: 4 },
    { questionText: "Find the gradient of a line perpendicular to y = (1/3)x + 2.", correctAnswer: "-3", explanation: "Perp gradient = -1/(1/3) = -3.", difficulty: 4, points: 4 },
    { questionText: "Line A passes through (1, 2) and (4, 8). Line B passes through (0, 1) and (3, 7). Are they parallel?", correctAnswer: "Yes", explanation: "Line A: m = (8-2)/(4-1) = 2. Line B: m = (7-1)/(3-0) = 2. Same gradient, so parallel.", difficulty: 4, points: 4 },
  ];

  const rows = questions.map(q => ({
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
  console.log(`  Inserted ${questions.length} practice questions for topic ${topicId}`);
}
