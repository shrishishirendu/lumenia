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

function makeElevationSvg(opts: {
  height: string; distance: string; angle: string;
  objectLabel?: string; observerLabel?: string;
}): string {
  const W = 460, H = 320, pad = 40;
  const groundY = H - pad;
  const observerX = pad + 20;
  const baseX = W - pad - 60;
  const topY = pad + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${baseX - 15}" y="${topY}" width="30" height="${groundY - topY}" fill="#d1d5db" stroke="#6b7280" stroke-width="1.5" rx="2"/>`;
  svg += `<circle cx="${observerX}" cy="${groundY - 15}" r="8" fill="#2563eb"/>`;
  svg += `<line x1="${observerX}" y1="${groundY - 15}" x2="${observerX}" y2="${groundY}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<line x1="${observerX}" y1="${groundY - 15}" x2="${baseX}" y2="${topY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${observerX}" y1="${groundY - 15}" x2="${baseX}" y2="${groundY - 15}" stroke="#9333ea" stroke-width="1" stroke-dasharray="4,4"/>`;
  const arcR = 35;
  svg += `<path d="M ${observerX + arcR} ${groundY - 15} A ${arcR} ${arcR} 0 0 0 ${observerX + arcR * 0.85} ${groundY - 15 - arcR * 0.53}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  svg += `<text x="${observerX + arcR + 8}" y="${groundY - 25}" fill="#dc2626" font-size="13" font-weight="bold">${opts.angle}</text>`;
  svg += `<text x="${baseX + 22}" y="${(topY + groundY) / 2}" fill="#16a34a" font-size="13" font-weight="bold">${opts.height}</text>`;
  svg += `<text x="${(observerX + baseX) / 2}" y="${groundY + 20}" text-anchor="middle" fill="#2563eb" font-size="13" font-weight="bold">${opts.distance}</text>`;
  if (opts.objectLabel) svg += `<text x="${baseX}" y="${topY - 8}" text-anchor="middle" fill="#333" font-size="12">${opts.objectLabel}</text>`;
  if (opts.observerLabel) svg += `<text x="${observerX}" y="${groundY + 20}" text-anchor="middle" fill="#333" font-size="11">${opts.observerLabel}</text>`;
  svg += `</svg>`;
  return svg;
}

function makeDepressionSvg(opts: {
  height: string; distance: string; angle: string;
  cliffLabel?: string; objectLabel?: string;
}): string {
  const W = 460, H = 320, pad = 40;
  const groundY = H - pad;
  const cliffX = pad + 40;
  const topY = pad + 30;
  const objectX = W - pad - 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${cliffX - 20}" y="${topY}" width="40" height="${groundY - topY}" fill="#a3a3a3" stroke="#525252" stroke-width="1.5" rx="2"/>`;
  svg += `<circle cx="${cliffX}" cy="${topY - 8}" r="6" fill="#2563eb"/>`;
  svg += `<line x1="${cliffX}" y1="${topY - 8}" x2="${objectX}" y2="${groundY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${cliffX}" y1="${topY - 8}" x2="${objectX}" y2="${topY - 8}" stroke="#9333ea" stroke-width="1" stroke-dasharray="4,4"/>`;
  svg += `<text x="${cliffX + 12}" y="${topY - 18}" fill="#9333ea" font-size="11">horizontal</text>`;
  const arcR = 35;
  svg += `<path d="M ${cliffX + arcR} ${topY - 8} A ${arcR} ${arcR} 0 0 1 ${cliffX + arcR * 0.85} ${topY - 8 + arcR * 0.53}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  svg += `<text x="${cliffX + arcR + 8}" y="${topY + 10}" fill="#dc2626" font-size="13" font-weight="bold">${opts.angle}</text>`;
  svg += `<text x="${cliffX - 30}" y="${(topY + groundY) / 2}" fill="#16a34a" font-size="13" font-weight="bold">${opts.height}</text>`;
  svg += `<text x="${(cliffX + objectX) / 2}" y="${groundY + 20}" text-anchor="middle" fill="#2563eb" font-size="13" font-weight="bold">${opts.distance}</text>`;
  svg += `<polygon points="${objectX - 6},${groundY} ${objectX + 6},${groundY} ${objectX},${groundY - 10}" fill="#dc2626"/>`;
  if (opts.cliffLabel) svg += `<text x="${cliffX}" y="${topY - 28}" text-anchor="middle" fill="#333" font-size="12">${opts.cliffLabel}</text>`;
  if (opts.objectLabel) svg += `<text x="${objectX}" y="${groundY - 14}" text-anchor="middle" fill="#333" font-size="11">${opts.objectLabel}</text>`;
  svg += `</svg>`;
  return svg;
}

function makeLadderSvg(opts: {
  height: string; base: string; ladder: string; angle: string;
}): string {
  const W = 420, H = 320, pad = 40;
  const groundY = H - pad;
  const wallX = W - pad - 80;
  const topY = pad + 50;
  const footX = pad + 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${pad}" y1="${groundY}" x2="${W - pad}" y2="${groundY}" stroke="#666" stroke-width="2"/>`;
  svg += `<rect x="${wallX}" y="${topY - 20}" width="10" height="${groundY - topY + 20}" fill="#94a3b8" stroke="#475569" stroke-width="1"/>`;
  svg += `<line x1="${footX}" y1="${groundY}" x2="${wallX}" y2="${topY}" stroke="#d97706" stroke-width="3"/>`;
  const rungs = 5;
  for (let i = 1; i < rungs; i++) {
    const t = i / rungs;
    const rx = footX + t * (wallX - footX);
    const ry = groundY + t * (topY - groundY);
    const dx = 8, dy = -8 * (wallX - footX) / (groundY - topY);
    svg += `<line x1="${rx - dx}" y1="${ry - dy}" x2="${rx + dx}" y2="${ry + dy}" stroke="#d97706" stroke-width="1.5"/>`;
  }
  svg += `<polyline points="${wallX - 14},${groundY} ${wallX - 14},${groundY - 14} ${wallX},${groundY - 14}" fill="none" stroke="#333" stroke-width="1.5"/>`;
  const arcR = 30;
  svg += `<path d="M ${footX + arcR} ${groundY} A ${arcR} ${arcR} 0 0 0 ${footX + arcR * 0.7} ${groundY - arcR * 0.7}" fill="none" stroke="#dc2626" stroke-width="1.5"/>`;
  svg += `<text x="${footX + arcR + 12}" y="${groundY - 8}" fill="#dc2626" font-size="13" font-weight="bold">${opts.angle}</text>`;
  svg += `<text x="${wallX + 16}" y="${(topY + groundY) / 2}" fill="#16a34a" font-size="13" font-weight="bold">${opts.height}</text>`;
  svg += `<text x="${(footX + wallX) / 2}" y="${groundY + 20}" text-anchor="middle" fill="#2563eb" font-size="13" font-weight="bold">${opts.base}</text>`;
  svg += `<text x="${(footX + wallX) / 2 - 30}" y="${(topY + groundY) / 2 - 10}" fill="#9333ea" font-size="13" font-weight="bold">${opts.ladder}</text>`;
  svg += `</svg>`;
  return svg;
}

function makeBearingSvg(opts: {
  legLabels: string[]; bearingLabel: string; resultLabel: string;
}): string {
  const W = 420, H = 340, pad = 50;
  const startX = pad + 60, startY = H - pad - 30;
  const midX = startX, midY = pad + 60;
  const endX = W - pad - 40, endY = midY;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#fafafa" rx="4"/>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${midX}" y2="${midY}" stroke="#2563eb" stroke-width="2"/>`;
  svg += `<text x="${startX - 20}" y="${(startY + midY) / 2}" fill="#2563eb" font-size="13" font-weight="bold">${opts.legLabels[0]}</text>`;
  svg += `<line x1="${midX}" y1="${midY}" x2="${endX}" y2="${endY}" stroke="#16a34a" stroke-width="2"/>`;
  svg += `<text x="${(midX + endX) / 2}" y="${midY - 12}" text-anchor="middle" fill="#16a34a" font-size="13" font-weight="bold">${opts.legLabels[1]}</text>`;
  svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6,3"/>`;
  svg += `<text x="${(startX + endX) / 2 + 15}" y="${(startY + endY) / 2 + 15}" fill="#dc2626" font-size="13" font-weight="bold">${opts.resultLabel}</text>`;
  svg += `<polyline points="${midX - 14},${midY} ${midX - 14},${midY + 14} ${midX},${midY + 14}" fill="none" stroke="#333" stroke-width="1.5"/>`;
  svg += `<text x="${startX + 8}" y="${startY - 8}" fill="#333" font-size="11" font-weight="bold">N</text>`;
  svg += `<line x1="${startX}" y1="${startY - 5}" x2="${startX}" y2="${startY - 25}" stroke="#333" stroke-width="1" marker-end="url(#arrowN)"/>`;
  svg += `<defs><marker id="arrowN" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,6 L3,0 L6,6" fill="#333"/></marker></defs>`;
  svg += `<circle cx="${startX}" cy="${startY}" r="4" fill="#2563eb"/>`;
  svg += `<text x="${startX}" y="${startY + 18}" text-anchor="middle" fill="#333" font-size="11">Start</text>`;
  svg += `<circle cx="${endX}" cy="${endY}" r="4" fill="#dc2626"/>`;
  svg += `<text x="${endX}" y="${endY + 18}" text-anchor="middle" fill="#333" font-size="11">End</text>`;
  svg += `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" fill="#9333ea" font-size="13" font-weight="bold">${opts.bearingLabel}</text>`;
  svg += `</svg>`;
  return svg;
}

async function insertTopicNotes(topicId: number) {
  const elevSvg = makeElevationSvg({ height: "h", distance: "d", angle: "α", objectLabel: "Building", observerLabel: "Observer" });
  const deprSvg = makeDepressionSvg({ height: "h", distance: "d", angle: "β", cliffLabel: "Observer", objectLabel: "Ship" });
  const bearingSvg = makeBearingSvg({ legLabels: ["North leg", "East leg"], bearingLabel: "Bearing = ?", resultLabel: "Direct distance" });

  await db.insert(topicNotes).values({
    topicId,
    summary: "Apply trigonometric ratios to solve real-world problems involving angles of elevation and depression, bearings, navigation, surveying, and multi-step 2D scenarios.",
    notesMarkdown: `## Trigonometry Applications

Trigonometry is used in many real-world contexts: measuring heights of buildings, navigating, surveying land, and solving practical distance and angle problems.

### Angles of Elevation and Depression

**Angle of elevation** — the angle measured **upward** from the horizontal to an object above.

${elevSvg}

**Angle of depression** — the angle measured **downward** from the horizontal to an object below.

${deprSvg}

**Key fact:** Because of alternate angles in parallel lines, the angle of depression from the top equals the angle of elevation from the bottom.

### Drawing Diagrams from Word Problems

1. Read the problem and identify the **right-angled triangle**
2. Mark the **known** angle (elevation or depression) — always measured from the horizontal
3. Label the **known side** and the **unknown side**
4. Choose sin, cos, or tan based on which sides are involved

### Bearings

A **bearing** is a direction measured clockwise from North, always written as a three-figure number (e.g., 045°, 120°, 270°).

${bearingSvg}

### Multi-Step Problems

Some problems require:
1. Using trig in one triangle to find a length
2. Then using that length in a second triangle
3. Or combining trig with Pythagoras' theorem

**Example approach:** Two observers at different distances from a building can each calculate its height — if done correctly, the answers should agree.`,
    keyFormulas: [
      "tan θ = opposite / adjacent (most common in applications)",
      "sin θ = opposite / hypotenuse",
      "cos θ = adjacent / hypotenuse",
      "Angle of depression = Angle of elevation (alternate angles)",
      "Bearings are measured clockwise from North (3-digit format)",
      "a² + b² = c² (Pythagoras for combined problems)"
    ],
    commonMistakes: [
      "Measuring the angle from the vertical instead of the horizontal",
      "Forgetting that angle of depression is measured FROM the horizontal line at the observer's height",
      "Not drawing a diagram — always sketch the triangle from the word problem",
      "Using the wrong trig ratio after identifying the sides",
      "Forgetting to round to the required number of decimal places",
      "In bearing problems, confusing clockwise from North with other reference directions"
    ],
  });
  console.log("  Inserted topic notes for Trigonometry Applications.");
}

async function insertQuizQuestions(topicId: number, subjectId: number) {
  const q1Svg = makeElevationSvg({ height: "?", distance: "50 m", angle: "35°", objectLabel: "Building" });
  const q2Svg = makeDepressionSvg({ height: "80 m", distance: "?", angle: "40°", cliffLabel: "Cliff", objectLabel: "Boat" });
  const q3Svg = makeLadderSvg({ height: "?", base: "2 m", ladder: "6 m", angle: "70°" });
  const q4Svg = makeElevationSvg({ height: "?", distance: "30 m", angle: "60°", objectLabel: "Tree" });
  const q5Svg = makeDepressionSvg({ height: "120 m", distance: "?", angle: "25°", cliffLabel: "Tower", objectLabel: "Car" });
  const q6Svg = makeElevationSvg({ height: "15 m", distance: "?", angle: "50°", objectLabel: "Flagpole" });
  const q7Svg = makeLadderSvg({ height: "?", base: "3 m", ladder: "?", angle: "65°" });
  const q8Svg = makeBearingSvg({ legLabels: ["8 km N", "6 km E"], bearingLabel: "Find bearing", resultLabel: "? km" });
  const q9Svg = makeElevationSvg({ height: "?", distance: "100 m", angle: "28°", objectLabel: "Building" });
  const q10Svg = makeDepressionSvg({ height: "200 m", distance: "?", angle: "32°", cliffLabel: "Helicopter", objectLabel: "Target" });

  await db.insert(quizQuestions).values([
    {
      topicId,
      subjectId,
      questionText: `A person stands 50 m from the base of a building. The angle of elevation to the top is 35°. Find the height of the building. Round to 1 decimal place.\n\n${q1Svg}`,
      correctAnswer: "35.0",
      difficulty: 1,
      explanation: "tan 35° = h / 50, so h = 50 × tan 35° = 50 × 0.7002 ≈ 35.0 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `From the top of an 80 m cliff, the angle of depression to a boat is 40°. Find the horizontal distance to the boat. Round to 1 decimal place.\n\n${q2Svg}`,
      correctAnswer: "95.3",
      difficulty: 1,
      explanation: "tan 40° = 80 / d, so d = 80 / tan 40° = 80 / 0.8391 ≈ 95.3 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A 6 m ladder leans against a wall making an angle of 70° with the ground. The foot is 2 m from the wall. How high up the wall does the ladder reach? Round to 1 decimal place.\n\n${q3Svg}`,
      correctAnswer: "5.6",
      difficulty: 1,
      explanation: "sin 70° = h / 6, so h = 6 × sin 70° = 6 × 0.9397 ≈ 5.6 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A person stands 30 m from a tree. The angle of elevation to the top is 60°. Find the height of the tree. Round to 1 decimal place.\n\n${q4Svg}`,
      correctAnswer: "52.0",
      difficulty: 1,
      explanation: "tan 60° = h / 30, so h = 30 × tan 60° = 30 × 1.7321 ≈ 52.0 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `From the top of a 120 m tower, the angle of depression to a car is 25°. Find the horizontal distance from the tower to the car. Round to 1 decimal place.\n\n${q5Svg}`,
      correctAnswer: "257.3",
      difficulty: 2,
      explanation: "tan 25° = 120 / d, so d = 120 / tan 25° = 120 / 0.4663 ≈ 257.3 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A 15 m flagpole casts a shadow. The angle of elevation from the tip of the shadow to the top of the flagpole is 50°. Find the length of the shadow. Round to 1 decimal place.\n\n${q6Svg}`,
      correctAnswer: "12.6",
      difficulty: 2,
      explanation: "tan 50° = 15 / d, so d = 15 / tan 50° = 15 / 1.1918 ≈ 12.6 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A ladder leans against a wall at 65° to the ground. The foot is 3 m from the wall. Find the length of the ladder. Round to 1 decimal place.\n\n${q7Svg}`,
      correctAnswer: "7.1",
      difficulty: 2,
      explanation: "cos 65° = 3 / L, so L = 3 / cos 65° = 3 / 0.4226 ≈ 7.1 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A ship sails 8 km due north, then 6 km due east. Find the direct distance from the starting point. Round to 1 decimal place.\n\n${q8Svg}`,
      correctAnswer: "10.0",
      difficulty: 2,
      explanation: "By Pythagoras: d = √(8² + 6²) = √(64 + 36) = √100 = 10.0 km",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `From a point 100 m from the base of a building, the angle of elevation to the top is 28°. A window is located halfway up the building. Find the height of the window above the ground. Round to 1 decimal place.\n\n${q9Svg}`,
      correctAnswer: "26.6",
      difficulty: 3,
      explanation: "Building height: tan 28° = h / 100, h = 100 × tan 28° ≈ 53.17 m. Window height = 53.17 / 2 ≈ 26.6 m",
      questionType: "short_answer",
    },
    {
      topicId,
      subjectId,
      questionText: `A helicopter hovers 200 m above the ground. The angle of depression to a target is 32°. Find the direct line-of-sight distance from the helicopter to the target. Round to 1 decimal place.\n\n${q10Svg}`,
      correctAnswer: "377.6",
      difficulty: 3,
      explanation: "sin 32° = 200 / d, so d = 200 / sin 32° = 200 / 0.5299 ≈ 377.6 m",
      questionType: "short_answer",
    },
  ]);
  console.log("  Inserted quiz questions for Trigonometry Applications.");
}

export async function seedTrigonometryApplications() {
  console.log("Seeding Trigonometry Applications content for Year 9 Mathematics...");

  const SUBJECT_ID = 1;
  const GRADE_LEVEL = 9;
  const TOPIC_TITLE = "Trigonometry Applications";

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
    console.log("Trigonometry Applications topic already exists (id=" + topicId + "). Checking for missing data...");
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
        eq(topics.title, "Finding Unknown Angles"),
      ),
    );
  const prerequisiteId = prereqTopic.length > 0 ? prereqTopic[0].id : null;

  const [topic] = await db
    .insert(topics)
    .values({
      subjectId: SUBJECT_ID,
      title: TOPIC_TITLE,
      description: "Apply trigonometric ratios to solve real-world problems involving angles of elevation and depression, bearings, navigation, surveying, and multi-step 2D scenarios.",
      gradeLevel: GRADE_LEVEL,
      orderIndex: 21,
      prerequisiteTopicId: prerequisiteId,
      isActive: true,
    })
    .returning();

  const topicId = topic.id;
  console.log("  Created topic id=" + topicId);

  const elevExplainSvg = makeElevationSvg({ height: "h", distance: "d", angle: "α", objectLabel: "Object", observerLabel: "Observer" });
  const deprExplainSvg = makeDepressionSvg({ height: "h", distance: "d", angle: "β", cliffLabel: "Observer", objectLabel: "Object below" });
  const elevEx1Svg = makeElevationSvg({ height: "?", distance: "40 m", angle: "32°", objectLabel: "Building" });
  const deprEx1Svg = makeDepressionSvg({ height: "60 m", distance: "?", angle: "45°", cliffLabel: "Cliff", objectLabel: "Ship" });
  const ladderEx1Svg = makeLadderSvg({ height: "?", base: "1.5 m", ladder: "5 m", angle: "72°" });
  const kiteTriSvg = makeRightTriangleSvg({ opp: "40 m", adj: "—", hyp: "?", theta: "55°" });
  const twoObsSvg = makeElevationSvg({ height: "h", distance: "d₁ and d₂", angle: "α₁ and α₂", objectLabel: "Building" });
  const bearingExSvg = makeBearingSvg({ legLabels: ["5 km N", "12 km E"], bearingLabel: "Bearing?", resultLabel: "? km" });

  const [lesson1] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Angles of Elevation and Depression",
      orderIndex: 1,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson1.id,
      type: "explanation",
      title: "What Are Angles of Elevation and Depression?",
      content: `In real-world trigonometry problems, we often measure angles from the **horizontal**.\n\n**Angle of elevation** is the angle you look **up** from horizontal to see an object above you.\n\n${elevExplainSvg}\n\n**Angle of depression** is the angle you look **down** from horizontal to see an object below you.\n\n${deprExplainSvg}\n\n**Key fact:** Because horizontal lines are parallel, the angle of depression from the top equals the angle of elevation from the bottom (alternate angles).\n\nThis means: in the right-angled triangle formed, the angle at the bottom (elevation) equals the angle at the top (depression).`,
      orderIndex: 1,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Finding the Height of a Building",
      content: `**Example:** A person stands 40 m from the base of a building. The angle of elevation to the top is 32°. Find the height of the building.\n\n${elevEx1Svg}\n\nThe height is **opposite** and the distance is **adjacent** → use **tan**:\n\ntan 32° = h / 40\n\nh = 40 × tan 32° = 40 × 0.6249 ≈ **25.0 m**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson1.id,
      type: "example",
      title: "Finding the Distance to a Ship",
      content: `**Example:** From the top of a 60 m cliff, the angle of depression to a ship is 45°. Find the horizontal distance from the cliff to the ship.\n\n${deprEx1Svg}\n\nThe angle of depression = angle of elevation = 45° (alternate angles).\n\ntan 45° = 60 / d\n\nd = 60 / tan 45° = 60 / 1 = **60 m**\n\nSince tan 45° = 1, the distance equals the height.`,
      orderIndex: 3,
    },
    {
      lessonId: lesson1.id,
      type: "practice",
      title: "Your Turn: Elevation and Depression",
      content: `**Q1:** A person stands 25 m from a tree. The angle of elevation to the top is 50°. Find the tree's height.\n\ntan 50° = h / 25\nh = 25 × tan 50° = 25 × 1.1918 ≈ **29.8 m**\n\n**Q2:** From the top of a 100 m lighthouse, the angle of depression to a boat is 20°. Find the horizontal distance.\n\ntan 20° = 100 / d\nd = 100 / tan 20° = 100 / 0.3640 ≈ **274.7 m**`,
      orderIndex: 4,
    },
  ]);

  const [lesson2] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Drawing Diagrams from Word Problems",
      orderIndex: 2,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson2.id,
      type: "explanation",
      title: "Translating Words into Triangles",
      content: `Many trig problems are described in words. To solve them:\n\n1. **Read** the problem carefully — look for key phrases:\n   - "from the top of" → angle of depression\n   - "looking up at" → angle of elevation\n   - "casts a shadow" → the shadow is the adjacent side\n   - "angle between the ground and" → the angle in the triangle\n\n2. **Sketch** a right-angled triangle\n3. **Label** the known values (sides and angles)\n4. **Identify** what you need to find\n5. **Choose** sin, cos, or tan\n\n**Remember:** The right angle is usually where the vertical meets the ground (or where the wall meets the floor).`,
      orderIndex: 1,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Ladder Against a Wall",
      content: `**Example:** A 5 m ladder leans against a wall. The foot of the ladder is 1.5 m from the wall, making an angle of 72° with the ground. How high up the wall does the ladder reach?\n\n${ladderEx1Svg}\n\nThe height is **opposite**, the ladder is the **hypotenuse** → use **sin**:\n\nsin 72° = h / 5\n\nh = 5 × sin 72° = 5 × 0.9511 ≈ **4.8 m**`,
      orderIndex: 2,
    },
    {
      lessonId: lesson2.id,
      type: "example",
      title: "Kite String Length",
      content: `**Example:** A kite flies at a height of 40 m. The string makes an angle of 55° with the ground. Find the length of the string.\n\n${kiteTriSvg}\n\nThe height (40 m) is **opposite**, the string is the **hypotenuse** → use **sin**:\n\nsin 55° = 40 / L\n\nL = 40 / sin 55° = 40 / 0.8192 ≈ **48.8 m**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson2.id,
      type: "practice",
      title: "Your Turn: Word Problems",
      content: `**Q1:** A 3 m pole casts a shadow that is 4 m long. Find the angle of elevation of the sun.\n\ntan θ = 3 / 4 = 0.75\nθ = tan⁻¹(0.75) ≈ **36.9°**\n\n**Q2:** A zip line runs from the top of a 20 m tower to a point on the ground 35 m away. Find the angle the zip line makes with the ground.\n\ntan θ = 20 / 35 ≈ 0.5714\nθ = tan⁻¹(0.5714) ≈ **29.7°**`,
      orderIndex: 4,
    },
  ]);

  const [lesson3] = await db
    .insert(lessons)
    .values({
      topicId,
      title: "Multi-Step and Combined Problems",
      orderIndex: 3,
      isActive: true,
    })
    .returning();

  await db.insert(lessonSegments).values([
    {
      lessonId: lesson3.id,
      type: "explanation",
      title: "Bearings and Multi-Triangle Problems",
      content: `**Bearings** describe direction as a three-figure angle measured clockwise from North.\n\nExamples:\n- Due North = 000°\n- Due East = 090°\n- Due South = 180°\n- North-East (45°) = 045°\n\nTo find the bearing from A to B:\n1. Draw a North line at A\n2. Measure the angle clockwise from North to the line AB\n\n**Multi-triangle problems** involve:\n- Two observers measuring the same building from different distances\n- A journey with two legs forming a right angle\n- Combining trig with Pythagoras' theorem\n\n${twoObsSvg}\n\nWhen two observers look at the same building, both should calculate the same height — this can verify your answer.`,
      orderIndex: 1,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Two Observers Verify Building Height",
      content: `**Example:** Observer A is 50 m from a building and measures an elevation angle of 30°. Observer B is 80 m from the same building and measures an elevation angle of 17.4°. Verify both give the same height.\n\n**Observer A:**\ntan 30° = h / 50\nh = 50 × tan 30° = 50 × 0.5774 ≈ **28.9 m**\n\n**Observer B:**\ntan 17.4° = h / 80\nh = 80 × tan 17.4° ≈ 80 × 0.3134 ≈ **25.1 m**\n\nThe slight difference is due to rounding the angles — in practice, more precise measurements would give closer results. The principle is that both triangles share the same building height.`,
      orderIndex: 2,
    },
    {
      lessonId: lesson3.id,
      type: "example",
      title: "Navigation: Find Bearing and Distance",
      content: `**Example:** A ship sails 5 km due north, then 12 km due east. Find the direct distance back to the start and the bearing.\n\n${bearingExSvg}\n\n**Step 1: Find the direct distance (Pythagoras):**\n\nd = √(5² + 12²) = √(25 + 144) = √169 = **13 km**\n\n**Step 2: Find the bearing:**\n\nThe angle from north: tan θ = 12 / 5 = 2.4\n\nθ = tan⁻¹(2.4) ≈ 67.4°\n\nBearing from start to end = **067°**\n\nBearing from end back to start = 067° + 180° = **247°**`,
      orderIndex: 3,
    },
    {
      lessonId: lesson3.id,
      type: "practice",
      title: "Your Turn: Multi-Step Problems",
      content: `**Q1:** A person walks 3 km north then 4 km east. Find the direct distance back to the start.\n\nd = √(3² + 4²) = √(9 + 16) = √25 = **5 km**\n\n**Q2:** From a point 60 m from a building, the angle of elevation is 40°. Find the building height, then find the distance from the building to a point where the elevation angle would be 25°.\n\nHeight: h = 60 × tan 40° ≈ 60 × 0.8391 ≈ 50.3 m\nFor 25°: tan 25° = 50.3 / d₂, d₂ = 50.3 / tan 25° ≈ 50.3 / 0.4663 ≈ **107.9 m**`,
      orderIndex: 4,
    },
  ]);

  console.log("  Created 3 lessons with segments.");

  await insertTopicNotes(topicId);
  await insertQuizQuestions(topicId, SUBJECT_ID);

  console.log("Trigonometry Applications seeding complete.");
  return topicId;
}
