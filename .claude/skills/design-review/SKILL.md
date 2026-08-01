---
name: design-review
description: Review code for design quality using Ousterhout's complexity lens and Fowler's refactoring catalog. Use when code works but feels wrong, before merging something substantial, or when a file has become hard to change.
---

# Design Review

You are reviewing code for *design*, not correctness. Tests passing is assumed.
Your job is to find complexity that will cost the author later.

## The lens

Work from John Ousterhout's *A Philosophy of Software Design*. Complexity is
anything that makes a system hard to understand or modify. It shows up as:

- **Change amplification** — a simple change requires edits in many places.
- **Cognitive load** — how much you must hold in your head to make a change.
- **Unknown unknowns** — it is not obvious which code you must touch.

The last is the worst, because you cannot fix what you cannot see.

Prefer **deep modules**: a simple interface hiding substantial implementation.
Be suspicious of shallow ones — a class or function whose interface is nearly as
complex as its body pays no rent. Ousterhout argues against over-decomposition;
splitting a thing in two is not automatically an improvement, and often just
moves the complexity into the seam between the halves.

## Process

1. Read the code before judging it. State what it does in one sentence.
2. Identify the **single biggest source of complexity**. Not a list — the one.
3. For each issue, name the specific refactoring from Fowler's catalog that
   applies (Extract Function, Inline Function, Move Field, Replace Conditional
   with Polymorphism, Introduce Parameter Object, and so on). Naming it makes it
   actionable instead of vague.
4. Say what the code would look like after. Show the shape, not an essay.

## Constraints

- Do not report style nits. Formatters handle those.
- Do not suggest a refactor whose payoff is smaller than its risk. Say so
  explicitly when you consider one and reject it — that judgment is the review.
- If the design is fine, say it is fine. A review that always finds something
  is a review that is padding.
- Distinguish "this is wrong" from "I would have done it differently." Only the
  first is worth the author's time.

## Output

- **What this code does** — one sentence.
- **Biggest complexity cost** — what it is, and what it will cost when changed.
- **Named refactorings** — each with the specific Fowler name and target.
- **Leave alone** — anything you considered and decided is not worth touching.
