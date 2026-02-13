import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "simultaneous_equations_substitution";
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
    explain?: {
      title: string;
      bullets: string[];
      example: string;
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

function formatTerm(coeff: number, variable: string, isFirst: boolean): string {
  if (coeff === 0) return "";
  const abs = Math.abs(coeff);
  const sign = coeff > 0 ? (isFirst ? "" : " + ") : (isFirst ? "-" : " - ");
  const c = abs === 1 ? variable : `${abs}${variable}`;
  return `${sign}${c}`;
}

function formatYmxc(m: number, c: number): string {
  if (m === 0) return `y = ${c}`;
  const mStr = m === 1 ? "" : m === -1 ? "-" : `${m}`;
  if (c === 0) return `y = ${mStr}x`;
  const cStr = c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
  return `y = ${mStr}x${cStr}`;
}

function formatStandard(a: number, b: number, k: number): string {
  let result = "";
  if (a !== 0) {
    result += a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  }
  if (b !== 0) {
    if (result.length > 0) {
      result += b > 0 ? ` + ${b === 1 ? "" : b}y` : ` - ${Math.abs(b) === 1 ? "" : Math.abs(b)}y`;
    } else {
      result += b === 1 ? "y" : b === -1 ? "-y" : `${b}y`;
    }
  }
  return `${result} = ${k}`;
}

function makeTwoLineSvg(
  m1: number, c1: number,
  m2: number, c2: number,
  intersection: { x: number; y: number } | null,
  width: number = 460, height: number = 320,
): string {
  const pad = 30;
  const xMin = -6, xMax = 6, yMin = -6, yMax = 6;
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

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

function pickDistinctSlopes(rng: SeededRandom, pool: number[]): [number, number] {
  const m1 = rng.pick(pool);
  let m2 = rng.pick(pool);
  let tries = 0;
  while (m2 === m1 && tries < 20) { m2 = rng.pick(pool); tries++; }
  if (m2 === m1) m2 = m1 > 0 ? -m1 : m1 + 1;
  return [m1, m2];
}

function intIntersection(
  rng: SeededRandom,
  xRange: [number, number] = [-4, 4],
  yRange: [number, number] = [-4, 4],
  slopePool: number[] = [-3, -2, -1, 1, 2, 3],
): { m1: number; c1: number; m2: number; c2: number; ix: number; iy: number } {
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

function formatFrac(num: number, den: number): string {
  if (den === 1) return `${num}`;
  if (num < 0) return `-${Math.abs(num)}/${den}`;
  return `${num}/${den}`;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFrac(n: number, d: number): [number, number] {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d);
  return [n / g, d / g];
}

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "y_equals_both_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2 };
    return {
      id: makeId("easy", "y_equals_both_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_equals_both_a",
      prompt: `Solve these simultaneous equations using substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Both equations give y in terms of x.`,
        `Set them equal: ${m1 === 1 ? "" : m1 === -1 ? "-" : m1}x${c1 >= 0 ? " + " + c1 : " - " + Math.abs(c1)} = ${m2 === 1 ? "" : m2 === -1 ? "-" : m2}x${c2 >= 0 ? " + " + c2 : " - " + Math.abs(c2)}`,
        `Solving for x: x = ${ix}`,
        `Substitute back: y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 60,
      },
    };
  },
  "y_equals_both_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -1, 1, 3]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2, v: 1 };
    return {
      id: makeId("easy", "y_equals_both_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_equals_both_b",
      prompt: `Use the substitution method to solve:\n${eq1}\n${eq2}\nWrite your answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Since both equations are in the form y = ..., set them equal.`,
        `${m1}x + ${c1} = ${m2}x + ${c2}`,
        `${m1 - m2}x = ${c2 - c1}`,
        `x = ${ix}`,
        `Substitute x = ${ix} into ${eq1}: y = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 60,
      },
    };
  },
  "y_form_into_standard_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, 2]);
    const k = a2 * ix + m2 === 0 ? iy : a2 * ix + iy;
    const b2 = 1;
    const kActual = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, kActual);
    const params = { m1, c1, a2, b2: 1, k: kActual };
    return {
      id: makeId("easy", "y_form_into_standard_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_form_into_standard_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From equation 1: ${eq1}`,
        `Substitute into equation 2: ${a2}x + (${m1}x + ${c1}) = ${kActual}`,
        `${a2 + m1}x + ${c1} = ${kActual}`,
        `${a2 + m1}x = ${kActual - c1}`,
        `x = ${ix}`,
        `Substitute back: y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 75,
      },
    };
  },
  "y_form_into_standard_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, -1, 2]);
    const b2 = rng.pick([2, 3]);
    const kActual = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, kActual);
    const params = { m1, c1, a2, b2, k: kActual, v: 1 };
    return {
      id: makeId("easy", "y_form_into_standard_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_form_into_standard_b",
      prompt: `Solve these equations using substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From equation 1: ${eq1}`,
        `Substitute y = ${m1}x + ${c1} into equation 2:`,
        `${a2}x + ${b2}(${m1}x + ${c1}) = ${kActual}`,
        `${a2}x + ${b2 * m1}x + ${b2 * c1} = ${kActual}`,
        `${a2 + b2 * m1}x = ${kActual - b2 * c1}`,
        `x = ${ix}`,
        `y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 90,
      },
    };
  },
  "y_equals_both_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-2, 4], [-2, 4], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2, v: 2 };
    return {
      id: makeId("easy", "y_equals_both_c", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_equals_both_c",
      prompt: `Find the values of x and y that satisfy both equations:\n${eq1}\n${eq2}\nUse the substitution method and give your answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Both equations express y in terms of x.`,
        `Equate: ${m1}x + ${c1} = ${m2}x + ${c2}`,
        `Collect x terms: ${m1 - m2}x = ${c2 - c1}`,
        `x = ${ix}`,
        `Substitute: y = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 60,
      },
    };
  },
  "y_form_into_standard_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2, 3]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, 2, 3]);
    const b2 = rng.pick([-1, -2, 1]);
    const kActual = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, kActual);
    const params = { m1, c1, a2, b2, k: kActual, v: 2 };
    return {
      id: makeId("easy", "y_form_into_standard_c", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_form_into_standard_c",
      prompt: `Use substitution to solve:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Substitute ${eq1} into the second equation.`,
        `${a2}x + ${b2}(${m1}x + ${c1}) = ${kActual}`,
        `Expand and simplify to find x = ${ix}.`,
        `Then y = ${m1}(${ix}) + ${c1} = ${iy}.`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 75,
      },
    };
  },
  "y_equals_both_d": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 0], [-4, 0], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2, v: 3 };
    return {
      id: makeId("easy", "y_equals_both_d", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_equals_both_d",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Set the two expressions for y equal:`,
        `${m1}x + ${c1} = ${m2}x + ${c2}`,
        `x = ${ix}`,
        `y = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 60,
      },
    };
  },
  "y_form_into_standard_d": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-2, 4], [-2, 4], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, -1, 2, -2]);
    const b2 = rng.pick([1, -1]);
    const kActual = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, kActual);
    const params = { m1, c1, a2, b2, k: kActual, v: 3 };
    return {
      id: makeId("easy", "y_form_into_standard_d", params),
      topic: "simultaneous_equations_substitution", difficulty: "easy", archetype: "y_form_into_standard_d",
      prompt: `Solve the following simultaneous equations by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From equation 1, y = ${m1}x + ${c1}.`,
        `Substitute into equation 2: ${a2}x + ${b2}(${m1}x + ${c1}) = ${kActual}`,
        `Simplify and solve: x = ${ix}`,
        `y = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "substitute_back"], estimated_time_sec: 75,
      },
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "x_equals_expression_a": (rng) => {
    const iy = rng.randInt(-3, 3);
    const p = rng.pick([-2, -1, 1, 2]);
    const q = rng.randInt(-3, 3);
    const ix = p * iy + q;
    if (Math.abs(ix) > 5) return MEDIUM_ARCHETYPES["x_equals_expression_a"](rng);
    const a2 = rng.pick([1, 2]);
    const b2 = rng.pick([-1, 1, -2, 2]);
    const k2 = a2 * ix + b2 * iy;
    const eq1 = `x = ${p === 1 ? "" : p === -1 ? "-" : p}y${q >= 0 ? " + " + q : " - " + Math.abs(q)}`;
    const eq2 = formatStandard(a2, b2, k2);
    const params = { p, q, a2, b2, k2 };
    return {
      id: makeId("medium", "x_equals_expression_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "x_equals_expression_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From equation 1: ${eq1}`,
        `Substitute into equation 2: ${a2}(${p}y + ${q}) + ${b2}y = ${k2}`,
        `${a2 * p}y + ${a2 * q} + ${b2}y = ${k2}`,
        `${a2 * p + b2}y = ${k2 - a2 * q}`,
        `y = ${iy}`,
        `x = ${p}(${iy}) + ${q} = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 90,
      },
    };
  },
  "x_equals_expression_b": (rng) => {
    const iy = rng.randInt(-3, 3);
    const p = rng.pick([-1, 1, 2, 3]);
    const q = rng.randInt(-4, 4);
    const ix = p * iy + q;
    if (Math.abs(ix) > 5) return MEDIUM_ARCHETYPES["x_equals_expression_b"](rng);
    const b2 = rng.pick([1, -1, 2]);
    const k2 = ix + b2 * iy;
    const eq1 = `x = ${p === 1 ? "" : p === -1 ? "-" : p}y${q >= 0 ? " + " + q : " - " + Math.abs(q)}`;
    const eq2 = formatStandard(1, b2, k2);
    const params = { p, q, b2, k2, v: 1 };
    return {
      id: makeId("medium", "x_equals_expression_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "x_equals_expression_b",
      prompt: `Use substitution to solve:\n${eq1}\n${eq2}\nGive your answer as (x, y).`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Substitute x = ${p}y + ${q} into the second equation.`,
        `(${p}y + ${q}) + ${b2}y = ${k2}`,
        `${p + b2}y = ${k2 - q}`,
        `y = ${iy}`,
        `x = ${p}(${iy}) + ${q} = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 90,
      },
    };
  },
  "rearrange_then_sub_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const a1 = rng.pick([1, -1, 2]);
    const b1 = rng.pick([-1, 1]);
    const k1 = a1 * ix + b1 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(m2 === 0 ? 1 : 1, 1, ix + iy);
    const kActual2 = ix + iy;
    const params = { a1, b1, k1, k2: kActual2 };
    return {
      id: makeId("medium", "rearrange_then_sub_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "rearrange_then_sub_a",
      prompt: `Solve by substitution. You will need to rearrange one equation first.\n${eq1}\nx + y = ${kActual2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From x + y = ${kActual2}, rearrange: y = ${kActual2} - x`,
        `Substitute into ${eq1}:`,
        `${a1}x + ${b1}(${kActual2} - x) = ${k1}`,
        `Solve for x: x = ${ix}`,
        `y = ${kActual2} - ${ix} = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 105,
      },
    };
  },
  "rearrange_then_sub_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const a1 = 1;
    const b1 = rng.pick([-2, -1, 2, 3]);
    const k1 = a1 * ix + b1 * iy;
    const a2 = rng.pick([2, 3]);
    const b2 = rng.pick([-1, 1]);
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { a1, b1, k1, a2, b2, k2 };
    return {
      id: makeId("medium", "rearrange_then_sub_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "rearrange_then_sub_b",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq1}, rearrange: x = ${k1} - ${b1}y`,
        `Substitute into ${eq2}:`,
        `${a2}(${k1} - ${b1}y) + ${b2}y = ${k2}`,
        `Solve for y: y = ${iy}`,
        `x = ${k1} - ${b1}(${iy}) = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 120,
      },
    };
  },
  "visual_substitution_link_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2, vis: 1 };
    return {
      id: makeId("medium", "visual_substitution_link_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "visual_substitution_link_a",
      prompt: `The graph below shows two lines. Solve the system algebraically using substitution (do NOT just read from the graph):\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Set the two equations equal: ${m1}x + ${c1} = ${m2}x + ${c2}`,
        `${m1 - m2}x = ${c2 - c1}`,
        `x = ${ix}`,
        `Substitute: y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `The algebraic solution (${ix}, ${iy}) matches the intersection point on the graph.`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "interpret_graph"], estimated_time_sec: 90,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing ${eq1} and ${eq2} intersecting at (${ix}, ${iy}). Solve by substitution.`,
          width: 460, height: 320,
        },
      },
    };
  },
  "visual_substitution_link_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -1, 1, 3]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, 2]);
    const b2 = 1;
    const k2 = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, k2);
    const params = { m1, c1, a2, k2, vis: 2 };
    return {
      id: makeId("medium", "visual_substitution_link_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "visual_substitution_link_b",
      prompt: `The graph shows two lines. Use substitution to solve algebraically:\n${eq1}\n${eq2}\nVerify your answer matches the intersection on the graph.`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Substitute ${eq1} into ${eq2}:`,
        `${a2}x + (${m1}x + ${c1}) = ${k2}`,
        `${a2 + m1}x = ${k2 - c1}`,
        `x = ${ix}`,
        `y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `This matches the intersection point on the graph: (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["substitution", "solve_linear", "interpret_graph"], estimated_time_sec: 90,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph showing two lines intersecting at (${ix}, ${iy}). Solve algebraically.`,
          width: 460, height: 320,
        },
      },
    };
  },
  "rearrange_then_sub_c": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const b1 = rng.pick([1, -1]);
    const k1 = 2 * ix + b1 * iy;
    const k2 = ix - iy;
    const eq1 = formatStandard(2, b1, k1);
    const params = { b1, k1, k2, v: 2 };
    return {
      id: makeId("medium", "rearrange_then_sub_c", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "rearrange_then_sub_c",
      prompt: `Solve by substitution:\n${eq1}\nx - y = ${k2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From x - y = ${k2}: x = y + ${k2}`,
        `Substitute into ${eq1}:`,
        `2(y + ${k2}) + ${b1}y = ${k1}`,
        `${2 + b1}y = ${k1 - 2 * k2}`,
        `y = ${iy}`,
        `x = ${iy} + ${k2} = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 105,
      },
    };
  },
  "rearrange_then_sub_d": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2, 3]);
    const a1 = rng.pick([1, -1]);
    const b1 = rng.pick([2, 3]);
    const k1 = a1 * ix + b1 * iy;
    const a2 = rng.pick([2, 3]);
    const b2 = rng.pick([-1, 1]);
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { a1, b1, k1, a2, b2, k2, v: 1 };
    return {
      id: makeId("medium", "rearrange_then_sub_d", params),
      topic: "simultaneous_equations_substitution", difficulty: "medium", archetype: "rearrange_then_sub_d",
      prompt: `Solve by rearranging one equation and then substituting:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq1}, rearrange for x: x = (${k1} - ${b1}y) / ${a1}`,
        `Substitute into ${eq2} and solve.`,
        `y = ${iy}`,
        `x = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["rearrange", "substitution", "solve_linear"], estimated_time_sec: 120,
      },
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "fractional_coeff_a": (rng) => {
    const den = rng.pick([2, 4]);
    const ix = rng.randInt(-3, 3);
    const iy = rng.randInt(-3, 3);
    const m1 = rng.pick([-1, 1, 2, 3]);
    const c1 = iy - m1 * ix;
    const mFrac = rng.pick([1, 3]);
    const yFromFrac = mFrac * ix + den * rng.randInt(-1, 1);
    const c2Raw = iy * den - mFrac * ix;
    const eq1 = formatYmxc(m1, c1);
    const eq2 = `y = (${mFrac}x + ${iy * den - mFrac * ix})/${den}`;
    const params = { m1, c1, mFrac, den, c2Raw };
    const m2actual = mFrac / den;
    const c2actual = c2Raw / den;
    if (m1 === m2actual) return HARD_ARCHETYPES["fractional_coeff_a"](rng);
    const computedIx = (c2actual - c1) / (m1 - m2actual);
    const computedIy = m1 * computedIx + c1;
    const finalIx = Math.round(computedIx * 100) / 100;
    const finalIy = Math.round(computedIy * 100) / 100;
    if (!Number.isInteger(finalIx) || !Number.isInteger(finalIy)) {
      const [nx, dx] = simplifyFrac(Math.round(computedIx * den), den);
      const [ny, dy] = simplifyFrac(Math.round(computedIy * den), den);
      const ansX = dx === 1 ? `${nx}` : `${nx}/${dx}`;
      const ansY = dy === 1 ? `${ny}` : `${ny}/${dy}`;
      return {
        id: makeId("hard", "fractional_coeff_a", params),
        topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "fractional_coeff_a",
        prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
        answer: `(${ansX},${ansY})`,
        worked_solution: [
          `From equation 2: y = (${mFrac}x + ${c2Raw})/${den}`,
          `Substitute into equation 1 and solve.`,
          `x = ${ansX}, y = ${ansY}`,
          `Answer: (${ansX}, ${ansY})`,
        ],
        metadata: {
          params, skills: ["substitution", "fractions", "rearrange"], estimated_time_sec: 120,
        },
      };
    }
    return {
      id: makeId("hard", "fractional_coeff_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "fractional_coeff_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${finalIx},${finalIy})`,
      worked_solution: [
        `From equation 2: y = (${mFrac}x + ${c2Raw})/${den}`,
        `Substitute into equation 1: ${m1}x + ${c1} = (${mFrac}x + ${c2Raw})/${den}`,
        `Multiply both sides by ${den}: ${m1 * den}x + ${c1 * den} = ${mFrac}x + ${c2Raw}`,
        `x = ${finalIx}`,
        `y = ${finalIy}`,
        `Answer: (${finalIx}, ${finalIy})`,
      ],
      metadata: {
        params, skills: ["substitution", "fractions", "rearrange"], estimated_time_sec: 120,
      },
    };
  },
  "negative_rearrange_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-3, -2, -1, 1, 2, 3]);
    const a1 = -1;
    const b1 = rng.pick([2, 3]);
    const k1 = a1 * ix + b1 * iy;
    const a2 = rng.pick([2, 3]);
    const b2 = 1;
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { a1, b1, k1, a2, b2, k2 };
    return {
      id: makeId("hard", "negative_rearrange_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "negative_rearrange_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq1}: x = ${b1}y - ${k1} (since -x + ${b1}y = ${k1} → x = ${b1}y - ${k1})`,
        `Substitute into ${eq2}: ${a2}(${b1}y - ${k1}) + y = ${k2}`,
        `${a2 * b1}y - ${a2 * k1} + y = ${k2}`,
        `${a2 * b1 + 1}y = ${k2 + a2 * k1}`,
        `y = ${iy}`,
        `x = ${b1}(${iy}) - ${k1} = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "rearrange", "negative_coefficients"], estimated_time_sec: 120,
      },
    };
  },
  "negative_rearrange_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2]);
    const a1 = rng.pick([-2, -3]);
    const b1 = 1;
    const k1 = a1 * ix + b1 * iy;
    const a2 = rng.pick([1, 2]);
    const b2 = rng.pick([2, 3]);
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { a1, b1, k1, a2, b2, k2, v: 1 };
    return {
      id: makeId("hard", "negative_rearrange_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "negative_rearrange_b",
      prompt: `Solve these simultaneous equations using substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq1}: y = ${k1} - ${a1}x = ${k1} + ${Math.abs(a1)}x`,
        `Substitute into ${eq2}: ${a2}x + ${b2}(${k1} + ${Math.abs(a1)}x) = ${k2}`,
        `Solve for x: x = ${ix}`,
        `y = ${k1} + ${Math.abs(a1)}(${ix}) = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "rearrange", "negative_coefficients"], estimated_time_sec: 120,
      },
    };
  },
  "visual_hard_a": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2, 3]);
    const eq1 = formatYmxc(m1, c1);
    const a2 = rng.pick([1, 2]);
    const b2 = rng.pick([-1, 1]);
    const k2 = a2 * ix + b2 * iy;
    const eq2 = formatStandard(a2, b2, k2);
    const params = { m1, c1, a2, b2, k2, vis: 1 };
    return {
      id: makeId("hard", "visual_hard_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "visual_hard_a",
      prompt: `The graph shows two lines. Solve algebraically by substitution and verify your answer matches the graph:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `Substitute ${eq1} into ${eq2}:`,
        `${a2}x + ${b2}(${m1}x + ${c1}) = ${k2}`,
        `${a2 + b2 * m1}x = ${k2 - b2 * c1}`,
        `x = ${ix}`,
        `y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `The graph confirms the intersection is at (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["substitution", "rearrange", "verify_solution"], estimated_time_sec: 120,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph of ${eq1} and ${eq2} intersecting at (${ix}, ${iy}).`,
          width: 460, height: 320,
        },
      },
    };
  },
  "visual_hard_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -2, -1, 1, 2, 3]);
    const a1 = rng.pick([1, -1]);
    const b1 = rng.pick([2, -2, 3]);
    const k1 = a1 * ix + b1 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatYmxc(m2, c2);
    const params = { a1, b1, k1, m2, c2, vis: 2 };
    return {
      id: makeId("hard", "visual_hard_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "visual_hard_b",
      prompt: `Use substitution to solve these equations. The graph is provided to check your answer:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq2}: y = ${m2}x + ${c2}`,
        `Substitute into ${eq1}: ${a1}x + ${b1}(${m2}x + ${c2}) = ${k1}`,
        `Solve for x: x = ${ix}`,
        `y = ${m2}(${ix}) + ${c2} = ${iy}`,
        `The graph confirms intersection at (${ix}, ${iy}).`,
      ],
      metadata: {
        params, skills: ["substitution", "rearrange", "verify_solution"], estimated_time_sec: 120,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Graph of two lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 320,
        },
      },
    };
  },
  "fractional_coeff_b": (rng) => {
    const ix = rng.randInt(-3, 3);
    const iy = rng.randInt(-3, 3);
    const m1 = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = iy - m1 * ix;
    const den = rng.pick([2, 3]);
    const a2 = den;
    const b2 = rng.pick([-1, 1]) * den;
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { m1, c1, a2, b2, k2, den };
    return {
      id: makeId("hard", "fractional_coeff_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "fractional_coeff_b",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From equation 1: ${eq1}`,
        `Substitute into equation 2: ${a2}x + ${b2}(${m1}x + ${c1}) = ${k2}`,
        `${a2 + b2 * m1}x = ${k2 - b2 * c1}`,
        `x = ${ix}`,
        `y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "fractions", "rearrange"], estimated_time_sec: 120,
      },
    };
  },
  "multi_step_rearrange": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2, 3]);
    const a1 = rng.pick([2, 3]);
    const b1 = rng.pick([-1, 1, -2]);
    const k1 = a1 * ix + b1 * iy;
    const a2 = rng.pick([-1, 1]);
    const b2 = rng.pick([2, 3, -2]);
    const k2 = a2 * ix + b2 * iy;
    const eq1 = formatStandard(a1, b1, k1);
    const eq2 = formatStandard(a2, b2, k2);
    const params = { a1, b1, k1, a2, b2, k2, v: 2 };
    return {
      id: makeId("hard", "multi_step_rearrange", params),
      topic: "simultaneous_equations_substitution", difficulty: "hard", archetype: "multi_step_rearrange",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `From ${eq2}: ${a2 === 1 ? "x" : a2 === -1 ? "x" : `x`} = (${k2} - ${b2}y)${a2 !== 1 && a2 !== -1 ? ` / ${a2}` : ""}`,
        `Substitute into ${eq1} and solve.`,
        `y = ${iy}`,
        `x = ${ix}`,
        `Answer: (${ix}, ${iy})`,
      ],
      metadata: {
        params, skills: ["substitution", "rearrange", "verify_solution"], estimated_time_sec: 135,
      },
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "parallel_no_solution_a": (rng) => {
    const m = rng.pick([-3, -2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-3, 2);
    const c2 = c1 + rng.pick([2, 3, 4, 5]);
    const eq1 = formatYmxc(m, c1);
    const eq2 = formatYmxc(m, c2);
    const params = { m, c1, c2 };
    return {
      id: makeId("challenge", "parallel_no_solution_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "parallel_no_solution_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}\nIf there is no solution or infinitely many solutions, state that instead.`,
      answer: `no solution`,
      worked_solution: [
        `Set the two y-expressions equal: ${m}x + ${c1} = ${m}x + ${c2}`,
        `The x terms cancel: ${c1} = ${c2}`,
        `This is a contradiction (${c1} ≠ ${c2}), so there is no solution.`,
        `The lines are parallel (same gradient ${m}, different y-intercepts).`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "parallel_lines", "substitution"], estimated_time_sec: 75,
      },
    };
  },
  "parallel_no_solution_b": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c1 = rng.randInt(-3, 3);
    const c2 = c1 + rng.pick([3, 4, 5]);
    const a = rng.pick([1, 2]);
    const eq1 = formatYmxc(m, c1);
    const k2 = a * 0 + m * 0 + c2;
    const eq2 = formatStandard(a, -1, -(c2));
    const realEq2 = `${a}x - y = ${-c2}`;
    const params = { m, c1, c2, a, v: 1 };
    const eq2Str = formatStandard(-m, 1, c2);
    return {
      id: makeId("challenge", "parallel_no_solution_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "parallel_no_solution_b",
      prompt: `Solve by substitution:\n${eq1}\n${eq2Str}\nState whether the system has one solution, no solution, or infinitely many solutions.`,
      answer: `no solution`,
      worked_solution: [
        `From ${eq2Str}: y = ${m}x + ${c2}`,
        `But equation 1 says y = ${m}x + ${c1}`,
        `Both have gradient ${m} but different constants (${c1} ≠ ${c2}).`,
        `Parallel lines — no solution.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "parallel_lines", "substitution"], estimated_time_sec: 90,
      },
    };
  },
  "coincident_infinite_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2, 3]);
    const c = rng.randInt(-3, 3);
    const k = rng.pick([2, 3]);
    const eq1 = formatYmxc(m, c);
    const eq2 = formatStandard(-m * k, k, c * k);
    const params = { m, c, k };
    return {
      id: makeId("challenge", "coincident_infinite_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "coincident_infinite_a",
      prompt: `Solve by substitution:\n${eq1}\n${eq2}\nIf there is no solution or infinitely many solutions, state that.`,
      answer: `infinitely many solutions`,
      worked_solution: [
        `From ${eq1}: y = ${m}x + ${c}`,
        `Substitute into ${eq2}: ${-m * k}x + ${k}(${m}x + ${c}) = ${c * k}`,
        `${-m * k}x + ${m * k}x + ${c * k} = ${c * k}`,
        `0 = 0 — this is always true.`,
        `The equations represent the same line: infinitely many solutions.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "coincident_lines", "substitution"], estimated_time_sec: 90,
      },
    };
  },
  "coincident_infinite_b": (rng) => {
    const m = rng.pick([-1, 1, 2]);
    const c = rng.randInt(-3, 3);
    const k = rng.pick([-2, -1, 2, 3]);
    const eq1 = formatYmxc(m, c);
    const a2 = -m * k;
    const b2 = k;
    const k2 = c * k;
    const eq2 = formatStandard(a2, b2, k2);
    const params = { m, c, k, v: 1 };
    return {
      id: makeId("challenge", "coincident_infinite_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "coincident_infinite_b",
      prompt: `Solve this system of equations by substitution. Classify the number of solutions.\n${eq1}\n${eq2}`,
      answer: `infinitely many solutions`,
      worked_solution: [
        `Substitute y = ${m}x + ${c} into ${eq2}:`,
        `${a2}x + ${b2}(${m}x + ${c}) = ${k2}`,
        `All terms cancel: 0 = 0`,
        `The equations are the same line — infinitely many solutions.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "coincident_lines", "substitution"], estimated_time_sec: 90,
      },
    };
  },
  "visual_classify_a": (rng) => {
    const m = rng.pick([-2, -1, 1, 2]);
    const c1 = rng.randInt(-3, 2);
    const c2 = c1 + rng.pick([2, 3, 4]);
    const eq1 = formatYmxc(m, c1);
    const eq2 = formatYmxc(m, c2);
    const params = { m, c1, c2, vis: 1 };
    return {
      id: makeId("challenge", "visual_classify_a", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "visual_classify_a",
      prompt: `The graph shows two parallel lines. Use substitution to confirm there is no solution:\n${eq1}\n${eq2}`,
      answer: `no solution`,
      worked_solution: [
        `Set equal: ${m}x + ${c1} = ${m}x + ${c2}`,
        `${c1} = ${c2} — contradiction.`,
        `The lines are parallel as shown in the graph.`,
        `No solution.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "parallel_lines", "substitution"], estimated_time_sec: 75,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m, c1, m, c2, null),
          alt: `Parallel lines ${eq1} and ${eq2}. No intersection.`,
          width: 460, height: 320,
        },
      },
    };
  },
  "visual_classify_b": (rng) => {
    const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-4, 4], [-4, 4], [-3, -2, -1, 1, 2, 3]);
    const eq1 = formatYmxc(m1, c1);
    const eq2 = formatYmxc(m2, c2);
    const params = { m1, c1, m2, c2, vis: 2 };
    return {
      id: makeId("challenge", "visual_classify_b", params),
      topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "visual_classify_b",
      prompt: `The graph shows two lines. Classify the system and solve by substitution if possible:\n${eq1}\n${eq2}`,
      answer: `(${ix},${iy})`,
      worked_solution: [
        `The gradients are ${m1} and ${m2} — they differ, so the lines intersect.`,
        `Set equal: ${m1}x + ${c1} = ${m2}x + ${c2}`,
        `${m1 - m2}x = ${c2 - c1}`,
        `x = ${ix}`,
        `y = ${m1}(${ix}) + ${c1} = ${iy}`,
        `One solution: (${ix}, ${iy}), confirmed by the graph.`,
      ],
      metadata: {
        params, skills: ["classify_solutions", "substitution", "interpret_graph"], estimated_time_sec: 105,
        visual: {
          type: "svg" as const,
          svg: makeTwoLineSvg(m1, c1, m2, c2, { x: ix, y: iy }),
          alt: `Two lines intersecting at (${ix}, ${iy}).`,
          width: 460, height: 320,
        },
      },
    };
  },
  "mixed_classify": (rng) => {
    const roll = rng.next();
    if (roll < 0.33) {
      const m = rng.pick([-2, -1, 1, 2]);
      const c1 = rng.randInt(-3, 2);
      const c2 = c1 + rng.pick([2, 3]);
      const eq1 = formatYmxc(m, c1);
      const eq2 = formatYmxc(m, c2);
      const params = { m, c1, c2, type: "parallel" };
      return {
        id: makeId("challenge", "mixed_classify", params),
        topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "mixed_classify",
        prompt: `Classify and solve (if possible) by substitution:\n${eq1}\n${eq2}`,
        answer: `no solution`,
        worked_solution: [
          `Both have gradient ${m}. Setting equal: ${c1} = ${c2}, contradiction.`,
          `No solution — parallel lines.`,
        ],
        metadata: {
          params, skills: ["classify_solutions", "substitution"], estimated_time_sec: 75,
        },
      };
    } else if (roll < 0.66) {
      const m = rng.pick([-1, 1, 2]);
      const c = rng.randInt(-3, 3);
      const eq1 = formatYmxc(m, c);
      const k = rng.pick([2, -2, 3]);
      const eq2 = formatStandard(-m * k, k, c * k);
      const params = { m, c, k, type: "coincident" };
      return {
        id: makeId("challenge", "mixed_classify", params),
        topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "mixed_classify",
        prompt: `Classify and solve (if possible) by substitution:\n${eq1}\n${eq2}`,
        answer: `infinitely many solutions`,
        worked_solution: [
          `Substituting simplifies to 0 = 0.`,
          `The equations are the same line — infinitely many solutions.`,
        ],
        metadata: {
          params, skills: ["classify_solutions", "substitution"], estimated_time_sec: 90,
        },
      };
    } else {
      const { m1, c1, m2, c2, ix, iy } = intIntersection(rng, [-3, 3], [-3, 3], [-2, -1, 1, 2, 3]);
      const eq1 = formatYmxc(m1, c1);
      const eq2 = formatYmxc(m2, c2);
      const params = { m1, c1, m2, c2, type: "intersect" };
      return {
        id: makeId("challenge", "mixed_classify", params),
        topic: "simultaneous_equations_substitution", difficulty: "challenge", archetype: "mixed_classify",
        prompt: `Classify and solve (if possible) by substitution:\n${eq1}\n${eq2}`,
        answer: `(${ix},${iy})`,
        worked_solution: [
          `Gradients differ (${m1} ≠ ${m2}), so one solution exists.`,
          `Set equal, solve: x = ${ix}, y = ${iy}.`,
          `Answer: (${ix}, ${iy})`,
        ],
        metadata: {
          params, skills: ["classify_solutions", "substitution"], estimated_time_sec: 90,
        },
      };
    }
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
