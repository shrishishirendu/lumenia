import { generateMixedPool as generateLinearEqPool } from "./linearEquations";
import { generateMixedPool as generateIneqPool } from "./inequalities";
import { generateMixedPool as generateFracIdxPool } from "./fractionalIndices";
import { generateMixedPool as generateSurdsIntroPool } from "./surdsIntro";
import { generateMixedPool as generateSimplifyingSurdsPool } from "./simplifyingSurds";
import { generateMixedPool as generateOpsWithSurdsPool } from "./operationsWithSurds";

export type DifficultyConfig = { difficulty: "easy" | "medium" | "hard" | "challenge"; count: number };
export type GeneratorFn = (config: DifficultyConfig[], seed?: number) => any[];

const GENERATOR_REGISTRY: Record<string, GeneratorFn> = {
  linear_equations: generateLinearEqPool,
  inequalities: generateIneqPool,
  fractional_indices: generateFracIdxPool,
  introduction_to_surds: generateSurdsIntroPool,
  simplifying_surds: generateSimplifyingSurdsPool,
  operations_with_surds: generateOpsWithSurdsPool,
};

export function getGenerator(topicKey: string): GeneratorFn | null {
  return GENERATOR_REGISTRY[topicKey] || null;
}

export function hasGenerator(topicKey: string): boolean {
  return topicKey in GENERATOR_REGISTRY;
}

export function getRegisteredTopicKeys(): string[] {
  return Object.keys(GENERATOR_REGISTRY);
}

export function resolveTopicSlug(topicName: string): string {
  return topicName.toLowerCase().replace(/\s+/g, "_");
}
