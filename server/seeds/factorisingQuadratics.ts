import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedFactorisingQuadratics() {
  console.log("Seeding Factorising Quadratics content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Factorising Quadratics";

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
    console.log(`${TOPIC_TITLE} topic already exists (id=${topicId}). Checking for missing data...`);

    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) await insertTopicNotes(topicId);

    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) await insertQuizQuestions(topicId, SUBJECT_ID);

    const existingLessons = await db.select().from(lessons).where(eq(lessons.topicId, topicId));
    if (existingLessons.length === 0) await insertLessons(topicId);

    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const prereqTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Factorising Common Factors")));
  const prerequisiteId = prereqTopic.length > 0 ? prereqTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Factorise monic and non-monic quadratic trinomials, difference of squares, and expressions with common factors.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 14,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);
  const topicId = topic.id;

  await insertLessons(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);
  await insertTopicNotes(topicId);

  return topicId;
}

async function insertLessons(topicId: number) {
  const lessonData = [
    {
      title: "Factorising Monic Quadratics",
      description: "Factorise quadratic trinomials of the form x² + bx + c where the leading coefficient is 1.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand factorising as the reverse of expanding",
        "Find factor pairs that multiply to c and add to b",
        "Write the factorised form (x + p)(x + q)",
      ],
    },
    {
      title: "Difference of Squares and Common Factors",
      description: "Factorise using the difference of squares identity and by extracting common factors first.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: [
        "Recognise and factorise difference of squares",
        "Extract common factors before factorising",
        "Combine GCF extraction with trinomial factorisation",
      ],
    },
    {
      title: "Non-Monic Quadratics",
      description: "Factorise quadratic trinomials where the leading coefficient is not 1, using the AC method.",
      orderIndex: 3,
      estimatedMinutes: 25,
      objectives: [
        "Apply the AC method to non-monic trinomials",
        "Split the middle term and factor by grouping",
        "Handle negative coefficients and multi-step problems",
      ],
    },
  ];

  for (const ld of lessonData) {
    const [lesson] = await db
      .insert(lessons)
      .values({ ...ld, topicId, isActive: true })
      .returning();

    const segContent = getSegmentContent(ld.orderIndex);

    const segments = [
      { lessonId: lesson.id, segmentType: "explanation" as const, title: `${ld.title} — Explanation`, content: segContent.explanation, orderIndex: 1 },
      { lessonId: lesson.id, segmentType: "example" as const, title: `${ld.title} — Worked Example`, content: segContent.example, orderIndex: 2 },
      { lessonId: lesson.id, segmentType: "practice" as const, title: `${ld.title} — Practice`, content: segContent.practice, orderIndex: 3 },
    ];
    await db.insert(lessonSegments).values(segments);
  }

  console.log(`  Created 3 lessons with segments for topic ${topicId}`);
}

function getSegmentContent(lessonOrder: number): { explanation: string; example: string; practice: string } {
  if (lessonOrder === 1) {
    return {
      explanation: `## Factorising Monic Quadratics

A **monic quadratic** has the form **x² + bx + c** (where the coefficient of x² is 1).

Factorising is the **reverse of expanding**:
- Expanding: (x + 3)(x + 2) = x² + 5x + 6
- Factorising: x² + 5x + 6 = (x + 3)(x + 2)

### The Method

To factorise x² + bx + c, find two numbers **p** and **q** such that:
- **p × q = c** (they multiply to give the constant term)
- **p + q = b** (they add to give the coefficient of x)

Then: **x² + bx + c = (x + p)(x + q)**

### Signs Guide
| b | c | Factor signs |
|---|---|-------------|
| + | + | Both positive |
| - | + | Both negative |
| + | - | One positive, one negative (larger is positive) |
| - | - | One positive, one negative (larger is negative) |`,

      example: `## Worked Examples

### Example 1: x² + 7x + 12

**Step 1:** Find two numbers that multiply to 12 and add to 7.
Factor pairs of 12: 1×12, 2×6, **3×4**
**Step 2:** 3 + 4 = 7 ✓
**Step 3:** x² + 7x + 12 = **(x + 3)(x + 4)**

### Example 2: x² - 5x + 6

**Step 1:** Find two numbers that multiply to 6 and add to -5.
Both must be negative (negative sum, positive product).
**Step 2:** (-2) × (-3) = 6 ✓ and (-2) + (-3) = -5 ✓
**Step 3:** x² - 5x + 6 = **(x - 2)(x - 3)**

### Example 3: x² + 2x - 15

**Step 1:** Find two numbers that multiply to -15 and add to 2.
One positive, one negative.
**Step 2:** 5 × (-3) = -15 ✓ and 5 + (-3) = 2 ✓
**Step 3:** x² + 2x - 15 = **(x + 5)(x - 3)**`,

      practice: `## Practice

Factorise each expression:

**Q1:** x² + 8x + 15

<details><summary>Answer</summary>(x + 3)(x + 5)</details>

**Q2:** x² - 7x + 10

<details><summary>Answer</summary>(x - 2)(x - 5)</details>

**Q3:** x² + x - 12

<details><summary>Answer</summary>(x + 4)(x - 3)</details>

**Q4:** x² - 4x - 21

<details><summary>Answer</summary>(x - 7)(x + 3)</details>`,
    };
  }

  if (lessonOrder === 2) {
    return {
      explanation: `## Difference of Squares

The **difference of squares** identity states:

**x² - a² = (x - a)(x + a)**

This works because (x - a)(x + a) = x² + ax - ax - a² = x² - a².

### Recognising Difference of Squares
Look for:
- Two terms separated by a minus sign
- Both terms are perfect squares
- Examples: x² - 9, x² - 25, 4x² - 1

### Common Factor First

Sometimes you need to **take out a common factor** before factorising:

**2x² + 10x + 12**
1. Take out GCF of 2: **2(x² + 5x + 6)**
2. Then factorise the trinomial: **2(x + 2)(x + 3)**

Always check for a common factor first!`,

      example: `## Worked Examples

### Example 1: x² - 16

**Step 1:** Recognise as x² - 4² (difference of squares)
**Step 2:** Apply identity: **(x - 4)(x + 4)**

### Example 2: x² - 49

**Step 1:** 49 = 7², so this is x² - 7²
**Step 2:** **(x - 7)(x + 7)**

### Example 3: 3x² + 12x + 9

**Step 1:** Take out GCF of 3: **3(x² + 4x + 3)**
**Step 2:** Factorise: find numbers that multiply to 3 and add to 4 → 1 and 3
**Step 3:** **3(x + 1)(x + 3)**

### Example 4: 2x² - 8

**Step 1:** Take out GCF of 2: **2(x² - 4)**
**Step 2:** Recognise difference of squares: **2(x - 2)(x + 2)**`,

      practice: `## Practice

Factorise each expression:

**Q1:** x² - 36

<details><summary>Answer</summary>(x - 6)(x + 6)</details>

**Q2:** x² - 81

<details><summary>Answer</summary>(x - 9)(x + 9)</details>

**Q3:** 2x² + 14x + 20

<details><summary>Answer</summary>2(x + 2)(x + 5)</details>

**Q4:** 5x² - 45

<details><summary>Answer</summary>5(x - 3)(x + 3)</details>`,
    };
  }

  return {
    explanation: `## Non-Monic Quadratics (AC Method)

When the leading coefficient **a ≠ 1**, we use the **AC method** (also called "splitting the middle term").

For **ax² + bx + c**:

### Steps
1. **Multiply a × c** to get the product
2. **Find two numbers** that multiply to a×c and add to b
3. **Split the middle term** using those two numbers
4. **Factor by grouping** (group into two pairs)
5. **Write the final factorised form**

### Example: 2x² + 7x + 3

1. a × c = 2 × 3 = **6**
2. Numbers: 1 and 6 (1 × 6 = 6, 1 + 6 = 7)
3. Split: 2x² + **x + 6x** + 3
4. Group: (2x² + x) + (6x + 3) = x(2x + 1) + 3(2x + 1)
5. Factor: **(2x + 1)(x + 3)**`,

    example: `## Worked Examples

### Example 1: 3x² + 10x + 3

**Step 1:** a × c = 3 × 3 = 9
**Step 2:** Numbers: 1 and 9 (1 × 9 = 9, 1 + 9 = 10)
**Step 3:** 3x² + x + 9x + 3
**Step 4:** x(3x + 1) + 3(3x + 1)
**Step 5:** **(3x + 1)(x + 3)**

### Example 2: 2x² - 5x - 3

**Step 1:** a × c = 2 × (-3) = -6
**Step 2:** Numbers: 1 and -6 (1 × (-6) = -6, 1 + (-6) = -5)
**Step 3:** 2x² + x - 6x - 3
**Step 4:** x(2x + 1) - 3(2x + 1)
**Step 5:** **(2x + 1)(x - 3)**

### Example 3: 6x² + 11x - 10

**Step 1:** a × c = 6 × (-10) = -60
**Step 2:** Numbers: 15 and -4 (15 × (-4) = -60, 15 + (-4) = 11)
**Step 3:** 6x² + 15x - 4x - 10
**Step 4:** 3x(2x + 5) - 2(2x + 5)
**Step 5:** **(2x + 5)(3x - 2)**`,

    practice: `## Practice

Factorise each expression:

**Q1:** 2x² + 5x + 2

<details><summary>Answer</summary>(2x + 1)(x + 2)</details>

**Q2:** 3x² - 7x + 2

<details><summary>Answer</summary>(3x - 1)(x - 2)</details>

**Q3:** 5x² + 13x - 6

<details><summary>Answer</summary>(5x - 2)(x + 3)</details>

**Q4:** 4x² - 4x - 3

<details><summary>Answer</summary>(2x - 3)(2x + 1)</details>`,
  };
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questions = [
    { questionText: "Factorise: x^2+5x+6", correctAnswer: "(x+2)(x+3)", explanation: "Find two numbers that multiply to 6 and add to 5: 2 and 3.", difficulty: 1, points: 1 },
    { questionText: "Factorise: x^2+7x+10", correctAnswer: "(x+2)(x+5)", explanation: "2×5=10, 2+5=7.", difficulty: 1, points: 1 },
    { questionText: "Factorise: x^2+9x+14", correctAnswer: "(x+2)(x+7)", explanation: "2×7=14, 2+7=9.", difficulty: 1, points: 1 },
    { questionText: "Factorise: x^2+3x-10", correctAnswer: "(x+5)(x-2)", explanation: "5×(-2)=-10, 5+(-2)=3.", difficulty: 1, points: 1 },
    { questionText: "Factorise: x^2-6x+8", correctAnswer: "(x-2)(x-4)", explanation: "(-2)×(-4)=8, (-2)+(-4)=-6.", difficulty: 1, points: 1 },
    { questionText: "Factorise: x^2-9", correctAnswer: "(x-3)(x+3)", explanation: "Difference of squares: x²-3²=(x-3)(x+3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: x^2-25", correctAnswer: "(x-5)(x+5)", explanation: "Difference of squares: x²-5²=(x-5)(x+5).", difficulty: 2, points: 2 },
    { questionText: "Factorise: x^2-x-12", correctAnswer: "(x-4)(x+3)", explanation: "(-4)×3=-12, (-4)+3=-1.", difficulty: 2, points: 2 },
    { questionText: "Factorise: x^2-3x-18", correctAnswer: "(x-6)(x+3)", explanation: "(-6)×3=-18, (-6)+3=-3.", difficulty: 2, points: 2 },
    { questionText: "Factorise: 2x^2+10x+12", correctAnswer: "2(x+2)(x+3)", explanation: "Take out GCF 2: 2(x²+5x+6), then factorise: 2(x+2)(x+3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: x^2+2x-35", correctAnswer: "(x+7)(x-5)", explanation: "7×(-5)=-35, 7+(-5)=2.", difficulty: 2, points: 2 },
    { questionText: "Factorise: 2x^2+7x+3", correctAnswer: "(2x+1)(x+3)", explanation: "AC method: a×c=6. Numbers 1 and 6: 1+6=7. Factor by grouping.", difficulty: 3, points: 3 },
    { questionText: "Factorise: 3x^2+10x+3", correctAnswer: "(3x+1)(x+3)", explanation: "AC method: a×c=9. Numbers 1 and 9: 1+9=10.", difficulty: 3, points: 3 },
    { questionText: "Factorise: 2x^2-5x-3", correctAnswer: "(2x+1)(x-3)", explanation: "AC method: a×c=-6. Numbers 1 and -6: 1+(-6)=-5.", difficulty: 3, points: 3 },
    { questionText: "Factorise: 3x^2-11x+6", correctAnswer: "(3x-2)(x-3)", explanation: "AC method: a×c=18. Numbers -2 and -9: -2+(-9)=-11.", difficulty: 3, points: 3 },
    { questionText: "Factorise: 5x^2+7x+2", correctAnswer: "(5x+2)(x+1)", explanation: "AC method: a×c=10. Numbers 2 and 5: 2+5=7.", difficulty: 3, points: 3 },
    { questionText: "Factorise: 4x^2-9", correctAnswer: "(2x-3)(2x+3)", explanation: "Difference of squares: (2x)²-3²=(2x-3)(2x+3).", difficulty: 4, points: 4 },
    { questionText: "Factorise: 9x^2-1", correctAnswer: "(3x-1)(3x+1)", explanation: "Difference of squares: (3x)²-1²=(3x-1)(3x+1).", difficulty: 4, points: 4 },
    { questionText: "Factorise: 6x^2+11x-10", correctAnswer: "(2x+5)(3x-2)", explanation: "AC: a×c=-60. Numbers 15,-4. Split, group, factorise.", difficulty: 4, points: 4 },
    { questionText: "Factorise: 3x^2+15x+18", correctAnswer: "3(x+2)(x+3)", explanation: "GCF=3: 3(x²+5x+6). Then factorise: 3(x+2)(x+3).", difficulty: 4, points: 4 },
  ];

  const existing = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
  const existingTexts = new Set(existing.map(q => q.questionText));
  const newQuestions = questions.filter(q => !existingTexts.has(q.questionText));
  if (newQuestions.length === 0) return;

  const rows = newQuestions.map(q => ({
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
  console.log(`  Inserted ${newQuestions.length} practice questions`);
}

async function insertTopicNotes(topicId: number) {
  await db.insert(topicNotes).values({
    topicId,
    summary: "Factorise quadratic expressions by finding factor pairs, using the difference of squares identity, and applying the AC method for non-monic trinomials.",
    notesMarkdown: `## Factorising Quadratics

### Monic Trinomials (a = 1)
For x² + bx + c, find p and q where:
- p × q = c
- p + q = b
Then: x² + bx + c = (x + p)(x + q)

### Difference of Squares
x² - a² = (x - a)(x + a)

### Non-Monic Trinomials (a ≠ 1) — AC Method
For ax² + bx + c:
1. Compute a × c
2. Find two numbers that multiply to a×c and add to b
3. Split the middle term
4. Factor by grouping

### Common Factor First
Always check for a GCF before factorising the trinomial:
- 3x² + 12x + 9 = 3(x² + 4x + 3) = 3(x + 1)(x + 3)

### Answer Format
Write your answer as: (x+p)(x+q) or k(mx+a)(nx+b)
Example: (x+3)(x-2) or 2(x+1)(x+3)`,
    keyFormulas: [
      "x² + bx + c = (x + p)(x + q) where p×q = c and p+q = b",
      "x² - a² = (x - a)(x + a)",
      "AC method: multiply a×c, find factor pair, split middle term, group",
      "Always extract GCF first before factorising",
    ],
    commonMistakes: [
      "Forgetting to check for a common factor before factorising",
      "Getting the signs wrong — check by expanding your answer",
      "Confusing difference of squares with difference of cubes",
      "In the AC method, forgetting to split the middle term correctly",
      "Not writing the final answer in fully factorised form",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}
