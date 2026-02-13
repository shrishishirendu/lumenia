import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/simultaneousEquationsGraphical";

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
  assert(q.topic === "simultaneous_equations_graphical", `${diff}: topic is 'simultaneous_equations_graphical'`);
  assert(q.difficulty === diff, `${diff}: difficulty matches '${diff}'`);
  assert(typeof q.prompt === "string" && q.prompt.length > 0, `${diff}: prompt is non-empty string`);
  assert(typeof q.answer === "string" && q.answer.length > 0, `${diff}: answer is non-empty string`);
  assert(Array.isArray(q.worked_solution) && q.worked_solution.length > 0, `${diff}: worked_solution is non-empty array`);
  assert(typeof q.metadata === "object", `${diff}: metadata is object`);
  assert(Array.isArray(q.metadata.skills) && q.metadata.skills.length > 0, `${diff}: metadata.skills is non-empty array`);
  assert(typeof q.metadata.estimated_time_sec === "number", `${diff}: estimated_time_sec is a number`);
  assert(typeof q.metadata.params === "object", `${diff}: metadata.params is object`);
}

section("All questions have visual SVG metadata");
for (const diff of DIFFICULTIES) {
  const pool = generatePool(diff, 10, 123, true);
  for (const q of pool) {
    assert(!!q.metadata.visual, `${diff}/${q.archetype}: has visual metadata`);
    assert(q.metadata.visual!.type === "svg", `${diff}/${q.archetype}: visual type is svg`);
    assert(typeof q.metadata.visual!.svg === "string" && q.metadata.visual!.svg.length > 100, `${diff}/${q.archetype}: svg is non-empty string`);
    assert(q.metadata.visual!.svg.includes("<svg"), `${diff}/${q.archetype}: svg contains <svg tag`);
    assert(typeof q.metadata.visual!.alt === "string" && q.metadata.visual!.alt.length > 0, `${diff}/${q.archetype}: alt text is non-empty`);
    assert(q.metadata.visual!.width === 460, `${diff}/${q.archetype}: width is 460`);
    assert(q.metadata.visual!.height === 340, `${diff}/${q.archetype}: height is 340`);
  }
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

section("Archetype counts per difficulty");
{
  const easyPool = generatePool("easy", 50, 42, false);
  const easyArchetypes = new Set(easyPool.map(q => q.archetype));
  assert(easyArchetypes.size >= 6, `easy has >= 6 archetypes (got ${easyArchetypes.size}): ${[...easyArchetypes].join(", ")}`);

  const medPool = generatePool("medium", 50, 42, false);
  const medArchetypes = new Set(medPool.map(q => q.archetype));
  assert(medArchetypes.size >= 6, `medium has >= 6 archetypes (got ${medArchetypes.size}): ${[...medArchetypes].join(", ")}`);

  const hardPool = generatePool("hard", 50, 42, false);
  const hardArchetypes = new Set(hardPool.map(q => q.archetype));
  assert(hardArchetypes.size >= 5, `hard has >= 5 archetypes (got ${hardArchetypes.size}): ${[...hardArchetypes].join(", ")}`);

  const chalPool = generatePool("challenge", 50, 42, false);
  const chalArchetypes = new Set(chalPool.map(q => q.archetype));
  assert(chalArchetypes.size >= 5, `challenge has >= 5 archetypes (got ${chalArchetypes.size}): ${[...chalArchetypes].join(", ")}`);
}

section("Parallel / no-solution cases present in hard");
{
  const hardPool = generatePool("hard", 30, 7, false);
  const noSolutionQuestions = hardPool.filter(q => q.answer === "no solution");
  assert(noSolutionQuestions.length >= 2, `hard pool contains >= 2 no-solution questions (got ${noSolutionQuestions.length})`);
}

section("Infinite solutions case present in challenge");
{
  const chalPool = generatePool("challenge", 30, 7, false);
  const infiniteQuestions = chalPool.filter(q => q.answer === "infinitely many solutions");
  assert(infiniteQuestions.length >= 1, `challenge pool contains >= 1 infinite-solutions question (got ${infiniteQuestions.length})`);
}

section("Answer format validation");
{
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 20, 42, false);
    for (const q of pool) {
      const validCoord = /^\(-?\d+,-?\d+\)$/.test(q.answer);
      const validNoSolution = q.answer === "no solution";
      const validInfinite = q.answer === "infinitely many solutions";
      assert(validCoord || validNoSolution || validInfinite,
        `${diff}/${q.archetype}: answer '${q.answer}' is valid format`);
    }
  }
}

section("Intersection correctness spot check");
{
  const pool = generatePool("easy", 10, 55, true);
  for (const q of pool) {
    const match = q.answer.match(/^\((-?\d+),(-?\d+)\)$/);
    if (match) {
      const ix = parseInt(match[1]);
      const iy = parseInt(match[2]);
      const p = q.metadata.params as Record<string, number>;
      const m1 = p.m1;
      const c1 = p.c1;
      const m2 = p.m2;
      const c2 = p.c2;
      if (typeof m1 === "number" && typeof c1 === "number" && typeof m2 === "number" && typeof c2 === "number") {
        const y1 = m1 * ix + c1;
        const y2 = m2 * ix + c2;
        assert(Math.abs(y1 - iy) < 0.01, `easy spot check: m1*ix+c1 = ${y1} matches iy=${iy}`);
        assert(Math.abs(y2 - iy) < 0.01, `easy spot check: m2*ix+c2 = ${y2} matches iy=${iy}`);
      }
    }
  }
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
process.exit(failed > 0 ? 1 : 0);
