import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "linear_equations";
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

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "ax_plus_b_eq_c_pos": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 20);
    const c = a * x + b;
    const params = { a, b, c, x };
    return {
      id: makeId("easy", "ax_plus_b_eq_c_pos", params),
      topic: "linear_equations", difficulty: "easy", archetype: "ax_plus_b_eq_c_pos",
      prompt: `Solve: ${a}x + ${b} = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x = ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a}: x = ${c - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },

  "ax_minus_b_eq_c": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = a * x - b;
    if (c < 0) return EASY_ARCHETYPES["ax_plus_b_eq_c_pos"](rng);
    const params = { a, b, c, x };
    return {
      id: makeId("easy", "ax_minus_b_eq_c", params),
      topic: "linear_equations", difficulty: "easy", archetype: "ax_minus_b_eq_c",
      prompt: `Solve: ${a}x − ${b} = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Add ${b} to both sides: ${a}x = ${c} + ${b} = ${c + b}`,
        `Divide both sides by ${a}: x = ${c + b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },

  "x_div_k_eq_m": (rng) => {
    const k = rng.randInt(2, 9);
    const m = rng.randInt(1, 10);
    const x = k * m;
    const params = { k, m, x };
    return {
      id: makeId("easy", "x_div_k_eq_m", params),
      topic: "linear_equations", difficulty: "easy", archetype: "x_div_k_eq_m",
      prompt: `Solve: x ÷ ${k} = ${m}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Multiply both sides by ${k}: x = ${m} × ${k} = ${x}`
      ],
      metadata: { params, skills: ["isolate_variable"], estimated_time_sec: 20 }
    };
  },

  "b_plus_ax_eq_c": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = b + a * x;
    const params = { a, b, c, x };
    return {
      id: makeId("easy", "b_plus_ax_eq_c", params),
      topic: "linear_equations", difficulty: "easy", archetype: "b_plus_ax_eq_c",
      prompt: `Solve: ${b} + ${a}x = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x = ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a}: x = ${c - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },

  "c_eq_ax_plus_b": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = a * x + b;
    const params = { a, b, c, x };
    return {
      id: makeId("easy", "c_eq_ax_plus_b", params),
      topic: "linear_equations", difficulty: "easy", archetype: "c_eq_ax_plus_b",
      prompt: `Solve: ${c} = ${a}x + ${b}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${c} − ${b} = ${a}x → ${c - b} = ${a}x`,
        `Divide both sides by ${a}: x = ${c - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "isolate_variable"], estimated_time_sec: 30 }
    };
  },

  "ax_eq_c": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const c = a * x;
    const params = { a, c, x };
    return {
      id: makeId("easy", "ax_eq_c", params),
      topic: "linear_equations", difficulty: "easy", archetype: "ax_eq_c",
      prompt: `Solve: ${a}x = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Divide both sides by ${a}: x = ${c} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["isolate_variable"], estimated_time_sec: 15 }
    };
  },

  "x_plus_b_eq_c": (rng) => {
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 20);
    const c = x + b;
    const params = { b, c, x };
    return {
      id: makeId("easy", "x_plus_b_eq_c", params),
      topic: "linear_equations", difficulty: "easy", archetype: "x_plus_b_eq_c",
      prompt: `Solve: x + ${b} = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${b} from both sides: x = ${c} − ${b} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms"], estimated_time_sec: 15 }
    };
  },

  "x_minus_b_eq_c": (rng) => {
    const x = rng.randInt(2, 10);
    const b = rng.randInt(1, x - 1);
    const c = x - b;
    const params = { b, c, x };
    return {
      id: makeId("easy", "x_minus_b_eq_c", params),
      topic: "linear_equations", difficulty: "easy", archetype: "x_minus_b_eq_c",
      prompt: `Solve: x − ${b} = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Add ${b} to both sides: x = ${c} + ${b} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "vars_both_sides_pos": (rng) => {
    const x = rng.randInt(1, 10);
    const a = rng.randInt(3, 9);
    let c = rng.randInt(2, a - 1);
    if (c === a) c = a - 1;
    const b = rng.randInt(1, 15);
    const d = (a - c) * x + b;
    const params = { a, b, c, d, x };
    return {
      id: makeId("medium", "vars_both_sides_pos", params),
      topic: "linear_equations", difficulty: "medium", archetype: "vars_both_sides_pos",
      prompt: `Solve: ${a}x + ${b} = ${c}x + ${d}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${c}x from both sides: ${a - c}x + ${b} = ${d}`,
        `Subtract ${b} from both sides: ${a - c}x = ${d} − ${b} = ${d - b}`,
        `Divide both sides by ${a - c}: x = ${d - b} ÷ ${a - c} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "collect_like_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "vars_both_sides_neg": (rng) => {
    const x = rng.randInt(-10, -1);
    const a = rng.randInt(3, 9);
    let c = rng.randInt(2, a - 1);
    if (c === a) c = a - 1;
    const d = rng.randInt(1, 15);
    const b = (a - c) * x + d;
    if (b <= 0) return MEDIUM_ARCHETYPES["vars_both_sides_pos"](rng);
    const params = { a, b, c, d, x };
    const diff = a - c;
    const rhs = d - b;
    return {
      id: makeId("medium", "vars_both_sides_neg", params),
      topic: "linear_equations", difficulty: "medium", archetype: "vars_both_sides_neg",
      prompt: `Solve: ${a}x + ${b} = ${c}x + ${d}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${c}x from both sides: ${diff}x + ${b} = ${d}`,
        `Subtract ${b} from both sides: ${diff}x = ${d} − ${b} = ${rhs}`,
        `Divide both sides by ${diff}: x = ${rhs} ÷ ${diff} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "collect_like_terms", "negative_solutions"], estimated_time_sec: 50 }
    };
  },

  "single_bracket_pos": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = a * (x + b);
    const params = { a, b, c, x };
    return {
      id: makeId("medium", "single_bracket_pos", params),
      topic: "linear_equations", difficulty: "medium", archetype: "single_bracket_pos",
      prompt: `Solve: ${a}(x + ${b}) = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Expand: ${a}x + ${a * b} = ${c}`,
        `Subtract ${a * b} from both sides: ${a}x = ${c} − ${a * b} = ${c - a * b}`,
        `Divide both sides by ${a}: x = ${c - a * b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "single_bracket_neg_const": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const c = a * (x - b);
    if (c <= 0) return MEDIUM_ARCHETYPES["single_bracket_pos"](rng);
    const params = { a, b, c, x };
    return {
      id: makeId("medium", "single_bracket_neg_const", params),
      topic: "linear_equations", difficulty: "medium", archetype: "single_bracket_neg_const",
      prompt: `Solve: ${a}(x − ${b}) = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Expand: ${a}x − ${a * b} = ${c}`,
        `Add ${a * b} to both sides: ${a}x = ${c} + ${a * b} = ${c + a * b}`,
        `Divide both sides by ${a}: x = ${c + a * b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "bracket_with_coeff_x": (rng) => {
    const a = rng.randInt(2, 5);
    const bCoeff = rng.randInt(2, 4);
    const x = rng.randInt(1, 8);
    const bConst = rng.randInt(1, 10);
    const c = a * (bCoeff * x + bConst);
    const params = { a, bCoeff, bConst, c, x };
    return {
      id: makeId("medium", "bracket_with_coeff_x", params),
      topic: "linear_equations", difficulty: "medium", archetype: "bracket_with_coeff_x",
      prompt: `Solve: ${a}(${bCoeff}x + ${bConst}) = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Expand: ${a * bCoeff}x + ${a * bConst} = ${c}`,
        `Subtract ${a * bConst} from both sides: ${a * bCoeff}x = ${c - a * bConst}`,
        `Divide both sides by ${a * bCoeff}: x = ${c - a * bConst} ÷ ${a * bCoeff} = ${x}`
      ],
      metadata: { params, skills: ["expand_brackets", "balance_terms", "isolate_variable"], estimated_time_sec: 50 }
    };
  },

  "ax_plus_b_eq_cx_minus_d": (rng) => {
    const x = rng.randInt(1, 10);
    const a = rng.randInt(4, 9);
    let c = rng.randInt(2, a - 1);
    if (c === a) c = a - 1;
    const b = rng.randInt(1, 10);
    const d = rng.randInt(1, 10);
    const lhs = a * x + b;
    const rhs = c * x - d;
    if (lhs !== rhs) {
      const needed_d = c * x - (a * x + b);
      if (needed_d >= -20 && needed_d !== 0) {
        const diff = a - c;
        const nd = -(b + needed_d);
        if (nd > 0) {
          const params2 = { a, b, c, d: nd, x };
          return {
            id: makeId("medium", "ax_plus_b_eq_cx_minus_d", params2),
            topic: "linear_equations" as const, difficulty: "medium" as const,
            archetype: "ax_plus_b_eq_cx_minus_d",
            prompt: `Solve: ${a}x + ${b} = ${c}x − ${nd}`,
            answer: `x = ${x}`,
            worked_solution: [
              `Subtract ${c}x from both sides: ${diff}x + ${b} = −${nd}`,
              `Subtract ${b} from both sides: ${diff}x = −${nd} − ${b} = ${-nd - b}`,
              `Divide both sides by ${diff}: x = ${-nd - b} ÷ ${diff} = ${x}`
            ],
            metadata: { params: params2, skills: ["balance_terms", "collect_like_terms", "negative_values"], estimated_time_sec: 50 }
          };
        }
      }
    }
    return MEDIUM_ARCHETYPES["vars_both_sides_pos"](rng);
  },

  "neg_coeff_bracket": (rng) => {
    const a = rng.randInt(2, 6);
    const x = rng.randInt(1, 8);
    const b = rng.randInt(1, 10);
    const c = -a * (x + b);
    const params = { a, b, c: Math.abs(c), x };
    return {
      id: makeId("medium", "neg_coeff_bracket", params),
      topic: "linear_equations", difficulty: "medium", archetype: "neg_coeff_bracket",
      prompt: `Solve: −${a}(x + ${b}) = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Expand: −${a}x − ${a * b} = ${c}`,
        `Add ${a * b} to both sides: −${a}x = ${c} + ${a * b} = ${c + a * b}`,
        `Divide both sides by −${a}: x = ${c + a * b} ÷ (−${a}) = ${x}`
      ],
      metadata: { params, skills: ["expand_brackets", "negative_coefficients", "isolate_variable"], estimated_time_sec: 50 }
    };
  },

  "two_step_subtract_divide": (rng) => {
    const a = rng.randInt(2, 9);
    const x = rng.randInt(-10, -1);
    const b = rng.randInt(1, 20);
    const c = a * x + b;
    if (c >= 0) return MEDIUM_ARCHETYPES["vars_both_sides_neg"](rng);
    const params = { a, b, c, x };
    return {
      id: makeId("medium", "two_step_subtract_divide", params),
      topic: "linear_equations", difficulty: "medium", archetype: "two_step_subtract_divide",
      prompt: `Solve: ${a}x + ${b} = ${c}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x = ${c} − ${b} = ${c - b}`,
        `Divide both sides by ${a}: x = ${c - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["balance_terms", "negative_solutions", "isolate_variable"], estimated_time_sec: 40 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "fraction_eq_simple": (rng) => {
    const a = rng.randInt(2, 6);
    const k = rng.randInt(2, 8);
    const x = rng.randInt(1, 10);
    const b = rng.randInt(1, 15);
    const m = (a * x + b) / k;
    if (!Number.isInteger(m)) {
      const newX = rng.randInt(1, 10);
      const newB = k * rng.randInt(1, 5) - a * newX;
      if (newB > 0 && newB <= 20) {
        const nm = (a * newX + newB) / k;
        if (Number.isInteger(nm)) {
          const params = { a, b: newB, k, m: nm, x: newX };
          return {
            id: makeId("hard", "fraction_eq_simple", params),
            topic: "linear_equations" as const, difficulty: "hard" as const, archetype: "fraction_eq_simple",
            prompt: `Solve: (${a}x + ${newB}) ÷ ${k} = ${nm}`,
            answer: `x = ${newX}`,
            worked_solution: [
              `Multiply both sides by ${k}: ${a}x + ${newB} = ${nm * k}`,
              `Subtract ${newB} from both sides: ${a}x = ${nm * k - newB}`,
              `Divide both sides by ${a}: x = ${nm * k - newB} ÷ ${a} = ${newX}`
            ],
            metadata: { params, skills: ["clear_fractions", "balance_terms", "isolate_variable"], estimated_time_sec: 60 }
          };
        }
      }
      return HARD_ARCHETYPES["fraction_eq_simple_v2"](rng);
    }
    const params = { a, b, k, m, x };
    return {
      id: makeId("hard", "fraction_eq_simple", params),
      topic: "linear_equations", difficulty: "hard", archetype: "fraction_eq_simple",
      prompt: `Solve: (${a}x + ${b}) ÷ ${k} = ${m}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Multiply both sides by ${k}: ${a}x + ${b} = ${m * k}`,
        `Subtract ${b} from both sides: ${a}x = ${m * k - b}`,
        `Divide both sides by ${a}: x = ${m * k - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["clear_fractions", "balance_terms", "isolate_variable"], estimated_time_sec: 60 }
    };
  },

  "fraction_eq_simple_v2": (rng) => {
    const k = rng.randInt(2, 6);
    const m = rng.randInt(1, 8);
    const x = k * m;
    const b = rng.randInt(1, 10);
    const params = { k, m, b, x };
    return {
      id: makeId("hard", "fraction_eq_simple_v2", params),
      topic: "linear_equations", difficulty: "hard", archetype: "fraction_eq_simple_v2",
      prompt: `Solve: (x + ${b}) ÷ ${k} = ${m + Math.floor(b / k)}`,
      answer: `x = ${k * (m + Math.floor(b / k)) - b}`,
      worked_solution: [
        `Multiply both sides by ${k}: x + ${b} = ${k * (m + Math.floor(b / k))}`,
        `Subtract ${b}: x = ${k * (m + Math.floor(b / k)) - b}`
      ],
      metadata: { params, skills: ["clear_fractions", "balance_terms"], estimated_time_sec: 50 }
    };
  },

  "cross_multiply": (rng) => {
    const x = rng.randInt(1, 8);
    const a = rng.randInt(2, 5);
    const k = rng.randInt(2, 6);
    const t = rng.randInt(2, 6);
    const b = rng.randInt(1, 10);
    const lhsNum = a * x + b;
    const rhsOverT = lhsNum * t / k;
    if (!Number.isInteger(rhsOverT)) return HARD_ARCHETYPES["fraction_eq_simple"](rng);
    const c = 1;
    const d = Math.round(rhsOverT) - c * x;
    if (d <= 0 || d > 20) return HARD_ARCHETYPES["fraction_eq_simple"](rng);
    const params = { a, b, k, c, d, t, x };
    return {
      id: makeId("hard", "cross_multiply", params),
      topic: "linear_equations", difficulty: "hard", archetype: "cross_multiply",
      prompt: `Solve: (${a}x + ${b}) ÷ ${k} = (x + ${d}) ÷ ${t}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Cross multiply: ${t}(${a}x + ${b}) = ${k}(x + ${d})`,
        `Expand: ${t * a}x + ${t * b} = ${k}x + ${k * d}`,
        `Collect x terms: ${t * a - k}x = ${k * d - t * b}`,
        `Divide: x = ${k * d - t * b} ÷ ${t * a - k} = ${x}`
      ],
      metadata: { params, skills: ["cross_multiply", "expand_brackets", "collect_like_terms"], estimated_time_sec: 90 }
    };
  },

  "fraction_neg_answer": (rng) => {
    const a = rng.randInt(2, 6);
    const k = rng.randInt(2, 6);
    const x = rng.randInt(-8, -1);
    const targetProduct = a * x;
    const b = -targetProduct + k * rng.randInt(1, 5);
    const m = (a * x + b) / k;
    if (!Number.isInteger(m) || m <= 0) return HARD_ARCHETYPES["fraction_eq_simple"](rng);
    const params = { a, b, k, m, x };
    return {
      id: makeId("hard", "fraction_neg_answer", params),
      topic: "linear_equations", difficulty: "hard", archetype: "fraction_neg_answer",
      prompt: `Solve: (${a}x + ${b}) ÷ ${k} = ${m}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Multiply both sides by ${k}: ${a}x + ${b} = ${m * k}`,
        `Subtract ${b}: ${a}x = ${m * k} − ${b} = ${m * k - b}`,
        `Divide by ${a}: x = ${m * k - b} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["clear_fractions", "negative_solutions", "balance_terms"], estimated_time_sec: 60 }
    };
  },

  "bracket_both_sides": (rng) => {
    const x = rng.randInt(1, 8);
    const a = rng.randInt(2, 5);
    const c = rng.randInt(2, 5);
    const b = rng.randInt(1, 10);
    const d = rng.randInt(1, 10);
    const lhs = a * (x + b);
    const rhs = c * (x + d);
    if (lhs !== rhs || a === c) {
      const needed_d = (a * (x + b)) / c - x;
      if (!Number.isInteger(needed_d) || needed_d <= 0 || needed_d > 15) return HARD_ARCHETYPES["fraction_eq_simple"](rng);
      const params = { a, b, c, d: needed_d, x };
      return {
        id: makeId("hard", "bracket_both_sides", params),
        topic: "linear_equations", difficulty: "hard", archetype: "bracket_both_sides",
        prompt: `Solve: ${a}(x + ${b}) = ${c}(x + ${needed_d})`,
        answer: `x = ${x}`,
        worked_solution: [
          `Expand both sides: ${a}x + ${a * b} = ${c}x + ${c * needed_d}`,
          `Subtract ${c}x: ${a - c}x + ${a * b} = ${c * needed_d}`,
          `Subtract ${a * b}: ${a - c}x = ${c * needed_d - a * b}`,
          `Divide by ${a - c}: x = ${(c * needed_d - a * b) / (a - c)}`
        ],
        metadata: { params, skills: ["expand_brackets", "collect_like_terms", "isolate_variable"], estimated_time_sec: 75 }
      };
    }
    return HARD_ARCHETYPES["fraction_eq_simple"](rng);
  },

  "fraction_coeff_x": (rng) => {
    const a = rng.randInt(2, 5);
    const k = rng.randInt(2, 8);
    const x = rng.randInt(1, 10);
    const num = a * x;
    const m = num / k;
    if (!Number.isInteger(m)) {
      const newK = a;
      const newM = x;
      const params = { a, k: newK, m: newM, x };
      return {
        id: makeId("hard", "fraction_coeff_x", params),
        topic: "linear_equations", difficulty: "hard", archetype: "fraction_coeff_x",
        prompt: `Solve: ${a}x ÷ ${newK} = ${newM}`,
        answer: `x = ${x}`,
        worked_solution: [
          `Multiply both sides by ${newK}: ${a}x = ${newM * newK}`,
          `Divide by ${a}: x = ${newM * newK} ÷ ${a} = ${x}`
        ],
        metadata: { params, skills: ["clear_fractions", "isolate_variable"], estimated_time_sec: 45 }
      };
    }
    const params = { a, k, m, x };
    return {
      id: makeId("hard", "fraction_coeff_x", params),
      topic: "linear_equations", difficulty: "hard", archetype: "fraction_coeff_x",
      prompt: `Solve: ${a}x ÷ ${k} = ${m}`,
      answer: `x = ${x}`,
      worked_solution: [
        `Multiply both sides by ${k}: ${a}x = ${m * k}`,
        `Divide by ${a}: x = ${m * k} ÷ ${a} = ${x}`
      ],
      metadata: { params, skills: ["clear_fractions", "isolate_variable"], estimated_time_sec: 45 }
    };
  },

  "fractional_answer": (rng) => {
    const a = rng.randInt(3, 9);
    const b = rng.randInt(1, 15);
    const c = rng.randInt(1, 20);
    const numerator = c - b;
    const g = gcd(Math.abs(numerator), a);
    const simpNum = numerator / g;
    const simpDen = a / g;
    if (simpDen === 1 || simpDen > 10) return HARD_ARCHETYPES["fraction_eq_simple"](rng);
    const params = { a, b, c, simpNum, simpDen };
    return {
      id: makeId("hard", "fractional_answer", params),
      topic: "linear_equations", difficulty: "hard", archetype: "fractional_answer",
      prompt: `Solve: ${a}x + ${b} = ${c}`,
      answer: `x = ${simpNum}/${simpDen}`,
      worked_solution: [
        `Subtract ${b} from both sides: ${a}x = ${c} − ${b} = ${numerator}`,
        `Divide by ${a}: x = ${numerator}/${a}`,
        g > 1 ? `Simplify: x = ${simpNum}/${simpDen}` : `Already in simplest form`
      ],
      metadata: { params, skills: ["balance_terms", "simplify_fractions"], estimated_time_sec: 55 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "perimeter_rectangle": (rng) => {
    const w = rng.randInt(3, 12);
    const p = rng.randInt(1, 8);
    const length = 2 * w + p;
    const perimeter = 2 * (length + w);
    const params = { w, p, perimeter };
    return {
      id: makeId("challenge", "perimeter_rectangle", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "perimeter_rectangle",
      prompt: `A rectangle has a width of w cm. Its length is ${p} cm more than twice its width. If the perimeter is ${perimeter} cm, find the width.`,
      answer: `w = ${w}`,
      worked_solution: [
        `Let width = w. Then length = 2w + ${p}.`,
        `Perimeter = 2(length + width) = 2(2w + ${p} + w) = 2(3w + ${p}) = 6w + ${2 * p}`,
        `Set up equation: 6w + ${2 * p} = ${perimeter}`,
        `Subtract ${2 * p}: 6w = ${perimeter - 2 * p}`,
        `Divide by 6: w = ${(perimeter - 2 * p) / 6} = ${w}`
      ],
      metadata: { params, skills: ["model_word_problem", "perimeter_formula", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "consecutive_integers": (rng) => {
    const n = rng.randInt(5, 25);
    const sum = 3 * n + 3;
    const params = { n, sum };
    return {
      id: makeId("challenge", "consecutive_integers", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "consecutive_integers",
      prompt: `Three consecutive integers have a sum of ${sum}. Find the smallest integer.`,
      answer: `n = ${n}`,
      worked_solution: [
        `Let the smallest integer be n.`,
        `The three consecutive integers are n, n + 1, and n + 2.`,
        `Their sum: n + (n + 1) + (n + 2) = ${sum}`,
        `Simplify: 3n + 3 = ${sum}`,
        `Subtract 3: 3n = ${sum - 3}`,
        `Divide by 3: n = ${(sum - 3) / 3} = ${n}`
      ],
      metadata: { params, skills: ["model_word_problem", "consecutive_integers", "balance_terms"], estimated_time_sec: 75 }
    };
  },

  "taxi_fare": (rng) => {
    const flagFall = rng.randInt(3, 8);
    const perKm = rng.randInt(2, 5);
    const km = rng.randInt(5, 20);
    const totalFare = flagFall + perKm * km;
    const params = { flagFall, perKm, km, totalFare };
    return {
      id: makeId("challenge", "taxi_fare", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "taxi_fare",
      prompt: `A taxi charges a $${flagFall} flag fall plus $${perKm} per kilometre. If the total fare was $${totalFare}, how many kilometres was the trip?`,
      answer: `${km} km`,
      worked_solution: [
        `Let distance = d km.`,
        `Total fare = ${flagFall} + ${perKm}d`,
        `Set up equation: ${flagFall} + ${perKm}d = ${totalFare}`,
        `Subtract ${flagFall}: ${perKm}d = ${totalFare - flagFall}`,
        `Divide by ${perKm}: d = ${(totalFare - flagFall) / perKm} = ${km}`
      ],
      metadata: { params, skills: ["model_word_problem", "linear_cost_model", "balance_terms"], estimated_time_sec: 75 }
    };
  },

  "percentage_increase": (rng) => {
    const percent = rng.pick([10, 15, 20, 25, 30, 40, 50]);
    const original = rng.randInt(20, 200);
    const finalPrice = original + Math.round(original * percent / 100);
    if (finalPrice !== original * (100 + percent) / 100) {
      const safeOriginal = rng.randInt(2, 20) * (100 / gcd(percent, 100));
      const safeFinal = safeOriginal * (100 + percent) / 100;
      if (Number.isInteger(safeFinal) && safeOriginal <= 500) {
        const params = { percent, original: safeOriginal, finalPrice: safeFinal };
        return {
          id: makeId("challenge", "percentage_increase", params),
          topic: "linear_equations" as const, difficulty: "challenge" as const, archetype: "percentage_increase",
          prompt: `After a ${percent}% increase, a price becomes $${safeFinal}. What was the original price?`,
          answer: `$${safeOriginal}`,
          worked_solution: [
            `Let original price = p.`,
            `After ${percent}% increase: p × ${(100 + percent) / 100} = ${safeFinal}`,
            `So ${(100 + percent) / 100}p = ${safeFinal}`,
            `Divide both sides by ${(100 + percent) / 100}: p = ${safeFinal} ÷ ${(100 + percent) / 100} = ${safeOriginal}`
          ],
          metadata: { params, skills: ["model_word_problem", "percentage_reverse", "balance_terms"], estimated_time_sec: 90 }
        };
      }
    }
    const params = { percent, original, finalPrice };
    return {
      id: makeId("challenge", "percentage_increase", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "percentage_increase",
      prompt: `After a ${percent}% increase, a price becomes $${finalPrice}. What was the original price?`,
      answer: `$${original}`,
      worked_solution: [
        `Let original price = p.`,
        `After ${percent}% increase: p + ${percent / 100}p = ${finalPrice}`,
        `Factor: ${(100 + percent) / 100}p = ${finalPrice}`,
        `Divide: p = ${finalPrice} ÷ ${(100 + percent) / 100} = ${original}`
      ],
      metadata: { params, skills: ["model_word_problem", "percentage_reverse", "balance_terms"], estimated_time_sec: 90 }
    };
  },

  "age_problem": (rng) => {
    const childAge = rng.randInt(5, 15);
    const multiplier = rng.randInt(2, 4);
    const yearsAgo = rng.randInt(2, 6);
    const parentAge = multiplier * (childAge - yearsAgo) + yearsAgo;
    const params = { childAge, multiplier, yearsAgo, parentAge };
    return {
      id: makeId("challenge", "age_problem", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "age_problem",
      prompt: `A parent is ${parentAge} years old. ${yearsAgo} years ago, the parent was ${multiplier} times as old as their child. How old is the child now?`,
      answer: `${childAge} years old`,
      worked_solution: [
        `Let child's current age = c.`,
        `${yearsAgo} years ago: child was (c − ${yearsAgo}), parent was (${parentAge} − ${yearsAgo}) = ${parentAge - yearsAgo}`,
        `Set up equation: ${parentAge - yearsAgo} = ${multiplier}(c − ${yearsAgo})`,
        `Expand: ${parentAge - yearsAgo} = ${multiplier}c − ${multiplier * yearsAgo}`,
        `Add ${multiplier * yearsAgo}: ${parentAge - yearsAgo + multiplier * yearsAgo} = ${multiplier}c`,
        `Divide by ${multiplier}: c = ${(parentAge - yearsAgo + multiplier * yearsAgo) / multiplier} = ${childAge}`
      ],
      metadata: { params, skills: ["model_word_problem", "age_relationships", "expand_brackets"], estimated_time_sec: 90 }
    };
  },

  "coins_problem": (rng) => {
    const numSmall = rng.randInt(3, 15);
    const numLarge = rng.randInt(2, 10);
    const smallVal = rng.pick([5, 10, 20]);
    const largeVal = rng.pick([50, 100, 200].filter(v => v > smallVal));
    const total = numSmall * smallVal + numLarge * largeVal;
    const totalCoins = numSmall + numLarge;
    const params = { numSmall, numLarge, smallVal, largeVal, total, totalCoins };
    return {
      id: makeId("challenge", "coins_problem", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "coins_problem",
      prompt: `A jar contains ${totalCoins} coins, made up of ${smallVal}-cent and ${largeVal}-cent coins. The total value is $${(total / 100).toFixed(2)}. How many ${smallVal}-cent coins are there?`,
      answer: `${numSmall}`,
      worked_solution: [
        `Let number of ${smallVal}c coins = n.`,
        `Then number of ${largeVal}c coins = ${totalCoins} − n.`,
        `Total value: ${smallVal}n + ${largeVal}(${totalCoins} − n) = ${total}`,
        `Expand: ${smallVal}n + ${largeVal * totalCoins} − ${largeVal}n = ${total}`,
        `Simplify: ${smallVal - largeVal}n + ${largeVal * totalCoins} = ${total}`,
        `${smallVal - largeVal}n = ${total - largeVal * totalCoins}`,
        `n = ${(total - largeVal * totalCoins) / (smallVal - largeVal)} = ${numSmall}`
      ],
      metadata: { params, skills: ["model_word_problem", "simultaneous_substitution", "balance_terms"], estimated_time_sec: 120 }
    };
  },

  "distance_speed_time": (rng) => {
    const speed = rng.randInt(40, 100);
    const hours = rng.randInt(2, 6);
    const extraDist = rng.randInt(10, 50);
    const totalDist = speed * hours + extraDist;
    const params = { speed, hours, extraDist, totalDist };
    return {
      id: makeId("challenge", "distance_speed_time", params),
      topic: "linear_equations", difficulty: "challenge", archetype: "distance_speed_time",
      prompt: `A car travels at a constant speed of s km/h. After ${hours} hours it has covered ${totalDist - extraDist} km. It then travels another ${extraDist} km. If the total distance is ${totalDist} km, find the speed s.`,
      answer: `s = ${speed} km/h`,
      worked_solution: [
        `Distance = speed × time, so distance in ${hours} hours = ${hours}s`,
        `Set up: ${hours}s = ${totalDist - extraDist}`,
        `Divide by ${hours}: s = ${(totalDist - extraDist) / hours} = ${speed} km/h`
      ],
      metadata: { params, skills: ["model_word_problem", "distance_speed_time", "isolate_variable"], estimated_time_sec: 75 }
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
