import { normalizeMathInput } from "../client/src/lib/mathNormalize";

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

function assertEq(actual: string, expected: string, label: string) {
  assert(actual === expected, `${label}: expected "${expected}", got "${actual}"`);
}

console.log("=== normalizeMathInput Tests ===\n");

console.log("1. Whitespace trimming and collapsing");
assertEq(normalizeMathInput("  hello  "), "hello", "trim spaces");
assertEq(normalizeMathInput("x  +  3"), "x+3", "collapse around operator");

console.log("\n2. Unicode symbol replacement");
assertEq(normalizeMathInput("√2"), "sqrt(2)", "√ -> sqrt with auto-parens");
assertEq(normalizeMathInput("√35"), "sqrt(35)", "√35 -> sqrt(35)");
assertEq(normalizeMathInput("x ≥ 3"), "x>=3", "≥ -> >=");
assertEq(normalizeMathInput("x ≤ 5"), "x<=5", "≤ -> <=");
assertEq(normalizeMathInput("3 × 4"), "3*4", "× -> *");
assertEq(normalizeMathInput("3 · 4"), "3*4", "· -> *");
assertEq(normalizeMathInput("5 − 3"), "5-3", "− -> -");

console.log("\n3. sqrt normalization");
assertEq(normalizeMathInput("sqrt2"), "sqrt(2)", "sqrt2 -> sqrt(2)");
assertEq(normalizeMathInput("sqrt(3)"), "sqrt(3)", "sqrt(3) stays");
assertEq(normalizeMathInput("2sqrt(3)"), "2*sqrt(3)", "insert * between number and sqrt");
assertEq(normalizeMathInput("3√5"), "3*sqrt(5)", "3√5 -> 3*sqrt(5)");

console.log("\n4. Implicit multiplication");
assertEq(normalizeMathInput("(x+1)(x-1)"), "(x+1)*(x-1)", ")(  -> )*(");
assertEq(normalizeMathInput(" (x+1)(x-1) "), "(x+1)*(x-1)", "with spaces");

console.log("\n5. Inequality equivalence");
{
  const a = normalizeMathInput("x >= 3");
  const b = normalizeMathInput("x ≥ 3");
  const c = normalizeMathInput("x>=3");
  assertEq(a, b, "x >= 3 == x ≥ 3");
  assertEq(b, c, "x ≥ 3 == x>=3");
}

console.log("\n6. Surd expression equivalence");
{
  const a = normalizeMathInput("8√2");
  const b = normalizeMathInput("8sqrt(2)");
  const c = normalizeMathInput("8 sqrt(2)");
  assertEq(a, "8*sqrt(2)", "8√2 normalizes to 8*sqrt(2)");
  assertEq(a, b, "8√2 == 8sqrt(2)");
  assertEq(a, c, "8√2 == 8 sqrt(2)");
}

console.log("\n7. Complex expressions");
assertEq(normalizeMathInput("5 + 2√6"), "5+2*sqrt(6)", "5 + 2√6");
assertEq(normalizeMathInput("4√2 + 5√3"), "4*sqrt(2)+5*sqrt(3)", "4√2 + 5√3");

console.log("\n8. Lowercase");
assertEq(normalizeMathInput("X = 5"), "x=5", "uppercase X -> x");
assertEq(normalizeMathInput("SQRT(3)"), "sqrt(3)", "SQRT -> sqrt");

console.log("\n9. Edge cases");
assertEq(normalizeMathInput(""), "", "empty string");
assertEq(normalizeMathInput("7"), "7", "just a number");
assertEq(normalizeMathInput("  "), "", "only spaces");

console.log("\n10. Answer comparison scenarios");
{
  const norm = normalizeMathInput;
  assert(norm("8√2") === norm("8sqrt(2)"), "student types 8√2 vs answer 8sqrt(2)");
  assert(norm("5 + 2√6") === norm("5+2√6"), "spaces don't matter");
  assert(norm("x >= 3") === norm("x≥3"), "inequality formats match");
  assert(norm("√3") === norm("sqrt(3)"), "sqrt formats match");
  assert(norm("(x+1)(x-1)") === norm("(x+1)*(x-1)"), "implicit mult");
}

console.log("\n11. Binomial product answer normalization");
{
  const norm = normalizeMathInput;
  assertEq(norm("x^2 + 5x + 6"), "x^2+5x+6", "polynomial with spaces");
  assertEq(norm("x^2+5x+6"), "x^2+5x+6", "polynomial no spaces");
  assertEq(norm("X^2 + 5X + 6"), "x^2+5x+6", "uppercase polynomial");
  assert(norm("x^2 + 5x + 6") === norm("x^2+5x+6"), "spaces irrelevant in polynomial");
  assertEq(norm("2x^2 - 3x - 10"), "2x^2-3x-10", "negative terms in polynomial");
  assertEq(norm("x^2 - 16"), "x^2-16", "diff of squares answer");
  assertEq(norm("4x^2 - 9"), "4x^2-9", "non-monic diff of squares");
  assert(norm("(x+2)(x+3)") === norm("(x+2)*(x+3)"), "binomial implicit mult");
  assertEq(norm("x^2 + 2x + 1"), "x^2+2x+1", "perfect square result");
  assertEq(norm("9x^2 + 12x + 4"), "9x^2+12x+4", "non-monic perfect square");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log("All tests passed!");
} else {
  process.exit(1);
}
