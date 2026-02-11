# Question Engine

A template-based question generator for Mathematics topics. Generates unique, parameterised questions algorithmically — no AI calls required.

## Available Topics

| Topic | Module | Archetypes |
|-------|--------|------------|
| Linear Equations | `server/services/questionEngine/linearEquations.ts` | 30 (8 easy, 8 medium, 7 hard, 7 challenge) |

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
| `GET /api/question-engine/generate?difficulty=easy&n=4&seed=123` | Generate pool at one difficulty |
| `GET /api/question-engine/warmup?seed=123` | Default warmup: 2 easy + 2 medium |
| `GET /api/question-engine/exit-ticket?seed=123` | Default exit ticket: 1 medium + 1 hard |

### Question Format

```json
{
  "id": "a1b2c3d4e5f6",
  "topic": "linear_equations",
  "difficulty": "easy",
  "archetype": "ax_plus_b_eq_c_pos",
  "prompt": "Solve: 3x + 5 = 14",
  "answer": "x = 3",
  "worked_solution": [
    "Subtract 5 from both sides: 3x = 14 − 5 = 9",
    "Divide both sides by 3: x = 9 ÷ 3 = 3"
  ],
  "metadata": {
    "params": { "a": 3, "b": 5, "c": 14, "x": 3 },
    "skills": ["balance_terms", "isolate_variable"],
    "estimated_time_sec": 30
  }
}
```

## Difficulty Levels

### Easy (8 archetypes)
- `ax + b = c`, `ax − b = c`, `x ÷ k = m`, `b + ax = c`, `c = ax + b`, `ax = c`, `x + b = c`, `x − b = c`
- Constraints: a in [2..9], solutions in [-10..10], no messy negatives

### Medium (8 archetypes)
- Variables on both sides (positive and negative solutions)
- Single bracket expansion: `a(x + b) = c`, `a(bx + c) = d`
- Negative coefficient brackets: `−a(x + b) = c`
- Constraints: integer solutions, a,c in [2..9]

### Hard (7 archetypes)
- Fraction equations: `(ax + b) ÷ k = m`
- Cross-multiplication: `(ax + b)/k = (cx + d)/t`
- Bracket on both sides, fractional answers
- Constraints: denominators ≤ 10, answers in simplest form

### Challenge (7 archetypes)
- Perimeter rectangle word problems
- Consecutive integers sum
- Taxi fare (fixed + per km)
- Percentage reverse (after increase)
- Age problems, coin problems, distance-speed-time
- Constraints: integers where possible, full worked solutions

## Determinism and Uniqueness

- Pass `seed` for reproducible output (uses a linear congruential generator).
- `id` is a deterministic SHA-256 hash of `(difficulty, archetype, params)` — same parameters always produce the same ID.
- `generatePool(..., ensureUnique=true)` retries up to 50×n attempts to avoid duplicate IDs.

## Adding New Topics

1. Create `server/services/questionEngine/<topicName>.ts`
2. Define archetype generators grouped by difficulty using the same pattern:
   ```typescript
   const EASY_ARCHETYPES: Record<string, ArchetypeGenerator> = {
     "archetype_name": (rng: SeededRandom) => {
       // Generate random parameters using rng
       // Build prompt, answer, worked_solution
       // Return GeneratedQuestion object
     },
   };
   ```
3. Export `generateQuestion`, `generatePool`, and `generateMixedPool`.
4. Add REST endpoints in `server/routes.ts`.
5. Add tests in `tests/test_<topicName>_generator.ts`.

## Integration Points

- **Session Questions**: For `linear_equations` topics, the engine supplements DB questions in `/api/topics/:id/session-questions`.
- **Warm-up**: Default 2 easy + 2 medium from the engine.
- **Exit Ticket**: Default 1 medium + 1 hard from the engine.
- **Regenerate Button**: Students can click "New Questions" in warm-up and exit ticket steps to get a fresh set.

## Running Tests

```bash
npx tsx tests/test_linear_equations_generator.ts
```
