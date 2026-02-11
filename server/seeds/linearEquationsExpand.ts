import { db } from "../db";
import { quizQuestions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedLinearEquationsExpand() {
  console.log("Expanding Linear Equations question pool (topic_id=1)...");

  const TOPIC_ID = 1;
  const SUBJECT_ID = 1;

  const existing = await db
    .select({ questionText: quizQuestions.questionText })
    .from(quizQuestions)
    .where(eq(quizQuestions.topicId, TOPIC_ID));

  const existingTexts = new Set(existing.map((q) => q.questionText));

  const newQuestions: {
    topicId: number;
    subjectId: number;
    lessonId: null;
    questionText: string;
    questionType: string;
    options: null;
    correctAnswer: string;
    explanation: string;
    difficulty: number;
    points: number;
  }[] = [];

  const medium: typeof newQuestions = [
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3x + 9 = 0",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -3",
      explanation: "Subtract 9: 3x = −9. Divide by 3: x = −3.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 4x − 12 = 0",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 3",
      explanation: "Add 12: 4x = 12. Divide by 4: x = 3.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/2 + 3 = 8",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 10",
      explanation: "Subtract 3: x/2 = 5. Multiply by 2: x = 10.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/3 − 4 = 2",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 18",
      explanation: "Add 4: x/3 = 6. Multiply by 3: x = 18.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 2x + 13 = 5",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -4",
      explanation: "Subtract 13: 2x = −8. Divide by 2: x = −4.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3x − 9 = 6",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 5",
      explanation: "Add 9: 3x = 15. Divide by 3: x = 5.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 8x + 16 = 0",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -2",
      explanation: "Subtract 16: 8x = −16. Divide by 8: x = −2.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/4 + 7 = 12",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 20",
      explanation: "Subtract 7: x/4 = 5. Multiply by 4: x = 20.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 5x + 8 = 3",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -1",
      explanation: "Subtract 8: 5x = −5. Divide by 5: x = −1.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/5 + 2 = 5",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 15",
      explanation: "Subtract 2: x/5 = 3. Multiply by 5: x = 15.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 2x − 3 = 11",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 7",
      explanation: "Add 3: 2x = 14. Divide by 2: x = 7.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/6 + 5 = 8",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 18",
      explanation: "Subtract 5: x/6 = 3. Multiply by 6: x = 18.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 9x + 3 = 30",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 3",
      explanation: "Subtract 3: 9x = 27. Divide by 9: x = 3.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3x − 15 = −6",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 3",
      explanation: "Add 15: 3x = 9. Divide by 3: x = 3.",
      difficulty: 2, points: 2,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: x/2 − 7 = 1",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 16",
      explanation: "Add 7: x/2 = 8. Multiply by 2: x = 16.",
      difficulty: 2, points: 2,
    },
  ];

  const high: typeof newQuestions = [
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: −4(x − 3) = 20",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -2",
      explanation: "Expand: −4x + 12 = 20. Subtract 12: −4x = 8. Divide by −4: x = −2.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3(2x + 5) = 33",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 3",
      explanation: "Expand: 6x + 15 = 33. Subtract 15: 6x = 18. Divide by 6: x = 3.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 7x − 3 = 2x + 17",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "Subtract 2x: 5x − 3 = 17. Add 3: 5x = 20. Divide by 5: x = 4.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3x + 5 = x + 19",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 7",
      explanation: "Subtract x: 2x + 5 = 19. Subtract 5: 2x = 14. Divide by 2: x = 7.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 4(3x − 2) = 28",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 3",
      explanation: "Expand: 12x − 8 = 28. Add 8: 12x = 36. Divide by 12: x = 3.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: −2(3x + 1) = −14",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 2",
      explanation: "Expand: −6x − 2 = −14. Add 2: −6x = −12. Divide by −6: x = 2.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 9x − 4 = 5x + 12",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "Subtract 5x: 4x − 4 = 12. Add 4: 4x = 16. Divide by 4: x = 4.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 2(x + 1) − 3(x − 4) = 16",
      questionType: "short_answer", options: null,
      correctAnswer: "x = -2",
      explanation: "Expand: 2x + 2 − 3x + 12 = 16 → −x + 14 = 16. Subtract 14: −x = 2. Multiply by −1: x = −2.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: −(2x + 5) = −13",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "Expand: −2x − 5 = −13. Add 5: −2x = −8. Divide by −2: x = 4.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 4x + 3 = 2(x + 8) − 1",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 6",
      explanation: "Expand RHS: 4x + 3 = 2x + 16 − 1 → 4x + 3 = 2x + 15. Subtract 2x: 2x + 3 = 15. Subtract 3: 2x = 12. Divide by 2: x = 6.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 4(x − 5) + 2x = 10",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 5",
      explanation: "Expand: 4x − 20 + 2x = 10 → 6x − 20 = 10. Add 20: 6x = 30. Divide by 6: x = 5.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 5(x − 3) = 2(x + 3)",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 7",
      explanation: "Expand: 5x − 15 = 2x + 6. Subtract 2x: 3x − 15 = 6. Add 15: 3x = 21. Divide by 3: x = 7.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 3(x + 1) = 2(x + 4) − 3",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 2",
      explanation: "Expand: 3x + 3 = 2x + 8 − 3 → 3x + 3 = 2x + 5. Subtract 2x: x + 3 = 5. Subtract 3: x = 2.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: −3(x − 5) + x = 7",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "Expand: −3x + 15 + x = 7 → −2x + 15 = 7. Subtract 15: −2x = −8. Divide by −2: x = 4.",
      difficulty: 3, points: 3,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve: 8x − 5 = 3(2x + 1)",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "Expand RHS: 8x − 5 = 6x + 3. Subtract 6x: 2x − 5 = 3. Add 5: 2x = 8. Divide by 2: x = 4.",
      difficulty: 3, points: 3,
    },
  ];

  const challenge: typeof newQuestions = [
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "A piece of rope is cut into two parts. One part is 8 cm longer than the other. The total length is 52 cm. Find the length of the shorter piece.",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 22",
      explanation: "Let the shorter piece be x cm. The longer piece is (x + 8) cm. x + (x + 8) = 52. 2x + 8 = 52. 2x = 44. x = 22 cm.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Tickets to a school play cost $6 for adults and $4 for children. A family buys 2 adult tickets and x child tickets and pays $28 in total. How many child tickets did they buy?",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 4",
      explanation: "2 adult tickets cost 2 × $6 = $12. So 12 + 4x = 28. 4x = 16. x = 4 child tickets.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "A baker made some muffins. She sold half of them and then gave away 5. She had 15 left. How many muffins did she make?",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 40",
      explanation: "Let x = total muffins. After selling half: x/2 remain. Then gave away 5: x/2 − 5 = 15. x/2 = 20. x = 40.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve and verify: 3(x − 2) + 5 = 20",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 7",
      explanation: "Expand: 3x − 6 + 5 = 20 → 3x − 1 = 20. Add 1: 3x = 21. Divide by 3: x = 7. Check: 3(7 − 2) + 5 = 15 + 5 = 20 ✓.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Four friends each contribute equally to buy a $60 gift. They also split a $12 wrapping fee equally. How much does each person pay in total?",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 18",
      explanation: "Total cost = $60 + $12 = $72. Each person pays 72 ÷ 4 = $18. Or: 4x = 72, x = 18.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "The perimeter of an equilateral triangle is 45 cm. Each side is (2x + 1) cm long. Find x.",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 7",
      explanation: "3 equal sides: 3(2x + 1) = 45. 6x + 3 = 45. 6x = 42. x = 7.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Two angles in a triangle are equal. The third angle is 30° more than each of the equal angles. Find the size of each equal angle.",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 50",
      explanation: "Let each equal angle be x°. Third angle is (x + 30)°. Sum: x + x + (x + 30) = 180. 3x + 30 = 180. 3x = 150. x = 50°.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "A car travels at a constant speed and covers (3x + 10) km in 4 hours, averaging 25 km/h. Find x.",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 30",
      explanation: "Distance = speed × time = 25 × 4 = 100 km. So 3x + 10 = 100. 3x = 90. x = 30.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "Solve and verify: 2(x + 4) − 3 = 15",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 5",
      explanation: "Expand: 2x + 8 − 3 = 15 → 2x + 5 = 15. Subtract 5: 2x = 10. Divide by 2: x = 5. Check: 2(5 + 4) − 3 = 18 − 3 = 15 ✓.",
      difficulty: 4, points: 4,
    },
    {
      topicId: TOPIC_ID, subjectId: SUBJECT_ID, lessonId: null,
      questionText: "A library has fiction and non-fiction books. There are three times as many fiction books as non-fiction. If there are 120 books in total, how many non-fiction books are there?",
      questionType: "short_answer", options: null,
      correctAnswer: "x = 30",
      explanation: "Let non-fiction = x. Fiction = 3x. Total: x + 3x = 120. 4x = 120. x = 30 non-fiction books.",
      difficulty: 4, points: 4,
    },
  ];

  const allNew = [...medium, ...high, ...challenge];

  const toInsert = allNew.filter((q) => !existingTexts.has(q.questionText));

  if (toInsert.length === 0) {
    console.log("All questions already exist. Nothing to insert.");
  } else {
    await db.insert(quizQuestions).values(toInsert);
    console.log(`Inserted ${toInsert.length} new questions (${allNew.length - toInsert.length} skipped as duplicates).`);
  }

  const inserted = {
    medium: toInsert.filter((q) => q.difficulty === 2).length,
    high: toInsert.filter((q) => q.difficulty === 3).length,
    challenge: toInsert.filter((q) => q.difficulty === 4).length,
  };

  console.log("New questions added:", inserted);

  const counts = await db
    .select({
      difficulty: quizQuestions.difficulty,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.topicId, TOPIC_ID));

  const totals: Record<number, number> = {};
  for (const row of counts) {
    totals[row.difficulty] = (totals[row.difficulty] || 0) + 1;
  }

  console.log("Total pool sizes by difficulty:", totals);
  console.log("Grand total:", counts.length);

  return { inserted, totals, grandTotal: counts.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLinearEquationsExpand()
    .then((result) => {
      console.log("\nFinal summary:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
