import { db } from "../db";
import { quizQuestions } from "../../shared/schema";

const questions = [
  // ===== LEVEL 1: One-step equations (10 questions) =====
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

  // ===== LEVEL 2: Two-step equations (15 questions) =====
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
  { questionText: "Solve: 6x − 18 = 12", correctAnswer: "x = 5", explanation: "Add 18: 6x = 30. Divide by 6: x = 5.", difficulty: 2, points: 2 },
  { questionText: "Solve: 7x + 2 = 51", correctAnswer: "x = 7", explanation: "Subtract 2: 7x = 49. Divide by 7: x = 7.", difficulty: 2, points: 2 },

  // ===== LEVEL 3: Brackets & negatives (15 questions) =====
  { questionText: "Solve: 2(x + 5) = 18", correctAnswer: "x = 4", explanation: "Expand: 2x + 10 = 18. Subtract 10: 2x = 8. Divide by 2: x = 4.", difficulty: 3, points: 3 },
  { questionText: "Solve: 3(x − 4) = 15", correctAnswer: "x = 9", explanation: "Expand: 3x − 12 = 15. Add 12: 3x = 27. Divide by 3: x = 9.", difficulty: 3, points: 3 },
  { questionText: "Solve: 4(x + 3) = 28", correctAnswer: "x = 4", explanation: "Expand: 4x + 12 = 28. Subtract 12: 4x = 16. Divide by 4: x = 4.", difficulty: 3, points: 3 },
  { questionText: "Solve: −2(x + 6) = −20", correctAnswer: "x = 4", explanation: "Expand: −2x − 12 = −20. Add 12: −2x = −8. Divide by −2: x = 4.", difficulty: 3, points: 3 },
  { questionText: "Solve: 5(x − 1) = 30", correctAnswer: "x = 7", explanation: "Expand: 5x − 5 = 30. Add 5: 5x = 35. Divide by 5: x = 7.", difficulty: 3, points: 3 },
  { questionText: "Solve: −3(x − 2) = 12", correctAnswer: "x = −2", explanation: "Expand: −3x + 6 = 12. Subtract 6: −3x = 6. Divide by −3: x = −2.", difficulty: 3, points: 3 },
  { questionText: "Solve: 2(3x + 1) = 20", correctAnswer: "x = 3", explanation: "Expand: 6x + 2 = 20. Subtract 2: 6x = 18. Divide by 6: x = 3.", difficulty: 3, points: 3 },
  { questionText: "Solve: −4(x + 2) = −24", correctAnswer: "x = 4", explanation: "Expand: −4x − 8 = −24. Add 8: −4x = −16. Divide by −4: x = 4.", difficulty: 3, points: 3 },
  { questionText: "Solve: 3(2x − 5) = 9", correctAnswer: "x = 4", explanation: "Expand: 6x − 15 = 9. Add 15: 6x = 24. Divide by 6: x = 4.", difficulty: 3, points: 3 },
  { questionText: "Solve: −5(x − 3) = −10", correctAnswer: "x = 5", explanation: "Expand: −5x + 15 = −10. Subtract 15: −5x = −25. Divide by −5: x = 5.", difficulty: 3, points: 3 },
  { questionText: "Solve: 7(x + 1) − 3 = 25", correctAnswer: "x = 3", explanation: "Expand: 7x + 7 − 3 = 25. Simplify: 7x + 4 = 25. Subtract 4: 7x = 21. Divide by 7: x = 3.", difficulty: 3, points: 3 },
  { questionText: "Solve: 2(x − 8) + 6 = 0", correctAnswer: "x = 5", explanation: "Expand: 2x − 16 + 6 = 0. Simplify: 2x − 10 = 0. Add 10: 2x = 10. Divide by 2: x = 5.", difficulty: 3, points: 3 },
  { questionText: "Solve: −2(x + 4) + 3 = −9", correctAnswer: "x = 2", explanation: "Expand: −2x − 8 + 3 = −9. Simplify: −2x − 5 = −9. Add 5: −2x = −4. Divide by −2: x = 2.", difficulty: 3, points: 3 },
  { questionText: "Solve: 4(x − 1) + 2(x + 3) = 20", correctAnswer: "x = 3", explanation: "Expand: 4x − 4 + 2x + 6 = 20. Combine: 6x + 2 = 20. Subtract 2: 6x = 18. Divide by 6: x = 3.", difficulty: 3, points: 3 },
  { questionText: "Solve: 3(x + 2) − 2(x − 1) = 11", correctAnswer: "x = 3", explanation: "Expand: 3x + 6 − 2x + 2 = 11. Combine: x + 8 = 11. Subtract 8: x = 3.", difficulty: 3, points: 3 },

  // ===== LEVEL 4: Word problems (10 questions) =====
  { questionText: "A number is multiplied by 5 and then 8 is added. The result is 43. Find the number.", correctAnswer: "x = 7", explanation: "Set up: 5x + 8 = 43. Subtract 8: 5x = 35. Divide by 5: x = 7.", difficulty: 4, points: 4 },
  { questionText: "Sam has some stickers. He gives away 12 and has 23 left. How many stickers did he start with?", correctAnswer: "x = 35", explanation: "Set up: x − 12 = 23. Add 12: x = 35.", difficulty: 4, points: 4 },
  { questionText: "A rectangle has a width of x cm and a length of (x + 6) cm. Its perimeter is 44 cm. Find x.", correctAnswer: "x = 8", explanation: "Perimeter: 2(x + x + 6) = 44. Simplify: 2(2x + 6) = 44 → 4x + 12 = 44. Subtract 12: 4x = 32. Divide by 4: x = 8.", difficulty: 4, points: 4 },
  { questionText: "Maya is 3 years older than twice her brother's age. Maya is 17. How old is her brother?", correctAnswer: "x = 7", explanation: "Set up: 2x + 3 = 17. Subtract 3: 2x = 14. Divide by 2: x = 7.", difficulty: 4, points: 4 },
  { questionText: "A taxi charges $3 flag-fall plus $2 per kilometre. The total fare is $19. How many kilometres was the trip?", correctAnswer: "x = 8", explanation: "Set up: 2x + 3 = 19. Subtract 3: 2x = 16. Divide by 2: x = 8.", difficulty: 4, points: 4 },
  { questionText: "Three consecutive numbers add up to 54. Find the smallest number.", correctAnswer: "x = 17", explanation: "Set up: x + (x + 1) + (x + 2) = 54. Simplify: 3x + 3 = 54. Subtract 3: 3x = 51. Divide by 3: x = 17.", difficulty: 4, points: 4 },
  { questionText: "A school buys x identical textbooks. Each costs $14, and shipping is $20. The total bill is $216. How many textbooks were bought?", correctAnswer: "x = 14", explanation: "Set up: 14x + 20 = 216. Subtract 20: 14x = 196. Divide by 14: x = 14.", difficulty: 4, points: 4 },
  { questionText: "After doubling a number and subtracting 9, the result is 21. Find the number.", correctAnswer: "x = 15", explanation: "Set up: 2x − 9 = 21. Add 9: 2x = 30. Divide by 2: x = 15.", difficulty: 4, points: 4 },
  { questionText: "Emma scored x marks on a test. Tom scored 4 marks more than Emma. Together they scored 58. Find Emma's score.", correctAnswer: "x = 27", explanation: "Set up: x + (x + 4) = 58. Simplify: 2x + 4 = 58. Subtract 4: 2x = 54. Divide by 2: x = 27.", difficulty: 4, points: 4 },
  { questionText: "A pool fills at 5 litres per minute. After x minutes and an initial 20 litres already in it, the pool holds 120 litres. Find x.", correctAnswer: "x = 20", explanation: "Set up: 5x + 20 = 120. Subtract 20: 5x = 100. Divide by 5: x = 20.", difficulty: 4, points: 4 },

  // ===== LEVEL 5: Mixed challenge (10 questions) =====
  { questionText: "Solve: 3(2x − 1) = 4(x + 2) − 1", correctAnswer: "x = 5", explanation: "Expand: 6x − 3 = 4x + 8 − 1 → 6x − 3 = 4x + 7. Subtract 4x: 2x − 3 = 7. Add 3: 2x = 10. Divide by 2: x = 5.", difficulty: 5, points: 5 },
  { questionText: "Solve: 5(x − 2) − 3(x + 1) = 7", correctAnswer: "x = 10", explanation: "Expand: 5x − 10 − 3x − 3 = 7. Combine: 2x − 13 = 7. Add 13: 2x = 20. Divide by 2: x = 10.", difficulty: 5, points: 5 },
  { questionText: "Two sides of a triangle are (2x + 1) cm and (3x − 4) cm. The third side is 10 cm, and the perimeter is 37 cm. Find x.", correctAnswer: "x = 6", explanation: "Set up: (2x + 1) + (3x − 4) + 10 = 37. Combine: 5x + 7 = 37. Subtract 7: 5x = 30. Divide by 5: x = 6.", difficulty: 5, points: 5 },
  { questionText: "Solve: (x + 3)/2 = 7", correctAnswer: "x = 11", explanation: "Multiply both sides by 2: x + 3 = 14. Subtract 3: x = 11.", difficulty: 5, points: 5 },
  { questionText: "Solve: (2x − 5)/3 = 3", correctAnswer: "x = 7", explanation: "Multiply both sides by 3: 2x − 5 = 9. Add 5: 2x = 14. Divide by 2: x = 7.", difficulty: 5, points: 5 },
  { questionText: "Solve: 4(x + 3) = 2(3x − 1)", correctAnswer: "x = 7", explanation: "Expand: 4x + 12 = 6x − 2. Subtract 4x: 12 = 2x − 2. Add 2: 14 = 2x. Divide by 2: x = 7.", difficulty: 5, points: 5 },
  { questionText: "A number is tripled, then 6 is subtracted, and the result is divided by 3 to give 5. Find the number.", correctAnswer: "x = 7", explanation: "Set up: (3x − 6)/3 = 5. Multiply by 3: 3x − 6 = 15. Add 6: 3x = 21. Divide by 3: x = 7.", difficulty: 5, points: 5 },
  { questionText: "Solve: 2(x + 4) − 3(2x − 1) = −5", correctAnswer: "x = 4", explanation: "Expand: 2x + 8 − 6x + 3 = −5. Combine: −4x + 11 = −5. Subtract 11: −4x = −16. Divide by −4: x = 4.", difficulty: 5, points: 5 },
  { questionText: "The sum of four consecutive even numbers is 84. Find the smallest.", correctAnswer: "x = 18", explanation: "Set up: x + (x + 2) + (x + 4) + (x + 6) = 84. Combine: 4x + 12 = 84. Subtract 12: 4x = 72. Divide by 4: x = 18.", difficulty: 5, points: 5 },
  { questionText: "Solve: 3(x + 2) − (2x − 5) = 14", correctAnswer: "x = 3", explanation: "Expand: 3x + 6 − 2x + 5 = 14. Combine: x + 11 = 14. Subtract 11: x = 3.", difficulty: 5, points: 5 },
];

async function seed() {
  console.log("Seeding 60 practice questions for Linear Equations (topicId=1)...");

  const existing = await db.select().from(quizQuestions);
  const existingTexts = new Set(existing.map(q => q.questionText));

  const newQuestions = questions.filter(q => !existingTexts.has(q.questionText));
  console.log(`Found ${newQuestions.length} new questions (${questions.length - newQuestions.length} already exist)`);

  if (newQuestions.length === 0) {
    console.log("No new questions to insert.");
    return;
  }

  const rows = newQuestions.map(q => ({
    topicId: 1,
    subjectId: 1,
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
  console.log(`Inserted ${newQuestions.length} questions.`);

  const counts: Record<number, number> = {};
  for (const q of newQuestions) {
    counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
  }
  console.log("Distribution:", counts);
}

seed()
  .then(() => { console.log("Done."); process.exit(0); })
  .catch(err => { console.error("Seed error:", err); process.exit(1); });
