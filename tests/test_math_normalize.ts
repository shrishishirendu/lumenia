import { normalizeMathInput, mathExpressionsEquivalent, normalizeCoordinatePairInput } from "../client/src/lib/mathNormalize";

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

console.log("\n12. Perfect squares and difference of squares normalization");
{
  const norm = normalizeMathInput;
  assertEq(norm("x^2 + 6x + 9"), "x^2+6x+9", "perfect square (x+3)^2");
  assertEq(norm("x^2 - 10x + 25"), "x^2-10x+25", "perfect square (x-5)^2");
  assertEq(norm("x^2 - 25"), "x^2-25", "diff of squares x^2-25");
  assertEq(norm("9x^2 - 4"), "9x^2-4", "non-monic diff of squares 9x^2-4");
  assertEq(norm("16x^2 - 25"), "16x^2-25", "non-monic diff of squares 16x^2-25");
  assertEq(norm("4x^2 + 12x + 9"), "4x^2+12x+9", "non-monic perfect square (2x+3)^2");
  assertEq(norm("2x^2 + 2x + 13"), "2x^2+2x+13", "combined expression result");
  assertEq(norm("16x"), "16x", "linear result from nested simplify");
  assertEq(norm("8x + 32"), "8x+32", "linear expression with constant");
  assert(norm("x^2 - 36") === norm("x^2-36"), "diff of squares spacing irrelevant");
  assert(norm("2x^2 + 4x - 5") === norm("2x^2+4x-5"), "combined result spacing");
}

console.log("\n13. Fraction simplification");
{
  const norm = normalizeMathInput;
  assertEq(norm("2/4"), "1/2", "simplify 2/4 -> 1/2");
  assertEq(norm("-2/4"), "-1/2", "simplify -2/4 -> -1/2");
  assertEq(norm("6/3"), "2", "simplify 6/3 -> 2");
  assertEq(norm("-6/2"), "-3", "simplify -6/2 -> -3");
  assertEq(norm("3/7"), "3/7", "already simplified 3/7");
  assertEq(norm("1/2"), "1/2", "already simplified 1/2");
  assertEq(norm("-1/3"), "-1/3", "already simplified -1/3");
  assertEq(norm("4/6"), "2/3", "simplify 4/6 -> 2/3");
  assertEq(norm("0/5"), "0", "zero numerator -> 0");
}

console.log("\n14. Slope/equation prefix stripping");
{
  const norm = normalizeMathInput;
  assertEq(norm("m = 2"), "2", "strip m= prefix with spaces");
  assertEq(norm("m=3"), "3", "strip m= prefix no spaces");
  assertEq(norm("m = -3/4"), "-3/4", "strip m= with fraction");
  assertEq(norm("m = 1/2"), "1/2", "strip m= with simple fraction");
}

console.log("\n15. Equation normalization for gradient topic");
{
  const norm = normalizeMathInput;
  assertEq(norm("y = 2x + 3"), "y=2x+3", "equation spaces removed");
  assertEq(norm("y = -x + 5"), "y=-x+5", "equation with -x");
  assertEq(norm("y = 3x - 1"), "y=3x-1", "equation with subtraction");
  assert(norm("y = 2x + 3") === norm("y=2x+3"), "equation equivalence");
}

console.log("\n16. mathExpressionsEquivalent for factorised quadratics");
{
  assert(mathExpressionsEquivalent("(x+3)(x-2)", "(x-2)(x+3)"), "swapped monic factors");
  assert(mathExpressionsEquivalent("(x+3)(x+2)", "(x+2)(x+3)"), "swapped positive factors");
  assert(mathExpressionsEquivalent("(2x+1)(x+3)", "(x+3)(2x+1)"), "swapped non-monic factors");
  assert(mathExpressionsEquivalent("(x-5)(x+5)", "(x+5)(x-5)"), "swapped diff of squares");
  assert(mathExpressionsEquivalent("2(x+1)(x+3)", "2(x+3)(x+1)"), "swapped with gcf");
  assert(mathExpressionsEquivalent("(3x-2)(x+4)", "(x+4)(3x-2)"), "swapped non-monic neg");
  assert(!mathExpressionsEquivalent("(x+3)(x-2)", "(x+3)(x+2)"), "different expressions not equal");
  assert(!mathExpressionsEquivalent("(x+1)(x+2)", "(x+1)(x+3)"), "different second factor not equal");
  assert(mathExpressionsEquivalent("(x+3)(x-2)", "(x+3)(x-2)"), "identical expressions equal");
  assert(mathExpressionsEquivalent("x^2+5x+6", "(x+2)(x+3)"), "expanded vs factorised");
  assert(mathExpressionsEquivalent("x^2-9", "(x-3)(x+3)"), "diff of squares expanded vs factorised");
  assert(mathExpressionsEquivalent("2x^2+7x+3", "(2x+1)(x+3)"), "non-monic expanded vs factorised");
}

console.log("\n17. mathExpressionsEquivalent for line equations (y=mx+c)");
{
  assert(mathExpressionsEquivalent("y=2x+3", "y = 2x + 3"), "line eq with spaces");
  assert(mathExpressionsEquivalent("y=2x+3", "y=2x+3"), "identical line eq");
  assert(mathExpressionsEquivalent("y=-x+5", "y = -x + 5"), "negative slope line eq");
  assert(mathExpressionsEquivalent("y=3x", "y = 3x"), "no intercept line eq");
  assert(mathExpressionsEquivalent("y=1/2x+3", "y = 1/2x + 3"), "fractional slope line eq");
  assert(!mathExpressionsEquivalent("y=2x+3", "y=2x+4"), "different intercepts not equal");
  assert(!mathExpressionsEquivalent("y=2x+3", "y=3x+3"), "different slopes not equal");
  assert(mathExpressionsEquivalent("y=-2x+1", "y=-2x+1"), "negative slope identical");
}

{
  console.log("\n--- normalizeCoordinatePairInput ---");
  assertEq(normalizeCoordinatePairInput("x=2, y=3"), "(2,3)", "labeled x=2 y=3");
  assertEq(normalizeCoordinatePairInput("x = -1 ; y = 4"), "(-1,4)", "labeled with semicolon and spaces");
  assertEq(normalizeCoordinatePairInput("( 2 , -1 )"), "(2,-1)", "brackets with spaces");
  assertEq(normalizeCoordinatePairInput("(2,3)"), "(2,3)", "already canonical");
  assertEq(normalizeCoordinatePairInput("2,3"), "(2,3)", "bare pair");
  assertEq(normalizeCoordinatePairInput("-3,5"), "(-3,5)", "negative x bare pair");
  assertEq(normalizeCoordinatePairInput("No Solution"), "no solution", "no solution case-insensitive");
  assertEq(normalizeCoordinatePairInput("NO SOLUTION"), "no solution", "no solution uppercase");
  assertEq(normalizeCoordinatePairInput("  no solution  "), "no solution", "no solution with whitespace");
  assertEq(normalizeCoordinatePairInput("infinite solutions"), "infinitely many solutions", "infinite keyword");
  assertEq(normalizeCoordinatePairInput("Infinitely many solutions"), "infinitely many solutions", "full infinite phrase");
  assertEq(normalizeCoordinatePairInput("x=0, y=0"), "(0,0)", "origin labeled");
  assertEq(normalizeCoordinatePairInput("(0,0)"), "(0,0)", "origin brackets");
  assertEq(normalizeCoordinatePairInput("x=-2, y=-3"), "(-2,-3)", "negative labeled pair");
  assertEq(normalizeCoordinatePairInput("1.5,2"), "(1.5,2)", "decimal value");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log("All tests passed!");
} else {
  process.exit(1);
}
