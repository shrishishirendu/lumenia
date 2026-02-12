import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "operations_with_surds";
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
  if (coeff === -1) return `-√${radicand}`;
  return `${coeff}√${radicand}`;
}

function isPerfectSquare(n: number): boolean {
  const s = Math.round(Math.sqrt(n));
  return s * s === n;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "add_like_a": (rng) => {
    const bases = [2, 3, 5, 7];
    const base = rng.pick(bases);
    const k = rng.randInt(1, 6);
    const m = rng.randInt(1, 6);
    const sum = k + m;
    const params = { k, m, base };
    return {
      id: makeId("easy", "add_like_a", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "add_like_a",
      prompt: `Simplify ${surdStr(k, base)} + ${surdStr(m, base)}`,
      answer: surdStr(sum, base),
      worked_solution: [
        `Both terms have √${base} (like surds)`,
        `${k}√${base} + ${m}√${base} = (${k} + ${m})√${base}`,
        `= ${surdStr(sum, base)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "add_like_b": (rng) => {
    const bases = [6, 10, 11, 13];
    const base = rng.pick(bases);
    const k = rng.randInt(2, 9);
    const m = rng.randInt(1, 5);
    const sum = k + m;
    const params = { k, m, base };
    return {
      id: makeId("easy", "add_like_b", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "add_like_b",
      prompt: `Simplify ${surdStr(k, base)} + ${surdStr(m, base)}`,
      answer: surdStr(sum, base),
      worked_solution: [
        `Both terms have √${base} (like surds)`,
        `${k}√${base} + ${m}√${base} = (${k} + ${m})√${base}`,
        `= ${surdStr(sum, base)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "sub_like_a": (rng) => {
    const bases = [2, 3, 5, 7];
    const base = rng.pick(bases);
    const k = rng.randInt(4, 9);
    const m = rng.randInt(1, k - 1);
    const diff = k - m;
    const params = { k, m, base };
    return {
      id: makeId("easy", "sub_like_a", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "sub_like_a",
      prompt: `Simplify ${surdStr(k, base)} − ${surdStr(m, base)}`,
      answer: surdStr(diff, base),
      worked_solution: [
        `Both terms have √${base} (like surds)`,
        `${k}√${base} − ${m}√${base} = (${k} − ${m})√${base}`,
        `= ${surdStr(diff, base)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "sub_like_b": (rng) => {
    const bases = [6, 10, 11, 13];
    const base = rng.pick(bases);
    const k = rng.randInt(5, 9);
    const m = rng.randInt(1, k - 1);
    const diff = k - m;
    const params = { k, m, base };
    return {
      id: makeId("easy", "sub_like_b", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "sub_like_b",
      prompt: `Simplify ${surdStr(k, base)} − ${surdStr(m, base)}`,
      answer: surdStr(diff, base),
      worked_solution: [
        `Both terms have √${base} (like surds)`,
        `${k}√${base} − ${m}√${base} = (${k} − ${m})√${base}`,
        `= ${surdStr(diff, base)}`,
      ],
      metadata: { params, skills: ["combine_like_surds"], estimated_time_sec: 20 }
    };
  },

  "multiply_simple_a": (rng) => {
    const configs = [
      { a: 2, b: 3, product: 6 },
      { a: 2, b: 5, product: 10 },
      { a: 3, b: 5, product: 15 },
      { a: 3, b: 7, product: 21 },
      { a: 5, b: 7, product: 35 },
      { a: 2, b: 7, product: 14 },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("easy", "multiply_simple_a", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "multiply_simple_a",
      prompt: `Simplify √${cfg.a} × √${cfg.b}`,
      answer: `√${cfg.product}`,
      worked_solution: [
        `√${cfg.a} × √${cfg.b} = √(${cfg.a} × ${cfg.b})`,
        `= √${cfg.product}`,
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 15 }
    };
  },

  "multiply_simple_b": (rng) => {
    const configs = [
      { a: 2, b: 8, product: 16, answer: "4" },
      { a: 3, b: 12, product: 36, answer: "6" },
      { a: 5, b: 5, product: 25, answer: "5" },
      { a: 3, b: 3, product: 9, answer: "3" },
      { a: 6, b: 6, product: 36, answer: "6" },
      { a: 2, b: 18, product: 36, answer: "6" },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("easy", "multiply_simple_b", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "multiply_simple_b",
      prompt: `Simplify √${cfg.a} × √${cfg.b}`,
      answer: cfg.answer,
      worked_solution: [
        `√${cfg.a} × √${cfg.b} = √(${cfg.a} × ${cfg.b})`,
        `= √${cfg.product}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 20 }
    };
  },

  "multiply_simple_c": (rng) => {
    const configs = [
      { a: 2, b: 6, product: 12, coeff: 2, rad: 3 },
      { a: 3, b: 6, product: 18, coeff: 3, rad: 2 },
      { a: 5, b: 10, product: 50, coeff: 5, rad: 2 },
      { a: 6, b: 10, product: 60, coeff: 2, rad: 15 },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("easy", "multiply_simple_c", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "multiply_simple_c",
      prompt: `Simplify √${cfg.a} × √${cfg.b}`,
      answer: surdStr(cfg.coeff, cfg.rad),
      worked_solution: [
        `√${cfg.a} × √${cfg.b} = √(${cfg.a} × ${cfg.b})`,
        `= √${cfg.product}`,
        `Simplify: √${cfg.product} = ${surdStr(cfg.coeff, cfg.rad)}`,
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "multiply_simple_d": (rng) => {
    const configs = [
      { a: 3, b: 2, product: 6 },
      { a: 5, b: 3, product: 15 },
      { a: 7, b: 2, product: 14 },
      { a: 11, b: 3, product: 33 },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("easy", "multiply_simple_d", params),
      topic: "operations_with_surds", difficulty: "easy", archetype: "multiply_simple_d",
      prompt: `Simplify √${cfg.a} × √${cfg.b}`,
      answer: `√${cfg.product}`,
      worked_solution: [
        `√${cfg.a} × √${cfg.b} = √(${cfg.a} × ${cfg.b})`,
        `= √${cfg.product}`,
      ],
      metadata: { params, skills: ["multiply_surds"], estimated_time_sec: 15 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "add_after_simplify_a": (rng) => {
    const configs = [
      { expr: "3√8 + 2√18", c1: 3, n1: 8, c2: 2, n2: 18, rad: 2, s1: 6, s2: 6, total: 12 },
      { expr: "√12 + √27", c1: 1, n1: 12, c2: 1, n2: 27, rad: 3, s1: 2, s2: 3, total: 5 },
      { expr: "2√50 + 3√8", c1: 2, n1: 50, c2: 3, n2: 8, rad: 2, s1: 10, s2: 6, total: 16 },
      { expr: "√75 + 2√12", c1: 1, n1: 75, c2: 2, n2: 12, rad: 3, s1: 5, s2: 4, total: 9 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    const { coeff: ic1, radicand: r1 } = simplifySurd(cfg.n1);
    const { coeff: ic2, radicand: r2 } = simplifySurd(cfg.n2);
    return {
      id: makeId("medium", "add_after_simplify_a", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "add_after_simplify_a",
      prompt: `Simplify ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: √${cfg.n1} = ${surdStr(ic1, r1)}, √${cfg.n2} = ${surdStr(ic2, r2)}`,
        `${cfg.c1 > 1 ? cfg.c1 + " × " : ""}${surdStr(ic1, r1)} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 + " × " : ""}${surdStr(ic2, r2)} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Like surds combine: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "add_after_simplify_b": (rng) => {
    const configs = [
      { expr: "5√20 + 2√45", c1: 5, n1: 20, c2: 2, n2: 45, rad: 5, s1: 10, s2: 6, total: 16 },
      { expr: "4√18 + √72", c1: 4, n1: 18, c2: 1, n2: 72, rad: 2, s1: 12, s2: 6, total: 18 },
      { expr: "2√27 + 3√48", c1: 2, n1: 27, c2: 3, n2: 48, rad: 3, s1: 6, s2: 12, total: 18 },
      { expr: "√32 + √98", c1: 1, n1: 32, c2: 1, n2: 98, rad: 2, s1: 4, s2: 7, total: 11 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    const { coeff: ic1, radicand: r1 } = simplifySurd(cfg.n1);
    const { coeff: ic2, radicand: r2 } = simplifySurd(cfg.n2);
    return {
      id: makeId("medium", "add_after_simplify_b", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "add_after_simplify_b",
      prompt: `Simplify ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: √${cfg.n1} = ${surdStr(ic1, r1)}, √${cfg.n2} = ${surdStr(ic2, r2)}`,
        `${cfg.c1 > 1 ? cfg.c1 + " × " : ""}${surdStr(ic1, r1)} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 + " × " : ""}${surdStr(ic2, r2)} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Like surds combine: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "sub_after_simplify_a": (rng) => {
    const configs = [
      { expr: "4√12 − √27", c1: 4, n1: 12, c2: 1, n2: 27, rad: 3, s1: 8, s2: 3, total: 5 },
      { expr: "5√18 − 2√32", c1: 5, n1: 18, c2: 2, n2: 32, rad: 2, s1: 15, s2: 8, total: 7 },
      { expr: "3√50 − √72", c1: 3, n1: 50, c2: 1, n2: 72, rad: 2, s1: 15, s2: 6, total: 9 },
      { expr: "6√8 − 2√18", c1: 6, n1: 8, c2: 2, n2: 18, rad: 2, s1: 12, s2: 6, total: 6 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    const { coeff: ic1, radicand: r1 } = simplifySurd(cfg.n1);
    const { coeff: ic2, radicand: r2 } = simplifySurd(cfg.n2);
    return {
      id: makeId("medium", "sub_after_simplify_a", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "sub_after_simplify_a",
      prompt: `Simplify ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: √${cfg.n1} = ${surdStr(ic1, r1)}, √${cfg.n2} = ${surdStr(ic2, r2)}`,
        `${cfg.c1 > 1 ? cfg.c1 + " × " : ""}${surdStr(ic1, r1)} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 + " × " : ""}${surdStr(ic2, r2)} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Like surds combine: ${cfg.s1}√${cfg.rad} − ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "sub_after_simplify_b": (rng) => {
    const configs = [
      { expr: "3√45 − 2√20", c1: 3, n1: 45, c2: 2, n2: 20, rad: 5, s1: 9, s2: 4, total: 5 },
      { expr: "4√27 − √48", c1: 4, n1: 27, c2: 1, n2: 48, rad: 3, s1: 12, s2: 4, total: 8 },
      { expr: "5√12 − √75", c1: 5, n1: 12, c2: 1, n2: 75, rad: 3, s1: 10, s2: 5, total: 5 },
      { expr: "2√75 − 3√12", c1: 2, n1: 75, c2: 3, n2: 12, rad: 3, s1: 10, s2: 6, total: 4 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    const { coeff: ic1, radicand: r1 } = simplifySurd(cfg.n1);
    const { coeff: ic2, radicand: r2 } = simplifySurd(cfg.n2);
    return {
      id: makeId("medium", "sub_after_simplify_b", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "sub_after_simplify_b",
      prompt: `Simplify ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: √${cfg.n1} = ${surdStr(ic1, r1)}, √${cfg.n2} = ${surdStr(ic2, r2)}`,
        `${cfg.c1 > 1 ? cfg.c1 + " × " : ""}${surdStr(ic1, r1)} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 + " × " : ""}${surdStr(ic2, r2)} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Like surds combine: ${cfg.s1}√${cfg.rad} − ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["simplify_surd", "combine_like_surds"], estimated_time_sec: 40 }
    };
  },

  "multiply_with_coeff_a": (rng) => {
    const configs = [
      { k1: 2, a: 3, k2: 3, b: 5, km: 6, ab: 15 },
      { k1: 3, a: 2, k2: 4, b: 3, km: 12, ab: 6 },
      { k1: 5, a: 2, k2: 2, b: 7, km: 10, ab: 14 },
      { k1: 4, a: 5, k2: 3, b: 2, km: 12, ab: 10 },
    ];
    const cfg = rng.pick(configs);
    const params = { k1: cfg.k1, a: cfg.a, k2: cfg.k2, b: cfg.b };
    const simplified = simplifySurd(cfg.ab);
    const finalCoeff = cfg.km * simplified.coeff;
    const answerStr = surdStr(finalCoeff, simplified.radicand);
    return {
      id: makeId("medium", "multiply_with_coeff_a", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "multiply_with_coeff_a",
      prompt: `Simplify (${surdStr(cfg.k1, cfg.a)})(${surdStr(cfg.k2, cfg.b)})`,
      answer: answerStr,
      worked_solution: [
        `Multiply coefficients: ${cfg.k1} × ${cfg.k2} = ${cfg.km}`,
        `Multiply radicands: √${cfg.a} × √${cfg.b} = √${cfg.ab}`,
        simplified.radicand !== cfg.ab
          ? `Simplify √${cfg.ab} = ${surdStr(simplified.coeff, simplified.radicand)}, so ${cfg.km} × ${surdStr(simplified.coeff, simplified.radicand)} = ${answerStr}`
          : `Result: ${answerStr}`,
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_under_root"], estimated_time_sec: 35 }
    };
  },

  "multiply_with_coeff_b": (rng) => {
    const configs = [
      { k1: 2, a: 6, k2: 3, b: 6, km: 6, ab: 36, answer: "36" },
      { k1: 3, a: 2, k2: 2, b: 8, km: 6, ab: 16, answer: "24" },
      { k1: 2, a: 3, k2: 5, b: 12, km: 10, ab: 36, answer: "60" },
      { k1: 4, a: 5, k2: 2, b: 5, km: 8, ab: 25, answer: "40" },
    ];
    const cfg = rng.pick(configs);
    const params = { k1: cfg.k1, a: cfg.a, k2: cfg.k2, b: cfg.b };
    return {
      id: makeId("medium", "multiply_with_coeff_b", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "multiply_with_coeff_b",
      prompt: `Simplify (${surdStr(cfg.k1, cfg.a)})(${surdStr(cfg.k2, cfg.b)})`,
      answer: cfg.answer,
      worked_solution: [
        `Multiply coefficients: ${cfg.k1} × ${cfg.k2} = ${cfg.km}`,
        `Multiply radicands: √${cfg.a} × √${cfg.b} = √${cfg.ab}`,
        `√${cfg.ab} = ${Math.round(Math.sqrt(cfg.ab))}`,
        `${cfg.km} × ${Math.round(Math.sqrt(cfg.ab))} = ${cfg.answer}`,
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_under_root"], estimated_time_sec: 30 }
    };
  },

  "multiply_with_coeff_c": (rng) => {
    const configs = [
      { k1: 3, a: 2, k2: 2, b: 6, km: 6, ab: 12, coeff: 2, rad: 3, fc: 12 },
      { k1: 2, a: 5, k2: 3, b: 10, km: 6, ab: 50, coeff: 5, rad: 2, fc: 30 },
      { k1: 4, a: 3, k2: 2, b: 6, km: 8, ab: 18, coeff: 3, rad: 2, fc: 24 },
      { k1: 2, a: 7, k2: 3, b: 2, km: 6, ab: 14, coeff: 1, rad: 14, fc: 6 },
    ];
    const cfg = rng.pick(configs);
    const params = { k1: cfg.k1, a: cfg.a, k2: cfg.k2, b: cfg.b };
    const answerStr = surdStr(cfg.fc, cfg.rad);
    return {
      id: makeId("medium", "multiply_with_coeff_c", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "multiply_with_coeff_c",
      prompt: `Simplify (${surdStr(cfg.k1, cfg.a)})(${surdStr(cfg.k2, cfg.b)})`,
      answer: answerStr,
      worked_solution: [
        `Multiply coefficients: ${cfg.k1} × ${cfg.k2} = ${cfg.km}`,
        `Multiply radicands: √${cfg.a} × √${cfg.b} = √${cfg.ab}`,
        `Simplify √${cfg.ab} = ${surdStr(cfg.coeff, cfg.rad)}`,
        `${cfg.km} × ${surdStr(cfg.coeff, cfg.rad)} = ${answerStr}`,
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_under_root"], estimated_time_sec: 35 }
    };
  },

  "multiply_with_coeff_d": (rng) => {
    const configs = [
      { k1: 5, a: 3, k2: 2, b: 3, km: 10, ab: 9, answer: "30" },
      { k1: 3, a: 7, k2: 4, b: 7, km: 12, ab: 49, answer: "84" },
      { k1: 2, a: 5, k2: 6, b: 5, km: 12, ab: 25, answer: "60" },
      { k1: 4, a: 2, k2: 3, b: 2, km: 12, ab: 4, answer: "24" },
    ];
    const cfg = rng.pick(configs);
    const params = { k1: cfg.k1, a: cfg.a, k2: cfg.k2, b: cfg.b };
    return {
      id: makeId("medium", "multiply_with_coeff_d", params),
      topic: "operations_with_surds", difficulty: "medium", archetype: "multiply_with_coeff_d",
      prompt: `Simplify (${surdStr(cfg.k1, cfg.a)})(${surdStr(cfg.k2, cfg.b)})`,
      answer: cfg.answer,
      worked_solution: [
        `Multiply coefficients: ${cfg.k1} × ${cfg.k2} = ${cfg.km}`,
        `Multiply radicands: √${cfg.a} × √${cfg.b} = √${cfg.ab}`,
        `√${cfg.ab} = ${Math.round(Math.sqrt(cfg.ab))}`,
        `${cfg.km} × ${Math.round(Math.sqrt(cfg.ab))} = ${cfg.answer}`,
      ],
      metadata: { params, skills: ["multiply_surds", "simplify_under_root"], estimated_time_sec: 30 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "expand_linear_a": (rng) => {
    const configs = [
      { k: 2, m: 3, p: 1, q: 2, base: 5,
        kp: 2, kqB: "4√5", mpB: "3√5", mqBase: 30,
        rational: 32, surdCoeff: 7, answer: "32 + 7√5" },
      { k: 3, m: 1, p: 2, q: 3, base: 2,
        kp: 6, kqB: "9√2", mpB: "2√2", mqBase: 4,
        rational: 10, surdCoeff: 11, answer: "10 + 11√2" },
      { k: 1, m: 2, p: 3, q: 1, base: 3,
        kp: 3, kqB: "√3", mpB: "6√3", mqBase: 9,
        rational: 9, surdCoeff: 7, answer: "9 + 7√3" },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, m: cfg.m, p: cfg.p, q: cfg.q, base: cfg.base };
    return {
      id: makeId("hard", "expand_linear_a", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "expand_linear_a",
      prompt: `Expand and simplify (${cfg.k} + ${cfg.m}√${cfg.base})(${cfg.p} + ${cfg.q}√${cfg.base})`,
      answer: cfg.answer,
      worked_solution: [
        `Use FOIL: (${cfg.k} + ${cfg.m}√${cfg.base})(${cfg.p} + ${cfg.q}√${cfg.base})`,
        `First: ${cfg.k} × ${cfg.p} = ${cfg.kp}`,
        `Outer: ${cfg.k} × ${cfg.q}√${cfg.base} = ${cfg.kqB}`,
        `Inner: ${cfg.m}√${cfg.base} × ${cfg.p} = ${cfg.mpB}`,
        `Last: ${cfg.m}√${cfg.base} × ${cfg.q}√${cfg.base} = ${cfg.m * cfg.q} × ${cfg.base} = ${cfg.m * cfg.q * cfg.base}`,
        `Combine: ${cfg.kp} + ${cfg.m * cfg.q * cfg.base} + (${cfg.kqB} + ${cfg.mpB})`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds"], estimated_time_sec: 50 }
    };
  },

  "expand_linear_b": (rng) => {
    const configs = [
      { k: 4, m: 1, p: 2, q: 3, base: 7,
        rational: 29, surdCoeff: 14, answer: "29 + 14√7" },
      { k: 5, m: 2, p: 1, q: 3, base: 3,
        rational: 23, surdCoeff: 17, answer: "23 + 17√3" },
      { k: 3, m: 4, p: 2, q: 1, base: 5,
        rational: 26, surdCoeff: 11, answer: "26 + 11√5" },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, m: cfg.m, p: cfg.p, q: cfg.q, base: cfg.base };
    return {
      id: makeId("hard", "expand_linear_b", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "expand_linear_b",
      prompt: `Expand and simplify (${cfg.k} + ${cfg.m}√${cfg.base})(${cfg.p} + ${cfg.q}√${cfg.base})`,
      answer: cfg.answer,
      worked_solution: [
        `Use FOIL: (${cfg.k} + ${cfg.m}√${cfg.base})(${cfg.p} + ${cfg.q}√${cfg.base})`,
        `First: ${cfg.k} × ${cfg.p} = ${cfg.k * cfg.p}`,
        `Outer + Inner give surd terms with √${cfg.base}`,
        `Last: ${cfg.m}√${cfg.base} × ${cfg.q}√${cfg.base} = ${cfg.m * cfg.q * cfg.base}`,
        `Rational parts: ${cfg.k * cfg.p} + ${cfg.m * cfg.q * cfg.base} = ${cfg.rational}`,
        `Surd parts combine to ${cfg.surdCoeff}√${cfg.base}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds"], estimated_time_sec: 50 }
    };
  },

  "expand_diff_squares_a": (rng) => {
    const configs = [
      { k: 3, base: 2, answer: "7" },
      { k: 4, base: 3, answer: "13" },
      { k: 5, base: 2, answer: "23" },
      { k: 2, base: 5, answer: "-1" },
      { k: 1, base: 7, answer: "-6" },
    ];
    const cfg = rng.pick(configs);
    const kSq = cfg.k * cfg.k;
    const result = kSq - cfg.base;
    const params = { k: cfg.k, base: cfg.base };
    return {
      id: makeId("hard", "expand_diff_squares_a", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "expand_diff_squares_a",
      prompt: `Expand and simplify (${cfg.k} + √${cfg.base})(${cfg.k} − √${cfg.base})`,
      answer: cfg.answer,
      worked_solution: [
        `This is a difference of squares: (a + b)(a − b) = a² − b²`,
        `a = ${cfg.k}, b = √${cfg.base}`,
        `= ${cfg.k}² − (√${cfg.base})²`,
        `= ${kSq} − ${cfg.base}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares"], estimated_time_sec: 30 }
    };
  },

  "expand_diff_squares_b": (rng) => {
    const configs = [
      { a: 2, b: 3, answer: "-1" },
      { a: 5, b: 3, answer: "2" },
      { a: 7, b: 2, answer: "5" },
      { a: 5, b: 2, answer: "3" },
      { a: 11, b: 7, answer: "4" },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("hard", "expand_diff_squares_b", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "expand_diff_squares_b",
      prompt: `Expand and simplify (√${cfg.a} + √${cfg.b})(√${cfg.a} − √${cfg.b})`,
      answer: cfg.answer,
      worked_solution: [
        `This is a difference of squares: (a + b)(a − b) = a² − b²`,
        `a = √${cfg.a}, b = √${cfg.b}`,
        `= (√${cfg.a})² − (√${cfg.b})²`,
        `= ${cfg.a} − ${cfg.b}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares"], estimated_time_sec: 30 }
    };
  },

  "simplify_expression_a": (rng) => {
    const configs = [
      {
        expr: "2√3 + √12 − √27",
        steps: [
          "Simplify: √12 = 2√3, √27 = 3√3",
          "Expression becomes: 2√3 + 2√3 − 3√3",
          "All are like surds (√3)",
          "= (2 + 2 − 3)√3 = √3",
        ],
        answer: "√3",
      },
      {
        expr: "3√8 − √18 + √50",
        steps: [
          "Simplify: √8 = 2√2, √18 = 3√2, √50 = 5√2",
          "Expression becomes: 3(2√2) − 3√2 + 5√2",
          "= 6√2 − 3√2 + 5√2",
          "All are like surds (√2)",
          "= (6 − 3 + 5)√2 = 8√2",
        ],
        answer: "8√2",
      },
      {
        expr: "√75 + 2√12 − 3√3",
        steps: [
          "Simplify: √75 = 5√3, √12 = 2√3",
          "Expression becomes: 5√3 + 2(2√3) − 3√3",
          "= 5√3 + 4√3 − 3√3",
          "All are like surds (√3)",
          "= (5 + 4 − 3)√3 = 6√3",
        ],
        answer: "6√3",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "simplify_expression_a", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "simplify_expression_a",
      prompt: `Simplify ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "combine_like_surds", "simplify_expression"], estimated_time_sec: 45 }
    };
  },

  "simplify_expression_b": (rng) => {
    const configs = [
      {
        expr: "√45 − √20 + √80",
        steps: [
          "Simplify: √45 = 3√5, √20 = 2√5, √80 = 4√5",
          "All are like surds (√5)",
          "= 3√5 − 2√5 + 4√5",
          "= (3 − 2 + 4)√5 = 5√5",
        ],
        answer: "5√5",
      },
      {
        expr: "2√50 − 3√8 + √32",
        steps: [
          "Simplify: √50 = 5√2, √8 = 2√2, √32 = 4√2",
          "Expression becomes: 2(5√2) − 3(2√2) + 4√2",
          "= 10√2 − 6√2 + 4√2",
          "All are like surds (√2)",
          "= (10 − 6 + 4)√2 = 8√2",
        ],
        answer: "8√2",
      },
      {
        expr: "4√27 − 2√48 + √75",
        steps: [
          "Simplify: √27 = 3√3, √48 = 4√3, √75 = 5√3",
          "Expression becomes: 4(3√3) − 2(4√3) + 5√3",
          "= 12√3 − 8√3 + 5√3",
          "All are like surds (√3)",
          "= (12 − 8 + 5)√3 = 9√3",
        ],
        answer: "9√3",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "simplify_expression_b", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "simplify_expression_b",
      prompt: `Simplify ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "combine_like_surds", "simplify_expression"], estimated_time_sec: 45 }
    };
  },

  "expand_linear_c": (rng) => {
    const configs = [
      { k: 2, m: 1, p: 3, q: -1, base: 5,
        rational: 1, surdCoeff: 1, answer: "1 + √5" },
      { k: 3, m: 2, p: 1, q: -1, base: 2,
        rational: -1, surdCoeff: -1, answer: "-1 − √2" },
      { k: 4, m: 1, p: 2, q: -3, base: 3,
        rational: -1, surdCoeff: -10, answer: "-1 − 10√3" },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, m: cfg.m, p: cfg.p, q: cfg.q, base: cfg.base };
    const qSign = cfg.q < 0 ? "−" : "+";
    const qAbs = Math.abs(cfg.q);
    const promptQ = qAbs === 1 ? `${qSign} √${cfg.base}` : `${qSign} ${qAbs}√${cfg.base}`;
    return {
      id: makeId("hard", "expand_linear_c", params),
      topic: "operations_with_surds", difficulty: "hard", archetype: "expand_linear_c",
      prompt: `Expand and simplify (${cfg.k} + ${cfg.m === 1 ? "" : cfg.m}√${cfg.base})(${cfg.p} ${promptQ})`,
      answer: cfg.answer,
      worked_solution: [
        `Use FOIL to expand the brackets`,
        `Multiply each term in the first bracket by each term in the second`,
        `Collect rational terms and surd terms separately`,
        `Rational: ${cfg.rational}, Surd: ${cfg.surdCoeff === 1 ? "" : cfg.surdCoeff === -1 ? "-" : cfg.surdCoeff}√${cfg.base}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds"], estimated_time_sec: 50 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "square_binomial_a": (rng) => {
    const configs = [
      { a: 2, b: 3, answer: `5 + 2√6` },
      { a: 3, b: 5, answer: `8 + 2√15` },
      { a: 5, b: 7, answer: `12 + 2√35` },
      { a: 2, b: 7, answer: `9 + 2√14` },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("challenge", "square_binomial_a", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "square_binomial_a",
      prompt: `Expand and simplify (√${cfg.a} + √${cfg.b})²`,
      answer: cfg.answer,
      worked_solution: [
        `(√${cfg.a} + √${cfg.b})² = (√${cfg.a})² + 2(√${cfg.a})(√${cfg.b}) + (√${cfg.b})²`,
        `= ${cfg.a} + 2√${cfg.a * cfg.b} + ${cfg.b}`,
        `= ${cfg.a + cfg.b} + 2√${cfg.a * cfg.b}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds", "structure_recognition"], estimated_time_sec: 40 }
    };
  },

  "square_binomial_b": (rng) => {
    const configs = [
      { k: 3, a: 2, answer: "11 + 6√2" },
      { k: 2, a: 5, answer: "9 + 4√5" },
      { k: 4, a: 3, answer: "19 + 8√3" },
      { k: 5, a: 2, answer: "27 + 10√2" },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, a: cfg.a };
    const kSq = cfg.k * cfg.k;
    return {
      id: makeId("challenge", "square_binomial_b", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "square_binomial_b",
      prompt: `Expand and simplify (${cfg.k} + √${cfg.a})²`,
      answer: cfg.answer,
      worked_solution: [
        `(${cfg.k} + √${cfg.a})² = ${cfg.k}² + 2(${cfg.k})(√${cfg.a}) + (√${cfg.a})²`,
        `= ${kSq} + ${2 * cfg.k}√${cfg.a} + ${cfg.a}`,
        `= ${kSq + cfg.a} + ${2 * cfg.k}√${cfg.a}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds", "structure_recognition"], estimated_time_sec: 40 }
    };
  },

  "product_conjugates_a": (rng) => {
    const configs = [
      { a: 7, b: 3, answer: "4" },
      { a: 11, b: 5, answer: "6" },
      { a: 13, b: 7, answer: "6" },
      { a: 10, b: 3, answer: "7" },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("challenge", "product_conjugates_a", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "product_conjugates_a",
      prompt: `Expand and simplify (√${cfg.a} + √${cfg.b})(√${cfg.a} − √${cfg.b})`,
      answer: cfg.answer,
      worked_solution: [
        `This is a difference of squares: (a + b)(a − b) = a² − b²`,
        `a = √${cfg.a}, b = √${cfg.b}`,
        `= (√${cfg.a})² − (√${cfg.b})²`,
        `= ${cfg.a} − ${cfg.b}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares", "structure_recognition"], estimated_time_sec: 35 }
    };
  },

  "product_conjugates_b": (rng) => {
    const configs = [
      { k: 3, a: 5, answer: "4" },
      { k: 4, a: 7, answer: "9" },
      { k: 2, a: 3, answer: "1" },
      { k: 5, a: 11, answer: "14" },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, a: cfg.a };
    return {
      id: makeId("challenge", "product_conjugates_b", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "product_conjugates_b",
      prompt: `Expand and simplify (${cfg.k} + √${cfg.a})(${cfg.k} − √${cfg.a})`,
      answer: cfg.answer,
      worked_solution: [
        `This is a difference of squares: (a + b)(a − b) = a² − b²`,
        `a = ${cfg.k}, b = √${cfg.a}`,
        `= ${cfg.k}² − (√${cfg.a})²`,
        `= ${cfg.k * cfg.k} − ${cfg.a}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "difference_of_squares", "structure_recognition"], estimated_time_sec: 35 }
    };
  },

  "multi_term_a": (rng) => {
    const configs = [
      {
        expr: "3√8 + 2√18 − √50",
        steps: [
          "Simplify each surd: √8 = 2√2, √18 = 3√2, √50 = 5√2",
          "3(2√2) + 2(3√2) − 5√2",
          "= 6√2 + 6√2 − 5√2",
          "All are like surds (√2)",
          "= (6 + 6 − 5)√2 = 7√2",
        ],
        answer: "7√2",
      },
      {
        expr: "2√45 − √20 + 3√5",
        steps: [
          "Simplify each surd: √45 = 3√5, √20 = 2√5",
          "2(3√5) − 2√5 + 3√5",
          "= 6√5 − 2√5 + 3√5",
          "All are like surds (√5)",
          "= (6 − 2 + 3)√5 = 7√5",
        ],
        answer: "7√5",
      },
      {
        expr: "√75 − 2√27 + 4√12",
        steps: [
          "Simplify each surd: √75 = 5√3, √27 = 3√3, √12 = 2√3",
          "5√3 − 2(3√3) + 4(2√3)",
          "= 5√3 − 6√3 + 8√3",
          "All are like surds (√3)",
          "= (5 − 6 + 8)√3 = 7√3",
        ],
        answer: "7√3",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "multi_term_a", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "multi_term_a",
      prompt: `Simplify ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "combine_like_surds", "simplify_expression", "structure_recognition"], estimated_time_sec: 50 }
    };
  },

  "multi_term_mixed": (rng) => {
    const configs = [
      {
        expr: "√12 + √18 − √27",
        steps: [
          "Simplify: √12 = 2√3, √18 = 3√2, √27 = 3√3",
          "= 2√3 + 3√2 − 3√3",
          "Combine like surds (√3 terms): 2√3 − 3√3 = −√3",
          "= 3√2 − √3",
        ],
        answer: "3√2 − √3",
      },
      {
        expr: "2√50 + √75 − 3√8",
        steps: [
          "Simplify: √50 = 5√2, √75 = 5√3, √8 = 2√2",
          "= 2(5√2) + 5√3 − 3(2√2)",
          "= 10√2 + 5√3 − 6√2",
          "Combine like surds (√2 terms): 10√2 − 6√2 = 4√2",
          "= 4√2 + 5√3",
        ],
        answer: "4√2 + 5√3",
      },
      {
        expr: "√45 + 2√8 − √20",
        steps: [
          "Simplify: √45 = 3√5, √8 = 2√2, √20 = 2√5",
          "= 3√5 + 2(2√2) − 2√5",
          "= 3√5 + 4√2 − 2√5",
          "Combine like surds (√5 terms): 3√5 − 2√5 = √5",
          "= √5 + 4√2",
        ],
        answer: "√5 + 4√2",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "multi_term_mixed", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "multi_term_mixed",
      prompt: `Simplify ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["simplify_surd", "combine_like_surds", "simplify_expression", "structure_recognition"], estimated_time_sec: 55 }
    };
  },

  "square_binomial_sub": (rng) => {
    const configs = [
      { a: 3, b: 2, answer: `5 − 2√6` },
      { a: 5, b: 3, answer: `8 − 2√15` },
      { a: 7, b: 2, answer: `9 − 2√14` },
      { a: 5, b: 2, answer: `7 − 2√10` },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("challenge", "square_binomial_sub", params),
      topic: "operations_with_surds", difficulty: "challenge", archetype: "square_binomial_sub",
      prompt: `Expand and simplify (√${cfg.a} − √${cfg.b})²`,
      answer: cfg.answer,
      worked_solution: [
        `(√${cfg.a} − √${cfg.b})² = (√${cfg.a})² − 2(√${cfg.a})(√${cfg.b}) + (√${cfg.b})²`,
        `= ${cfg.a} − 2√${cfg.a * cfg.b} + ${cfg.b}`,
        `= ${cfg.a + cfg.b} − 2√${cfg.a * cfg.b}`,
        `= ${cfg.answer}`,
      ],
      metadata: { params, skills: ["expand_brackets", "combine_like_surds", "structure_recognition"], estimated_time_sec: 40 }
    };
  },
};

const ALL_ARCHETYPES: Record<string, Record<string, ArchetypeGenerator>> = {
  easy: EASY_ARCHETYPES,
  medium: MEDIUM_ARCHETYPES,
  hard: HARD_ARCHETYPES,
  challenge: CHALLENGE_ARCHETYPES,
};

export function generateQuestion(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  seed?: number,
): GeneratedQuestion {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = ALL_ARCHETYPES[difficulty];
  const keys = Object.keys(archetypes);
  const key = rng.pick(keys);
  return archetypes[key](rng);
}

export function generatePool(
  difficulty: "easy" | "medium" | "hard" | "challenge",
  n: number,
  seed?: number,
  ensureUnique: boolean = true,
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const archetypes = ALL_ARCHETYPES[difficulty];
  const keys = Object.keys(archetypes);
  const results: GeneratedQuestion[] = [];
  const usedIds = new Set<string>();
  let attempts = 0;

  while (results.length < n && attempts < n * 50) {
    attempts++;
    const key = rng.pick(keys);
    const q = archetypes[key](rng);
    if (ensureUnique && usedIds.has(q.id)) continue;
    usedIds.add(q.id);
    results.push(q);
  }

  return results;
}

export function generateMixedPool(
  config: { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number }[],
  seed?: number,
): GeneratedQuestion[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const results: GeneratedQuestion[] = [];
  const usedIds = new Set<string>();

  for (const { difficulty, count } of config) {
    const archetypes = ALL_ARCHETYPES[difficulty];
    const keys = Object.keys(archetypes);
    let added = 0;
    let attempts = 0;

    while (added < count && attempts < count * 50) {
      attempts++;
      const key = rng.pick(keys);
      const q = archetypes[key](rng);
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      results.push(q);
      added++;
    }
  }

  return results;
}
