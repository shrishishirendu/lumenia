import { db } from "../db";
import { topics, lessons, lessonSegments, quizQuestions, topicNotes } from "@shared/schema";
import { eq, and } from "drizzle-orm";

function makeRectangularPrismSvg(opts: {
  l: string; w: string; h: string;
  width?: number; height?: number;
}): string {
  const W = opts.width || 420;
  const H = opts.height || 300;
  const ox = 60, oy = 40;
  const bw = 180, bh = 120, bd = 80;

  const x0 = ox;
  const y0 = oy + bd;
  const x1 = ox + bw;
  const y1 = y0;
  const x2 = x1;
  const y2 = y0 + bh;
  const x3 = ox;
  const y3 = y2;

  const tx0 = x0 + bd * 0.7;
  const ty0 = y0 - bd * 0.6;
  const tx1 = x1 + bd * 0.7;
  const ty1 = y1 - bd * 0.6;
  const tx2 = tx1;
  const ty2 = ty1 + bh;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${x0},${y0} ${x1},${y1} ${tx1},${ty1} ${tx0},${ty0}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" stroke-linejoin="round"/>`;
  svg += `<polygon points="${x1},${y1} ${tx1},${ty1} ${tx2},${ty2} ${x2},${y2}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5" stroke-linejoin="round"/>`;
  svg += `<polygon points="${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="#e8f0fe" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>`;

  svg += `<line x1="${x0}" y1="${y0}" x2="${tx0}" y2="${ty0}" stroke="#2563eb" stroke-width="1.5"/>`;
  svg += `<line x1="${tx0}" y1="${ty0}" x2="${tx1}" y2="${ty1}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${tx0}" y1="${ty0}" x2="${tx0}" y2="${ty0 + bh}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,4"/>`;

  svg += `<text x="${(x0 + x1) / 2}" y="${y3 + 22}" text-anchor="middle" fill="#2563eb" font-size="14" font-weight="bold">${opts.l}</text>`;
  svg += `<text x="${x2 + 16}" y="${(y1 + y2) / 2}" text-anchor="start" fill="#16a34a" font-size="14" font-weight="bold">${opts.h}</text>`;
  svg += `<text x="${(x1 + tx1) / 2 + 14}" y="${(y1 + ty1) / 2}" text-anchor="start" fill="#9333ea" font-size="14" font-weight="bold">${opts.w}</text>`;

  svg += `</svg>`;
  return svg;
}

function makeTriangularPrismSvg(opts: {
  base: string; height: string; length: string;
  slant?: string;
  width?: number; svgHeight?: number;
}): string {
  const W = opts.width || 420;
  const H = opts.svgHeight || 300;

  const ax = 60, ay = H - 60;
  const bx = 200, by = ay;
  const cx = 130, cy = 80;

  const depth = 120;
  const dx = ax + depth * 0.65;
  const dy = ay - depth * 0.35;
  const ex = bx + depth * 0.65;
  const ey = by - depth * 0.35;
  const fx = cx + depth * 0.65;
  const fy = cy - depth * 0.35;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;

  svg += `<polygon points="${ax},${ay} ${bx},${by} ${ex},${ey} ${dx},${dy}" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" stroke-linejoin="round"/>`;
  svg += `<polygon points="${bx},${by} ${cx},${cy} ${fx},${fy} ${ex},${ey}" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5" stroke-linejoin="round"/>`;
  svg += `<polygon points="${cx},${cy} ${fx},${fy} ${dx},${dy} ${ax},${ay}" fill="#d1fae5" stroke="#16a34a" stroke-width="1.5" stroke-linejoin="round"/>`;
  svg += `<polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" fill="#e8f0fe" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>`;

  svg += `<line x1="${dx}" y1="${dy}" x2="${ex}" y2="${ey}" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="6,4"/>`;
  svg += `<line x1="${dx}" y1="${dy}" x2="${fx}" y2="${fy}" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="6,4"/>`;

  svg += `<text x="${(ax + bx) / 2}" y="${ay + 22}" text-anchor="middle" fill="#2563eb" font-size="14" font-weight="bold">${opts.base}</text>`;
  svg += `<text x="${ax - 18}" y="${(ay + cy) / 2}" text-anchor="end" fill="#dc2626" font-size="14" font-weight="bold">${opts.height}</text>`;
  svg += `<text x="${(ax + dx) / 2 - 10}" y="${(ay + dy) / 2 + 16}" text-anchor="end" fill="#9333ea" font-size="14" font-weight="bold">${opts.length}</text>`;
  if (opts.slant) {
    svg += `<text x="${(bx + cx) / 2 + 14}" y="${(by + cy) / 2}" text-anchor="start" fill="#ea580c" font-size="13" font-weight="bold">${opts.slant}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

function makePrismNetSvg(opts: {
  l: string; w: string; h: string;
  width?: number; svgHeight?: number;
}): string {
  const W = opts.width || 440;
  const H = opts.svgHeight || 340;

  const faceW = 70, faceH = 50, faceD = 45;
  const startX = 40, startY = 60;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<text x="${W / 2}" y="24" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Net of a Rectangular Prism</text>`;

  const cx = startX + faceW;
  const cy = startY;

  svg += `<rect x="${cx}" y="${cy - faceD}" width="${faceW}" height="${faceD}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx + faceW / 2}" y="${cy - faceD / 2 + 4}" text-anchor="middle" fill="#2563eb" font-size="11" font-weight="bold">Top (${opts.l}×${opts.w})</text>`;

  svg += `<rect x="${cx - faceW}" y="${cy}" width="${faceW}" height="${faceH}" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx - faceW / 2}" y="${cy + faceH / 2 + 4}" text-anchor="middle" fill="#16a34a" font-size="11" font-weight="bold">Left (${opts.w}×${opts.h})</text>`;

  svg += `<rect x="${cx}" y="${cy}" width="${faceW}" height="${faceH}" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx + faceW / 2}" y="${cy + faceH / 2 + 4}" text-anchor="middle" fill="#d97706" font-size="11" font-weight="bold">Front (${opts.l}×${opts.h})</text>`;

  svg += `<rect x="${cx + faceW}" y="${cy}" width="${faceW}" height="${faceH}" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx + faceW + faceW / 2}" y="${cy + faceH / 2 + 4}" text-anchor="middle" fill="#16a34a" font-size="11" font-weight="bold">Right (${opts.w}×${opts.h})</text>`;

  svg += `<rect x="${cx + 2 * faceW}" y="${cy}" width="${faceW}" height="${faceH}" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx + 2 * faceW + faceW / 2}" y="${cy + faceH / 2 + 4}" text-anchor="middle" fill="#d97706" font-size="11" font-weight="bold">Back (${opts.l}×${opts.h})</text>`;

  svg += `<rect x="${cx}" y="${cy + faceH}" width="${faceW}" height="${faceD}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" rx="2"/>`;
  svg += `<text x="${cx + faceW / 2}" y="${cy + faceH + faceD / 2 + 4}" text-anchor="middle" fill="#2563eb" font-size="11" font-weight="bold">Bottom (${opts.l}×${opts.w})</text>`;

  svg += `</svg>`;
  return svg;
}

async function insertTopicNotes(topicId: number) {
  const rectPrismSvg = makeRectangularPrismSvg({ l: "l", w: "w", h: "h" });
  const triPrismSvg = makeTriangularPrismSvg({ base: "b", height: "h", length: "L" });
  const netSvg = makePrismNetSvg({ l: "l", w: "w", h: "h" });

  await db.insert(topicNotes).values({
    topicId,
    summary: "Calculate the total surface area of prisms by identifying faces, using nets, and applying area formulas for rectangular, triangular, and other prisms.",
    notesMarkdown: `## Surface Area of Prisms

A **prism** is a 3D shape with a constant cross-section along its length. The two identical ends are called the **bases**, and the other faces are **lateral faces** (rectangles).

### Rectangular Prism

${rectPrismSvg}

A rectangular prism has 6 faces: 3 pairs of identical rectangles.

**SA = 2(lw + lh + wh)**

where l = length, w = width, h = height.

### Net of a Rectangular Prism

A **net** is a 2D pattern that folds into the 3D shape. Unfolding a rectangular prism reveals all 6 faces:

${netSvg}

### Triangular Prism

${triPrismSvg}

A triangular prism has 5 faces: 2 triangular bases + 3 rectangular lateral faces.

**SA = 2 × (area of triangular base) + perimeter of triangle × length**

### General Prism Formula

For any prism with cross-sectional area A and perimeter P:

**SA = 2A + P × L**

where L is the length (depth) of the prism.

### Step-by-Step Method

1. **Identify** the shape of the cross-section (base)
2. **Calculate** the area of the cross-section
3. **Multiply** by 2 (for both ends)
4. **Find** the perimeter of the cross-section
5. **Multiply** perimeter by the length of the prism
6. **Add** both results together

### Example: Rectangular Prism

Dimensions: l = 8 cm, w = 5 cm, h = 3 cm

SA = 2(8×5 + 8×3 + 5×3)
SA = 2(40 + 24 + 15)
SA = 2 × 79
SA = **158 cm²**

### Example: Triangular Prism

Right-triangle base with legs 6 cm and 8 cm, hypotenuse 10 cm, length 12 cm.

Area of triangle = ½ × 6 × 8 = 24 cm²
Perimeter = 6 + 8 + 10 = 24 cm

SA = 2 × 24 + 24 × 12
SA = 48 + 288
SA = **336 cm²**`,
    keyFormulas: [
      "SA = 2(lw + lh + wh) — rectangular prism",
      "SA = 2 × (cross-section area) + perimeter × length — general prism",
      "Triangle area = ½ × base × height",
    ],
    commonMistakes: [
      "Forgetting to count all faces — a rectangular prism has 6 faces, a triangular prism has 5",
      "Mixing up area and perimeter when calculating lateral faces",
      "Forgetting the 2 end faces (bases) of the prism",
      "Using the wrong height for the triangle — must be the perpendicular height, not the slant side",
      "Forgetting to include units² in the final answer",
    ],
  });
  console.log("  Inserted topic notes for Surface Area of Prisms.");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const q1Svg = makeRectangularPrismSvg({ l: "5 cm", w: "5 cm", h: "5 cm" });
  const q2Svg = makeRectangularPrismSvg({ l: "8 cm", w: "4 cm", h: "3 cm" });
  const q3Svg = makeTriangularPrismSvg({ base: "6 cm", height: "4 cm", length: "10 cm", slant: "5 cm" });
  const q4Svg = makeRectangularPrismSvg({ l: "10 cm", w: "6 cm", h: "4 cm" });
  const q5Svg = makeTriangularPrismSvg({ base: "8 cm", height: "3 cm", length: "12 cm", slant: "5 cm" });
  const q6Svg = makeRectangularPrismSvg({ l: "12 cm", w: "5 cm", h: "?", });
  const q7Svg = makeTriangularPrismSvg({ base: "10 cm", height: "?", length: "15 cm", slant: "13 cm" });
  const q8Svg = makeRectangularPrismSvg({ l: "2.5 m", w: "1.5 m", h: "1 m" });
  const q9Svg = makeRectangularPrismSvg({ l: "6 cm", w: "6 cm", h: "10 cm" });
  const q10Svg = makeTriangularPrismSvg({ base: "6 cm", height: "5.2 cm", length: "14 cm" });

  await db.insert(quizQuestions).values([
    {
      topicId,
      subjectId,
      questionText: `Find the surface area of this cube.\n\n${q1Svg}`,
      correctAnswer: "150",
      difficulty: 1,
      explanation: "A cube has 6 identical faces. Each face = 5 × 5 = 25 cm². SA = 6 × 25 = 150 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the surface area of this rectangular prism (in cm²).\n\n${q2Svg}`,
      correctAnswer: "136",
      difficulty: 1,
      explanation: "SA = 2(lw + lh + wh) = 2(8×4 + 8×3 + 4×3) = 2(32 + 24 + 12) = 2 × 68 = 136 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `How many faces does a triangular prism have?`,
      correctAnswer: "5",
      difficulty: 1,
      explanation: "A triangular prism has 2 triangular bases and 3 rectangular lateral faces = 5 faces total.",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `Find the total surface area of this triangular prism (in cm²). The cross-section is an isosceles triangle with base 6 cm, equal sides 5 cm, and perpendicular height 4 cm. The prism length is 10 cm.\n\n${q3Svg}`,
      correctAnswer: "184",
      difficulty: 2,
      explanation: "Triangle area = ½ × 6 × 4 = 12 cm². Perimeter = 6 + 5 + 5 = 16 cm. SA = 2(12) + 16(10) = 24 + 160 = 184 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A gift box is shaped like a rectangular prism with dimensions 10 cm × 6 cm × 4 cm. How much wrapping paper is needed to cover the entire box (in cm²)?\n\n${q4Svg}`,
      correctAnswer: "248",
      difficulty: 2,
      explanation: "SA = 2(lw + lh + wh) = 2(10×6 + 10×4 + 6×4) = 2(60 + 40 + 24) = 2 × 124 = 248 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A triangular prism has a right-triangle cross-section with legs 3 cm and 4 cm, and hypotenuse 5 cm. The prism length is 12 cm. Find the total surface area (in cm²).\n\n${q5Svg}`,
      correctAnswer: "156",
      difficulty: 2,
      explanation: "Triangle area = ½ × 3 × 4 = 6 cm². Perimeter = 3 + 4 + 5 = 12 cm. SA = 2(6) + 12(12) = 12 + 144 = 156 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A rectangular prism has length 12 cm, width 5 cm, and a total surface area of 358 cm². Find the height (in cm).\n\n${q6Svg}`,
      correctAnswer: "7",
      difficulty: 2,
      explanation: "SA = 2(lw + lh + wh) → 358 = 2(12×5 + 12h + 5h) → 179 = 60 + 17h → 17h = 119 → h = 7 cm.",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A triangular prism has an isosceles triangle cross-section with base 10 cm and equal sides of 13 cm each. The prism length is 15 cm. Use Pythagoras to find the triangle height, then calculate the total surface area (in cm²).\n\n${q7Svg}`,
      correctAnswer: "660",
      difficulty: 3,
      explanation: "Height of triangle: h² + 5² = 13², h² = 169 - 25 = 144, h = 12 cm. Triangle area = ½ × 10 × 12 = 60 cm². Perimeter = 10 + 13 + 13 = 36 cm. SA = 2(60) + 36(15) = 120 + 540 = 660 cm².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A storage container is a rectangular prism measuring 2.5 m × 1.5 m × 1 m. Find the total surface area in m².\n\n${q8Svg}`,
      correctAnswer: "15.5",
      difficulty: 2,
      explanation: "SA = 2(2.5×1.5 + 2.5×1 + 1.5×1) = 2(3.75 + 2.5 + 1.5) = 2 × 7.75 = 15.5 m².",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A rectangular prism has a square base of side 6 cm and height 10 cm. Find its total surface area (in cm²).\n\n${q9Svg}`,
      correctAnswer: "312",
      difficulty: 1,
      explanation: "SA = 2(6×6) + 4(6×10) = 2(36) + 4(60) = 72 + 240 = 312 cm².",
      questionType: "short_answer",
    },
  ]);
  console.log("  Inserted quiz questions for Surface Area of Prisms.");
}

export async function seedSurfaceAreaOfPrisms() {
  console.log("Seeding Surface Area of Prisms content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Surface Area of Prisms";

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
    console.log("Surface Area of Prisms topic already exists (id=" + topicId + "). Checking for missing data...");
    const existingNotes = await db.select().from(topicNotes).where(eq(topicNotes.topicId, topicId));
    if (existingNotes.length === 0) await insertTopicNotes(topicId);
    const existingQuestions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, topicId));
    if (existingQuestions.length === 0) await insertQuizQuestions(topicId, SUBJECT_ID);
    console.log("  All data present. Skipping seed.");
    return topicId;
  }

  const trigAppsTopic = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, SUBJECT_ID),
        eq(topics.gradeLevel, GRADE_LEVEL),
        eq(topics.title, "Trigonometry Applications"),
      ),
    );
  const prerequisiteId = trigAppsTopic.length > 0 ? trigAppsTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Calculate the total surface area of prisms by identifying faces, using nets, and applying area formulas for rectangular, triangular, and other prisms.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 22,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  const topicId = topic.id;
  console.log("  Created topic id=" + topicId);

  const rectPrismSvg = makeRectangularPrismSvg({ l: "l", w: "w", h: "h" });
  const netSvg = makePrismNetSvg({ l: "l", w: "w", h: "h" });
  const triPrismSvg = makeTriangularPrismSvg({ base: "b", height: "h", length: "L" });
  const rectExampleSvg = makeRectangularPrismSvg({ l: "8 cm", w: "5 cm", h: "3 cm" });
  const netExampleSvg = makePrismNetSvg({ l: "8", w: "5", h: "3" });
  const triNetExampleSvg = makeTriangularPrismSvg({ base: "6 cm", height: "4 cm", length: "10 cm", slant: "5 cm" });
  const rectFormulaExSvg = makeRectangularPrismSvg({ l: "10 cm", w: "4 cm", h: "6 cm" });
  const rectWrappingSvg = makeRectangularPrismSvg({ l: "30 cm", w: "20 cm", h: "10 cm" });
  const triRightSvg = makeTriangularPrismSvg({ base: "6 cm", height: "8 cm", length: "15 cm", slant: "10 cm" });
  const triPythagSvg = makeTriangularPrismSvg({ base: "10 cm", height: "?", length: "20 cm", slant: "13 cm" });

  const [lesson1] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Understanding Prisms and Their Nets",
      orderIndex: 1,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "What Is a Prism?",
      content: `A **prism** is a 3D solid with a uniform cross-section along its entire length. This means if you slice it anywhere along its length, you always get the same shape.\n\nThe two identical ends are called the **bases** (or cross-sections), and the flat sides connecting them are called **lateral faces** — which are always rectangles.\n\n**Types of prisms:**\n- **Rectangular prism** (box) — cross-section is a rectangle\n- **Triangular prism** — cross-section is a triangle\n- **Pentagonal prism** — cross-section is a pentagon\n- **Hexagonal prism** — cross-section is a hexagon\n\n${rectPrismSvg}\n\nA **net** is a 2D pattern that folds up to make the 3D shape. Unfolding a prism shows every face laid flat — this makes it easy to calculate the total surface area.\n\n${netSvg}`,
      orderIndex: 1,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Rectangular Prism Net — 6 Faces",
      content: `**Example:** Unfold a rectangular prism with l = 8 cm, w = 5 cm, h = 3 cm.\n\n${rectExampleSvg}\n\nWhen we unfold it, we get 6 rectangles:\n\n${netExampleSvg}\n\nThe 6 faces are:\n- **Top and Bottom**: 8 × 5 = 40 cm² each → 2 × 40 = 80 cm²\n- **Front and Back**: 8 × 3 = 24 cm² each → 2 × 24 = 48 cm²\n- **Left and Right**: 5 × 3 = 15 cm² each → 2 × 15 = 30 cm²\n\n**Total SA** = 80 + 48 + 30 = **158 cm²**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Triangular Prism Net — 5 Faces",
      content: `**Example:** Identify the faces of a triangular prism with base 6 cm, height 4 cm, slant sides 5 cm, and length 10 cm.\n\n${triNetExampleSvg}\n\nA triangular prism has **5 faces**:\n- **2 triangular bases**: Each has area = ½ × 6 × 4 = 12 cm²\n- **3 rectangular lateral faces**: These connect corresponding sides of the two triangles\n  - Bottom rectangle: 6 × 10 = 60 cm²\n  - Left rectangle: 5 × 10 = 50 cm²\n  - Right rectangle: 5 × 10 = 50 cm²\n\n**Total SA** = 2(12) + 60 + 50 + 50 = 24 + 160 = **184 cm²**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson1.id,
      type: "practice",
      title: "Your Turn: Identify and Count",
      content: `**Q1:** How many faces does a pentagonal prism have?\n\n**Answer:** 7 faces — 2 pentagonal bases + 5 rectangular lateral faces.\n\n**Q2:** A hexagonal prism is unfolded into a net. How many rectangles and how many hexagons are in the net?\n\n**Answer:** 6 rectangles + 2 hexagons = 8 shapes total.`,
      orderIndex: 4,
    },
  ]);

  const [lesson2] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Surface Area of Rectangular Prisms",
      orderIndex: 2,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "The Rectangular Prism Formula",
      content: `A rectangular prism has **3 pairs of identical rectangular faces**:\n- 2 faces of size l × w (top and bottom)\n- 2 faces of size l × h (front and back)\n- 2 faces of size w × h (left and right)\n\nSo the total surface area formula is:\n\n**SA = 2(lw + lh + wh)**\n\nwhere:\n- l = length\n- w = width\n- h = height\n\n${rectPrismSvg}\n\n**Why does this work?** Each pair of opposite faces is identical, so we calculate the area of one face from each pair, add them, then multiply by 2.`,
      orderIndex: 1,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Calculate SA of a Box",
      content: `**Example:** Find the surface area of a rectangular prism with l = 10 cm, w = 4 cm, h = 6 cm.\n\n${rectFormulaExSvg}\n\nUsing SA = 2(lw + lh + wh):\n\nSA = 2(10 × 4 + 10 × 6 + 4 × 6)\nSA = 2(40 + 60 + 24)\nSA = 2 × 124\nSA = **248 cm²**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Real-World: Wrapping Paper",
      content: `**Example:** A gift box measures 30 cm × 20 cm × 10 cm. How much wrapping paper is needed to cover the entire box?\n\n${rectWrappingSvg}\n\nSA = 2(lw + lh + wh)\nSA = 2(30 × 20 + 30 × 10 + 20 × 10)\nSA = 2(600 + 300 + 200)\nSA = 2 × 1100\nSA = **2200 cm²**\n\nYou would need at least **2200 cm²** of wrapping paper (plus some extra for overlapping and folding).`,
      orderIndex: 3,
    },
    {
      lessonId: lesson2.id,
      type: "practice",
      title: "Your Turn: Rectangular Prisms",
      content: `**Q1:** Find the surface area of a cube with side length 7 cm.\n\nSA = 6 × 7² = 6 × 49 = **294 cm²**\n\n**Q2:** A box has dimensions 12 cm × 8 cm × 5 cm. Find the SA.\n\nSA = 2(12×8 + 12×5 + 8×5) = 2(96 + 60 + 40) = 2 × 196 = **392 cm²**`,
      orderIndex: 4,
    },
  ]);

  const [lesson3] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Surface Area of Triangular and Other Prisms",
      orderIndex: 3,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "General Prism SA Formula",
      content: `For any prism, the surface area formula is:\n\n**SA = 2 × (area of cross-section) + (perimeter of cross-section) × length**\n\nOr more concisely: **SA = 2A + PL**\n\nwhere:\n- A = area of the cross-section (base)\n- P = perimeter of the cross-section\n- L = length (depth) of the prism\n\n${triPrismSvg}\n\nFor triangular prisms, you need to find the **triangle area** using:\n- **½ × base × height** (if the perpendicular height is known)\n- **Heron's formula** (if only the three sides are known): A = √[s(s−a)(s−b)(s−c)] where s = (a+b+c)/2`,
      orderIndex: 1,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Triangular Prism with Right-Triangle Cross-Section",
      content: `**Example:** A triangular prism has a right-triangle cross-section with legs 6 cm and 8 cm. The hypotenuse is 10 cm and the prism length is 15 cm.\n\n${triRightSvg}\n\n**Step 1:** Area of right triangle = ½ × 6 × 8 = 24 cm²\n\n**Step 2:** Perimeter of triangle = 6 + 8 + 10 = 24 cm\n\n**Step 3:** SA = 2A + PL\nSA = 2(24) + 24(15)\nSA = 48 + 360\nSA = **408 cm²**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Triangular Prism Requiring Pythagoras",
      content: `**Example:** A triangular prism has an isosceles triangle cross-section with base 10 cm and equal sides 13 cm. The prism length is 20 cm. Find the SA.\n\n${triPythagSvg}\n\n**Step 1:** Find the triangle height using Pythagoras.\nThe height bisects the base, creating a right triangle with:\n- half-base = 5 cm\n- hypotenuse = 13 cm\n- height² = 13² − 5² = 169 − 25 = 144\n- height = 12 cm\n\n**Step 2:** Area of triangle = ½ × 10 × 12 = 60 cm²\n\n**Step 3:** Perimeter = 10 + 13 + 13 = 36 cm\n\n**Step 4:** SA = 2(60) + 36(20) = 120 + 720 = **840 cm²**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson3.id,
      type: "practice",
      title: "Your Turn: Triangular Prisms",
      content: `**Q1:** A right-triangular prism has legs 5 cm and 12 cm (hypotenuse 13 cm) and length 20 cm. Find the SA.\n\nTriangle area = ½ × 5 × 12 = 30 cm²\nPerimeter = 5 + 12 + 13 = 30 cm\nSA = 2(30) + 30(20) = 60 + 600 = **660 cm²**\n\n**Q2:** A triangular prism has an equilateral triangle cross-section with side 8 cm and length 10 cm. Find the SA. (Use triangle area = (√3/4) × s²)\n\nTriangle area = (√3/4) × 64 = 16√3 ≈ 27.71 cm²\nPerimeter = 24 cm\nSA = 2(16√3) + 24(10) = 32√3 + 240 ≈ 55.42 + 240 = **295.42 cm²**`,
      orderIndex: 4,
    },
  ]);

  console.log("  Created 3 lessons with segments.");

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  console.log("Surface Area of Prisms seeding complete.");
  return topicId;
}
