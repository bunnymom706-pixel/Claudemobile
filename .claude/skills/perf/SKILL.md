---
name: perf
description: Diagnose and fix slow code by measuring before optimizing. Use when something is slow, before optimizing anything, or when tempted to guess at a bottleneck.
---

# Performance

The rule that makes everything else work: **measure first**. Programmer
intuition about bottlenecks is famously bad, and optimizing the wrong thing
costs time and adds complexity while the real problem stays untouched.

## Process

1. **Get a number.** How slow, measured how, compared to what? "It feels slow"
   is not a starting point. If there is no measurement yet, the first task is
   producing one.

2. **Define the target.** What is fast enough? Optimization without a stopping
   condition runs forever and makes code worse the whole way.

3. **Profile before touching anything.** Use the real profiler for the language,
   on data the size of production data. Small test data hides the bottleneck and
   sometimes inverts it.

4. **Find the actual hot path.** Usually one thing dominates. Report where the
   time genuinely goes, including when it is somewhere boring — serialization,
   an N+1 query, a filesystem call in a loop.

5. **Check the algorithm before the micro-optimizations.** An O(n²) loop beaten
   down to O(n log n) will outrun any amount of constant-factor tuning. Nested
   loops over collections that grow are the first thing to look at.

6. **Change one thing. Re-measure.** Every time. Multiple simultaneous changes
   make attribution impossible, and some "optimizations" are slower.

## Common wins, roughly in order of frequency

- N+1 queries — the single most common real-world cause
- Missing database index
- Work repeated in a loop that could be hoisted or cached
- Serializing/deserializing more than needed
- Synchronous I/O that could be concurrent
- Accidentally quadratic string or list building

## Constraints

- Never optimize without a before-and-after measurement. Report both.
- State the readability cost of each optimization. Some are not worth it, and
  saying so is part of the job.
- If the code is already fast enough for its actual use, say so and stop.
- Do not add caching to hide a bad query. Fix the query.

## Output

- **Baseline** — the measurement, and how it was taken
- **Hot path** — where time actually goes, with percentages
- **Fix** — the change, its expected gain, and its readability cost
- **After** — the re-measured number
