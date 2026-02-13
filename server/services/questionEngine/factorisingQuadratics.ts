import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "factorising_quadratics";
  difficulty: "easy" | "medium" | "hard" | "challenge";
  archetype: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  metadata: {
    params: Record<string, number | string>;
    skills: string[];
    estimated_time_sec: number;
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
  const sorted = Object.keys(params).sort().reduce((o, k) => { o[k] = params[k]; return o; }, {} as Record<string, number | string>);
  const raw = `factorising_quadratics:${difficulty}:${archetype}:${JSON.stringify(sorted)}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 12);
}

function signedCoeff(n: number, first: boolean): string {
  if (first) return `${n}`;
  return n >= 0 ? `+${n}` : `${n}`;
}

function formatLinear(coeff: number, constant: number): string {
  let s = "";
  if (coeff === 1) s = "x";
  else if (coeff === -1) s = "-x";
  else s = `${coeff}x`;
  if (constant > 0) s += `+${constant}`;
  else if (constant < 0) s += `${constant}`;
  return s;
}

function formatQuadratic(a: number, b: number, c: number): string {
  let s = "";
  if (a === 1) s = "x^2";
  else if (a === -1) s = "-x^2";
  else s = `${a}x^2`;

  if (b === 1) s += "+x";
  else if (b === -1) s += "-x";
  else if (b > 0) s += `+${b}x`;
  else if (b < 0) s += `${b}x`;

  if (c > 0) s += `+${c}`;
  else if (c < 0) s += `${c}`;

  return s;
}

function formatFactor(coeff: number, constant: number): string {
  return `(${formatLinear(coeff, constant)})`;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

function easyMonicPos(rng: SeededRandom): GeneratedQuestion {
  const p = rng.randInt(1, 9);
  const q = rng.randInt(1, 9);
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const ans = `(x+${p})(x+${q})`;
  return {
    id: makeId("easy", "monic_pos_both", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "easy",
    archetype: "monic_pos_both",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q} (${p}×${q}=${c}, ${p}+${q}=${b}).`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 45,
    },
  };
}

function easyMonicNegC(rng: SeededRandom): GeneratedQuestion {
  let p = rng.randInt(1, 9);
  let q = -rng.randInt(1, p - 1 > 0 ? p - 1 : 1);
  if (q === 0) q = -1;
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const pStr = p >= 0 ? `+${p}` : `${p}`;
  const qStr = q >= 0 ? `+${q}` : `${q}`;
  const ans = `(x${pStr})(x${qStr})`;
  return {
    id: makeId("easy", "monic_neg_c", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "easy",
    archetype: "monic_neg_c",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q} (${p}×(${q})=${c}, ${p}+(${q})=${b}).`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 50,
    },
  };
}

function easyMonicBothNeg(rng: SeededRandom): GeneratedQuestion {
  const p = -rng.randInt(1, 9);
  const q = -rng.randInt(1, 9);
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const ans = `(x${p})(x${q})`;
  return {
    id: makeId("easy", "monic_both_neg", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "easy",
    archetype: "monic_both_neg",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q} (${p}×${q}=${c}, (${p})+(${q})=${b}).`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 50,
    },
  };
}

function easyMonicPosLarge(rng: SeededRandom): GeneratedQuestion {
  const p = rng.randInt(2, 6);
  const q = rng.randInt(2, 6);
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const ans = `(x+${p})(x+${q})`;
  return {
    id: makeId("easy", "monic_pos_large", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "easy",
    archetype: "monic_pos_large",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 45,
    },
  };
}

function mediumDiffOfSquares(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(1, 12);
  const c = a * a;
  const expr = `x^2-${c}`;
  const ans = `(x-${a})(x+${a})`;
  return {
    id: makeId("medium", "diff_of_squares", { a }),
    topic: "factorising_quadratics",
    difficulty: "medium",
    archetype: "diff_of_squares",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Recognise this as a difference of squares: x^2 - ${a}^2.`,
      `Use the identity: x^2 - a^2 = (x-a)(x+a).`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { a, c },
      skills: ["difference_of_squares"],
      estimated_time_sec: 30,
    },
  };
}

function mediumMonicMixed(rng: SeededRandom): GeneratedQuestion {
  const p = -rng.randInt(1, 9);
  const q = rng.randInt(Math.abs(p) + 1, 9);
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const pStr = `${p}`;
  const qStr = `+${q}`;
  const ans = `(x${pStr})(x${qStr})`;
  return {
    id: makeId("medium", "monic_mixed", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "medium",
    archetype: "monic_mixed",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 55,
    },
  };
}

function mediumMonicNegB(rng: SeededRandom): GeneratedQuestion {
  const p = -rng.randInt(2, 9);
  const q = rng.randInt(1, Math.abs(p) - 1);
  const b = p + q;
  const c = p * q;
  const expr = formatQuadratic(1, b, c);
  const pStr = `${p}`;
  const qStr = `+${q}`;
  const ans = `(x${pStr})(x${qStr})`;
  return {
    id: makeId("medium", "monic_neg_b", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "medium",
    archetype: "monic_neg_b",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 55,
    },
  };
}

function mediumGcfThenMonic(rng: SeededRandom): GeneratedQuestion {
  const k = rng.randInt(2, 5);
  const p = rng.randInt(1, 6);
  const q = rng.randInt(1, 6);
  const b = p + q;
  const c = p * q;
  const A = k;
  const B = k * b;
  const C = k * c;
  const expr = formatQuadratic(A, B, C);
  const ans = `${k}(x+${p})(x+${q})`;
  return {
    id: makeId("medium", "gcf_then_monic", { k, p, q }),
    topic: "factorising_quadratics",
    difficulty: "medium",
    archetype: "gcf_then_monic",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Take out the common factor of ${k}: ${expr} = ${k}(${formatQuadratic(1, b, c)}).`,
      `Now factorise ${formatQuadratic(1, b, c)}: find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { k, p, q, b, c },
      skills: ["take_common_factor", "factorise_monic", "find_factor_pairs"],
      estimated_time_sec: 70,
    },
  };
}

function hardNonMonic(rng: SeededRandom): GeneratedQuestion {
  const a1 = rng.randInt(2, 5);
  const b1 = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter(v => v !== 0));
  const a2 = 1;
  const b2 = rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].filter(v => v !== 0));
  const A = a1 * a2;
  const B = a1 * b2 + a2 * b1;
  const C = b1 * b2;
  const ac = A * C;
  const expr = formatQuadratic(A, B, C);
  const f1 = formatFactor(a1, b1);
  const f2 = formatFactor(a2, b2);
  const ans = `${f1}${f2}`;
  const m1 = a1 * b2;
  const m2 = a2 * b1;
  return {
    id: makeId("hard", "non_monic", { a1, b1, a2, b2 }),
    topic: "factorising_quadratics",
    difficulty: "hard",
    archetype: "non_monic",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Compute a×c = ${A}×${C} = ${ac}.`,
      `Find two numbers that multiply to ${ac} and add to ${B}.`,
      `Those numbers are ${m1} and ${m2} (${m1}×${m2}=${ac}, ${m1}+${m2}=${B}).`,
      `Split the middle term: ${formatQuadratic(A, 0, 0)}${signedCoeff(m1, false)}x${signedCoeff(m2, false)}x${signedCoeff(C, false)}.`,
      `Factor by grouping to get ${ans}.`,
    ],
    metadata: {
      params: { a1, b1, a2, b2, A, B, C },
      skills: ["factorise_non_monic", "ac_method"],
      estimated_time_sec: 90,
    },
  };
}

function hardAcMethod(rng: SeededRandom): GeneratedQuestion {
  const a1 = rng.pick([2, 3]);
  const b1 = rng.pick([-3, -2, -1, 1, 2, 3].filter(v => v !== 0));
  const a2 = rng.pick([2, 3]);
  const b2 = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4].filter(v => v !== 0));
  const A = a1 * a2;
  const B = a1 * b2 + a2 * b1;
  const C = b1 * b2;
  if (A === 1) return hardNonMonic(rng);
  const ac = A * C;
  const expr = formatQuadratic(A, B, C);
  const f1 = formatFactor(a1, b1);
  const f2 = formatFactor(a2, b2);
  const ans = `${f1}${f2}`;
  const m1 = a1 * b2;
  const m2 = a2 * b1;
  return {
    id: makeId("hard", "ac_method", { a1, b1, a2, b2 }),
    topic: "factorising_quadratics",
    difficulty: "hard",
    archetype: "ac_method",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Compute a×c = ${A}×${C} = ${ac}.`,
      `Find two numbers that multiply to ${ac} and add to ${B}.`,
      `Those numbers are ${m1} and ${m2}.`,
      `Split the middle term and factor by grouping.`,
      `Final factorised form: ${ans}.`,
    ],
    metadata: {
      params: { a1, b1, a2, b2, A, B, C },
      skills: ["factorise_non_monic", "ac_method", "simplify_expression"],
      estimated_time_sec: 100,
    },
  };
}

function hardGcfThenNonMonic(rng: SeededRandom): GeneratedQuestion {
  const k = rng.randInt(2, 4);
  const a1 = rng.randInt(2, 4);
  const b1 = rng.pick([-3, -2, -1, 1, 2, 3].filter(v => v !== 0));
  const a2 = 1;
  const b2 = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4].filter(v => v !== 0));
  const innerA = a1 * a2;
  const innerB = a1 * b2 + a2 * b1;
  const innerC = b1 * b2;
  const A = k * innerA;
  const B = k * innerB;
  const C = k * innerC;
  const expr = formatQuadratic(A, B, C);
  const f1 = formatFactor(a1, b1);
  const f2 = formatFactor(a2, b2);
  const ans = `${k}${f1}${f2}`;
  return {
    id: makeId("hard", "gcf_then_non_monic", { k, a1, b1, a2, b2 }),
    topic: "factorising_quadratics",
    difficulty: "hard",
    archetype: "gcf_then_non_monic",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Take out the common factor of ${k}: ${expr} = ${k}(${formatQuadratic(innerA, innerB, innerC)}).`,
      `Now factorise ${formatQuadratic(innerA, innerB, innerC)} using the AC method.`,
      `Final factorised form: ${ans}.`,
    ],
    metadata: {
      params: { k, a1, b1, a2, b2 },
      skills: ["take_common_factor", "factorise_non_monic", "ac_method"],
      estimated_time_sec: 110,
    },
  };
}

function challengeNonMonicNeg(rng: SeededRandom): GeneratedQuestion {
  const a1 = rng.randInt(2, 5);
  const b1 = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter(v => v !== 0));
  const a2 = 1;
  const b2 = rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3].filter(v => v !== 0));
  if (b1 * b2 >= 0) {
    return challengeNonMonicNeg(rng);
  }
  const A = a1 * a2;
  const B = a1 * b2 + a2 * b1;
  const C = b1 * b2;
  const ac = A * C;
  const expr = formatQuadratic(A, B, C);
  const f1 = formatFactor(a1, b1);
  const f2 = formatFactor(a2, b2);
  const ans = `${f1}${f2}`;
  const m1 = a1 * b2;
  const m2 = a2 * b1;
  return {
    id: makeId("challenge", "non_monic_negative", { a1, b1, a2, b2 }),
    topic: "factorising_quadratics",
    difficulty: "challenge",
    archetype: "non_monic_negative",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Compute a×c = ${A}×${C} = ${ac}.`,
      `Find two numbers that multiply to ${ac} and add to ${B}: ${m1} and ${m2}.`,
      `Split the middle term and factor by grouping.`,
      `Final factorised form: ${ans}.`,
    ],
    metadata: {
      params: { a1, b1, a2, b2, A, B, C },
      skills: ["structure_recognition", "factorise_non_monic", "multi_step"],
      estimated_time_sec: 100,
    },
  };
}

function challengeRearranged(rng: SeededRandom): GeneratedQuestion {
  const p = rng.pick([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8].filter(v => v !== 0));
  const q = rng.pick([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8].filter(v => v !== 0));
  const b = p + q;
  const c = p * q;
  let bStr = "";
  if (b === 1) bStr = "x";
  else if (b === -1) bStr = "-x";
  else if (b > 0) bStr = `${b}x`;
  else bStr = `${b}x`;
  const cStr = c >= 0 ? `+${c}` : `${c}`;
  const expr = `${bStr}+x^2${cStr}`;
  const pStr = p >= 0 ? `+${p}` : `${p}`;
  const qStr = q >= 0 ? `+${q}` : `${q}`;
  const ans = `(x${pStr})(x${qStr})`;
  return {
    id: makeId("challenge", "rearranged", { p, q }),
    topic: "factorising_quadratics",
    difficulty: "challenge",
    archetype: "rearranged",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `First, reorder to standard form: ${formatQuadratic(1, b, c)}.`,
      `Find two numbers that multiply to ${c} and add to ${b}.`,
      `Those numbers are ${p} and ${q}.`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { p, q, b, c },
      skills: ["structure_recognition", "reorder_terms", "factorise_monic"],
      estimated_time_sec: 75,
    },
  };
}

function challengeNonMonicRearranged(rng: SeededRandom): GeneratedQuestion {
  const a1 = rng.randInt(2, 4);
  const b1 = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4].filter(v => v !== 0));
  const a2 = 1;
  const b2 = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter(v => v !== 0));
  const A = a1 * a2;
  const B = a1 * b2 + a2 * b1;
  const C = b1 * b2;
  let bxStr = "";
  if (B === 1) bxStr = "x";
  else if (B === -1) bxStr = "-x";
  else bxStr = `${B}x`;
  const cStr = C >= 0 ? `+${C}` : `${C}`;
  const aStr = A === 1 ? "x^2" : `${A}x^2`;
  const expr = `${bxStr}+${aStr}${cStr}`;
  const f1 = formatFactor(a1, b1);
  const f2 = formatFactor(a2, b2);
  const ans = `${f1}${f2}`;
  return {
    id: makeId("challenge", "non_monic_rearranged", { a1, b1, a2, b2 }),
    topic: "factorising_quadratics",
    difficulty: "challenge",
    archetype: "non_monic_rearranged",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Reorder to standard form: ${formatQuadratic(A, B, C)}.`,
      `Use the AC method: a×c = ${A}×${C} = ${A * C}.`,
      `Factor by grouping to get ${ans}.`,
    ],
    metadata: {
      params: { a1, b1, a2, b2, A, B, C },
      skills: ["structure_recognition", "reorder_terms", "factorise_non_monic", "multi_step"],
      estimated_time_sec: 110,
    },
  };
}

function challengeDiffOfSquaresNonMonic(rng: SeededRandom): GeneratedQuestion {
  const a = rng.randInt(2, 5);
  const b = rng.randInt(1, 9);
  const A = a * a;
  const C = b * b;
  const expr = `${A}x^2-${C}`;
  const ans = `(${a}x-${b})(${a}x+${b})`;
  return {
    id: makeId("challenge", "diff_of_squares_non_monic", { a, b }),
    topic: "factorising_quadratics",
    difficulty: "challenge",
    archetype: "diff_of_squares_non_monic",
    prompt: `Factorise: ${expr}`,
    answer: ans,
    worked_solution: [
      `Recognise this as a difference of squares: (${a}x)^2 - ${b}^2.`,
      `Use the identity: A^2 - B^2 = (A-B)(A+B).`,
      `So ${expr} = ${ans}.`,
    ],
    metadata: {
      params: { a, b, A, C },
      skills: ["structure_recognition", "difference_of_squares"],
      estimated_time_sec: 50,
    },
  };
}

const ARCHETYPE_MAP: Record<string, ArchetypeGenerator[]> = {
  easy: [easyMonicPos, easyMonicNegC, easyMonicBothNeg, easyMonicPosLarge, easyMonicPos, easyMonicNegC, easyMonicBothNeg, easyMonicPosLarge],
  medium: [mediumDiffOfSquares, mediumDiffOfSquares, mediumMonicMixed, mediumMonicMixed, mediumMonicNegB, mediumMonicNegB, mediumGcfThenMonic, mediumGcfThenMonic],
  hard: [hardNonMonic, hardNonMonic, hardAcMethod, hardAcMethod, hardGcfThenNonMonic, hardGcfThenNonMonic, hardNonMonic],
  challenge: [challengeNonMonicNeg, challengeNonMonicNeg, challengeRearranged, challengeRearranged, challengeNonMonicRearranged, challengeDiffOfSquaresNonMonic, challengeNonMonicNeg],
};

export function generateQuestion(difficulty: "easy" | "medium" | "hard" | "challenge", seed: number): GeneratedQuestion {
  const rng = new SeededRandom(seed);
  const generators = ARCHETYPE_MAP[difficulty];
  const gen = generators[Math.floor(rng.next() * generators.length)];
  return gen(rng);
}

export function generatePool(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  n: number,
  seed: number,
  ensure_unique: boolean = true
): GeneratedQuestion[] {
  const results: GeneratedQuestion[] = [];
  const seenIds = new Set<string>();
  const maxAttempts = n * 10;

  for (let i = 0; i < maxAttempts && results.length < n; i++) {
    const q = generateQuestion(difficulty, seed + i * 7919);
    if (ensure_unique && seenIds.has(q.id)) continue;
    seenIds.add(q.id);
    results.push(q);
  }
  return results;
}

export function generateMixedPool(
  config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[],
  seed?: number
): GeneratedQuestion[] {
  const baseSeed = seed ?? Math.floor(Math.random() * 1_000_000);
  const results: GeneratedQuestion[] = [];
  let offset = 0;
  for (const { difficulty, count } of config) {
    const pool = generatePool(difficulty, count, baseSeed + offset, true);
    results.push(...pool);
    offset += 10000;
  }
  return results;
}
