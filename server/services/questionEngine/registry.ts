import { generateMixedPool as generateLinearEqPool } from "./linearEquations";
import { generateMixedPool as generateIneqPool } from "./inequalities";
import { generateMixedPool as generateFracIdxPool } from "./fractionalIndices";
import { generateMixedPool as generateSurdsIntroPool } from "./surdsIntro";
import { generateMixedPool as generateSimplifyingSurdsPool } from "./simplifyingSurds";
import { generateMixedPool as generateOpsWithSurdsPool } from "./operationsWithSurds";
import { generateMixedPool as generateExpandBinomialPool } from "./expandingBinomialProducts";
import { generateMixedPool as generatePerfectDiffSqPool } from "./perfectAndDifferenceOfSquares";
import { generateMixedPool as generateGradientParallelPool } from "./gradientAndParallelLines";
import { generateMixedPool as generateFactorisingCFPool } from "./factorisingCommonFactors";
import { generateMixedPool as generateFactorisingQuadPool } from "./factorisingQuadratics";
import { generateMixedPool as generateFindingEqLinesPool } from "./findingEquationsOfLines";

export type DifficultyConfig = { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number };
export type GeneratorFn = (config: DifficultyConfig[], seed?: number) => any[];

const GENERATOR_REGISTRY: Record<string, GeneratorFn> = {
  linear_equations: generateLinearEqPool,
  inequalities: generateIneqPool,
  fractional_indices: generateFracIdxPool,
  introduction_to_surds: generateSurdsIntroPool,
  simplifying_surds: generateSimplifyingSurdsPool,
  operations_with_surds: generateOpsWithSurdsPool,
  expanding_binomial_products: generateExpandBinomialPool,
  perfect_squares_and_difference_of_squares: generatePerfectDiffSqPool,
  gradient_and_parallel_lines: generateGradientParallelPool,
  factorising_common_factors: generateFactorisingCFPool,
  factorising_quadratics: generateFactorisingQuadPool,
  finding_equations_of_lines: generateFindingEqLinesPool,
};

const GENERATOR_ALIASES: Record<string, string> = {
  perfect_and_difference_of_squares: "perfect_squares_and_difference_of_squares",
};

export function getGenerator(topicKey: string): GeneratorFn | null {
  const normalized = topicKey.toLowerCase().replace(/\s+/g, "_");
  return GENERATOR_REGISTRY[normalized] || GENERATOR_REGISTRY[GENERATOR_ALIASES[normalized] || ""] || null;
}

export function hasGenerator(topicKey: string): boolean {
  const normalized = topicKey.toLowerCase().replace(/\s+/g, "_");
  return normalized in GENERATOR_REGISTRY || normalized in GENERATOR_ALIASES;
}

export function getRegisteredTopicKeys(): string[] {
  return Object.keys(GENERATOR_REGISTRY);
}

export function resolveTopicSlug(topicName: string): string {
  return topicName.toLowerCase().replace(/\s+/g, "_");
}
