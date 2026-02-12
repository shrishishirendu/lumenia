import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "fractional_indices";
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
  const raw = `${difficulty}:${archetype}:${JSON.stringify(params)}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 12);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFrac(n: number, d: number): [number, number] {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d);
  return [n / g, d / g];
}

function fracStr(n: number, d: number): string {
  const [sn, sd] = simplifyFrac(n, d);
  if (sd === 1) return `${sn}`;
  return `${sn}/${sd}`;
}

function nthRoot(base: number, n: number): number | null {
  if (n === 1) return base;
  if (n === 2) {
    const r = Math.round(Math.sqrt(base));
    return r * r === base ? r : null;
  }
  if (n === 3) {
    const r = Math.round(Math.cbrt(base));
    return r * r * r === base ? r : null;
  }
  if (n === 4) {
    const r = Math.round(Math.pow(base, 0.25));
    return r * r * r * r === base ? r : null;
  }
  const r = Math.round(Math.pow(base, 1 / n));
  let result = 1;
  for (let i = 0; i < n; i++) result *= r;
  return result === base ? r : null;
}

function intPow(base: number, exp: number): number {
  let result = 1;
  for (let i = 0; i < exp; i++) result *= base;
  return result;
}

function radicalStr(n: number): string {
  if (n === 2) return "√";
  if (n === 3) return "∛";
  return `${n}√`;
}

const PERFECT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81];
const PERFECT_CUBES = [8, 27, 64, 125];
const PERFECT_FOURTHS = [16, 81, 256];
const CLEAN_BASES = [4, 8, 9, 16, 25, 27, 32, 64, 81];

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "convert_half_to_radical": (rng) => {
    const base = rng.pick(PERFECT_SQUARES);
    const root = Math.round(Math.sqrt(base));
    const params = { base };
    return {
      id: makeId("easy", "convert_half_to_radical", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "convert_half_to_radical",
      prompt: `Write ${base}^(1/2) in radical form and evaluate.`,
      answer: `${root}`,
      worked_solution: [
        `${base}^(1/2) means √${base}`,
        `√${base} = ${root}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 20 }
    };
  },

  "convert_third_to_radical": (rng) => {
    const base = rng.pick(PERFECT_CUBES);
    const root = Math.round(Math.cbrt(base));
    const params = { base };
    return {
      id: makeId("easy", "convert_third_to_radical", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "convert_third_to_radical",
      prompt: `Write ${base}^(1/3) in radical form and evaluate.`,
      answer: `${root}`,
      worked_solution: [
        `${base}^(1/3) means ∛${base}`,
        `∛${base} = ${root}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 20 }
    };
  },

  "convert_fourth_to_radical": (rng) => {
    const base = rng.pick(PERFECT_FOURTHS);
    const root = Math.round(Math.pow(base, 0.25));
    const params = { base };
    return {
      id: makeId("easy", "convert_fourth_to_radical", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "convert_fourth_to_radical",
      prompt: `Evaluate ${base}^(1/4).`,
      answer: `${root}`,
      worked_solution: [
        `${base}^(1/4) means 4√${base}`,
        `4√${base} = ${root} because ${root}^4 = ${base}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 25 }
    };
  },

  "eval_m_over_2": (rng) => {
    const base = rng.pick([4, 9, 16, 25, 36, 49, 64]);
    const m = rng.pick([3, 5]);
    const root = Math.round(Math.sqrt(base));
    const answer = intPow(root, m);
    const params = { base, m };
    return {
      id: makeId("easy", "eval_m_over_2", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "eval_m_over_2",
      prompt: `Evaluate ${base}^(${m}/2).`,
      answer: `${answer}`,
      worked_solution: [
        `${base}^(${m}/2) = (${base}^(1/2))^${m}`,
        `${base}^(1/2) = √${base} = ${root}`,
        `${root}^${m} = ${answer}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 30 }
    };
  },

  "eval_2_over_3": (rng) => {
    const base = rng.pick(PERFECT_CUBES);
    const root = Math.round(Math.cbrt(base));
    const answer = root * root;
    const params = { base };
    return {
      id: makeId("easy", "eval_2_over_3", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "eval_2_over_3",
      prompt: `Evaluate ${base}^(2/3).`,
      answer: `${answer}`,
      worked_solution: [
        `${base}^(2/3) = (${base}^(1/3))^2`,
        `${base}^(1/3) = ∛${base} = ${root}`,
        `${root}^2 = ${answer}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 30 }
    };
  },

  "eval_3_over_4": (rng) => {
    const base = rng.pick(PERFECT_FOURTHS);
    const root = Math.round(Math.pow(base, 0.25));
    const answer = root * root * root;
    const params = { base };
    return {
      id: makeId("easy", "eval_3_over_4", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "eval_3_over_4",
      prompt: `Evaluate ${base}^(3/4).`,
      answer: `${answer}`,
      worked_solution: [
        `${base}^(3/4) = (${base}^(1/4))^3`,
        `${base}^(1/4) = 4√${base} = ${root}`,
        `${root}^3 = ${answer}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 30 }
    };
  },

  "eval_half_simple": (rng) => {
    const base = rng.pick([100, 121, 144, 169]);
    const root = Math.round(Math.sqrt(base));
    const params = { base };
    return {
      id: makeId("easy", "eval_half_simple", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "eval_half_simple",
      prompt: `Evaluate ${base}^(1/2).`,
      answer: `${root}`,
      worked_solution: [
        `${base}^(1/2) = √${base}`,
        `√${base} = ${root}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 15 }
    };
  },

  "convert_radical_to_index": (rng) => {
    const n = rng.pick([2, 3, 4]);
    const base = rng.pick(["a", "b", "x", "y"]);
    const params = { n, base };
    return {
      id: makeId("easy", "convert_radical_to_index", params),
      topic: "fractional_indices", difficulty: "easy", archetype: "convert_radical_to_index",
      prompt: `Write ${radicalStr(n)}${base} using index notation.`,
      answer: `${base}^(1/${n})`,
      worked_solution: [
        `${radicalStr(n)}${base} means the ${n === 2 ? "square" : n === 3 ? "cube" : "4th"} root of ${base}`,
        `This is written as ${base}^(1/${n})`,
      ],
      metadata: { params, skills: ["convert_to_radical"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "multiply_same_base_frac": (rng) => {
    const base = rng.pick(["a", "x", "m"]);
    const q = rng.pick([2, 3, 4]);
    const p1 = rng.randInt(1, q * 2 - 1);
    let p2 = rng.randInt(1, q * 2 - 1);
    if (p2 === p1) p2 = p1 + 1;
    const sumN = p1 + p2;
    const [sn, sd] = simplifyFrac(sumN, q);
    const params = { base, p1, p2, q };
    return {
      id: makeId("medium", "multiply_same_base_frac", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "multiply_same_base_frac",
      prompt: `Simplify: ${base}^(${fracStr(p1, q)}) × ${base}^(${fracStr(p2, q)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `When multiplying with the same base, add the indices`,
        `${fracStr(p1, q)} + ${fracStr(p2, q)} = ${fracStr(sumN, q)}${sd !== q ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws"], estimated_time_sec: 30 }
    };
  },

  "power_of_power_frac": (rng) => {
    const base = rng.pick(["a", "x", "y"]);
    const m = rng.randInt(2, 5);
    const q = rng.pick([2, 3]);
    const p = rng.randInt(1, 3);
    const prodN = m * p;
    const [sn, sd] = simplifyFrac(prodN, q);
    const params = { base, m, p, q };
    return {
      id: makeId("medium", "power_of_power_frac", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "power_of_power_frac",
      prompt: `Simplify: (${base}^${m})^(${fracStr(p, q)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `When raising a power to a power, multiply the indices`,
        `${m} × ${fracStr(p, q)} = ${fracStr(prodN, q)}${sd !== q ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: (${base}^${m})^(${fracStr(p, q)}) = ${base}^(${fracStr(sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws"], estimated_time_sec: 35 }
    };
  },

  "eval_product_sqrt": (rng) => {
    const a = rng.pick([2, 3, 5]);
    const b = rng.pick([2, 3, 5].filter(x => x !== a));
    const prod = a * b;
    const sqrtable = nthRoot(prod, 2);
    const params = { a, b };
    if (sqrtable !== null) {
      return {
        id: makeId("medium", "eval_product_sqrt", params),
        topic: "fractional_indices", difficulty: "medium", archetype: "eval_product_sqrt",
        prompt: `Evaluate (${a} × ${b})^(1/2).`,
        answer: `√${prod}`,
        worked_solution: [
          `(${a} × ${b})^(1/2) = ${prod}^(1/2)`,
          `= √${prod} = ${sqrtable}`,
        ],
        metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 25 }
      };
    }
    return {
      id: makeId("medium", "eval_product_sqrt", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "eval_product_sqrt",
      prompt: `Write (${a} × ${b})^(1/2) in simplest radical form.`,
      answer: `√${prod}`,
      worked_solution: [
        `(${a} × ${b})^(1/2) = ${prod}^(1/2)`,
        `= √${prod}`,
      ],
      metadata: { params, skills: ["convert_to_radical"], estimated_time_sec: 25 }
    };
  },

  "multiply_diff_frac_denom": (rng) => {
    const base = rng.pick(["a", "x"]);
    const d1 = 2;
    const d2 = 3;
    const p1 = rng.randInt(1, 3);
    const p2 = rng.randInt(1, 3);
    const sumN = p1 * d2 + p2 * d1;
    const sumD = d1 * d2;
    const [sn, sd] = simplifyFrac(sumN, sumD);
    const params = { base, p1, d1, p2, d2 };
    return {
      id: makeId("medium", "multiply_diff_frac_denom", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "multiply_diff_frac_denom",
      prompt: `Simplify: ${base}^(${fracStr(p1, d1)}) × ${base}^(${fracStr(p2, d2)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `Add the indices: ${fracStr(p1, d1)} + ${fracStr(p2, d2)}`,
        `Common denominator ${sumD}: ${fracStr(p1 * d2, sumD)} + ${fracStr(p2 * d1, sumD)} = ${fracStr(sumN, sumD)}`,
        sd !== sumD ? `Simplify: ${fracStr(sn, sd)}` : "",
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["apply_index_laws"], estimated_time_sec: 40 }
    };
  },

  "eval_numeric_m_n": (rng) => {
    const configs: { base: number; n: number; m: number }[] = [
      { base: 8, n: 3, m: 4 }, { base: 27, n: 3, m: 2 },
      { base: 16, n: 4, m: 3 }, { base: 32, n: 5, m: 2 },
      { base: 64, n: 3, m: 2 }, { base: 4, n: 2, m: 5 },
    ];
    const cfg = rng.pick(configs);
    const root = nthRoot(cfg.base, cfg.n)!;
    const answer = intPow(root, cfg.m);
    const params = { base: cfg.base, m: cfg.m, n: cfg.n };
    return {
      id: makeId("medium", "eval_numeric_m_n", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "eval_numeric_m_n",
      prompt: `Evaluate ${cfg.base}^(${fracStr(cfg.m, cfg.n)}).`,
      answer: `${answer}`,
      worked_solution: [
        `${cfg.base}^(${fracStr(cfg.m, cfg.n)}) = (${cfg.base}^(1/${cfg.n}))^${cfg.m}`,
        `${cfg.base}^(1/${cfg.n}) = ${radicalStr(cfg.n)}${cfg.base} = ${root}`,
        `${root}^${cfg.m} = ${answer}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 35 }
    };
  },

  "simplify_product_bases_half": (rng) => {
    const a = rng.pick([4, 9, 16, 25]);
    const b = rng.pick([4, 9, 16, 25].filter(x => x !== a));
    const ra = Math.round(Math.sqrt(a));
    const rb = Math.round(Math.sqrt(b));
    const answer = ra * rb;
    const params = { a, b };
    return {
      id: makeId("medium", "simplify_product_bases_half", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "simplify_product_bases_half",
      prompt: `Evaluate ${a}^(1/2) × ${b}^(1/2).`,
      answer: `${answer}`,
      worked_solution: [
        `${a}^(1/2) = √${a} = ${ra}`,
        `${b}^(1/2) = √${b} = ${rb}`,
        `${ra} × ${rb} = ${answer}`,
      ],
      metadata: { params, skills: ["convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 25 }
    };
  },

  "power_of_frac_index": (rng) => {
    const base = rng.pick(["a", "x"]);
    const p = rng.randInt(1, 3);
    const q = rng.pick([2, 3]);
    const exp = rng.randInt(2, 4);
    const prodN = p * exp;
    const [sn, sd] = simplifyFrac(prodN, q);
    const params = { base, p, q, exp };
    return {
      id: makeId("medium", "power_of_frac_index", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "power_of_frac_index",
      prompt: `Simplify: (${base}^(${fracStr(p, q)}))^${exp}`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `When raising a power to a power, multiply indices`,
        `${fracStr(p, q)} × ${exp} = ${fracStr(prodN, q)}${sd !== q ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws"], estimated_time_sec: 30 }
    };
  },

  "divide_same_base_frac": (rng) => {
    const base = rng.pick(["a", "x", "p"]);
    const q = rng.pick([2, 3, 4]);
    const p1 = rng.randInt(2, q * 2);
    const p2 = rng.randInt(1, p1 - 1);
    const diffN = p1 - p2;
    const [sn, sd] = simplifyFrac(diffN, q);
    const params = { base, p1, p2, q };
    return {
      id: makeId("medium", "divide_same_base_frac", params),
      topic: "fractional_indices", difficulty: "medium", archetype: "divide_same_base_frac",
      prompt: `Simplify: ${base}^(${fracStr(p1, q)}) ÷ ${base}^(${fracStr(p2, q)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `When dividing with the same base, subtract the indices`,
        `${fracStr(p1, q)} − ${fracStr(p2, q)} = ${fracStr(diffN, q)}${sd !== q ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws"], estimated_time_sec: 30 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "neg_frac_index_eval": (rng) => {
    const base = rng.pick([4, 9, 16, 25, 8, 27]);
    const n = nthRoot(base, 2) !== null ? 2 : 3;
    const root = nthRoot(base, n)!;
    const params = { base, n };
    return {
      id: makeId("hard", "neg_frac_index_eval", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "neg_frac_index_eval",
      prompt: `Evaluate ${base}^(-1/${n}).`,
      answer: `1/${root}`,
      worked_solution: [
        `${base}^(-1/${n}) = 1 / ${base}^(1/${n})`,
        `${base}^(1/${n}) = ${radicalStr(n)}${base} = ${root}`,
        `Result: 1/${root}`,
      ],
      metadata: { params, skills: ["handle_negative_index", "convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 35 }
    };
  },

  "neg_frac_index_m_n": (rng) => {
    const configs: { base: number; m: number; n: number }[] = [
      { base: 8, m: 2, n: 3 }, { base: 27, m: 2, n: 3 },
      { base: 16, m: 3, n: 2 }, { base: 4, m: 3, n: 2 },
      { base: 25, m: 3, n: 2 }, { base: 9, m: 3, n: 2 },
    ];
    const cfg = rng.pick(configs);
    const root = nthRoot(cfg.base, cfg.n)!;
    const powered = intPow(root, cfg.m);
    const params = { base: cfg.base, m: cfg.m, n: cfg.n };
    return {
      id: makeId("hard", "neg_frac_index_m_n", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "neg_frac_index_m_n",
      prompt: `Evaluate ${cfg.base}^(-${cfg.m}/${cfg.n}).`,
      answer: `1/${powered}`,
      worked_solution: [
        `${cfg.base}^(-${cfg.m}/${cfg.n}) = 1 / ${cfg.base}^(${cfg.m}/${cfg.n})`,
        `${cfg.base}^(1/${cfg.n}) = ${root}`,
        `${root}^${cfg.m} = ${powered}`,
        `Result: 1/${powered}`,
      ],
      metadata: { params, skills: ["handle_negative_index", "convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 45 }
    };
  },

  "divide_frac_indices": (rng) => {
    const base = rng.pick(["a", "x", "y"]);
    const q = rng.pick([2, 3]);
    const p1 = rng.randInt(1, q * 2);
    const p2 = rng.randInt(p1 + 1, p1 + q * 2);
    const diffN = p1 - p2;
    const [sn, sd] = simplifyFrac(diffN, q);
    const params = { base, p1, p2, q };
    return {
      id: makeId("hard", "divide_frac_indices", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "divide_frac_indices",
      prompt: `Simplify: ${base}^(${fracStr(p1, q)}) ÷ ${base}^(${fracStr(p2, q)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `Subtract indices: ${fracStr(p1, q)} − ${fracStr(p2, q)} = ${fracStr(diffN, q)}${sd !== q ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: ${base}^(${fracStr(sn, sd)})`,
        `This is a negative index, meaning 1 / ${base}^(${fracStr(-sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws", "handle_negative_index"], estimated_time_sec: 40 }
    };
  },

  "coeff_times_frac_power": (rng) => {
    const coeff = rng.pick([2, 3, 4, 5]);
    const base = rng.pick([8, 27, 16, 4, 9, 25]);
    const n = nthRoot(base, 2) !== null ? 2 : 3;
    const m = rng.pick([2, 3].filter(v => v <= (n === 2 ? 3 : 2)));
    const root = nthRoot(base, n)!;
    const powered = intPow(root, m);
    const answer = coeff * powered;
    const params = { coeff, base, m, n };
    return {
      id: makeId("hard", "coeff_times_frac_power", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "coeff_times_frac_power",
      prompt: `Evaluate ${coeff} × ${base}^(${fracStr(m, n)}).`,
      answer: `${answer}`,
      worked_solution: [
        `First evaluate ${base}^(${fracStr(m, n)})`,
        `${base}^(1/${n}) = ${root}`,
        `${root}^${m} = ${powered}`,
        `${coeff} × ${powered} = ${answer}`,
      ],
      metadata: { params, skills: ["evaluate_perfect_power", "convert_to_radical"], estimated_time_sec: 40 }
    };
  },

  "coeff_times_neg_frac": (rng) => {
    const coeff = rng.pick([2, 3, 4, 5]);
    const base = rng.pick([4, 9, 16, 25]);
    const root = Math.round(Math.sqrt(base));
    const params = { coeff, base };
    return {
      id: makeId("hard", "coeff_times_neg_frac", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "coeff_times_neg_frac",
      prompt: `Evaluate ${coeff} × ${base}^(-1/2).`,
      answer: `${fracStr(coeff, root)}`,
      worked_solution: [
        `${base}^(-1/2) = 1 / √${base} = 1/${root}`,
        `${coeff} × 1/${root} = ${fracStr(coeff, root)}`,
      ],
      metadata: { params, skills: ["handle_negative_index", "convert_to_radical", "evaluate_perfect_power"], estimated_time_sec: 40 }
    };
  },

  "rationalise_simple": (rng) => {
    const base = rng.pick([2, 3, 5, 7]);
    const params = { base };
    return {
      id: makeId("hard", "rationalise_simple", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "rationalise_simple",
      prompt: `Simplify 1 / ${base}^(1/2) by rationalising the denominator.`,
      answer: `√${base}/${base}`,
      worked_solution: [
        `1 / ${base}^(1/2) = 1 / √${base}`,
        `Multiply numerator and denominator by √${base}:`,
        `= √${base} / (√${base} × √${base}) = √${base} / ${base}`,
      ],
      metadata: { params, skills: ["handle_negative_index", "rationalise_denominator"], estimated_time_sec: 45 }
    };
  },

  "neg_index_symbolic": (rng) => {
    const base = rng.pick(["a", "x", "y"]);
    const p = rng.randInt(1, 3);
    const q = rng.pick([2, 3]);
    const params = { base, p, q };
    return {
      id: makeId("hard", "neg_index_symbolic", params),
      topic: "fractional_indices", difficulty: "hard", archetype: "neg_index_symbolic",
      prompt: `Rewrite ${base}^(-${fracStr(p, q)}) with a positive index.`,
      answer: `1/${base}^(${fracStr(p, q)})`,
      worked_solution: [
        `A negative index means take the reciprocal`,
        `${base}^(-${fracStr(p, q)}) = 1 / ${base}^(${fracStr(p, q)})`,
      ],
      metadata: { params, skills: ["handle_negative_index"], estimated_time_sec: 20 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "simplify_three_frac_powers": (rng) => {
    const base = rng.pick(["a", "x"]);
    const p1 = rng.randInt(1, 3);
    const p2 = rng.randInt(1, 3);
    const p3 = rng.randInt(1, 3);
    const sumN = p1 * 3 + p2 * 2 - p3;
    const denom = 6;
    const [sn, sd] = simplifyFrac(sumN, denom);
    const params = { base, p1, p2, p3 };
    return {
      id: makeId("challenge", "simplify_three_frac_powers", params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "simplify_three_frac_powers",
      prompt: `Simplify: (${base}^(${fracStr(p1, 2)}) × ${base}^(${fracStr(p2, 3)})) ÷ ${base}^(${fracStr(p3, 6)})`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `Add indices for multiplication: ${fracStr(p1, 2)} + ${fracStr(p2, 3)}`,
        `Common denominator 6: ${fracStr(p1 * 3, 6)} + ${fracStr(p2 * 2, 6)} = ${fracStr(p1 * 3 + p2 * 2, 6)}`,
        `Subtract index for division: ${fracStr(p1 * 3 + p2 * 2, 6)} − ${fracStr(p3, 6)} = ${fracStr(sumN, 6)}`,
        sd !== 6 ? `Simplify: ${fracStr(sn, sd)}` : "",
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 60 }
    };
  },

  "express_as_power_of_2": (rng) => {
    const configs = [
      { prompt: "8^(1/3) × 4^(1/2) ÷ 2^(1/6)", steps: ["8 = 2^3, so 8^(1/3) = 2^1 = 2", "4 = 2^2, so 4^(1/2) = 2^1 = 2", "Add then subtract: 1 + 1 − 1/6 = 11/6"], answer: "2^(11/6)", params: { variant: 1 } },
      { prompt: "16^(1/4) × 8^(2/3)", steps: ["16 = 2^4, so 16^(1/4) = 2^1 = 2", "8 = 2^3, so 8^(2/3) = 2^2 = 4", "2 × 4 = 8 = 2^3"], answer: "2^3", params: { variant: 2 } },
      { prompt: "4^(3/2) ÷ 8^(2/3)", steps: ["4 = 2^2, so 4^(3/2) = 2^3 = 8", "8 = 2^3, so 8^(2/3) = 2^2 = 4", "8 ÷ 4 = 2 = 2^1"], answer: "2^1", params: { variant: 3 } },
      { prompt: "32^(2/5) × 2^(1/2)", steps: ["32 = 2^5, so 32^(2/5) = 2^2 = 4", "Result: 4 × 2^(1/2) = 2^2 × 2^(1/2) = 2^(5/2)"], answer: "2^(5/2)", params: { variant: 4 } },
    ];
    const cfg = rng.pick(configs);
    return {
      id: makeId("challenge", "express_as_power_of_2", cfg.params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "express_as_power_of_2",
      prompt: `Express as a single power of 2: ${cfg.prompt}`,
      answer: cfg.answer,
      worked_solution: [...cfg.steps, `Answer: ${cfg.answer}`],
      metadata: { params: cfg.params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 60 }
    };
  },

  "express_as_power_of_3": (rng) => {
    const configs = [
      { prompt: "27^(2/3) × 9^(1/2)", steps: ["27 = 3^3, so 27^(2/3) = 3^2 = 9", "9 = 3^2, so 9^(1/2) = 3^1 = 3", "9 × 3 = 27 = 3^3"], answer: "3^3", params: { variant: 1 } },
      { prompt: "9^(3/2) ÷ 27^(1/3)", steps: ["9 = 3^2, so 9^(3/2) = 3^3 = 27", "27 = 3^3, so 27^(1/3) = 3^1 = 3", "27 ÷ 3 = 9 = 3^2"], answer: "3^2", params: { variant: 2 } },
      { prompt: "81^(1/4) × 27^(1/3) × 9^(-1/2)", steps: ["81 = 3^4, so 81^(1/4) = 3", "27 = 3^3, so 27^(1/3) = 3", "9 = 3^2, so 9^(-1/2) = 3^(-1) = 1/3", "3 × 3 × 1/3 = 3 = 3^1"], answer: "3^1", params: { variant: 3 } },
    ];
    const cfg = rng.pick(configs);
    return {
      id: makeId("challenge", "express_as_power_of_3", cfg.params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "express_as_power_of_3",
      prompt: `Express as a single power of 3: ${cfg.prompt}`,
      answer: cfg.answer,
      worked_solution: [...cfg.steps, `Answer: ${cfg.answer}`],
      metadata: { params: cfg.params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 60 }
    };
  },

  "simplify_mixed_ops": (rng) => {
    const base = rng.pick(["a", "x"]);
    const p1 = rng.randInt(2, 5);
    const q1 = rng.pick([2, 3]);
    const p2 = rng.randInt(1, 3);
    const q2 = rng.pick([2, 3]);
    const exp = rng.randInt(2, 3);
    const innerN = p1 * q2 - p2 * q1;
    const innerD = q1 * q2;
    const finalN = innerN * exp;
    const finalD = innerD;
    const [sn, sd] = simplifyFrac(finalN, finalD);
    const params = { base, p1, q1, p2, q2, exp };
    return {
      id: makeId("challenge", "simplify_mixed_ops", params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "simplify_mixed_ops",
      prompt: `Simplify: (${base}^(${fracStr(p1, q1)}) ÷ ${base}^(${fracStr(p2, q2)}))^${exp}`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `First simplify inside the bracket by subtracting indices:`,
        `${fracStr(p1, q1)} − ${fracStr(p2, q2)} = ${fracStr(innerN, innerD)}`,
        `Then raise to power ${exp}: ${fracStr(innerN, innerD)} × ${exp} = ${fracStr(finalN, finalD)}`,
        sd !== finalD ? `Simplify: ${fracStr(sn, sd)}` : "",
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 60 }
    };
  },

  "neg_frac_combined": (rng) => {
    const base = rng.pick([4, 9, 16, 25]);
    const root = Math.round(Math.sqrt(base));
    const coeff = rng.pick([2, 3, 5]);
    const m = rng.pick([1, 3]);
    const powered = intPow(root, m);
    const [numS, denS] = simplifyFrac(coeff, powered);
    const params = { base, coeff, m };
    return {
      id: makeId("challenge", "neg_frac_combined", params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "neg_frac_combined",
      prompt: `Evaluate ${coeff} × ${base}^(-${m}/2).`,
      answer: `${fracStr(numS, denS)}`,
      worked_solution: [
        `${base}^(-${m}/2) = 1 / ${base}^(${m}/2)`,
        `${base}^(1/2) = ${root}, so ${base}^(${m}/2) = ${root}^${m} = ${powered}`,
        `${coeff} / ${powered} = ${fracStr(numS, denS)}`,
      ],
      metadata: { params, skills: ["handle_negative_index", "evaluate_perfect_power", "simplify_to_single_power"], estimated_time_sec: 50 }
    };
  },

  "show_equivalence": (rng) => {
    const base = rng.pick([8, 27, 16, 32, 64]);
    let primeBase: number;
    let exp: number;
    if (base === 8) { primeBase = 2; exp = 3; }
    else if (base === 27) { primeBase = 3; exp = 3; }
    else if (base === 16) { primeBase = 2; exp = 4; }
    else if (base === 32) { primeBase = 2; exp = 5; }
    else { primeBase = 2; exp = 6; }

    const m = rng.randInt(1, 3);
    const n = rng.pick([2, 3]);
    const resultN = exp * m;
    const [sn, sd] = simplifyFrac(resultN, n);
    const params = { base, m, n };
    return {
      id: makeId("challenge", "show_equivalence", params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "show_equivalence",
      prompt: `Express ${base}^(${fracStr(m, n)}) as a single power of ${primeBase}.`,
      answer: `${primeBase}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `${base} = ${primeBase}^${exp}`,
        `${base}^(${fracStr(m, n)}) = (${primeBase}^${exp})^(${fracStr(m, n)})`,
        `= ${primeBase}^(${exp} × ${fracStr(m, n)}) = ${primeBase}^(${fracStr(resultN, n)})`,
        sd !== n ? `Simplify: ${primeBase}^(${fracStr(sn, sd)})` : "",
      ].filter(s => s.length > 0),
      metadata: { params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 50 }
    };
  },

  "simplify_frac_chain": (rng) => {
    const base = rng.pick(["a", "x"]);
    const exps = [
      rng.randInt(1, 4),
      rng.randInt(1, 4),
      rng.randInt(1, 3),
    ];
    const ops = [rng.pick(["×", "÷"]), rng.pick(["×", "÷"])];
    const d = rng.pick([2, 3]);
    let sumN = exps[0];
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === "×") sumN += exps[i + 1];
      else sumN -= exps[i + 1];
    }
    const [sn, sd] = simplifyFrac(sumN, d);
    const params = { base, e0: exps[0], e1: exps[1], e2: exps[2], op0: ops[0], op1: ops[1], d };
    const parts = [`${base}^(${fracStr(exps[0], d)}) ${ops[0]} ${base}^(${fracStr(exps[1], d)}) ${ops[1]} ${base}^(${fracStr(exps[2], d)})`];
    return {
      id: makeId("challenge", "simplify_frac_chain", params),
      topic: "fractional_indices", difficulty: "challenge", archetype: "simplify_frac_chain",
      prompt: `Simplify: ${parts[0]}`,
      answer: `${base}^(${fracStr(sn, sd)})`,
      worked_solution: [
        `Combine indices: ${fracStr(exps[0], d)} ${ops[0] === "×" ? "+" : "−"} ${fracStr(exps[1], d)} ${ops[1] === "×" ? "+" : "−"} ${fracStr(exps[2], d)}`,
        `= ${fracStr(sumN, d)}${sd !== d ? ` = ${fracStr(sn, sd)}` : ""}`,
        `Result: ${base}^(${fracStr(sn, sd)})`,
      ],
      metadata: { params, skills: ["apply_index_laws", "simplify_to_single_power"], estimated_time_sec: 50 }
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
