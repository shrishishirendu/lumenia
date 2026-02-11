import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/linearEquations";

const REQUIRED_KEYS: (keyof GeneratedQuestion)[] = [
  "id", "topic", "difficulty", "archetype", "prompt", "answer", "worked_solution", "metadata"
];

const DIFFICULTIES = ["easy", "medium", "hard", "challenge"] as const;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
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
  assert(q.topic === "linear_equations", `${diff}: topic is 'linear_equations'`);
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
  const q1 = generateQuestion(diff, 111);
  const q2 = generateQuestion(diff, 222);
  assert(q1.id !== q2.id || q1.prompt !== q2.prompt, `${diff}: different seeds produce different questions`);
}

section("generatePool with ensure_unique=false allows duplicates (stress test)");
{
  const pool = generatePool("easy", 100, 42, false);
  assert(pool.length === 100, `pool returns exactly 100 when ensure_unique=false (got ${pool.length})`);
}

section("generateMixedPool returns correct total and mixed difficulties");
{
  const config = [
    { difficulty: "easy" as const, count: 3 },
    { difficulty: "medium" as const, count: 2 },
    { difficulty: "hard" as const, count: 1 },
  ];
  const pool = generateMixedPool(config, 42);
  assert(pool.length === 6, `mixed pool has 6 questions (got ${pool.length})`);
  const diffs = pool.map(q => q.difficulty);
  assert(diffs.filter(d => d === "easy").length === 3, "mixed pool has 3 easy");
  assert(diffs.filter(d => d === "medium").length === 2, "mixed pool has 2 medium");
  assert(diffs.filter(d => d === "hard").length === 1, "mixed pool has 1 hard");
}

section("question id is deterministic based on params");
{
  const q1 = generateQuestion("easy", 42);
  const q2 = generateQuestion("easy", 42);
  assert(q1.id === q2.id, "same params produce same id");
  assert(q1.id.length === 12, `id is 12 chars (got ${q1.id.length})`);
}

section("warmup default config: 2 easy + 2 medium");
{
  const pool = generateMixedPool([
    { difficulty: "easy", count: 2 },
    { difficulty: "medium", count: 2 },
  ], 42);
  const diffs = pool.map(q => q.difficulty);
  assert(diffs.filter(d => d === "easy").length === 2, "warmup has 2 easy");
  assert(diffs.filter(d => d === "medium").length === 2, "warmup has 2 medium");
}

section("exit ticket default config: 1 medium + 1 hard");
{
  const pool = generateMixedPool([
    { difficulty: "medium", count: 1 },
    { difficulty: "hard", count: 1 },
  ], 42);
  assert(pool.length === 2, "exit ticket has 2 questions");
  const diffs = pool.map(q => q.difficulty);
  assert(diffs.includes("medium"), "exit ticket includes medium");
  assert(diffs.includes("hard"), "exit ticket includes hard");
}

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed!");
}
