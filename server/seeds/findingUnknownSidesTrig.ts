import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

function makeRightTriangleSvg(opts: {
  opp: string; adj: string; hyp: string;
  theta?: string;
  width?: number; height?: number;
  colorOpp?: string; colorAdj?: string; colorHyp?: string;
}): string {
  const W = opts.width || 420;
  const H = opts.height || 300;
  const pad = 40;
  const Ax = pad;
  const Ay = H - pad;
  const Bx = pad + (W - 2 * pad) * 0.75;
  const By = H - pad;
  const Cx = Bx;
  const Cy = pad + (H - 2 * pad) * 0.15;
  const cOpp = opts.colorOpp || "#16a34a";
  const cAdj = opts.colorAdj || "#2563eb";
  const cHyp = opts.colorHyp || "#9333ea";
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#e8f0fe" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>`;
  svg += `<polyline points="${Bx - 14},${By} ${Bx - 14},${By - 14} ${Bx},${By - 14}" fill="none" stroke="#333" stroke-width="1.5"/>`;
  const arcR = 30;
  const startAngle = Math.atan2(Ay - Cy, Cx - Ax);
  const arcStartX = Ax + arcR * Math.cos(-startAngle);
  const arcStartY = Ay + arcR * Math.sin(-startAngle);
  svg += `<path d="M ${Ax + arcR} ${Ay} A ${arcR} ${arcR} 0 0 0 ${arcStartX} ${arcStartY}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  const labelAngle = startAngle / 2;
  const thetaLabel = opts.theta || "θ";
  svg += `<text x="${Ax + (arcR + 16) * Math.cos(-labelAngle)}" y="${Ay + (arcR + 16) * Math.sin(-labelAngle)}" text-anchor="middle" dominant-baseline="middle" fill="#dc2626" font-size="14" font-weight="bold" font-style="italic">${thetaLabel}</text>`;
  svg += `<text x="${Bx + 18}" y="${(By + Cy) / 2}" text-anchor="start" dominant-baseline="middle" fill="${cOpp}" font-size="13" font-weight="bold">${opts.opp}</text>`;
  svg += `<text x="${(Ax + Bx) / 2}" y="${By + 20}" text-anchor="middle" fill="${cAdj}" font-size="13" font-weight="bold">${opts.adj}</text>`;
  svg += `<text x="${(Ax + Cx) / 2 - 18}" y="${(Ay + Cy) / 2}" text-anchor="end" dominant-baseline="middle" fill="${cHyp}" font-size="13" font-weight="bold">${opts.hyp}</text>`;
  svg += `</svg>`;
  return svg;
}

function makeSOHCAHTOARearrangedSvg(): string {
  const W = 420, H = 260;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<text x="${W / 2}" y="28" text-anchor="middle" fill="#333" font-size="18" font-weight="bold">Finding Unknown Sides</text>`;
  const rows = [
    { ratio: "sin θ = O / H", findO: "O = H × sin θ", findH: "H = O / sin θ", color: "#dc2626" },
    { ratio: "cos θ = A / H", findA: "A = H × cos θ", findH: "H = A / cos θ", color: "#2563eb" },
    { ratio: "tan θ = O / A", findO: "O = A × tan θ", findA: "A = O / tan θ", color: "#16a34a" },
  ];
  let y = 55;
  for (const row of rows) {
    svg += `<rect x="15" y="${y}" width="${W - 30}" height="55" rx="8" fill="${row.color}10" stroke="${row.color}" stroke-width="1"/>`;
    svg += `<text x="30" y="${y + 22}" fill="${row.color}" font-size="13" font-weight="bold">${row.ratio}</text>`;
    const col1 = "findO" in row ? row.findO : row.findA!;
    const col2 = row.findH || ("findA" in row ? row.findA! : "");
    svg += `<text x="200" y="${y + 22}" fill="#333" font-size="12">→ ${col1}</text>`;
    svg += `<text x="200" y="${y + 42}" fill="#333" font-size="12">→ ${col2}</text>`;
    y += 65;
  }
  svg += `</svg>`;
  return svg;
}

function makeSpecialTriangleSvg(angle: 30 | 45 | 60): string {
  const W = 420, H = 300, pad = 50;
  const Ax = pad;
  const Ay = H - pad;
  const Bx = W - pad - 60;
  const By = H - pad;
  const Cx = Bx;
  const Cy = pad + 30;

  let sides: { opp: string; adj: string; hyp: string };
  if (angle === 30) sides = { opp: "1", adj: "√3", hyp: "2" };
  else if (angle === 45) sides = { opp: "1", adj: "1", hyp: "√2" };
  else sides = { opp: "√3", adj: "1", hyp: "2" };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" fill="#fef3c7" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>`;
  svg += `<polyline points="${Bx - 14},${By} ${Bx - 14},${By - 14} ${Bx},${By - 14}" fill="none" stroke="#333" stroke-width="1.5"/>`;
  svg += `<text x="${Ax + 40}" y="${Ay - 10}" fill="#dc2626" font-size="14" font-weight="bold">${angle}°</text>`;
  svg += `<text x="${Bx + 18}" y="${(By + Cy) / 2}" fill="#16a34a" font-size="14" font-weight="bold">${sides.opp}</text>`;
  svg += `<text x="${(Ax + Bx) / 2}" y="${By + 22}" fill="#2563eb" font-size="14" font-weight="bold">${sides.adj}</text>`;
  svg += `<text x="${(Ax + Cx) / 2 - 18}" y="${(Ay + Cy) / 2}" fill="#9333ea" font-size="14" font-weight="bold">${sides.hyp}</text>`;
  svg += `<text x="${W / 2}" y="${pad - 10}" text-anchor="middle" fill="#333" font-size="14" font-weight="bold">${angle}° Special Triangle</text>`;
  svg += `</svg>`;
  return svg;
}

async function insertTopicNotes(topicId: number) {
  const rearrangedSvg = makeSOHCAHTOARearrangedSvg();
  const labeledTri = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });
  const tri30 = makeSpecialTriangleSvg(30);
  const tri45 = makeSpecialTriangleSvg(45);

  await db.insert(topicNotes).values({
    topicId,
    summary: "Use sine, cosine, and tangent ratios to calculate unknown side lengths in right-angled triangles, including problems with exact values, rounding, and multi-step reasoning.",
    notesMarkdown: `## Finding Unknown Sides Using Trigonometry

When you know an angle and one side of a right-angled triangle, you can find any other side by rearranging SOH CAH TOA.

### Labelling Sides

${labeledTri}

- **Opposite (O)**: The side across from the angle θ
- **Adjacent (A)**: The side next to θ (not the hypotenuse)
- **Hypotenuse (H)**: The longest side, opposite the right angle

### Rearranging the Ratios

${rearrangedSvg}

### Step-by-Step Method

1. **Label** the sides O, A, H relative to the given angle
2. **Identify** which side you know and which you need to find
3. **Choose** the trig ratio that connects both sides
4. **Rearrange** to make the unknown side the subject
5. **Calculate** using your calculator (or exact values for special angles)

### Example: Finding the Opposite Side

Given: hypotenuse = 10, angle = 30°

sin 30° = O / 10

O = 10 × sin 30° = 10 × 0.5 = **5**

### Example: Finding the Hypotenuse

Given: opposite = 8, angle = 40°

sin 40° = 8 / H

H = 8 / sin 40° = 8 / 0.6428 ≈ **12.45**

### Special Angle Exact Values

For angles 30°, 45°, and 60°, give exact answers (not decimals).

${tri30}

${tri45}

| Angle | sin | cos | tan |
|-------|-----|-----|-----|
| 30° | 1/2 | √3/2 | 1/√3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |

### Multi-Step Problems

Sometimes you need to:
1. Use trig to find one side
2. Then use Pythagoras' theorem (a² + b² = c²) to find the third side

**Example:** Given angle = 35° and hypotenuse = 20, find all sides.
- O = 20 × sin 35° ≈ 11.47
- A = 20 × cos 35° ≈ 16.38
- Check: 11.47² + 16.38² ≈ 131.6 + 268.3 ≈ 399.9 ≈ 20² ✓`,
    keyFormulas: [
      "O = H × sin θ",
      "A = H × cos θ",
      "O = A × tan θ",
      "H = O / sin θ",
      "H = A / cos θ",
      "A = O / tan θ",
      "a² + b² = c² (Pythagoras)"
    ],
    commonMistakes: [
      "Using the wrong ratio — always label O, A, H relative to the given angle first",
      "Forgetting to rearrange — e.g., writing sin θ = O/H but not solving for the unknown",
      "Using degrees instead of radians (or vice versa) on the calculator",
      "Rounding too early — keep full calculator values until the final answer",
      "Confusing which side is opposite vs adjacent when the angle position changes",
      "Giving decimal answers when exact values are expected (e.g., for 30°, 45°, 60°)"
    ],
  });
  console.log("  Inserted topic notes for Finding Unknown Sides in Trigonometry.");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const triQ1 = makeRightTriangleSvg({ opp: "?", adj: "8", hyp: "10", theta: "θ" });
  const triQ2 = makeRightTriangleSvg({ opp: "?", adj: "12", hyp: "20", theta: "30°" });
  const triQ3 = makeRightTriangleSvg({ opp: "7", adj: "?", hyp: "14", theta: "60°" });
  const triQ4 = makeRightTriangleSvg({ opp: "9", adj: "?", hyp: "?", theta: "35°" });
  const triQ5 = makeRightTriangleSvg({ opp: "?", adj: "6", hyp: "?", theta: "45°" });
  const triQ6 = makeRightTriangleSvg({ opp: "?", adj: "10", hyp: "?", theta: "50°" });
  const triQ7 = makeRightTriangleSvg({ opp: "?", adj: "?", hyp: "24", theta: "30°" });
  const triQ8 = makeRightTriangleSvg({ opp: "15", adj: "?", hyp: "?", theta: "40°" });
  const triQ9 = makeRightTriangleSvg({ opp: "?", adj: "5√3", hyp: "10", theta: "30°" });
  const triQ10 = makeRightTriangleSvg({ opp: "?", adj: "?", hyp: "20", theta: "60°" });

  await db.insert(quizQuestions).values([
    {
      topicId,
      subjectId,
      questionText: `In the right-angled triangle shown, the hypotenuse is 10 and one side is 8. Use sin θ to find the opposite side if θ = 30°.\n\n${triQ1}`,
      correctAnswer: "5",
      difficulty: 1,
      explanation: "sin 30° = O / 10, so O = 10 × sin 30° = 10 × 0.5 = 5",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the opposite side of this triangle using sin 30°.\n\n${triQ2}`,
      correctAnswer: "10",
      difficulty: 1,
      explanation: "sin 30° = O / 20, so O = 20 × sin 30° = 20 × 0.5 = 10",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the adjacent side of this right-angled triangle.\n\n${triQ3}`,
      correctAnswer: "7",
      difficulty: 1,
      explanation: "cos 60° = A / 14, so A = 14 × cos 60° = 14 × 0.5 = 7",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the hypotenuse of this right-angled triangle. Round to 1 decimal place.\n\n${triQ4}`,
      correctAnswer: "15.7",
      difficulty: 2,
      explanation: "sin 35° = 9 / H, so H = 9 / sin 35° = 9 / 0.5736 ≈ 15.7",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the opposite side of this 45° right-angled triangle. Give an exact answer.\n\n${triQ5}`,
      correctAnswer: "6",
      difficulty: 2,
      explanation: "tan 45° = O / 6, so O = 6 × tan 45° = 6 × 1 = 6",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the opposite side. Round to 2 decimal places.\n\n${triQ6}`,
      correctAnswer: "11.92",
      difficulty: 2,
      explanation: "tan 50° = O / 10, so O = 10 × tan 50° = 10 × 1.1918 ≈ 11.92",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find both the opposite and adjacent sides of this triangle using exact values. What is the opposite side?\n\n${triQ7}`,
      correctAnswer: "12",
      difficulty: 2,
      explanation: "sin 30° = O / 24, so O = 24 × sin 30° = 24 × 0.5 = 12",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the hypotenuse. Round to 1 decimal place.\n\n${triQ8}`,
      correctAnswer: "23.3",
      difficulty: 3,
      explanation: "sin 40° = 15 / H, so H = 15 / sin 40° = 15 / 0.6428 ≈ 23.3",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Using the special triangle values, find the exact value of the opposite side.\n\n${triQ9}`,
      correctAnswer: "5",
      difficulty: 3,
      explanation: "sin 30° = O / 10, so O = 10 × sin 30° = 10 × 1/2 = 5",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the opposite side using exact values. Give your answer in surd form.\n\n${triQ10}`,
      correctAnswer: "10sqrt(3)",
      difficulty: 3,
      explanation: "sin 60° = O / 20, so O = 20 × sin 60° = 20 × √3/2 = 10√3",
      questionType: "short_answer",
    },
  ]);
  console.log("  Inserted quiz questions for Finding Unknown Sides in Trigonometry.");
}

export async function seedFindingUnknownSidesTrig() {
  console.log("Seeding Finding Unknown Sides in Trigonometry content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Finding Unknown Sides in Trigonometry";

  const existing = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, TOPIC_TITLE),
      ),
    );

  if (existing.length > 0) {
    const topicId = existing[0].id;
    console.log("Finding Unknown Sides topic already exists (id=" + topicId + "). Checking for missing data...");
    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) await insertTopicNotes(topicId);
    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) await insertQuizQuestions(topicId, SUBJECT_ID);
    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const trigRatiosTopic = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, "Trigonometric Ratios"),
      ),
    );
  const prerequisiteId = trigRatiosTopic.length > 0 ? trigRatiosTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Use sine, cosine, and tangent ratios to calculate unknown side lengths in right-angled triangles, including problems with exact values, rounding, and multi-step reasoning.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 19,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  const topicId = topic.id;
  console.log("  Created topic id=" + topicId);

  const labeledTriSvg = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });
  const rearrangedSvg = makeSOHCAHTOARearrangedSvg();
  const triSinExample = makeRightTriangleSvg({ opp: "?", adj: "—", hyp: "20", theta: "30°" });
  const triCosExample = makeRightTriangleSvg({ opp: "—", adj: "?", hyp: "15", theta: "40°" });
  const triHypExample = makeRightTriangleSvg({ opp: "8", adj: "—", hyp: "?", theta: "25°" });
  const triTanExample = makeRightTriangleSvg({ opp: "—", adj: "12", hyp: "—", theta: "55°" });
  const triSin30 = makeRightTriangleSvg({ opp: "?", adj: "—", hyp: "14", theta: "30°" });
  const triMultiStep = makeRightTriangleSvg({ opp: "?", adj: "?", hyp: "20", theta: "35°" });
  const tri30special = makeSpecialTriangleSvg(30);
  const tri45special = makeSpecialTriangleSvg(45);

  const [lesson1] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Setting Up Trig Equations for Unknown Sides",
      orderIndex: 1,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "Labelling Sides and Choosing the Right Ratio",
      content: `To find an unknown side in a right-angled triangle, you need to:\n\n1. **Label the sides** relative to the given angle (not the right angle)\n2. **Identify** what you know and what you need to find\n3. **Choose the ratio** that connects those two sides\n\n${labeledTriSvg}\n\n**Which ratio to use:**\n- Know **H**, need **O** → use **sin** (SOH)\n- Know **H**, need **A** → use **cos** (CAH)\n- Know **A**, need **O** (or vice versa) → use **tan** (TOA)\n- Need **H**, know **O** → rearrange **sin**\n- Need **H**, know **A** → rearrange **cos**\n\n${rearrangedSvg}`,
      orderIndex: 1,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Find the Opposite Using Sin",
      content: `**Example:** Find the opposite side when the hypotenuse = 20 and θ = 30°.\n\n${triSinExample}\n\nWe know the hypotenuse and need the opposite → use **sin**:\n\nsin 30° = O / 20\n\nO = 20 × sin 30°\n\nO = 20 × 0.5 = **10**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Find the Adjacent Using Cos",
      content: `**Example:** Find the adjacent side when the hypotenuse = 15 and θ = 40°.\n\n${triCosExample}\n\nWe know the hypotenuse and need the adjacent → use **cos**:\n\ncos 40° = A / 15\n\nA = 15 × cos 40°\n\nA = 15 × 0.7660 ≈ **11.49**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson1.id,
      type: "practice",
      title: "Your Turn: Set Up and Solve",
      content: `**Q1:** A right triangle has hypotenuse = 18 and angle = 50°. Find the opposite side.\n\nsin 50° = O / 18\nO = 18 × sin 50° = 18 × 0.7660 ≈ **13.79**\n\n**Q2:** A right triangle has hypotenuse = 25 and angle = 35°. Find the adjacent side.\n\ncos 35° = A / 25\nA = 25 × cos 35° = 25 × 0.8192 ≈ **20.48**`,
      orderIndex: 4,
    },
  ]);

  const [lesson2] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Solving for Unknown Sides",
      orderIndex: 2,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "Rearranging Trig Equations",
      content: `Sometimes the unknown side is in the denominator. You need to rearrange:\n\n**Finding the hypotenuse from the opposite side:**\n\nsin θ = O / H\n\nMultiply both sides by H: H × sin θ = O\n\nDivide both sides by sin θ: **H = O / sin θ**\n\n**Finding the adjacent from the opposite (using tan):**\n\ntan θ = O / A\n\nMultiply both sides by A: A × tan θ = O\n\nDivide both sides by tan θ: **A = O / tan θ**\n\n**Key principle:** If the unknown is on top of the fraction, multiply. If it's on the bottom, divide.`,
      orderIndex: 1,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Find the Hypotenuse",
      content: `**Example:** Find the hypotenuse when the opposite = 8 and θ = 25°.\n\n${triHypExample}\n\nsin 25° = 8 / H\n\nH = 8 / sin 25°\n\nH = 8 / 0.4226 ≈ **18.93**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Find the Opposite Using Tan",
      content: `**Example:** Find the opposite side when the adjacent = 12 and θ = 55°.\n\n${triTanExample}\n\ntan 55° = O / 12\n\nO = 12 × tan 55°\n\nO = 12 × 1.4281 ≈ **17.14**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson2.id,
      type: "practice",
      title: "Your Turn: Rearrange and Solve",
      content: `**Q1:** Find the hypotenuse when the adjacent = 10 and θ = 48°.\n\ncos 48° = 10 / H\nH = 10 / cos 48° = 10 / 0.6691 ≈ **14.95**\n\n**Q2:** Find the adjacent when the opposite = 15 and θ = 62°.\n\ntan 62° = 15 / A\nA = 15 / tan 62° = 15 / 1.8807 ≈ **7.98**`,
      orderIndex: 4,
    },
  ]);

  const [lesson3] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Multi-Step and Exact Value Problems",
      orderIndex: 3,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "Exact Values from Special Triangles",
      content: `For special angles (30°, 45°, 60°), you should give **exact** answers using fractions and surds — not decimals.\n\n${tri30special}\n\n${tri45special}\n\n**Key exact values:**\n- sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3\n- sin 45° = √2/2, cos 45° = √2/2, tan 45° = 1\n- sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3\n\nWhen a problem uses one of these angles, give your answer in exact form.`,
      orderIndex: 1,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Finding a Side with sin 30°",
      content: `**Example:** Find the opposite side when the hypotenuse = 14 and θ = 30°.\n\n${triSin30}\n\nsin 30° = O / 14\n\nO = 14 × sin 30° = 14 × 1/2 = **7**\n\nSince sin 30° = 1/2, we get an exact integer answer.`,
      orderIndex: 2,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Using Trig Then Pythagoras",
      content: `**Example:** A right-angled triangle has hypotenuse = 20 and angle = 35°. Find all three sides.\n\n${triMultiStep}\n\n**Step 1:** Find the opposite using sin.\n\nsin 35° = O / 20\nO = 20 × sin 35° = 20 × 0.5736 ≈ 11.47\n\n**Step 2:** Use Pythagoras to find the adjacent.\n\nA² + O² = H²\nA² + 11.47² = 20²\nA² = 400 − 131.56 = 268.44\nA = √268.44 ≈ **16.38**\n\nAlternatively, we could have used cos 35° = A / 20 directly:\nA = 20 × cos 35° ≈ 16.38 ✓`,
      orderIndex: 3,
    },
    {
      lessonId: lesson3.id,
      type: "practice",
      title: "Your Turn: Exact Values and Multi-Step",
      content: `**Q1:** Find the opposite side when hypotenuse = 10 and θ = 60°. Give an exact answer.\n\nsin 60° = O / 10\nO = 10 × √3/2 = **5√3**\n\n**Q2:** A triangle has hypotenuse = 26 and θ = 30°. Find the opposite and then use Pythagoras to find the adjacent.\n\nO = 26 × sin 30° = 26 × 1/2 = 13\nA² + 13² = 26²\nA² = 676 − 169 = 507\nA = √507 = √(169 × 3) = **13√3**`,
      orderIndex: 4,
    },
  ]);

  console.log("  Created 3 lessons with segments.");

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  console.log("Finding Unknown Sides in Trigonometry seeding complete.");
  return topicId;
}
