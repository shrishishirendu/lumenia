import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "inequalities";
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

type IneqSign = ">" | "<" | "≥" | "≤";
const SIGNS: IneqSign[] = [">", "<", "≥", "≤"];
const STRICT_SIGNS: IneqSign[] = [">", "<"];
const WEAK_SIGNS: IneqSign[] = ["≥", "≤"];

function flipSign(s: IneqSign): IneqSign {
  switch (s) {
    case ">": return "<";
    case "<": return ">";
    case "≥": return "≤";
    case "≤": return "≥";
  }
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "x_plus_b_gt_c": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = x_boundary + b;
    const params = { b, c, x_boundary, sign };
    return {
      id: makeId("easy", "x_plus_b_gt_c", params),
      topic: "inequalities", difficulty: "easy", archetype: "x_plus_b_gt_c",
      prompt: `Solve: x + ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: x ${sign} ${c} − ${b}`,
        `x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms"], estimated_time_sec: 20 }
    };
  },

  "x_minus_b_lt_c": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(2, 10);
    const b = rng.randInt(1, x_boundary - 1);
    const c = x_boundary - b;
    const params = { b, c, x_boundary, sign };
    return {
      id: makeId("easy", "x_minus_b_lt_c", params),
      topic: "inequalities", difficulty: "easy", archetype: "x_minus_b_lt_c",
      prompt: `Solve: x − ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Add ${b} to both sides: x ${sign} ${c} + ${b}`,
        `x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms"], estimated_time_sec: 20 }
    };
  },

  "ax_gt_c": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(1, 10);
    const c = a * x_boundary;
    const params = { a, c, x_boundary, sign };
    return {
      id: makeId("easy", "ax_gt_c", params),
      topic: "inequalities", difficulty: "easy", archetype: "ax_gt_c",
      prompt: `Solve: ${a}x ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${c} ÷ ${a}`,
        `x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["isolate_variable"], estimated_time_sec: 20 }
    };
  },

  "x_div_k_leq_m": (rng) => {
    const sign = rng.pick(SIGNS);
    const k = rng.randInt(2, 9);
    const m = rng.randInt(1, 10);
    const x_boundary = k * m;
    const params = { k, m, x_boundary, sign };
    return {
      id: makeId("easy", "x_div_k_leq_m", params),
      topic: "inequalities", difficulty: "easy", archetype: "x_div_k_leq_m",
      prompt: `Solve: x ÷ ${k} ${sign} ${m}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Multiply both sides by ${k} (positive, sign unchanged): x ${sign} ${m} × ${k}`,
        `x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["isolate_variable"], estimated_time_sec: 20 }
    };
  },

  "b_plus_x_gt_c": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = b + x_boundary;
    const params = { b, c, x_boundary, sign };
    return {
      id: makeId("easy", "b_plus_x_gt_c", params),
      topic: "inequalities", difficulty: "easy", archetype: "b_plus_x_gt_c",
      prompt: `Solve: ${b} + x ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: x ${sign} ${c} − ${b}`,
        `x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms"], estimated_time_sec: 20 }
    };
  },

  "c_gt_ax": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(1, 10);
    const c = a * x_boundary;
    const flipped = flipSign(sign);
    const params = { a, c, x_boundary, sign };
    return {
      id: makeId("easy", "c_gt_ax", params),
      topic: "inequalities", difficulty: "easy", archetype: "c_gt_ax",
      prompt: `Solve: ${c} ${sign} ${a}x`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Divide both sides by ${a}: ${c} ÷ ${a} ${sign} x`,
        `${x_boundary} ${sign} x, which means x ${flipped} ${x_boundary}`
      ],
      metadata: { params, skills: ["isolate_variable", "rewrite_inequality"], estimated_time_sec: 25 }
    };
  },

  "ax_plus_b_gt_c_easy": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 5);
    const x_boundary = rng.randInt(1, 8);
    const b = rng.randInt(1, 10);
    const c = a * x_boundary + b;
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("easy", "ax_plus_b_gt_c_easy", params),
      topic: "inequalities", difficulty: "easy", archetype: "ax_plus_b_gt_c_easy",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x ${sign} ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${(c - b)} ÷ ${a} = ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },

  "ax_minus_b_lt_c_easy": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 5);
    const x_boundary = rng.randInt(2, 10);
    const b = rng.randInt(1, 10);
    const c = a * x_boundary - b;
    if (c <= 0) return EASY_ARCHETYPES["ax_plus_b_gt_c_easy"](rng);
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("easy", "ax_minus_b_lt_c_easy", params),
      topic: "inequalities", difficulty: "easy", archetype: "ax_minus_b_lt_c_easy",
      prompt: `Solve: ${a}x − ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Add ${b} to both sides: ${a}x ${sign} ${c} + ${b} = ${c + b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${(c + b)} ÷ ${a} = ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "ax_plus_b_geq_c": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(-8, 8);
    if (x_boundary === 0) return MEDIUM_ARCHETYPES["ax_plus_b_geq_c"](rng);
    const b = rng.randInt(1, 15);
    const c = a * x_boundary + b;
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("medium", "ax_plus_b_geq_c", params),
      topic: "inequalities", difficulty: "medium", archetype: "ax_plus_b_geq_c",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x ${sign} ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 35 }
    };
  },

  "vars_both_sides": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(1, 10);
    const a = rng.randInt(3, 9);
    let c = rng.randInt(2, a - 1);
    if (c === a) c = a - 1;
    const b = rng.randInt(1, 15);
    const d = (a - c) * x_boundary + b;
    const diff = a - c;
    const params = { a, b, c, d, x_boundary, sign };
    return {
      id: makeId("medium", "vars_both_sides", params),
      topic: "inequalities", difficulty: "medium", archetype: "vars_both_sides",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}x + ${d}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${c}x from both sides: ${diff}x + ${b} ${sign} ${d}`,
        `Subtract ${b} from both sides: ${diff}x ${sign} ${d} − ${b} = ${d - b}`,
        `Divide both sides by ${diff} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "collect_like_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "vars_both_sides_neg_boundary": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(-10, -1);
    const a = rng.randInt(3, 9);
    let c = rng.randInt(2, a - 1);
    if (c === a) c = a - 1;
    const d = rng.randInt(1, 15);
    const b = (a - c) * x_boundary + d;
    if (b <= 0) return MEDIUM_ARCHETYPES["vars_both_sides"](rng);
    const diff = a - c;
    const params = { a, b, c, d, x_boundary, sign };
    return {
      id: makeId("medium", "vars_both_sides_neg_boundary", params),
      topic: "inequalities", difficulty: "medium", archetype: "vars_both_sides_neg_boundary",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}x + ${d}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${c}x from both sides: ${diff}x + ${b} ${sign} ${d}`,
        `Subtract ${b} from both sides: ${diff}x ${sign} ${d - b}`,
        `Divide both sides by ${diff} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "collect_like_terms", "negative_solutions"], estimated_time_sec: 50 }
    };
  },

  "single_bracket": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(1, 10);
    const b = rng.randInt(1, 12);
    const c = a * (x_boundary + b);
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("medium", "single_bracket", params),
      topic: "inequalities", difficulty: "medium", archetype: "single_bracket",
      prompt: `Solve: ${a}(x + ${b}) ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Expand: ${a}x + ${a * b} ${sign} ${c}`,
        `Subtract ${a * b} from both sides: ${a}x ${sign} ${c} − ${a * b} = ${c - a * b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "single_bracket_subtract": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(2, 10);
    const b = rng.randInt(1, x_boundary - 1);
    const c = a * (x_boundary - b);
    if (c <= 0) return MEDIUM_ARCHETYPES["single_bracket"](rng);
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("medium", "single_bracket_subtract", params),
      topic: "inequalities", difficulty: "medium", archetype: "single_bracket_subtract",
      prompt: `Solve: ${a}(x − ${b}) ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Expand: ${a}x − ${a * b} ${sign} ${c}`,
        `Add ${a * b} to both sides: ${a}x ${sign} ${c} + ${a * b} = ${c + a * b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "ax_minus_b_neg_const": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(-6, -1);
    const b = rng.randInt(1, 15);
    const c = a * x_boundary - b;
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("medium", "ax_minus_b_neg_const", params),
      topic: "inequalities", difficulty: "medium", archetype: "ax_minus_b_neg_const",
      prompt: `Solve: ${a}x − ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Add ${b} to both sides: ${a}x ${sign} ${c} + ${b} = ${c + b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "negative_solutions", "isolate_variable"], estimated_time_sec: 40 }
    };
  },

  "bracket_with_coeff": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 5);
    const bCoeff = rng.randInt(2, 4);
    const x_boundary = rng.randInt(1, 8);
    const bConst = rng.randInt(1, 10);
    const c = a * (bCoeff * x_boundary + bConst);
    const params = { a, bCoeff, bConst, c, x_boundary, sign };
    return {
      id: makeId("medium", "bracket_with_coeff", params),
      topic: "inequalities", difficulty: "medium", archetype: "bracket_with_coeff",
      prompt: `Solve: ${a}(${bCoeff}x + ${bConst}) ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Expand: ${a * bCoeff}x + ${a * bConst} ${sign} ${c}`,
        `Subtract ${a * bConst} from both sides: ${a * bCoeff}x ${sign} ${c - a * bConst}`,
        `Divide both sides by ${a * bCoeff} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 50 }
    };
  },

  "two_step_neg_boundary": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(-10, -1);
    const b = rng.randInt(1, 20);
    const c = a * x_boundary + b;
    if (c >= 0) return MEDIUM_ARCHETYPES["ax_minus_b_neg_const"](rng);
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("medium", "two_step_neg_boundary", params),
      topic: "inequalities", difficulty: "medium", archetype: "two_step_neg_boundary",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}`,
      answer: `x ${sign} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x ${sign} ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a} (positive, sign unchanged): x ${sign} ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "negative_solutions", "isolate_variable"], estimated_time_sec: 40 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "neg_coeff_simple": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 9);
    const x_boundary = rng.randInt(1, 10);
    const c = -a * x_boundary;
    const flipped = flipSign(sign);
    const params = { a, c: Math.abs(c), x_boundary, sign };
    return {
      id: makeId("hard", "neg_coeff_simple", params),
      topic: "inequalities", difficulty: "hard", archetype: "neg_coeff_simple",
      prompt: `Solve: −${a}x ${sign} ${c}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Divide both sides by −${a}`,
        `When dividing by a negative number, FLIP the inequality sign: ${sign} becomes ${flipped}`,
        `x ${flipped} ${c} ÷ (−${a}) = ${x_boundary}`
      ],
      metadata: { params, skills: ["flip_inequality_sign", "isolate_variable"], estimated_time_sec: 35 }
    };
  },

  "neg_coeff_plus_b": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 8);
    const x_boundary = rng.randInt(1, 8);
    const b = rng.randInt(1, 15);
    const c = -a * x_boundary + b;
    const flipped = flipSign(sign);
    const params = { a, b, c, x_boundary, sign };
    return {
      id: makeId("hard", "neg_coeff_plus_b", params),
      topic: "inequalities", difficulty: "hard", archetype: "neg_coeff_plus_b",
      prompt: `Solve: −${a}x + ${b} ${sign} ${c}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Subtract ${b} from both sides: −${a}x ${sign} ${c} − ${b} = ${c - b}`,
        `Divide both sides by −${a} and FLIP the sign: x ${flipped} ${(c - b)} ÷ (−${a}) = ${x_boundary}`
      ],
      metadata: { params, skills: ["balance_terms", "flip_inequality_sign", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "divide_neg_denominator": (rng) => {
    const sign = rng.pick(SIGNS);
    const k = rng.randInt(2, 8);
    const a = rng.randInt(1, 5);
    const x_boundary = rng.randInt(1, 10);
    const b = rng.randInt(1, 12);
    const numerator = a * x_boundary + b;
    const m = numerator / k;
    const flipped = flipSign(sign);
    if (!Number.isInteger(m)) {
      const newX = rng.randInt(1, 8);
      const newB = k * rng.randInt(1, 5) - a * newX;
      if (newB > 0 && newB <= 15) {
        const nm = (a * newX + newB) / k;
        if (Number.isInteger(nm)) {
          const params2 = { a, b: newB, k, m: nm, x_boundary: newX, sign };
          return {
            id: makeId("hard", "divide_neg_denominator", params2),
            topic: "inequalities" as const, difficulty: "hard" as const, archetype: "divide_neg_denominator",
            prompt: `Solve: (${a}x + ${newB}) ÷ (−${k}) ${sign} ${-nm}`,
            answer: `x ${flipped} ${newX}`,
            worked_solution: [
              `Multiply both sides by −${k} and FLIP the sign: ${a}x + ${newB} ${flipped} ${nm * k}`,
              `Subtract ${newB}: ${a}x ${flipped} ${nm * k - newB}`,
              `Divide by ${a}: x ${flipped} ${newX}`
            ],
            metadata: { params: params2, skills: ["flip_inequality_sign", "clear_fractions", "balance_terms"], estimated_time_sec: 60 }
          };
        }
      }
      return HARD_ARCHETYPES["neg_coeff_simple"](rng);
    }
    const params = { a, b, k, m, x_boundary, sign };
    return {
      id: makeId("hard", "divide_neg_denominator", params),
      topic: "inequalities", difficulty: "hard", archetype: "divide_neg_denominator",
      prompt: `Solve: (${a}x + ${b}) ÷ (−${k}) ${sign} ${-m}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Multiply both sides by −${k} and FLIP the sign: ${a}x + ${b} ${flipped} ${m * k}`,
        `Subtract ${b}: ${a}x ${flipped} ${m * k - b}`,
        `Divide by ${a}: x ${flipped} ${x_boundary}`
      ],
      metadata: { params, skills: ["flip_inequality_sign", "clear_fractions", "balance_terms"], estimated_time_sec: 60 }
    };
  },

  "multiply_neg_both_sides": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 6);
    const x_boundary = rng.randInt(1, 8);
    const b = rng.randInt(1, 10);
    const c = -a * (x_boundary + b);
    const flipped = flipSign(sign);
    const params = { a, b, c: Math.abs(c), x_boundary, sign };
    return {
      id: makeId("hard", "multiply_neg_both_sides", params),
      topic: "inequalities", difficulty: "hard", archetype: "multiply_neg_both_sides",
      prompt: `Solve: −${a}(x + ${b}) ${sign} ${c}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Expand: −${a}x − ${a * b} ${sign} ${c}`,
        `Add ${a * b} to both sides: −${a}x ${sign} ${c} + ${a * b} = ${c + a * b}`,
        `Divide by −${a} and FLIP the sign: x ${flipped} ${(c + a * b) / (-a)} = ${x_boundary}`
      ],
      metadata: { params, skills: ["expand_brackets", "flip_inequality_sign", "balance_terms"], estimated_time_sec: 55 }
    };
  },

  "fractional_boundary": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(3, 9);
    const b = rng.randInt(1, 15);
    const c = rng.randInt(1, 20);
    const numerator = c - b;
    const g = gcd(Math.abs(numerator), a);
    const simpNum = numerator / g;
    const simpDen = a / g;
    if (simpDen === 1 || simpDen > 10) return HARD_ARCHETYPES["neg_coeff_plus_b"](rng);
    const params = { a, b, c, simpNum, simpDen, sign };
    return {
      id: makeId("hard", "fractional_boundary", params),
      topic: "inequalities", difficulty: "hard", archetype: "fractional_boundary",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}`,
      answer: `x ${sign} ${simpNum}/${simpDen}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x ${sign} ${c} − ${b} = ${numerator}`,
        `Divide by ${a}: x ${sign} ${numerator}/${a}`,
        g > 1 ? `Simplify: x ${sign} ${simpNum}/${simpDen}` : `Already in simplest form`
      ],
      metadata: { params, skills: ["balance_terms", "simplify_fractions"], estimated_time_sec: 55 }
    };
  },

  "neg_coeff_both_sides": (rng) => {
    const sign = rng.pick(SIGNS);
    const x_boundary = rng.randInt(1, 8);
    const a = rng.randInt(2, 6);
    const c = rng.randInt(a + 1, a + 6);
    const b = rng.randInt(1, 10);
    const d = b + (a - c) * x_boundary;
    const flipped = flipSign(sign);
    if (d >= b) return HARD_ARCHETYPES["neg_coeff_simple"](rng);
    const diff = a - c;
    const params = { a, b, c, d, x_boundary, sign };
    return {
      id: makeId("hard", "neg_coeff_both_sides", params),
      topic: "inequalities", difficulty: "hard", archetype: "neg_coeff_both_sides",
      prompt: `Solve: ${a}x + ${b} ${sign} ${c}x + ${d}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Subtract ${c}x from both sides: ${diff}x + ${b} ${sign} ${d}`,
        `Subtract ${b}: ${diff}x ${sign} ${d - b}`,
        `Divide by ${diff} (negative, FLIP the sign): x ${flipped} ${x_boundary}`
      ],
      metadata: { params, skills: ["collect_like_terms", "flip_inequality_sign", "isolate_variable"], estimated_time_sec: 55 }
    };
  },

  "neg_bracket_subtract": (rng) => {
    const sign = rng.pick(SIGNS);
    const a = rng.randInt(2, 6);
    const x_boundary = rng.randInt(2, 10);
    const b = rng.randInt(1, x_boundary - 1);
    const c = -a * (x_boundary - b);
    const flipped = flipSign(sign);
    const params = { a, b, c: Math.abs(c), x_boundary, sign };
    return {
      id: makeId("hard", "neg_bracket_subtract", params),
      topic: "inequalities", difficulty: "hard", archetype: "neg_bracket_subtract",
      prompt: `Solve: −${a}(x − ${b}) ${sign} ${c}`,
      answer: `x ${flipped} ${x_boundary}`,
      worked_solution: [
        `Expand: −${a}x + ${a * b} ${sign} ${c}`,
        `Subtract ${a * b}: −${a}x ${sign} ${c} − ${a * b} = ${c - a * b}`,
        `Divide by −${a} and FLIP the sign: x ${flipped} ${x_boundary}`
      ],
      metadata: { params, skills: ["expand_brackets", "flip_inequality_sign", "balance_terms"], estimated_time_sec: 55 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "at_least_score": (rng) => {
    const numTests = rng.randInt(3, 6);
    const scores = Array.from({ length: numTests - 1 }, () => rng.randInt(50, 95));
    const target = rng.randInt(65, 85);
    const sumSoFar = scores.reduce((a, b) => a + b, 0);
    const needed = target * numTests - sumSoFar;
    const scoresStr = scores.join(", ");
    const params = { numTests, scores: scoresStr, target, needed };
    return {
      id: makeId("challenge", "at_least_score", params),
      topic: "inequalities", difficulty: "challenge", archetype: "at_least_score",
      prompt: `A student has scored ${scoresStr} on their first ${numTests - 1} tests. What score must they get on the last test to have an average of at least ${target}?`,
      answer: `x ≥ ${needed}`,
      worked_solution: [
        `Let the last score = x.`,
        `Average ≥ ${target}: (${scoresStr} + x) ÷ ${numTests} ≥ ${target}`,
        `Multiply both sides by ${numTests}: ${sumSoFar} + x ≥ ${target * numTests}`,
        `Subtract ${sumSoFar}: x ≥ ${target * numTests} − ${sumSoFar} = ${needed}`,
        `This means the student must score at least ${needed}.`
      ],
      metadata: { params, skills: ["model_word_problem", "average_inequality", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "no_more_than_budget": (rng) => {
    const fixedCost = rng.randInt(20, 80);
    const perItem = rng.randInt(3, 15);
    const budget = rng.randInt(100, 300);
    const maxItems = Math.floor((budget - fixedCost) / perItem);
    const params = { fixedCost, perItem, budget, maxItems };
    return {
      id: makeId("challenge", "no_more_than_budget", params),
      topic: "inequalities", difficulty: "challenge", archetype: "no_more_than_budget",
      prompt: `A party has a fixed venue cost of $${fixedCost}, plus $${perItem} per guest. The total budget is no more than $${budget}. What is the maximum number of guests?`,
      answer: `n ≤ ${maxItems} (maximum ${maxItems} guests)`,
      worked_solution: [
        `Let n = number of guests.`,
        `Total cost: ${fixedCost} + ${perItem}n ≤ ${budget}`,
        `Subtract ${fixedCost}: ${perItem}n ≤ ${budget} − ${fixedCost} = ${budget - fixedCost}`,
        `Divide by ${perItem}: n ≤ ${(budget - fixedCost) / perItem}`,
        Number.isInteger((budget - fixedCost) / perItem)
          ? `n ≤ ${maxItems}`
          : `Since n must be a whole number: n ≤ ${maxItems}`,
        `This means no more than ${maxItems} guests can attend.`
      ],
      metadata: { params, skills: ["model_word_problem", "budget_constraint", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "budget_cap_items": (rng) => {
    const priceA = rng.randInt(5, 15);
    const priceB = rng.randInt(2, priceA - 1);
    const numA = rng.randInt(2, 5);
    const budget = rng.randInt(50, 150);
    const remaining = budget - priceA * numA;
    const maxB = Math.floor(remaining / priceB);
    if (remaining <= 0) return CHALLENGE_ARCHETYPES["no_more_than_budget"](rng);
    const params = { priceA, priceB, numA, budget, maxB };
    return {
      id: makeId("challenge", "budget_cap_items", params),
      topic: "inequalities", difficulty: "challenge", archetype: "budget_cap_items",
      prompt: `A student buys ${numA} notebooks at $${priceA} each and some pens at $${priceB} each. They have $${budget} to spend. What is the maximum number of pens they can buy?`,
      answer: `p ≤ ${maxB} (maximum ${maxB} pens)`,
      worked_solution: [
        `Let p = number of pens.`,
        `Total cost: ${priceA} × ${numA} + ${priceB}p ≤ ${budget}`,
        `${priceA * numA} + ${priceB}p ≤ ${budget}`,
        `Subtract ${priceA * numA}: ${priceB}p ≤ ${remaining}`,
        `Divide by ${priceB}: p ≤ ${remaining / priceB}`,
        Number.isInteger(remaining / priceB)
          ? `p ≤ ${maxB}`
          : `Since p must be a whole number: p ≤ ${maxB}`,
        `This means a maximum of ${maxB} pens.`
      ],
      metadata: { params, skills: ["model_word_problem", "budget_constraint", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "minimum_eligibility": (rng) => {
    const hoursPerWeek = rng.randInt(2, 8);
    const weeksCompleted = rng.randInt(3, 8);
    const totalRequired = rng.randInt(40, 80);
    const hoursDone = hoursPerWeek * weeksCompleted;
    const weeksLeft = Math.ceil((totalRequired - hoursDone) / hoursPerWeek);
    if (hoursDone >= totalRequired) return CHALLENGE_ARCHETYPES["at_least_score"](rng);
    const params = { hoursPerWeek, weeksCompleted, totalRequired, hoursDone, weeksLeft };
    return {
      id: makeId("challenge", "minimum_eligibility", params),
      topic: "inequalities", difficulty: "challenge", archetype: "minimum_eligibility",
      prompt: `A volunteer has worked ${hoursPerWeek} hours per week for ${weeksCompleted} weeks. They need at least ${totalRequired} hours total to earn a certificate. How many more weeks must they volunteer?`,
      answer: `w ≥ ${weeksLeft}`,
      worked_solution: [
        `Hours completed: ${hoursPerWeek} × ${weeksCompleted} = ${hoursDone}`,
        `Let w = additional weeks needed.`,
        `Total hours: ${hoursDone} + ${hoursPerWeek}w ≥ ${totalRequired}`,
        `Subtract ${hoursDone}: ${hoursPerWeek}w ≥ ${totalRequired - hoursDone}`,
        `Divide by ${hoursPerWeek}: w ≥ ${(totalRequired - hoursDone) / hoursPerWeek}`,
        Number.isInteger((totalRequired - hoursDone) / hoursPerWeek)
          ? `w ≥ ${weeksLeft}`
          : `Since w must be a whole number: w ≥ ${weeksLeft}`,
        `This means at least ${weeksLeft} more weeks.`
      ],
      metadata: { params, skills: ["model_word_problem", "minimum_requirement", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "speed_limit": (rng) => {
    const distance = rng.randInt(100, 500);
    const maxTime = rng.randInt(2, 8);
    const minSpeed = Math.ceil(distance / maxTime);
    const params = { distance, maxTime, minSpeed };
    return {
      id: makeId("challenge", "speed_limit", params),
      topic: "inequalities", difficulty: "challenge", archetype: "speed_limit",
      prompt: `A delivery driver must travel ${distance} km in no more than ${maxTime} hours. What is the minimum average speed required?`,
      answer: `s ≥ ${minSpeed} km/h`,
      worked_solution: [
        `Distance = speed × time.`,
        `Need: s × ${maxTime} ≥ ${distance}`,
        `Divide by ${maxTime}: s ≥ ${distance} ÷ ${maxTime}`,
        Number.isInteger(distance / maxTime)
          ? `s ≥ ${minSpeed} km/h`
          : `s ≥ ${(distance / maxTime).toFixed(1)}, so s ≥ ${minSpeed} km/h (rounding up)`,
        `This means the driver must average at least ${minSpeed} km/h.`
      ],
      metadata: { params, skills: ["model_word_problem", "distance_speed_time", "balance_terms"], estimated_time_sec: 75 }
    };
  },

  "savings_goal": (rng) => {
    const initial = rng.randInt(50, 200);
    const perWeek = rng.randInt(10, 40);
    const goal = rng.randInt(300, 800);
    const weeksNeeded = Math.ceil((goal - initial) / perWeek);
    const params = { initial, perWeek, goal, weeksNeeded };
    return {
      id: makeId("challenge", "savings_goal", params),
      topic: "inequalities", difficulty: "challenge", archetype: "savings_goal",
      prompt: `A student has $${initial} saved and earns $${perWeek} per week. How many weeks until they have at least $${goal}?`,
      answer: `w ≥ ${weeksNeeded}`,
      worked_solution: [
        `Let w = number of weeks.`,
        `Total savings: ${initial} + ${perWeek}w ≥ ${goal}`,
        `Subtract ${initial}: ${perWeek}w ≥ ${goal} − ${initial} = ${goal - initial}`,
        `Divide by ${perWeek}: w ≥ ${(goal - initial) / perWeek}`,
        Number.isInteger((goal - initial) / perWeek)
          ? `w ≥ ${weeksNeeded}`
          : `Since w must be a whole number: w ≥ ${weeksNeeded}`,
        `This means at least ${weeksNeeded} weeks of saving.`
      ],
      metadata: { params, skills: ["model_word_problem", "savings_goal", "balance_terms"], estimated_time_sec: 75 }
    };
  },

  "height_requirement": (rng) => {
    const minHeight = rng.randInt(120, 150);
    const currentHeight = rng.randInt(100, minHeight - 5);
    const growthPerYear = rng.randInt(4, 8);
    const yearsNeeded = Math.ceil((minHeight - currentHeight) / growthPerYear);
    const params = { minHeight, currentHeight, growthPerYear, yearsNeeded };
    return {
      id: makeId("challenge", "height_requirement", params),
      topic: "inequalities", difficulty: "challenge", archetype: "height_requirement",
      prompt: `A child is currently ${currentHeight} cm tall and grows approximately ${growthPerYear} cm per year. A ride requires a minimum height of ${minHeight} cm. In how many years will they be tall enough?`,
      answer: `y ≥ ${yearsNeeded}`,
      worked_solution: [
        `Let y = number of years.`,
        `Height after y years: ${currentHeight} + ${growthPerYear}y ≥ ${minHeight}`,
        `Subtract ${currentHeight}: ${growthPerYear}y ≥ ${minHeight} − ${currentHeight} = ${minHeight - currentHeight}`,
        `Divide by ${growthPerYear}: y ≥ ${(minHeight - currentHeight) / growthPerYear}`,
        Number.isInteger((minHeight - currentHeight) / growthPerYear)
          ? `y ≥ ${yearsNeeded}`
          : `Since y must be a whole number: y ≥ ${yearsNeeded}`,
        `This means at least ${yearsNeeded} years.`
      ],
      metadata: { params, skills: ["model_word_problem", "growth_model", "balance_terms"], estimated_time_sec: 75 }
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
