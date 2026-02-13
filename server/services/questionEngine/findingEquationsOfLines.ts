import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "finding_equations_of_lines";
  difficulty: "easy" | "medium" | "hard" | "challenge";
  archetype: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  metadata: {
    params: Record<string, number | string>;
    skills: string[];
    estimated_time_sec: number;
    visual?: {
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

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFraction(num: number, den: number): string {
  if (den === 0) return "undefined";
  if (num === 0) return "0";
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  const aN = Math.abs(num);
  const aD = Math.abs(den);
  const g = gcd(aN, aD);
  const sN = sign * (aN / g);
  const sD = aD / g;
  if (sD === 1) return `${sN}`;
  return `${sN}/${sD}`;
}

function formatSlopeCoeff(num: number, den: number = 1): string {
  const s = simplifyFraction(num, den);
  if (s === "1") return "";
  if (s === "-1") return "-";
  return s;
}

function formatEquation(mNum: number, mDen: number, c: number): string {
  const mStr = formatSlopeCoeff(mNum, mDen);
  if (c === 0) return `y=${mStr}x`;
  const cStr = c > 0 ? `+${c}` : `${c}`;
  return `y=${mStr}x${cStr}`;
}

function formatEquationFracC(mNum: number, mDen: number, cNum: number, cDen: number): string {
  const mStr = formatSlopeCoeff(mNum, mDen);
  const cFrac = simplifyFraction(cNum, cDen);
  if (cFrac === "0") return `y=${mStr}x`;
  const cVal = cNum / cDen;
  if (Number.isInteger(cVal)) {
    const c = cVal;
    const cStr = c > 0 ? `+${c}` : `${c}`;
    return `y=${mStr}x${cStr}`;
  }
  const isNeg = (cNum < 0) !== (cDen < 0);
  if (isNeg) return `y=${mStr}x${cFrac}`;
  return `y=${mStr}x+${cFrac}`;
}

function formatPromptSlope(num: number, den: number = 1): string {
  const s = simplifyFraction(num, den);
  return s;
}

function formatPromptEq(m: number, c: number): string {
  const mStr = m === 1 ? "" : m === -1 ? "-" : `${m}`;
  if (c === 0) return `y = ${mStr}x`;
  const cStr = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `y = ${mStr}x ${cStr}`;
}

function makeSvgGrid(
  width: number, height: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  lines: { x1: number; y1: number; x2: number; y2: number; label: string; color: string }[],
  points: { x: number; y: number; label: string }[] = [],
): string {
  const pad = 30;
  const w = width - 2 * pad;
  const h = height - 2 * pad;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * h;

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
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = sx(0);
    svg += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${height - pad}" stroke="#333" stroke-width="1.5"/>`;
  }

  for (const line of lines) {
    const lx1 = Math.max(xMin, Math.min(xMax, line.x1));
    const ly1 = line.y1;
    const lx2 = Math.max(xMin, Math.min(xMax, line.x2));
    const ly2 = line.y2;
    svg += `<line x1="${sx(lx1)}" y1="${sy(ly1)}" x2="${sx(lx2)}" y2="${sy(ly2)}" stroke="${line.color}" stroke-width="2.5" stroke-linecap="round"/>`;
    const mx = (sx(lx1) + sx(lx2)) / 2;
    const my = (sy(ly1) + sy(ly2)) / 2;
    svg += `<text x="${mx + 8}" y="${my - 8}" fill="${line.color}" font-size="13" font-weight="bold">${line.label}</text>`;
  }

  for (const p of points) {
    svg += `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4" fill="#333"/>`;
    svg += `<text x="${sx(p.x) + 6}" y="${sy(p.y) - 6}" fill="#333" font-size="11">${p.label}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "from_m_and_c_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c = rng.randInt(-8, 8);
    const params = { m, c };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_a", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_a",
      prompt: `A line has gradient ${m} and y-intercept ${c}. Write the equation of the line in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `The gradient is m = ${m}`,
        `The y-intercept is c = ${c}`,
        `Substitute into y = mx + c`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 20 }
    };
  },

  "from_m_and_c_b": (rng) => {
    const m = rng.pick([-2, -1, 0, 1, 2, 3]);
    const c = rng.randInt(-5, 5);
    const params = { m, c };
    const eq = m === 0 ? `y=${c}` : formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_b", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_b",
      prompt: `Write the equation of the line with slope ${m} and y-intercept ${c}.`,
      answer: eq,
      worked_solution: [
        `Using y = mx + c with m = ${m} and c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 20 }
    };
  },

  "from_m_and_c_c": (rng) => {
    const m = rng.pick([-3, -1, 1, 2, 3]);
    const c = rng.randInt(-6, 6);
    const params = { m, c };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_c", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_c",
      prompt: `A straight line has a gradient of ${m} and crosses the y-axis at ${c}. What is its equation?`,
      answer: eq,
      worked_solution: [
        `Gradient m = ${m}, y-intercept c = ${c}`,
        `y = mx + c`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 20 }
    };
  },

  "from_m_and_c_d": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = 0;
    const params = { m, c };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_d", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_d",
      prompt: `A line passes through the origin with gradient ${m}. Write its equation.`,
      answer: eq,
      worked_solution: [
        `Through the origin means c = 0`,
        `m = ${m}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 15 }
    };
  },

  "from_graph_yint_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = rng.randInt(-3, 3);
    const x1 = -2;
    const y1 = m * x1 + c;
    const x2 = 3;
    const y2 = m * x2 + c;
    const params = { m, c };
    const allY = [y1, y2, c];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#2563eb" }],
      [{ x: 0, y: c, label: `(0, ${c})` }, { x: x2, y: y2, label: `(${x2}, ${y2})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_graph_yint_a", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_graph_yint_a",
      prompt: `From the diagram, find the equation of line L. Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `The line crosses the y-axis at (0, ${c}), so c = ${c}`,
        `Using the two points (0, ${c}) and (${x2}, ${y2}):`,
        `m = (${y2} - ${c}) / (${x2} - 0) = ${y2 - c} / ${x2} = ${m}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["slope_intercept_form", "identify_m", "identify_c", "interpret_diagram"], estimated_time_sec: 30,
        visual: { type: "svg" as const, svg, alt: `Coordinate grid showing line L through (0,${c}) and (${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "from_graph_yint_b": (rng) => {
    const m = rng.pick([-3, -1, 1, 3]);
    const c = rng.randInt(-2, 4);
    const x1 = -1;
    const y1 = m * x1 + c;
    const x2 = 2;
    const y2 = m * x2 + c;
    const params = { m, c };
    const allY = [y1, y2, c];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -3, 4, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#16a34a" }],
      [{ x: 0, y: c, label: `(0, ${c})` }, { x: x1, y: y1, label: `(${x1}, ${y1})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_graph_yint_b", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_graph_yint_b",
      prompt: `The diagram shows line L. Write the equation of the line in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `y-intercept is at (0, ${c}), so c = ${c}`,
        `Using (${x1}, ${y1}) and (0, ${c}): m = (${c} - ${y1}) / (0 - ${x1}) = ${c - y1} / ${-x1} = ${m}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["slope_intercept_form", "identify_m", "identify_c", "interpret_diagram"], estimated_time_sec: 30,
        visual: { type: "svg" as const, svg, alt: `Line L on coordinate grid through (0,${c}) and (${x1},${y1})`, width: 420, height: 280 }
      }
    };
  },

  "from_m_and_c_neg_e": (rng) => {
    const m = rng.pick([-3, -2, -1]);
    const c = rng.randInt(1, 8);
    const params = { m, c };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_neg_e", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_neg_e",
      prompt: `Find the equation of a line with gradient ${m} and y-intercept ${c}.`,
      answer: eq,
      worked_solution: [
        `m = ${m}, c = ${c}`,
        `y = mx + c`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 15 }
    };
  },

  "from_m_and_c_f": (rng) => {
    const m = rng.pick([1, 2, 3]);
    const c = rng.randInt(-8, -1);
    const params = { m, c };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("easy", "from_m_and_c_f", params),
      topic: "finding_equations_of_lines", difficulty: "easy", archetype: "from_m_and_c_f",
      prompt: `Write the equation of a line with slope ${m} that crosses the y-axis at ${c}.`,
      answer: eq,
      worked_solution: [
        `m = ${m}, c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["slope_intercept_form", "identify_m", "identify_c"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "from_two_points_a": (rng) => {
    const x1 = rng.randInt(-3, 2);
    const y1 = rng.randInt(-4, 4);
    const dx = rng.pick([1, 2, 3]);
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const x2 = x1 + dx;
    const y2 = y1 + m * dx;
    const c = y1 - m * x1;
    const params = { x1, y1, x2, y2 };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("medium", "from_two_points_a", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_two_points_a",
      prompt: `Find the equation of the line passing through (${x1}, ${y1}) and (${x2}, ${y2}). Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `m = (y2 - y1) / (x2 - x1) = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}`,
        `Using y = mx + c with point (${x1}, ${y1}):`,
        `${y1} = ${m}(${x1}) + c`,
        `${y1} = ${m * x1} + c`,
        `c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 40 }
    };
  },

  "from_two_points_b": (rng) => {
    const x1 = rng.randInt(0, 3);
    const y1 = rng.randInt(-3, 3);
    const dx = rng.pick([2, 4]);
    const dy = rng.pick([-4, -2, 2, 4]);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const mNum = dy;
    const mDen = dx;
    const g = gcd(Math.abs(mNum), Math.abs(mDen));
    const sN = mNum / g;
    const sD = mDen / g;
    const c = y1 - (sN * x1) / sD;
    const params = { x1, y1, x2, y2 };
    const cInt = Number.isInteger(c) ? c : null;
    if (cInt !== null) {
      const eq = formatEquation(sN, sD, cInt);
      return {
        id: makeId("medium", "from_two_points_b", params),
        topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_two_points_b",
        prompt: `Find the equation of the line through A(${x1}, ${y1}) and B(${x2}, ${y2}).`,
        answer: eq,
        worked_solution: [
          `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${dy} / ${dx} = ${simplifyFraction(mNum, mDen)}`,
          `Using point A(${x1}, ${y1}): ${y1} = (${simplifyFraction(sN, sD)})(${x1}) + c`,
          `c = ${cInt}`,
          `Equation: ${eq}`,
        ],
        metadata: { params, skills: ["gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 45 }
      };
    }
    const cN = y1 * sD - sN * x1;
    const eq = formatEquationFracC(sN, sD, cN, sD);
    return {
      id: makeId("medium", "from_two_points_b", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_two_points_b",
      prompt: `Find the equation of the line through A(${x1}, ${y1}) and B(${x2}, ${y2}).`,
      answer: eq,
      worked_solution: [
        `m = ${dy}/${dx} = ${simplifyFraction(sN, sD)}`,
        `c = ${simplifyFraction(cN, sD)}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 45 }
    };
  },

  "from_point_and_gradient_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const px = rng.randInt(-3, 4);
    const py = rng.randInt(-5, 5);
    const c = py - m * px;
    const params = { m, px, py };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("medium", "from_point_and_gradient_a", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_point_and_gradient_a",
      prompt: `Find the equation of the line with gradient ${m} that passes through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Using y = mx + c with m = ${m}`,
        `Substitute (${px}, ${py}): ${py} = ${m}(${px}) + c`,
        `${py} = ${m * px} + c`,
        `c = ${py} - ${m * px} = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["solve_for_c", "line_equation"], estimated_time_sec: 35 }
    };
  },

  "from_point_and_gradient_frac": (rng) => {
    const num = rng.pick([-3, -1, 1, 3]);
    const den = rng.pick([2, 4]);
    const g = gcd(Math.abs(num), den);
    const sN = num / g;
    const sD = den / g;
    const px = sD * rng.randInt(0, 2);
    const py = rng.randInt(-3, 3);
    const c = py - (sN * px) / sD;
    const params = { num, den, px, py };
    const cInt = Number.isInteger(c) ? c : 0;
    const eq = formatEquation(sN, sD, cInt);
    return {
      id: makeId("medium", "from_point_and_gradient_frac", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_point_and_gradient_frac",
      prompt: `Find the equation of the line with gradient ${simplifyFraction(num, den)} passing through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `m = ${simplifyFraction(sN, sD)}`,
        `Using (${px}, ${py}): ${py} = (${simplifyFraction(sN, sD)})(${px}) + c`,
        `c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["solve_for_c", "line_equation"], estimated_time_sec: 40 }
    };
  },

  "parallel_through_point_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 4);
    const px = rng.randInt(-2, 4);
    const py = rng.randInt(-5, 5);
    const c2 = py - m * px;
    const params = { m, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquation(m, 1, c2);
    return {
      id: makeId("medium", "parallel_through_point_a", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "parallel_through_point_a",
      prompt: `Find the equation of the line parallel to y = ${m === 1 ? "" : m === -1 ? "-" : m}x ${c1Str} that passes through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Parallel lines have equal gradients, so m = ${m}`,
        `Using (${px}, ${py}): ${py} = ${m}(${px}) + c`,
        `c = ${py} - ${m * px} = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "solve_for_c", "line_equation"], estimated_time_sec: 40 }
    };
  },

  "visual_two_points_med_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = rng.randInt(-2, 3);
    const x1 = -1;
    const y1 = m * x1 + c;
    const x2 = 2;
    const y2 = m * x2 + c;
    const params = { m, c };
    const allY = [y1, y2, c];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -3, 5, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#2563eb" }],
      [{ x: x1, y: y1, label: `A(${x1}, ${y1})` }, { x: x2, y: y2, label: `B(${x2}, ${y2})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("medium", "visual_two_points_med_a", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "visual_two_points_med_a",
      prompt: `Using the diagram, find the equation of line L in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `From the diagram, A(${x1}, ${y1}) and B(${x2}, ${y2}) are on the line`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}`,
        `Using point A: ${y1} = ${m}(${x1}) + c => c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["gradient_from_points", "solve_for_c", "interpret_diagram", "line_equation"], estimated_time_sec: 45,
        visual: { type: "svg" as const, svg, alt: `Coordinate grid showing line L through A(${x1},${y1}) and B(${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "visual_slope_yint_med": (rng) => {
    const m = rng.pick([-1, 1, 2, -2]);
    const c = rng.randInt(-2, 3);
    const x1 = 0;
    const y1 = c;
    const run = rng.pick([1, 2]);
    const rise = m * run;
    const x2 = x1 + run;
    const y2 = y1 + rise;
    const params = { m, c, run };
    const allY = [y1, y2];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;

    let svg = makeSvgGrid(420, 280, -3, 5, yMin, yMax,
      [{ x1: -2, y1: m * (-2) + c, x2: 4, y2: m * 4 + c, label: "L", color: "#9333ea" }],
      [{ x: 0, y: c, label: `(0, ${c})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("medium", "visual_slope_yint_med", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "visual_slope_yint_med",
      prompt: `The diagram shows line L crossing the y-axis at (0, ${c}). The gradient is ${m}. Write the equation of line L.`,
      answer: eq,
      worked_solution: [
        `y-intercept c = ${c}`,
        `gradient m = ${m}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["slope_intercept_form", "interpret_diagram", "identify_m", "identify_c"], estimated_time_sec: 30,
        visual: { type: "svg" as const, svg, alt: `Line L on grid with y-intercept at (0,${c})`, width: 420, height: 280 }
      }
    };
  },

  "from_two_points_c": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const x1 = 0;
    const y1 = rng.randInt(-3, 3);
    const x2 = rng.randInt(2, 5);
    const y2 = y1 + m * x2;
    const c = y1;
    const params = { x1, y1, x2, y2 };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("medium", "from_two_points_c", params),
      topic: "finding_equations_of_lines", difficulty: "medium", archetype: "from_two_points_c",
      prompt: `A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). Find its equation.`,
      answer: eq,
      worked_solution: [
        `Since one point is (0, ${y1}), the y-intercept c = ${y1}`,
        `m = (${y2} - ${y1}) / (${x2} - 0) = ${y2 - y1} / ${x2} = ${m}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 35 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "two_points_frac_slope_a": (rng) => {
    const num = rng.pick([-3, -1, 1, 3]);
    const den = rng.pick([2, 4]);
    const g = gcd(Math.abs(num), den);
    const sN = num / g;
    const sD = den / g;
    const x1 = rng.randInt(0, 2);
    const y1 = rng.randInt(-3, 3);
    const x2 = x1 + sD * rng.pick([1, 2]);
    const y2 = y1 + sN * ((x2 - x1) / sD);
    const c = y1 - (sN * x1) / sD;
    const params = { x1, y1, x2, y2 };
    const cInt = Number.isInteger(c) ? c : 0;
    const eq = formatEquation(sN, sD, cInt);
    return {
      id: makeId("hard", "two_points_frac_slope_a", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "two_points_frac_slope_a",
      prompt: `Find the equation of the line through (${x1}, ${y1}) and (${x2}, ${y2}). Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${simplifyFraction(y2 - y1, x2 - x1)}`,
        `Using (${x1}, ${y1}): ${y1} = (${simplifyFraction(sN, sD)})(${x1}) + c`,
        `c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["fraction_slope", "gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 50 }
    };
  },

  "two_points_frac_slope_b": (rng) => {
    const sN = rng.pick([-3, -1, 1, 3]);
    const sD = 2;
    const x1 = rng.pick([-2, 0, 2]);
    const y1 = rng.randInt(-2, 2);
    const x2 = x1 + sD * 2;
    const y2 = y1 + sN * 2;
    const c = y1 - (sN * x1) / sD;
    const cInt = Math.round(c);
    const params = { x1, y1, x2, y2 };
    const eq = formatEquation(sN, sD, cInt);
    return {
      id: makeId("hard", "two_points_frac_slope_b", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "two_points_frac_slope_b",
      prompt: `Find the equation of the line passing through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      answer: eq,
      worked_solution: [
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${simplifyFraction(sN, sD)}`,
        `c = ${y1} - (${simplifyFraction(sN, sD)})(${x1}) = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["fraction_slope", "gradient_from_points", "solve_for_c", "line_equation"], estimated_time_sec: 50 }
    };
  },

  "parallel_and_yint": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 4);
    const yint = rng.randInt(-5, 5);
    const params = { m, c1, yint };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquation(m, 1, yint);
    return {
      id: makeId("hard", "parallel_and_yint", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "parallel_and_yint",
      prompt: `A line is parallel to y = ${m === 1 ? "" : m === -1 ? "-" : m}x ${c1Str} and has y-intercept ${yint}. Find its equation.`,
      answer: eq,
      worked_solution: [
        `Parallel means same gradient: m = ${m}`,
        `y-intercept c = ${yint}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "line_equation", "multi_step"], estimated_time_sec: 35 }
    };
  },

  "visual_two_points_hard_a": (rng) => {
    const sN = rng.pick([-1, 1, 3]);
    const sD = 2;
    const c = rng.randInt(-2, 2);
    const x1 = 0;
    const y1 = c;
    const x2 = sD * 2;
    const y2 = c + sN * 2;
    const params = { sN, c };
    const allY = [y1, y2, c];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -3, 6, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#dc2626" }],
      [{ x: x1, y: y1, label: `A(${x1}, ${y1})` }, { x: x2, y: y2, label: `B(${x2}, ${y2})` }]
    );
    const eq = formatEquation(sN, sD, c);
    return {
      id: makeId("hard", "visual_two_points_hard_a", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "visual_two_points_hard_a",
      prompt: `From the diagram, find the equation of line L. Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `Read points A(${x1}, ${y1}) and B(${x2}, ${y2}) from the diagram`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${simplifyFraction(sN, sD)}`,
        `c = ${c} (y-intercept at A)`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["fraction_slope", "interpret_diagram", "line_equation"], estimated_time_sec: 50,
        visual: { type: "svg" as const, svg, alt: `Line L on grid through A(${x1},${y1}) and B(${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "visual_parallel_hard": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-2, 2);
    const px = rng.randInt(1, 3);
    const py = rng.randInt(-3, 3);
    const c2 = py - m * px;
    const params = { m, c1, px, py };
    const x1 = -2;
    const y1L = m * x1 + c1;
    const x2 = 3;
    const y2L = m * x2 + c1;
    const allY = [y1L, y2L, c1, py];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [{ x1, y1: y1L, x2, y2: y2L, label: "L", color: "#2563eb" }],
      [{ x: px, y: py, label: `P(${px}, ${py})` }]
    );
    const eq = formatEquation(m, 1, c2);
    return {
      id: makeId("hard", "visual_parallel_hard", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "visual_parallel_hard",
      prompt: `The diagram shows line L and point P. Find the equation of the line parallel to L that passes through P. (Line L has equation y = ${m === 1 ? "" : m === -1 ? "-" : m}x ${c1 >= 0 ? "+" : "-"} ${Math.abs(c1)}.)`,
      answer: eq,
      worked_solution: [
        `Line L has gradient m = ${m}`,
        `A parallel line through P(${px}, ${py}) has the same gradient`,
        `${py} = ${m}(${px}) + c`,
        `c = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "solve_for_c", "interpret_diagram", "line_equation"], estimated_time_sec: 50,
        visual: { type: "svg" as const, svg, alt: `Line L and point P(${px},${py}) on coordinate grid`, width: 420, height: 280 }
      }
    };
  },

  "point_gradient_neg": (rng) => {
    const m = rng.pick([-3, -2, -1]);
    const px = rng.randInt(1, 5);
    const py = rng.randInt(-5, 5);
    const c = py - m * px;
    const params = { m, px, py };
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("hard", "point_gradient_neg", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "point_gradient_neg",
      prompt: `A line has gradient ${m} and passes through (${px}, ${py}). Find its equation in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `m = ${m}`,
        `${py} = ${m}(${px}) + c`,
        `${py} = ${m * px} + c`,
        `c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["solve_for_c", "line_equation", "multi_step"], estimated_time_sec: 40 }
    };
  },

  "parallel_frac_slope": (rng) => {
    const sN = rng.pick([-1, 1, 3]);
    const sD = 2;
    const c1 = rng.randInt(-3, 3);
    const px = sD * rng.randInt(0, 2);
    const py = rng.randInt(-3, 3);
    const c2 = py - (sN * px) / sD;
    const params = { sN, c1, px, py };
    const cInt = Number.isInteger(c2) ? c2 : 0;
    const mStr = simplifyFraction(sN, sD);
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquation(sN, sD, cInt);
    return {
      id: makeId("hard", "parallel_frac_slope", params),
      topic: "finding_equations_of_lines", difficulty: "hard", archetype: "parallel_frac_slope",
      prompt: `Find the equation of the line parallel to y = (${sN}/${sD})x ${c1Str} that passes through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Parallel means same gradient: m = ${mStr}`,
        `Using (${px}, ${py}): ${py} = (${mStr})(${px}) + c`,
        `c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "fraction_slope", "solve_for_c", "line_equation"], estimated_time_sec: 50 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "perpendicular_a": (rng) => {
    const m1 = rng.pick([-3, -2, 2, 3]);
    const c1 = rng.randInt(-3, 3);
    const px = rng.randInt(-2, 3);
    const py = rng.randInt(-4, 4);
    const perpNum = -1;
    const perpDen = m1;
    const g = gcd(1, Math.abs(m1));
    const sN = perpNum * (m1 < 0 ? -1 : 1);
    const sD = Math.abs(m1);
    const c2Num = py * sD - sN * px;
    const c2Den = sD;
    const c2 = c2Num / c2Den;
    const params = { m1, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const cInt = Number.isInteger(c2) ? c2 : 0;
    const eq = formatEquation(sN, sD, cInt);
    return {
      id: makeId("challenge", "perpendicular_a", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "perpendicular_a",
      prompt: `Find the equation of the line perpendicular to y = ${m1}x ${c1Str} that passes through (${px}, ${py}). Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `The given line has gradient ${m1}`,
        `Perpendicular gradient = -1/${m1} = ${simplifyFraction(sN, sD)}`,
        `Using (${px}, ${py}): ${py} = (${simplifyFraction(sN, sD)})(${px}) + c`,
        `c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["perpendicular_lines", "solve_for_c", "line_equation", "multi_step_reasoning"], estimated_time_sec: 55 }
    };
  },

  "perpendicular_b": (rng) => {
    const m1 = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 3);
    const px = rng.randInt(0, 4);
    const py = rng.randInt(-3, 3);
    const sN = -1;
    const sD = m1;
    const gVal = gcd(1, Math.abs(m1));
    const pN = sN * (m1 < 0 ? -1 : 1);
    const pD = Math.abs(m1);
    const c2 = py - (pN * px) / pD;
    const params = { m1, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const cInt = Number.isInteger(c2) ? c2 : 0;
    const eq = formatEquation(pN, pD, cInt);
    return {
      id: makeId("challenge", "perpendicular_b", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "perpendicular_b",
      prompt: `A line is perpendicular to y = ${m1 === 1 ? "" : m1 === -1 ? "-" : m1}x ${c1Str} and passes through (${px}, ${py}). Find its equation.`,
      answer: eq,
      worked_solution: [
        `Given gradient = ${m1}`,
        `Perpendicular gradient = ${simplifyFraction(pN, pD)}`,
        `Using (${px}, ${py}): c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["perpendicular_lines", "solve_for_c", "line_equation"], estimated_time_sec: 50 }
    };
  },

  "visual_from_graph_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = rng.randInt(-2, 3);
    const x1 = -2;
    const y1 = m * x1 + c;
    const x2 = 3;
    const y2 = m * x2 + c;
    const params = { m, c };
    const allY = [y1, y2];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#059669" }],
      [{ x: x1, y: y1, label: `(${x1}, ${y1})` }, { x: x2, y: y2, label: `(${x2}, ${y2})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("challenge", "visual_from_graph_a", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "visual_from_graph_a",
      prompt: `Two points are labelled on line L in the diagram. Find the equation of line L in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `Read the points: (${x1}, ${y1}) and (${x2}, ${y2})`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}`,
        `Using (${x1}, ${y1}): ${y1} = ${m}(${x1}) + c => c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["gradient_from_points", "interpret_graph", "solve_for_c", "line_equation"], estimated_time_sec: 55,
        visual: { type: "svg" as const, svg, alt: `Line L with points (${x1},${y1}) and (${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "visual_from_graph_b": (rng) => {
    const m = rng.pick([-3, -1, 1, 3]);
    const c = rng.randInt(-1, 2);
    const x1 = 0;
    const y1 = c;
    const x2 = rng.pick([2, 3]);
    const y2 = m * x2 + c;
    const params = { m, c, x2 };
    const allY = [y1, y2];
    const yMin = Math.min(...allY, -2) - 1;
    const yMax = Math.max(...allY, 2) + 1;
    const svg = makeSvgGrid(420, 280, -3, 5, yMin, yMax,
      [{ x1: -2, y1: m * (-2) + c, x2: 4, y2: m * 4 + c, label: "L", color: "#7c3aed" }],
      [{ x: x1, y: y1, label: `A(${x1}, ${y1})` }, { x: x2, y: y2, label: `B(${x2}, ${y2})` }]
    );
    const eq = formatEquation(m, 1, c);
    return {
      id: makeId("challenge", "visual_from_graph_b", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "visual_from_graph_b",
      prompt: `Points A and B are shown on line L. Find the equation of line L.`,
      answer: eq,
      worked_solution: [
        `A(${x1}, ${y1}) and B(${x2}, ${y2})`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2} = ${m}`,
        `c = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["gradient_from_points", "interpret_graph", "line_equation"], estimated_time_sec: 50,
        visual: { type: "svg" as const, svg, alt: `Line L through A(${x1},${y1}) and B(${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "mixed_constraints": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-3, 3);
    const x1 = rng.randInt(-2, 3);
    const y1 = m * x1 + rng.randInt(-1, 1);
    const c2 = y1 - m * x1;
    const x2 = x1 + rng.pick([2, 3]);
    const y2 = m * x2 + c2;
    const params = { m, c1, x1, y1: y1, x2, y2 };
    const eq = formatEquation(m, 1, c2);
    return {
      id: makeId("challenge", "mixed_constraints", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "mixed_constraints",
      prompt: `A line passes through (${x1}, ${m * x1 + c2}) and (${x2}, ${y2}), and is parallel to y = ${m === 1 ? "" : m === -1 ? "-" : m}x ${c1 >= 0 ? "+" : "-"} ${Math.abs(c1)}. Verify these constraints are consistent and find the equation.`,
      answer: eq,
      worked_solution: [
        `From the parallel line: m = ${m}`,
        `Check: gradient between (${x1}, ${m * x1 + c2}) and (${x2}, ${y2}) = (${y2} - ${m * x1 + c2}) / (${x2} - ${x1}) = ${y2 - (m * x1 + c2)} / ${x2 - x1} = ${m} ✓`,
        `Using (${x1}, ${m * x1 + c2}): c = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "gradient_from_points", "multi_step_reasoning", "line_equation"], estimated_time_sec: 60 }
    };
  },

  "perpendicular_frac": (rng) => {
    const sN = rng.pick([2, 3]);
    const sD = 1;
    const perpN = -1;
    const perpD = sN;
    const c1 = rng.randInt(-3, 3);
    const px = sN * rng.randInt(0, 2);
    const py = rng.randInt(-3, 3);
    const c2 = py - (perpN * px) / perpD;
    const params = { sN, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const cInt = Number.isInteger(c2) ? c2 : 0;
    const eq = formatEquation(perpN, perpD, cInt);
    return {
      id: makeId("challenge", "perpendicular_frac", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "perpendicular_frac",
      prompt: `Find the equation of the line perpendicular to y = ${sN}x ${c1Str} passing through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Given gradient = ${sN}`,
        `Perpendicular gradient = -1/${sN} = ${simplifyFraction(perpN, perpD)}`,
        `Using (${px}, ${py}): c = ${cInt}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["perpendicular_lines", "solve_for_c", "line_equation", "multi_step_reasoning"], estimated_time_sec: 55 }
    };
  },

  "from_xint_and_yint": (rng) => {
    const xint = rng.pick([-4, -3, -2, 2, 3, 4]);
    let yint = rng.randInt(-5, 5);
    if (yint === 0) yint = rng.pick([-3, -2, -1, 1, 2, 3]);
    const mNum = -yint;
    const mDen = xint;
    const g = gcd(Math.abs(mNum), Math.abs(mDen));
    const sN = (mNum / g) * (mDen < 0 ? -1 : 1);
    const sD = Math.abs(mDen / g);
    const params = { xint, yint };
    const cVal = yint;
    const eq = sD === 1 ? formatEquation(sN, 1, cVal) : formatEquation(sN, sD, cVal);
    return {
      id: makeId("challenge", "from_xint_and_yint", params),
      topic: "finding_equations_of_lines", difficulty: "challenge", archetype: "from_xint_and_yint",
      prompt: `A line crosses the x-axis at (${xint}, 0) and the y-axis at (0, ${yint}). Find its equation.`,
      answer: eq,
      worked_solution: [
        `Two points: (${xint}, 0) and (0, ${yint})`,
        `m = (${yint} - 0) / (0 - ${xint}) = ${yint} / ${-xint} = ${simplifyFraction(sN, sD)}`,
        `c = ${yint}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["gradient_from_points", "line_equation", "multi_step_reasoning"], estimated_time_sec: 45 }
    };
  },
};

const ARCHETYPE_MAP: Record<string, Record<string, ArchetypeGenerator>> = {
  easy: EASY_ARCHETYPES,
  medium: MEDIUM_ARCHETYPES,
  hard: HARD_ARCHETYPES,
  challenge: CHALLENGE_ARCHETYPES,
};

export function generateQuestion(difficulty: "easy" | "medium" | "hard" | "challenge", seed?: number): GeneratedQuestion {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = ARCHETYPE_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const key = keys[Math.floor(rng.next() * keys.length)];
  return archetypes[key](rng);
}

export function generatePool(difficulty: "easy" | "medium" | "hard" | "challenge", n: number, seed?: number, ensureUnique = true): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = ARCHETYPE_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const results: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (results.length < n && attempts < n * 10) {
    attempts++;
    const key = keys[Math.floor(rng.next() * keys.length)];
    const q = archetypes[key](rng);
    if (ensureUnique && seen.has(q.id)) continue;
    seen.add(q.id);
    results.push(q);
  }
  return results;
}

export function generateMixedPool(config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[], seed?: number): GeneratedQuestion[] {
  const baseSeed = seed ?? Date.now();
  const results: GeneratedQuestion[] = [];
  for (let i = 0; i < config.length; i++) {
    const { difficulty, count } = config[i];
    const pool = generatePool(difficulty, count, baseSeed + i * 1000);
    results.push(...pool);
  }
  return results;
}
