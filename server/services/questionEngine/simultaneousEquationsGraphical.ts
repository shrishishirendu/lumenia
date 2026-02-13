import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "simultaneous_equations_graphical";
  difficulty: "easy" | "medium" | "hard" | "challenge";
  archetype: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  metadata: {
    params: Record<string, number | string>;
    skills: string[];
    estimated_time_sec: number;
    visual: {
      type: "svg";
      svg: string;
      alt: string;
      width: number;
      height: number;
    };
  };
}

class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
  randInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

function makeId(difficulty: string, archetype: string, params: Record<string, number | string>): string {
  const sorted = Object.keys(params).sort().reduce((acc, k) => { acc[k] = params[k]; return acc; }, {} as Record<string, number | string>);
  const raw = `${difficulty}:${archetype}:${JSON.stringify(sorted)}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 12);
}

function formatEq(m: number, c: number): string {
  if (m === 0) return `y = ${c}`;
  const mStr = m === 1 ? "" : m === -1 ? "-" : `${m}`;
  if (c === 0) return `y = ${mStr}x`;
  const cStr = c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
  return `y = ${mStr}x${cStr}`;
}

function formatEqCompact(m: number, c: number): string {
  if (m === 0) return `y=${c}`;
  const mStr = m === 1 ? "" : m === -1 ? "-" : `${m}`;
  if (c === 0) return `y=${mStr}x`;
  const cStr = c > 0 ? `+${c}` : `${c}`;
  return `y=${mStr}x${cStr}`;
}

function makeTwoLineSvg(
  m1: number, c1: number,
  m2: number, c2: number,
  intersection: { x: number; y: number } | null,
  width: number = 460, height: number = 340,
  xMin: number = -6, xMax: number = 6, yMin: number = -6, yMax: number = 6,
): string {
  const pad = 30;
  const w = width - 2 * pad;
  const h = height - 2 * pad;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * h;

  const clipLine = (m: number, c: number): { x1: number; y1: number; x2: number; y2: number } => {
    const pts: { x: number; y: number }[] = [];
    const yAtXmin = m * xMin + c;
    const yAtXmax = m * xMax + c;
    if (yAtXmin >= yMin && yAtXmin <= yMax) pts.push({ x: xMin, y: yAtXmin });
    if (yAtXmax >= yMin && yAtXmax <= yMax) pts.push({ x: xMax, y: yAtXmax });
    if (m !== 0) {
      const xAtYmin = (yMin - c) / m;
      if (xAtYmin > xMin && xAtYmin < xMax) pts.push({ x: xAtYmin, y: yMin });
      const xAtYmax = (yMax - c) / m;
      if (xAtYmax > xMin && xAtYmax < xMax) pts.push({ x: xAtYmax, y: yMax });
    }
    if (pts.length < 2) return { x1: xMin, y1: m * xMin + c, x2: xMax, y2: m * xMax + c };
    pts.sort((a, b) => a.x - b.x);
    return { x1: pts[0].x, y1: pts[0].y, x2: pts[pts.length - 1].x, y2: pts[pts.length - 1].y };
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa" rx="4"/>`;

  for (let x = xMin; x <= xMax; x++) {
    const px = sx(x);
    svg += `<line x1="${px}" y1="${pad}" x2="${px}" y2="${height - pad}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (x !== 0) svg += `<text x="${px}" y="${height - pad + 14}" text-anchor="middle" fill="#888" font-size="10">${x}</text>`;
  }
  for (let y = yMin; y <= yMax; y++) {
    const py = sy(y);
    svg += `<line x1="${pad}" y1="${py}" x2="${width - pad}" y2="${py}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (y !== 0) svg += `<text x="${pad - 6}" y="${py + 4}" text-anchor="end" fill="#888" font-size="10">${y}</text>`;
  }

  if (yMin <= 0 && yMax >= 0) {
    const y0 = sy(0);
    svg += `<line x1="${pad}" y1="${y0}" x2="${width - pad}" y2="${y0}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${width - pad + 8}" y="${y0 + 4}" fill="#333" font-size="11">x</text>`;
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = sx(0);
    svg += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${height - pad}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${x0 + 4}" y="${pad - 6}" fill="#333" font-size="11">y</text>`;
  }

  const l1 = clipLine(m1, c1);
  svg += `<line x1="${sx(l1.x1)}" y1="${sy(l1.y1)}" x2="${sx(l1.x2)}" y2="${sy(l1.y2)}" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>`;
  const l1mx = (sx(l1.x1) + sx(l1.x2)) / 2;
  const l1my = (sy(l1.y1) + sy(l1.y2)) / 2;
  svg += `<text x="${l1mx + 6}" y="${l1my - 8}" fill="#2563eb" font-size="12" font-weight="bold">L₁</text>`;

  const l2 = clipLine(m2, c2);
  svg += `<line x1="${sx(l2.x1)}" y1="${sy(l2.y1)}" x2="${sx(l2.x2)}" y2="${sy(l2.y2)}" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8,4"/>`;
  const l2mx = (sx(l2.x1) + sx(l2.x2)) / 2;
  const l2my = (sy(l2.y1) + sy(l2.y2)) / 2;
  svg += `<text x="${l2mx + 6}" y="${l2my + 14}" fill="#dc2626" font-size="12" font-weight="bold">L₂</text>`;

  if (intersection) {
    svg += `<circle cx="${sx(intersection.x)}" cy="${sy(intersection.y)}" r="5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>`;
    svg += `<text x="${sx(intersection.x) + 8}" y="${sy(intersection.y) - 8}" fill="#16a34a" font-size="11" font-weight="bold">(${intersection.x},${intersection.y})</text>`;
  }

  svg += `</svg>`;
  return svg;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

function pickDistinctSlopes(rng: SeededRandom, pool: number[]): [number, number] {
  const m1 = rng.pick(pool);
  let m2 = rng.pick(pool);
  let tries = 0;
  while (m2 === m1 && tries < 20) { m2 = rng.pick(pool); tries++; }
  if (m2 === m1) m2 = m1 > 0 ? -m1 : m1 + 1;
  return [m1, m2];
}

function computeIntersection(m1: number, c1: number, m2: number, c2: number): { x: number; y: number } | null {
  if (m1 === m2) return null;
  const x = (c2 - c1) / (m1 - m2);
  const y = m1 * x + c1;
  return { x, y };
}

function intIntersection(rng: SeededRandom, xRange: [number, number] = [-4, 4], yRange: [number, number] = [-4, 4], slopePool: number[] = [-3, -2, -1, 1, 2, 3]): { m1: number; c1: number; m2: number; c2: number; ix: number; iy: number } {
  for (let attempt = 0; attempt < 100; attempt++) {
    const [m1, m2] = pickDistinctSlopes(rng, slopePool);
    const ix = rng.randInt(xRange[0], xRange[1]);
    const iy = rng.randInt(yRange[0], yRange[1]);
    const c1 = iy - m1 * ix;
    const c2 = iy - m2 * ix;
    if (Math.abs(c1) <= 10 && Math.abs(c2) <= 10) {
      return { m1, c1, m2, c2, ix, iy };
    }
  }
  return { m1: 1, c1: 0, m2: -1, c2: 2, ix: 1, iy: 1 };
}

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "int_intersection_small_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const params = { m1, c1, m2, c2 };
    return {
      id: makeId("easy", "int_intersection_small_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_a",
      prompt: `The graph shows two lines. Find the solution (x, y) where the two lines intersect.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Look at the graph to find the point where the two lines cross.`,
        `The intersection point is at x = ${ix} and y = ${iy}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing two lines L₁: ${formatEq(m1, c1)} and L₂: ${formatEq(m2, c2)} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-2, -1, 1, 2]);
    const params = { m1, c1, m2, c2, v: 1 };
    return {
      id: makeId("easy", "int_intersection_small_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_b",
      prompt: `Two lines are drawn on the graph below. What is the point of intersection? Write your answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Find where the two lines meet on the graph.`,
        `Reading from the graph, they meet at x = ${ix}, y = ${iy}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing two lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-3, -1, 1, 3]);
    const params = { m1, c1, m2, c2, v: 2 };
    return {
      id: makeId("easy", "int_intersection_small_c", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_c",
      prompt: `From the graph, find the coordinates of the point where line L₁ meets line L₂.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The point where L₁ and L₂ meet is the intersection.`,
        `From the graph, this point is (${ix}, ${iy}).`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing lines L₁: ${formatEq(m1, c1)} and L₂: ${formatEq(m2, c2)} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_d": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-2, 4], [-2, 4], [-2, -1, 1, 2]);
    const params = { m1, c1, m2, c2, v: 3 };
    return {
      id: makeId("easy", "int_intersection_small_d", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_d",
      prompt: `Use the graph to find the solution to this system of equations. Write your answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The solution to a system of two linear equations is the point where both lines meet.`,
        `From the graph, the lines intersect at (${ix}, ${iy}).`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph with two lines meeting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_e": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 0], [-4, 0], [-2, -1, 1, 2]);
    const params = { m1, c1, m2, c2, v: 4 };
    return {
      id: makeId("easy", "int_intersection_small_e", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_e",
      prompt: `Two straight lines are shown on the graph. What is their point of intersection?`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Look for the point where the two lines cross each other.`,
        `The intersection is at (${ix}, ${iy}).`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two straight lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_f": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [0, 4], [0, 4], [-2, -1, 1, 2]);
    const params = { m1, c1, m2, c2, v: 5 };
    return {
      id: makeId("easy", "int_intersection_small_f", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_f",
      prompt: `The graph shows two lines in the first quadrant area. Read the intersection point (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Both lines cross each other in the first quadrant region.`,
        `The crossing point is at x = ${ix}, y = ${iy}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two lines intersecting at (${ix}, ${iy}) in the first quadrant.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_g": (rng) => {
    const m1 = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 3);
    const m2 = 0;
    const c2 = rng.randInt(-3, 3);
    const ix = m1 !== 0 ? (c2 - c1) / m1 : 0;
    const iy = c2;
    if (!Number.isInteger(ix)) {
      const fixedIx = rng.randInt(-3, 3);
      const fixedC1 = iy - m1 * fixedIx;
      const params = { m1, c1: fixedC1, m2, c2, v: 6 };
      return {
        id: makeId("easy", "int_intersection_small_g", params),
        topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_g",
        prompt: `One line is horizontal and one is sloped. Find their intersection point from the graph.`,
        answer: `(${fixedIx},${iy})`,
        worked_solution: [
          `The horizontal line is at y = ${c2}.`,
          `The sloped line crosses it at x = ${fixedIx}.`,
          `Answer: (${fixedIx}, ${iy})`,
        ],
        metadata: {
          params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
          visual: {
            type: "svg" as const,
            svg: makeTwoLineSvg(m1, fixedC1, m2, c2, { x: fixedIx, y: iy }),
            alt: `A sloped line and a horizontal line y = ${c2} intersecting at (${fixedIx}, ${iy}).`,
            width: 460, height: 340,
          },
        },
      };
    }
    const params = { m1, c1, m2, c2, v: 6 };
    return {
      id: makeId("easy", "int_intersection_small_g", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_g",
      prompt: `One line is horizontal and one is sloped. Find their intersection point from the graph.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The horizontal line is at y = ${c2}.`,
        `The sloped line crosses it at x = ${ix}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `A sloped line and a horizontal line y = ${c2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "int_intersection_small_h": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -2, -1, 1, 2, 3]);
    const params = { m1, c1, m2, c2, v: 7 };
    return {
      id: makeId("easy", "int_intersection_small_h", params),
      topic: "simultaneous_equations_graphical", difficulty: "easy", archetype: "int_intersection_small_h",
      prompt: `The simultaneous equations are shown graphically below. Find the solution by reading the intersection point.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The solution to a pair of simultaneous equations shown graphically is the intersection point.`,
        `The green dot marks the intersection at (${ix}, ${iy}).`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "coordinate_reading"], estimated_time_sec: 30,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two lines intersecting at (${ix}, ${iy}). Green dot marks intersection.`,
          width: 460, height: 340,
        },
      },
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "with_equations_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2 };
    return {
      id: makeId("medium", "with_equations_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "with_equations_a",
      prompt: `The lines ${eq1} and ${eq2} are drawn on the graph. Find the solution of the simultaneous equations by reading the intersection point.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Line 1: ${eq1}`,
        `Line 2: ${eq2}`,
        `From the graph, they intersect at (${ix}, ${iy}).`,
        `Check: Substituting x = ${ix} into ${eq1}: y = ${m1}(${ix}) + ${c1} = ${iy} ✓`,
        `Check: Substituting x = ${ix} into ${eq2}: y = ${m2}(${ix}) + ${c2} = ${iy} ✓`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph of ${eq1} (blue) and ${eq2} (red dashed) intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "with_equations_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-3, -2, -1, 1, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 1 };
    return {
      id: makeId("medium", "with_equations_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "with_equations_b",
      prompt: `The graph shows the lines ${eq1} and ${eq2}. State the solution of this pair of simultaneous equations.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Read the coordinates of the point where the two lines cross.`,
        `The intersection is at (${ix}, ${iy}).`,
        `Verify: In ${eq1}, y = ${m1}×${ix} + ${c1} = ${iy}. In ${eq2}, y = ${m2}×${ix} + ${c2} = ${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "with_equations_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-2, -1, 1, 2]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 2 };
    return {
      id: makeId("medium", "with_equations_c", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "with_equations_c",
      prompt: `Two equations are graphed: ${eq1} and ${eq2}. Use the graph to solve the simultaneous equations. Write the solution as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Find the point where both lines cross on the graph.`,
        `The crossing point is at x = ${ix}, y = ${iy}.`,
        `Solution: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "with_equations_d": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -2, 1, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 3 };
    return {
      id: makeId("medium", "with_equations_d", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "with_equations_d",
      prompt: `The equations ${eq1} and ${eq2} are represented graphically. Determine the solution (x, y) by examining the graph.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The graphical solution is the intersection point.`,
        `Reading from the graph: (${ix}, ${iy}).`,
        `Verification: ${eq1} at x=${ix} gives y=${m1*ix+c1}=${iy}. ${eq2} at x=${ix} gives y=${m2*ix+c2}=${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph of ${eq1} and ${eq2} meeting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "verify_solution_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 4 };
    return {
      id: makeId("medium", "verify_solution_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "verify_solution_a",
      prompt: `The graph shows ${eq1} and ${eq2}. Read the intersection point from the graph and verify it satisfies both equations. State the solution as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From the graph, the intersection appears to be (${ix}, ${iy}).`,
        `Verify in ${eq1}: y = ${m1}(${ix}) + (${c1}) = ${m1 * ix} + ${c1} = ${iy} ✓`,
        `Verify in ${eq2}: y = ${m2}(${ix}) + (${c2}) = ${m2 * ix} + ${c2} = ${iy} ✓`,
        `Both equations are satisfied, so the solution is (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation", "verify_by_substitution"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "verify_solution_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 5 };
    return {
      id: makeId("medium", "verify_solution_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "verify_solution_b",
      prompt: `The simultaneous equations ${eq1} and ${eq2} are solved graphically below. Read the coordinates of the intersection point and confirm it is the correct solution.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The graph shows the intersection at (${ix}, ${iy}).`,
        `Check ${eq1}: ${m1} × ${ix} + ${c1} = ${iy} ✓`,
        `Check ${eq2}: ${m2} × ${ix} + ${c2} = ${iy} ✓`,
        `The solution (${ix}, ${iy}) is correct.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation", "verify_by_substitution"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph of ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "interpret_from_graph_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-2, -1, 1, 2, 3]);
    const params = { m1, c1, m2, c2, v: 6 };
    return {
      id: makeId("medium", "interpret_from_graph_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "interpret_from_graph_a",
      prompt: `Look at the graph showing two straight lines. What values of x and y satisfy both equations at the same time? Write as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The values that satisfy both equations simultaneously are at the intersection.`,
        `From the graph, x = ${ix} and y = ${iy}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two straight lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "interpret_from_graph_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -1, 1, 3]);
    const params = { m1, c1, m2, c2, v: 7 };
    return {
      id: makeId("medium", "interpret_from_graph_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "medium", archetype: "interpret_from_graph_b",
      prompt: `Using the graph below, state the coordinates of the point that is on both lines. This is the solution of the simultaneous equations.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `A point on both lines is the intersection point.`,
        `From the graph, the intersection is at (${ix}, ${iy}).`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "interpret_line_equation"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two lines meeting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "near_ticks_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-5, 5], [-5, 5], [-3, -2, -1, 1, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2 };
    return {
      id: makeId("hard", "near_ticks_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "near_ticks_a",
      prompt: `The lines ${eq1} and ${eq2} are shown. Carefully read the intersection point from the graph. Write as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Line 1: ${eq1}, Line 2: ${eq2}`,
        `From careful reading of the graph, the intersection is at (${ix}, ${iy}).`,
        `Verify: ${m1}(${ix})+${c1} = ${iy} and ${m2}(${ix})+${c2} = ${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "careful_graph_reading"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "near_ticks_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-5, 5], [-5, 5], [-3, -2, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 1 };
    return {
      id: makeId("hard", "near_ticks_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "near_ticks_b",
      prompt: `Two lines are graphed: ${eq1} and ${eq2}. The intersection is not at the origin. Read it carefully and state the solution.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The intersection point, read carefully from the grid lines, is at (${ix}, ${iy}).`,
        `Check: ${eq1} at x=${ix}: y = ${iy}. ${eq2} at x=${ix}: y = ${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "careful_graph_reading"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} with intersection at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "near_ticks_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-5, 5], [-5, 5], [-3, -2, -1, 1, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 2 };
    return {
      id: makeId("hard", "near_ticks_c", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "near_ticks_c",
      prompt: `The graph shows two lines: ${eq1} and ${eq2}. Determine the exact intersection point. Answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Using the grid, the intersection point is at (${ix}, ${iy}).`,
        `This can be verified algebraically: ${m1}x + ${c1} = ${m2}x + ${c2}, giving x = ${ix}, y = ${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "careful_graph_reading", "algebraic_verification"], estimated_time_sec: 75,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "parallel_no_solution_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 2);
    let c2 = rng.randInt(-2, 4);
    if (c2 === c1) c2 = c1 + rng.pick([2, 3]);
    const eq1 = formatEq(m, c1);
    const eq2 = formatEq(m, c2);
    const params = { m, c1, c2 };
    return {
      id: makeId("hard", "parallel_no_solution_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "parallel_no_solution_a",
      prompt: `The graph shows the lines ${eq1} and ${eq2}. How many solutions does this system have? If there is a solution, state it as (x, y). If not, write "no solution".`,
      answer: `no solution`,
      worked_solution: [
        `Both lines have gradient m = ${m}, so they are parallel.`,
        `Parallel lines never intersect, so there is no solution.`,
        `Answer: no solution`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "no_solution_case"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c1, m, c2, null),
          alt: `Two parallel lines: ${eq1} and ${eq2}. They do not intersect.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "parallel_no_solution_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 1);
    let c2 = c1 + rng.pick([3, 4, 5]);
    const eq1 = formatEq(m, c1);
    const eq2 = formatEq(m, c2);
    const params = { m, c1, c2, v: 1 };
    return {
      id: makeId("hard", "parallel_no_solution_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "parallel_no_solution_b",
      prompt: `Look at the two lines drawn on the graph: ${eq1} and ${eq2}. Are these simultaneous equations consistent? State the solution or write "no solution".`,
      answer: `no solution`,
      worked_solution: [
        `The lines ${eq1} and ${eq2} both have gradient ${m}.`,
        `Since they have the same slope but different y-intercepts (${c1} and ${c2}), they are parallel.`,
        `Parallel lines do not intersect, so the system has no solution.`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "no_solution_case"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c1, m, c2, null),
          alt: `Parallel lines ${eq1} and ${eq2}. No intersection point.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "steeper_slopes_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-5, 5], [-3, -2, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 3 };
    return {
      id: makeId("hard", "steeper_slopes_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "steeper_slopes_a",
      prompt: `The graph shows two lines with steep gradients: ${eq1} and ${eq2}. Find the intersection point.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Despite the steep slopes, the lines cross at one point.`,
        `Reading from the graph: (${ix}, ${iy}).`,
        `Verify: ${m1}(${ix})+${c1} = ${iy} and ${m2}(${ix})+${c2} = ${iy}.`,
      ],
      metadata: {
        params, skills: ["read_intersection", "careful_graph_reading"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two steep lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "steeper_slopes_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-5, 5], [-3, -2, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 4 };
    return {
      id: makeId("hard", "steeper_slopes_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "hard", archetype: "steeper_slopes_b",
      prompt: `Two lines with large gradients are graphed: ${eq1} and ${eq2}. Determine the solution to this system of equations by reading the graph.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The two lines intersect at one point.`,
        `Carefully reading the grid: x = ${ix}, y = ${iy}.`,
        `Solution: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["read_intersection", "careful_graph_reading"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Steep lines ${eq1} and ${eq2} meeting at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "same_line_infinite_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c = rng.randInt(-4, 4);
    const eq1 = formatEq(m, c);
    const params = { m, c };
    return {
      id: makeId("challenge", "same_line_infinite_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "same_line_infinite_a",
      prompt: `The graph appears to show only one line. Both equations ${eq1} and ${eq1} produce the same line. How many solutions does this system have? Answer: a coordinate pair, "no solution", or "infinitely many solutions".`,
      answer: `infinitely many solutions`,
      worked_solution: [
        `Both equations simplify to the same line: ${eq1}.`,
        `When two equations represent the same line, every point on the line is a solution.`,
        `Answer: infinitely many solutions`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "coincident_lines"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c, m, c, null),
          alt: `A single line ${eq1} drawn twice. The lines are coincident (identical).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "same_line_infinite_b": (rng) => {
    const m = rng.pick([-3, -1, 1, 2]);
    const c = rng.randInt(-3, 3);
    const eq1 = formatEq(m, c);
    const params = { m, c, v: 1 };
    return {
      id: makeId("challenge", "same_line_infinite_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "same_line_infinite_b",
      prompt: `A student graphs two equations and finds they overlap completely — only one line is visible: ${eq1}. What is the solution to this system?`,
      answer: `infinitely many solutions`,
      worked_solution: [
        `The two equations produce identical lines.`,
        `Every point on the line satisfies both equations.`,
        `Answer: infinitely many solutions`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "coincident_lines"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c, m, c, null),
          alt: `One visible line: ${eq1}. Both equations are the same line.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "determine_num_solutions_one": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2 };
    return {
      id: makeId("challenge", "determine_num_solutions_one", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "determine_num_solutions_one",
      prompt: `The lines ${eq1} and ${eq2} are shown on the graph. How many solutions does this system have? If exactly one, state it as (x, y). Otherwise write "no solution" or "infinitely many solutions".`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The lines have different gradients (${m1} and ${m2}), so they intersect at exactly one point.`,
        `From the graph, the intersection is at (${ix}, ${iy}).`,
        `The system has exactly one solution: (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "read_intersection"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} intersecting at one point (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "determine_num_solutions_none": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 1);
    const c2 = c1 + rng.pick([2, 3, 4]);
    const eq1 = formatEq(m, c1);
    const eq2 = formatEq(m, c2);
    const params = { m, c1, c2, v: 2 };
    return {
      id: makeId("challenge", "determine_num_solutions_none", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "determine_num_solutions_none",
      prompt: `The graph shows the lines ${eq1} and ${eq2}. How many solutions does this system have? Write the solution, "no solution", or "infinitely many solutions".`,
      answer: `no solution`,
      worked_solution: [
        `Both lines have gradient ${m}, making them parallel.`,
        `Parallel lines with different y-intercepts never meet.`,
        `The system has no solution.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "parallel_lines"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c1, m, c2, null),
          alt: `Parallel lines ${eq1} and ${eq2}. No intersection.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "determine_num_solutions_infinite": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c = rng.randInt(-3, 3);
    const eq1 = formatEq(m, c);
    const params = { m, c, v: 3 };
    return {
      id: makeId("challenge", "determine_num_solutions_infinite", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "determine_num_solutions_infinite",
      prompt: `A student graphed two equations and only one line appeared: ${eq1}. Classify the number of solutions: exactly one (give the point), none, or infinitely many.`,
      answer: `infinitely many solutions`,
      worked_solution: [
        `Only one line is visible because both equations are the same.`,
        `Every point on the line is a solution.`,
        `The system has infinitely many solutions.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "coincident_lines"], estimated_time_sec: 45,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c, m, c, null),
          alt: `Single visible line ${eq1}. Both equations are identical.`,
          width: 460, height: 340,
        },
      },
    };
  },
  "classify_mixed_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -2, -1, 1, 2, 3]);
    const eq1 = formatEq(m1, c1);
    const eq2 = formatEq(m2, c2);
    const params = { m1, c1, m2, c2, v: 4 };
    return {
      id: makeId("challenge", "classify_mixed_a", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "classify_mixed_a",
      prompt: `Examine the graph. The equations ${eq1} and ${eq2} are drawn. Classify the system as having one solution, no solution, or infinitely many solutions. If one solution, state the coordinates.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The gradients are ${m1} and ${m2} — they are different.`,
        `Since the gradients differ, the lines must intersect at exactly one point.`,
        `From the graph, the intersection is (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "read_intersection"], estimated_time_sec: 75,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Lines ${eq1} and ${eq2} with one intersection at (${ix}, ${iy}).`,
          width: 460, height: 340,
        },
      },
    };
  },
  "classify_mixed_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 2);
    const c2 = c1 + rng.pick([2, 3, 4, 5]);
    const eq1 = formatEq(m, c1);
    const eq2 = formatEq(m, c2);
    const params = { m, c1, c2, v: 5 };
    return {
      id: makeId("challenge", "classify_mixed_b", params),
      topic: "simultaneous_equations_graphical", difficulty: "challenge", archetype: "classify_mixed_b",
      prompt: `The graph shows two lines: ${eq1} and ${eq2}. Classify the number of solutions. If one solution exists, give the coordinates. Otherwise write "no solution" or "infinitely many solutions".`,
      answer: `no solution`,
      worked_solution: [
        `Both lines have gradient ${m}, so they are parallel.`,
        `They have different y-intercepts (${c1} ≠ ${c2}), so they never meet.`,
        `The system has no solution.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "parallel_lines"], estimated_time_sec: 60,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c1, m, c2, null),
          alt: `Parallel lines ${eq1} and ${eq2}. They do not intersect.`,
          width: 460, height: 340,
        },
      },
    };
  },
};

const DIFFICULTY_MAP: Record<string, Record<string, ArchetypeGenerator>> = {
  easy: EASY_ARCHETYPES,
  medium: MEDIUM_ARCHETYPES,
  hard: HARD_ARCHETYPES,
  challenge: CHALLENGE_ARCHETYPES,
};

export function generateQuestion(difficulty: "easy" | "medium" | "hard" | "challenge", seed?: number): GeneratedQuestion {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = DIFFICULTY_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const key = keys[Math.floor(rng.next() * keys.length)];
  return archetypes[key](rng);
}

export function generatePool(difficulty: "easy" | "medium" | "hard" | "challenge", n: number, seed?: number, ensure_unique: boolean = true): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = DIFFICULTY_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const result: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (result.length < n && attempts < n * 15) {
    attempts++;
    const key = keys[Math.floor(rng.next() * keys.length)];
    const q = archetypes[key](rng);
    if (ensure_unique && seen.has(q.id)) continue;
    seen.add(q.id);
    result.push(q);
  }

  return result;
}

export function generateMixedPool(config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[], seed?: number): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const result: GeneratedQuestion[] = [];

  for (const { difficulty, count } of config) {
    const archetypes = DIFFICULTY_MAP[difficulty];
    const keys = Object.keys(archetypes);
    const seen = new Set<string>();
    let attempts = 0;

    while (result.filter(q => q.difficulty === difficulty).length < count && attempts < count * 15) {
      attempts++;
      const key = keys[Math.floor(rng.next() * keys.length)];
      const q = archetypes[key](rng);
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      result.push(q);
    }
  }

  return result;
}
