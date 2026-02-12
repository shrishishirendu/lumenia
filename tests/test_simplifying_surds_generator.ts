import { generateQuestion, generatePool, generateMixedPool } from "../server/services/questionEngine/simplifyingSurds";

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

console.log("=== Simplifying Surds Generator Tests ===\n");

console.log("1. Required keys on every question");
for (const diff of DIFFICULTIES) {
  const q = generateQuestion(diff, 42);
  for (const key of REQUIRED_KEYS) {
    assert(key in q, `${diff} question missing key: ${key}`);
  }
  for (const key of METADATA_KEYS) {
    assert(key in q.metadata, `${diff} question metadata missing key: ${key}`);
  }
  assert(q.topic === "simplifying_surds", `${diff} question topic should be 'simplifying_surds', got '${q.topic}'`);
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

console.log("\n6. Hard/challenge questions combine like surds after simplification");
{
  const hardPool = generatePool("hard", 20, 42);
  const challengePool = generatePool("challenge", 20, 42);
  const allPool = [...hardPool, ...challengePool];
  const hasCombine = allPool.some(q =>
    q.metadata.skills.includes("combine_like_surds")
  );
  assert(hasCombine, "At least one hard/challenge question should involve combining like surds after simplification");
}

console.log("\n7. Archetype counts per difficulty");
{
  const easyPool = generatePool("easy", 50, 42);
  const medPool = generatePool("medium", 50, 42);
  const hardPool = generatePool("hard", 50, 42);
  const chalPool = generatePool("challenge", 50, 42);

  const easyArchetypes = new Set(easyPool.map(q => q.archetype));
  const medArchetypes = new Set(medPool.map(q => q.archetype));
  const hardArchetypes = new Set(hardPool.map(q => q.archetype));
  const chalArchetypes = new Set(chalPool.map(q => q.archetype));

  assert(easyArchetypes.size >= 6, `Easy should have at least 6 archetypes, got ${easyArchetypes.size}`);
  assert(medArchetypes.size >= 6, `Medium should have at least 6 archetypes, got ${medArchetypes.size}`);
  assert(hardArchetypes.size >= 5, `Hard should have at least 5 archetypes, got ${hardArchetypes.size}`);
  assert(chalArchetypes.size >= 5, `Challenge should have at least 5 archetypes, got ${chalArchetypes.size}`);

  console.log(`  Easy archetypes: ${easyArchetypes.size}`);
  console.log(`  Medium archetypes: ${medArchetypes.size}`);
  console.log(`  Hard archetypes: ${hardArchetypes.size}`);
  console.log(`  Challenge archetypes: ${chalArchetypes.size}`);
}

console.log("\n8. No decimal approximations in answers");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 10, 42);
  for (const q of pool) {
    const hasDecimal = /\d+\.\d+/.test(q.answer);
    assert(!hasDecimal, `${diff}/${q.archetype}: answer '${q.answer}' should not contain decimal approximations`);
  }
}

console.log("\n9. Skill tags validation");
{
  const validSkills = new Set([
    "extract_square_factor", "simplify_surd", "simplify_coefficient",
    "combine_like_surds", "recognise_unlike_surds",
    "expand_brackets", "simplify_expression",
  ]);
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 10, 42);
    for (const q of pool) {
      for (const skill of q.metadata.skills) {
        assert(validSkills.has(skill), `${diff}/${q.archetype}: unknown skill tag '${skill}'`);
      }
    }
  }
}

console.log("\n10. Medium difficulty has coefficient_surd questions");
{
  const medPool = generatePool("medium", 20, 42);
  const hasCoefficientSurd = medPool.some(q => q.archetype.startsWith("coefficient_surd"));
  assert(hasCoefficientSurd, "Medium should include at least one coefficient_surd question");
  const coeffCount = medPool.filter(q => q.archetype.startsWith("coefficient_surd")).length;
  assert(coeffCount >= 3, `Medium should have at least 3 coefficient_surd questions in a pool of 20, got ${coeffCount}`);
}

console.log("\n11. Unlike surds recognition in hard");
{
  const hardPool = generatePool("hard", 20, 42);
  const hasUnlike = hardPool.some(q =>
    q.metadata.skills.includes("recognise_unlike_surds")
  );
  assert(hasUnlike, "Hard should include at least one question where terms do NOT combine (unlike surds)");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed!");
}
