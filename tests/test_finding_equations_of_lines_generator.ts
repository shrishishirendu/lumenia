import { generateQuestion, generatePool, generateMixedPool, type GeneratedQuestion } from "../server/services/questionEngine/findingEquationsOfLines";

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
  assert(q.topic === "finding_equations_of_lines", `${diff}: topic is 'finding_equations_of_lines'`);
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

section("archetype counts per difficulty");
{
  const counts: Record<string, number> = {};
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 30, 1, true);
    const archetypes = new Set(pool.map(q => q.archetype));
    counts[diff] = archetypes.size;
  }
  assert(counts.easy >= 6, `easy has >= 6 archetypes (got ${counts.easy})`);
  assert(counts.medium >= 6, `medium has >= 6 archetypes (got ${counts.medium})`);
  assert(counts.hard >= 5, `hard has >= 5 archetypes (got ${counts.hard})`);
  assert(counts.challenge >= 5, `challenge has >= 5 archetypes (got ${counts.challenge})`);
}

section("all answers are in y=mx+c format or y=constant");
{
  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 15, 77, true);
    for (const q of pool) {
      const ans = q.answer;
      const validFormat = /^y=/.test(ans);
      assert(validFormat, `${diff}/${q.archetype}: answer '${ans}' starts with y=`);
    }
  }
}

section("visual questions exist (at least 6 across all difficulties)");
{
  const allQs: GeneratedQuestion[] = [];
  for (const diff of DIFFICULTIES) {
    allQs.push(...generatePool(diff, 20, 42, true));
  }
  const visuals = allQs.filter(q => q.metadata?.visual);
  assert(visuals.length >= 6, `at least 6 visual questions total (got ${visuals.length})`);

  for (const vq of visuals) {
    assert(vq.metadata.visual!.type === "svg", `visual type is svg for ${vq.archetype}`);
    assert(vq.metadata.visual!.svg.includes("<svg"), `visual svg contains <svg for ${vq.archetype}`);
    assert(vq.metadata.visual!.svg.includes("</svg>"), `visual svg contains </svg> for ${vq.archetype}`);
    assert(typeof vq.metadata.visual!.alt === "string" && vq.metadata.visual!.alt.length > 0, `visual has alt text for ${vq.archetype}`);
    assert(typeof vq.metadata.visual!.width === "number", `visual has width for ${vq.archetype}`);
    assert(typeof vq.metadata.visual!.height === "number", `visual has height for ${vq.archetype}`);
  }
}

section("visual questions exist in medium, hard, and challenge");
{
  for (const diff of ["medium", "hard", "challenge"] as const) {
    const pool = generatePool(diff, 20, 55, true);
    const visuals = pool.filter(q => q.metadata?.visual);
    assert(visuals.length >= 1, `${diff} has at least 1 visual question (got ${visuals.length})`);
  }
}

section("numeric verification: answer equation evaluates correctly at generated points");
{
  function evalExpr(expr: string, x: number): number | null {
    let s = expr.replace(/^y=/, "");
    s = s.replace(/\^/g, "**");
    s = s.replace(/(\d)(x)/g, "$1*$2");
    s = s.replace(/(x)(\d)/g, "$1*$2");
    s = s.replace(/(x)(x)/g, "$1*$2");
    s = s.replace(/([0-9/)])(x)/g, "$1*$2");
    s = s.replace(/(x)([0-9(])/g, "$1*$2");
    s = s.replace(/x/g, `(${x})`);
    if (/[^0-9+\-*/()._ ]/.test(s)) return null;
    try {
      const result = Function(`"use strict"; return (${s})`)() as number;
      if (!isFinite(result)) return null;
      return result;
    } catch { return null; }
  }

  for (const diff of DIFFICULTIES) {
    const pool = generatePool(diff, 10, 33, true);
    for (const q of pool) {
      if (q.answer === "y=5" || q.answer.match(/^y=-?\d+$/)) continue;
      const params = q.metadata.params;
      if ("x1" in params && "y1" in params) {
        const x1 = Number(params.x1);
        const y1 = Number(params.y1);
        const result = evalExpr(q.answer, x1);
        if (result !== null) {
          assert(Math.abs(result - y1) < 0.01, `${diff}/${q.archetype}: answer ${q.answer} gives y=${result} at x=${x1}, expected ${y1}`);
        }
      }
      const testXs = [-2, 0, 1, 3];
      for (const x of testXs) {
        const r = evalExpr(q.answer, x);
        assert(r !== null || q.answer.includes("/"), `${diff}/${q.archetype}: answer evaluatable at x=${x}`);
      }
    }
  }
}

console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
