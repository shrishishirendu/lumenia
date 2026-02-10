import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedLinearEquations() {
  console.log("Seeding Linear Equations content for Year 9 Mathematics...");

  const SUBJECT_ID = 1; // Mathematics
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Linear Equations";

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
    console.log("Linear Equations topic already exists (id=" + existing[0].id + "). Skipping seed.");
    return existing[0].id;
  }

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Solve one-step, two-step, and bracket linear equations. Translate word problems into equations and check solutions.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 3,
      prerequisiteTopicId: null,
      isActive: true,
    })
    .returning();

  console.log("Created topic:", topic.id, topic.title);

  const lessonData = [
    {
      title: "One-Step Linear Equations",
      description: "Learn to solve equations by undoing a single operation.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand what a linear equation is",
        "Solve one-step equations using inverse operations",
        "Check solutions by substitution",
      ],
    },
    {
      title: "Two-Step Linear Equations",
      description: "Solve equations that need two inverse operations.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Undo addition/subtraction first, then multiplication/division",
        "Solve two-step equations fluently",
        "Verify answers by substituting back",
      ],
    },
    {
      title: "Equations with Brackets",
      description: "Expand brackets using the distributive law before solving.",
      orderIndex: 3,
      estimatedMinutes: 15,
      objectives: [
        "Expand brackets using the distributive law",
        "Solve equations after expanding",
        "Handle negative coefficients",
      ],
    },
    {
      title: "Word Problems → Equations",
      description: "Translate real-world word problems into linear equations and solve.",
      orderIndex: 4,
      estimatedMinutes: 15,
      objectives: [
        "Translate word problems into algebraic equations",
        "Solve the resulting equation",
        "Interpret and check the solution in context",
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

  const segmentData: {
    lessonIndex: number;
    segments: { title: string; type: string; content: string; whiteboardContent: string | null; tutorScript: string; orderIndex: number }[];
  }[] = [
    {
      lessonIndex: 0,
      segments: [
        {
          title: "What is a Linear Equation?",
          type: "explanation",
          content:
            "A linear equation is an equation where the variable has power 1. To solve, isolate the variable by undoing operations. Whatever you do to one side, do to the other.",
          whiteboardContent: null,
          tutorScript:
            "Let's start with the basics. A linear equation has a variable raised to the first power. Our goal is always to get the variable alone on one side.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples",
          type: "example",
          content: "Example 1: x + 5 = 12\nSubtract 5 from both sides → x = 7\n\nExample 2: 3x = 18\nDivide both sides by 3 → x = 6",
          whiteboardContent: JSON.stringify({
            steps: [
              { label: "Example 1", work: "x + 5 = 12 → x + 5 - 5 = 12 - 5 → x = 7" },
              { label: "Example 2", work: "3x = 18 → 3x ÷ 3 = 18 ÷ 3 → x = 6" },
            ],
          }),
          tutorScript:
            "Watch how I undo the operation. In the first example I subtract 5 because addition is undone by subtraction. In the second I divide by 3 because multiplication is undone by division.",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Try these on your own:\n1) x − 4 = 9\n2) 5x = 25\n3) x ÷ 3 = 6\n\nHint: Think about what operation is being done to x, then do the opposite.",
          whiteboardContent: null,
          tutorScript:
            "Now it's your turn! Remember: identify the operation, then undo it. What operation do you see in the first equation?",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 1,
      segments: [
        {
          title: "Two Moves to Solve",
          type: "explanation",
          content:
            "Two-step equations need two moves. Undo addition/subtraction first, then undo multiplication/division.",
          whiteboardContent: null,
          tutorScript:
            "Now we level up. Some equations need two steps. The trick? Deal with addition or subtraction first, then multiplication or division.",
          orderIndex: 1,
        },
        {
          title: "Worked Examples",
          type: "example",
          content:
            "Example 1: 2x + 3 = 11\nStep 1: Subtract 3 → 2x = 8\nStep 2: Divide by 2 → x = 4\n\nExample 2: 5x − 7 = 18\nStep 1: Add 7 → 5x = 25\nStep 2: Divide by 5 → x = 5",
          whiteboardContent: JSON.stringify({
            steps: [
              { label: "Example 1", work: "2x + 3 = 11 → 2x = 8 → x = 4" },
              { label: "Example 2", work: "5x − 7 = 18 → 5x = 25 → x = 5" },
            ],
          }),
          tutorScript:
            "Notice the order: first undo the +3 or −7, then undo the multiplication. Always reverse the order of operations.",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Try these:\n1) 3x + 4 = 19\n2) 6x − 8 = 16\n3) 2x + 9 = 21\n\nHint: Undo addition/subtraction first, then multiplication.",
          whiteboardContent: null,
          tutorScript:
            "Your turn! Start by removing the constant term, then isolate x. What do you get for the first one?",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 2,
      segments: [
        {
          title: "Expanding Brackets First",
          type: "explanation",
          content:
            "If brackets are present, expand first using the distributive law, then solve normally.",
          whiteboardContent: null,
          tutorScript:
            "When you see brackets, the first step is always to expand them. Multiply every term inside by the number outside.",
          orderIndex: 1,
        },
        {
          title: "Worked Example",
          type: "example",
          content:
            "3(x + 2) = 18\nStep 1: Expand → 3x + 6 = 18\nStep 2: Subtract 6 → 3x = 12\nStep 3: Divide by 3 → x = 4",
          whiteboardContent: JSON.stringify({
            steps: [
              { label: "Expand", work: "3(x + 2) = 18 → 3x + 6 = 18" },
              { label: "Solve", work: "3x + 6 = 18 → 3x = 12 → x = 4" },
            ],
          }),
          tutorScript:
            "See how we expand first? 3 times x gives 3x, and 3 times 2 gives 6. Then it becomes a normal two-step equation.",
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Try these:\n1) 2(x + 5) = 16\n2) 4(x − 1) = 12\n3) −3(x + 2) = 6\n\nHint: Expand the brackets first, then solve step by step.",
          whiteboardContent: null,
          tutorScript:
            "Be careful with the third one — the negative sign changes things! What happens when you multiply −3 by (x + 2)?",
          orderIndex: 3,
        },
      ],
    },
    {
      lessonIndex: 3,
      segments: [
        {
          title: "From Words to Equations",
          type: "explanation",
          content:
            'Word problems describe operations on an unknown. Let the unknown be x, write an equation, solve, then check.',
          whiteboardContent: null,
          tutorScript:
            "Word problems can seem tricky, but there's a pattern: read the problem, pick a variable, write the equation, solve, and check your answer makes sense.",
          orderIndex: 1,
        },
        {
          title: "Worked Example",
          type: "example",
          content:
            '"A number increased by 7 equals 19."\nLet the number be x.\nx + 7 = 19\nx = 19 − 7\nx = 12\nCheck: 12 + 7 = 19 ✓',
          whiteboardContent: JSON.stringify({
            steps: [
              { label: "Translate", work: '"increased by 7" → + 7; "equals 19" → = 19' },
              { label: "Equation", work: "x + 7 = 19" },
              { label: "Solve", work: "x = 12" },
            ],
          }),
          tutorScript:
            'Look for key words: "increased by" means addition, "decreased by" means subtraction, "multiplied by" means multiplication.',
          orderIndex: 2,
        },
        {
          title: "Guided Practice",
          type: "practice",
          content:
            "Translate and solve:\n1) A number multiplied by 4 equals 28\n2) A number minus 5 equals 13\n3) Twice a number plus 6 equals 20\n\nHint: Let the unknown be x and write the equation first.",
          whiteboardContent: null,
          tutorScript:
            "Start by identifying the operation. What does 'multiplied by 4' tell you? Write it as an equation, then solve.",
          orderIndex: 3,
        },
      ],
    },
  ];

  const allSegments: {
    lessonId: number;
    title: string;
    type: string;
    content: string;
    whiteboardContent: string | null;
    tutorScript: string;
    orderIndex: number;
  }[] = [];

  for (const sd of segmentData) {
    const lesson = createdLessons[sd.lessonIndex];
    for (const seg of sd.segments) {
      allSegments.push({ lessonId: lesson.id, ...seg });
    }
  }

  await db.insert(lessonSegments).values(allSegments);
  console.log("Created", allSegments.length, "lesson segments");

  const quizData: {
    lessonIndex: number | null;
    questions: {
      questionText: string;
      questionType: string;
      options: string[] | null;
      correctAnswer: string;
      explanation: string;
      difficulty: number;
      points: number;
    }[];
  }[] = [
    {
      lessonIndex: 0,
      questions: [
        { questionText: "Solve: x + 3 = 10", questionType: "short_answer", options: null, correctAnswer: "7", explanation: "Subtract 3 from both sides: x = 10 − 3 = 7.", difficulty: 1, points: 1 },
        { questionText: "Solve: 7x = 35", questionType: "short_answer", options: null, correctAnswer: "5", explanation: "Divide both sides by 7: x = 35 ÷ 7 = 5.", difficulty: 1, points: 1 },
        { questionText: "Solve: x − 8 = 2", questionType: "short_answer", options: null, correctAnswer: "10", explanation: "Add 8 to both sides: x = 2 + 8 = 10.", difficulty: 1, points: 1 },
      ],
    },
    {
      lessonIndex: 1,
      questions: [
        { questionText: "Solve: 2x + 5 = 15", questionType: "short_answer", options: null, correctAnswer: "5", explanation: "Subtract 5: 2x = 10. Divide by 2: x = 5.", difficulty: 2, points: 2 },
        { questionText: "Solve: 4x − 6 = 10", questionType: "short_answer", options: null, correctAnswer: "4", explanation: "Add 6: 4x = 16. Divide by 4: x = 4.", difficulty: 2, points: 2 },
      ],
    },
    {
      lessonIndex: 2,
      questions: [
        { questionText: "Solve: 3(x + 4) = 21", questionType: "short_answer", options: null, correctAnswer: "3", explanation: "Expand: 3x + 12 = 21. Subtract 12: 3x = 9. Divide by 3: x = 3.", difficulty: 3, points: 2 },
        { questionText: "Solve: 5(x − 2) = 15", questionType: "short_answer", options: null, correctAnswer: "5", explanation: "Expand: 5x − 10 = 15. Add 10: 5x = 25. Divide by 5: x = 5.", difficulty: 3, points: 2 },
      ],
    },
    {
      lessonIndex: 3,
      questions: [
        { questionText: "Solve: 2(x − 3) + 4 = 14", questionType: "short_answer", options: null, correctAnswer: "8", explanation: "Expand: 2x − 6 + 4 = 14 → 2x − 2 = 14. Add 2: 2x = 16. Divide by 2: x = 8.", difficulty: 4, points: 3 },
        { questionText: "Solve: −3(x + 1) = 9", questionType: "short_answer", options: null, correctAnswer: "-4", explanation: "Expand: −3x − 3 = 9. Add 3: −3x = 12. Divide by −3: x = −4.", difficulty: 4, points: 3 },
        { questionText: "Three more than twice a number is 17. Find the number.", questionType: "short_answer", options: null, correctAnswer: "7", explanation: "Let x be the number. 2x + 3 = 17. Subtract 3: 2x = 14. Divide by 2: x = 7.", difficulty: 4, points: 3 },
      ],
    },
    {
      lessonIndex: null,
      questions: [
        { questionText: "Solve: 5x + 10 = 35", questionType: "short_answer", options: null, correctAnswer: "5", explanation: "Subtract 10: 5x = 25. Divide by 5: x = 5.", difficulty: 3, points: 2 },
        { questionText: "Solve: 3(x − 2) = 9", questionType: "short_answer", options: null, correctAnswer: "5", explanation: "Expand: 3x − 6 = 9. Add 6: 3x = 15. Divide by 3: x = 5.", difficulty: 3, points: 2 },
        { questionText: "Solve: x ÷ 4 = 7", questionType: "short_answer", options: null, correctAnswer: "28", explanation: "Multiply both sides by 4: x = 28.", difficulty: 2, points: 2 },
        { questionText: "A number decreased by 6 equals 11. Find the number.", questionType: "short_answer", options: null, correctAnswer: "17", explanation: "Let x be the number. x − 6 = 11. Add 6: x = 17.", difficulty: 3, points: 2 },
      ],
    },
  ];

  const allQuestions: {
    lessonId: number | null;
    topicId: number;
    subjectId: number;
    questionText: string;
    questionType: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    points: number;
  }[] = [];

  for (const qd of quizData) {
    const lessonId = qd.lessonIndex !== null ? createdLessons[qd.lessonIndex].id : null;
    for (const q of qd.questions) {
      allQuestions.push({
        lessonId,
        topicId: topic.id,
        subjectId: SUBJECT_ID,
        ...q,
      });
    }
  }

  await db.insert(quizQuestions).values(allQuestions);
  console.log("Created", allQuestions.length, "quiz questions");

  console.log("Seed complete! Topic ID:", topic.id);
  return topic.id;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLinearEquations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
