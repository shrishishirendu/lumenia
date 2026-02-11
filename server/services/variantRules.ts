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

const rulesRegistry: Record<string, TopicVariantRules> = {
  linear_equations: linearEquationsRules,
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
