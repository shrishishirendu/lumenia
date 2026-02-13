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

function makeSOHCAHTOASvg(): string {
  const W = 420, H = 200;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<text x="${W / 2}" y="30" text-anchor="middle" fill="#333" font-size="18" font-weight="bold">SOH CAH TOA</text>`;
  const cols = [
    { label: "SOH", formula: "Sin θ = O / H", color: "#dc2626", x: 70 },
    { label: "CAH", formula: "Cos θ = A / H", color: "#2563eb", x: 210 },
    { label: "TOA", formula: "Tan θ = O / A", color: "#16a34a", x: 350 },
  ];
  for (const col of cols) {
    svg += `<rect x="${col.x - 55}" y="50" width="110" height="70" rx="8" fill="${col.color}15" stroke="${col.color}" stroke-width="1.5"/>`;
    svg += `<text x="${col.x}" y="75" text-anchor="middle" fill="${col.color}" font-size="16" font-weight="bold">${col.label}</text>`;
    svg += `<text x="${col.x}" y="105" text-anchor="middle" fill="#333" font-size="12">${col.formula}</text>`;
  }
  svg += `<text x="${W / 2}" y="155" text-anchor="middle" fill="#666" font-size="12">O = Opposite, A = Adjacent, H = Hypotenuse</text>`;
  svg += `<text x="${W / 2}" y="180" text-anchor="middle" fill="#666" font-size="11" font-style="italic">Relative to the angle θ (not the right angle)</text>`;
  svg += `</svg>`;
  return svg;
}

async function insertTopicNotes(topicId: number) {
  const sohcahtoa = makeSOHCAHTOASvg();
  const tri30 = makeSpecialTriangleSvg(30);
  const tri45 = makeSpecialTriangleSvg(45);
  const labeledTri = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });

  await db.insert(topicNotes).values({
    topicId,
    summary: "Trigonometric ratios (sin, cos, tan) relate the sides and angles of right-angled triangles using SOH CAH TOA. Special angles 30°, 45°, 60° have exact values.",
    notesMarkdown: `## SOH CAH TOA

The three primary trigonometric ratios relate the sides of a right-angled triangle to its angles.

${sohcahtoa}

### Labelling Sides

Always label sides relative to the angle you are working with (not the right angle):

${labeledTri}

- **Opposite**: The side across from the angle θ
- **Adjacent**: The side next to the angle θ (not the hypotenuse)
- **Hypotenuse**: The longest side, opposite the right angle

### The Three Ratios

| Ratio | Formula | Mnemonic |
|-------|---------|----------|
| sin θ | Opposite ÷ Hypotenuse | **S**ome **O**ld **H**orse |
| cos θ | Adjacent ÷ Hypotenuse | **C**aught **A** **H**orse |
| tan θ | Opposite ÷ Adjacent | **T**aking **O**ats **A**way |

### Finding a Missing Side

1. Label the sides (O, A, H) relative to the given angle
2. Choose the ratio that uses the known side and the unknown side
3. Substitute and solve

### Finding a Missing Angle

Use the inverse function:
- θ = sin⁻¹(O/H)
- θ = cos⁻¹(A/H)
- θ = tan⁻¹(O/A)

## Special Angle Triangles

Some angles have exact trigonometric values that you should memorise.

### 30° Triangle (30-60-90)

${tri30}

| | sin | cos | tan |
|---|---|---|---|
| 30° | 1/2 | √3/2 | 1/√3 |
| 60° | √3/2 | 1/2 | √3 |

### 45° Triangle (45-45-90)

${tri45}

| | sin | cos | tan |
|---|---|---|---|
| 45° | √2/2 | √2/2 | 1 |

### Summary Table

| Angle | sin | cos | tan |
|-------|-----|-----|-----|
| 0° | 0 | 1 | 0 |
| 30° | 1/2 | √3/2 | 1/√3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |
| 90° | 1 | 0 | undefined |

### Pythagorean Identity

For any angle θ:

**sin²θ + cos²θ = 1**

This identity follows directly from Pythagoras' theorem.`,
  });
  console.log("  Inserted topic notes for Trigonometric Ratios.");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const tri345 = makeRightTriangleSvg({ opp: "3", adj: "4", hyp: "5", theta: "θ" });
  const tri51213 = makeRightTriangleSvg({ opp: "5", adj: "12", hyp: "13", theta: "θ" });
  const triMissing = makeRightTriangleSvg({ opp: "?", adj: "8", hyp: "10", theta: "30°" });
  const triAlg = makeRightTriangleSvg({ opp: "3x", adj: "4x", hyp: "5x", theta: "θ" });
  const triSpecial = makeSpecialTriangleSvg(60);

  await db.insert(quizQuestions).values([
    {
      topicId,
      subjectId,
      questionText: `In the right-angled triangle shown, find sin θ.\n\n${tri345}`,
      correctAnswer: "3/5",
      difficulty: 1,
      explanation: "sin θ = opposite / hypotenuse = 3/5",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `In the right-angled triangle shown, find cos θ.\n\n${tri345}`,
      correctAnswer: "4/5",
      difficulty: 1,
      explanation: "cos θ = adjacent / hypotenuse = 4/5",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `In the right-angled triangle shown, find tan θ.\n\n${tri345}`,
      correctAnswer: "3/4",
      difficulty: 1,
      explanation: "tan θ = opposite / adjacent = 3/4",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `In the right-angled triangle shown, find sin θ.\n\n${tri51213}`,
      correctAnswer: "5/13",
      difficulty: 1,
      explanation: "sin θ = opposite / hypotenuse = 5/13",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the exact value of sin 60°.\n\n${triSpecial}`,
      correctAnswer: "sqrt(3)/2",
      difficulty: 2,
      explanation: "From the 30-60-90 triangle: sin 60° = √3/2",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the exact value of tan 45°.`,
      correctAnswer: "1",
      difficulty: 2,
      explanation: "From the 45-45-90 triangle: tan 45° = 1/1 = 1",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A triangle has opposite = 3x and adjacent = 4x. Find tan θ.\n\n${triAlg}`,
      correctAnswer: "3/4",
      difficulty: 2,
      explanation: "tan θ = 3x/4x. The x cancels: tan θ = 3/4.",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A right-angled triangle has sides 8, 15, and 17. Verify that sin²θ + cos²θ = 1. What is sin²θ + cos²θ?`,
      correctAnswer: "1",
      difficulty: 3,
      explanation: "sin θ = 8/17, cos θ = 15/17. sin²θ + cos²θ = 64/289 + 225/289 = 289/289 = 1.",
      questionType: "short_answer",
    },
  ]);
  console.log("  Inserted quiz questions for Trigonometric Ratios.");
}

export async function seedTrigonometricRatios() {
  console.log("Seeding Trigonometric Ratios content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Trigonometric Ratios";

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
    console.log("Trigonometric Ratios topic already exists (id=" + topicId + "). Checking for missing data...");
    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) await insertTopicNotes(topicId);
    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) await insertQuizQuestions(topicId, SUBJECT_ID);
    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const simSubTopic = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, "Simultaneous Equations – Substitution"),
      ),
    );
  const prerequisiteId = simSubTopic.length > 0 ? simSubTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Understand and apply sine, cosine, and tangent ratios in right-angled triangles. Calculate missing sides and angles, work with special angles (30°, 45°, 60°), and verify the Pythagorean identity.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 18,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  const topicId = topic.id;
  console.log("  Created topic id=" + topicId);

  const sohcahtoaSvg = makeSOHCAHTOASvg();
  const labeledTriSvg = makeRightTriangleSvg({ opp: "Opposite", adj: "Adjacent", hyp: "Hypotenuse" });
  const tri345Svg = makeRightTriangleSvg({ opp: "3", adj: "4", hyp: "5", theta: "θ" });
  const tri51213Svg = makeRightTriangleSvg({ opp: "5", adj: "12", hyp: "13", theta: "θ" });
  const tri81517Svg = makeRightTriangleSvg({ opp: "8", adj: "15", hyp: "17", theta: "θ" });
  const triMissingSvg = makeRightTriangleSvg({ opp: "?", adj: "10", hyp: "20", theta: "30°" });
  const triMissing2Svg = makeRightTriangleSvg({ opp: "7", adj: "?", hyp: "?", theta: "45°" });

  const [lesson1] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Introduction to Trigonometric Ratios",
      orderIndex: 1,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "What Are Trigonometric Ratios?",
      content: `Trigonometric ratios are relationships between the sides and angles of a right-angled triangle. They allow us to calculate unknown sides or angles when we know some information about the triangle.\n\nThe three primary trigonometric ratios are **sine**, **cosine**, and **tangent**.\n\n${labeledTriSvg}\n\nTo use these ratios, we first need to label the sides of the triangle relative to a specific angle (not the right angle):\n\n- **Hypotenuse (H)**: The longest side, always opposite the right angle\n- **Opposite (O)**: The side directly across from the angle we're working with\n- **Adjacent (A)**: The side next to our angle (that isn't the hypotenuse)`,
      orderIndex: 1,
    },
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "SOH CAH TOA",
      content: `The mnemonic **SOH CAH TOA** helps us remember the three ratios:\n\n${sohcahtoaSvg}\n\n- **SOH**: Sin θ = Opposite / Hypotenuse\n- **CAH**: Cos θ = Adjacent / Hypotenuse\n- **TOA**: Tan θ = Opposite / Adjacent\n\nThese ratios are the same for any right-angled triangle with the same angle θ, regardless of the triangle's size.`,
      orderIndex: 2,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Finding Trigonometric Ratios",
      content: `**Example:** Find sin θ, cos θ, and tan θ for this triangle.\n\n${tri345Svg}\n\nRelative to angle θ:\n- Opposite = 3\n- Adjacent = 4\n- Hypotenuse = 5\n\nUsing SOH CAH TOA:\n- **sin θ** = O/H = 3/5\n- **cos θ** = A/H = 4/5\n- **tan θ** = O/A = 3/4\n\nWe can verify: sin²θ + cos²θ = (3/5)² + (4/5)² = 9/25 + 16/25 = 25/25 = 1 ✓`,
      orderIndex: 3,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Another Example with a 5-12-13 Triangle",
      content: `**Example:** Find sin θ and tan θ for this triangle.\n\n${tri51213Svg}\n\nRelative to angle θ:\n- Opposite = 5\n- Adjacent = 12\n- Hypotenuse = 13\n\n**sin θ** = O/H = 5/13\n**tan θ** = O/A = 5/12`,
      orderIndex: 4,
    },
    {
      lessonId: lesson1.id,
      type: "practice",
      title: "Your Turn: Find the Ratio",
      content: `Find cos θ for the triangle with sides 8, 15, 17.\n\n${tri81517Svg}\n\n**Answer:** cos θ = adjacent / hypotenuse = 15/17`,
      orderIndex: 5,
    },
  ]);

  const [lesson2] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Finding Missing Sides and Angles",
      orderIndex: 2,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "Using Trig Ratios to Find a Missing Side",
      content: `When you know an angle and one side of a right-angled triangle, you can find any other side.\n\n**Steps:**\n1. Label the sides O, A, H relative to the known angle\n2. Identify which sides are known and unknown\n3. Choose the trig ratio that links the known side to the unknown side\n4. Substitute and solve\n\n${triMissingSvg}\n\n**Example:** Find the opposite side when hypotenuse = 20 and θ = 30°.\n\nWe know the hypotenuse and need the opposite, so use **sin**:\n\nsin 30° = opposite / 20\n\n0.5 = opposite / 20\n\nopposite = 0.5 × 20 = **10**`,
      orderIndex: 1,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Finding a Side Using Tangent",
      content: `**Example:** Find the adjacent side when opposite = 7 and θ = 45°.\n\n${triMissing2Svg}\n\nWe know the opposite and need the adjacent, so use **tan**:\n\ntan 45° = 7 / adjacent\n\n1 = 7 / adjacent\n\nadjacent = 7 / 1 = **7**\n\n(This makes sense because in a 45° right triangle, the opposite and adjacent sides are equal!)`,
      orderIndex: 2,
    },
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "Finding a Missing Angle",
      content: `To find a missing angle, use the **inverse** trigonometric functions:\n\n- θ = sin⁻¹(O/H)\n- θ = cos⁻¹(A/H)\n- θ = tan⁻¹(O/A)\n\n**Example:** A triangle has opposite = 3 and hypotenuse = 5. Find θ.\n\nsin θ = 3/5 = 0.6\n\nθ = sin⁻¹(0.6) ≈ **36.87°**\n\nOn your calculator, look for the **sin⁻¹** button (sometimes labelled **arcsin** or **asin**).`,
      orderIndex: 3,
    },
    {
      lessonId: lesson2.id,
      type: "practice",
      title: "Your Turn: Find the Missing Values",
      content: `**Q1:** A right triangle has hypotenuse = 15 and θ = 60°. Find the opposite side.\n\nsin 60° = opp / 15\nopp = 15 × sin 60° = 15 × (√3/2) = **15√3/2 ≈ 12.99**\n\n**Q2:** A triangle has opposite = 5 and adjacent = 12. Find θ.\n\ntan θ = 5/12\nθ = tan⁻¹(5/12) ≈ **22.62°**`,
      orderIndex: 4,
    },
  ]);

  const tri30 = makeSpecialTriangleSvg(30);
  const tri45 = makeSpecialTriangleSvg(45);
  const tri60 = makeSpecialTriangleSvg(60);

  const [lesson3] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Special Angles and the Pythagorean Identity",
      orderIndex: 3,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "Special Angle Values",
      content: `Certain angles have exact trigonometric values that come from special right-angled triangles. You need to know these by heart.\n\n### The 30-60-90 Triangle\n\n${tri30}\n\nFrom this triangle:\n- sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3\n- sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3\n\n### The 45-45-90 Triangle\n\n${tri45}\n\nFrom this triangle:\n- sin 45° = √2/2, cos 45° = √2/2, tan 45° = 1`,
      orderIndex: 1,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Working with Special Angles",
      content: `**Example:** Find the exact value of sin 30° + cos 60°.\n\nFrom our special angles:\n- sin 30° = 1/2\n- cos 60° = 1/2\n\nSo: sin 30° + cos 60° = 1/2 + 1/2 = **1**\n\n**Notice:** sin 30° = cos 60°. This is because 30° and 60° are *complementary* angles (they add to 90°). In general: sin θ = cos(90° − θ).`,
      orderIndex: 2,
    },
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "The Pythagorean Identity",
      content: `For any angle θ in a right-angled triangle:\n\n**sin²θ + cos²θ = 1**\n\nThis follows directly from Pythagoras' theorem:\n\nIf O² + A² = H², then dividing both sides by H²:\n\n(O/H)² + (A/H)² = 1\n\nsin²θ + cos²θ = 1\n\n**Example:** Verify for the 3-4-5 triangle:\n\nsin²θ + cos²θ = (3/5)² + (4/5)² = 9/25 + 16/25 = 25/25 = 1 ✓`,
      orderIndex: 3,
    },
    {
      lessonId: lesson3.id,
      type: "practice",
      title: "Your Turn: Special Angles",
      content: `**Q1:** What is the exact value of tan 60°?\n**Answer:** √3\n\n**Q2:** If sin θ = 3/5, find cos θ using the Pythagorean identity.\nsin²θ + cos²θ = 1\n(3/5)² + cos²θ = 1\n9/25 + cos²θ = 1\ncos²θ = 16/25\ncos θ = **4/5**`,
      orderIndex: 4,
    },
  ]);

  console.log("  Created 3 lessons with segments.");

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  console.log("Trigonometric Ratios seeding complete.");
  return topicId;
}
