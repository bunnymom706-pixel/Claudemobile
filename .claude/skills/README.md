# Skills

Custom skills for this repo. Invoke with `/<name>` in Claude Code.

## Coding

| Skill | Use when |
|---|---|
| `/design-review` | Code works but feels wrong; before merging something substantial |
| `/debug-reset` | Stuck on the same bug for 30+ minutes |
| `/test-gap` | Before refactoring risky code, or inheriting unfamiliar code |

Claude Code also ships with `/simplify`, `/code-review`, and `/security-review`.
Try those first — they may already cover what you need.

## Thinking

| Skill | Use when |
|---|---|
| `/quantum-leap` | A goal is stuck and effort is not moving it |
| `/thought-partner` | Working out an idea, decision, or piece of writing |

## Attribution

The prompt text in these files was written for this repo. It is not copied from
any of the authors below — what is borrowed is their framework, applied.

- **`design-review`** — John Ousterhout, *A Philosophy of Software Design*
  (complexity, deep modules); Martin Fowler & Kent Beck, *Refactoring*
  (the named refactoring catalog, free at refactoring.com/catalog).
- **`test-gap`** — Michael Feathers, *Working Effectively with Legacy Code*
  (seams, characterization tests).
- **`debug-reset`**, **`quantum-leap`** — Price Pritchett, *you²: A High-Velocity
  Formula for Multiplying Your Personal Effectiveness in Quantum Leaps*
  (try differently not harder; solutions are easier than problems; move before
  you are ready).
- **`thought-partner`** — method modeled on Dan Koe's one-question-at-a-time
  interrogation prompts.

The books are worth reading directly. These skills apply the ideas; they do not
replace them.
