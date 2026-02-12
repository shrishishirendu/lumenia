import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "gradient_and_parallel_lines";
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

function formatSlope(num: number, den: number = 1): string {
  return simplifyFraction(num, den);
}

function formatEquation(m: string, c: number): string {
  if (c === 0) return `y=${m}x`;
  const cStr = c > 0 ? `+${c}` : `${c}`;
  return `y=${m}x${cStr}`;
}

function formatEquationFromNums(mNum: number, mDen: number, c: number): string {
  const mStr = simplifyFraction(mNum, mDen);
  const mCoeff = mStr === "1" ? "" : mStr === "-1" ? "-" : mStr;
  if (c === 0) return `y=${mCoeff}x`;
  const cStr = c > 0 ? `+${c}` : `${c}`;
  return `y=${mCoeff}x${cStr}`;
}

function makeSvgGrid(
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
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
  "slope_from_points_a": (rng) => {
    const x1 = rng.randInt(-3, 3);
    const y1 = rng.randInt(-3, 3);
    const dx = rng.pick([1, 2, 3]);
    const dy = rng.randInt(-3, 3);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const params = { x1, y1, x2, y2 };
    const ans = formatSlope(dy, dx);
    return {
      id: makeId("easy", "slope_from_points_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_points_a",
      prompt: `Find the gradient of the line passing through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      answer: ans,
      worked_solution: [
        `Gradient = (y2 - y1) / (x2 - x1)`,
        `= (${y2} - ${y1}) / (${x2} - ${x1})`,
        `= ${dy} / ${dx}`,
        `= ${ans}`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 30 }
    };
  },

  "slope_from_points_b": (rng) => {
    const x1 = rng.randInt(0, 5);
    const y1 = rng.randInt(0, 5);
    const dx = rng.pick([2, 4]);
    const dy = rng.pick([-4, -2, 2, 4, 6]);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const params = { x1, y1, x2, y2 };
    const ans = formatSlope(dy, dx);
    return {
      id: makeId("easy", "slope_from_points_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_points_b",
      prompt: `Calculate the gradient between points A(${x1}, ${y1}) and B(${x2}, ${y2}).`,
      answer: ans,
      worked_solution: [
        `Gradient m = rise / run = (y2 - y1) / (x2 - x1)`,
        `= (${y2} - ${y1}) / (${x2} - ${x1})`,
        `= ${dy} / ${dx}`,
        `= ${ans}`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 30 }
    };
  },

  "slope_from_points_neg": (rng) => {
    const x1 = rng.randInt(1, 4);
    const y1 = rng.randInt(2, 6);
    const dx = rng.pick([1, 2, 3]);
    const dy = rng.randInt(-5, -1);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const params = { x1, y1, x2, y2 };
    const ans = formatSlope(dy, dx);
    return {
      id: makeId("easy", "slope_from_points_neg", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_points_neg",
      prompt: `Find the gradient of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      answer: ans,
      worked_solution: [
        `Gradient = (y2 - y1) / (x2 - x1)`,
        `= (${y2} - ${y1}) / (${x2} - ${x1})`,
        `= ${dy} / ${dx}`,
        `= ${ans}`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 30 }
    };
  },

  "slope_from_points_zero": (rng) => {
    const y = rng.randInt(-3, 5);
    const x1 = rng.randInt(-2, 2);
    const x2 = x1 + rng.randInt(2, 5);
    const params = { x1, y, x2 };
    return {
      id: makeId("easy", "slope_from_points_zero", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_points_zero",
      prompt: `Find the gradient of the line through (${x1}, ${y}) and (${x2}, ${y}).`,
      answer: "0",
      worked_solution: [
        `Both points have the same y-coordinate (${y})`,
        `Gradient = (${y} - ${y}) / (${x2} - ${x1}) = 0 / ${x2 - x1} = 0`,
        `A horizontal line has gradient 0.`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 20 }
    };
  },

  "slope_from_equation_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3, 4]);
    const c = rng.randInt(-5, 5);
    const params = { m, c };
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("easy", "slope_from_equation_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_equation_a",
      prompt: `What is the gradient of the line y = ${m}x ${cStr}?`,
      answer: `${m}`,
      worked_solution: [
        `The equation is in the form y = mx + c`,
        `The gradient m is the coefficient of x`,
        `m = ${m}`,
      ],
      metadata: { params, skills: ["gradient_from_equation"], estimated_time_sec: 15 }
    };
  },

  "slope_from_equation_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c = rng.randInt(-4, 4);
    const params = { m, c };
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("easy", "slope_from_equation_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_equation_b",
      prompt: `Identify the gradient from the equation y = ${m}x ${cStr}.`,
      answer: `${m}`,
      worked_solution: [
        `In y = mx + c, the gradient is m`,
        `Here m = ${m}`,
      ],
      metadata: { params, skills: ["gradient_from_equation"], estimated_time_sec: 15 }
    };
  },

  "slope_from_equation_frac": (rng) => {
    const num = rng.pick([-3, -1, 1, 3]);
    const den = rng.pick([2, 4]);
    const c = rng.randInt(-3, 3);
    const params = { num, den, c };
    const mStr = simplifyFraction(num, den);
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("easy", "slope_from_equation_frac", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_equation_frac",
      prompt: `What is the gradient of y = (${num}/${den})x ${cStr}?`,
      answer: mStr,
      worked_solution: [
        `The gradient is the coefficient of x`,
        `m = ${num}/${den} = ${mStr}`,
      ],
      metadata: { params, skills: ["gradient_from_equation"], estimated_time_sec: 20 }
    };
  },

  "slope_from_equation_unit": (rng) => {
    const c = rng.randInt(-5, 5);
    const neg = rng.pick([true, false]);
    const params = { neg: neg ? 1 : 0, c };
    const sign = neg ? "-" : "";
    const mVal = neg ? -1 : 1;
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("easy", "slope_from_equation_unit", params),
      topic: "gradient_and_parallel_lines", difficulty: "easy", archetype: "slope_from_equation_unit",
      prompt: `State the gradient of y = ${sign}x ${cStr}.`,
      answer: `${mVal}`,
      worked_solution: [
        `y = ${sign}x ${cStr} is in the form y = mx + c`,
        `The coefficient of x is ${mVal}`,
        `So the gradient is ${mVal}`,
      ],
      metadata: { params, skills: ["gradient_from_equation"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "parallel_from_equations_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-5, 5);
    let c2 = rng.randInt(-5, 5);
    while (c2 === c1) c2 = rng.randInt(-5, 5);
    const params = { m, c1, c2 };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const c2Str = c2 >= 0 ? `+ ${c2}` : `- ${Math.abs(c2)}`;
    return {
      id: makeId("medium", "parallel_from_equations_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "parallel_from_equations_a",
      prompt: `Are the lines y = ${m}x ${c1Str} and y = ${m}x ${c2Str} parallel? Answer Yes or No with a reason.`,
      answer: "Yes",
      worked_solution: [
        `Line 1 has gradient ${m}`,
        `Line 2 has gradient ${m}`,
        `Both gradients are equal, so the lines are parallel.`,
      ],
      metadata: { params, skills: ["parallel_lines", "compare_gradients"], estimated_time_sec: 25 }
    };
  },

  "parallel_from_equations_no": (rng) => {
    const m1 = rng.pick([-3, -2, -1, 1, 2, 3]);
    let m2 = rng.pick([-3, -2, -1, 1, 2, 3]);
    while (m2 === m1) m2 = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 4);
    const c2 = rng.randInt(-4, 4);
    const params = { m1, m2, c1, c2 };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const c2Str = c2 >= 0 ? `+ ${c2}` : `- ${Math.abs(c2)}`;
    return {
      id: makeId("medium", "parallel_from_equations_no", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "parallel_from_equations_no",
      prompt: `Are the lines y = ${m1}x ${c1Str} and y = ${m2}x ${c2Str} parallel? Answer Yes or No.`,
      answer: "No",
      worked_solution: [
        `Line 1 has gradient ${m1}`,
        `Line 2 has gradient ${m2}`,
        `The gradients are not equal (${m1} ≠ ${m2}), so the lines are NOT parallel.`,
      ],
      metadata: { params, skills: ["parallel_lines", "compare_gradients"], estimated_time_sec: 25 }
    };
  },

  "find_missing_m_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3, 4]);
    const c1 = rng.randInt(-5, 5);
    const c2 = rng.randInt(-5, 5);
    const params = { m, c1, c2 };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const c2Str = c2 >= 0 ? `+ ${c2}` : `- ${Math.abs(c2)}`;
    return {
      id: makeId("medium", "find_missing_m_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "find_missing_m_a",
      prompt: `Find the value of k so that y = kx ${c2Str} is parallel to y = ${m}x ${c1Str}.`,
      answer: `${m}`,
      worked_solution: [
        `Parallel lines have equal gradients`,
        `The first line has gradient ${m}`,
        `So k = ${m}`,
      ],
      metadata: { params, skills: ["parallel_lines", "solve_for_parameter"], estimated_time_sec: 25 }
    };
  },

  "find_missing_m_frac": (rng) => {
    const num = rng.pick([-3, -1, 1, 3]);
    const den = rng.pick([2, 4]);
    const c1 = rng.randInt(-3, 3);
    const c2 = rng.randInt(-3, 3);
    const params = { num, den, c1, c2 };
    const mStr = simplifyFraction(num, den);
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const c2Str = c2 >= 0 ? `+ ${c2}` : `- ${Math.abs(c2)}`;
    return {
      id: makeId("medium", "find_missing_m_frac", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "find_missing_m_frac",
      prompt: `Find k so that y = kx ${c2Str} is parallel to y = (${num}/${den})x ${c1Str}.`,
      answer: mStr,
      worked_solution: [
        `Parallel lines share the same gradient`,
        `Gradient of the given line = ${num}/${den} = ${mStr}`,
        `So k = ${mStr}`,
      ],
      metadata: { params, skills: ["parallel_lines", "solve_for_parameter"], estimated_time_sec: 30 }
    };
  },

  "slope_from_table": (rng) => {
    const x1 = rng.randInt(0, 3);
    const y1 = rng.randInt(-2, 4);
    const dx = rng.pick([1, 2, 3]);
    const dy = rng.randInt(-4, 4);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const params = { x1, y1, x2, y2 };
    const ans = formatSlope(dy, dx);
    return {
      id: makeId("medium", "slope_from_table", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "slope_from_table",
      prompt: `A line passes through the points shown in the table:\n| x | y |\n|---|---|\n| ${x1} | ${y1} |\n| ${x2} | ${y2} |\n\nFind the gradient.`,
      answer: ans,
      worked_solution: [
        `Use the gradient formula: m = (y2 - y1) / (x2 - x1)`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1})`,
        `m = ${dy} / ${dx}`,
        `m = ${ans}`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 30 }
    };
  },

  "slope_from_table_b": (rng) => {
    const x1 = rng.randInt(-2, 2);
    const y1 = rng.randInt(-3, 3);
    const dx = rng.pick([2, 3, 4]);
    const dy = rng.pick([-6, -4, -2, 2, 4, 6]);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const x3 = x2 + dx;
    const y3 = y2 + dy;
    const params = { x1, y1, dx, dy };
    const ans = formatSlope(dy, dx);
    return {
      id: makeId("medium", "slope_from_table_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "slope_from_table_b",
      prompt: `A line passes through these points:\n| x | y |\n|---|---|\n| ${x1} | ${y1} |\n| ${x2} | ${y2} |\n| ${x3} | ${y3} |\n\nWhat is the gradient?`,
      answer: ans,
      worked_solution: [
        `Pick any two points, e.g. (${x1}, ${y1}) and (${x2}, ${y2})`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${dy} / ${dx} = ${ans}`,
      ],
      metadata: { params, skills: ["gradient_from_points"], estimated_time_sec: 30 }
    };
  },

  "visual_gradient_medium_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = rng.randInt(-2, 2);
    const x1 = -2;
    const y1 = m * x1 + c;
    const x2 = 3;
    const y2 = m * x2 + c;
    const params = { m, c };
    const yMin = Math.min(y1, y2, -2) - 1;
    const yMax = Math.max(y1, y2, 2) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#2563eb" }],
      [{ x: x1, y: y1, label: `(${x1},${y1})` }, { x: x2, y: y2, label: `(${x2},${y2})` }]
    );
    return {
      id: makeId("medium", "visual_gradient_medium_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "visual_gradient_medium_a",
      prompt: `Using the diagram, find the gradient of line L.`,
      answer: `${m}`,
      worked_solution: [
        `From the diagram, the line passes through (${x1}, ${y1}) and (${x2}, ${y2})`,
        `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}`,
      ],
      metadata: {
        params, skills: ["gradient_from_points", "interpret_diagram"], estimated_time_sec: 35,
        visual: { type: "svg" as const, svg, alt: `Coordinate grid showing line L through (${x1},${y1}) and (${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },

  "visual_gradient_medium_b": (rng) => {
    const m = rng.pick([-3, -1, 1, 2, 3]);
    const c = rng.randInt(-1, 2);
    const x1 = 0;
    const y1 = c;
    const x2 = 2;
    const y2 = m * x2 + c;
    const params = { m, c };
    const yMin = Math.min(y1, y2, -1) - 1;
    const yMax = Math.max(y1, y2, 1) + 1;
    const svg = makeSvgGrid(420, 280, -2, 5, yMin, yMax,
      [{ x1, y1, x2, y2, label: "L", color: "#16a34a" }],
      [{ x: x1, y: y1, label: `(${x1},${y1})` }, { x: x2, y: y2, label: `(${x2},${y2})` }]
    );
    return {
      id: makeId("medium", "visual_gradient_medium_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "medium", archetype: "visual_gradient_medium_b",
      prompt: `From the diagram below, determine the gradient of line L.`,
      answer: `${m}`,
      worked_solution: [
        `Read two labelled points: (${x1}, ${y1}) and (${x2}, ${y2})`,
        `Gradient = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}`,
      ],
      metadata: {
        params, skills: ["gradient_from_points", "interpret_diagram"], estimated_time_sec: 35,
        visual: { type: "svg" as const, svg, alt: `Line L on a coordinate grid from (${x1},${y1}) to (${x2},${y2})`, width: 420, height: 280 }
      }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "equation_given_point_and_gradient": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const px = rng.randInt(-3, 4);
    const py = rng.randInt(-5, 5);
    const c = py - m * px;
    const params = { m, px, py };
    const eq = formatEquationFromNums(m, 1, c);
    return {
      id: makeId("hard", "equation_given_point_and_gradient", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "equation_given_point_and_gradient",
      prompt: `Find the equation of the line with gradient ${m} that passes through (${px}, ${py}). Give your answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `Using y = mx + c with m = ${m}`,
        `Substitute (${px}, ${py}): ${py} = ${m}(${px}) + c`,
        `${py} = ${m * px} + c`,
        `c = ${py} - ${m * px} = ${c}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["line_equation", "solve_for_c"], estimated_time_sec: 40 }
    };
  },

  "parallel_through_point": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 4);
    const px = rng.randInt(-2, 4);
    const py = rng.randInt(-5, 5);
    const c2 = py - m * px;
    const params = { m, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquationFromNums(m, 1, c2);
    return {
      id: makeId("hard", "parallel_through_point", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "parallel_through_point",
      prompt: `Find the equation of the line parallel to y = ${m}x ${c1Str} that passes through (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Parallel lines have the same gradient, so m = ${m}`,
        `Using y = mx + c: ${py} = ${m}(${px}) + c`,
        `${py} = ${m * px} + c`,
        `c = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "line_equation", "solve_for_c"], estimated_time_sec: 45 }
    };
  },

  "identify_parallel_in_set": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-4, 4);
    const c2 = rng.randInt(-4, 4);
    while (c2 === c1) {}
    let m2 = m + rng.pick([-2, -1, 1, 2]);
    if (m2 === m) m2 = m + 1;
    let m3 = m + rng.pick([-3, -1, 1, 3]);
    if (m3 === m || m3 === m2) m3 = m - 2;
    const c3 = rng.randInt(-3, 3);
    const c4 = rng.randInt(-3, 3);
    const params = { m, m2, m3, c1, c2, c3, c4 };

    const fmtLine = (slope: number, intercept: number) => {
      const cS = intercept >= 0 ? `+ ${intercept}` : `- ${Math.abs(intercept)}`;
      return `y = ${slope}x ${cS}`;
    };

    return {
      id: makeId("hard", "identify_parallel_in_set", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "identify_parallel_in_set",
      prompt: `Which two of these lines are parallel?\nA: ${fmtLine(m, c1)}\nB: ${fmtLine(m2, c3)}\nC: ${fmtLine(m, c2)}\nD: ${fmtLine(m3, c4)}`,
      answer: "A and C",
      worked_solution: [
        `A has gradient ${m}`,
        `B has gradient ${m2}`,
        `C has gradient ${m}`,
        `D has gradient ${m3}`,
        `A and C both have gradient ${m}, so they are parallel.`,
      ],
      metadata: { params, skills: ["parallel_lines", "compare_gradients", "select_parallel"], estimated_time_sec: 35 }
    };
  },

  "equation_frac_gradient": (rng) => {
    const num = rng.pick([-3, -1, 1, 3]);
    const den = rng.pick([2, 4]);
    const px = den * rng.randInt(0, 2);
    const py = rng.randInt(-4, 4);
    const cNum = py * den - num * px;
    const cDen = den;
    const params = { num, den, px, py };
    const mStr = simplifyFraction(num, den);
    const c = py - (num * px) / den;
    const cInt = Number.isInteger(c) ? c : null;

    if (cInt !== null) {
      const eq = formatEquationFromNums(num, den, cInt);
      return {
        id: makeId("hard", "equation_frac_gradient", params),
        topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "equation_frac_gradient",
        prompt: `Find the equation of the line with gradient ${mStr} passing through (${px}, ${py}).`,
        answer: eq,
        worked_solution: [
          `m = ${mStr}`,
          `Using y = mx + c: ${py} = (${mStr})(${px}) + c`,
          `${py} = ${(num * px) / den} + c`,
          `c = ${cInt}`,
          `Equation: ${eq}`,
        ],
        metadata: { params, skills: ["line_equation", "solve_for_c"], estimated_time_sec: 45 }
      };
    }

    const eq = formatEquationFromNums(num, den, 0);
    const adjustedPy = (num * px) / den;
    const adjustedC = 0;
    return {
      id: makeId("hard", "equation_frac_gradient", { ...params, fallback: 1 }),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "equation_frac_gradient",
      prompt: `Find the equation of the line with gradient ${mStr} passing through the origin.`,
      answer: eq,
      worked_solution: [
        `m = ${mStr}, passes through (0, 0)`,
        `c = 0`,
        `Equation: ${eq}`,
      ],
      metadata: { params: { ...params, fallback: 1 }, skills: ["line_equation", "solve_for_c"], estimated_time_sec: 40 }
    };
  },

  "visual_parallel_hard_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-1, 2);
    const c2 = c1 + rng.pick([2, 3, 4]);
    const params = { m, c1, c2 };
    const x1a = -2, y1a = m * x1a + c1, x2a = 3, y2a = m * x2a + c1;
    const x1b = -2, y1b = m * x1b + c2, x2b = 3, y2b = m * x2b + c2;
    const yMin = Math.min(y1a, y2a, y1b, y2b, -1) - 1;
    const yMax = Math.max(y1a, y2a, y1b, y2b, 1) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [
        { x1: x1a, y1: y1a, x2: x2a, y2: y2a, label: "L1", color: "#2563eb" },
        { x1: x1b, y1: y1b, x2: x2b, y2: y2b, label: "L2", color: "#dc2626" },
      ]
    );
    return {
      id: makeId("hard", "visual_parallel_hard_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "visual_parallel_hard_a",
      prompt: `The diagram shows lines L1 and L2. Are they parallel? Find the gradient of each line to justify your answer.`,
      answer: "Yes",
      worked_solution: [
        `L1 passes through (${x1a}, ${y1a}) and (${x2a}, ${y2a})`,
        `Gradient of L1 = (${y2a} - ${y1a}) / (${x2a} - ${x1a}) = ${y2a - y1a} / ${x2a - x1a} = ${m}`,
        `L2 passes through (${x1b}, ${y1b}) and (${x2b}, ${y2b})`,
        `Gradient of L2 = (${y2b} - ${y1b}) / (${x2b} - ${x1b}) = ${y2b - y1b} / ${x2b - x1b} = ${m}`,
        `Both gradients are ${m}, so the lines are parallel.`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "gradient_from_points", "interpret_diagram"], estimated_time_sec: 45,
        visual: { type: "svg" as const, svg, alt: `Coordinate grid with two lines L1 and L2 that have gradient ${m}`, width: 420, height: 280 }
      }
    };
  },

  "visual_parallel_hard_b": (rng) => {
    const m1 = rng.pick([-2, -1, 1, 2]);
    let m2 = rng.pick([-2, -1, 1, 2, 3]);
    while (m2 === m1) m2 = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-1, 2);
    const c2 = rng.randInt(-1, 2);
    const params = { m1, m2, c1, c2 };
    const x1a = -2, y1a = m1 * x1a + c1, x2a = 3, y2a = m1 * x2a + c1;
    const x1b = -2, y1b = m2 * x1b + c2, x2b = 3, y2b = m2 * x2b + c2;
    const yMin = Math.min(y1a, y2a, y1b, y2b, -1) - 1;
    const yMax = Math.max(y1a, y2a, y1b, y2b, 1) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax,
      [
        { x1: x1a, y1: y1a, x2: x2a, y2: y2a, label: "L1", color: "#2563eb" },
        { x1: x1b, y1: y1b, x2: x2b, y2: y2b, label: "L2", color: "#dc2626" },
      ]
    );
    return {
      id: makeId("hard", "visual_parallel_hard_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "visual_parallel_hard_b",
      prompt: `Look at the diagram. Are lines L1 and L2 parallel? Find both gradients to explain.`,
      answer: "No",
      worked_solution: [
        `L1: gradient = (${y2a} - ${y1a}) / (${x2a} - ${x1a}) = ${m1}`,
        `L2: gradient = (${y2b} - ${y1b}) / (${x2b} - ${x1b}) = ${m2}`,
        `${m1} ≠ ${m2}, so the lines are NOT parallel.`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "gradient_from_points", "interpret_diagram"], estimated_time_sec: 45,
        visual: { type: "svg" as const, svg, alt: `Coordinate grid with two non-parallel lines L1 and L2`, width: 420, height: 280 }
      }
    };
  },

  "parallel_through_point_b": (rng) => {
    const m = rng.pick([-3, -1, 1, 2, 3]);
    const c1 = rng.randInt(-3, 3);
    const px = rng.randInt(1, 4);
    const py = rng.randInt(-3, 5);
    const c2 = py - m * px;
    const params = { m, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquationFromNums(m, 1, c2);
    return {
      id: makeId("hard", "parallel_through_point_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "hard", archetype: "parallel_through_point_b",
      prompt: `Write the equation of the line that is parallel to y = ${m}x ${c1Str} and passes through the point (${px}, ${py}).`,
      answer: eq,
      worked_solution: [
        `Parallel lines share the same gradient: m = ${m}`,
        `Substitute (${px}, ${py}): ${py} = ${m}(${px}) + c`,
        `c = ${py} - ${m * px} = ${c2}`,
        `${eq}`,
      ],
      metadata: { params, skills: ["parallel_lines", "line_equation", "solve_for_c"], estimated_time_sec: 45 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "perpendicular_gradient": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c = rng.randInt(-4, 4);
    const params = { m, c };
    const perpNum = -1;
    const perpDen = m;
    const ans = simplifyFraction(perpNum, perpDen);
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("challenge", "perpendicular_gradient", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "perpendicular_gradient",
      prompt: `The line y = ${m}x ${cStr} is given. Find the gradient of any line perpendicular to it.`,
      answer: ans,
      worked_solution: [
        `For perpendicular lines: m1 × m2 = -1`,
        `m1 = ${m}`,
        `m2 = -1 / ${m} = ${ans}`,
      ],
      metadata: { params, skills: ["perpendicular_lines"], estimated_time_sec: 30 }
    };
  },

  "perpendicular_equation": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 3);
    const px = rng.randInt(-2, 3);
    const py = rng.randInt(-3, 5);
    const perpM = -1 / m;
    const c2 = py - perpM * px;
    const params = { m, c1, px, py };
    const perpMStr = simplifyFraction(-1, m);
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquationFromNums(-1, m, c2);
    return {
      id: makeId("challenge", "perpendicular_equation", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "perpendicular_equation",
      prompt: `Find the equation of the line perpendicular to y = ${m}x ${c1Str} that passes through (${px}, ${py}). Answer in the form y = mx + c.`,
      answer: eq,
      worked_solution: [
        `Original gradient = ${m}`,
        `Perpendicular gradient = -1/${m} = ${perpMStr}`,
        `Using y = mx + c: ${py} = (${perpMStr})(${px}) + c`,
        `c = ${py} - (${perpMStr})(${px}) = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: { params, skills: ["perpendicular_lines", "line_equation", "solve_for_c"], estimated_time_sec: 50 }
    };
  },

  "multi_step_parallel": (rng) => {
    const x1 = rng.randInt(-2, 2);
    const y1 = rng.randInt(-3, 3);
    const dx = rng.pick([1, 2, 3]);
    const dy = rng.randInt(-3, 3);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const px = rng.randInt(-2, 4);
    const py = rng.randInt(-4, 4);
    const mNum = dy;
    const mDen = dx;
    const g = gcd(Math.abs(mNum), Math.abs(mDen));
    const smNum = mNum / g;
    const smDen = mDen / g;
    const cNum = py * smDen - smNum * px;
    const c = cNum / smDen;
    const params = { x1, y1, x2, y2, px, py };
    const mStr = simplifyFraction(mNum, mDen);

    if (Number.isInteger(c)) {
      const eq = formatEquationFromNums(smNum, smDen, c);
      return {
        id: makeId("challenge", "multi_step_parallel", params),
        topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "multi_step_parallel",
        prompt: `A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). Find the equation of the line parallel to it that passes through (${px}, ${py}).`,
        answer: eq,
        worked_solution: [
          `Step 1: Find gradient of original line`,
          `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${dy}/${dx} = ${mStr}`,
          `Step 2: Parallel line has same gradient: m = ${mStr}`,
          `Step 3: Find c using (${px}, ${py})`,
          `${py} = (${mStr})(${px}) + c`,
          `c = ${c}`,
          `Equation: ${eq}`,
        ],
        metadata: { params, skills: ["multi_step", "parallel_lines", "gradient_from_points", "line_equation"], estimated_time_sec: 55 }
      };
    }

    const safeC = py - smNum * px;
    const safeEq = formatEquationFromNums(smNum, smDen, safeC / smDen);
    return {
      id: makeId("challenge", "multi_step_parallel", { ...params, safe: 1 }),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "multi_step_parallel",
      prompt: `A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). Find the equation of the line parallel to it that passes through (${px}, ${py}).`,
      answer: `y=${mStr}x+${simplifyFraction(cNum, smDen)}`,
      worked_solution: [
        `Gradient = ${mStr}`,
        `Parallel gradient = ${mStr}`,
        `Find c: ${py} = (${mStr})(${px}) + c`,
        `c = ${simplifyFraction(cNum, smDen)}`,
      ],
      metadata: { params: { ...params, safe: 1 }, skills: ["multi_step", "parallel_lines", "gradient_from_points", "line_equation"], estimated_time_sec: 55 }
    };
  },

  "visual_parallel_challenge_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-1, 2);
    const c2 = c1 + rng.pick([2, 3, 4]);
    let m3 = rng.pick([-2, -1, 1, 2, 3]);
    while (m3 === m) m3 = rng.pick([-3, -1, 1, 2, 3]);
    const c3 = rng.randInt(-1, 2);
    const params = { m, m3, c1, c2, c3 };

    const lines = [
      { x1: -2, y1: m * (-2) + c1, x2: 3, y2: m * 3 + c1, label: "L1", color: "#2563eb" },
      { x1: -2, y1: m * (-2) + c2, x2: 3, y2: m * 3 + c2, label: "L2", color: "#dc2626" },
      { x1: -2, y1: m3 * (-2) + c3, x2: 3, y2: m3 * 3 + c3, label: "L3", color: "#16a34a" },
    ];
    const allY = lines.flatMap(l => [l.y1, l.y2]);
    const yMin = Math.min(...allY, -1) - 1;
    const yMax = Math.max(...allY, 1) + 1;
    const svg = makeSvgGrid(420, 280, -4, 5, yMin, yMax, lines);
    return {
      id: makeId("challenge", "visual_parallel_challenge_a", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "visual_parallel_challenge_a",
      prompt: `Three lines L1, L2, and L3 are shown. Which two are parallel? State the gradient of all three lines.`,
      answer: "L1 and L2",
      worked_solution: [
        `L1: gradient = ${m}`,
        `L2: gradient = ${m}`,
        `L3: gradient = ${m3}`,
        `L1 and L2 have the same gradient (${m}), so they are parallel.`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "interpret_diagram", "compare_gradients"], estimated_time_sec: 50,
        visual: { type: "svg" as const, svg, alt: `Three lines on a coordinate grid: L1 and L2 parallel, L3 different slope`, width: 420, height: 280 }
      }
    };
  },

  "visual_parallel_challenge_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c = rng.randInt(-1, 2);
    const px = rng.randInt(1, 3);
    const py = rng.randInt(-2, 4);
    const c2 = py - m * px;
    const params = { m, c, px, py };

    const lines = [
      { x1: -2, y1: m * (-2) + c, x2: 4, y2: m * 4 + c, label: "L", color: "#2563eb" },
    ];
    const pts = [{ x: px, y: py, label: `P(${px},${py})` }];
    const allY = [...lines.flatMap(l => [l.y1, l.y2]), py];
    const yMin = Math.min(...allY, -1) - 1;
    const yMax = Math.max(...allY, 1) + 1;
    const svg = makeSvgGrid(420, 280, -3, 5, yMin, yMax, lines, pts);
    const eq = formatEquationFromNums(m, 1, c2);
    return {
      id: makeId("challenge", "visual_parallel_challenge_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "visual_parallel_challenge_b",
      prompt: `Line L and point P are shown in the diagram. Write the equation of the line parallel to L that passes through P.`,
      answer: eq,
      worked_solution: [
        `From the diagram, L has gradient ${m}`,
        `A parallel line through P(${px}, ${py}) also has gradient ${m}`,
        `${py} = ${m}(${px}) + c => c = ${c2}`,
        `Equation: ${eq}`,
      ],
      metadata: {
        params, skills: ["parallel_lines", "line_equation", "interpret_diagram"], estimated_time_sec: 55,
        visual: { type: "svg" as const, svg, alt: `Line L and point P(${px},${py}) on a coordinate grid`, width: 420, height: 280 }
      }
    };
  },

  "multi_step_parallel_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-3, 3);
    const px = rng.randInt(-1, 3);
    const py = rng.randInt(-3, 5);
    const c2 = py - m * px;
    const params = { m, c1, px, py };
    const c1Str = c1 >= 0 ? `+ ${c1}` : `- ${Math.abs(c1)}`;
    const eq = formatEquationFromNums(m, 1, c2);
    return {
      id: makeId("challenge", "multi_step_parallel_b", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "multi_step_parallel_b",
      prompt: `Line A has equation y = ${m}x ${c1Str}. Point Q is (${px}, ${py}). Find the equation of line B, parallel to A, passing through Q. Then state the y-intercept of line B.`,
      answer: `${c2}`,
      worked_solution: [
        `Parallel means same gradient: m = ${m}`,
        `Using point Q(${px}, ${py}): ${py} = ${m}(${px}) + c`,
        `c = ${c2}`,
        `Line B: ${eq}`,
        `The y-intercept is ${c2}.`,
      ],
      metadata: { params, skills: ["parallel_lines", "line_equation", "solve_for_c", "multi_step"], estimated_time_sec: 50 }
    };
  },

  "perpendicular_frac": (rng) => {
    const num = rng.pick([1, 2, 3]);
    const den = rng.pick([2, 3, 4]);
    const mStr = simplifyFraction(num, den);
    const g = gcd(num, den);
    const sN = num / g;
    const sD = den / g;
    const perpStr = simplifyFraction(-sD, sN);
    const c = rng.randInt(-3, 3);
    const params = { num, den, c };
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return {
      id: makeId("challenge", "perpendicular_frac", params),
      topic: "gradient_and_parallel_lines", difficulty: "challenge", archetype: "perpendicular_frac",
      prompt: `A line has equation y = (${num}/${den})x ${cStr}. Find the gradient of any line perpendicular to it.`,
      answer: perpStr,
      worked_solution: [
        `Gradient of given line = ${num}/${den} = ${mStr}`,
        `Perpendicular gradient: m2 = -1 / (${mStr})`,
        `m2 = -${sD}/${sN} = ${perpStr}`,
      ],
      metadata: { params, skills: ["perpendicular_lines"], estimated_time_sec: 35 }
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
