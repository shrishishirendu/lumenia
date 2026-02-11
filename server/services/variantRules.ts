export interface DifficultyRule {
  difficulty: number;
  allowedForms: string[];
  formDescriptions: string[];
  coefficientRange: [number, number];
  constantRange: [number, number];
  answerRange: [number, number];
  allowFractions: boolean;
  allowNegativeAnswers: boolean;
  allowVariablesOnBothSides: boolean;
  forbiddenPatterns: RegExp[];
  maxTerms: number;
}

export interface TopicVariantRules {
  topicSlug: string;
  topicTitle: string;
  difficulties: DifficultyRule[];
}

const linearEquationsRules: TopicVariantRules = {
  topicSlug: "linear_equations",
  topicTitle: "Linear Equations",
  difficulties: [
    {
      difficulty: 1,
      allowedForms: [
        "ax + b = c",
        "ax - b = c",
        "b + ax = c",
      ],
      formDescriptions: [
        "One-step or simple two-step equations",
        "Single variable on one side only",
        "No parentheses, no fractions",
      ],
      coefficientRange: [2, 10],
      constantRange: [1, 30],
      answerRange: [1, 15],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\(/,
        /\//,
        /\d+x\s*[+\-]\s*\d+x/,
      ],
      maxTerms: 3,
    },
    {
      difficulty: 2,
      allowedForms: [
        "ax + b = c",
        "ax - b = c",
        "b - ax = c",
        "a(x + b) = c",
        "a(x - b) = c",
      ],
      formDescriptions: [
        "Two-step equations with larger numbers",
        "May include one set of parentheses via distribution",
        "Single variable side, integer coefficients",
      ],
      coefficientRange: [2, 15],
      constantRange: [-20, 50],
      answerRange: [-10, 20],
      allowFractions: false,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\d+x\s*[+\-]\s*\d+x/,
      ],
      maxTerms: 4,
    },
    {
      difficulty: 3,
      allowedForms: [
        "ax + b = cx + d",
        "a(x + b) = cx + d",
        "ax + b = c(x + d)",
        "(x/a) + b = c",
      ],
      formDescriptions: [
        "Variables on both sides of the equation",
        "Parentheses with distribution required",
        "May include simple fraction coefficients (x/a form)",
        "Multi-step solutions (3-4 steps)",
      ],
      coefficientRange: [2, 20],
      constantRange: [-30, 60],
      answerRange: [-15, 30],
      allowFractions: true,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: true,
      forbiddenPatterns: [],
      maxTerms: 6,
    },
    {
      difficulty: 4,
      allowedForms: [
        "a(bx + c) = d(ex + f)",
        "ax/b + c = dx/e + f",
        "Word problem requiring multi-step equation setup",
      ],
      formDescriptions: [
        "Complex multi-step equations with nested parentheses",
        "Fraction coefficients or fractional terms",
        "Word problems requiring equation formulation",
        "4+ step solutions",
      ],
      coefficientRange: [2, 25],
      constantRange: [-50, 100],
      answerRange: [-20, 50],
      allowFractions: true,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: true,
      forbiddenPatterns: [],
      maxTerms: 8,
    },
  ],
};

const indexLawsRules: TopicVariantRules = {
  topicSlug: "index_laws",
  topicTitle: "Index Laws",
  difficulties: [
    {
      difficulty: 1,
      allowedForms: [
        "a^m × a^n (product rule, single step)",
        "a^m ÷ a^n (quotient rule, single step, m ≥ n)",
        "Evaluate a^n",
        "a^0 = 1",
      ],
      formDescriptions: [
        "Single index law application",
        "Bases 2–9, powers 0–5",
        "No negative indices or fractional indices",
        "Answer in index form (e.g. 2^7) or numeric for evaluation",
      ],
      coefficientRange: [2, 9],
      constantRange: [0, 5],
      answerRange: [0, 100000],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\^-/,
        /\^0\./,
        /\^\d+\/\d+/,
      ],
      maxTerms: 3,
    },
    {
      difficulty: 2,
      allowedForms: [
        "a^m × a^n (product rule)",
        "a^m ÷ a^n (quotient rule, m ≥ n)",
        "(a^m)^n (power of a power)",
      ],
      formDescriptions: [
        "Two-step simplification using one or two rules",
        "Bases 2–9, powers 0–5",
        "No negative indices, no fractions",
      ],
      coefficientRange: [2, 9],
      constantRange: [0, 5],
      answerRange: [0, 100000],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\^-/,
        /\^0\./,
        /\^\d+\/\d+/,
      ],
      maxTerms: 4,
    },
    {
      difficulty: 3,
      allowedForms: [
        "Multi-step: product + quotient combined",
        "Power of a power + product/quotient",
        "Expressions with zero index",
        "Word problems using index laws",
      ],
      formDescriptions: [
        "2–3 index laws combined in one expression",
        "Bases 2–9, powers 0–5",
        "May include zero index (a^0 = 1)",
        "No negative indices",
      ],
      coefficientRange: [2, 9],
      constantRange: [0, 5],
      answerRange: [0, 100000],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\^-/,
        /\^0\./,
        /\^\d+\/\d+/,
      ],
      maxTerms: 6,
    },
    {
      difficulty: 4,
      allowedForms: [
        "Multi-step with nested power-of-power + products + quotients",
        "Multiple bracketed expressions combined",
        "Complex simplification requiring 4+ steps",
      ],
      formDescriptions: [
        "3+ index laws combined",
        "Nested brackets e.g. (a^m)^n × a^p ÷ a^q",
        "Bases 2–9, powers 0–5",
        "No negative indices",
      ],
      coefficientRange: [2, 9],
      constantRange: [0, 5],
      answerRange: [0, 100000],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\^-/,
        /\^0\./,
        /\^\d+\/\d+/,
      ],
      maxTerms: 8,
    },
  ],
};

const expandingBracketsRules: TopicVariantRules = {
  topicSlug: "expanding_brackets",
  topicTitle: "Expanding Brackets",
  difficulties: [
    {
      difficulty: 1,
      allowedForms: [
        "a(b + c) numeric only",
        "a(b − c) numeric only",
      ],
      formDescriptions: [
        "Numeric distributive law — no variables",
        "Coefficients 1–9, constants 1–20",
        "Answer is a single number",
      ],
      coefficientRange: [1, 9],
      constantRange: [1, 20],
      answerRange: [0, 200],
      allowFractions: false,
      allowNegativeAnswers: false,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /x/i,
        /\)\s*\(/,
      ],
      maxTerms: 3,
    },
    {
      difficulty: 2,
      allowedForms: [
        "a(x + c)",
        "a(x − c)",
        "a(bx + c)",
        "a(bx − c)",
      ],
      formDescriptions: [
        "Single bracket with variable x",
        "Positive multiplier only",
        "Result is a linear expression (no x²)",
        "Coefficients 1–9, constants 1–20",
      ],
      coefficientRange: [1, 9],
      constantRange: [-20, 20],
      answerRange: [-200, 200],
      allowFractions: false,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\)\s*\(/,
        /x\^2|x²/,
      ],
      maxTerms: 4,
    },
    {
      difficulty: 3,
      allowedForms: [
        "−a(x + c)",
        "−a(x − c)",
        "−a(bx + c)",
        "−a(bx − c)",
        "−(x + c)",
        "−(x − c)",
      ],
      formDescriptions: [
        "Negative multiplier with single bracket",
        "Sign-change awareness required",
        "Result is a linear expression",
        "Coefficients 1–9, constants −20 to 20",
      ],
      coefficientRange: [1, 9],
      constantRange: [-20, 20],
      answerRange: [-200, 200],
      allowFractions: false,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\)\s*\(/,
        /x\^2|x²/,
      ],
      maxTerms: 4,
    },
    {
      difficulty: 4,
      allowedForms: [
        "a(bx + c) + dx",
        "a(bx − c) + d",
        "−a(bx + c) + ex",
        "a(bx + c) − ex + f",
      ],
      formDescriptions: [
        "Multi-step: expand then combine like terms",
        "May have extra terms outside the bracket",
        "Result is a fully simplified linear expression",
        "No two-bracket multiplication (FOIL)",
      ],
      coefficientRange: [1, 9],
      constantRange: [-20, 20],
      answerRange: [-200, 200],
      allowFractions: false,
      allowNegativeAnswers: true,
      allowVariablesOnBothSides: false,
      forbiddenPatterns: [
        /\)\s*\(/,
        /x\^2|x²/,
      ],
      maxTerms: 6,
    },
  ],
};

const rulesRegistry: Record<string, TopicVariantRules> = {
  linear_equations: linearEquationsRules,
  index_laws: indexLawsRules,
  expanding_brackets: expandingBracketsRules,
};

export function getVariantRules(topicSlug: string): TopicVariantRules | null {
  return rulesRegistry[topicSlug] || null;
}

export function getRulesForDifficulty(
  topicSlug: string,
  difficulty: number
): DifficultyRule | null {
  const topicRules = rulesRegistry[topicSlug];
  if (!topicRules) return null;
  return topicRules.difficulties.find((d) => d.difficulty === difficulty) || null;
}

export function validateAgainstRules(
  questionText: string,
  answer: string,
  rule: DifficultyRule
): { valid: boolean; reason?: string } {
  for (const pattern of rule.forbiddenPatterns) {
    if (pattern.test(questionText)) {
      return { valid: false, reason: `Forbidden pattern matched: ${pattern}` };
    }
  }

  const answerMatch = answer.match(/x\s*=\s*(-?\d+)/);
  if (answerMatch) {
    const val = parseInt(answerMatch[1]);
    if (val < rule.answerRange[0] || val > rule.answerRange[1]) {
      return {
        valid: false,
        reason: `Answer ${val} outside range [${rule.answerRange[0]}, ${rule.answerRange[1]}]`,
      };
    }
    if (!rule.allowNegativeAnswers && val < 0) {
      return { valid: false, reason: "Negative answers not allowed at this difficulty" };
    }
  }

  if (!rule.allowFractions && /\//.test(questionText) && !questionText.toLowerCase().startsWith("solve:")) {
    const eqPart = questionText.replace(/^Solve:\s*/i, "");
    if (/\d+\s*\/\s*\d+/.test(eqPart)) {
      return { valid: false, reason: "Fractions not allowed at this difficulty" };
    }
  }

  if (!rule.allowVariablesOnBothSides) {
    const eqMatch = questionText.match(/^Solve:\s*(.+)$/i);
    if (eqMatch) {
      const sides = eqMatch[1].split("=");
      if (sides.length === 2 && /x/i.test(sides[0]) && /x/i.test(sides[1])) {
        return {
          valid: false,
          reason: "Variables on both sides not allowed at this difficulty",
        };
      }
    }
  }

  const nums = questionText.match(/-?\d+/g) || [];
  for (const n of nums) {
    const val = parseInt(n);
    if (
      Math.abs(val) > Math.max(Math.abs(rule.constantRange[0]), Math.abs(rule.constantRange[1]), Math.abs(rule.coefficientRange[1])) * 2
    ) {
      return { valid: false, reason: `Number ${val} too large for difficulty ${rule.difficulty}` };
    }
  }

  return { valid: true };
}
