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

function makeInverseTrigSvg(): string {
  const W = 420, H = 260;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<text x="${W / 2}" y="28" text-anchor="middle" fill="#333" font-size="18" font-weight="bold">Finding Unknown Angles</text>`;
  const rows = [
    { ratio: "sin θ = O / H", inverse: "θ = sin⁻¹(O / H)", color: "#dc2626" },
    { ratio: "cos θ = A / H", inverse: "θ = cos⁻¹(A / H)", color: "#2563eb" },
    { ratio: "tan θ = O / A", inverse: "θ = tan⁻¹(O / A)", color: "#16a34a" },
  ];
  let y = 55;
  for (const row of rows) {
    svg += `<rect x="15" y="${y}" width="${W - 30}" height="55" rx="8" fill="${row.color}10" stroke="${row.color}" stroke-width="1"/>`;
    svg += `<text x="30" y="${y + 22}" fill="${row.color}" font-size="13" font-weight="bold">${row.ratio}</text>`;
    svg += `<text x="200" y="${y + 22}" fill="#333" font-size="12">→ ${row.inverse}</text>`;
    svg += `<text x="200" y="${y + 42}" fill="#666" font-size="11" font-style="italic">Use when you know the ratio</text>`;
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
  const inverseTrigSvg = makeInverseTrigSvg();
  const labeledTri = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });
  const tri30 = makeSpecialTriangleSvg(30);
  const tri45 = makeSpecialTriangleSvg(45);
  const tri60 = makeSpecialTriangleSvg(60);

  await db.insert(topicNotes).values({
    topicId,
    summary: "Use inverse trigonometric functions (sin⁻¹, cos⁻¹, tan⁻¹) to calculate unknown angles in right-angled triangles, including exact values, decimal approximations, and multi-step problems.",
    notesMarkdown: `## Finding Unknown Angles Using Inverse Trigonometry

When you know two sides of a right-angled triangle, you can find an unknown angle using inverse trigonometric functions.

### Labelling Sides

${labeledTri}

- **Opposite (O)**: The side across from the angle θ
- **Adjacent (A)**: The side next to θ (not the hypotenuse)
- **Hypotenuse (H)**: The longest side, opposite the right angle

### Inverse Trigonometric Functions

${inverseTrigSvg}

The inverse trig functions "undo" the trig ratio to give us the angle:
- **sin⁻¹** (also written arcsin) — use when you know O and H
- **cos⁻¹** (also written arccos) — use when you know A and H
- **tan⁻¹** (also written arctan) — use when you know O and A

### Step-by-Step Method

1. **Label** the sides O, A, H relative to the unknown angle
2. **Identify** which two sides you know
3. **Choose** the inverse trig function that uses those two sides
4. **Calculate** using your calculator (ensure it is in degree mode)
5. **Round** appropriately or give exact values for special angles

### Example: Finding an Angle Using sin⁻¹

Given: opposite = 5, hypotenuse = 10

sin θ = 5 / 10 = 0.5

θ = sin⁻¹(0.5) = **30°**

### Example: Finding an Angle Using tan⁻¹

Given: opposite = 7, adjacent = 7

tan θ = 7 / 7 = 1

θ = tan⁻¹(1) = **45°**

### Special Angle Exact Values (in reverse)

When you get these ratios, recognise the special angle immediately:

${tri30}

${tri45}

${tri60}

| Ratio | Value | Angle |
|-------|-------|-------|
| sin⁻¹(1/2) | | 30° |
| sin⁻¹(√2/2) | | 45° |
| sin⁻¹(√3/2) | | 60° |
| cos⁻¹(√3/2) | | 30° |
| cos⁻¹(√2/2) | | 45° |
| cos⁻¹(1/2) | | 60° |
| tan⁻¹(1/√3) | | 30° |
| tan⁻¹(1) | | 45° |
| tan⁻¹(√3) | | 60° |

### Multi-Step Problems

Sometimes you need to:
1. Use Pythagoras' theorem to find a missing side
2. Then use inverse trig to find the angle

**Example:** A triangle has sides 6 and hypotenuse 10. Find the angle opposite the side of length 6.
- sin θ = 6/10 = 0.6
- θ = sin⁻¹(0.6) ≈ 36.9°

### Finding Both Acute Angles

In a right-angled triangle, the two acute angles always add to 90°.
If one acute angle is θ, the other is **90° − θ**.`,
    keyFormulas: [
      "θ = sin⁻¹(O / H)",
      "θ = cos⁻¹(A / H)",
      "θ = tan⁻¹(O / A)",
      "Two acute angles sum to 90°",
      "a² + b² = c² (Pythagoras)"
    ],
    commonMistakes: [
      "Forgetting to use the inverse function — writing sin(3/5) instead of sin⁻¹(3/5)",
      "Calculator in radian mode instead of degree mode",
      "Using the wrong two sides for the chosen inverse function",
      "Confusing which angle the sides are opposite/adjacent to",
      "Not recognising special angle results (e.g., sin⁻¹(0.5) = 30°)",
      "Rounding intermediate steps too early in multi-step problems"
    ],
  });
  console.log("  Inserted topic notes for Finding Unknown Angles.");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const triQ1 = makeRightTriangleSvg({ opp: "3", adj: "4", hyp: "5", theta: "?" });
  const triQ2 = makeRightTriangleSvg({ opp: "5", adj: "—", hyp: "10", theta: "?" });
  const triQ3 = makeRightTriangleSvg({ opp: "—", adj: "12", hyp: "13", theta: "?" });
  const triQ4 = makeRightTriangleSvg({ opp: "8", adj: "15", hyp: "—", theta: "?" });
  const triQ5 = makeRightTriangleSvg({ opp: "1", adj: "1", hyp: "√2", theta: "?" });
  const triQ6 = makeRightTriangleSvg({ opp: "7", adj: "10", hyp: "—", theta: "?" });
  const triQ7 = makeRightTriangleSvg({ opp: "6", adj: "—", hyp: "10", theta: "?" });
  const triQ8 = makeRightTriangleSvg({ opp: "√3", adj: "1", hyp: "2", theta: "?" });
  const triQ9 = makeRightTriangleSvg({ opp: "9", adj: "12", hyp: "15", theta: "?" });
  const triQ10 = makeRightTriangleSvg({ opp: "5", adj: "5√3", hyp: "10", theta: "?" });

  await db.insert(quizQuestions).values([
    {
      topicId,
      subjectId,
      questionText: `Find the angle θ in this right-angled triangle using tan⁻¹.\n\n${triQ1}`,
      correctAnswer: "36.9",
      difficulty: 1,
      explanation: "tan θ = opposite / adjacent = 3/4 = 0.75. θ = tan⁻¹(0.75) ≈ 36.9°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the angle θ using sin⁻¹.\n\n${triQ2}`,
      correctAnswer: "30",
      difficulty: 1,
      explanation: "sin θ = opposite / hypotenuse = 5/10 = 0.5. θ = sin⁻¹(0.5) = 30°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the angle θ using cos⁻¹.\n\n${triQ3}`,
      correctAnswer: "22.6",
      difficulty: 1,
      explanation: "cos θ = adjacent / hypotenuse = 12/13 ≈ 0.9231. θ = cos⁻¹(0.9231) ≈ 22.6°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the angle θ in this triangle. Round to 1 decimal place.\n\n${triQ4}`,
      correctAnswer: "28.1",
      difficulty: 2,
      explanation: "tan θ = opposite / adjacent = 8/15 ≈ 0.5333. θ = tan⁻¹(0.5333) ≈ 28.1°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Recognise the special angle. What is angle θ?\n\n${triQ5}`,
      correctAnswer: "45",
      difficulty: 1,
      explanation: "tan θ = 1/1 = 1. θ = tan⁻¹(1) = 45° (special angle)",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A ramp rises 7 m vertically over a horizontal distance of 10 m. Find the angle of elevation. Round to 1 decimal place.\n\n${triQ6}`,
      correctAnswer: "35.0",
      difficulty: 2,
      explanation: "tan θ = opposite / adjacent = 7/10 = 0.7. θ = tan⁻¹(0.7) ≈ 35.0°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find angle θ. Then find the other acute angle in the triangle.\n\n${triQ7}\n\nWhat is θ? Round to 1 decimal place.`,
      correctAnswer: "36.9",
      difficulty: 2,
      explanation: "sin θ = 6/10 = 0.6. θ = sin⁻¹(0.6) ≈ 36.9°. The other acute angle = 90° − 36.9° = 53.1°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Identify the special angle θ from this triangle with exact surd values.\n\n${triQ8}`,
      correctAnswer: "60",
      difficulty: 3,
      explanation: "sin θ = √3/2, which is the exact value for sin 60°. Therefore θ = 60°",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A right triangle has sides 9, 12, and 15. Find both acute angles. What is the smaller angle? Round to 1 decimal place.\n\n${triQ9}`,
      correctAnswer: "36.9",
      difficulty: 3,
      explanation: "tan θ = 9/12 = 0.75. θ = tan⁻¹(0.75) ≈ 36.9°. The other angle = 90° − 36.9° = 53.1°. The smaller angle is 36.9°.",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Using special triangle values, find the angle θ in this triangle.\n\n${triQ10}`,
      correctAnswer: "30",
      difficulty: 3,
      explanation: "sin θ = opposite / hypotenuse = 5/10 = 1/2. θ = sin⁻¹(1/2) = 30°. We can verify: cos 30° = 5√3/10 = √3/2 ✓",
      questionType: "short_answer",
    },
  ]);
  console.log("  Inserted quiz questions for Finding Unknown Angles.");
}

export async function seedFindingUnknownAngles() {
  console.log("Seeding Finding Unknown Angles content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Finding Unknown Angles";

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
    console.log("Finding Unknown Angles topic already exists (id=" + topicId + "). Checking for missing data...");
    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) await insertTopicNotes(topicId);
    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) await insertQuizQuestions(topicId, SUBJECT_ID);
    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const prereqTopic = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, "Finding Unknown Sides in Trigonometry"),
      ),
    );
  const prerequisiteId = prereqTopic.length > 0 ? prereqTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Use inverse trigonometric functions (sin⁻¹, cos⁻¹, tan⁻¹) to calculate unknown angles in right-angled triangles, including exact values, decimal approximations, and multi-step problems.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 20,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  const topicId = topic.id;
  console.log("  Created topic id=" + topicId);

  const labeledTriSvg = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });
  const inverseTrigSvg = makeInverseTrigSvg();
  const triSinExample = makeRightTriangleSvg({ opp: "5", adj: "—", hyp: "10", theta: "?" });
  const triCosExample = makeRightTriangleSvg({ opp: "—", adj: "7", hyp: "10", theta: "?" });
  const triTanExample = makeRightTriangleSvg({ opp: "8", adj: "6", hyp: "—", theta: "?" });
  const triElevation = makeRightTriangleSvg({ opp: "50", adj: "120", hyp: "—", theta: "?" });
  const tri30special = makeSpecialTriangleSvg(30);
  const tri45special = makeSpecialTriangleSvg(45);
  const tri60special = makeSpecialTriangleSvg(60);
  const triPythag = makeRightTriangleSvg({ opp: "8", adj: "?", hyp: "10", theta: "?" });
  const triBothAngles = makeRightTriangleSvg({ opp: "5", adj: "12", hyp: "13", theta: "?" });

  const [lesson1] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Introduction to Inverse Trigonometric Functions",
      orderIndex: 1,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "What Are Inverse Trigonometric Functions?",
      content: `When we know two sides of a right-angled triangle, we can find an unknown angle using **inverse trigonometric functions**.\n\nThese functions "undo" the trig ratio:\n- **sin** takes an angle and gives a ratio → **sin⁻¹** takes a ratio and gives an angle\n- **cos** takes an angle and gives a ratio → **cos⁻¹** takes a ratio and gives an angle\n- **tan** takes an angle and gives a ratio → **tan⁻¹** takes a ratio and gives an angle\n\n${inverseTrigSvg}\n\n**Notation:** sin⁻¹ is also written as **arcsin**. Similarly for cos⁻¹ (arccos) and tan⁻¹ (arctan).\n\n⚠️ **Important:** sin⁻¹ does NOT mean 1/sin. It means the inverse function.\n\n${labeledTriSvg}\n\n**Which inverse function to use:**\n- Know **O** and **H** → use **sin⁻¹(O/H)**\n- Know **A** and **H** → use **cos⁻¹(A/H)**\n- Know **O** and **A** → use **tan⁻¹(O/A)**`,
      orderIndex: 1,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Find an Angle Using sin⁻¹",
      content: `**Example:** Find the angle θ when the opposite = 5 and hypotenuse = 10.\n\n${triSinExample}\n\nWe know the opposite and hypotenuse → use **sin⁻¹**:\n\nsin θ = O / H = 5 / 10 = 0.5\n\nθ = sin⁻¹(0.5) = **30°**\n\nThis is a special angle! sin⁻¹(0.5) = 30° exactly.`,
      orderIndex: 2,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Find an Angle Using cos⁻¹",
      content: `**Example:** Find the angle θ when the adjacent = 7 and hypotenuse = 10.\n\n${triCosExample}\n\nWe know the adjacent and hypotenuse → use **cos⁻¹**:\n\ncos θ = A / H = 7 / 10 = 0.7\n\nθ = cos⁻¹(0.7) ≈ **45.6°**\n\nSince 0.7 is not a special ratio, we get a decimal answer.`,
      orderIndex: 3,
    },
    {
      lessonId: lesson1.id,
      type: "practice",
      title: "Your Turn: Use Inverse Trig",
      content: `**Q1:** A right triangle has opposite = 6 and hypotenuse = 12. Find the angle.\n\nsin θ = 6 / 12 = 0.5\nθ = sin⁻¹(0.5) = **30°**\n\n**Q2:** A right triangle has adjacent = 9 and hypotenuse = 18. Find the angle.\n\ncos θ = 9 / 18 = 0.5\nθ = cos⁻¹(0.5) = **60°**`,
      orderIndex: 4,
    },
  ]);

  const [lesson2] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Calculating Unknown Angles",
      orderIndex: 2,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "Choosing the Right Inverse Function",
      content: `To find an unknown angle, follow these steps:\n\n1. **Label** the sides O, A, H relative to the unknown angle\n2. **Identify** which two sides you know\n3. **Choose** the correct inverse function:\n   - O and H known → **sin⁻¹(O/H)**\n   - A and H known → **cos⁻¹(A/H)**\n   - O and A known → **tan⁻¹(O/A)**\n4. **Calculate** the ratio first, then apply the inverse function\n5. **Round** to the required number of decimal places\n\n**Calculator tip:** Make sure your calculator is in **degree mode** (not radians). Look for a DEG indicator on the screen.`,
      orderIndex: 1,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Find an Angle Using tan⁻¹",
      content: `**Example:** Find the angle θ when opposite = 8 and adjacent = 6.\n\n${triTanExample}\n\nWe know the opposite and adjacent → use **tan⁻¹**:\n\ntan θ = O / A = 8 / 6 = 1.333...\n\nθ = tan⁻¹(1.333...) ≈ **53.1°**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Angle of Elevation — Real-World Context",
      content: `**Example:** A person stands 120 m from the base of a cliff. The cliff is 50 m tall. Find the angle of elevation from the person to the top of the cliff.\n\n${triElevation}\n\nThe vertical height is the opposite side and the horizontal distance is the adjacent side:\n\ntan θ = O / A = 50 / 120 = 0.4167\n\nθ = tan⁻¹(0.4167) ≈ **22.6°**\n\nThe angle of elevation is approximately 22.6°.`,
      orderIndex: 3,
    },
    {
      lessonId: lesson2.id,
      type: "practice",
      title: "Your Turn: Calculate Angles",
      content: `**Q1:** A right triangle has opposite = 11 and adjacent = 15. Find the angle. Round to 1 decimal place.\n\ntan θ = 11/15 ≈ 0.7333\nθ = tan⁻¹(0.7333) ≈ **36.3°**\n\n**Q2:** A ladder leans against a wall. The foot of the ladder is 3 m from the wall and the ladder is 5 m long. Find the angle between the ladder and the ground.\n\ncos θ = 3/5 = 0.6\nθ = cos⁻¹(0.6) ≈ **53.1°**`,
      orderIndex: 4,
    },
  ]);

  const [lesson3] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Special Angles and Multi-Step Angle Problems",
      orderIndex: 3,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "Recognising Special Angles from Exact Ratios",
      content: `When you calculate a trig ratio and get one of these exact values, you should recognise the special angle immediately — no calculator needed!\n\n${tri30special}\n\n${tri45special}\n\n${tri60special}\n\n**Special angle ratios to recognise:**\n\n| Ratio | Result | Angle |\n|-------|--------|-------|\n| sin⁻¹(1/2) | | 30° |\n| sin⁻¹(√2/2) | | 45° |\n| sin⁻¹(√3/2) | | 60° |\n| cos⁻¹(√3/2) | | 30° |\n| cos⁻¹(1/2) | | 60° |\n| tan⁻¹(1/√3) | | 30° |\n| tan⁻¹(1) | | 45° |\n| tan⁻¹(√3) | | 60° |`,
      orderIndex: 1,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Using Pythagoras Then Inverse Trig",
      content: `**Example:** A right triangle has one side = 8 and hypotenuse = 10. Find the angle opposite the side of length 8.\n\n${triPythag}\n\n**Step 1:** Find the missing side using Pythagoras:\n\nA² + 8² = 10²\nA² = 100 − 64 = 36\nA = 6\n\n**Step 2:** Now we know all three sides. Find the angle using sin⁻¹:\n\nsin θ = O / H = 8 / 10 = 0.8\n\nθ = sin⁻¹(0.8) ≈ **53.1°**\n\nAlternatively, we could use tan⁻¹(8/6) ≈ 53.1° ✓`,
      orderIndex: 2,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Finding Both Acute Angles",
      content: `**Example:** Find both acute angles in a right triangle with sides 5, 12, and 13.\n\n${triBothAngles}\n\n**Angle θ (at bottom-left):**\n\ntan θ = O / A = 5 / 12 ≈ 0.4167\n\nθ = tan⁻¹(0.4167) ≈ **22.6°**\n\n**The other acute angle:**\n\n90° − 22.6° = **67.4°**\n\n**Verification:** We can check: tan 67.4° = 12/5 = 2.4, and tan⁻¹(2.4) ≈ 67.4° ✓\n\nThe three angles of the triangle are: 22.6°, 67.4°, and 90°.\nSum: 22.6 + 67.4 + 90 = 180° ✓`,
      orderIndex: 3,
    },
    {
      lessonId: lesson3.id,
      type: "practice",
      title: "Your Turn: Multi-Step and Special Angles",
      content: `**Q1:** A triangle has opposite = 1 and hypotenuse = 2. What is the angle? (Recognise the special angle!)\n\nsin θ = 1/2\nθ = sin⁻¹(1/2) = **30°**\n\n**Q2:** A right triangle has sides 6, 8, and 10. Find both acute angles.\n\ntan θ = 6/8 = 0.75\nθ = tan⁻¹(0.75) ≈ **36.9°**\nOther angle = 90° − 36.9° = **53.1°**`,
      orderIndex: 4,
    },
  ]);

  console.log("  Created 3 lessons with segments.");

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  console.log("Finding Unknown Angles seeding complete.");
  return topicId;
}
