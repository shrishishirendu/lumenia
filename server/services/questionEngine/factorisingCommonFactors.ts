import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "factorising_common_factors";
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
  const raw = `factorising_common_factors:${difficulty}:${archetype}:${JSON.stringify(params)}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 12);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function signedTerm(coeff: number, variable: string, first: boolean): string {
  if (first) {
    if (coeff === 1 && variable) return variable;
    if (coeff === -1 && variable) return `-${variable}`;
    return variable ? `${coeff}${variable}` : `${coeff}`;
  }
  if (coeff > 0) {
    if (coeff === 1 && variable) return ` + ${variable}`;
    return variable ? ` + ${coeff}${variable}` : ` + ${coeff}`;
  }
  if (coeff === -1 && variable) return ` - ${variable}`;
  return variable ? ` - ${Math.abs(coeff)}${variable}` : ` - ${Math.abs(coeff)}`;
}

function formatPoly(terms: { coeff: number; var_: string }[]): string {
  let s = "";
  for (let i = 0; i < terms.length; i++) {
    s += signedTerm(terms[i].coeff, terms[i].var_, i === 0);
  }
  return s;
}

function bracketContent(terms: { coeff: number; var_: string }[]): string {
  return formatPoly(terms);
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "numeric_factor_two_terms_1": (rng) => {
    const k = rng.randInt(2, 9);
    const a = rng.randInt(1, 9);
    const b = rng.randInt(1, 9);
    const v = rng.pick(["x", "a", "m"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} + ${k * b}${v}`;
    const ans = `${k}${v}(${a} + ${b})`;
    return {
      id: makeId("easy", "numeric_factor_two_terms_1", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "numeric_factor_two_terms_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Identify common factor: ${k}${v}`,
        `${k * a}${v} ÷ ${k}${v} = ${a}, ${k * b}${v} ÷ ${k}${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },

  "numeric_factor_two_terms_2": (rng) => {
    const k = rng.randInt(2, 8);
    const a = rng.randInt(2, 10);
    const b = rng.randInt(2, 10);
    const v = rng.pick(["x", "y", "n"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} + ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("easy", "numeric_factor_two_terms_2", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "numeric_factor_two_terms_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}${v} ÷ ${k} = ${a}${v}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },

  "variable_factor_x_1": (rng) => {
    const a = rng.randInt(2, 9);
    const b = rng.randInt(1, 9);
    const v = rng.pick(["x", "y", "a"]);
    const params = { a, b, v };
    const expr = `${a}${v}² + ${b}${v}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${v}(${inner})`;
    return {
      id: makeId("easy", "variable_factor_x_1", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "variable_factor_x_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${v}`,
        `${a}${v}² ÷ ${v} = ${a}${v}, ${b}${v} ÷ ${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },

  "variable_factor_x_2": (rng) => {
    const a = rng.randInt(1, 9);
    const b = rng.randInt(1, 9);
    const v = rng.pick(["x", "m", "p"]);
    const params = { a, b, v };
    const aStr = a === 1 ? "" : `${a}`;
    const bStr = b === 1 ? "" : `${b}`;
    const expr = `${aStr}${v}² + ${bStr}${v}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${v}(${inner})`;
    return {
      id: makeId("easy", "variable_factor_x_2", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "variable_factor_x_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${v}`,
        `${aStr}${v}² ÷ ${v} = ${a}${v}, ${bStr}${v} ÷ ${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },

  "numeric_only_1": (rng) => {
    const k = rng.randInt(2, 9);
    const a = rng.randInt(2, 9);
    const b = rng.randInt(2, 9);
    const params = { k, a, b };
    const expr = `${k * a} + ${k * b}`;
    const ans = `${k}(${a} + ${b})`;
    return {
      id: makeId("easy", "numeric_only_1", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "numeric_only_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a} ÷ ${k} = ${a}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 25 },
    };
  },

  "numeric_only_2": (rng) => {
    const k = rng.randInt(3, 9);
    const a = rng.randInt(1, 8);
    const b = rng.randInt(1, 8);
    const params = { k, a, b };
    const expr = `${k * a} + ${k * b}`;
    const ans = `${k}(${a} + ${b})`;
    return {
      id: makeId("easy", "numeric_only_2", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "numeric_only_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a} ÷ ${k} = ${a}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 25 },
    };
  },

  "simple_var_sum_1": (rng) => {
    const a = rng.randInt(2, 9);
    const b = rng.randInt(2, 9);
    const k = gcd(a, b);
    const cf = k > 1 ? k : a;
    const realA = k > 1 ? a : a;
    const realB = k > 1 ? b : a * rng.randInt(2, 5);
    const gcf = gcd(realA, realB);
    const v = rng.pick(["x", "y", "a"]);
    const params = { a: realA, b: realB, gcf, v };
    const expr = `${realA}${v} + ${realB}${v}`;
    const ans = `${gcf}${v}(${realA / gcf} + ${realB / gcf})`;
    return {
      id: makeId("easy", "simple_var_sum_1", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "simple_var_sum_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${gcf}${v}`,
        `${realA}${v} ÷ ${gcf}${v} = ${realA / gcf}, ${realB}${v} ÷ ${gcf}${v} = ${realB / gcf}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },

  "simple_var_sum_2": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const v = rng.pick(["x", "n", "b"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} + ${k * b}${v}`;
    const ans = `${k}${v}(${a} + ${b})`;
    return {
      id: makeId("easy", "simple_var_sum_2", params),
      topic: "factorising_common_factors", difficulty: "easy", archetype: "simple_var_sum_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}`,
        `${k * a}${v} ÷ ${k}${v} = ${a}, ${k * b}${v} ÷ ${k}${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 30 },
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "numeric_and_variable_1": (rng) => {
    const k = rng.randInt(2, 9);
    const a = rng.randInt(1, 9);
    const b = rng.randInt(1, 9);
    const v = rng.pick(["x", "y", "a"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} + ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("medium", "numeric_and_variable_1", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "numeric_and_variable_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}${v} ÷ ${k} = ${a}${v}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 40 },
    };
  },

  "numeric_and_variable_2": (rng) => {
    const k = rng.randInt(2, 7);
    const a = rng.randInt(2, 8);
    const b = rng.randInt(1, 8);
    const v = rng.pick(["x", "m", "n"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} - ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: -b, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("medium", "numeric_and_variable_2", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "numeric_and_variable_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}${v} ÷ ${k} = ${a}${v}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 40 },
    };
  },

  "monomial_factor_1": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(1, 6);
    const b = rng.randInt(1, 6);
    const v = rng.pick(["x", "y", "a"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}² + ${k * b}${v}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}${v}(${inner})`;
    return {
      id: makeId("medium", "monomial_factor_1", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "monomial_factor_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}`,
        `${k * a}${v}² ÷ ${k}${v} = ${a}${v}, ${k * b}${v} ÷ ${k}${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise", "monomial_gcf"], estimated_time_sec: 45 },
    };
  },

  "monomial_factor_2": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(2, 7);
    const b = rng.randInt(1, 7);
    const v = rng.pick(["x", "y", "n"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}² - ${k * b}${v}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: -b, var_: "" }]);
    const ans = `${k}${v}(${inner})`;
    return {
      id: makeId("medium", "monomial_factor_2", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "monomial_factor_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}`,
        `${k * a}${v}² ÷ ${k}${v} = ${a}${v}, ${k * b}${v} ÷ ${k}${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise", "handle_negatives"], estimated_time_sec: 45 },
    };
  },

  "negative_common_factor_1": (rng) => {
    const k = rng.randInt(2, 8);
    const a = rng.randInt(1, 8);
    const b = rng.randInt(1, 8);
    const v = rng.pick(["x", "y", "a"]);
    const params = { k, a, b, v };
    const expr = `-${k * a}${v} - ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `-${k}(${inner})`;
    return {
      id: makeId("medium", "negative_common_factor_1", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "negative_common_factor_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Both terms are negative; common factor is -${k}`,
        `-${k * a}${v} ÷ (-${k}) = ${a}${v}, -${k * b} ÷ (-${k}) = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise", "handle_negatives"], estimated_time_sec: 50 },
    };
  },

  "negative_common_factor_2": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(2, 7);
    const b = rng.randInt(1, 7);
    const v = rng.pick(["x", "m", "n"]);
    const params = { k, a, b, v };
    const expr = `-${k * a}${v} + ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: -b, var_: "" }]);
    const ans = `-${k}(${inner})`;
    return {
      id: makeId("medium", "negative_common_factor_2", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "negative_common_factor_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Factor out -${k} (take negative common factor)`,
        `-${k * a}${v} ÷ (-${k}) = ${a}${v}, ${k * b} ÷ (-${k}) = -${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise", "handle_negatives"], estimated_time_sec: 50 },
    };
  },

  "monomial_factor_3": (rng) => {
    const k = rng.randInt(3, 7);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const v = rng.pick(["x", "a", "t"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}² + ${k * b}${v}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}${v}(${inner})`;
    return {
      id: makeId("medium", "monomial_factor_3", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "monomial_factor_3",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}`,
        `${k * a}${v}² ÷ ${k}${v} = ${a}${v}, ${k * b}${v} ÷ ${k}${v} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise", "monomial_gcf"], estimated_time_sec: 45 },
    };
  },

  "numeric_and_variable_3": (rng) => {
    const k = rng.randInt(2, 9);
    const a = rng.randInt(1, 6);
    const b = rng.randInt(1, 6);
    const v = rng.pick(["x", "y", "p"]);
    const params = { k, a, b, v };
    const expr = `${k * b} + ${k * a}${v}`;
    const inner = bracketContent([{ coeff: b, var_: "" }, { coeff: a, var_: v }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("medium", "numeric_and_variable_3", params),
      topic: "factorising_common_factors", difficulty: "medium", archetype: "numeric_and_variable_3",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * b} ÷ ${k} = ${b}, ${k * a}${v} ÷ ${k} = ${a}${v}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["identify_common_factor", "factorise"], estimated_time_sec: 40 },
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "three_terms_common_1": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(1, 6);
    const b = rng.randInt(1, 6);
    const c = rng.randInt(1, 6);
    const v = rng.pick(["x", "y", "a"]);
    const params = { k, a, b, c, v };
    const expr = `${k * a}${v} + ${k * b} + ${k * c}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }, { coeff: c, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("hard", "three_terms_common_1", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "three_terms_common_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}${v} ÷ ${k} = ${a}${v}, ${k * b} ÷ ${k} = ${b}, ${k * c} ÷ ${k} = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 50 },
    };
  },

  "three_terms_common_2": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const v = rng.pick(["x", "y", "m"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}² + ${k * b}${v} + ${k}`;
    const inner = bracketContent([{ coeff: a, var_: `${v}²` }, { coeff: b, var_: v }, { coeff: 1, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("hard", "three_terms_common_2", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "three_terms_common_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}${v}² ÷ ${k} = ${a}${v}², ${k * b}${v} ÷ ${k} = ${b}${v}, ${k} ÷ ${k} = 1`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 55 },
    };
  },

  "higher_power_common_1": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const v = rng.pick(["x", "y", "a"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}³ + ${k * b}${v}²`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}${v}²(${inner})`;
    return {
      id: makeId("hard", "higher_power_common_1", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "higher_power_common_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}²`,
        `${k * a}${v}³ ÷ ${k}${v}² = ${a}${v}, ${k * b}${v}² ÷ ${k}${v}² = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 55 },
    };
  },

  "higher_power_common_2": (rng) => {
    const k = rng.randInt(3, 6);
    const a = rng.randInt(2, 5);
    const b = rng.randInt(1, 5);
    const v = rng.pick(["x", "y", "n"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v}³ - ${k * b}${v}²`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: -b, var_: "" }]);
    const ans = `${k}${v}²(${inner})`;
    return {
      id: makeId("hard", "higher_power_common_2", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "higher_power_common_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}${v}²`,
        `${k * a}${v}³ ÷ ${k}${v}² = ${a}${v}, ${k * b}${v}² ÷ ${k}${v}² = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 55 },
    };
  },

  "mixed_vars_common_1": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(1, 6);
    const b = rng.randInt(1, 6);
    const params = { k, a, b };
    const expr = `${k * a}xy + ${k * b}x`;
    const inner = bracketContent([{ coeff: a, var_: "y" }, { coeff: b, var_: "" }]);
    const ans = `${k}x(${inner})`;
    return {
      id: makeId("hard", "mixed_vars_common_1", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "mixed_vars_common_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}x`,
        `${k * a}xy ÷ ${k}x = ${a}y, ${k * b}x ÷ ${k}x = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 50 },
    };
  },

  "mixed_vars_common_2": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const params = { k, a, b };
    const expr = `${k * a}xy - ${k * b}xz`;
    const inner = bracketContent([{ coeff: a, var_: "y" }, { coeff: -b, var_: "z" }]);
    const ans = `${k}x(${inner})`;
    return {
      id: makeId("hard", "mixed_vars_common_2", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "mixed_vars_common_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}x`,
        `${k * a}xy ÷ ${k}x = ${a}y, ${k * b}xz ÷ ${k}x = ${b}z`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 55 },
    };
  },

  "three_terms_with_var_1": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const c = rng.randInt(1, 5);
    const params = { k, a, b, c };
    const expr = `${k * a}x + ${k * b}y + ${k * c}`;
    const inner = bracketContent([{ coeff: a, var_: "x" }, { coeff: b, var_: "y" }, { coeff: c, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("hard", "three_terms_with_var_1", params),
      topic: "factorising_common_factors", difficulty: "hard", archetype: "three_terms_with_var_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}x ÷ ${k} = ${a}x, ${k * b}y ÷ ${k} = ${b}y, ${k * c} ÷ ${k} = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["factorise", "simplify_expression", "monomial_gcf"], estimated_time_sec: 50 },
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "mixed_complex_1": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const c = rng.randInt(1, 5);
    const params = { k, a, b, c };
    const expr = `${k * a}x²y - ${k * b}xy + ${k * c}xy²`;
    const inner = bracketContent([{ coeff: a, var_: "x" }, { coeff: -b, var_: "" }, { coeff: c, var_: "y" }]);
    const ans = `${k}xy(${inner})`;
    return {
      id: makeId("challenge", "mixed_complex_1", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "mixed_complex_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}xy`,
        `${k * a}x²y ÷ ${k}xy = ${a}x, ${k * b}xy ÷ ${k}xy = ${b}, ${k * c}xy² ÷ ${k}xy = ${c}y`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 70 },
    };
  },

  "mixed_complex_2": (rng) => {
    const k = rng.randInt(2, 4);
    const a = rng.randInt(2, 5);
    const b = rng.randInt(1, 4);
    const c = rng.randInt(1, 4);
    const params = { k, a, b, c };
    const expr = `${k * a}x³ + ${k * b}x² - ${k * c}x`;
    const inner = bracketContent([{ coeff: a, var_: "x²" }, { coeff: b, var_: "x" }, { coeff: -c, var_: "" }]);
    const ans = `${k}x(${inner})`;
    return {
      id: makeId("challenge", "mixed_complex_2", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "mixed_complex_2",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}x`,
        `${k * a}x³ ÷ ${k}x = ${a}x², ${k * b}x² ÷ ${k}x = ${b}x, ${k * c}x ÷ ${k}x = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 65 },
    };
  },

  "context_problem_1": (rng) => {
    const k = rng.randInt(2, 6);
    const a = rng.randInt(2, 8);
    const b = rng.randInt(2, 8);
    const v = rng.pick(["x", "n", "a"]);
    const params = { k, a, b, v };
    const expr = `${k * a}${v} + ${k * b}`;
    const inner = bracketContent([{ coeff: a, var_: v }, { coeff: b, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("challenge", "context_problem_1", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "context_problem_1",
      prompt: `Factorise the expression ${expr} to simplify the calculation.`,
      answer: ans,
      worked_solution: [
        `Identify GCF of ${k * a} and ${k * b}: GCF = ${k}`,
        `${k * a}${v} ÷ ${k} = ${a}${v}, ${k * b} ÷ ${k} = ${b}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 60 },
    };
  },

  "four_terms_1": (rng) => {
    const k = rng.randInt(2, 4);
    const a = rng.randInt(1, 4);
    const b = rng.randInt(1, 4);
    const c = rng.randInt(1, 4);
    const d = rng.randInt(1, 4);
    const params = { k, a, b, c, d };
    const expr = `${k * a}x + ${k * b}y + ${k * c}z + ${k * d}`;
    const inner = bracketContent([
      { coeff: a, var_: "x" }, { coeff: b, var_: "y" },
      { coeff: c, var_: "z" }, { coeff: d, var_: "" },
    ]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("challenge", "four_terms_1", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "four_terms_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}`,
        `${k * a}x ÷ ${k} = ${a}x, ${k * b}y ÷ ${k} = ${b}y, ${k * c}z ÷ ${k} = ${c}z, ${k * d} ÷ ${k} = ${d}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 65 },
    };
  },

  "neg_three_terms_1": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(1, 5);
    const b = rng.randInt(1, 5);
    const c = rng.randInt(1, 5);
    const v = rng.pick(["x", "y", "m"]);
    const params = { k, a, b, c, v };
    const expr = `-${k * a}${v}² - ${k * b}${v} - ${k * c}`;
    const inner = bracketContent([{ coeff: a, var_: `${v}²` }, { coeff: b, var_: v }, { coeff: c, var_: "" }]);
    const ans = `-${k}(${inner})`;
    return {
      id: makeId("challenge", "neg_three_terms_1", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "neg_three_terms_1",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `All terms are negative; common factor is -${k}`,
        `-${k * a}${v}² ÷ (-${k}) = ${a}${v}², -${k * b}${v} ÷ (-${k}) = ${b}${v}, -${k * c} ÷ (-${k}) = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "handle_negatives", "multi_step"], estimated_time_sec: 65 },
    };
  },

  "higher_power_three_terms": (rng) => {
    const k = rng.randInt(2, 4);
    const a = rng.randInt(1, 4);
    const b = rng.randInt(1, 4);
    const c = rng.randInt(1, 4);
    const params = { k, a, b, c };
    const expr = `${k * a}x²y² + ${k * b}xy² - ${k * c}xy`;
    const inner = bracketContent([{ coeff: a, var_: "xy" }, { coeff: b, var_: "y" }, { coeff: -c, var_: "" }]);
    const ans = `${k}xy(${inner})`;
    return {
      id: makeId("challenge", "higher_power_three_terms", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "higher_power_three_terms",
      prompt: `Factorise: ${expr}`,
      answer: ans,
      worked_solution: [
        `Common factor is ${k}xy`,
        `${k * a}x²y² ÷ ${k}xy = ${a}xy, ${k * b}xy² ÷ ${k}xy = ${b}y, ${k * c}xy ÷ ${k}xy = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 70 },
    };
  },

  "context_problem_2": (rng) => {
    const k = rng.randInt(2, 5);
    const a = rng.randInt(2, 6);
    const b = rng.randInt(2, 6);
    const c = rng.randInt(1, 5);
    const params = { k, a, b, c };
    const expr = `${k * a}x² + ${k * b}x + ${k * c}`;
    const inner = bracketContent([{ coeff: a, var_: "x²" }, { coeff: b, var_: "x" }, { coeff: c, var_: "" }]);
    const ans = `${k}(${inner})`;
    return {
      id: makeId("challenge", "context_problem_2", params),
      topic: "factorising_common_factors", difficulty: "challenge", archetype: "context_problem_2",
      prompt: `Factorise completely: ${expr}`,
      answer: ans,
      worked_solution: [
        `GCF of ${k * a}, ${k * b}, ${k * c} is ${k}`,
        `${k * a}x² ÷ ${k} = ${a}x², ${k * b}x ÷ ${k} = ${b}x, ${k * c} ÷ ${k} = ${c}`,
        `So ${expr} = ${ans}`,
      ],
      metadata: { params, skills: ["greatest_common_factor", "factorise", "multi_step"], estimated_time_sec: 60 },
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
