import { createHash } from "crypto";

export interface GeneratedQuestion {
  id: string;
  topic: "simplifying_surds";
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
  return `${coeff}√${radicand}`;
}

function largestSquareFactor(n: number): number {
  let factor = 1;
  for (const p of [2, 3, 5, 7, 11, 13]) {
    const sq = p * p;
    while (n % sq === 0) {
      factor *= sq;
      n = n / sq;
    }
  }
  return factor;
}

function isSquareFree(n: number): boolean {
  return simplifySurd(n).radicand === n;
}

type ArchetypeGenerator = (rng: SeededRandom) => GeneratedQuestion;

const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "simplify_small_a": (rng) => {
    const configs = [
      { n: 8, sq: 4, rem: 2, coeff: 2 },
      { n: 12, sq: 4, rem: 3, coeff: 2 },
      { n: 18, sq: 9, rem: 2, coeff: 3 },
      { n: 20, sq: 4, rem: 5, coeff: 2 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_small_a", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_small_a",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_small_b": (rng) => {
    const configs = [
      { n: 27, sq: 9, rem: 3, coeff: 3 },
      { n: 45, sq: 9, rem: 5, coeff: 3 },
      { n: 50, sq: 25, rem: 2, coeff: 5 },
      { n: 75, sq: 25, rem: 3, coeff: 5 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_small_b", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_small_b",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_small_c": (rng) => {
    const configs = [
      { n: 28, sq: 4, rem: 7, coeff: 2 },
      { n: 32, sq: 16, rem: 2, coeff: 4 },
      { n: 44, sq: 4, rem: 11, coeff: 2 },
      { n: 48, sq: 16, rem: 3, coeff: 4 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_small_c", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_small_c",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 25 }
    };
  },

  "simplify_small_d": (rng) => {
    const configs = [
      { n: 63, sq: 9, rem: 7, coeff: 3 },
      { n: 72, sq: 36, rem: 2, coeff: 6 },
      { n: 80, sq: 16, rem: 5, coeff: 4 },
      { n: 98, sq: 49, rem: 2, coeff: 7 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_small_d", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_small_d",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 30 }
    };
  },

  "simplify_single_e": (rng) => {
    const configs = [
      { n: 90, sq: 9, rem: 10, coeff: 3 },
      { n: 99, sq: 9, rem: 11, coeff: 3 },
      { n: 112, sq: 16, rem: 7, coeff: 4 },
      { n: 125, sq: 25, rem: 5, coeff: 5 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_single_e", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_single_e",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 30 }
    };
  },

  "simplify_single_f": (rng) => {
    const configs = [
      { n: 128, sq: 64, rem: 2, coeff: 8 },
      { n: 147, sq: 49, rem: 3, coeff: 7 },
      { n: 162, sq: 81, rem: 2, coeff: 9 },
      { n: 175, sq: 25, rem: 7, coeff: 5 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_single_f", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_single_f",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 30 }
    };
  },

  "simplify_single_g": (rng) => {
    const configs = [
      { n: 180, sq: 36, rem: 5, coeff: 6 },
      { n: 192, sq: 64, rem: 3, coeff: 8 },
      { n: 200, sq: 100, rem: 2, coeff: 10 },
      { n: 108, sq: 36, rem: 3, coeff: 6 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_single_g", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_single_g",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 30 }
    };
  },

  "simplify_single_h": (rng) => {
    const configs = [
      { n: 150, sq: 25, rem: 6, coeff: 5 },
      { n: 54, sq: 9, rem: 6, coeff: 3 },
      { n: 68, sq: 4, rem: 17, coeff: 2 },
      { n: 52, sq: 4, rem: 13, coeff: 2 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("easy", "simplify_single_h", params),
      topic: "simplifying_surds", difficulty: "easy", archetype: "simplify_single_h",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 25 }
    };
  },
};

const MEDIUM_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "simplify_larger_a": (rng) => {
    const configs = [
      { n: 242, sq: 121, rem: 2, coeff: 11 },
      { n: 288, sq: 144, rem: 2, coeff: 12 },
      { n: 245, sq: 49, rem: 5, coeff: 7 },
      { n: 300, sq: 100, rem: 3, coeff: 10 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("medium", "simplify_larger_a", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "simplify_larger_a",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 35 }
    };
  },

  "simplify_larger_b": (rng) => {
    const configs = [
      { n: 320, sq: 64, rem: 5, coeff: 8 },
      { n: 338, sq: 169, rem: 2, coeff: 13 },
      { n: 363, sq: 121, rem: 3, coeff: 11 },
      { n: 392, sq: 196, rem: 2, coeff: 14 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("medium", "simplify_larger_b", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "simplify_larger_b",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 40 }
    };
  },

  "simplify_larger_c": (rng) => {
    const configs = [
      { n: 405, sq: 81, rem: 5, coeff: 9 },
      { n: 432, sq: 144, rem: 3, coeff: 12 },
      { n: 448, sq: 64, rem: 7, coeff: 8 },
      { n: 500, sq: 100, rem: 5, coeff: 10 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("medium", "simplify_larger_c", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "simplify_larger_c",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 40 }
    };
  },

  "coefficient_surd_a": (rng) => {
    const configs = [
      { k: 3, n: 48, innerCoeff: 4, rem: 3, finalCoeff: 12 },
      { k: 2, n: 75, innerCoeff: 5, rem: 3, finalCoeff: 10 },
      { k: 4, n: 18, innerCoeff: 3, rem: 2, finalCoeff: 12 },
      { k: 5, n: 12, innerCoeff: 2, rem: 3, finalCoeff: 10 },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, n: cfg.n };
    return {
      id: makeId("medium", "coefficient_surd_a", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "coefficient_surd_a",
      prompt: `Simplify ${cfg.k}√${cfg.n}`,
      answer: surdStr(cfg.finalCoeff, cfg.rem),
      worked_solution: [
        `First simplify √${cfg.n}: √${cfg.n} = ${surdStr(cfg.innerCoeff, cfg.rem)}`,
        `${cfg.k} × ${surdStr(cfg.innerCoeff, cfg.rem)} = ${surdStr(cfg.finalCoeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd", "simplify_coefficient"], estimated_time_sec: 30 }
    };
  },

  "coefficient_surd_b": (rng) => {
    const configs = [
      { k: 2, n: 50, innerCoeff: 5, rem: 2, finalCoeff: 10 },
      { k: 3, n: 20, innerCoeff: 2, rem: 5, finalCoeff: 6 },
      { k: 6, n: 8, innerCoeff: 2, rem: 2, finalCoeff: 12 },
      { k: 2, n: 98, innerCoeff: 7, rem: 2, finalCoeff: 14 },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, n: cfg.n };
    return {
      id: makeId("medium", "coefficient_surd_b", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "coefficient_surd_b",
      prompt: `Simplify ${cfg.k}√${cfg.n}`,
      answer: surdStr(cfg.finalCoeff, cfg.rem),
      worked_solution: [
        `First simplify √${cfg.n}: √${cfg.n} = ${surdStr(cfg.innerCoeff, cfg.rem)}`,
        `${cfg.k} × ${surdStr(cfg.innerCoeff, cfg.rem)} = ${surdStr(cfg.finalCoeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd", "simplify_coefficient"], estimated_time_sec: 30 }
    };
  },

  "coefficient_surd_c": (rng) => {
    const configs = [
      { k: 3, n: 32, innerCoeff: 4, rem: 2, finalCoeff: 12 },
      { k: 4, n: 27, innerCoeff: 3, rem: 3, finalCoeff: 12 },
      { k: 2, n: 72, innerCoeff: 6, rem: 2, finalCoeff: 12 },
      { k: 5, n: 28, innerCoeff: 2, rem: 7, finalCoeff: 10 },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, n: cfg.n };
    return {
      id: makeId("medium", "coefficient_surd_c", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "coefficient_surd_c",
      prompt: `Simplify ${cfg.k}√${cfg.n}`,
      answer: surdStr(cfg.finalCoeff, cfg.rem),
      worked_solution: [
        `First simplify √${cfg.n}: √${cfg.n} = ${surdStr(cfg.innerCoeff, cfg.rem)}`,
        `${cfg.k} × ${surdStr(cfg.innerCoeff, cfg.rem)} = ${surdStr(cfg.finalCoeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd", "simplify_coefficient"], estimated_time_sec: 30 }
    };
  },

  "coefficient_surd_d": (rng) => {
    const configs = [
      { k: 2, n: 45, innerCoeff: 3, rem: 5, finalCoeff: 6 },
      { k: 3, n: 80, innerCoeff: 4, rem: 5, finalCoeff: 12 },
      { k: 4, n: 50, innerCoeff: 5, rem: 2, finalCoeff: 20 },
      { k: 2, n: 128, innerCoeff: 8, rem: 2, finalCoeff: 16 },
    ];
    const cfg = rng.pick(configs);
    const params = { k: cfg.k, n: cfg.n };
    return {
      id: makeId("medium", "coefficient_surd_d", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "coefficient_surd_d",
      prompt: `Simplify ${cfg.k}√${cfg.n}`,
      answer: surdStr(cfg.finalCoeff, cfg.rem),
      worked_solution: [
        `First simplify √${cfg.n}: √${cfg.n} = ${surdStr(cfg.innerCoeff, cfg.rem)}`,
        `${cfg.k} × ${surdStr(cfg.innerCoeff, cfg.rem)} = ${surdStr(cfg.finalCoeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd", "simplify_coefficient"], estimated_time_sec: 30 }
    };
  },

  "simplify_larger_d": (rng) => {
    const configs = [
      { n: 252, sq: 36, rem: 7, coeff: 6 },
      { n: 396, sq: 36, rem: 11, coeff: 6 },
      { n: 350, sq: 25, rem: 14, coeff: 5 },
      { n: 275, sq: 25, rem: 11, coeff: 5 },
    ];
    const cfg = rng.pick(configs);
    const params = { n: cfg.n };
    return {
      id: makeId("medium", "simplify_larger_d", params),
      topic: "simplifying_surds", difficulty: "medium", archetype: "simplify_larger_d",
      prompt: `Simplify √${cfg.n}`,
      answer: surdStr(cfg.coeff, cfg.rem),
      worked_solution: [
        `${cfg.n} = ${cfg.sq} × ${cfg.rem}`,
        `√${cfg.n} = √${cfg.sq} × √${cfg.rem}`,
        `√${cfg.sq} = ${cfg.coeff}`,
        `So √${cfg.n} = ${surdStr(cfg.coeff, cfg.rem)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "simplify_surd"], estimated_time_sec: 35 }
    };
  },
};

const HARD_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "add_like_after_simplify_a": (rng) => {
    const configs = [
      { expr: "3√8 + 2√18", n1: 8, n2: 18, c1: 3, c2: 2, rad: 2, s1: 6, s2: 6, total: 12 },
      { expr: "√12 + √27", n1: 12, n2: 27, c1: 1, c2: 1, rad: 3, s1: 2, s2: 3, total: 5 },
      { expr: "2√50 + 3√8", n1: 50, n2: 8, c1: 2, c2: 3, rad: 2, s1: 10, s2: 6, total: 16 },
      { expr: "√75 + 2√12", n1: 75, n2: 12, c1: 1, c2: 2, rad: 3, s1: 5, s2: 4, total: 9 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "add_like_after_simplify_a", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "add_like_after_simplify_a",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1 > 1 ? cfg.c1 : ""}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 : ""}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Both are like surds (√${cfg.rad})`,
        `Combine: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },

  "add_like_after_simplify_b": (rng) => {
    const configs = [
      { expr: "5√20 + 2√45", n1: 20, n2: 45, c1: 5, c2: 2, rad: 5, s1: 10, s2: 6, total: 16 },
      { expr: "4√18 + √72", n1: 18, n2: 72, c1: 4, c2: 1, rad: 2, s1: 12, s2: 6, total: 18 },
      { expr: "2√27 + 3√48", n1: 27, n2: 48, c1: 2, c2: 3, rad: 3, s1: 6, s2: 12, total: 18 },
      { expr: "√32 + √98", n1: 32, n2: 98, c1: 1, c2: 1, rad: 2, s1: 4, s2: 7, total: 11 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "add_like_after_simplify_b", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "add_like_after_simplify_b",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1 > 1 ? cfg.c1 : ""}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 : ""}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Both are like surds (√${cfg.rad})`,
        `Combine: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },

  "subtract_like_after_simplify_a": (rng) => {
    const configs = [
      { expr: "5√12 − √75", n1: 12, n2: 75, c1: 5, c2: 1, rad: 3, s1: 10, s2: 5, total: 5 },
      { expr: "4√50 − 3√18", n1: 50, n2: 18, c1: 4, c2: 3, rad: 2, s1: 20, s2: 9, total: 11 },
      { expr: "3√32 − √128", n1: 32, n2: 128, c1: 3, c2: 1, rad: 2, s1: 12, s2: 8, total: 4 },
      { expr: "6√8 − √32", n1: 8, n2: 32, c1: 6, c2: 1, rad: 2, s1: 12, s2: 4, total: 8 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "subtract_like_after_simplify_a", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "subtract_like_after_simplify_a",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1 > 1 ? cfg.c1 : ""}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 : ""}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Both are like surds (√${cfg.rad})`,
        `Combine: ${cfg.s1}√${cfg.rad} − ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },

  "subtract_like_after_simplify_b": (rng) => {
    const configs = [
      { expr: "3√45 − 2√20", n1: 45, n2: 20, c1: 3, c2: 2, rad: 5, s1: 9, s2: 4, total: 5 },
      { expr: "4√27 − √48", n1: 27, n2: 48, c1: 4, c2: 1, rad: 3, s1: 12, s2: 4, total: 8 },
      { expr: "5√18 − 2√72", n1: 18, n2: 72, c1: 5, c2: 2, rad: 2, s1: 15, s2: 12, total: 3 },
      { expr: "2√75 − 3√12", n1: 75, n2: 12, c1: 2, c2: 3, rad: 3, s1: 10, s2: 6, total: 4 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "subtract_like_after_simplify_b", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "subtract_like_after_simplify_b",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1 > 1 ? cfg.c1 : ""}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 : ""}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Both are like surds (√${cfg.rad})`,
        `Combine: ${cfg.s1}√${cfg.rad} − ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },

  "mixed_not_like_a": (rng) => {
    const configs = [
      {
        expr: "√8 + √27",
        steps: ["√8 = 2√2", "√27 = 3√3", "These are unlike surds (√2 and √3)", "Cannot simplify further: 2√2 + 3√3"],
        answer: "2√2 + 3√3",
      },
      {
        expr: "√12 + √50",
        steps: ["√12 = 2√3", "√50 = 5√2", "These are unlike surds (√3 and √2)", "Cannot simplify further: 2√3 + 5√2"],
        answer: "2√3 + 5√2",
      },
      {
        expr: "3√20 + 2√18",
        steps: ["3√20 = 3 × 2√5 = 6√5", "2√18 = 2 × 3√2 = 6√2", "These are unlike surds (√5 and √2)", "Cannot simplify further: 6√5 + 6√2"],
        answer: "6√5 + 6√2",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "mixed_not_like_a", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "mixed_not_like_a",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "recognise_unlike_surds"], estimated_time_sec: 40 }
    };
  },

  "mixed_not_like_b": (rng) => {
    const configs = [
      {
        expr: "√45 − √32",
        steps: ["√45 = 3√5", "√32 = 4√2", "These are unlike surds (√5 and √2)", "Cannot simplify further: 3√5 − 4√2"],
        answer: "3√5 − 4√2",
      },
      {
        expr: "2√28 + √75",
        steps: ["2√28 = 2 × 2√7 = 4√7", "√75 = 5√3", "These are unlike surds (√7 and √3)", "Cannot simplify further: 4√7 + 5√3"],
        answer: "4√7 + 5√3",
      },
      {
        expr: "√50 − √63",
        steps: ["√50 = 5√2", "√63 = 3√7", "These are unlike surds (√2 and √7)", "Cannot simplify further: 5√2 − 3√7"],
        answer: "5√2 − 3√7",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "mixed_not_like_b", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "mixed_not_like_b",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "recognise_unlike_surds"], estimated_time_sec: 40 }
    };
  },

  "add_like_after_simplify_c": (rng) => {
    const configs = [
      { expr: "√80 + 3√45", n1: 80, n2: 45, c1: 1, c2: 3, rad: 5, s1: 4, s2: 9, total: 13 },
      { expr: "2√63 + √28", n1: 63, n2: 28, c1: 2, c2: 1, rad: 7, s1: 6, s2: 2, total: 8 },
      { expr: "√98 + 3√50", n1: 98, n2: 50, c1: 1, c2: 3, rad: 2, s1: 7, s2: 15, total: 22 },
      { expr: "2√48 + √108", n1: 48, n2: 108, c1: 2, c2: 1, rad: 3, s1: 8, s2: 6, total: 14 },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("hard", "add_like_after_simplify_c", params),
      topic: "simplifying_surds", difficulty: "hard", archetype: "add_like_after_simplify_c",
      prompt: `Simplify: ${cfg.expr}`,
      answer: surdStr(cfg.total, cfg.rad),
      worked_solution: [
        `Simplify each surd: ${cfg.c1 > 1 ? cfg.c1 : ""}√${cfg.n1} = ${surdStr(cfg.s1, cfg.rad)}`,
        `${cfg.c2 > 1 ? cfg.c2 : ""}√${cfg.n2} = ${surdStr(cfg.s2, cfg.rad)}`,
        `Both are like surds (√${cfg.rad})`,
        `Combine: ${cfg.s1}√${cfg.rad} + ${cfg.s2}√${cfg.rad} = ${surdStr(cfg.total, cfg.rad)}`,
      ],
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds"], estimated_time_sec: 45 }
    };
  },
};

const CHALLENGE_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "multi_term_simplify_a": (rng) => {
    const configs = [
      {
        expr: "3√12 + 2√27 − √3",
        steps: [
          "3√12 = 3 × 2√3 = 6√3",
          "2√27 = 2 × 3√3 = 6√3",
          "−√3 stays as −√3",
          "6√3 + 6√3 − √3 = 11√3",
        ],
        answer: "11√3",
      },
      {
        expr: "2√45 − 3√20 + √5",
        steps: [
          "2√45 = 2 × 3√5 = 6√5",
          "3√20 = 3 × 2√5 = 6√5",
          "+√5 stays as +√5",
          "6√5 − 6√5 + √5 = √5",
        ],
        answer: "√5",
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
      id: makeId("challenge", "multi_term_simplify_a", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "multi_term_simplify_a",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds", "simplify_expression"], estimated_time_sec: 55 }
    };
  },

  "multi_term_simplify_b": (rng) => {
    const configs = [
      {
        expr: "4√18 − √50 + 2√8",
        steps: [
          "4√18 = 4 × 3√2 = 12√2",
          "√50 = 5√2",
          "2√8 = 2 × 2√2 = 4√2",
          "12√2 − 5√2 + 4√2 = 11√2",
        ],
        answer: "11√2",
      },
      {
        expr: "5√28 − 2√63 + √112",
        steps: [
          "5√28 = 5 × 2√7 = 10√7",
          "2√63 = 2 × 3√7 = 6√7",
          "√112 = 4√7",
          "10√7 − 6√7 + 4√7 = 8√7",
        ],
        answer: "8√7",
      },
      {
        expr: "3√50 + √72 − 2√32",
        steps: [
          "3√50 = 3 × 5√2 = 15√2",
          "√72 = 6√2",
          "2√32 = 2 × 4√2 = 8√2",
          "15√2 + 6√2 − 8√2 = 13√2",
        ],
        answer: "13√2",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "multi_term_simplify_b", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "multi_term_simplify_b",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds", "simplify_expression"], estimated_time_sec: 55 }
    };
  },

  "expand_then_simplify_a": (rng) => {
    const configs = [
      {
        a: 8, b: 2,
        prompt: "(√8 + √2)²",
        steps: [
          "√8 = 2√2, so (2√2 + √2)² = (3√2)²",
          "(3√2)² = 9 × 2 = 18",
        ],
        answer: "18",
      },
      {
        a: 12, b: 3,
        prompt: "(√12 + √3)²",
        steps: [
          "√12 = 2√3, so (2√3 + √3)² = (3√3)²",
          "(3√3)² = 9 × 3 = 27",
        ],
        answer: "27",
      },
      {
        a: 18, b: 2,
        prompt: "(√18 + √2)²",
        steps: [
          "√18 = 3√2, so (3√2 + √2)² = (4√2)²",
          "(4√2)² = 16 × 2 = 32",
        ],
        answer: "32",
      },
      {
        a: 20, b: 5,
        prompt: "(√20 + √5)²",
        steps: [
          "√20 = 2√5, so (2√5 + √5)² = (3√5)²",
          "(3√5)² = 9 × 5 = 45",
        ],
        answer: "45",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("challenge", "expand_then_simplify_a", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "expand_then_simplify_a",
      prompt: `Expand and simplify: ${cfg.prompt}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds", "expand_brackets", "simplify_expression"], estimated_time_sec: 50 }
    };
  },

  "expand_then_simplify_b": (rng) => {
    const configs = [
      {
        a: 12, b: 27,
        prompt: "(√12 + √27)²",
        steps: [
          "√12 = 2√3, √27 = 3√3",
          "(2√3 + 3√3)² = (5√3)²",
          "(5√3)² = 25 × 3 = 75",
        ],
        answer: "75",
      },
      {
        a: 50, b: 8,
        prompt: "(√50 − √8)²",
        steps: [
          "√50 = 5√2, √8 = 2√2",
          "(5√2 − 2√2)² = (3√2)²",
          "(3√2)² = 9 × 2 = 18",
        ],
        answer: "18",
      },
      {
        a: 45, b: 20,
        prompt: "(√45 − √20)²",
        steps: [
          "√45 = 3√5, √20 = 2√5",
          "(3√5 − 2√5)² = (√5)²",
          "(√5)² = 5",
        ],
        answer: "5",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { a: cfg.a, b: cfg.b };
    return {
      id: makeId("challenge", "expand_then_simplify_b", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "expand_then_simplify_b",
      prompt: `Expand and simplify: ${cfg.prompt}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds", "expand_brackets", "simplify_expression"], estimated_time_sec: 55 }
    };
  },

  "simplify_under_root_fraction": (rng) => {
    const configs = [
      {
        p: 50, q: 2,
        prompt: "√(50/2)",
        steps: [
          "50/2 = 25",
          "√25 = 5",
        ],
        answer: "5",
      },
      {
        p: 72, q: 8,
        prompt: "√(72/8)",
        steps: [
          "72/8 = 9",
          "√9 = 3",
        ],
        answer: "3",
      },
      {
        p: 75, q: 3,
        prompt: "√(75/3)",
        steps: [
          "75/3 = 25",
          "√25 = 5",
        ],
        answer: "5",
      },
      {
        p: 48, q: 3,
        prompt: "√(48/3)",
        steps: [
          "48/3 = 16",
          "√16 = 4",
        ],
        answer: "4",
      },
      {
        p: 98, q: 2,
        prompt: "√(98/2)",
        steps: [
          "98/2 = 49",
          "√49 = 7",
        ],
        answer: "7",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { p: cfg.p, q: cfg.q };
    return {
      id: makeId("challenge", "simplify_under_root_fraction", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "simplify_under_root_fraction",
      prompt: `Simplify: ${cfg.prompt}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "simplify_expression"], estimated_time_sec: 35 }
    };
  },

  "multi_term_unlike_mix": (rng) => {
    const configs = [
      {
        expr: "√50 + √12 − √18",
        steps: [
          "√50 = 5√2",
          "√12 = 2√3",
          "√18 = 3√2",
          "Combine like surds: 5√2 − 3√2 = 2√2",
          "Result: 2√2 + 2√3",
        ],
        answer: "2√2 + 2√3",
      },
      {
        expr: "√75 + √8 − √27",
        steps: [
          "√75 = 5√3",
          "√8 = 2√2",
          "√27 = 3√3",
          "Combine like surds: 5√3 − 3√3 = 2√3",
          "Result: 2√3 + 2√2",
        ],
        answer: "2√3 + 2√2",
      },
      {
        expr: "2√45 + √32 − √20",
        steps: [
          "2√45 = 6√5",
          "√32 = 4√2",
          "√20 = 2√5",
          "Combine like surds: 6√5 − 2√5 = 4√5",
          "Result: 4√5 + 4√2",
        ],
        answer: "4√5 + 4√2",
      },
    ];
    const cfg = rng.pick(configs);
    const params = { expr: cfg.expr };
    return {
      id: makeId("challenge", "multi_term_unlike_mix", params),
      topic: "simplifying_surds", difficulty: "challenge", archetype: "multi_term_unlike_mix",
      prompt: `Simplify: ${cfg.expr}`,
      answer: cfg.answer,
      worked_solution: cfg.steps,
      metadata: { params, skills: ["extract_square_factor", "combine_like_surds", "recognise_unlike_surds", "simplify_expression"], estimated_time_sec: 60 }
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
