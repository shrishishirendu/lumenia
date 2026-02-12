import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedFactorisingCommonFactors() {
  console.log("Seeding Factorising Common Factors content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Factorising Common Factors";

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
    if (existingNotes.length === 0) {
      await insertTopicNotes(topicId);
    }

    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) {
      await insertQuizQuestions(topicId, SUBJECT_ID);
    }

    const existingLessons = await db.select().from(lessons).where(eq(lessons.topicId, topicId));
    if (existingLessons.length === 0) {
      await insertLessons(topicId);
    }

    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const expandingTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Expanding Brackets")));
  const prerequisiteId = expandingTopic.length > 0 ? expandingTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Factorise expressions by identifying and extracting common numerical, variable, and monomial factors.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 13,
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
      title: "Identifying Common Factors",
      description: "Learn to find the greatest common factor (GCF) of algebraic terms.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand what a common factor is",
        "Find the GCF of numerical coefficients",
        "Identify common variable factors",
      ],
    },
    {
      title: "Factorising with Numerical and Variable Factors",
      description: "Factorise expressions by taking out numerical factors, variable factors, and monomial factors.",
      orderIndex: 2,
      estimatedMinutes: 20,
      objectives: [
        "Factorise by extracting a numerical common factor",
        "Factorise by extracting a variable common factor",
        "Factorise by extracting a monomial common factor",
      ],
    },
    {
      title: "Advanced Factorising Techniques",
      description: "Handle negative common factors, three or more terms, and mixed variable expressions.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Factorise expressions with negative common factors",
        "Factorise expressions with three or more terms",
        "Factorise expressions with mixed variables",
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
      explanation: `## What is Factorising?

Factorising is the **reverse of expanding**. When we expand, we remove brackets; when we factorise, we **insert brackets** by finding a common factor.

### The Common Factor

A **common factor** is a number, variable, or expression that divides evenly into every term of the expression.

For example, in **6x + 9**, both 6 and 9 are divisible by **3**, so 3 is a common factor.

### Steps to Find the GCF

1. **List the factors** of each coefficient (number part)
2. **Find the highest common factor** (GCF) of the coefficients
3. **Find the lowest power** of any common variable
4. **Combine** the numerical GCF with the common variable part

### Example: Finding the GCF

For the terms **12x²** and **18x**:
- Factors of 12: 1, 2, 3, 4, 6, 12 → Factors of 18: 1, 2, 3, 6, 9, 18
- GCF of 12 and 18 = **6**
- Common variable: x appears in both terms, lowest power is x¹
- GCF = **6x**`,

      example: `## Worked Example: Identifying Common Factors

### Example 1: Find the GCF of 8x and 12x

**Step 1:** Find GCF of 8 and 12
- Factors of 8: 1, 2, 4, 8
- Factors of 12: 1, 2, 3, 4, 6, 12
- GCF = **4**

**Step 2:** Common variable part
- Both terms have x with power 1
- Common variable: **x**

**GCF = 4x**

### Example 2: Find the GCF of 6x² and 9x

**Step 1:** GCF of 6 and 9 = **3**

**Step 2:** Both have x; lowest power is x¹

**GCF = 3x**

### Example 3: Find the GCF of 15 and 25

These are just numbers (no variables):
- GCF of 15 and 25 = **5**`,

      practice: `## Practice: Identifying Common Factors

Try finding the GCF of these pairs:

**Q1:** What is the GCF of 10x and 15x?

<details><summary>Answer</summary>5x</details>

**Q2:** What is the GCF of 8y² and 12y?

<details><summary>Answer</summary>4y</details>

**Q3:** What is the GCF of 6a and 9?

<details><summary>Answer</summary>3</details>

**Q4:** What is the GCF of 14 and 21?

<details><summary>Answer</summary>7</details>`,
    };
  }

  if (lessonOrder === 2) {
    return {
      explanation: `## Factorising by Common Factor

Once you've identified the GCF, you can factorise by:
1. **Writing the GCF outside** the bracket
2. **Dividing each term** by the GCF to find what goes inside the bracket
3. **Writing the result** as: GCF × (divided terms)

### Numerical Common Factor

**6x + 9** → GCF is 3
- 6x ÷ 3 = 2x
- 9 ÷ 3 = 3
- Result: **3(2x + 3)**

### Variable Common Factor

**x² + 5x** → GCF is x
- x² ÷ x = x
- 5x ÷ x = 5
- Result: **x(x + 5)**

### Monomial Common Factor

**6x² + 9x** → GCF is 3x
- 6x² ÷ 3x = 2x
- 9x ÷ 3x = 3
- Result: **3x(2x + 3)**

### Checking Your Answer

Always **expand your answer** to verify it matches the original expression!
- 3x(2x + 3) = 3x × 2x + 3x × 3 = 6x² + 9x ✓`,

      example: `## Worked Examples

### Example 1: Factorise 8x + 12

**Step 1:** GCF of 8 and 12 = 4
**Step 2:** 8x ÷ 4 = 2x, 12 ÷ 4 = 3
**Step 3:** **4(2x + 3)**
**Check:** 4(2x + 3) = 8x + 12 ✓

### Example 2: Factorise x² + 7x

**Step 1:** GCF is x (both terms have x)
**Step 2:** x² ÷ x = x, 7x ÷ x = 7
**Step 3:** **x(x + 7)**
**Check:** x(x + 7) = x² + 7x ✓

### Example 3: Factorise 10x² + 15x

**Step 1:** GCF of 10 and 15 = 5; common variable is x → GCF = 5x
**Step 2:** 10x² ÷ 5x = 2x, 15x ÷ 5x = 3
**Step 3:** **5x(2x + 3)**
**Check:** 5x(2x + 3) = 10x² + 15x ✓`,

      practice: `## Practice: Factorising

Factorise each expression completely:

**Q1:** 4x + 8

<details><summary>Answer</summary>4(x + 2)</details>

**Q2:** 3x² + 6x

<details><summary>Answer</summary>3x(x + 2)</details>

**Q3:** 12y + 18

<details><summary>Answer</summary>6(2y + 3)</details>

**Q4:** 5a² + 10a

<details><summary>Answer</summary>5a(a + 2)</details>

**Q5:** 14x - 21

<details><summary>Answer</summary>7(2x - 3)</details>`,
    };
  }

  return {
    explanation: `## Advanced Factorising

### Negative Common Factors

When all terms are negative, factor out the **negative** GCF:

**-4x - 8** → GCF is -4
- -4x ÷ (-4) = x
- -8 ÷ (-4) = 2
- Result: **-4(x + 2)**

### Three or More Terms

The same process works with any number of terms:

**3x + 6y + 9** → GCF is 3
- 3x ÷ 3 = x, 6y ÷ 3 = 2y, 9 ÷ 3 = 3
- Result: **3(x + 2y + 3)**

### Higher Powers

When terms share higher powers of a variable:

**12x³ + 18x²** → GCF is 6x²
- 12x³ ÷ 6x² = 2x, 18x² ÷ 6x² = 3
- Result: **6x²(2x + 3)**

### Mixed Variables

**6xy + 9x** → GCF is 3x (both terms share x, not y)
- 6xy ÷ 3x = 2y, 9x ÷ 3x = 3
- Result: **3x(2y + 3)**`,

    example: `## Worked Examples

### Example 1: Factorise -6x - 15

**Step 1:** Both terms are negative; GCF is -3
**Step 2:** -6x ÷ (-3) = 2x, -15 ÷ (-3) = 5
**Step 3:** **-3(2x + 5)**

### Example 2: Factorise 4x + 8y + 12

**Step 1:** GCF of 4, 8, 12 = 4
**Step 2:** 4x ÷ 4 = x, 8y ÷ 4 = 2y, 12 ÷ 4 = 3
**Step 3:** **4(x + 2y + 3)**

### Example 3: Factorise 15x²y - 10xy + 5xy²

**Step 1:** GCF of 15, 10, 5 = 5; common variables: x and y → GCF = 5xy
**Step 2:** 15x²y ÷ 5xy = 3x, 10xy ÷ 5xy = 2, 5xy² ÷ 5xy = y
**Step 3:** **5xy(3x - 2 + y)**`,

    practice: `## Practice: Advanced Factorising

**Q1:** Factorise -8x - 12

<details><summary>Answer</summary>-4(2x + 3)</details>

**Q2:** Factorise 5x + 10y + 15

<details><summary>Answer</summary>5(x + 2y + 3)</details>

**Q3:** Factorise 18x³ + 12x²

<details><summary>Answer</summary>6x²(3x + 2)</details>

**Q4:** Factorise 8xy - 12x

<details><summary>Answer</summary>4x(2y - 3)</details>

**Q5:** Factorise -6a² - 9a - 3

<details><summary>Answer</summary>-3(2a² + 3a + 1)</details>`,
  };
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const questions = [
    { questionText: "Factorise: 6x + 9", correctAnswer: "3(2x + 3)", explanation: "GCF is 3. 6x ÷ 3 = 2x, 9 ÷ 3 = 3. So 6x + 9 = 3(2x + 3).", difficulty: 1, points: 1 },
    { questionText: "Factorise: 8a + 12a", correctAnswer: "4a(2 + 3)", explanation: "GCF is 4a. 8a ÷ 4a = 2, 12a ÷ 4a = 3. So 8a + 12a = 4a(2 + 3).", difficulty: 1, points: 1 },
    { questionText: "Factorise: 10x + 15", correctAnswer: "5(2x + 3)", explanation: "GCF is 5. 10x ÷ 5 = 2x, 15 ÷ 5 = 3. So 10x + 15 = 5(2x + 3).", difficulty: 1, points: 1 },
    { questionText: "Factorise: 4y + 8y", correctAnswer: "4y(1 + 2)", explanation: "GCF is 4y. 4y ÷ 4y = 1, 8y ÷ 4y = 2. So 4y + 8y = 4y(1 + 2).", difficulty: 1, points: 1 },
    { questionText: "Factorise: 14 + 21", correctAnswer: "7(2 + 3)", explanation: "GCF is 7. 14 ÷ 7 = 2, 21 ÷ 7 = 3. So 14 + 21 = 7(2 + 3).", difficulty: 1, points: 1 },
    { questionText: "Factorise: x² + 5x", correctAnswer: "x(x + 5)", explanation: "GCF is x. x² ÷ x = x, 5x ÷ x = 5. So x² + 5x = x(x + 5).", difficulty: 2, points: 2 },
    { questionText: "Factorise: 6x² + 9x", correctAnswer: "3x(2x + 3)", explanation: "GCF is 3x. 6x² ÷ 3x = 2x, 9x ÷ 3x = 3. So 6x² + 9x = 3x(2x + 3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: 4x - 12", correctAnswer: "4(x - 3)", explanation: "GCF is 4. 4x ÷ 4 = x, 12 ÷ 4 = 3. So 4x - 12 = 4(x - 3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: 8y² + 12y", correctAnswer: "4y(2y + 3)", explanation: "GCF is 4y. 8y² ÷ 4y = 2y, 12y ÷ 4y = 3. So 8y² + 12y = 4y(2y + 3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: -6x - 9", correctAnswer: "-3(2x + 3)", explanation: "GCF is -3. -6x ÷ (-3) = 2x, -9 ÷ (-3) = 3. So -6x - 9 = -3(2x + 3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: 10x² - 15x", correctAnswer: "5x(2x - 3)", explanation: "GCF is 5x. 10x² ÷ 5x = 2x, 15x ÷ 5x = 3. So 10x² - 15x = 5x(2x - 3).", difficulty: 2, points: 2 },
    { questionText: "Factorise: 3x + 6y + 9", correctAnswer: "3(x + 2y + 3)", explanation: "GCF is 3. 3x ÷ 3 = x, 6y ÷ 3 = 2y, 9 ÷ 3 = 3. So 3x + 6y + 9 = 3(x + 2y + 3).", difficulty: 3, points: 3 },
    { questionText: "Factorise: 12x³ + 18x²", correctAnswer: "6x²(2x + 3)", explanation: "GCF is 6x². 12x³ ÷ 6x² = 2x, 18x² ÷ 6x² = 3. So 12x³ + 18x² = 6x²(2x + 3).", difficulty: 3, points: 3 },
    { questionText: "Factorise: 6xy + 9x", correctAnswer: "3x(2y + 3)", explanation: "GCF is 3x. 6xy ÷ 3x = 2y, 9x ÷ 3x = 3. So 6xy + 9x = 3x(2y + 3).", difficulty: 3, points: 3 },
    { questionText: "Factorise: -4x² - 8x", correctAnswer: "-4x(x + 2)", explanation: "GCF is -4x. -4x² ÷ (-4x) = x, -8x ÷ (-4x) = 2. So -4x² - 8x = -4x(x + 2).", difficulty: 3, points: 3 },
    { questionText: "Factorise: 8xy - 12xz", correctAnswer: "4x(2y - 3z)", explanation: "GCF is 4x. 8xy ÷ 4x = 2y, 12xz ÷ 4x = 3z. So 8xy - 12xz = 4x(2y - 3z).", difficulty: 3, points: 3 },
    { questionText: "Factorise: 15x²y - 10xy + 5xy²", correctAnswer: "5xy(3x - 2 + y)", explanation: "GCF is 5xy. 15x²y ÷ 5xy = 3x, 10xy ÷ 5xy = 2, 5xy² ÷ 5xy = y. So = 5xy(3x - 2 + y).", difficulty: 4, points: 4 },
    { questionText: "Factorise: 6x³ + 12x² - 18x", correctAnswer: "6x(x² + 2x - 3)", explanation: "GCF is 6x. 6x³ ÷ 6x = x², 12x² ÷ 6x = 2x, 18x ÷ 6x = 3. So = 6x(x² + 2x - 3).", difficulty: 4, points: 4 },
    { questionText: "Factorise: -9a² - 6a - 3", correctAnswer: "-3(3a² + 2a + 1)", explanation: "GCF is -3. -9a² ÷ (-3) = 3a², -6a ÷ (-3) = 2a, -3 ÷ (-3) = 1. So = -3(3a² + 2a + 1).", difficulty: 4, points: 4 },
    { questionText: "Factorise: 8x²y² + 12xy² - 4xy", correctAnswer: "4xy(2xy + 3y - 1)", explanation: "GCF is 4xy. 8x²y² ÷ 4xy = 2xy, 12xy² ÷ 4xy = 3y, 4xy ÷ 4xy = 1. So = 4xy(2xy + 3y - 1).", difficulty: 4, points: 4 },
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
    summary: "Factorising by common factor is the reverse of expanding — identify the greatest common factor (GCF) and write it outside the bracket.",
    notesMarkdown: `## Core Idea
Factorising is the **reverse** of expanding brackets. The goal is to find the **greatest common factor (GCF)** shared by all terms and write the expression as a product.

## Steps to Factorise
1. **Find the GCF** of all the terms (both numbers and variables)
2. **Divide each term** by the GCF
3. **Write** GCF × (divided terms in brackets)
4. **Check** by expanding back to verify

## Types of Common Factors
- **Numerical factor**: 6x + 9 = **3**(2x + 3)
- **Variable factor**: x² + 5x = **x**(x + 5)
- **Monomial factor**: 6x² + 9x = **3x**(2x + 3)
- **Negative factor**: -4x - 8 = **-4**(x + 2)

## Answer Format
Write your answer as: factor(bracket contents)
- Example: 3(2x + 3) or x(x + 5) or 3x(2x + 3)

## Checking Your Work
Always expand your factorised form to check it equals the original:
- 3x(2x + 3) = 3x × 2x + 3x × 3 = 6x² + 9x ✓`,
    keyFormulas: [
      "GCF × (each term ÷ GCF) = original expression",
      "Always check by expanding back",
      "When all terms are negative, factor out the negative GCF",
      "Look for the lowest power of common variables",
    ],
    commonMistakes: [
      "Not factorising completely — always extract the GREATEST common factor",
      "Forgetting to include the variable part in the GCF (e.g., taking out 3 instead of 3x)",
      "Sign errors when factorising with negative terms",
      "Forgetting that a term divided by itself gives 1, not 0",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}
