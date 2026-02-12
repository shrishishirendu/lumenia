import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/fractionalIndices";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error(`  FAIL: ${msg}`); failed++; }
  else { passed++; }
}

function assertKeys(q: GeneratedQuestion, diff: string) {
  assert(typeof q.id === "string" && q.id.length === 12, `${diff}: id is 12-char string`);
  assert(q.topic === "fractional_indices", `${diff}: topic is 'fractional_indices'`);
  assert(q.difficulty === diff, `${diff}: difficulty matches`);
  assert(typeof q.archetype === "string" && q.archetype.length > 0, `${diff}: archetype non-empty`);
  assert(typeof q.prompt === "string" && q.prompt.length > 5, `${diff}: prompt non-empty`);
  assert(typeof q.answer === "string" && q.answer.length > 0, `${diff}: answer non-empty`);
  assert(Array.isArray(q.worked_solution) && q.worked_solution.length >= 1, `${diff}: worked_solution array`);
  assert(typeof q.metadata === "object", `${diff}: metadata is object`);
  assert(typeof q.metadata.params === "object", `${diff}: metadata.params is object`);
  assert(Array.isArray(q.metadata.skills) && q.metadata.skills.length >= 1, `${diff}: metadata.skills array`);
  assert(typeof q.metadata.estimated_time_sec === "number" && q.metadata.estimated_time_sec > 0, `${diff}: estimated_time_sec positive`);
}

console.log("=== Fractional Indices Generator Tests ===\n");

console.log("--- 1. Required keys for each difficulty ---");
for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
  for (let i = 0; i < 5; i++) {
    const q = generateQuestion(diff, 42 + i * 100);
    assertKeys(q, diff);
  }
}

console.log("--- 2. Generate pool returns unique questions ---");
for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
  const pool = generatePool(diff, 6, 123);
  assert(pool.length === 6, `${diff}: pool has 6 items`);
  const ids = pool.map(q => q.id);
  const unique = new Set(ids);
  assert(unique.size === 6, `${diff}: all 6 IDs unique (got ${unique.size})`);
  pool.forEach(q => assertKeys(q, diff));
}

console.log("--- 3. Seeded determinism ---");
for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
  const a = generateQuestion(diff, 999);
  const b = generateQuestion(diff, 999);
  assert(a.id === b.id, `${diff}: same seed → same id`);
  assert(a.prompt === b.prompt, `${diff}: same seed → same prompt`);
  assert(a.answer === b.answer, `${diff}: same seed → same answer`);
}

console.log("--- 4. Different seeds produce different questions ---");
for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
  const a = generateQuestion(diff, 1);
  const b = generateQuestion(diff, 2);
  assert(a.id !== b.id || a.prompt !== b.prompt, `${diff}: different seeds → different output`);
}

console.log("--- 5. Mixed pool config ---");
{
  const mix = generateMixedPool([
    { difficulty: "easy", count: 3 },
    { difficulty: "medium", count: 3 },
    { difficulty: "hard", count: 2 },
  ], 555);
  assert(mix.length === 8, `mixed pool has 8 items (got ${mix.length})`);
  const ids = new Set(mix.map(q => q.id));
  assert(ids.size === 8, `all 8 IDs unique in mixed pool`);
  mix.forEach(q => {
    assert(q.topic === "fractional_indices", `mixed: topic is fractional_indices`);
    assertKeys(q, q.difficulty);
  });
}

console.log("--- 6. Default warmup config (3 easy + 3 medium + 2 hard) ---");
{
  const warmup = generateMixedPool([
    { difficulty: "easy", count: 3 },
    { difficulty: "medium", count: 3 },
    { difficulty: "hard", count: 2 },
  ], 777);
  assert(warmup.length === 8, `warmup has 8 items`);
}

console.log("--- 7. Default exit ticket config (1 medium + 1 hard) ---");
{
  const exit = generateMixedPool([
    { difficulty: "medium", count: 1 },
    { difficulty: "hard", count: 1 },
  ], 888);
  assert(exit.length === 2, `exit ticket has 2 items`);
}

console.log("--- 8. Hard questions include negative fractional index handling ---");
{
  const hardPool = generatePool("hard", 20, 42);
  const negIndexQuestions = hardPool.filter(q =>
    q.metadata.skills.includes("handle_negative_index")
  );
  assert(negIndexQuestions.length >= 3, `at least 3 negative-index questions in hard pool of 20 (got ${negIndexQuestions.length})`);
}

console.log("--- 9. Challenge questions simplify to single power ---");
{
  const challPool = generatePool("challenge", 20, 321);
  const singlePowerQuestions = challPool.filter(q =>
    q.metadata.skills.includes("simplify_to_single_power")
  );
  assert(singlePowerQuestions.length >= 5, `at least 5 simplify-to-single-power in challenge pool of 20 (got ${singlePowerQuestions.length})`);
}

console.log("--- 10. Archetype coverage ---");
{
  const easyPool = generatePool("easy", 40, 12345);
  const easyArchetypes = new Set(easyPool.map(q => q.archetype));
  assert(easyArchetypes.size >= 6, `easy: at least 6 distinct archetypes in 40 questions (got ${easyArchetypes.size})`);

  const medPool = generatePool("medium", 40, 12345);
  const medArchetypes = new Set(medPool.map(q => q.archetype));
  assert(medArchetypes.size >= 6, `medium: at least 6 distinct archetypes (got ${medArchetypes.size})`);

  const hardPool = generatePool("hard", 40, 12345);
  const hardArchetypes = new Set(hardPool.map(q => q.archetype));
  assert(hardArchetypes.size >= 5, `hard: at least 5 distinct archetypes (got ${hardArchetypes.size})`);

  const challPool = generatePool("challenge", 40, 12345);
  const challArchetypes = new Set(challPool.map(q => q.archetype));
  assert(challArchetypes.size >= 5, `challenge: at least 5 distinct archetypes (got ${challArchetypes.size})`);
}

console.log("--- 11. Answers use correct format (no decimal approximations) ---");
{
  for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
    const pool = generatePool(diff, 10, 54321);
    for (const q of pool) {
      const hasDecimal = /\d+\.\d+/.test(q.answer);
      assert(!hasDecimal, `${diff}/${q.archetype}: answer "${q.answer}" should not contain decimal approximations`);
    }
  }
}

console.log("--- 12. Skill tags are valid ---");
{
  const validSkills = new Set([
    "convert_to_radical", "evaluate_perfect_power", "apply_index_laws",
    "handle_negative_index", "rationalise_denominator", "simplify_to_single_power"
  ]);
  for (const diff of ["easy", "medium", "hard", "challenge"] as const) {
    const pool = generatePool(diff, 10, 99999);
    for (const q of pool) {
      for (const skill of q.metadata.skills) {
        assert(validSkills.has(skill), `${diff}/${q.archetype}: skill "${skill}" is valid`);
      }
    }
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed (${passed + failed} total) ===`);
if (failed > 0) process.exit(1);
