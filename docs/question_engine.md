# Question Engine

A template-based question generator for Mathematics topics. Generates unique, parameterised questions algorithmically — no AI calls required.

## Available Topics

| Topic | Generator Key | Module | Archetypes |
|-------|--------------|--------|------------|
| Linear Equations | `linear_equations` | `server/services/questionEngine/linearEquations.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |
| Inequalities | `inequalities` | `server/services/questionEngine/inequalities.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |
| Fractional Indices | `fractional_indices` | `server/services/questionEngine/fractionalIndices.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |
| Introduction to Surds | `introduction_to_surds` | `server/services/questionEngine/surdsIntro.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |
| Simplifying Surds | `simplifying_surds` | `server/services/questionEngine/simplifyingSurds.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |

## Architecture

### Topic Registry (Single Source of Truth)

All topics are defined in `shared/topicCatalog.ts`. Each topic entry includes:

```typescript
{
  id: "fractional_indices",
  slug: "fractional-indices",
  name: "Fractional Indices",
  subject: "math",
  hasInteractive: true,
  hasPractice: true,
  generatorKey: "fractional_indices"  // null if no generator exists
}
```

### Generator Registry

`server/services/questionEngine/registry.ts` maps `generatorKey` values to generator modules:

```typescript
import { getGenerator } from "./services/questionEngine/registry";

const gen = getGenerator("fractional_indices");
if (gen) {
  const questions = gen([
    { difficulty: "easy", count: 2 },
    { difficulty: "medium", count: 2 },
  ], seed);
}
```

The registry is the single place where generators are wired up. Warm-up, Exit Ticket, and Practice all resolve generators through it.

## API

### Functions

```typescript
import { generateQuestion, generatePool, generateMixedPool } from "./server/services/questionEngine/linearEquations";

// Single question
const q = generateQuestion("easy", seed?);

// Pool of n unique questions at one difficulty
const pool = generatePool("medium", 5, seed?, ensureUnique?);

// Mixed pool across multiple difficulties
const mixed = generateMixedPool([
  { difficulty: "easy", count: 2 },
  { difficulty: "medium", count: 2 },
], seed?);
```

### REST Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/question-engine/generate?difficulty=easy&n=4&seed=123` | Generate linear equations pool |
| `GET /api/question-engine/warmup?seed=123&topic=fractional_indices` | Topic-aware warmup: 2 easy + 2 medium |
| `GET /api/question-engine/exit-ticket?seed=123&topic=fractional_indices` | Topic-aware exit ticket: 1 medium + 1 hard |
| `GET /api/question-engine/inequalities/generate?difficulty=easy&n=4` | Inequalities-specific pool |
| `GET /api/question-engine/fractional-indices/generate?difficulty=easy&n=4` | Fractional indices-specific pool |
| `GET /api/question-engine/surds-intro/generate?difficulty=easy&n=4` | Surds intro-specific pool |
| `GET /api/question-engine/simplifying-surds/generate?difficulty=easy&n=4` | Simplifying surds-specific pool |

The `topic` query parameter on `/warmup` and `/exit-ticket` accepts any registered generator key.

### Question Format

```json
{
  "id": "a1b2c3d4e5f6",
  "topic": "fractional_indices",
  "difficulty": "easy",
  "archetype": "eval_half",
  "prompt": "Evaluate 16^(1/2).",
  "answer": "4",
  "worked_solution": [
    "16^(1/2) = √16",
    "√16 = 4"
  ],
  "metadata": {
    "params": { "base": 16 },
    "skills": ["convert_to_radical", "evaluate_perfect_power"],
    "estimated_time_sec": 25
  }
}
```

## Adding a New Topic (Step-by-Step)

To add a new topic to the question engine, you only need to touch **3 files** (plus a test):

### 1. Create the generator module

Create `server/services/questionEngine/<topicName>.ts` following the existing pattern:

```typescript
// Define archetypes grouped by difficulty
const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
  "archetype_name": (rng: SeededRandom) => {
    // Generate random parameters using rng
    // Build prompt, answer, worked_solution
    // Return GeneratedQuestion object
  },
};

// Export the three standard functions
export function generateQuestion(difficulty, seed?) { ... }
export function generatePool(difficulty, n, seed?, ensureUnique?) { ... }
export function generateMixedPool(config, seed?) { ... }
```

### 2. Register in the generator registry

Add one line to `server/services/questionEngine/registry.ts`:

```typescript
import { generateMixedPool as generateNewTopicPool } from "./<topicName>";

const GENERATOR_REGISTRY: Record<string, GeneratorFn> = {
  linear_equations: generateLinearEqPool,
  inequalities: generateIneqPool,
  fractional_indices: generateFracIdxPool,
  new_topic: generateNewTopicPool,  // <-- add here
};
```

### 3. Add to the topic catalog

Add the topic entry to `shared/topicCatalog.ts` with `generatorKey` set:

```typescript
{
  id: "new_topic",
  slug: "new-topic",
  name: "New Topic",
  description: "...",
  gradeRange: [8, 10],
  estimatedMinutes: 35,
  hasInteractive: true,
  hasPractice: true,
  generatorKey: "new_topic",
}
```

### 4. Add tests

Create `tests/test_<topicName>_generator.ts` with coverage for:
- Required keys on every generated question
- Seeded determinism (same seed → same output)
- Uniqueness within pools
- Difficulty-specific constraints

### That's it!

Once the `generatorKey` is registered, the following features **automatically work** without any additional code changes:

- Warm-up questions use the topic's generator
- Exit Ticket questions use the topic's generator
- Session questions supplement DB questions with engine-generated ones
- "Regenerate" buttons in Warm-up and Exit Ticket re-seed per topic

## Determinism and Uniqueness

- Pass `seed` for reproducible output (uses a linear congruential generator).
- `id` is a deterministic SHA-256 hash of `(difficulty, archetype, params)` — same parameters always produce the same ID.
- `generatePool(..., ensureUnique=true)` retries up to 50×n attempts to avoid duplicate IDs.

## Integration Points

- **Session Questions**: For topics with a registered generator, the engine supplements DB questions in `/api/topics/:id/session-questions`.
- **Warm-up**: Default 2 easy + 2 medium from the engine, resolved per topic.
- **Exit Ticket**: Default 1 medium + 1 hard from the engine, resolved per topic.
- **Regenerate Button**: Students can click "New Questions" in warm-up and exit ticket steps to get a fresh topic-specific set.

## Running Tests

```bash
npx tsx tests/test_linear_equations_generator.ts
npx tsx tests/test_inequalities_generator.ts
npx tsx tests/test_fractional_indices_generator.ts
npx tsx tests/test_surds_intro_generator.ts
npx tsx tests/test_simplifying_surds_generator.ts
```

## Formatting Conventions

- Surd notation: Use `√` (U+221A) for square roots in prompts and answers (e.g., `√2`, `3√5`)
- No decimal approximations: All answers must be exact (e.g., `2√3` not `3.464`)
- Fractions: Use `/` notation (e.g., `√3/3`)
- Coefficient with surd: Write coefficient directly before radical (e.g., `5√2`, not `5 × √2`)
- Worked solutions: Array of step strings, each describing one logical step
