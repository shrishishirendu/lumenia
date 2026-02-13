import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

function makeSeedSvg(
  m1: number, c1: number, m2: number, c2: number,
  intersection: { x: number; y: number } | null,
): string {
  const width = 460, height = 340, pad = 30, xMin = -6, xMax = 6, yMin = -6, yMax = 6;
  const w = width - 2 * pad, h = height - 2 * pad;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * h;
  const clipLine = (m: number, c: number) => {
    const pts: { x: number; y: number }[] = [];
    const yAtXmin = m * xMin + c, yAtXmax = m * xMax + c;
    if (yAtXmin >= yMin && yAtXmin <= yMax) pts.push({ x: xMin, y: yAtXmin });
    if (yAtXmax >= yMin && yAtXmax <= yMax) pts.push({ x: xMax, y: yAtXmax });
    if (m !== 0) {
      const xAtYmin = (yMin - c) / m, xAtYmax = (yMax - c) / m;
      if (xAtYmin > xMin && xAtYmin < xMax) pts.push({ x: xAtYmin, y: yMin });
      if (xAtYmax > xMin && xAtYmax < xMax) pts.push({ x: xAtYmax, y: yMax });
    }
    if (pts.length < 2) return { x1: xMin, y1: m * xMin + c, x2: xMax, y2: m * xMax + c };
    pts.sort((a, b) => a.x - b.x);
    return { x1: pts[0].x, y1: pts[0].y, x2: pts[pts.length - 1].x, y2: pts[pts.length - 1].y };
  };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa" rx="4"/>`;
  for (let x = xMin; x <= xMax; x++) { const px = sx(x); svg += `<line x1="${px}" y1="${pad}" x2="${px}" y2="${height - pad}" stroke="#e0e0e0" stroke-width="0.5"/>`; if (x !== 0) svg += `<text x="${px}" y="${height - pad + 14}" text-anchor="middle" fill="#888" font-size="10">${x}</text>`; }
  for (let y = yMin; y <= yMax; y++) { const py = sy(y); svg += `<line x1="${pad}" y1="${py}" x2="${width - pad}" y2="${py}" stroke="#e0e0e0" stroke-width="0.5"/>`; if (y !== 0) svg += `<text x="${pad - 6}" y="${py + 4}" text-anchor="end" fill="#888" font-size="10">${y}</text>`; }
  if (yMin <= 0 && yMax >= 0) { const y0 = sy(0); svg += `<line x1="${pad}" y1="${y0}" x2="${width - pad}" y2="${y0}" stroke="#333" stroke-width="1.5"/>`; svg += `<text x="${width - pad + 8}" y="${y0 + 4}" fill="#333" font-size="11">x</text>`; }
  if (xMin <= 0 && xMax >= 0) { const x0 = sx(0); svg += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${height - pad}" stroke="#333" stroke-width="1.5"/>`; svg += `<text x="${x0 + 4}" y="${pad - 6}" fill="#333" font-size="11">y</text>`; }
  const l1 = clipLine(m1, c1);
  svg += `<line x1="${sx(l1.x1)}" y1="${sy(l1.y1)}" x2="${sx(l1.x2)}" y2="${sy(l1.y2)}" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>`;
  svg += `<text x="${(sx(l1.x1) + sx(l1.x2)) / 2 + 6}" y="${(sy(l1.y1) + sy(l1.y2)) / 2 - 8}" fill="#2563eb" font-size="12" font-weight="bold">L\u2081</text>`;
  const l2 = clipLine(m2, c2);
  svg += `<line x1="${sx(l2.x1)}" y1="${sy(l2.y1)}" x2="${sx(l2.x2)}" y2="${sy(l2.y2)}" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8,4"/>`;
  svg += `<text x="${(sx(l2.x1) + sx(l2.x2)) / 2 + 6}" y="${(sy(l2.y1) + sy(l2.y2)) / 2 + 14}" fill="#dc2626" font-size="12" font-weight="bold">L\u2082</text>`;
  if (intersection) {
    svg += `<circle cx="${sx(intersection.x)}" cy="${sy(intersection.y)}" r="5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>`;
    svg += `<text x="${sx(intersection.x) + 8}" y="${sy(intersection.y) - 8}" fill="#16a34a" font-size="11" font-weight="bold">(${intersection.x},${intersection.y})</text>`;
  }
  svg += `</svg>`;
  return svg;
}

export async function seedSimultaneousEquationsSubstitution() {
  console.log("Seeding Simultaneous Equations – Substitution content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Simultaneous Equations – Substitution";

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
    console.log("Simultaneous Equations – Substitution topic already exists (id=" + topicId + "). Checking for missing data...");

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

  const graphicalTopic = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, SUBJECT_ID), eq(topics.gradeLevel, GRADE_LEVEL), eq(topics.title, "Simultaneous Equations – Graphical")));
  const prerequisiteId = graphicalTopic.length > 0 ? graphicalTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Solve simultaneous equations algebraically using the substitution method: express one variable in terms of the other, substitute, and solve.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 17,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  console.log(`  Created topic: ${topic.title} (id=${topic.id})`);
  const topicId = topic.id;

  const lessonData = [
    {
      title: "Introduction to Substitution",
      description: "Learn the substitution method: isolate one variable and replace it in the other equation.",
      orderIndex: 1,
      estimatedMinutes: 15,
      objectives: [
        "Understand why substitution works for solving simultaneous equations",
        "Identify which variable to isolate when one equation is already in y = ... or x = ... form",
        "Perform the substitution step accurately",
      ],
    },
    {
      title: "Rearranging Before Substituting",
      description: "Handle systems where neither equation is already solved for a variable — rearrange first, then substitute.",
      orderIndex: 2,
      estimatedMinutes: 15,
      objectives: [
        "Rearrange an equation into the form y = ... or x = ...",
        "Choose the equation that is easier to rearrange",
        "Substitute and solve, then back-substitute to find the other variable",
      ],
    },
    {
      title: "Special Cases and Verification",
      description: "Recognise when substitution reveals no solution or infinitely many solutions, and verify answers by back-substitution.",
      orderIndex: 3,
      estimatedMinutes: 20,
      objectives: [
        "Identify contradictions (e.g. 0 = 5) as no solution (parallel lines)",
        "Identify identities (e.g. 0 = 0) as infinitely many solutions (coincident lines)",
        "Verify solutions by substituting back into both original equations",
      ],
    },
  ];

  const svgEx1 = makeSeedSvg(1, 1, -1, 5, { x: 2, y: 3 });
  const svgEx2 = makeSeedSvg(2, -1, -1, 5, { x: 2, y: 3 });
  const svgRearrange = makeSeedSvg(3, -4, -1, 4, { x: 2, y: 2 });
  const svgParallel = makeSeedSvg(2, 1, 2, -3, null);
  const svgCoincident = makeSeedSvg(-1, 3, -1, 3, null);
  const svgVerify = makeSeedSvg(1, -1, -2, 5, { x: 2, y: 1 });

  const segmentContents: Record<string, { explanation: string; example: string; practice: string }> = {
    "Introduction to Substitution": {
      explanation: `## What Is the Substitution Method?\n\nThe **substitution method** is an algebraic technique for solving simultaneous equations. Instead of drawing graphs, we solve the equations using algebra.\n\n### The Core Idea\n\nIf one equation tells us what **y** equals (e.g. y = x + 1), we can **replace** y in the other equation with that expression. This gives us a single equation with one unknown, which we can solve.\n\n## When to Use Substitution\n\nSubstitution works especially well when:\n- One equation is already in the form **y = ...** or **x = ...**\n- One variable has a coefficient of 1 (easy to isolate)\n\n## The Steps\n\n1. **Identify** the equation where a variable is already isolated (or can be easily isolated).\n2. **Substitute** that expression into the **other** equation.\n3. **Solve** the resulting equation for the remaining variable.\n4. **Back-substitute** to find the other variable.\n5. **Write** the answer as a coordinate pair (x, y).\n\n## Connecting to Graphs\n\nThe graph below shows **y = x + 1** (blue) and **y = −x + 5** (red dashed). They intersect at **(2, 3)**. We can find this same answer algebraically using substitution!\n\n${svgEx1}\n\nSince both equations equal y, we set them equal:\n\nx + 1 = −x + 5\n\n2x = 4\n\nx = 2, then y = 2 + 1 = **3**\n\nAnswer: **(2, 3)** — matches the graph!`,
      example: `## Worked Example 1: Both Equations in y = ... Form\n\n**Solve simultaneously:**\n- y = 2x − 1 … (1)\n- y = −x + 5 … (2)\n\n${svgEx2}\n\n### Step 1: Set the y-expressions equal\nSince both equations equal y:\n\n2x − 1 = −x + 5\n\n### Step 2: Solve for x\n2x + x = 5 + 1\n\n3x = 6\n\nx = **2**\n\n### Step 3: Back-substitute to find y\nSubstitute x = 2 into Equation (1):\n\ny = 2(2) − 1 = 4 − 1 = **3**\n\n### Step 4: Write the answer\n**(2, 3)**\n\n### Step 5: Verify\n- Eq (1): y = 2(2) − 1 = 3 ✓\n- Eq (2): y = −(2) + 5 = 3 ✓\n\n---\n\n## Worked Example 2: One Equation Has y Isolated\n\n**Solve simultaneously:**\n- y = 3x + 1 … (1)\n- 2x + y = 6 … (2)\n\n### Step 1: Substitute Equation (1) into Equation (2)\nReplace y in Equation (2) with 3x + 1:\n\n2x + (3x + 1) = 6\n\n### Step 2: Solve for x\n5x + 1 = 6\n\n5x = 5\n\nx = **1**\n\n### Step 3: Find y\ny = 3(1) + 1 = **4**\n\n### Answer: **(1, 4)**\n\nVerify: 2(1) + 4 = 6 ✓`,
      practice: `## Practice: Simple Substitution\n\nSolve each system using the substitution method.\n\n**Exercise 1:** y = x + 3 and y = −x + 7\n- Set equal: x + 3 = −x + 7\n- 2x = 4 → x = 2\n- y = 2 + 3 = 5\n- **Answer: (2, 5)**\n\n**Exercise 2:** y = 2x and x + y = 9\n- Substitute: x + 2x = 9\n- 3x = 9 → x = 3\n- y = 2(3) = 6\n- **Answer: (3, 6)**\n\n**Exercise 3:** y = −x + 4 and 3x + y = 8\n- Substitute: 3x + (−x + 4) = 8\n- 2x + 4 = 8 → 2x = 4 → x = 2\n- y = −2 + 4 = 2\n- **Answer: (2, 2)**\n\n**Exercise 4:** x = y − 1 and 2x + 3y = 13\n- Substitute: 2(y − 1) + 3y = 13\n- 2y − 2 + 3y = 13 → 5y = 15 → y = 3\n- x = 3 − 1 = 2\n- **Answer: (2, 3)**\n\n### Tips\n- Always substitute into the **other** equation (not the same one).\n- Simplify carefully — expand brackets before collecting like terms.\n- Don't forget to find **both** variables.`,
    },
    "Rearranging Before Substituting": {
      explanation: `## What If Neither Equation Is Solved for a Variable?\n\nSometimes neither equation is in the form y = ... or x = .... In that case, you need to **rearrange one equation first** before you can substitute.\n\n## Choosing Which Equation to Rearrange\n\nLook for the equation where a variable has a **coefficient of 1** (or −1). This makes rearranging easier and avoids fractions.\n\nFor example, in the system:\n- 3x − y = 4 … (1)\n- x + y = 4 … (2)\n\nEquation (2) has x with a coefficient of 1, so it's easy to rearrange:\n\nx = 4 − y\n\nNow substitute this into Equation (1).\n\n## The Full Process\n\n1. **Choose** the equation that's easiest to rearrange.\n2. **Rearrange** it to make x = ... or y = ...\n3. **Substitute** into the other equation.\n4. **Solve** for the remaining variable.\n5. **Back-substitute** to find the other variable.\n\n## Visual Confirmation\n\nThe graph below shows the lines 3x − y = 4 and x + y = 4, which intersect at **(2, 2)**.\n\n${svgRearrange}\n\nLet's verify algebraically:\n- From (2): x = 4 − y\n- Into (1): 3(4 − y) − y = 4 → 12 − 3y − y = 4 → 12 − 4y = 4 → 4y = 8 → y = 2\n- x = 4 − 2 = 2\n- Answer: **(2, 2)** ✓`,
      example: `## Worked Example 1: Rearrange Then Substitute\n\n**Solve simultaneously:**\n- 2x + y = 7 … (1)\n- x − y = 2 … (2)\n\n### Step 1: Rearrange Equation (2)\nx has coefficient 1, so rearrange to find x:\n\nx = y + 2\n\n### Step 2: Substitute into Equation (1)\n2(y + 2) + y = 7\n\n### Step 3: Solve\n2y + 4 + y = 7\n\n3y = 3\n\ny = **1**\n\n### Step 4: Find x\nx = 1 + 2 = **3**\n\n### Answer: **(3, 1)**\n\nVerify: 2(3) + 1 = 7 ✓ and 3 − 1 = 2 ✓\n\n---\n\n## Worked Example 2: Rearranging for y\n\n**Solve simultaneously:**\n- x + 2y = 8 … (1)\n- 3x − y = 3 … (2)\n\n### Step 1: Rearrange Equation (2) for y\n−y = 3 − 3x\n\ny = 3x − 3\n\n### Step 2: Substitute into Equation (1)\nx + 2(3x − 3) = 8\n\nx + 6x − 6 = 8\n\n7x = 14\n\nx = **2**\n\n### Step 3: Find y\ny = 3(2) − 3 = **3**\n\n### Answer: **(2, 3)**\n\nVerify: 2 + 2(3) = 8 ✓ and 3(2) − 3 = 3 ✓`,
      practice: `## Practice: Rearrange Then Substitute\n\n**Exercise 1:** x + y = 5 and 2x − y = 1\n- Rearrange: y = 5 − x\n- Substitute: 2x − (5 − x) = 1 → 3x − 5 = 1 → 3x = 6 → x = 2\n- y = 5 − 2 = 3\n- **Answer: (2, 3)**\n\n**Exercise 2:** 3x + y = 10 and x − y = 2\n- From equation 2: x = y + 2\n- Substitute: 3(y + 2) + y = 10 → 3y + 6 + y = 10 → 4y = 4 → y = 1\n- x = 1 + 2 = 3\n- **Answer: (3, 1)**\n\n**Exercise 3:** 2x − y = 1 and x + 3y = 12\n- From equation 1: y = 2x − 1\n- Substitute: x + 3(2x − 1) = 12 → x + 6x − 3 = 12 → 7x = 15 → x = 15/7\n- y = 2(15/7) − 1 = 30/7 − 7/7 = 23/7\n- **Answer: (15/7, 23/7)** — fractions are fine!\n\n**Exercise 4:** 4x + y = 11 and x − 2y = −1\n- From equation 2: x = 2y − 1\n- Substitute: 4(2y − 1) + y = 11 → 8y − 4 + y = 11 → 9y = 15 → y = 5/3\n- x = 2(5/3) − 1 = 10/3 − 3/3 = 7/3\n- **Answer: (7/3, 5/3)**\n\n### Key Tips\n- Choose the variable with coefficient **1** or **−1** to rearrange.\n- If both variables have larger coefficients, either will work — just be careful with fractions.\n- Always verify your answer in **both** original equations.`,
    },
    "Special Cases and Verification": {
      explanation: `## What Happens When There's No Single Answer?\n\nNot every system of simultaneous equations has one solution. The substitution method reveals this naturally.\n\n## Case 1: No Solution (Parallel Lines)\n\nWhen you substitute and simplify, you might get a **contradiction** — a statement that can never be true.\n\nFor example:\n- y = 2x + 1 … (1)\n- y = 2x − 3 … (2)\n\nSubstituting (1) into (2): 2x + 1 = 2x − 3 → 1 = −3\n\nThis is **impossible**! There is no value of x that makes this true.\n\n${svgParallel}\n\nThe graph confirms: the lines are **parallel** (both have gradient 2) and never meet.\n\n**Answer: no solution**\n\n## Case 2: Infinitely Many Solutions (Coincident Lines)\n\nIf substitution leads to an **identity** — a statement that is always true — the equations represent the same line.\n\nFor example:\n- y = −x + 3 … (1)\n- 2x + 2y = 6 … (2)\n\nSubstitute (1) into (2): 2x + 2(−x + 3) = 6 → 2x − 2x + 6 = 6 → 6 = 6\n\nThis is **always true**! Every point on the line is a solution.\n\n${svgCoincident}\n\n**Answer: infinitely many solutions**\n\n## How to Identify\n\n| Substitution Result | Meaning | Answer |\n|---|---|---|\n| x = number, y = number | One intersection | **(x, y)** |\n| Contradiction (e.g. 0 = 5) | Parallel lines | **no solution** |\n| Identity (e.g. 0 = 0) | Same line | **infinitely many solutions** |\n\n## Verifying Solutions\n\nAlways verify your answer by substituting (x, y) back into **both** original equations. Both sides must be equal.`,
      example: `## Worked Example 1: No Solution\n\n**Solve simultaneously:**\n- y = 2x + 1 … (1)\n- 4x − 2y = 10 … (2)\n\n### Step 1: Substitute (1) into (2)\n4x − 2(2x + 1) = 10\n\n### Step 2: Simplify\n4x − 4x − 2 = 10\n\n−2 = 10\n\nThis is a **contradiction**. No values of x and y can make this true.\n\n### Answer: **no solution**\n\nThe lines y = 2x + 1 and y = 2x − 5 are parallel (both gradient 2).\n\n---\n\n## Worked Example 2: Infinitely Many Solutions\n\n**Solve simultaneously:**\n- y = −x + 3 … (1)\n- 3x + 3y = 9 … (2)\n\n### Step 1: Substitute (1) into (2)\n3x + 3(−x + 3) = 9\n\n### Step 2: Simplify\n3x − 3x + 9 = 9\n\n9 = 9\n\nThis is an **identity** — always true.\n\n### Answer: **infinitely many solutions**\n\nBoth equations simplify to the same line: y = −x + 3.\n\n---\n\n## Worked Example 3: One Solution with Verification\n\n**Solve:** x − y = 1 and 2x + y = 5\n\n${svgVerify}\n\nFrom Eq 1: x = y + 1. Substitute: 2(y + 1) + y = 5 → 3y + 2 = 5 → y = 1, x = 2.\n\n**Verify:**\n- Eq 1: 2 − 1 = 1 ✓\n- Eq 2: 2(2) + 1 = 5 ✓\n\n**Answer: (2, 1)**`,
      practice: `## Practice: Special Cases and Verification\n\n**Exercise 1:** y = 3x + 2 and y = 3x − 4\n- Substitute: 3x + 2 = 3x − 4 → 2 = −4\n- Contradiction → **no solution**\n\n**Exercise 2:** y = −2x + 5 and 4x + 2y = 10\n- Substitute: 4x + 2(−2x + 5) = 10 → 4x − 4x + 10 = 10 → 10 = 10\n- Identity → **infinitely many solutions**\n\n**Exercise 3:** y = x − 2 and 3x + y = 10\n- Substitute: 3x + (x − 2) = 10 → 4x = 12 → x = 3, y = 1\n- Verify: 3 − 2 = 1 ✓ and 3(3) + 1 = 10 ✓\n- **Answer: (3, 1)**\n\n**Exercise 4:** 2x + y = 8 and 4x + 2y = 16\n- Rearrange: y = 8 − 2x\n- Substitute: 4x + 2(8 − 2x) = 16 → 4x + 16 − 4x = 16 → 16 = 16\n- Identity → **infinitely many solutions**\n\n**Exercise 5:** x + y = 4 and 2x + 2y = 6\n- Rearrange: y = 4 − x\n- Substitute: 2x + 2(4 − x) = 6 → 2x + 8 − 2x = 6 → 8 = 6\n- Contradiction → **no solution**\n\n### Decision Flowchart\n1. Substitute and simplify.\n2. If you get x = number → find y → **one solution**.\n3. If you get a contradiction (e.g. 5 = 0) → **no solution**.\n4. If you get an identity (e.g. 0 = 0) → **infinitely many solutions**.\n5. Always verify one-solution answers by checking both equations!`,
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
    { questionText: "Solve: y = x + 1 and y = -x + 5", correctAnswer: "(2,3)", explanation: "Set x + 1 = -x + 5, so 2x = 4, x = 2, y = 3. Answer: (2, 3).", difficulty: 1, points: 1 },
    { questionText: "Solve: y = 2x and x + y = 9", correctAnswer: "(3,6)", explanation: "Substitute y = 2x: x + 2x = 9, 3x = 9, x = 3, y = 6.", difficulty: 1, points: 1 },
    { questionText: "Solve: y = 3x - 1 and y = x + 3", correctAnswer: "(2,5)", explanation: "3x - 1 = x + 3, 2x = 4, x = 2, y = 5.", difficulty: 1, points: 1 },
    { questionText: "Solve: y = -x + 4 and 2x + y = 6", correctAnswer: "(2,2)", explanation: "Substitute: 2x + (-x + 4) = 6, x + 4 = 6, x = 2, y = 2.", difficulty: 1, points: 1 },
    { questionText: "Solve: x = y + 1 and 2x + y = 5", correctAnswer: "(2,1)", explanation: "Substitute x = y + 1 into eq 2: 2(y+1) + y = 5, 3y + 2 = 5, 3y = 3, y = 1, x = 2.", difficulty: 2, points: 2 },
    { questionText: "Solve: x + y = 5 and 2x - y = 1", correctAnswer: "(2,3)", explanation: "From eq 1: y = 5 - x. Substitute: 2x - (5-x) = 1, 3x - 5 = 1, 3x = 6, x = 2, y = 3.", difficulty: 2, points: 2 },
    { questionText: "Solve: 2x + y = 7 and x - y = 2", correctAnswer: "(3,1)", explanation: "From eq 2: x = y + 2. Substitute: 2(y+2) + y = 7, 3y + 4 = 7, 3y = 3, y = 1, x = 3.", difficulty: 2, points: 2 },
    { questionText: "Solve: 3x + y = 10 and x = y + 2", correctAnswer: "(3,1)", explanation: "Substitute: 3(y+2) + y = 10, 4y + 6 = 10, 4y = 4, y = 1, x = 3.", difficulty: 2, points: 2 },
    { questionText: "Solve: x + 2y = 8 and 3x - y = 3", correctAnswer: "(2,3)", explanation: "From eq 2: y = 3x - 3. Substitute: x + 2(3x-3) = 8, 7x - 6 = 8, 7x = 14, x = 2, y = 3.", difficulty: 2, points: 2 },
    { questionText: "Solve: y = 2x + 1 and y = 2x - 3. What type of system is this?", correctAnswer: "no solution", explanation: "2x + 1 = 2x - 3 gives 1 = -3, a contradiction. Parallel lines: no solution.", difficulty: 3, points: 3 },
    { questionText: "Solve: y = -x + 3 and 2x + 2y = 6", correctAnswer: "infinitely many solutions", explanation: "Substitute: 2x + 2(-x+3) = 6, 6 = 6. Identity: infinitely many solutions.", difficulty: 3, points: 3 },
    { questionText: "Solve: 4x + y = 11 and x - 2y = -1", correctAnswer: "(7/3,5/3)", explanation: "From eq 2: x = 2y - 1. Substitute: 4(2y-1) + y = 11, 9y - 4 = 11, 9y = 15, y = 5/3, x = 7/3.", difficulty: 3, points: 3 },
    { questionText: "Solve: 2x - y = 1 and x + 3y = 12", correctAnswer: "(15/7,23/7)", explanation: "From eq 1: y = 2x - 1. Substitute: x + 3(2x-1) = 12, 7x = 15, x = 15/7, y = 23/7.", difficulty: 3, points: 3 },
    { questionText: "Solve: 3x + 2y = 12 and x - y = 1", correctAnswer: "(14/5,9/5)", explanation: "From eq 2: x = y + 1. Substitute: 3(y+1) + 2y = 12, 5y + 3 = 12, 5y = 9, y = 9/5, x = 14/5.", difficulty: 3, points: 3 },
    { questionText: "Solve: 5x + y = 13 and 3x - 2y = -1", correctAnswer: "(25/13,44/13)", explanation: "From eq 1: y = 13 - 5x. Substitute: 3x - 2(13-5x) = -1, 13x - 26 = -1, 13x = 25, x = 25/13, y = 44/13.", difficulty: 4, points: 4 },
    { questionText: "Solve: 2x + y = 8 and 4x + 2y = 16. Classify the system.", correctAnswer: "infinitely many solutions", explanation: "The second equation is just 2× the first. Substitution gives 16 = 16, an identity.", difficulty: 4, points: 4 },
    { questionText: "Solve: x + y = 4 and 3x + 3y = 15", correctAnswer: "no solution", explanation: "From eq 1: y = 4-x. Substitute: 3x + 3(4-x) = 15, 12 = 15. Contradiction: no solution.", difficulty: 4, points: 4 },
    { questionText: "Solve: 2x + 3y = 1 and x - y = 3", correctAnswer: "(2,-1)", explanation: "From eq 2: x = y + 3. Substitute: 2(y+3) + 3y = 1, 5y + 6 = 1, 5y = -5, y = -1, x = 2.", difficulty: 4, points: 4 },
    { questionText: "Solve: -x + 2y = 7 and 3x + y = 0", correctAnswer: "(-1,3)", explanation: "From eq 2: y = -3x. Substitute: -x + 2(-3x) = 7, -7x = 7, x = -1, y = 3.", difficulty: 4, points: 4 },
    { questionText: "Solve: 3x - y = 5 and 6x - 2y = 10. What type of system?", correctAnswer: "infinitely many solutions", explanation: "Second equation is 2× the first. Substitution gives 10 = 10. Same line: infinitely many solutions.", difficulty: 4, points: 4 },
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
    summary: "The substitution method solves simultaneous equations by expressing one variable in terms of the other and substituting into the second equation.",
    notesMarkdown: `## Core Idea
Express one variable in terms of the other using one equation, then **substitute** that expression into the second equation to solve.

## Steps
1. **Isolate** one variable (choose the equation where a variable has coefficient 1 or −1).
2. **Substitute** the expression into the other equation.
3. **Solve** the resulting single-variable equation.
4. **Back-substitute** to find the other variable.
5. **Verify** by checking both original equations.

## Example
Solve y = 2x − 1 and x + y = 5:
- Substitute: x + (2x − 1) = 5 → 3x = 6 → x = 2
- Back-substitute: y = 2(2) − 1 = 3
- Answer: **(2, 3)**
- Check: 2 + 3 = 5 ✓ and 3 = 2(2) − 1 ✓

## Special Cases
| Result | Meaning |
|--------|---------|
| x = number → find y | **One solution** |
| Contradiction (e.g. 0 = 5) | **No solution** (parallel lines) |
| Identity (e.g. 0 = 0) | **Infinitely many solutions** (same line) |

## Tips for Choosing What to Rearrange
- Pick the variable with **coefficient 1 or −1** — avoids fractions.
- If both have larger coefficients, either works — just be careful.

## Common Mistakes
- Substituting back into the **same** equation you rearranged (this gives an identity, not the answer).
- Forgetting to find the **second** variable after solving for the first.
- Sign errors when distributing negatives during substitution.
- Not verifying the answer in **both** original equations.`,
    keyFormulas: [
      "If y = mx + c, substitute into the other equation to eliminate y",
      "Contradiction (e.g. 5 = 0) → no solution",
      "Identity (e.g. 0 = 0) → infinitely many solutions",
    ],
    commonMistakes: [
      "Substituting into the same equation that was rearranged",
      "Forgetting to find the second variable",
      "Sign errors when expanding brackets after substitution",
      "Not verifying the answer in both original equations",
    ],
  });
  console.log(`  Created topic notes for topic ${topicId}`);
}
