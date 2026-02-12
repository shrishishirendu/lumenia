import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "expanding_binomial_products";
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

function formatBinomial(a: number, b: number): string {
  if (a === 1 && b >= 0) return `(x + ${b})`;
  if (a === 1 && b < 0) return `(x - ${Math.abs(b)})`;
  if (a === -1 && b >= 0) return `(-x + ${b})`;
  if (a === -1 && b < 0) return `(-x - ${Math.abs(b)})`;
  const xPart = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  if (b === 0) return `(${xPart})`;
  if (b > 0) return `(${xPart} + ${b})`;
  return `(${xPart} - ${Math.abs(b)})`;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "monic_pos_pos_a": (rng) => {
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const A = 1, B = p + q, C = p * q;
    const params = { p, q };
    return {
      id: makeId("easy", "monic_pos_pos_a", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_pos_pos_a",
      prompt: `Expand ${formatBinomial(1, p)}${formatBinomial(1, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Use FOIL: ${formatBinomial(1, p)}${formatBinomial(1, q)}`,
        `First: x × x = x^2`,
        `Outer: x × ${q} = ${q}x`,
        `Inner: ${p} × x = ${p}x`,
        `Last: ${p} × ${q} = ${C}`,
        `Combine: x^2 + ${q}x + ${p}x + ${C} = ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil"], estimated_time_sec: 30 }
    };
  },

  "monic_pos_pos_b": (rng) => {
    const p = rng.randInt(2, 7);
    const q = rng.randInt(2, 7);
    const A = 1, B = p + q, C = p * q;
    const params = { p, q };
    return {
      id: makeId("easy", "monic_pos_pos_b", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_pos_pos_b",
      prompt: `Expand ${formatBinomial(1, p)}${formatBinomial(1, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(1, p)}${formatBinomial(1, q)}`,
        `= x^2 + ${q}x + ${p}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil"], estimated_time_sec: 25 }
    };
  },

  "monic_pos_neg_a": (rng) => {
    const p = rng.randInt(1, 6);
    const q = rng.randInt(1, 6);
    const A = 1, B = p - q, C = -(p * q);
    const params = { p, q };
    return {
      id: makeId("easy", "monic_pos_neg_a", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_pos_neg_a",
      prompt: `Expand ${formatBinomial(1, p)}${formatBinomial(1, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(1, p)}${formatBinomial(1, -q)}`,
        `First: x × x = x^2`,
        `Outer: x × (${-q}) = ${-q}x`,
        `Inner: ${p} × x = ${p}x`,
        `Last: ${p} × (${-q}) = ${C}`,
        `Combine: x^2 + ${-q}x + ${p}x + (${C}) = ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "negative_terms"], estimated_time_sec: 35 }
    };
  },

  "monic_neg_pos_a": (rng) => {
    const p = rng.randInt(1, 6);
    const q = rng.randInt(1, 6);
    const A = 1, B = -p + q, C = -(p * q);
    const params = { p, q };
    return {
      id: makeId("easy", "monic_neg_pos_a", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_neg_pos_a",
      prompt: `Expand ${formatBinomial(1, -p)}${formatBinomial(1, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(1, -p)}${formatBinomial(1, q)}`,
        `First: x × x = x^2`,
        `Outer: x × ${q} = ${q}x`,
        `Inner: (${-p}) × x = ${-p}x`,
        `Last: (${-p}) × ${q} = ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "negative_terms"], estimated_time_sec: 35 }
    };
  },

  "monic_neg_neg_a": (rng) => {
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const A = 1, B = -(p + q), C = p * q;
    const params = { p, q };
    return {
      id: makeId("easy", "monic_neg_neg_a", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_neg_neg_a",
      prompt: `Expand ${formatBinomial(1, -p)}${formatBinomial(1, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(1, -p)}${formatBinomial(1, -q)}`,
        `First: x^2`,
        `Outer: ${-q}x`,
        `Inner: ${-p}x`,
        `Last: (${-p})(${-q}) = ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "negative_terms"], estimated_time_sec: 30 }
    };
  },

  "monic_square_pos": (rng) => {
    const p = rng.randInt(1, 6);
    const A = 1, B = 2 * p, C = p * p;
    const params = { p };
    return {
      id: makeId("easy", "monic_square_pos", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_square_pos",
      prompt: `Expand (x + ${p})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x + ${p})^2 = (x + ${p})(x + ${p})`,
        `= x^2 + ${p}x + ${p}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square"], estimated_time_sec: 25 }
    };
  },

  "monic_square_neg": (rng) => {
    const p = rng.randInt(1, 6);
    const A = 1, B = -2 * p, C = p * p;
    const params = { p };
    return {
      id: makeId("easy", "monic_square_neg", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_square_neg",
      prompt: `Expand (x - ${p})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x - ${p})^2 = (x - ${p})(x - ${p})`,
        `= x^2 - ${p}x - ${p}x + ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square"], estimated_time_sec: 25 }
    };
  },

  "diff_of_squares_a": (rng) => {
    const p = rng.randInt(1, 8);
    const C = -(p * p);
    const params = { p };
    return {
      id: makeId("easy", "diff_of_squares_a", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "diff_of_squares_a",
      prompt: `Expand (x + ${p})(x - ${p})`,
      answer: formatPoly(1, 0, C),
      worked_solution: [
        `This is a difference of squares: (x + a)(x - a) = x^2 - a^2`,
        `a = ${p}, so x^2 - ${p}^2 = ${formatPoly(1, 0, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "difference_of_squares"], estimated_time_sec: 20 }
    };
  },

  "diff_of_squares_b": (rng) => {
    const p = rng.randInt(2, 10);
    const C = -(p * p);
    const params = { p };
    return {
      id: makeId("easy", "diff_of_squares_b", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "diff_of_squares_b",
      prompt: `Expand (x - ${p})(x + ${p})`,
      answer: formatPoly(1, 0, C),
      worked_solution: [
        `Difference of squares: (x - a)(x + a) = x^2 - a^2`,
        `= ${formatPoly(1, 0, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "difference_of_squares"], estimated_time_sec: 20 }
    };
  },

  "monic_zero_const": (rng) => {
    const p = rng.randInt(1, 7);
    const params = { p };
    return {
      id: makeId("easy", "monic_zero_const", params),
      topic: "expanding_binomial_products", difficulty: "easy", archetype: "monic_zero_const",
      prompt: `Expand x${formatBinomial(1, p)}`,
      answer: formatPoly(1, p, 0),
      worked_solution: [
        `Distribute x: x × x + x × ${p}`,
        `= ${formatPoly(1, p, 0)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "distribute"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "non_monic_pos_a": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const A = a, B = a * q + p, C = p * q;
    const params = { a, p, q };
    return {
      id: makeId("medium", "non_monic_pos_a", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_pos_a",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(1, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, p)}${formatBinomial(1, q)}`,
        `First: ${a}x × x = ${A}x^2`,
        `Outer: ${a}x × ${q} = ${a * q}x`,
        `Inner: ${p} × x = ${p}x`,
        `Last: ${p} × ${q} = ${C}`,
        `Combine: ${A}x^2 + ${a * q}x + ${p}x + ${C} = ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic"], estimated_time_sec: 40 }
    };
  },

  "non_monic_neg_a": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const A = a, B = -(a * q) + p, C = -(p * q);
    const params = { a, p, q };
    return {
      id: makeId("medium", "non_monic_neg_a", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_neg_a",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(1, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, p)}${formatBinomial(1, -q)}`,
        `First: ${A}x^2`,
        `Outer: ${a}x × (${-q}) = ${-(a * q)}x`,
        `Inner: ${p}x`,
        `Last: ${p} × (${-q}) = ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic", "negative_terms"], estimated_time_sec: 45 }
    };
  },

  "non_monic_both_a": (rng) => {
    const a = rng.randInt(2, 3);
    const b = rng.randInt(2, 3);
    const p = rng.randInt(1, 4);
    const q = rng.randInt(1, 4);
    const A = a * b, B = a * q + b * p, C = p * q;
    const params = { a, b, p, q };
    return {
      id: makeId("medium", "non_monic_both_a", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_both_a",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(b, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, p)}${formatBinomial(b, q)}`,
        `First: ${a}x × ${b}x = ${A}x^2`,
        `Outer: ${a}x × ${q} = ${a * q}x`,
        `Inner: ${p} × ${b}x = ${b * p}x`,
        `Last: ${p} × ${q} = ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic"], estimated_time_sec: 45 }
    };
  },

  "non_monic_neg_both": (rng) => {
    const a = rng.randInt(2, 3);
    const b = rng.randInt(2, 3);
    const p = rng.randInt(1, 4);
    const q = rng.randInt(1, 4);
    const A = a * b, B = -(a * q + b * p), C = p * q;
    const params = { a, b, p, q };
    return {
      id: makeId("medium", "non_monic_neg_both", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_neg_both",
      prompt: `Expand ${formatBinomial(a, -p)}${formatBinomial(b, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, -p)}${formatBinomial(b, -q)}`,
        `First: ${A}x^2`,
        `Outer: ${-(a * q)}x`,
        `Inner: ${-(b * p)}x`,
        `Last: (${-p})(${-q}) = ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic", "negative_terms"], estimated_time_sec: 45 }
    };
  },

  "non_monic_square_a": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 5);
    const A = a * a, B = 2 * a * p, C = p * p;
    const params = { a, p };
    return {
      id: makeId("medium", "non_monic_square_a", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_square_a",
      prompt: `Expand ${formatBinomial(a, p)}^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `${formatBinomial(a, p)}^2 = ${formatBinomial(a, p)}${formatBinomial(a, p)}`,
        `First: ${A}x^2`,
        `Middle terms: 2 × ${a}x × ${p} = ${B}x`,
        `Last: ${p}^2 = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square", "non_monic"], estimated_time_sec: 40 }
    };
  },

  "non_monic_square_neg_a": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 5);
    const A = a * a, B = -2 * a * p, C = p * p;
    const params = { a, p };
    return {
      id: makeId("medium", "non_monic_square_neg_a", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_square_neg_a",
      prompt: `Expand ${formatBinomial(a, -p)}^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `${formatBinomial(a, -p)}^2 = ${formatBinomial(a, -p)}${formatBinomial(a, -p)}`,
        `First: ${A}x^2`,
        `Middle terms: 2 × ${a}x × (${-p}) = ${B}x`,
        `Last: (${-p})^2 = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square", "non_monic"], estimated_time_sec: 40 }
    };
  },

  "non_monic_diff_sq": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 6);
    const A = a * a, C = -(p * p);
    const params = { a, p };
    return {
      id: makeId("medium", "non_monic_diff_sq", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_diff_sq",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(a, -p)}`,
      answer: formatPoly(A, 0, C),
      worked_solution: [
        `Difference of squares: (ax + p)(ax - p) = (ax)^2 - p^2`,
        `= ${A}x^2 - ${p * p}`,
        `= ${formatPoly(A, 0, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "difference_of_squares", "non_monic"], estimated_time_sec: 30 }
    };
  },

  "non_monic_mixed_sign": (rng) => {
    const a = rng.randInt(2, 4);
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const A = a, B = a * q - p, C = -(p * q);
    const params = { a, p, q };
    return {
      id: makeId("medium", "non_monic_mixed_sign", params),
      topic: "expanding_binomial_products", difficulty: "medium", archetype: "non_monic_mixed_sign",
      prompt: `Expand ${formatBinomial(a, -p)}${formatBinomial(1, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, -p)}${formatBinomial(1, q)}`,
        `First: ${A}x^2`,
        `Outer: ${a * q}x`,
        `Inner: ${-p}x`,
        `Last: ${C}`,
        `Combine: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic", "negative_terms"], estimated_time_sec: 40 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "triple_term_a": (rng) => {
    const p = rng.randInt(1, 4);
    const q = rng.randInt(1, 4);
    const r = rng.randInt(1, 3);
    const A = 1, B = p + q, C = p * q;
    const finalA = A, finalB = B + r, finalC = C + r * B, finalD = r * C;
    const params = { p, q, r };
    return {
      id: makeId("hard", "triple_term_a", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "triple_term_a",
      prompt: `Expand ${formatBinomial(1, p)}${formatBinomial(1, q)}(x + ${r})`,
      answer: `x^3${signedTerm(finalB, "x^2", false)}${signedTerm(finalC, "x", false)}${signedTerm(finalD, "", false)}`,
      worked_solution: [
        `First expand ${formatBinomial(1, p)}${formatBinomial(1, q)} = ${formatPoly(A, B, C)}`,
        `Then multiply (${formatPoly(A, B, C)})(x + ${r})`,
        `= x^3 + ${B}x^2 + ${C}x + ${r}x^2 + ${r * B}x + ${r * C}`,
        `= x^3${signedTerm(finalB, "x^2", false)}${signedTerm(finalC, "x", false)}${signedTerm(finalD, "", false)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "triple_product", "collect_terms"], estimated_time_sec: 60 }
    };
  },

  "large_coeff_a": (rng) => {
    const a = rng.randInt(3, 5);
    const b = rng.randInt(2, 4);
    const p = rng.randInt(1, 6);
    const q = rng.randInt(1, 6);
    const A = a * b, B = a * q + b * p, C = p * q;
    const params = { a, b, p, q };
    return {
      id: makeId("hard", "large_coeff_a", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "large_coeff_a",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(b, q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, p)}${formatBinomial(b, q)}`,
        `First: ${a}x × ${b}x = ${A}x^2`,
        `Outer: ${a}x × ${q} = ${a * q}x`,
        `Inner: ${p} × ${b}x = ${b * p}x`,
        `Last: ${p} × ${q} = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "large_coefficients"], estimated_time_sec: 50 }
    };
  },

  "large_coeff_neg": (rng) => {
    const a = rng.randInt(3, 5);
    const b = rng.randInt(2, 4);
    const p = rng.randInt(1, 6);
    const q = rng.randInt(1, 6);
    const A = a * b, B = -(a * q) + b * p, C = -(p * q);
    const params = { a, b, p, q };
    return {
      id: makeId("hard", "large_coeff_neg", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "large_coeff_neg",
      prompt: `Expand ${formatBinomial(a, p)}${formatBinomial(b, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, p)}${formatBinomial(b, -q)}`,
        `First: ${A}x^2`,
        `Outer: ${-(a * q)}x`,
        `Inner: ${b * p}x`,
        `Last: ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "large_coefficients", "negative_terms"], estimated_time_sec: 50 }
    };
  },

  "non_monic_diff_sq_large": (rng) => {
    const a = rng.randInt(3, 6);
    const p = rng.randInt(2, 7);
    const A = a * a, C = -(p * p);
    const params = { a, p };
    return {
      id: makeId("hard", "non_monic_diff_sq_large", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "non_monic_diff_sq_large",
      prompt: `Expand (${a}x + ${p})(${a}x - ${p})`,
      answer: formatPoly(A, 0, C),
      worked_solution: [
        `Difference of squares: (${a}x)^2 - ${p}^2`,
        `= ${A}x^2 - ${p * p}`,
      ],
      metadata: { params, skills: ["expand_binomial", "difference_of_squares", "large_coefficients"], estimated_time_sec: 35 }
    };
  },

  "non_monic_square_large": (rng) => {
    const a = rng.randInt(3, 5);
    const p = rng.randInt(2, 6);
    const A = a * a, B = 2 * a * p, C = p * p;
    const params = { a, p };
    return {
      id: makeId("hard", "non_monic_square_large", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "non_monic_square_large",
      prompt: `Expand (${a}x + ${p})^2`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(${a}x + ${p})^2 = (${a}x)^2 + 2(${a}x)(${p}) + ${p}^2`,
        `= ${A}x^2 + ${B}x + ${C}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square", "large_coefficients"], estimated_time_sec: 40 }
    };
  },

  "expand_then_add": (rng) => {
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const k = rng.randInt(1, 6);
    const A = 1, B = p + q, C = p * q + k;
    const params = { p, q, k };
    return {
      id: makeId("hard", "expand_then_add", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "expand_then_add",
      prompt: `Expand and simplify ${formatBinomial(1, p)}${formatBinomial(1, q)} + ${k}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `First expand: ${formatBinomial(1, p)}${formatBinomial(1, q)} = ${formatPoly(1, p + q, p * q)}`,
        `Then add ${k}: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "simplify"], estimated_time_sec: 45 }
    };
  },

  "expand_then_subtract": (rng) => {
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const k = rng.randInt(1, 4);
    const A = 1, B = p + q - k, C = p * q;
    const params = { p, q, k };
    return {
      id: makeId("hard", "expand_then_subtract", params),
      topic: "expanding_binomial_products", difficulty: "hard", archetype: "expand_then_subtract",
      prompt: `Expand and simplify ${formatBinomial(1, p)}${formatBinomial(1, q)} - ${k}x`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `First expand: ${formatBinomial(1, p)}${formatBinomial(1, q)} = ${formatPoly(1, p + q, p * q)}`,
        `Subtract ${k}x: ${p + q}x - ${k}x = ${B}x`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "simplify"], estimated_time_sec: 45 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "double_expand_add": (rng) => {
    const p = rng.randInt(1, 4);
    const q = rng.randInt(1, 4);
    const r = rng.randInt(1, 4);
    const s = rng.randInt(1, 4);
    const A1 = 1, B1 = p + q, C1 = p * q;
    const A2 = 1, B2 = r + s, C2 = r * s;
    const A = A1 + A2, B = B1 + B2, C = C1 + C2;
    const params = { p, q, r, s };
    return {
      id: makeId("challenge", "double_expand_add", params),
      topic: "expanding_binomial_products", difficulty: "challenge", archetype: "double_expand_add",
      prompt: `Expand and simplify ${formatBinomial(1, p)}${formatBinomial(1, q)} + ${formatBinomial(1, r)}${formatBinomial(1, s)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `Expand first product: ${formatPoly(A1, B1, C1)}`,
        `Expand second product: ${formatPoly(A2, B2, C2)}`,
        `Add: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "combine_expressions"], estimated_time_sec: 70 }
    };
  },

  "double_expand_sub": (rng) => {
    const p = rng.randInt(1, 4);
    const q = rng.randInt(1, 4);
    const r = rng.randInt(1, 3);
    const s = rng.randInt(1, 3);
    const A1 = 1, B1 = p + q, C1 = p * q;
    const A2 = 1, B2 = r + s, C2 = r * s;
    const A = A1 - A2, B = B1 - B2, C = C1 - C2;
    const params = { p, q, r, s };
    const answer = A === 0
      ? (B === 0 ? `${C}` : formatPoly(0, B, C).replace(/^0/, ""))
      : formatPoly(A, B, C);
    const cleanAnswer = B === 0 && C === 0 ? "0" : (B !== 0 || C !== 0 ? `${signedTerm(B, "x", true)}${signedTerm(C, "", false)}`.trim() : "0");
    return {
      id: makeId("challenge", "double_expand_sub", params),
      topic: "expanding_binomial_products", difficulty: "challenge", archetype: "double_expand_sub",
      prompt: `Expand and simplify ${formatBinomial(1, p)}${formatBinomial(1, q)} - ${formatBinomial(1, r)}${formatBinomial(1, s)}`,
      answer: cleanAnswer,
      worked_solution: [
        `Expand first product: ${formatPoly(A1, B1, C1)}`,
        `Expand second product: ${formatPoly(A2, B2, C2)}`,
        `Subtract: (${formatPoly(A1, B1, C1)}) - (${formatPoly(A2, B2, C2)})`,
        `x^2 terms cancel: ${A1} - ${A2} = ${A}`,
        `= ${cleanAnswer}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "combine_expressions", "subtract_polynomials"], estimated_time_sec: 75 }
    };
  },

  "triple_factor": (rng) => {
    const p = rng.randInt(1, 3);
    const q = rng.randInt(1, 3);
    const r = rng.randInt(1, 3);
    const B12 = p + q, C12 = p * q;
    const fA = 1;
    const fB = B12 + r;
    const fC = C12 + r * B12;
    const fD = r * C12;
    const params = { p, q, r };
    return {
      id: makeId("challenge", "triple_factor", params),
      topic: "expanding_binomial_products", difficulty: "challenge", archetype: "triple_factor",
      prompt: `Expand (x + ${p})(x + ${q})(x + ${r})`,
      answer: `x^3${signedTerm(fB, "x^2", false)}${signedTerm(fC, "x", false)}${signedTerm(fD, "", false)}`,
      worked_solution: [
        `Step 1: Expand (x + ${p})(x + ${q}) = ${formatPoly(1, B12, C12)}`,
        `Step 2: Multiply by (x + ${r})`,
        `= x^3${signedTerm(fB, "x^2", false)}${signedTerm(fC, "x", false)}${signedTerm(fD, "", false)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "triple_product", "collect_terms"], estimated_time_sec: 80 }
    };
  },

  "non_monic_large_expand": (rng) => {
    const a = rng.randInt(2, 5);
    const b = rng.randInt(2, 5);
    const p = rng.randInt(1, 6);
    const q = rng.randInt(1, 6);
    const A = a * b, B = -(a * q + b * p), C = p * q;
    const params = { a, b, p, q };
    return {
      id: makeId("challenge", "non_monic_large_expand", params),
      topic: "expanding_binomial_products", difficulty: "challenge", archetype: "non_monic_large_expand",
      prompt: `Expand ${formatBinomial(a, -p)}${formatBinomial(b, -q)}`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `FOIL: ${formatBinomial(a, -p)}${formatBinomial(b, -q)}`,
        `First: ${A}x^2`,
        `Outer: ${-(a * q)}x`,
        `Inner: ${-(b * p)}x`,
        `Last: (${-p})(${-q}) = ${C}`,
        `= ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "foil", "non_monic", "negative_terms", "large_coefficients"], estimated_time_sec: 55 }
    };
  },

  "square_diff_combo": (rng) => {
    const p = rng.randInt(1, 5);
    const q = rng.randInt(1, 5);
    const sqA = 1, sqB = 2 * p, sqC = p * p;
    const dsA = 1, dsC = -(q * q);
    const A = sqA + dsA, B = sqB, C = sqC + dsC;
    const params = { p, q };
    return {
      id: makeId("challenge", "square_diff_combo", params),
      topic: "expanding_binomial_products", difficulty: "challenge", archetype: "square_diff_combo",
      prompt: `Expand and simplify (x + ${p})^2 + (x + ${q})(x - ${q})`,
      answer: formatPoly(A, B, C),
      worked_solution: [
        `(x + ${p})^2 = ${formatPoly(sqA, sqB, sqC)}`,
        `(x + ${q})(x - ${q}) = ${formatPoly(dsA, 0, dsC)}`,
        `Add: ${formatPoly(A, B, C)}`,
      ],
      metadata: { params, skills: ["expand_binomial", "perfect_square", "difference_of_squares", "combine_expressions"], estimated_time_sec: 65 }
    };
  },
};

const ALL_ARCHETYPES: Record<string, Record<string, ArchetypeGenerator>> = {
  easy: EASY_ARCHETYPES,
  medium: MEDIUM_ARCHETYPES,
  hard: HARD_ARCHETYPES,
  challenge: CHALLENGE_ARCHETYPES,
};

export function generatePool(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  count: number,
  seed?: number
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = ALL_ARCHETYPES[difficulty];
  const keys = Object.keys(archetypes);
  const results: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (results.length < count && attempts < count * 10) {
    attempts++;
    const key = keys[Math.floor(rng.next() * keys.length)];
    const q = archetypes[key](rng);
    if (!seen.has(q.id)) {
      seen.add(q.id);
      results.push(q);
    }
  }
  return results;
}

export function generateMixedPool(
  config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[],
  seed?: number
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const results: GeneratedQuestion[] = [];

  for (const { difficulty, count } of config) {
    const pool = generatePool(difficulty, count, rng.randInt(1, 999999));
    results.push(...pool);
  }

  return rng.shuffle(results);
}
