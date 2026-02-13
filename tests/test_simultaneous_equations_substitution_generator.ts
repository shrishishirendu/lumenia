import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/simultaneousEquationsSubstitution";

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
  assert(q.topic === "simultaneous_equations_substitution", `${diff}: topic is 'simultaneous_equations_substitution'`);
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
  const different = q1.id !== q2.id || q1.answer !== q2.answer;
  assert(different, `${diff}: different seeds produce different outputs`);
}

section("Mixed pool generates correct total count and distribution");
const config = [
  { difficulty: "easy" as const, count: 3 },
  { difficulty: "medium" as const, count: 3 },
  { difficulty: "hard" as const, count: 2 },
  { difficulty: "challenge" as const, count: 2 },
];
for (let seed = 1; seed <= 5; seed++) {
  const pool = generateMixedPool(config, seed * 100);
  assert(pool.length === 10, `seed ${seed}: mixed pool has 10 questions (got ${pool.length})`);
  const easyCount = pool.filter(q => q.difficulty === "easy").length;
  const medCount = pool.filter(q => q.difficulty === "medium").length;
  const hardCount = pool.filter(q => q.difficulty === "hard").length;
  const challCount = pool.filter(q => q.difficulty === "challenge").length;
  assert(easyCount === 3, `seed ${seed}: 3 easy (got ${easyCount})`);
  assert(medCount === 3, `seed ${seed}: 3 medium (got ${medCount})`);
  assert(hardCount === 2, `seed ${seed}: 2 hard (got ${hardCount})`);
  assert(challCount === 2, `seed ${seed}: 2 challenge (got ${challCount})`);
}

section("Visual questions exist in medium, hard, and challenge pools");
{
  let totalVisuals = 0;
  for (const diff of ["medium", "hard", "challenge"] as const) {
    const pool = generatePool(diff, 20, 555);
    const visuals = pool.filter(q => q.metadata.visual);
    totalVisuals += visuals.length;
    assert(visuals.length >= 2, `${diff}: at least 2 visual questions in pool of 20 (got ${visuals.length})`);
    for (const q of visuals) {
      assert(q.metadata.visual!.type === "svg", `${diff}/${q.archetype}: visual type is svg`);
      assert(typeof q.metadata.visual!.svg === "string" && q.metadata.visual!.svg.length > 100, `${diff}/${q.archetype}: svg is non-empty string`);
      assert(q.metadata.visual!.svg.includes("<svg"), `${diff}/${q.archetype}: svg contains <svg tag`);
      assert(typeof q.metadata.visual!.alt === "string" && q.metadata.visual!.alt.length > 0, `${diff}/${q.archetype}: alt text is non-empty`);
      assert(q.metadata.visual!.width === 460, `${diff}/${q.archetype}: width is 460`);
      assert(q.metadata.visual!.height === 320, `${diff}/${q.archetype}: height is 320`);
    }
  }
  assert(totalVisuals >= 6, `Total visual questions across pools >= 6 (got ${totalVisuals})`);
}

section("Includes at least 1 parallel/no-solution and 1 coincident/infinite case");
{
  const challPool = generatePool("challenge", 20, 777);
  const noSolCount = challPool.filter(q => q.answer === "no solution").length;
  const infCount = challPool.filter(q => q.answer === "infinitely many solutions").length;
  assert(noSolCount >= 1, `At least 1 'no solution' in challenge pool (got ${noSolCount})`);
  assert(infCount >= 1, `At least 1 'infinitely many solutions' in challenge pool (got ${infCount})`);
}

section("Answer format validation");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 10, 42);
  for (const q of pool) {
    const ans = q.answer;
    const isCoord = /^\(-?\d+(\.\d+)?(\/\d+)?,-?\d+(\.\d+)?(\/\d+)?\)$/.test(ans);
    const isSpecial = ans === "no solution" || ans === "infinitely many solutions";
    assert(isCoord || isSpecial, `${diff}/${q.archetype}: answer '${ans}' is valid format`);
  }
}

section("Algebraic correctness spot-check (verify solutions satisfy equations)");
{
  const pool = generateMixedPool([
    { difficulty: "easy", count: 8 },
    { difficulty: "medium", count: 8 },
  ], 12345);

  for (const q of pool) {
    if (q.answer === "no solution" || q.answer === "infinitely many solutions") continue;
    const match = q.answer.match(/^\((-?[\d./]+),(-?[\d./]+)\)$/);
    if (!match) continue;

    const parseNum = (s: string) => {
      if (s.includes("/")) {
        const [n, d] = s.split("/").map(Number);
        return n / d;
      }
      return parseFloat(s);
    };

    const x = parseNum(match[1]);
    const y = parseNum(match[2]);
    const params = q.metadata.params;

    if (q.archetype.startsWith("y_equals_both")) {
      const m1 = params.m1 as number;
      const c1 = params.c1 as number;
      const m2 = params.m2 as number;
      const c2 = params.c2 as number;
      const y1 = m1 * x + c1;
      const y2 = m2 * x + c2;
      assert(Math.abs(y1 - y) < 0.01, `${q.archetype}: eq1 check y=${y1} vs ${y}`);
      assert(Math.abs(y2 - y) < 0.01, `${q.archetype}: eq2 check y=${y2} vs ${y}`);
    }
  }
}

section("Large pool uniqueness stress test");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 30, 999, true);
  const ids = new Set(pool.map(q => q.id));
  assert(ids.size === pool.length, `${diff}: all ${pool.length} IDs unique in stress test`);
}

section("All archetypes reachable");
{
  const allArchetypes = new Set<string>();
  for (let seed = 0; seed < 1000; seed++) {
    for (const diff of DIFFICULTIES) {
      const q = generateQuestion(diff, seed);
      allArchetypes.add(`${diff}:${q.archetype}`);
    }
  }
  const easyArchetypes = [...allArchetypes].filter(a => a.startsWith("easy:"));
  const medArchetypes = [...allArchetypes].filter(a => a.startsWith("medium:"));
  const hardArchetypes = [...allArchetypes].filter(a => a.startsWith("hard:"));
  const challArchetypes = [...allArchetypes].filter(a => a.startsWith("challenge:"));
  assert(easyArchetypes.length >= 4, `Easy has at least 4 reachable archetypes (got ${easyArchetypes.length})`);
  assert(medArchetypes.length >= 4, `Medium has at least 4 reachable archetypes (got ${medArchetypes.length})`);
  assert(hardArchetypes.length >= 4, `Hard has at least 4 reachable archetypes (got ${hardArchetypes.length})`);
  assert(challArchetypes.length >= 4, `Challenge has at least 4 reachable archetypes (got ${challArchetypes.length})`);
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
