import { generateQuestion, generatePool, generateMixedPool } from "../server/services/questionEngine/operationsWithSurds";

const REQUIRED_KEYS = ["id", "topic", "difficulty", "archetype", "prompt", "answer", "worked_solution", "metadata"];
const METADATA_KEYS = ["params", "skills", "estimated_time_sec"];
const DIFFICULTIES = ["easy", "medium", "hard", "challenge"] as const;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
  } else {
    passed++;
  }
}

console.log("=== Operations with Surds Generator Tests ===\n");

console.log("1. Required keys on every question");
for (const diff of DIFFICULTIES) {
  const q = generateQuestion(diff, 42);
  for (const key of REQUIRED_KEYS) {
    assert(key in q, `${diff} question missing key: ${key}`);
  }
  for (const key of METADATA_KEYS) {
    assert(key in q.metadata, `${diff} question metadata missing key: ${key}`);
  }
  assert(q.topic === "operations_with_surds", `${diff} question topic should be 'operations_with_surds', got '${q.topic}'`);
  assert(q.difficulty === diff, `expected difficulty '${diff}', got '${q.difficulty}'`);
  assert(typeof q.prompt === "string" && q.prompt.length > 0, `${diff} question prompt should be non-empty string`);
  assert(typeof q.answer === "string" && q.answer.length > 0, `${diff} question answer should be non-empty string`);
  assert(Array.isArray(q.worked_solution) && q.worked_solution.length > 0, `${diff} question worked_solution should be non-empty array`);
  assert(Array.isArray(q.metadata.skills) && q.metadata.skills.length > 0, `${diff} question skills should be non-empty array`);
  assert(typeof q.metadata.estimated_time_sec === "number" && q.metadata.estimated_time_sec > 0, `${diff} question estimated_time_sec should be positive number`);
}

console.log("\n2. Seeded determinism");
for (const diff of DIFFICULTIES) {
  const q1 = generateQuestion(diff, 12345);
  const q2 = generateQuestion(diff, 12345);
  assert(q1.id === q2.id, `${diff}: same seed should produce same ID`);
  assert(q1.prompt === q2.prompt, `${diff}: same seed should produce same prompt`);
  assert(q1.answer === q2.answer, `${diff}: same seed should produce same answer`);
}

console.log("\n3. Different seeds produce different questions");
for (const diff of DIFFICULTIES) {
  const q1 = generateQuestion(diff, 111);
  const q2 = generateQuestion(diff, 999);
  const different = q1.id !== q2.id || q1.prompt !== q2.prompt;
  assert(different, `${diff}: different seeds should (usually) produce different questions`);
}

console.log("\n4. Pool uniqueness");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 6, 42);
  const ids = pool.map(q => q.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, `${diff}: pool of ${ids.length} should have unique IDs (got ${uniqueIds.size} unique)`);
}

console.log("\n5. Mixed pool works");
{
  const mixed = generateMixedPool([
    { difficulty: "easy", count: 3 },
    { difficulty: "medium", count: 3 },
    { difficulty: "hard", count: 2 },
  ], 42);
  assert(mixed.length === 8, `Mixed pool should have 8 questions, got ${mixed.length}`);
  const ids = new Set(mixed.map(q => q.id));
  assert(ids.size === mixed.length, `Mixed pool should have unique IDs`);
}

console.log("\n6. Medium questions require simplify-before-combine");
{
  const medPool = generatePool("medium", 30, 42);
  const hasSimplifyBeforeCombine = medPool.some(q =>
    q.metadata.skills.includes("simplify_surd") && q.metadata.skills.includes("combine_like_surds")
  );
  assert(hasSimplifyBeforeCombine, "At least one MEDIUM question requires simplify-before-combine");
}

console.log("\n7. Hard/challenge includes bracket expansion");
{
  const hardPool = generatePool("hard", 20, 42);
  const challengePool = generatePool("challenge", 20, 42);
  const allPool = [...hardPool, ...challengePool];
  const hasExpand = allPool.some(q =>
    q.metadata.skills.includes("expand_brackets")
  );
  assert(hasExpand, "At least one HARD/CHALLENGE question includes bracket expansion");
}

console.log("\n8. No decimal approximations in answers");
{
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 20, 42);
    for (const q of pool) {
      const hasDecimal = /\d+\.\d+/.test(q.answer);
      assert(!hasDecimal, `${diff} answer '${q.answer}' should not contain decimals`);
    }
  }
}

console.log("\n9. Skill tags validation");
{
  const easyPool = generatePool("easy", 20, 42);
  const hasCombineLike = easyPool.some(q => q.metadata.skills.includes("combine_like_surds"));
  const hasMultiply = easyPool.some(q => q.metadata.skills.includes("multiply_surds"));
  assert(hasCombineLike, "Easy pool should have combine_like_surds skill");
  assert(hasMultiply, "Easy pool should have multiply_surds skill");

  const medPool = generatePool("medium", 20, 42);
  const hasMedMultiply = medPool.some(q => q.metadata.skills.includes("multiply_surds"));
  assert(hasMedMultiply, "Medium pool should have multiply_surds skill");

  const hardPool = generatePool("hard", 20, 42);
  const hasDiffSquares = hardPool.some(q => q.metadata.skills.includes("difference_of_squares"));
  assert(hasDiffSquares, "Hard pool should have difference_of_squares skill");

  const chalPool = generatePool("challenge", 20, 42);
  const hasStructure = chalPool.some(q => q.metadata.skills.includes("structure_recognition"));
  assert(hasStructure, "Challenge pool should have structure_recognition skill");
}

console.log("\n10. Archetype counts per difficulty");
{
  const easyPool = generatePool("easy", 50, 42);
  const medPool = generatePool("medium", 50, 42);
  const hardPool = generatePool("hard", 50, 42);
  const chalPool = generatePool("challenge", 50, 42);

  const easyArchetypes = new Set(easyPool.map(q => q.archetype));
  const medArchetypes = new Set(medPool.map(q => q.archetype));
  const hardArchetypes = new Set(hardPool.map(q => q.archetype));
  const chalArchetypes = new Set(chalPool.map(q => q.archetype));

  console.log(`  Easy archetypes: ${easyArchetypes.size}`);
  console.log(`  Medium archetypes: ${medArchetypes.size}`);
  console.log(`  Hard archetypes: ${hardArchetypes.size}`);
  console.log(`  Challenge archetypes: ${chalArchetypes.size}`);

  assert(easyArchetypes.size >= 6, `Easy should have at least 6 archetypes, got ${easyArchetypes.size}`);
  assert(medArchetypes.size >= 6, `Medium should have at least 6 archetypes, got ${medArchetypes.size}`);
  assert(hardArchetypes.size >= 5, `Hard should have at least 5 archetypes, got ${hardArchetypes.size}`);
  assert(chalArchetypes.size >= 5, `Challenge should have at least 5 archetypes, got ${chalArchetypes.size}`);
}

console.log("\n11. Easy has add, subtract, and multiply archetypes");
{
  const pool = generatePool("easy", 50, 42);
  const hasAdd = pool.some(q => q.archetype.startsWith("add_like"));
  const hasSub = pool.some(q => q.archetype.startsWith("sub_like"));
  const hasMul = pool.some(q => q.archetype.startsWith("multiply_simple"));
  assert(hasAdd, "Easy should have add_like archetypes");
  assert(hasSub, "Easy should have sub_like archetypes");
  assert(hasMul, "Easy should have multiply_simple archetypes");
}

console.log("\n12. Hard has difference of squares items");
{
  const hardPool = generatePool("hard", 30, 42);
  const diffSquaresCount = hardPool.filter(q => q.archetype.startsWith("expand_diff_squares")).length;
  assert(diffSquaresCount >= 2, `Hard should have at least 2 difference-of-squares items, got ${diffSquaresCount}`);
}

console.log("\n13. Challenge has square binomial and product conjugate archetypes");
{
  const chalPool = generatePool("challenge", 30, 42);
  const hasSquareBin = chalPool.some(q => q.archetype.startsWith("square_binomial"));
  const hasProdConj = chalPool.some(q => q.archetype.startsWith("product_conjugates"));
  assert(hasSquareBin, "Challenge should have square_binomial archetypes");
  assert(hasProdConj, "Challenge should have product_conjugates archetypes");
}

console.log("\n14. Worked solutions are detailed");
{
  for (const diff of DIFFICULTIES) {
    const q = generateQuestion(diff, 42);
    assert(q.worked_solution.length >= 2, `${diff}: worked_solution should have at least 2 steps, got ${q.worked_solution.length}`);
    for (const step of q.worked_solution) {
      assert(typeof step === "string" && step.length > 0, `${diff}: each worked_solution step should be a non-empty string`);
    }
  }
}

console.log("\n15. Answers use √ notation consistently");
{
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 10, 42);
    for (const q of pool) {
      if (q.answer.includes("sqrt")) {
        assert(false, `${diff} answer '${q.answer}' should use √ not sqrt`);
      } else {
        passed++;
      }
    }
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log("All tests passed!");
} else {
  process.exit(1);
}
