import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/factorisingQuadratics";

const REQUIRED_KEYS: (keyof GeneratedQuestion)[] = [
  "id", "topic", "difficulty", "archetype", "prompt", "answer", "worked_solution", "metadata"
];

const DIFFICULTIES = ["easy", "medium", "hard", "challenge"] as const;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

section("generateQuestion returns required keys for each difficulty");
for (const diff of DIFFICULTIES) {
  const q = generateQuestion(diff, 42);
  for (const key of REQUIRED_KEYS) {
    assert(key in q, `${diff}: has key '${key}'`);
  }
  assert(q.topic === "factorising_quadratics", `${diff}: topic is 'factorising_quadratics'`);
  assert(q.difficulty === diff, `${diff}: difficulty matches '${diff}'`);
  assert(typeof q.prompt === "string" && q.prompt.length > 0, `${diff}: prompt is non-empty string`);
  assert(typeof q.answer === "string" && q.answer.length > 0, `${diff}: answer is non-empty string`);
  assert(Array.isArray(q.worked_solution) && q.worked_solution.length > 0, `${diff}: worked_solution is non-empty array`);
  assert(typeof q.metadata === "object", `${diff}: metadata is object`);
  assert(Array.isArray(q.metadata.skills) && q.metadata.skills.length > 0, `${diff}: metadata.skills is non-empty array`);
  assert(typeof q.metadata.estimated_time_sec === "number", `${diff}: estimated_time_sec is a number`);
  assert(typeof q.metadata.params === "object", `${diff}: metadata.params is object`);
}

section("generatePool returns n unique questions when ensure_unique=true");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 10, 123, true);
  assert(pool.length <= 10, `${diff}: pool length <= 10 (got ${pool.length})`);
  const ids = pool.map(q => q.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, `${diff}: all IDs are unique (${uniqueIds.size}/${ids.length})`);
  for (const q of pool) {
    assert(q.difficulty === diff, `${diff}: pool question has correct difficulty`);
  }
}

section("seeded runs produce identical outputs");
for (const diff of DIFFICULTIES) {
  const q1 = generateQuestion(diff, 999);
  const q2 = generateQuestion(diff, 999);
  assert(q1.id === q2.id, `${diff}: same seed produces same id`);
  assert(q1.prompt === q2.prompt, `${diff}: same seed produces same prompt`);
  assert(q1.answer === q2.answer, `${diff}: same seed produces same answer`);
}

section("different seeds produce different outputs");
for (const diff of DIFFICULTIES) {
  const q1 = generateQuestion(diff, 100);
  const q2 = generateQuestion(diff, 200);
  assert(q1.id !== q2.id || q1.prompt !== q2.prompt, `${diff}: different seeds produce different questions`);
}

section("generateMixedPool produces mixed difficulties");
{
  const mixed = generateMixedPool([
    { difficulty: "easy", count: 3 },
    { difficulty: "medium", count: 3 },
    { difficulty: "hard", count: 2 },
  ], 42);
  assert(mixed.length === 8, `mixed pool has 8 questions (got ${mixed.length})`);
  const diffs = new Set(mixed.map(q => q.difficulty));
  assert(diffs.has("easy"), "mixed pool has easy questions");
  assert(diffs.has("medium"), "mixed pool has medium questions");
  assert(diffs.has("hard"), "mixed pool has hard questions");
}

section("answer format contains parentheses");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 8, 777, true);
  for (const q of pool) {
    assert(q.answer.includes("(") && q.answer.includes(")"), `${diff}/${q.archetype}: answer '${q.answer}' contains parentheses`);
  }
}

section("medium pool contains difference of squares");
{
  const pool = generatePool("medium", 20, 55, true);
  const dosCases = pool.filter(q => q.archetype === "diff_of_squares");
  assert(dosCases.length >= 2, `medium pool has >= 2 diff_of_squares cases (got ${dosCases.length})`);
}

section("hard/challenge pool contains non-monic factorisation");
{
  const hardPool = generatePool("hard", 10, 77, true);
  const nonMonic = hardPool.filter(q => q.archetype.includes("non_monic") || q.archetype.includes("ac_method"));
  assert(nonMonic.length >= 2, `hard pool has >= 2 non-monic cases (got ${nonMonic.length})`);

  const challengePool = generatePool("challenge", 10, 77, true);
  const challNonMonic = challengePool.filter(q => q.archetype.includes("non_monic"));
  assert(challNonMonic.length >= 1, `challenge pool has >= 1 non-monic cases (got ${challNonMonic.length})`);
}

section("medium pool contains gcf_then_monic");
{
  const pool = generatePool("medium", 20, 99, true);
  const gcfCases = pool.filter(q => q.archetype === "gcf_then_monic");
  assert(gcfCases.length >= 1, `medium pool has >= 1 gcf_then_monic cases (got ${gcfCases.length})`);
}

section("challenge pool contains rearranged and diff_of_squares_non_monic");
{
  const pool = generatePool("challenge", 20, 333, true);
  const rearranged = pool.filter(q => q.archetype.includes("rearranged"));
  assert(rearranged.length >= 1, `challenge pool has >= 1 rearranged cases (got ${rearranged.length})`);
  const dosNM = pool.filter(q => q.archetype === "diff_of_squares_non_monic");
  assert(dosNM.length >= 1, `challenge pool has >= 1 diff_of_squares_non_monic cases (got ${dosNM.length})`);
}

section("numeric verification: factorised form equals original");
function evalExpr(expr: string, x: number): number {
  let s = expr;
  s = s.replace(/\^/g, "**");
  s = s.replace(/(\d)x/g, "$1*x");
  s = s.replace(/([)])x/g, "$1*x");
  s = s.replace(/x\(/g, "x*(");
  s = s.replace(/(\d)\(/g, "$1*(");
  s = s.replace(/\)\(/g, ")*(");
  s = s.replace(/\)(\d)/g, ")*$1");
  s = s.replace(/x/g, `(${x})`);
  try {
    return Function(`"use strict"; return (${s})`)() as number;
  } catch {
    return NaN;
  }
}

for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 8, 42, true);
  for (const q of pool) {
    const promptMatch = q.prompt.match(/(?:Factorise(?:\s+\w+)*:\s*)(.*)/);
    if (!promptMatch) continue;
    const original = promptMatch[1].trim();
    const factorised = q.answer;

    const testVals = [1, 2, -1, 3, -2, 5];

    for (const x of testVals) {
      const lhs = evalExpr(original, x);
      const rhs = evalExpr(factorised, x);
      if (!isNaN(lhs) && !isNaN(rhs)) {
        assert(
          Math.abs(lhs - rhs) < 0.001,
          `${diff}/${q.archetype}: original="${original}" (${lhs}) == factorised="${factorised}" (${rhs}) with x=${x}`
        );
      }
    }
  }
}

section("equivalence: swapped factor order should evaluate identically");
{
  const testCases = [
    { a: "(x+3)(x-2)", b: "(x-2)(x+3)" },
    { a: "(2x+1)(x+3)", b: "(x+3)(2x+1)" },
    { a: "(x-5)(x+5)", b: "(x+5)(x-5)" },
    { a: "2(x+1)(x+3)", b: "2(x+3)(x+1)" },
  ];
  for (const { a, b } of testCases) {
    for (const x of [-3, -1, 0, 1, 2, 5]) {
      const va = evalExpr(a, x);
      const vb = evalExpr(b, x);
      if (!isNaN(va) && !isNaN(vb)) {
        assert(Math.abs(va - vb) < 0.001, `swapped factors: "${a}" == "${b}" at x=${x}`);
      }
    }
  }
}

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
