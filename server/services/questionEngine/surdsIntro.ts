import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "introduction_to_surds";
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

function simplifySurd(n: number): { coeff: number; radicand: number } {
  let coeff = 1;
  let radicand = n;
  for (const p of [2, 3, 5, 7, 11, 13]) {
    const sq = p * p;
    while (radicand % sq === 0) {
      coeff *= p;
      radicand = radicand / sq;
    }
  }
  return { coeff, radicand };
}

function surdStr(coeff: number, radicand: number): string {
  if (radicand === 1) return `${coeff}`;
  if (coeff === 1) return `√${radicand}`;
  return `${coeff}√${radicand}`;
}

function isPerfectSquare(n: number): boolean {
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "identify_surd_perfect": (rng) => {
    const perfects = [4, 9, 16, 25, 36, 49, 64, 81, 100];
    const val = rng.pick(perfects);
    const root = Math.round(Math.sqrt(val));
    const params = { val };
    return {
      id: makeId("easy", "identify_surd_perfect", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "identify_surd_perfect",
      prompt: `Is √${val} a surd? Evaluate if possible.`,
      answer: `Not a surd. √${val} = ${root}`,
      worked_solution: [
        `Check if ${val} is a perfect square`,
        `${root} × ${root} = ${val}, so ${val} is a perfect square`,
        `√${val} = ${root}, which is rational — not a surd`,
      ],
      metadata: { params, skills: ["identify_surd"], estimated_time_sec: 15 }
    };
  },

  "identify_surd_irrational": (rng) => {
    const nonPerfects = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19];
    const val = rng.pick(nonPerfects);
    const params = { val };
    return {
      id: makeId("easy", "identify_surd_irrational", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "identify_surd_irrational",
      prompt: `Is √${val} a surd? Explain.`,
      answer: `Yes, √${val} is a surd`,
      worked_solution: [
        `Check if ${val} is a perfect square`,
        `${val} has no integer whose square equals it`,
        `√${val} is irrational — it is a surd`,
      ],
      metadata: { params, skills: ["identify_surd"], estimated_time_sec: 15 }
    };
  },

  "simplify_sqrt_8": (rng) => {
    const configs = [
      { n: 8, coeff: 2, rad: 2 },
      { n: 12, coeff: 2, rad: 3 },
      { n: 18, coeff: 3, rad: 2 },
      { n: 20, coeff: 2, rad: 5 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_sqrt_8", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "simplify_sqrt_8",
      prompt: `Simplify √${cfg.n}.`,
      answer: surdStr(cfg.coeff, cfg.rad),
      worked_solution: [
        `Find the largest perfect square factor of ${cfg.n}`,
        `${cfg.n} = ${cfg.coeff * cfg.coeff} × ${cfg.rad}`,
        `√${cfg.n} = √(${cfg.coeff * cfg.coeff} × ${cfg.rad}) = ${cfg.coeff}√${cfg.rad}`,
      ],
      metadata: { params, skills: ["simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_sqrt_27": (rng) => {
    const configs = [
      { n: 27, coeff: 3, rad: 3 },
      { n: 45, coeff: 3, rad: 5 },
      { n: 50, coeff: 5, rad: 2 },
      { n: 75, coeff: 5, rad: 3 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_sqrt_27", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "simplify_sqrt_27",
      prompt: `Simplify √${cfg.n}.`,
      answer: surdStr(cfg.coeff, cfg.rad),
      worked_solution: [
        `Find the largest perfect square factor of ${cfg.n}`,
        `${cfg.n} = ${cfg.coeff * cfg.coeff} × ${cfg.rad}`,
        `√${cfg.n} = √(${cfg.coeff * cfg.coeff} × ${cfg.rad}) = ${cfg.coeff}√${cfg.rad}`,
      ],
      metadata: { params, skills: ["simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_sqrt_48": (rng) => {
    const configs = [
      { n: 48, coeff: 4, rad: 3 },
      { n: 32, coeff: 4, rad: 2 },
      { n: 72, coeff: 6, rad: 2 },
      { n: 98, coeff: 7, rad: 2 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_sqrt_48", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "simplify_sqrt_48",
      prompt: `Simplify √${cfg.n}.`,
      answer: surdStr(cfg.coeff, cfg.rad),
      worked_solution: [
        `Find the largest perfect square factor of ${cfg.n}`,
        `${cfg.n} = ${cfg.coeff * cfg.coeff} × ${cfg.rad}`,
        `√${cfg.n} = √(${cfg.coeff * cfg.coeff} × ${cfg.rad}) = ${cfg.coeff}√${cfg.rad}`,
      ],
      metadata: { params, skills: ["simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_sqrt_large": (rng) => {
    const configs = [
      { n: 128, coeff: 8, rad: 2 },
      { n: 200, coeff: 10, rad: 2 },
      { n: 108, coeff: 6, rad: 3 },
      { n: 150, coeff: 5, rad: 6 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_sqrt_large", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "simplify_sqrt_large",
      prompt: `Simplify √${cfg.n}.`,
      answer: surdStr(cfg.coeff, cfg.rad),
      worked_solution: [
        `Find the largest perfect square factor of ${cfg.n}`,
        `${cfg.n} = ${cfg.coeff * cfg.coeff} × ${cfg.rad}`,
        `√${cfg.n} = √(${cfg.coeff * cfg.coeff} × ${cfg.rad}) = ${cfg.coeff}√${cfg.rad}`,
      ],
      metadata: { params, skills: ["simplify_surd"], estimated_time_sec: 30 }
    };
  },

  "simplify_sqrt_with_coeff": (rng) => {
    const k = rng.pick([2, 3, 4, 5]);
    const inner = rng.pick([8, 12, 18, 20, 27, 50]);
    const { coeff, radicand } = simplifySurd(inner);
    const finalCoeff = k * coeff;
    const params = { k, inner };
    return {
      id: makeId("easy", "simplify_sqrt_with_coeff", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "simplify_sqrt_with_coeff",
      prompt: `Simplify ${k}√${inner}.`,
      answer: surdStr(finalCoeff, radicand),
      worked_solution: [
        `First simplify √${inner}: √${inner} = ${surdStr(coeff, radicand)}`,
        `${k} × ${surdStr(coeff, radicand)} = ${surdStr(finalCoeff, radicand)}`,
      ],
      metadata: { params, skills: ["simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "evaluate_perfect_surd": (rng) => {
    const vals = [
      { expr: "√4 + √9", answer: "5", steps: ["√4 = 2", "√9 = 3", "2 + 3 = 5"] },
      { expr: "√25 − √16", answer: "1", steps: ["√25 = 5", "√16 = 4", "5 − 4 = 1"] },
      { expr: "√36 + √49", answer: "13", steps: ["√36 = 6", "√49 = 7", "6 + 7 = 13"] },
      { expr: "√100 − √64", answer: "2", steps: ["√100 = 10", "√64 = 8", "10 − 8 = 2"] },
    ];
    const v = rng.pick(vals);
    const params = { expr: v.expr };
    return {
      id: makeId("easy", "evaluate_perfect_surd", params),
      topic: "introduction_to_surds", difficulty: "easy", archetype: "evaluate_perfect_surd",
      prompt: `Evaluate: ${v.expr}`,
      answer: v.answer,
      worked_solution: v.steps,
      metadata: { params, skills: ["identify_surd", "simplify_surd"], estimated_time_sec: 20 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "add_like_surds_simple": (rng) => {
    const rad = rng.pick([2, 3, 5, 7]);
    const a = rng.randInt(2, 6);
    const b = rng.randInt(1, 5);
    const sum = a + b;
    const params = { a, b, rad };
    return {
      id: makeId("medium", "add_like_surds_simple", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "add_like_surds_simple",
      prompt: `Simplify: ${a}√${rad} + ${b}√${rad}`,
      answer: surdStr(sum, rad),
      worked_solution: [
        `Both terms have √${rad} as the surd part`,
        `Combine coefficients: ${a} + ${b} = ${sum}`,
        `Result: ${surdStr(sum, rad)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "subtract_like_surds": (rng) => {
    const rad = rng.pick([2, 3, 5, 7]);
    const a = rng.randInt(5, 9);
    const b = rng.randInt(1, a - 1);
    const diff = a - b;
    const params = { a, b, rad };
    return {
      id: makeId("medium", "subtract_like_surds", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "subtract_like_surds",
      prompt: `Simplify: ${a}√${rad} − ${b}√${rad}`,
      answer: surdStr(diff, rad),
      worked_solution: [
        `Both terms have √${rad} as the surd part`,
        `Combine coefficients: ${a} − ${b} = ${diff}`,
        `Result: ${surdStr(diff, rad)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "add_surds_simplify_first": (rng) => {
    const configs = [
      { expr: "3√8 + 2√18", n1: 8, n2: 18, c1: 3, c2: 2, rad: 2, s1: 6, s2: 6, total: 12 },
      { expr: "√12 + √27", n1: 12, n2: 27, c1: 1, c2: 1, rad: 3, s1: 2, s2: 3, total: 5 },
      { expr: "5√20 + 2√45", n1: 20, n2: 45, c1: 5, c2: 2, rad: 5, s1: 10, s2: 6, total: 16 },
      { expr: "2√50 + 3√8", n1: 50, n2: 8, c1: 2, c2: 3, rad: 2, s1: 10, s2: 6, total: 16 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("medium", "add_surds_simplify_first", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "add_surds_simplify_first",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Combine like surds: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "subtract_surds_simplify_first": (rng) => {
    const configs = [
      { expr: "4√12 − √27", n1: 12, n2: 27, c1: 4, c2: 1, rad: 3, s1: 8, s2: 3, total: 5 },
      { expr: "3√50 − 2√18", n1: 50, n2: 18, c1: 3, c2: 2, rad: 2, s1: 15, s2: 6, total: 9 },
      { expr: "5√12 − 2√48", n1: 12, n2: 48, c1: 5, c2: 2, rad: 3, s1: 10, s2: 8, total: 2 },
      { expr: "6√8 − √32", n1: 8, n2: 32, c1: 6, c2: 1, rad: 2, s1: 12, s2: 4, total: 8 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("medium", "subtract_surds_simplify_first", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "subtract_surds_simplify_first",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Combine like surds: ${cfg.s1}√${cfg.rad} − ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "multiply_simple_surds": (rng) => {
    const a = rng.pick([2, 3, 5, 6, 7]);
    const b = rng.pick([2, 3, 5, 6, 7].filter(x => x !== a));
    const prod = a * b;
    const { coeff, radicand } = simplifySurd(prod);
    const params = { a, b };
    return {
      id: makeId("medium", "multiply_simple_surds", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "multiply_simple_surds",
      prompt: `Simplify: √${a} × √${b}`,
      answer: isPerfectSquare(prod) ? `${Math.round(Math.sqrt(prod))}` : surdStr(coeff, radicand),
      worked_solution: [
        `√${a} × √${b} = √(${a} × ${b}) = √${prod}`,
        isPerfectSquare(prod) ? `√${prod} = ${Math.round(Math.sqrt(prod))}` : (coeff > 1 ? `√${prod} = ${surdStr(coeff, radicand)}` : `√${prod} is already in simplest form`),
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 25 }
    };
  },

  "multiply_coeff_surds": (rng) => {
    const k1 = rng.pick([2, 3, 4]);
    const k2 = rng.pick([2, 3, 5]);
    const a = rng.pick([2, 3, 5]);
    const b = rng.pick([2, 3, 5, 7]);
    const coeffProd = k1 * k2;
    const radProd = a * b;
    const { coeff: sc, radicand: sr } = simplifySurd(radProd);
    const finalCoeff = coeffProd * sc;
    const params = { k1, k2, a, b };
    return {
      id: makeId("medium", "multiply_coeff_surds", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "multiply_coeff_surds",
      prompt: `Simplify: ${k1}√${a} × ${k2}√${b}`,
      answer: sr === 1 ? `${finalCoeff}` : surdStr(finalCoeff, sr),
      worked_solution: [
        `Multiply coefficients: ${k1} × ${k2} = ${coeffProd}`,
        `Multiply surds: √${a} × √${b} = √${radProd}`,
        sr === 1
          ? `√${radProd} = ${Math.round(Math.sqrt(radProd))}, so result = ${finalCoeff}`
          : (sc > 1
            ? `√${radProd} = ${surdStr(sc, sr)}, so result = ${coeffProd} × ${surdStr(sc, sr)} = ${surdStr(finalCoeff, sr)}`
            : `Result: ${surdStr(coeffProd, radProd)}`),
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_surd"], estimated_time_sec: 35 }
    };
  },

  "multiply_surd_by_itself": (rng) => {
    const a = rng.pick([2, 3, 5, 6, 7, 10, 11]);
    const params = { a };
    return {
      id: makeId("medium", "multiply_surd_by_itself", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "multiply_surd_by_itself",
      prompt: `Simplify: √${a} × √${a}`,
      answer: `${a}`,
      worked_solution: [
        `√${a} × √${a} = (√${a})² = ${a}`,
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 15 }
    };
  },

  "multiply_surd_by_integer": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.pick([2, 3, 5, 7]);
    const params = { k, a };
    return {
      id: makeId("medium", "multiply_surd_by_integer", params),
      topic: "introduction_to_surds", difficulty: "medium", archetype: "multiply_surd_by_integer",
      prompt: `Simplify: ${k} × √${a}`,
      answer: surdStr(k, a),
      worked_solution: [
        `${k} × √${a} = ${surdStr(k, a)}`,
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 10 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "expand_diff_of_squares": (rng) => {
    const a = rng.pick([2, 3, 5, 7]);
    const b = rng.pick([2, 3, 5, 7].filter(x => x !== a));
    const answer = a - b;
    const params = { a, b };
    return {
      id: makeId("hard", "expand_diff_of_squares", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "expand_diff_of_squares",
      prompt: `Expand and simplify: (√${a} + √${b})(√${a} − √${b})`,
      answer: `${answer}`,
      worked_solution: [
        `Use the difference of squares: (√${a})² − (√${b})²`,
        `= ${a} − ${b}`,
        `= ${answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares"], estimated_time_sec: 30 }
    };
  },

  "expand_conjugate_integer": (rng) => {
    const c = rng.randInt(2, 6);
    const d = rng.pick([2, 3, 5, 7]);
    const answer = c * c - d;
    const params = { c, d };
    return {
      id: makeId("hard", "expand_conjugate_integer", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "expand_conjugate_integer",
      prompt: `Expand and simplify: (${c} + √${d})(${c} − √${d})`,
      answer: `${answer}`,
      worked_solution: [
        `Use the difference of squares: (${c})² − (√${d})²`,
        `= ${c * c} − ${d}`,
        `= ${answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares"], estimated_time_sec: 30 }
    };
  },

  "expand_surd_squared": (rng) => {
    const a = rng.pick([2, 3, 5]);
    const b = rng.pick([2, 3, 5, 7].filter(x => x !== a));
    const term1 = a;
    const term2 = 2;
    const crossRad = a * b;
    const { coeff: crossCoeff, radicand: crossSimp } = simplifySurd(crossRad);
    const finalCross = term2 * crossCoeff;
    const constPart = a + b;
    const params = { a, b };
    return {
      id: makeId("hard", "expand_surd_squared", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "expand_surd_squared",
      prompt: `Expand and simplify: (√${a} + √${b})²`,
      answer: crossSimp === 1 ? `${constPart + finalCross}` : `${constPart} + ${surdStr(finalCross, crossSimp)}`,
      worked_solution: [
        `(√${a} + √${b})² = (√${a})² + 2(√${a})(√${b}) + (√${b})²`,
        `= ${a} + 2√${crossRad} + ${b}`,
        crossCoeff > 1 ? `= ${constPart} + 2 × ${surdStr(crossCoeff, crossSimp)}` : `= ${constPart} + 2√${crossRad}`,
        crossSimp === 1 ? `= ${constPart + finalCross}` : `= ${constPart} + ${surdStr(finalCross, crossSimp)}`,
      ],
      metadata: { params, skills: ["expand_brackets", "simplify_surd"], estimated_time_sec: 45 }
    };
  },

  "rationalise_one_over_sqrt": (rng) => {
    const a = rng.pick([2, 3, 5, 7, 11]);
    const params = { a };
    return {
      id: makeId("hard", "rationalise_one_over_sqrt", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "rationalise_one_over_sqrt",
      prompt: `Rationalise the denominator: 1/√${a}`,
      answer: `√${a}/${a}`,
      worked_solution: [
        `Multiply numerator and denominator by √${a}`,
        `1/√${a} × √${a}/√${a} = √${a}/(√${a} × √${a})`,
        `= √${a}/${a}`,
      ],
      metadata: { params, skills: ["rationalise_denominator"], estimated_time_sec: 30 }
    };
  },

  "rationalise_k_over_sqrt": (rng) => {
    const k = rng.pick([2, 3, 4, 5, 6]);
    const a = rng.pick([2, 3, 5, 7]);
    const g = gcd(k, a);
    const numSimp = k / g;
    const denSimp = a / g;
    const params = { k, a };
    return {
      id: makeId("hard", "rationalise_k_over_sqrt", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "rationalise_k_over_sqrt",
      prompt: `Rationalise the denominator: ${k}/√${a}`,
      answer: denSimp === 1 ? `${numSimp}√${a}` : `${numSimp}√${a}/${denSimp}`,
      worked_solution: [
        `Multiply numerator and denominator by √${a}`,
        `${k}/√${a} × √${a}/√${a} = ${k}√${a}/${a}`,
        g > 1 ? `Simplify: ${k}/${a} = ${numSimp}/${denSimp}, so result = ${denSimp === 1 ? `${numSimp}√${a}` : `${numSimp}√${a}/${denSimp}`}` : `Result: ${k}√${a}/${a}`,
      ],
      metadata: { params, skills: ["rationalise_denominator"], estimated_time_sec: 35 }
    };
  },

  "rationalise_frac_over_k_sqrt": (rng) => {
    const num = rng.pick([2, 3, 4]);
    const k = rng.pick([2, 3]);
    const a = rng.pick([2, 3, 5, 7]);
    const den = k * a;
    const g = gcd(num, den);
    const params = { num, k, a };
    return {
      id: makeId("hard", "rationalise_frac_over_k_sqrt", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "rationalise_frac_over_k_sqrt",
      prompt: `Rationalise the denominator: ${num}/(${k}√${a})`,
      answer: g > 1 ? `${num / g}√${a}/${den / g}` : `${num}√${a}/${den}`,
      worked_solution: [
        `Multiply numerator and denominator by √${a}`,
        `${num}/(${k}√${a}) × √${a}/√${a} = ${num}√${a}/(${k} × ${a})`,
        `= ${num}√${a}/${den}`,
        g > 1 ? `Simplify: ${num / g}√${a}/${den / g}` : "",
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["rationalise_denominator"], estimated_time_sec: 40 }
    };
  },

  "expand_integer_plus_surd_squared": (rng) => {
    const c = rng.randInt(2, 5);
    const d = rng.pick([2, 3, 5, 7]);
    const constPart = c * c + d;
    const crossCoeff = 2 * c;
    const params = { c, d };
    return {
      id: makeId("hard", "expand_integer_plus_surd_squared", params),
      topic: "introduction_to_surds", difficulty: "hard", archetype: "expand_integer_plus_surd_squared",
      prompt: `Expand and simplify: (${c} + √${d})²`,
      answer: `${constPart} + ${surdStr(crossCoeff, d)}`,
      worked_solution: [
        `(${c} + √${d})² = ${c}² + 2(${c})(√${d}) + (√${d})²`,
        `= ${c * c} + ${crossCoeff}√${d} + ${d}`,
        `= ${constPart} + ${surdStr(crossCoeff, d)}`,
      ],
      metadata: { params, skills: ["expand_brackets", "simplify_surd"], estimated_time_sec: 40 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "multi_step_combine": (rng) => {
    const configs = [
      {
        expr: "3√12 + 2√27 − √3",
        steps: [
          "3√12 = 3 × 2√3 = 6√3",
          "2√27 = 2 × 3√3 = 6√3",
          "6√3 + 6√3 − √3 = 11√3",
        ],
        answer: "11√3",
      },
      {
        expr: "2√45 − 3√20 + √5",
        steps: [
          "2√45 = 2 × 3√5 = 6√5",
          "3√20 = 3 × 2√5 = 6√5",
          "6√5 − 6√5 + √5 = √5",
        ],
        answer: "√5",
      },
      {
        expr: "4√8 + √50 − 3√2",
        steps: [
          "4√8 = 4 × 2√2 = 8√2",
          "√50 = 5√2",
          "8√2 + 5√2 − 3√2 = 10√2",
        ],
        answer: "10√2",
      },
      {
        expr: "√75 − 2√12 + 3√27",
        steps: [
          "√75 = 5√3",
          "2√12 = 2 × 2√3 = 4√3",
          "3√27 = 3 × 3√3 = 9√3",
          "5√3 − 4√3 + 9√3 = 10√3",
        ],
        answer: "10√3",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "multi_step_combine", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "multi_step_combine",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 50 }
    };
  },

  "rationalise_conjugate_add": (rng) => {
    const a = rng.randInt(1, 4);
    const b = rng.pick([2, 3, 5]);
    const conjDen = a * a - b;
    const params = { a, b };
    if (conjDen === 0) {
      return CHALLENGE_ARCHETYPES["rationalise_conjugate_sub"](rng);
    }
    const sign = conjDen > 0 ? "" : "-";
    const absDen = Math.abs(conjDen);
    const g = gcd(a, absDen);
    const gSurd = gcd(1, absDen);
    return {
      id: makeId("challenge", "rationalise_conjugate_add", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "rationalise_conjugate_add",
      prompt: `Rationalise the denominator: 1/(${a} + √${b})`,
      answer: absDen === 1 ? `${sign}(${a} − √${b})` : `(${a} − √${b})/${sign}${absDen}`,
      worked_solution: [
        `Multiply numerator and denominator by the conjugate (${a} − √${b})`,
        `Numerator: 1 × (${a} − √${b}) = ${a} − √${b}`,
        `Denominator: (${a} + √${b})(${a} − √${b}) = ${a}² − (√${b})² = ${a * a} − ${b} = ${conjDen}`,
        `Result: (${a} − √${b})/${conjDen}`,
      ],
      metadata: { params, skills: ["rationalise_denominator", "conjugate_rationalisation", "difference_of_squares"], estimated_time_sec: 60 }
    };
  },

  "rationalise_conjugate_sub": (rng) => {
    const a = rng.randInt(2, 5);
    const b = rng.pick([2, 3, 5, 7]);
    const conjDen = a * a - b;
    const params = { a, b };
    if (conjDen <= 0) {
      const newA = rng.pick([3, 4, 5]);
      const newB = rng.pick([2, 3]);
      const newDen = newA * newA - newB;
      const newParams = { a: newA, b: newB };
      return {
        id: makeId("challenge", "rationalise_conjugate_sub", newParams),
        topic: "introduction_to_surds", difficulty: "challenge", archetype: "rationalise_conjugate_sub",
        prompt: `Rationalise the denominator: 1/(${newA} − √${newB})`,
        answer: `(${newA} + √${newB})/${newDen}`,
        worked_solution: [
          `Multiply numerator and denominator by the conjugate (${newA} + √${newB})`,
          `Numerator: ${newA} + √${newB}`,
          `Denominator: (${newA})² − (√${newB})² = ${newA * newA} − ${newB} = ${newDen}`,
          `Result: (${newA} + √${newB})/${newDen}`,
        ],
        metadata: { params: newParams, skills: ["rationalise_denominator", "conjugate_rationalisation", "difference_of_squares"], estimated_time_sec: 60 }
      };
    }
    return {
      id: makeId("challenge", "rationalise_conjugate_sub", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "rationalise_conjugate_sub",
      prompt: `Rationalise the denominator: 1/(${a} − √${b})`,
      answer: `(${a} + √${b})/${conjDen}`,
      worked_solution: [
        `Multiply numerator and denominator by the conjugate (${a} + √${b})`,
        `Numerator: ${a} + √${b}`,
        `Denominator: (${a})² − (√${b})² = ${a * a} − ${b} = ${conjDen}`,
        `Result: (${a} + √${b})/${conjDen}`,
      ],
      metadata: { params, skills: ["rationalise_denominator", "conjugate_rationalisation", "difference_of_squares"], estimated_time_sec: 60 }
    };
  },

  "show_that_expand": (rng) => {
    const configs = [
      {
        expr: "(√5 + √2)²",
        answer: "7 + 2√10",
        steps: ["(√5 + √2)² = (√5)² + 2(√5)(√2) + (√2)²", "= 5 + 2√10 + 2", "= 7 + 2√10"],
      },
      {
        expr: "(√3 + √7)²",
        answer: "10 + 2√21",
        steps: ["(√3 + √7)² = (√3)² + 2(√3)(√7) + (√7)²", "= 3 + 2√21 + 7", "= 10 + 2√21"],
      },
      {
        expr: "(√2 + √5)²",
        answer: "7 + 2√10",
        steps: ["(√2 + √5)² = (√2)² + 2(√2)(√5) + (√5)²", "= 2 + 2√10 + 5", "= 7 + 2√10"],
      },
      {
        expr: "(√3 + √2)²",
        answer: "5 + 2√6",
        steps: ["(√3 + √2)² = (√3)² + 2(√3)(√2) + (√2)²", "= 3 + 2√6 + 2", "= 5 + 2√6"],
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "show_that_expand", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "show_that_expand",
      prompt: `Simplify ${cfg.expr} to exact form.`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["expand_brackets", "simplify_surd"], estimated_time_sec: 45 }
    };
  },

  "rationalise_with_numerator": (rng) => {
    const num = rng.randInt(2, 5);
    const a = rng.randInt(2, 4);
    const b = rng.pick([2, 3, 5]);
    const den = a * a - b;
    const params = { num, a, b };
    if (den <= 0) {
      return CHALLENGE_ARCHETYPES["show_that_expand"](rng);
    }
    const g = gcd(num, Math.abs(den));
    const simpNum = num / g;
    const simpDen = den / g;
    return {
      id: makeId("challenge", "rationalise_with_numerator", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "rationalise_with_numerator",
      prompt: `Rationalise the denominator: ${num}/(${a} + √${b})`,
      answer: simpDen === 1 ? `${simpNum}(${a} − √${b})` : `${simpNum}(${a} − √${b})/${simpDen}`,
      worked_solution: [
        `Multiply numerator and denominator by the conjugate (${a} − √${b})`,
        `Numerator: ${num}(${a} − √${b})`,
        `Denominator: (${a})² − (√${b})² = ${a * a} − ${b} = ${den}`,
        `= ${num}(${a} − √${b})/${den}`,
        g > 1 ? `Simplify: ${simpNum}(${a} − √${b})/${simpDen}` : "",
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["rationalise_denominator", "conjugate_rationalisation"], estimated_time_sec: 60 }
    };
  },

  "mixed_operations": (rng) => {
    const configs = [
      {
        expr: "√2(√8 + √18)",
        answer: "10",
        steps: [
          "√2 × √8 = √16 = 4",
          "√2 × √18 = √36 = 6",
          "4 + 6 = 10",
        ],
      },
      {
        expr: "√3(√12 − √27)",
        answer: "-3",
        steps: [
          "√3 × √12 = √36 = 6",
          "√3 × √27 = √81 = 9",
          "6 − 9 = −3",
        ],
      },
      {
        expr: "√5(√20 + √5)",
        answer: "15",
        steps: [
          "√5 × √20 = √100 = 10",
          "√5 × √5 = 5",
          "10 + 5 = 15",
        ],
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "mixed_operations", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "mixed_operations",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["multiply_surds", "simplify_surd", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },

  "simplify_surd_fraction": (rng) => {
    const configs = [
      {
        expr: "(√12 + √48)/√3",
        answer: "6",
        steps: [
          "√12/√3 = √(12/3) = √4 = 2",
          "√48/√3 = √(48/3) = √16 = 4",
          "2 + 4 = 6",
        ],
      },
      {
        expr: "(√50 − √8)/√2",
        answer: "3",
        steps: [
          "√50/√2 = √(50/2) = √25 = 5",
          "√8/√2 = √(8/2) = √4 = 2",
          "5 − 2 = 3",
        ],
      },
      {
        expr: "(√75 + √27)/√3",
        answer: "8",
        steps: [
          "√75/√3 = √(75/3) = √25 = 5",
          "√27/√3 = √(27/3) = √9 = 3",
          "5 + 3 = 8",
        ],
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "simplify_surd_fraction", params),
      topic: "introduction_to_surds", difficulty: "challenge", archetype: "simplify_surd_fraction",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "multiply_surds"], estimated_time_sec: 50 }
    };
  },
};

const DIFFICULTY_MAP: Record<string, Record<string, ArchetypeGenerator>> = {
  easy: EASY_ARCHETYPES,
  medium: MEDIUM_ARCHETYPES,
  hard: HARD_ARCHETYPES,
  challenge: CHALLENGE_ARCHETYPES,
};

export function generateQuestion(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  seed?: number
): GeneratedQuestion {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = DIFFICULTY_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const key = keys[Math.floor(rng.next() * keys.length)];
  return archetypes[key](rng);
}

export function generatePool(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  n: number,
  seed?: number,
  ensureUnique: boolean = true
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = DIFFICULTY_MAP[difficulty];
  const keys = Object.keys(archetypes);
  const results: GeneratedQuestion[] = [];
  const seenIds = new Set<string>();
  let attempts = 0;
  const maxAttempts = ensureUnique ? n * 50 : n;

  while (results.length < n && attempts < maxAttempts) {
    attempts++;
    const key = keys[Math.floor(rng.next() * keys.length)];
    const q = archetypes[key](new SeededRandom(Math.floor(rng.next() * 2147483647)));
    if (ensureUnique && seenIds.has(q.id)) continue;
    seenIds.add(q.id);
    results.push(q);
  }

  return results;
}

export function generateMixedPool(
  config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[],
  seed?: number
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const all: GeneratedQuestion[] = [];
  for (const { difficulty, count } of config) {
    const pool = generatePool(difficulty, count, Math.floor(rng.next() * 2147483647), true);
    all.push(...pool);
  }
  return rng.shuffle(all);
}
