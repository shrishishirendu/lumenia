import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/factorisingCommonFactors";

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
  assert(q.topic === "factorising_common_factors", `${diff}: topic is 'factorising_common_factors'`);
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
  const pool = generatePool(diff, 5, 777, true);
  for (const q of pool) {
    assert(q.answer.includes("(") && q.answer.includes(")"), `${diff}/${q.archetype}: answer '${q.answer}' contains parentheses`);
  }
}

section("medium/hard pool contains negative common factor cases");
{
  const mediumPool = generatePool("medium", 20, 55, true);
  const negCases = mediumPool.filter(q => q.archetype.includes("negative"));
  assert(negCases.length >= 2, `medium pool has >= 2 negative common factor cases (got ${negCases.length})`);
}

section("numeric verification: factorised form equals original");
function evalExpr(expr: string, vars: Record<string, number>): number {
  let s = expr.replace(/²/g, "**2").replace(/³/g, "**3");
  s = s.replace(/(\d)([a-z])/g, "$1*$2");
  s = s.replace(/([a-z])([a-z])/g, "$1*$2");
  s = s.replace(/([a-z])\*\*(\d)/g, "($1**$2)");
  s = s.replace(/(\d)\(/g, "$1*(");
  s = s.replace(/([a-z])\(/g, "$1*(");
  s = s.replace(/\)([a-z0-9])/g, ")*$1");
  s = s.replace(/\)\(/g, ")*(");
  for (const [v, val] of Object.entries(vars)) {
    s = s.replace(new RegExp(v, "g"), `(${val})`);
  }
  try {
    return Function(`"use strict"; return (${s})`)() as number;
  } catch {
    return NaN;
  }
}

for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 5, 42, true);
  for (const q of pool) {
    const promptMatch = q.prompt.match(/(?:Factorise(?:\s+\w+)*:\s*)(.*)/);
    if (!promptMatch) continue;
    const original = promptMatch[1].trim();
    const factorised = q.answer;

    const testVals = [
      { x: 2, y: 3, z: 4, a: 5, m: 6, n: 7, p: 8, t: 9, b: 10 },
      { x: -1, y: 2, z: -3, a: 4, m: -2, n: 3, p: -4, t: 5, b: -6 },
    ];

    for (const vars of testVals) {
      const lhs = evalExpr(original, vars);
      const rhs = evalExpr(factorised, vars);
      if (!isNaN(lhs) && !isNaN(rhs)) {
        assert(
          Math.abs(lhs - rhs) < 0.001,
          `${diff}/${q.archetype}: original="${original}" (${lhs}) == factorised="${factorised}" (${rhs}) with vars=${JSON.stringify(vars)}`
        );
      }
    }
  }
}

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
