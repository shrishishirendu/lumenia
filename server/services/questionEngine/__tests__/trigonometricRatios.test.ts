import { generateQuestion, generatePool, generateMixedPool } from "../trigonometricRatios";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

describe("generateQuestion basics", () => {
  it("returns valid question object for each difficulty", () => {
    for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
      const q = generateQuestion(diff, 42);
      assert(!!q, `${diff} question defined`);
      assert(q.topic === "trigonometric_ratios", `${diff} topic correct`);
      assert(q.difficulty === diff, `${diff} difficulty correct`);
      assert(!!q.archetype, `${diff} has archetype`);
      assert(!!q.prompt, `${diff} has prompt`);
      assert(!!q.answer, `${diff} has answer`);
      assert(q.worked_solution.length > 0, `${diff} has worked solution`);
      assert(q.metadata.skills.length > 0, `${diff} has skills`);
      assert(q.metadata.estimated_time_sec > 0, `${diff} has time estimate`);
    }
  });

  it("is deterministic — same seed produces same output", () => {
    for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
      const q1 = generateQuestion(diff, 12345);
      const q2 = generateQuestion(diff, 12345);
      assert(q1.id === q2.id, `${diff} deterministic id`);
      assert(q1.answer === q2.answer, `${diff} deterministic answer`);
      assert(q1.prompt === q2.prompt, `${diff} deterministic prompt`);
      assert(q1.metadata.visual.svg === q2.metadata.visual.svg, `${diff} deterministic svg`);
    }
  });

  it("produces different questions for different seeds", () => {
    const ids = new Set<string>();
    for (let s = 0; s < 50; s++) {
      ids.add(generateQuestion("easy", s * 97).id);
    }
    assert(ids.size > 5, `Unique questions: ${ids.size} > 5`);
  });
});

describe("visual coverage — every question has SVG", () => {
  for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
    it(`all ${diff} questions have SVG visuals`, () => {
      const pool = generatePool(diff, 20, 100 + diff.length * 100);
      for (const q of pool) {
        assert(!!q.metadata.visual, `${q.id} has visual`);
        assert(q.metadata.visual.type === "svg", `${q.id} visual is svg`);
        assert(q.metadata.visual.svg.includes("<svg"), `${q.id} svg has <svg`);
        assert(q.metadata.visual.svg.includes("</svg>"), `${q.id} svg closes`);
        assert(!!q.metadata.visual.alt, `${q.id} has alt text`);
        assert(q.metadata.visual.width === 420, `${q.id} width=420`);
        assert(q.metadata.visual.height === 320, `${q.id} height=320`);
      }
    });
  }
});

describe("archetype coverage", () => {
  it("easy: covers identify_ratio and ratio_from_lengths", () => {
    const archs = new Set<string>();
    for (let s = 0; s < 2000; s++) archs.add(generateQuestion("easy", s).archetype);
    assert(archs.size >= 3, `Easy archetypes: ${archs.size} >= 3`);
    assert([...archs].some(a => a.startsWith("identify_ratio")), "Has identify_ratio");
    assert([...archs].some(a => a.startsWith("ratio_from_lengths")), "Has ratio_from_lengths");
  });

  it("medium: covers find_missing_side, find_ratio_decimal, inverse_ratio_simple", () => {
    const archs = new Set<string>();
    for (let s = 0; s < 2000; s++) archs.add(generateQuestion("medium", s).archetype);
    assert(archs.has("find_missing_side"), "Has find_missing_side");
    assert(archs.has("find_ratio_decimal"), "Has find_ratio_decimal");
    assert(archs.has("inverse_ratio_simple"), "Has inverse_ratio_simple");
  });

  it("hard: covers algebraic_side_expression, two_step, coordinate_triangle", () => {
    const archs = new Set<string>();
    for (let s = 0; s < 2000; s++) archs.add(generateQuestion("hard", s).archetype);
    assert(archs.has("algebraic_side_expression"), "Has algebraic_side_expression");
    assert(archs.has("two_step"), "Has two_step");
    assert(archs.has("coordinate_triangle"), "Has coordinate_triangle");
  });

  it("challenge: covers special_angles_exact, prove_identity_numeric, mixed_visual_reasoning", () => {
    const archs = new Set<string>();
    for (let s = 0; s < 2000; s++) archs.add(generateQuestion("challenge", s).archetype);
    assert(archs.has("special_angles_exact"), "Has special_angles_exact");
    assert(archs.has("prove_identity_numeric"), "Has prove_identity_numeric");
    assert(archs.has("mixed_visual_reasoning"), "Has mixed_visual_reasoning");
  });

  it("total unique archetypes across all difficulties >= 11", () => {
    const all = new Set<string>();
    for (const diff of ["easy", "medium", "hard", "challenge"]) {
      for (let s = 0; s < 2000; s++) all.add(generateQuestion(diff, s).archetype);
    }
    assert(all.size >= 11, `Total archetypes: ${all.size} >= 11`);
    console.log(`    Archetypes found: ${[...all].sort().join(", ")}`);
  });
});

describe("generatePool", () => {
  it("generates requested count of unique questions", () => {
    const pool = generatePool("easy", 10, 42);
    assert(pool.length === 10, `Pool length: ${pool.length} === 10`);
    const ids = new Set(pool.map(q => q.id));
    assert(ids.size === 10, `Unique ids: ${ids.size} === 10`);
  });

  it("all questions have correct difficulty", () => {
    for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
      const pool = generatePool(diff, 8, 42);
      for (const q of pool) assert(q.difficulty === diff, `${q.id} difficulty is ${diff}`);
    }
  });

  it("is deterministic for same seed", () => {
    const p1 = generatePool("medium", 5, 999);
    const p2 = generatePool("medium", 5, 999);
    for (let i = 0; i < p1.length; i++) {
      assert(p1[i].id === p2[i].id, `Pool det id[${i}]`);
      assert(p1[i].answer === p2[i].answer, `Pool det answer[${i}]`);
    }
  });
});

describe("generateMixedPool", () => {
  it("generates correct total count", () => {
    const pool = generateMixedPool([
      { difficulty: "easy", count: 8 },
      { difficulty: "medium", count: 8 },
      { difficulty: "hard", count: 7 },
      { difficulty: "challenge", count: 7 },
    ], 42);
    assert(pool.length === 30, `Mixed pool length: ${pool.length} === 30`);
  });

  it("maintains difficulty proportions", () => {
    const pool = generateMixedPool([
      { difficulty: "easy", count: 8 },
      { difficulty: "medium", count: 8 },
      { difficulty: "hard", count: 7 },
      { difficulty: "challenge", count: 7 },
    ], 42);
    const counts: Record<string, number> = {};
    for (const q of pool) counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
    assert(counts["easy"] === 8, `Easy count: ${counts["easy"]} === 8`);
    assert(counts["medium"] === 8, `Medium count: ${counts["medium"]} === 8`);
    assert(counts["hard"] === 7, `Hard count: ${counts["hard"]} === 7`);
    assert(counts["challenge"] === 7, `Challenge count: ${counts["challenge"]} === 7`);
  });

  it("all 30 questions have SVG visuals", () => {
    const pool = generateMixedPool([
      { difficulty: "easy", count: 8 },
      { difficulty: "medium", count: 8 },
      { difficulty: "hard", count: 7 },
      { difficulty: "challenge", count: 7 },
    ], 42);
    for (const q of pool) {
      assert(!!q.metadata.visual, `${q.id} has visual`);
      assert(q.metadata.visual.svg.includes("<svg"), `${q.id} has svg`);
    }
  });

  it("is deterministic with same seed", () => {
    const config = [
      { difficulty: "easy", count: 5 },
      { difficulty: "medium", count: 5 },
      { difficulty: "hard", count: 5 },
      { difficulty: "challenge", count: 5 },
    ];
    const p1 = generateMixedPool(config, 777);
    const p2 = generateMixedPool(config, 777);
    for (let i = 0; i < p1.length; i++) {
      assert(p1[i].id === p2[i].id, `Mixed det id[${i}]`);
    }
  });
});

describe("answer format validation", () => {
  it("easy answers are simplified fractions", () => {
    const pool = generatePool("easy", 20, 42);
    for (const q of pool) {
      assert(/^-?\d+(\/\d+)?$/.test(q.answer), `Easy answer format: ${q.answer}`);
    }
  });

  it("medium find_ratio_decimal answers are 2dp decimals", () => {
    const pool = generatePool("medium", 30, 42);
    for (const q of pool.filter(q => q.archetype === "find_ratio_decimal")) {
      assert(/^-?\d+\.\d{2}$/.test(q.answer), `Decimal format: ${q.answer}`);
    }
  });

  it("medium inverse_ratio_simple answers are special angles", () => {
    for (let s = 0; s < 200; s++) {
      const q = generateQuestion("medium", s);
      if (q.archetype === "inverse_ratio_simple") {
        const deg = parseInt(q.answer);
        assert([30, 45, 60].includes(deg), `Inverse angle: ${deg}`);
      }
    }
  });

  it("challenge prove_identity_numeric always answers 1", () => {
    for (let s = 0; s < 200; s++) {
      const q = generateQuestion("challenge", s);
      if (q.archetype === "prove_identity_numeric") {
        assert(q.answer === "1", `Identity answer: ${q.answer}`);
      }
    }
  });
});

describe("SVG diagram quality", () => {
  it("right triangle SVGs include polygon and right-angle marker", () => {
    const pool = generatePool("easy", 10, 42);
    for (const q of pool) {
      assert(q.metadata.visual.svg.includes("<polygon"), `${q.id} has polygon`);
      assert(q.metadata.visual.svg.includes("<polyline"), `${q.id} has right-angle marker`);
    }
  });

  it("coordinate triangle SVGs include labeled points A, B, C", () => {
    let found = 0;
    for (let s = 0; s < 200; s++) {
      const q = generateQuestion("hard", s);
      if (q.archetype === "coordinate_triangle") {
        assert(q.metadata.visual.svg.includes("A("), `${q.id} has point A`);
        assert(q.metadata.visual.svg.includes("B("), `${q.id} has point B`);
        assert(q.metadata.visual.svg.includes("C("), `${q.id} has point C`);
        found++;
      }
    }
    assert(found > 0, `Found ${found} coordinate_triangle questions`);
  });

  it("SVGs have proper xmlns attribute", () => {
    const pool = generateMixedPool([
      { difficulty: "easy", count: 5 },
      { difficulty: "medium", count: 5 },
      { difficulty: "hard", count: 5 },
      { difficulty: "challenge", count: 5 },
    ], 42);
    for (const q of pool) {
      assert(q.metadata.visual.svg.includes('xmlns="http://www.w3.org/2000/svg"'), `${q.id} xmlns`);
    }
  });
});

describe("worked solutions", () => {
  it("every question has at least 2 steps", () => {
    const pool = generateMixedPool([
      { difficulty: "easy", count: 8 },
      { difficulty: "medium", count: 8 },
      { difficulty: "hard", count: 7 },
      { difficulty: "challenge", count: 7 },
    ], 42);
    for (const q of pool) {
      assert(q.worked_solution.length >= 2, `${q.id} steps: ${q.worked_solution.length} >= 2`);
    }
  });

  it("worked solutions reference trig function", () => {
    const pool = generatePool("easy", 15, 42);
    for (const q of pool) {
      const text = q.worked_solution.join(" ");
      assert(/sin|cos|tan/.test(text), `${q.id} mentions trig fn`);
    }
  });
});

describe("mathematical correctness", () => {
  it("easy sin ratios: opp/hyp is correct", () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion("easy", s);
      if (q.archetype.includes("sin")) {
        const p = q.metadata.params as { opp: number; hyp: number };
        if (p.opp && p.hyp) {
          const parts = q.answer.split("/");
          const num = parseInt(parts[0]);
          const den = parts[1] ? parseInt(parts[1]) : 1;
          assert(Math.abs(num / den - p.opp / p.hyp) < 1e-5, `sin correct: ${q.answer} ≈ ${p.opp}/${p.hyp}`);
        }
      }
    }
  });

  it("Pythagorean identity always yields 1", () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion("challenge", s);
      if (q.archetype === "prove_identity_numeric") {
        const p = q.metadata.params as { a: number; b: number; c: number };
        const sum = (p.a / p.c) ** 2 + (p.b / p.c) ** 2;
        assert(Math.abs(sum - 1) < 1e-10, `Identity: ${sum} ≈ 1`);
      }
    }
  });
});

describe("edge cases", () => {
  it("handles large seed values", () => {
    const q = generateQuestion("easy", 2147483647);
    assert(!!q && !!q.answer, "Large seed works");
  });

  it("handles seed = 0", () => {
    const q = generateQuestion("easy", 0);
    assert(!!q && !!q.answer, "Seed 0 works");
  });

  it("pool with count 1 returns 1", () => {
    assert(generatePool("easy", 1, 42).length === 1, "Count 1");
  });

  it("pool with count 0 returns empty", () => {
    assert(generatePool("easy", 0, 42).length === 0, "Count 0");
  });
});

console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log(`\nFAILURES:`);
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed > 0 ? 1 : 0);
