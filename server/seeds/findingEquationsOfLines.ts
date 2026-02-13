import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedFindingEquationsOfLines() {
  console.log("Seeding Finding Equations of Lines content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Finding Equations of Lines";

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
    console.log("Finding Equations of Lines topic already exists (id=" + topicId + "). Checking for missing data...");

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

  const gradientTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Gradient and Parallel Lines")));
  const prerequisiteId = gradientTopic.length > 0 ? gradientTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Find the equation of a line from gradient and intercept, two points, parallel or perpendicular lines, and coordinate diagrams.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 15,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);
  const topicId = topic.id;

  const lessonData = [
    {
      title: "Equation from Gradient and Y-Intercept",
      description: "Learn to write the equation of a line when given its gradient (m) and y-intercept (c).",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand the slope-intercept form y = mx + c",
        "Identify gradient and y-intercept from given information",
        "Write the equation of a line from m and c",
      ],
    },
    {
      title: "Equation from Two Points",
      description: "Find the equation of a line by calculating the gradient from two points and solving for the y-intercept.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: [
        "Calculate gradient from two points using (y2-y1)/(x2-x1)",
        "Substitute a point into y = mx + c to find c",
        "Handle fractional gradients",
      ],
    },
    {
      title: "Parallel and Perpendicular Lines",
      description: "Use properties of parallel and perpendicular lines to find equations.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Use equal gradients for parallel lines",
        "Use the negative reciprocal for perpendicular lines",
        "Combine gradient properties with a given point to find c",
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
    { questionText: "A line has gradient 2 and y-intercept 3. Write its equation.", correctAnswer: "y=2x+3", explanation: "m = 2, c = 3, so y = 2x + 3.", difficulty: 1, points: 1 },
    { questionText: "Write the equation of a line with slope -1 and y-intercept 5.", correctAnswer: "y=-x+5", explanation: "m = -1, c = 5, so y = -x + 5.", difficulty: 1, points: 1 },
    { questionText: "A line passes through the origin with gradient 3. What is its equation?", correctAnswer: "y=3x", explanation: "Through origin means c = 0. y = 3x.", difficulty: 1, points: 1 },
    { questionText: "Write the equation of a line with gradient -2 and y-intercept -4.", correctAnswer: "y=-2x-4", explanation: "m = -2, c = -4, so y = -2x - 4.", difficulty: 1, points: 1 },
    { questionText: "A line has slope 1 and crosses the y-axis at 0. Find its equation.", correctAnswer: "y=x", explanation: "m = 1, c = 0, so y = x.", difficulty: 1, points: 1 },
    { questionText: "Find the equation of the line through (0, 2) and (3, 8).", correctAnswer: "y=2x+2", explanation: "m = (8-2)/(3-0) = 6/3 = 2. c = 2. y = 2x + 2.", difficulty: 2, points: 2 },
    { questionText: "Find the equation of the line through (1, 5) and (3, 11).", correctAnswer: "y=3x+2", explanation: "m = (11-5)/(3-1) = 6/2 = 3. Using (1,5): 5 = 3(1) + c, c = 2. y = 3x + 2.", difficulty: 2, points: 2 },
    { questionText: "A line with gradient 2 passes through (1, 7). Find its equation.", correctAnswer: "y=2x+5", explanation: "7 = 2(1) + c, c = 5. y = 2x + 5.", difficulty: 2, points: 2 },
    { questionText: "Find the equation of the line through (-1, 3) and (1, -1).", correctAnswer: "y=-2x+1", explanation: "m = (-1-3)/(1-(-1)) = -4/2 = -2. Using (1,-1): -1 = -2(1) + c, c = 1. y = -2x + 1.", difficulty: 2, points: 2 },
    { questionText: "Find the equation of a line parallel to y = 3x - 1 through (2, 4).", correctAnswer: "y=3x-2", explanation: "Parallel: m = 3. 4 = 3(2) + c, c = -2. y = 3x - 2.", difficulty: 2, points: 2 },
    { questionText: "Find the equation of the line through (2, 1) and (6, 3).", correctAnswer: "y=1/2x", explanation: "m = (3-1)/(6-2) = 2/4 = 1/2. Using (2,1): 1 = (1/2)(2) + c, c = 0. y = (1/2)x.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of the line through (0, -3) and (4, 1).", correctAnswer: "y=x-3", explanation: "m = (1-(-3))/(4-0) = 4/4 = 1. c = -3. y = x - 3.", difficulty: 3, points: 3 },
    { questionText: "A line parallel to y = -2x + 5 has y-intercept 1. Find its equation.", correctAnswer: "y=-2x+1", explanation: "Parallel: m = -2. c = 1. y = -2x + 1.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of a line parallel to y = (1/2)x + 3 through (4, 5).", correctAnswer: "y=1/2x+3", explanation: "m = 1/2. 5 = (1/2)(4) + c, c = 3. y = (1/2)x + 3.", difficulty: 3, points: 3 },
    { questionText: "A line with gradient -3 passes through (2, -1). Find its equation.", correctAnswer: "y=-3x+5", explanation: "-1 = -3(2) + c, c = 5. y = -3x + 5.", difficulty: 3, points: 3 },
    { questionText: "Find the equation of the line perpendicular to y = 2x + 1 through (4, 3).", correctAnswer: "y=-1/2x+5", explanation: "Perp gradient = -1/2. 3 = (-1/2)(4) + c, c = 5. y = (-1/2)x + 5.", difficulty: 4, points: 4 },
    { questionText: "Find the equation of the line perpendicular to y = -3x + 2 through (3, 2).", correctAnswer: "y=1/3x+1", explanation: "Perp gradient = 1/3. 2 = (1/3)(3) + c, c = 1. y = (1/3)x + 1.", difficulty: 4, points: 4 },
    { questionText: "A line crosses the x-axis at (4, 0) and the y-axis at (0, -2). Find its equation.", correctAnswer: "y=1/2x-2", explanation: "m = (-2-0)/(0-4) = -2/-4 = 1/2. c = -2. y = (1/2)x - 2.", difficulty: 4, points: 4 },
    { questionText: "Find the equation of a line through (2, 5) and (6, 5).", correctAnswer: "y=5", explanation: "Both points have y = 5, so this is a horizontal line: y = 5.", difficulty: 4, points: 4 },
    { questionText: "A line passes through (-2, 4) and is parallel to y = -x + 3. Find its equation.", correctAnswer: "y=-x+2", explanation: "Parallel: m = -1. 4 = -1(-2) + c, c = 2. y = -x + 2.", difficulty: 4, points: 4 },
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
  console.log(`  Inserted ${questions.length} quiz questions`);
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary: "Find the equation of a straight line in the form y = mx + c using gradient and intercept, two points, or parallel/perpendicular line properties.",
    notesMarkdown: `## The Equation of a Line
The standard form is **y = mx + c**, where:
- **m** is the gradient (slope)
- **c** is the y-intercept (where the line crosses the y-axis)

## Method 1: Given m and c
Simply substitute the values into y = mx + c.

## Method 2: From Two Points
1. Calculate gradient: m = (y₂ - y₁) / (x₂ - x₁)
2. Substitute m and one point into y = mx + c
3. Solve for c

## Method 3: Parallel Lines
Parallel lines have **equal gradients**. Use the given gradient and a point to find c.

## Method 4: Perpendicular Lines
If a line has gradient m, a perpendicular line has gradient **-1/m** (the negative reciprocal).

## Tips
- Always simplify fractions in your gradient
- Check your answer by substituting both points
- Answer format: y = mx + c (e.g., y = 2x - 3). Fractions allowed: y = -3/2 x + 5`,
    keyFormulas: [
      "y = mx + c (slope-intercept form)",
      "m = (y2 - y1) / (x2 - x1)",
      "Parallel lines: m1 = m2",
      "Perpendicular lines: m1 × m2 = -1",
    ],
    commonMistakes: [
      "Swapping x and y coordinates in the gradient formula",
      "Forgetting the negative sign when subtracting negative numbers",
      "Using the wrong gradient for perpendicular lines (forgetting to flip and negate)",
      "Not simplifying the gradient fraction",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}
