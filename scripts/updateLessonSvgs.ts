import * as fs from "fs";

const svgs: Record<string, string> = JSON.parse(fs.readFileSync("/tmp/lesson_svgs.json", "utf8"));

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const updates: { id: number; content: string }[] = [
  {
    id: 151,
    content: `## What Are Simultaneous Equations?

When we have **two equations** with two unknowns (usually x and y), we call them **simultaneous equations**. The solution is the pair of values (x, y) that makes **both** equations true at the same time.

## Graphical Method

Each linear equation (like y = 2x + 1) represents a **straight line** on a coordinate plane. When we draw both lines on the same graph:

- The **intersection point** — where the two lines cross — gives us the solution.
- The x-coordinate of that point is the value of x, and the y-coordinate is the value of y.

### Example Graph: Two Lines Intersecting

The graph below shows **L₁: y = 2x − 1** (blue) and **L₂: y = −x + 5** (red dashed). They intersect at the green dot **(2, 3)**.

${svgs.explanation}

## How to Read the Intersection

1. Look at where the two lines **cross each other**.
2. Drop a vertical line down to the x-axis to read the **x-value**.
3. Draw a horizontal line across to the y-axis to read the **y-value**.
4. Write the answer as a coordinate pair: **(x, y)**.

## Key Points

- The intersection point satisfies **both** equations simultaneously.
- If the lines cross at (3, 1), it means x = 3 and y = 1 is the solution.
- Always read coordinates carefully using the grid lines — don't estimate between grid lines unless you have to.`,
  },
  {
    id: 152,
    content: `## Worked Example: Finding the Intersection

**Question:** The graph shows two lines. Find the solution where the two lines intersect.

The graph shows:
- **Line L₁** (blue solid): y = 2x − 1
- **Line L₂** (red dashed): y = −x + 5

${svgs.example1}

### Step 1: Locate the Crossing Point
Look at the graph carefully. The two lines cross at one specific point — marked with a green dot.

### Step 2: Read the Coordinates
- Follow the crossing point **down** to the x-axis → x = **2**
- Follow the crossing point **across** to the y-axis → y = **3**

### Step 3: Write the Answer
The intersection point is **(2, 3)**.

### Step 4: Quick Check
- In L₁: y = 2(2) − 1 = 4 − 1 = **3** ✓
- In L₂: y = −(2) + 5 = −2 + 5 = **3** ✓

Both equations give y = 3 when x = 2, confirming **(2, 3)** is correct.

---

**Another Example:** Two lines cross at (−1, 4).

${svgs.example2}

- Read from the graph: go left to x = −1, up to y = 4.
- Answer: **(−1, 4)**.`,
  },
  {
    id: 153,
    content: `## Practice: Reading Intersection Points

Try these exercises. For each graph, identify the intersection point and write it as (x, y).

**Exercise 1:** Two lines cross at a point in the first quadrant (top-right area of the graph). The crossing point lines up with x = 1 on the horizontal axis and y = 3 on the vertical axis.
- **Answer:** (1, 3)

**Exercise 2:** Two lines intersect in the third quadrant. The crossing point is at x = −2 and y = −1.
- **Answer:** (−2, −1)

**Exercise 3:** A horizontal line y = 2 crosses a sloped line. They meet directly above x = 4.
- **Answer:** (4, 2)

### Tips for Reading Graphs Accurately
- Use the **grid lines** to help you — line up the intersection with the nearest marks on both axes.
- If the intersection falls **between** grid lines, look very carefully and estimate to the nearest half-unit.
- Always check by substituting back into both equations if they are given.

### Common Mistakes to Avoid
- Mixing up x and y coordinates (remember: x comes first, y comes second).
- Misreading the scale on the axes.
- Forgetting negative signs when the point is in the second, third, or fourth quadrant.`,
  },
  {
    id: 154,
    content: `## Why Verify Your Answer?

Reading a graph can sometimes lead to small errors — you might misread a coordinate by one unit, or mix up the x and y values. **Verification by substitution** is a quick way to check your answer is correct.

## How to Verify

Once you have read the intersection point (x, y) from the graph:

1. **Substitute** the x-value into **Equation 1** and check that you get the y-value.
2. **Substitute** the x-value into **Equation 2** and check that you also get the y-value.
3. If **both** equations give the correct y-value, your answer is confirmed.

### Example: Lines y = 3x − 4 and y = −x + 8

${svgs.verify}

From the graph, the intersection appears to be **(3, 5)**. Let's verify:
- Equation 1: y = 3(3) − 4 = 9 − 4 = **5** ✓
- Equation 2: y = −(3) + 8 = **5** ✓

Both match, so **(3, 5)** is confirmed!

## What If It Doesn't Work?

- If one or both equations don't match, **re-read the graph** more carefully.
- Double-check you haven't swapped x and y.
- Make sure you are using the correct sign (positive or negative).`,
  },
  {
    id: 155,
    content: `## Worked Example: Verifying a Solution

**Question:** The graph shows y = 3x − 4 and y = −x + 8. The lines appear to cross at (3, 5). Verify this is the correct solution.

${svgs.verify}

### Step 1: Substitute into Equation 1
y = 3x − 4
y = 3(3) − 4
y = 9 − 4
y = **5** ✓ (matches the y-coordinate)

### Step 2: Substitute into Equation 2
y = −x + 8
y = −(3) + 8
y = −3 + 8
y = **5** ✓ (matches the y-coordinate)

### Step 3: Conclusion
Since both equations give y = 5 when x = 3, the solution **(3, 5)** is verified.

---

**Example 2:** Lines y = 2x + 1 and y = −x − 2 appear to cross at (−1, −1).

${svgs.verify2}

- Equation 1: y = 2(−1) + 1 = −2 + 1 = **−1** ✓
- Equation 2: y = −(−1) − 2 = 1 − 2 = **−1** ✓

Both check out, so **(−1, −1)** is confirmed as the solution.`,
  },
  {
    id: 156,
    content: `## Practice: Verifying Solutions

For each problem, you are given the equations and the intersection point read from the graph. Verify by substitution.

**Exercise 1:** y = x + 2 and y = −2x + 8. Intersection appears to be (2, 4).
- Check Eq 1: y = 2 + 2 = **4** ✓
- Check Eq 2: y = −2(2) + 8 = −4 + 8 = **4** ✓
- **Verified: (2, 4)** is correct.

**Exercise 2:** y = −x + 3 and y = 2x − 3. Intersection appears to be (2, 1).
- Check Eq 1: y = −(2) + 3 = **1** ✓
- Check Eq 2: y = 2(2) − 3 = 4 − 3 = **1** ✓
- **Verified: (2, 1)** is correct.

**Exercise 3:** y = x − 1 and y = −3x + 7. A student reads the intersection as (3, 2). Is this correct?
- Check Eq 1: y = 3 − 1 = **2** ✓
- Check Eq 2: y = −3(3) + 7 = −9 + 7 = **−2** ✗
- **The student made an error!** The answer (3, 2) does NOT satisfy Equation 2.
- Correct answer: Set x − 1 = −3x + 7 → 4x = 8 → x = 2, y = 1. The correct solution is **(2, 1)**.

### Lesson
Always verify — it only takes 30 seconds and catches reading mistakes!`,
  },
  {
    id: 157,
    content: `## Special Cases: Not All Systems Have One Solution

So far, we have seen systems where two lines cross at exactly one point. But there are two special cases where this doesn't happen.

## Case 1: Parallel Lines → No Solution

Two lines are **parallel** when they have the **same gradient** (slope) but **different y-intercepts**.

For example: **y = −x + 4** and **y = −x + 1**

${svgs.parallel}

Both lines have gradient −1, so they go in the same direction. But they start at different heights (y-intercepts 4 and 1). They will **never meet** — no matter how far you extend them.

**Answer: "no solution"**

## Case 2: Coincident Lines → Infinitely Many Solutions

Two equations are **coincident** when they produce the **exact same line**.

For example: **y = 2x − 3** and **2y = 4x − 6** (which simplifies to y = 2x − 3)

${svgs.coincident}

They have the same gradient AND the same y-intercept. On the graph, you only see **one line** — because they overlap completely. Every point on the line is a solution.

**Answer: "infinitely many solutions"**

## Summary Table

| Lines | Gradients | Y-intercepts | Solutions |
|-------|-----------|-------------|-----------|
| Cross at one point | Different | Any | **One solution** (x, y) |
| Parallel | Same | Different | **No solution** |
| Identical | Same | Same | **Infinitely many** |`,
  },
  {
    id: 158,
    content: `## Worked Example: Identifying Special Cases

**Example 1: No Solution (Parallel Lines)**

The graph shows y = −x + 4 and y = −x + 1.

${svgs.parallel}

- Both lines have gradient **−1** (they slope downward at the same angle).
- But their y-intercepts are different: 4 and 1.
- On the graph, the lines run side by side and **never cross**.
- **Answer: no solution**

---

**Example 2: Infinitely Many Solutions (Coincident Lines)**

A student graphs y = 2x − 3 and 4x − 2y = 6.

${svgs.coincident}

Rearranging the second equation:
4x − 2y = 6 → −2y = −4x + 6 → y = 2x − 3

Both equations simplify to y = 2x − 3. The graph shows **only one line** because they are identical.

- **Answer: infinitely many solutions**

---

**Example 3: One Solution (Different Gradients)**

The graph shows y = x + 1 and y = −2x + 7.

${svgs.oneSolution}

- The gradients are 1 and −2 — they are **different**.
- The lines must cross somewhere.
- From the graph, they cross at **(2, 3)**.
- Verify: 2 + 1 = 3 ✓ and −2(2) + 7 = 3 ✓.
- **Answer: (2, 3)**`,
  },
  {
    id: 159,
    content: `## Practice: Classifying Systems

For each system below, determine whether it has one solution, no solution, or infinitely many solutions.

**Exercise 1:** y = 3x + 2 and y = 3x − 5

${svgs.practiceParallel}

- Gradients: both **3** (same)
- Y-intercepts: 2 and −5 (different)
- **Answer: no solution** — the lines are parallel.

**Exercise 2:** y = −2x + 4 and y = x + 1

${svgs.practiceOneSol}

- Gradients: −2 and 1 (different)
- The lines must cross.
- Set −2x + 4 = x + 1 → 3 = 3x → x = 1, y = 2.
- **Answer: one solution, (1, 2)**

**Exercise 3:** y = x − 3 and 2y − 2x = −6
- Rearrange: 2y = 2x − 6 → y = x − 3.
- Both equations are y = x − 3 — the same line!
- **Answer: infinitely many solutions**

**Exercise 4:** y = −x + 5 and y = 2x − 1
- Gradients: −1 and 2 (different)
- Set −x + 5 = 2x − 1 → 6 = 3x → x = 2, y = 3.
- **Answer: one solution, (2, 3)**

### Quick Decision Guide
1. Compare the gradients first.
2. If different → **one solution** (find the intersection).
3. If same → check the y-intercepts.
4. Same intercept too → **infinitely many solutions**.
5. Different intercepts → **no solution**.`,
  },
];

for (const u of updates) {
  console.log(`-- Segment ${u.id}: ${u.content.length} chars, has SVG: ${u.content.includes("<svg")}`);
}

// Output SQL
for (const u of updates) {
  console.log(`\nUPDATE lesson_segments SET content = '${esc(u.content)}' WHERE id = ${u.id};`);
}
