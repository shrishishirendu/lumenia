import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "perfect_and_difference_of_squares";
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

function signedTerm(coeff: number, variable: string, first: boolean): string {
  if (coeff === 0) return "";
  const abs = Math.abs(coeff);
  let term: string;
  if (variable === "") {
    term = `${abs}`;
  } else if (abs === 1) {
    term = variable;
  } else {
    term = `${abs}${variable}`;
  }
  if (first) {
    return coeff < 0 ? `-${term}` : term;
  }
  return coeff < 0 ? ` - ${term}` : ` + ${term}`;
}

function formatPoly(a: number, b: number, c: number): string {
  const parts: string[] = [];
  if (a !== 0) parts.push(signedTerm(a, "x^2", parts.length === 0));
  if (b !== 0) parts.push(signedTerm(b, "x", parts.length === 0));
  if (c !== 0) parts.push(signedTerm(c, "", parts.length === 0));
  if (parts.length === 0) return "0";
  return parts.join("");
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "square_plus_a": (rng) => {
    const a = rng.randInt(1, 5);
    const A = 1, B = 2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_plus_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_plus_a",
      prompt: `Expand (x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x + a)^2 = x^2 + 2ax + a^2`,
        `Substitute a = ${a}`,
        `= x^2 + 2(${a})x + ${a}^2`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_plus_b": (rng) => {
    const a = rng.randInt(4, 9);
    const A = 1, B = 2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_plus_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_plus_b",
      prompt: `Expand (x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x + a)^2 = x^2 + 2ax + a^2`,
        `Substitute a = ${a}`,
        `= x^2 + ${B}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_plus_c": (rng) => {
    const a = rng.randInt(2, 7);
    const A = 1, B = 2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_plus_c", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_plus_c",
      prompt: `Expand (x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x + ${a})^2 = (x + ${a})(x + ${a})`,
        `= x^2 + ${a}x + ${a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_plus_d": (rng) => {
    const a = rng.randInt(3, 8);
    const A = 1, B = 2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_plus_d", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_plus_d",
      prompt: `Expand (x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x + a)^2 = x^2 + 2ax + a^2`,
        `Here a = ${a}, so 2a = ${B} and a^2 = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 20 }
    };
  },

  "square_minus_a": (rng) => {
    const a = rng.randInt(1, 5);
    const A = 1, B = -2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_minus_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_minus_a",
      prompt: `Expand (x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x - a)^2 = x^2 - 2ax + a^2`,
        `Substitute a = ${a}`,
        `= x^2 - ${2 * a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_minus_b": (rng) => {
    const a = rng.randInt(4, 9);
    const A = 1, B = -2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_minus_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_minus_b",
      prompt: `Expand (x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x - a)^2 = x^2 - 2ax + a^2`,
        `Substitute a = ${a}`,
        `= x^2 - ${2 * a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_minus_c": (rng) => {
    const a = rng.randInt(2, 7);
    const A = 1, B = -2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_minus_c", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_minus_c",
      prompt: `Expand (x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x - ${a})^2 = (x - ${a})(x - ${a})`,
        `= x^2 - ${a}x - ${a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 25 }
    };
  },

  "square_minus_d": (rng) => {
    const a = rng.randInt(3, 8);
    const A = 1, B = -2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("easy", "square_minus_d", params),
      topic: "perfect_and_difference_of_squares", difficulty: "easy", archetype: "square_minus_d",
      prompt: `Expand (x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (x - a)^2 = x^2 - 2ax + a^2`,
        `Here a = ${a}, so 2a = ${2 * a} and a^2 = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets"], estimated_time_sec: 20 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "coef_square_plus_a": (rng) => {
    const m = rng.randInt(2, 4);
    const a = rng.randInt(1, 5);
    const A = m * m, B = 2 * m * a, C = a * a;
    const params = { m, a };
    return {
      id: makeId("medium", "coef_square_plus_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "coef_square_plus_a",
      prompt: `Expand (${m}x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (mx + a)^2 = m^2x^2 + 2max + a^2`,
        `(${m}x + ${a})^2 = (${m}x)^2 + 2(${m}x)(${a}) + ${a}^2`,
        `= ${A}x^2 + ${B}x + ${C}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "difference_of_squares", "collect_like_terms"], estimated_time_sec: 35 }
    };
  },

  "coef_square_plus_b": (rng) => {
    const m = rng.randInt(2, 5);
    const a = rng.randInt(1, 4);
    const A = m * m, B = 2 * m * a, C = a * a;
    const params = { m, a };
    return {
      id: makeId("medium", "coef_square_plus_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "coef_square_plus_b",
      prompt: `Expand (${m}x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(${m}x + ${a})^2 = (${m}x + ${a})(${m}x + ${a})`,
        `First: ${A}x^2, Middle: 2 × ${m}x × ${a} = ${B}x, Last: ${a}^2 = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "collect_like_terms"], estimated_time_sec: 35 }
    };
  },

  "coef_square_minus_a": (rng) => {
    const m = rng.randInt(2, 4);
    const a = rng.randInt(1, 5);
    const A = m * m, B = -2 * m * a, C = a * a;
    const params = { m, a };
    return {
      id: makeId("medium", "coef_square_minus_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "coef_square_minus_a",
      prompt: `Expand (${m}x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (mx - a)^2 = m^2x^2 - 2max + a^2`,
        `(${m}x - ${a})^2 = ${A}x^2 - 2(${m})(${a})x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "collect_like_terms"], estimated_time_sec: 35 }
    };
  },

  "diff_simple_a": (rng) => {
    const a = rng.randInt(1, 7);
    const C = -(a * a);
    const params = { a };
    return {
      id: makeId("medium", "diff_simple_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "diff_simple_a",
      prompt: `Expand (x + ${a})(x - ${a})`,
      answer: formatPoly(1, 0, C),
      worked_solution: [
        `Recognize difference of squares`,
        `(x + a)(x - a) = x^2 - a^2`,
        `= x^2 - ${a}^2`,
        `= ${formatPoly(1, 0, C)}`,
      ],
      metadata: { params, skills: ["difference_of_squares"], estimated_time_sec: 20 }
    };
  },

  "diff_simple_b": (rng) => {
    const a = rng.randInt(5, 12);
    const C = -(a * a);
    const params = { a };
    return {
      id: makeId("medium", "diff_simple_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "diff_simple_b",
      prompt: `Expand (x - ${a})(x + ${a})`,
      answer: formatPoly(1, 0, C),
      worked_solution: [
        `Recognize difference of squares`,
        `(x - a)(x + a) = x^2 - a^2`,
        `= x^2 - ${a * a}`,
        `= ${formatPoly(1, 0, C)}`,
      ],
      metadata: { params, skills: ["difference_of_squares"], estimated_time_sec: 20 }
    };
  },

  "diff_simple_c": (rng) => {
    const a = rng.randInt(2, 9);
    const C = -(a * a);
    const params = { a };
    return {
      id: makeId("medium", "diff_simple_c", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "diff_simple_c",
      prompt: `Expand (x + ${a})(x - ${a})`,
      answer: formatPoly(1, 0, C),
      worked_solution: [
        `This is a difference of squares: (x + a)(x - a) = x^2 - a^2`,
        `a = ${a}, so x^2 - ${a * a} = ${formatPoly(1, 0, C)}`,
      ],
      metadata: { params, skills: ["difference_of_squares"], estimated_time_sec: 20 }
    };
  },

  "square_expand_a": (rng) => {
    const a = rng.randInt(2, 8);
    const A = 1, B = 2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("medium", "square_expand_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "square_expand_a",
      prompt: `Expand and simplify (x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x + ${a})^2 = (x + ${a})(x + ${a})`,
        `= x^2 + ${a}x + ${a}x + ${C}`,
        `= x^2 + ${B}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "difference_of_squares", "collect_like_terms"], estimated_time_sec: 30 }
    };
  },

  "square_expand_b": (rng) => {
    const a = rng.randInt(2, 8);
    const A = 1, B = -2 * a, C = a * a;
    const params = { a };
    return {
      id: makeId("medium", "square_expand_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "medium", archetype: "square_expand_b",
      prompt: `Expand and simplify (x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x - ${a})^2 = (x - ${a})(x - ${a})`,
        `= x^2 - ${a}x - ${a}x + ${C}`,
        `= x^2 - ${2 * a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "difference_of_squares", "collect_like_terms"], estimated_time_sec: 30 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "difference_coef_a": (rng) => {
    const m = rng.randInt(2, 5);
    const a = rng.randInt(1, 6);
    const A = m * m, C = -(a * a);
    const params = { m, a };
    return {
      id: makeId("hard", "difference_coef_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "difference_coef_a",
      prompt: `Expand (${m}x + ${a})(${m}x - ${a})`,
      answer: formatPoly(A, 0, C),
      worked_solution: [
        `Recognize difference of squares: (mx + a)(mx - a) = (mx)^2 - a^2`,
        `(${m}x)^2 = ${A}x^2`,
        `${a}^2 = ${a * a}`,
        `= ${formatPoly(A, 0, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "difference_of_squares", "expand_brackets", "simplify_expression"], estimated_time_sec: 35 }
    };
  },

  "difference_coef_b": (rng) => {
    const m = rng.randInt(3, 6);
    const a = rng.randInt(2, 7);
    const A = m * m, C = -(a * a);
    const params = { m, a };
    return {
      id: makeId("hard", "difference_coef_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "difference_coef_b",
      prompt: `Expand (${m}x - ${a})(${m}x + ${a})`,
      answer: formatPoly(A, 0, C),
      worked_solution: [
        `Difference of squares: (${m}x - ${a})(${m}x + ${a}) = (${m}x)^2 - ${a}^2`,
        `= ${A}x^2 - ${a * a}`,
      ],
      metadata: { params, skills: ["difference_of_squares", "expand_brackets", "simplify_expression"], estimated_time_sec: 35 }
    };
  },

  "difference_coef_c": (rng) => {
    const m = rng.randInt(2, 4);
    const a = rng.randInt(3, 8);
    const A = m * m, C = -(a * a);
    const params = { m, a };
    return {
      id: makeId("hard", "difference_coef_c", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "difference_coef_c",
      prompt: `Expand (${m}x + ${a})(${m}x - ${a})`,
      answer: formatPoly(A, 0, C),
      worked_solution: [
        `This is a difference of squares pattern`,
        `(${m}x + ${a})(${m}x - ${a}) = (${m}x)^2 - ${a}^2`,
        `= ${A}x^2 - ${a * a}`,
        `= ${formatPoly(A, 0, C)}`,
      ],
      metadata: { params, skills: ["difference_of_squares", "expand_brackets", "simplify_expression"], estimated_time_sec: 35 }
    };
  },

  "square_large_a": (rng) => {
    const m = rng.randInt(2, 5);
    const a = rng.randInt(2, 6);
    const A = m * m, B = -2 * m * a, C = a * a;
    const params = { m, a };
    return {
      id: makeId("hard", "square_large_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "square_large_a",
      prompt: `Expand (${m}x - ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (mx - a)^2 = (mx)^2 - 2(mx)(a) + a^2`,
        `(${m}x - ${a})^2 = ${A}x^2 - 2(${m})(${a})x + ${C}`,
        `= ${A}x^2 - ${2 * m * a}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets", "simplify_expression"], estimated_time_sec: 40 }
    };
  },

  "square_large_b": (rng) => {
    const m = rng.randInt(3, 5);
    const a = rng.randInt(1, 5);
    const A = m * m, B = 2 * m * a, C = a * a;
    const params = { m, a };
    return {
      id: makeId("hard", "square_large_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "square_large_b",
      prompt: `Expand (${m}x + ${a})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use identity: (mx + a)^2 = (mx)^2 + 2(mx)(a) + a^2`,
        `= ${A}x^2 + ${B}x + ${C}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets", "simplify_expression"], estimated_time_sec: 40 }
    };
  },

  "mixed_signs_a": (rng) => {
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const A = 2;
    const B = -2 * a + 2 * b;
    const C = a * a + b * b;
    const params = { a, b };
    return {
      id: makeId("hard", "mixed_signs_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "mixed_signs_a",
      prompt: `Expand and simplify (x - ${a})^2 + (x + ${b})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand (x - ${a})^2 = x^2 - ${2 * a}x + ${a * a}`,
        `Expand (x + ${b})^2 = x^2 + ${2 * b}x + ${b * b}`,
        `Add: x^2 - ${2 * a}x + ${a * a} + x^2 + ${2 * b}x + ${b * b}`,
        `= 2x^2 + (${-2 * a} + ${2 * b})x + ${a * a + b * b}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "difference_of_squares", "expand_brackets", "simplify_expression"], estimated_time_sec: 50 }
    };
  },

  "mixed_signs_b": (rng) => {
    const a = rng.randInt(2, 6);
    const b = rng.randInt(1, 4);
    const A = 2;
    const B = 2 * a - 2 * b;
    const C = a * a + b * b;
    const params = { a, b };
    return {
      id: makeId("hard", "mixed_signs_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "hard", archetype: "mixed_signs_b",
      prompt: `Expand and simplify (x + ${a})^2 + (x - ${b})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand (x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
        `Expand (x - ${b})^2 = x^2 - ${2 * b}x + ${b * b}`,
        `Add: 2x^2 + ${2 * a - 2 * b}x + ${a * a + b * b}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["perfect_square_identity", "expand_brackets", "simplify_expression"], estimated_time_sec: 50 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "nested_simplify_a": (rng) => {
    const a = rng.randInt(1, 6);
    const B = 4 * a;
    const params = { a };
    return {
      id: makeId("challenge", "nested_simplify_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "nested_simplify_a",
      prompt: `Expand and simplify (x + ${a})^2 - (x - ${a})^2`,
      answer: `${B}x`,
      worked_solution: [
        `Expand (x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
        `Expand (x - ${a})^2 = x^2 - ${2 * a}x + ${a * a}`,
        `Subtract: (x^2 + ${2 * a}x + ${a * a}) - (x^2 - ${2 * a}x + ${a * a})`,
        `= x^2 + ${2 * a}x + ${a * a} - x^2 + ${2 * a}x - ${a * a}`,
        `= ${B}x`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 45 }
    };
  },

  "nested_simplify_b": (rng) => {
    const a = rng.randInt(2, 7);
    const B = 4 * a;
    const params = { a };
    return {
      id: makeId("challenge", "nested_simplify_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "nested_simplify_b",
      prompt: `Simplify (x + ${a})^2 - (x - ${a})^2`,
      answer: `${B}x`,
      worked_solution: [
        `Expand (x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
        `Expand (x - ${a})^2 = x^2 - ${2 * a}x + ${a * a}`,
        `Subtract: x^2 cancels, ${a * a} cancels`,
        `= ${2 * a}x + ${2 * a}x = ${B}x`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 45 }
    };
  },

  "multi_step_a": (rng) => {
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const A = 2;
    const B = 2 * b;
    const C = -(a * a) + b * b;
    const params = { a, b };
    return {
      id: makeId("challenge", "multi_step_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "multi_step_a",
      prompt: `Expand and simplify (x + ${a})(x - ${a}) + (x + ${b})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand (x + ${a})(x - ${a}) = x^2 - ${a * a}`,
        `Expand (x + ${b})^2 = x^2 + ${2 * b}x + ${b * b}`,
        `Add: x^2 - ${a * a} + x^2 + ${2 * b}x + ${b * b}`,
        `= 2x^2 + ${2 * b}x + ${-(a * a) + b * b}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 50 }
    };
  },

  "multi_step_b": (rng) => {
    const a = rng.randInt(1, 6);
    const b = rng.randInt(1, 4);
    const A = 2;
    const B = -2 * b;
    const C = -(a * a) + b * b;
    const params = { a, b };
    return {
      id: makeId("challenge", "multi_step_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "multi_step_b",
      prompt: `Expand and simplify (x + ${a})(x - ${a}) + (x - ${b})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand (x + ${a})(x - ${a}) = x^2 - ${a * a}`,
        `Expand (x - ${b})^2 = x^2 - ${2 * b}x + ${b * b}`,
        `Add: 2x^2 - ${2 * b}x + (${-(a * a)} + ${b * b})`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 50 }
    };
  },

  "structural_pattern_a": (rng) => {
    const a = rng.randInt(2, 8);
    const b = rng.randInt(1, 6);
    const A = 1;
    const B = 2 * a;
    const C = a * a - b * b;
    const params = { a, b };
    return {
      id: makeId("challenge", "structural_pattern_a", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "structural_pattern_a",
      prompt: `Expand and simplify (x + ${a})^2 - (x + ${b})(x - ${b})`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand (x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
        `Expand (x + ${b})(x - ${b}) = x^2 - ${b * b}`,
        `Subtract: (x^2 + ${2 * a}x + ${a * a}) - (x^2 - ${b * b})`,
        `= ${2 * a}x + ${a * a} + ${b * b}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 55 }
    };
  },

  "structural_pattern_b": (rng) => {
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const A = 0;
    const B = 0;
    const C = a * a + b * b;
    const params = { a, b };
    return {
      id: makeId("challenge", "structural_pattern_b", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "structural_pattern_b",
      prompt: `Expand and simplify (x + ${a})(x - ${a}) + (x + ${b})(x - ${b}) + ${a * a} + ${b * b}`,
      answer: formatPoly(2, 0, 0),
      worked_solution: [
        `Expand (x + ${a})(x - ${a}) = x^2 - ${a * a}`,
        `Expand (x + ${b})(x - ${b}) = x^2 - ${b * b}`,
        `Add all: x^2 - ${a * a} + x^2 - ${b * b} + ${a * a} + ${b * b}`,
        `The constants cancel: -${a * a} + ${a * a} = 0 and -${b * b} + ${b * b} = 0`,
        `= 2x^2`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 55 }
    };
  },

  "structural_pattern_c": (rng) => {
    const a = rng.randInt(2, 6);
    const b = rng.randInt(1, 4);
    const B = 2 * (a - b);
    const C = a * a - b * b;
    const params = { a, b };
    return {
      id: makeId("challenge", "structural_pattern_c", params),
      topic: "perfect_and_difference_of_squares", difficulty: "challenge", archetype: "structural_pattern_c",
      prompt: `Expand and simplify (x + ${a})^2 - (x + ${b})^2`,
      answer: formatPoly(0, B, C),
      worked_solution: [
        `Expand (x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}`,
        `Expand (x + ${b})^2 = x^2 + ${2 * b}x + ${b * b}`,
        `Subtract: (x^2 + ${2 * a}x + ${a * a}) - (x^2 + ${2 * b}x + ${b * b})`,
        `x^2 cancels, leaving ${2 * a}x - ${2 * b}x + ${a * a} - ${b * b}`,
        `= ${B}x + ${C}`,
        `= ${formatPoly(0, B, C)}`,
      ],
      metadata: { params, skills: ["structure_recognition", "difference_of_squares", "simplify_expression"], estimated_time_sec: 55 }
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
