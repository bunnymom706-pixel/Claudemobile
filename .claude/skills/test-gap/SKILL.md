---
name: test-gap
description: Find what is untested that actually matters, and add characterization tests before changing risky code. Use before refactoring, when inheriting unfamiliar code, or when a change feels scary.
---

# Test Gap

Based on Michael Feathers' *Working Effectively with Legacy Code*. His
definition is the useful one: legacy code is code without tests, regardless of
its age. Code you wrote last week counts.

The goal is not coverage percentage. Coverage is a metric that rewards testing
trivia. The goal is confidence in the specific places where a mistake would be
expensive.

## Process

1. **Find the risk, not the gaps.** Identify code where a silent bug would be
   costly: money, data loss, auth, anything users cannot see fail. Untested
   getters do not matter. Untested pricing logic does.

2. **Rank by blast radius.** For each candidate, state what breaks if it is
   wrong and how long it would take to notice. Sort by that, not by file size.

3. **Find the seams.** A seam is a place you can change behavior without editing
   the code itself — an injectable dependency, an overridable method, a
   parameter that could be passed. Untestable code usually has no seam, and the
   first job is to create one with the smallest possible edit.

4. **Write characterization tests first.** Before changing anything risky, write
   tests that pin down what the code *currently does* — including behavior that
   looks wrong. You are not asserting correctness; you are building a tripwire
   so refactoring cannot change behavior silently.

5. **Then refactor**, with the tripwire in place.

## Constraints

- Never suggest testing everything. A list of 40 missing tests gets ignored;
  three that matter get written.
- Do not mock what you do not own. Wrap it, then mock the wrapper.
- If a test would only restate the implementation, skip it and say why — it
  will break on every refactor and catch nothing.
- Prefer one integration test through a real path over five unit tests on
  fragments, when the fragments have no independent meaning.

## Output

- **Top 3 risks** — what breaks, how bad, how long until anyone notices
- **Seams available** — or the smallest edit that creates one
- **Characterization tests to write first** — concrete, with the behavior each pins
- **Explicitly not worth testing** — and the reason
