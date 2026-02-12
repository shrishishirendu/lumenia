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

    const segmentContent = getSegmentContent(ld.title);
    const segments = [
      { lessonId: lesson.id, segmentType: "explanation" as const, title: `${ld.title} — Explanation`, content: segmentContent.explanation, orderIndex: 1 },
      { lessonId: lesson.id, segmentType: "example" as const, title: `${ld.title} — Worked Example`, content: segmentContent.example, orderIndex: 2 },
      { lessonId: lesson.id, segmentType: "practice" as const, title: `${ld.title} — Practice`, content: segmentContent.practice, orderIndex: 3 },
    ];
    await db.insert(lessonSegments).values(segments);
  }

  console.log(`  Created 3 lessons with segments for topic ${topicId}`);

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  return topicId;
}

function getSegmentContent(lessonTitle: string): { explanation: string; example: string; practice: string } {
  if (lessonTitle === "Understanding Gradient") {
    return {
      explanation: `## What is Gradient?

The **gradient** (also called **slope**) tells you how steep a line is and which direction it goes.

Think of it like walking along a hill:
- A **steep hill** has a large gradient
- A **flat road** has a gradient of zero
- Going **downhill** gives a negative gradient

### The Gradient Formula

To find the gradient of a line through two points **(x₁, y₁)** and **(x₂, y₂)**:

**m = (y₂ − y₁) / (x₂ − x₁)**

This is often described as **"rise over run"**:
- **Rise** = how far up or down (change in y)
- **Run** = how far across (change in x)

### Reading Gradient from an Equation

If a line is written in the form **y = mx + c**:
- **m** is the gradient (the number multiplied by x)
- **c** is the y-intercept (where the line crosses the y-axis)

For example:
- y = 3x + 2 → gradient = **3**
- y = −½x + 4 → gradient = **−½**
- y = 5 → gradient = **0** (horizontal line)

### Positive vs Negative Gradient

| Gradient | Line Direction | Example |
|----------|---------------|---------|
| Positive (m > 0) | Slopes upward (left to right) | y = 2x + 1 |
| Negative (m < 0) | Slopes downward (left to right) | y = −3x + 5 |
| Zero (m = 0) | Horizontal (flat) | y = 4 |
| Undefined | Vertical line | x = 2 |`,
      example: `## Worked Example 1: Gradient from Two Points

**Find the gradient of the line through (2, 3) and (5, 9).**

**Step 1:** Label the points.
- (x₁, y₁) = (2, 3) and (x₂, y₂) = (5, 9)

**Step 2:** Substitute into the formula.
- m = (y₂ − y₁) / (x₂ − x₁)
- m = (9 − 3) / (5 − 2)
- m = 6 / 3
- **m = 2**

The gradient is **2**, meaning the line rises 2 units for every 1 unit across.

---

## Worked Example 2: Gradient from an Equation

**What is the gradient of y = −4x + 7?**

Since the equation is already in the form y = mx + c:
- The gradient **m = −4**
- (The y-intercept is 7, but we only need the gradient)

---

## Worked Example 3: Negative Coordinates

**Find the gradient through (−1, 4) and (3, −2).**

- m = (−2 − 4) / (3 − (−1))
- m = (−6) / (3 + 1)
- m = −6 / 4
- **m = −3/2**

⚠️ **Watch the signs!** Subtracting a negative becomes addition: 3 − (−1) = 3 + 1 = 4.`,
      practice: `## Practice: Finding Gradients

Try these problems. Use the gradient formula m = (y₂ − y₁) / (x₂ − x₁).

### Question 1
Find the gradient of the line through **(1, 2)** and **(4, 11)**.

<details>
<summary>Answer</summary>
m = (11 − 2) / (4 − 1) = 9/3 = **3**
</details>

### Question 2
Find the gradient of the line through **(0, 5)** and **(3, −1)**.

<details>
<summary>Answer</summary>
m = (−1 − 5) / (3 − 0) = −6/3 = **−2**
</details>

### Question 3
State the gradient of the line **y = ½x − 3**.

<details>
<summary>Answer</summary>
The gradient is **½** (the coefficient of x).
</details>

### Question 4
Find the gradient of the line through **(−2, −3)** and **(4, 9)**.

<details>
<summary>Answer</summary>
m = (9 − (−3)) / (4 − (−2)) = 12/6 = **2**
</details>

### Question 5
A line has equation y = −3x + 8. What is its gradient?

<details>
<summary>Answer</summary>
The gradient is **−3**.
</details>`,
    };
  }

  if (lessonTitle === "Parallel Lines and Equal Gradients") {
    return {
      explanation: `## Parallel Lines

Two lines are **parallel** if they go in exactly the same direction — they never meet, no matter how far you extend them.

### The Key Rule

**Parallel lines have the same gradient.**

If two lines have equations:
- Line 1: y = **m₁**x + c₁
- Line 2: y = **m₂**x + c₂

They are parallel **if and only if m₁ = m₂**.

The y-intercepts (c values) can be different — that just shifts the line up or down.

### Examples

| Line 1 | Line 2 | Parallel? | Why? |
|--------|--------|-----------|------|
| y = 3x + 1 | y = 3x − 5 | ✅ Yes | Both have gradient 3 |
| y = 2x + 4 | y = −2x + 4 | ❌ No | Gradients are 2 and −2 |
| y = ½x − 1 | y = ½x + 7 | ✅ Yes | Both have gradient ½ |
| y = x + 3 | y = −x + 3 | ❌ No | Gradients are 1 and −1 |

### Finding a Parallel Line Through a Point

To find the equation of a line **parallel to** y = mx + c **through the point** (a, b):

1. The new line has the **same gradient** m
2. Substitute the point into y = mx + c_new: b = m(a) + c_new
3. Solve for c_new
4. Write the equation: y = mx + c_new`,
      example: `## Worked Example 1: Checking if Lines are Parallel

**Are the lines y = 5x + 3 and y = 5x − 2 parallel?**

Compare the gradients:
- Line 1 gradient: **5**
- Line 2 gradient: **5**

Since the gradients are **equal**, the lines are **parallel**. ✅

---

## Worked Example 2: Finding the Value of k

**Find the value of k so that y = kx + 4 is parallel to y = −3x + 1.**

Parallel lines have equal gradients:
- Gradient of y = −3x + 1 is **−3**
- So k = **−3**

The parallel line is y = −3x + 4.

---

## Worked Example 3: Equation of a Parallel Line

**Find the equation of the line parallel to y = 2x + 1 that passes through (3, 10).**

**Step 1:** The parallel line has the same gradient: **m = 2**

**Step 2:** Substitute the point (3, 10) into y = 2x + c:
- 10 = 2(3) + c
- 10 = 6 + c
- c = 4

**Step 3:** Write the equation: **y = 2x + 4**

✅ Check: When x = 3, y = 2(3) + 4 = 10 ✓`,
      practice: `## Practice: Parallel Lines

### Question 1
Are the lines y = 4x + 2 and y = 4x − 7 parallel? Explain.

<details>
<summary>Answer</summary>
**Yes**, both lines have gradient 4, so they are parallel.
</details>

### Question 2
Find the value of k so that y = kx − 1 is parallel to y = 6x + 3.

<details>
<summary>Answer</summary>
Parallel lines have equal gradients, so **k = 6**.
</details>

### Question 3
Find the equation of the line parallel to y = −x + 4 passing through (2, 1).

<details>
<summary>Answer</summary>
Gradient = −1. Substitute (2, 1): 1 = −1(2) + c → c = 3. Equation: **y = −x + 3**
</details>

### Question 4
Which pair of lines is parallel?
- A: y = 3x + 1
- B: y = −3x + 1
- C: y = 3x − 5

<details>
<summary>Answer</summary>
**A and C** are parallel (both have gradient 3). Line B has gradient −3, which is different.
</details>

### Question 5
Find the equation of the line parallel to y = ½x + 2 through (4, 5).

<details>
<summary>Answer</summary>
Gradient = ½. Substitute (4, 5): 5 = ½(4) + c → 5 = 2 + c → c = 3. Equation: **y = ½x + 3**
</details>`,
    };
  }

  return {
    explanation: `## Perpendicular Lines

Two lines are **perpendicular** if they meet at a **right angle** (90°).

### The Key Rule

If two lines are perpendicular, their gradients multiply to give **−1**:

**m₁ × m₂ = −1**

This means: **m₂ = −1 / m₁**

The perpendicular gradient is the **negative reciprocal** — flip the fraction and change the sign.

### Quick Reference

| Original Gradient | Perpendicular Gradient | Check: m₁ × m₂ |
|-------------------|----------------------|-----------------|
| 2 | −½ | 2 × (−½) = −1 ✅ |
| −3 | ⅓ | −3 × ⅓ = −1 ✅ |
| ½ | −2 | ½ × (−2) = −1 ✅ |
| ¾ | −4/3 | ¾ × (−4/3) = −1 ✅ |
| 1 | −1 | 1 × (−1) = −1 ✅ |
| −1 | 1 | −1 × 1 = −1 ✅ |

### Special Cases
- A **horizontal** line (m = 0) is perpendicular to a **vertical** line (undefined gradient)
- You cannot use the formula for vertical lines since their gradient is undefined

### Finding a Perpendicular Line Through a Point

1. Find the gradient of the original line
2. Calculate the perpendicular gradient: m_perp = −1/m
3. Substitute the given point into y = m_perp·x + c
4. Solve for c and write the equation`,
    example: `## Worked Example 1: Finding a Perpendicular Gradient

**Find the gradient of a line perpendicular to y = 4x − 3.**

The gradient of y = 4x − 3 is **m = 4**.

Perpendicular gradient = −1/m = −1/4 = **−¼**

---

## Worked Example 2: Equation of a Perpendicular Line

**Find the equation of the line perpendicular to y = 2x + 5 that passes through (4, 1).**

**Step 1:** Original gradient = 2. Perpendicular gradient = **−½**

**Step 2:** Substitute (4, 1) into y = −½x + c:
- 1 = −½(4) + c
- 1 = −2 + c
- c = 3

**Step 3:** The equation is **y = −½x + 3**

✅ Check: gradient product = 2 × (−½) = −1 ✓

---

## Worked Example 3: From Two Points

**Line A passes through (1, 2) and (3, 6). Find the perpendicular gradient.**

**Step 1:** Find gradient of Line A:
- m = (6 − 2) / (3 − 1) = 4/2 = 2

**Step 2:** Perpendicular gradient = −1/2 = **−½**

If you needed the perpendicular line through (1, 2):
- 2 = −½(1) + c → c = 5/2
- Equation: y = −½x + 5/2`,
    practice: `## Practice: Perpendicular Lines

### Question 1
Find the gradient of a line perpendicular to y = 3x − 2.

<details>
<summary>Answer</summary>
Perpendicular gradient = −1/3 = **−⅓**
</details>

### Question 2
A line has gradient −5. What is the gradient of a perpendicular line?

<details>
<summary>Answer</summary>
Perpendicular gradient = −1/(−5) = **⅕**
</details>

### Question 3
Find the equation of the line perpendicular to y = −x + 4 passing through (3, 5).

<details>
<summary>Answer</summary>
Original gradient = −1. Perpendicular gradient = −1/(−1) = 1. Substitute (3, 5): 5 = 1(3) + c → c = 2. Equation: **y = x + 2**
</details>

### Question 4
Line P has gradient ⅔. Line Q has gradient −3/2. Are they perpendicular?

<details>
<summary>Answer</summary>
Check: ⅔ × (−3/2) = −3/3 = **−1**. Yes, they are perpendicular. ✅
</details>

### Question 5
Find the equation of the line perpendicular to y = ¼x + 1 through the origin (0, 0).

<details>
<summary>Answer</summary>
Perpendicular gradient = −1/(¼) = −4. Through (0, 0): c = 0. Equation: **y = −4x**
</details>`,
  };
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
