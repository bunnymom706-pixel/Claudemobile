# Skills

Custom skills for this repo. Invoke with `/<name>` in Claude Code.

## Coding

| Skill | Use when |
|---|---|
| `/design-review` | Code works but feels wrong; before merging something substantial |
| `/debug-reset` | Stuck on the same bug for 30+ minutes |
| `/test-gap` | Before refactoring risky code, or inheriting unfamiliar code |
| `/perf` | Something is slow — measure before optimizing |
| `/explain-this` | New codebase, or your own code months later |

Claude Code also ships with `/simplify`, `/code-review`, and `/security-review`.
Try those first — they may already cover what you need.

## Thinking and work

| Skill | Use when |
|---|---|
| `/thought-partner` | Working out an idea, decision, or piece of writing |
| `/quantum-leap` | A goal is stuck and effort is not moving it |
| `/meta-prompt` | Before any substantial AI task — write the prompt properly once |
| `/reset` | Feeling stuck or scattered; 30-day diagnostic |

## Money and business

| Skill | Use when |
|---|---|
| `/money-review` | Wondering what to do with money, or how to set things up |
| `/leverage-audit` | Working hard without compounding; deciding what to stop |
| `/offer-critic` | Before launching something, or when it is not selling |
| `/positioning` | Your description of what you do sounds like everyone else's |

## Health

| Skill | Use when |
|---|---|
| `/train` | Starting to train, or a current plan is not sticking |

## A workflow that fits together

1. `/simplify` after finishing a change
2. `/design-review` when it is substantial
3. `/test-gap` before refactoring anything risky
4. `/debug-reset` the moment you have been stuck 30 minutes
5. `/security-review` before anything touching auth, payments, or user input

## Attribution

The prompt text in these files was written for this repo. None of it is copied
from the authors below — what is borrowed is their framework, applied.

| Skill | Framework |
|---|---|
| `design-review` | Ousterhout, *A Philosophy of Software Design*; Fowler & Beck, *Refactoring* |
| `test-gap` | Michael Feathers, *Working Effectively with Legacy Code* |
| `debug-reset`, `quantum-leap` | Price Pritchett, *you²* |
| `thought-partner`, `meta-prompt` | Method modeled on Dan Koe's prompts |
| `money-review` | Morgan Housel, Ramit Sethi, Nick Maggiulli |
| `leverage-audit` | Naval Ravikant's leverage framework |
| `offer-critic` | Alex Hormozi, *$100M Offers* |
| `positioning` | Justin Welsh; Dan Koe |
| `train` | Layne Norton, Stronger by Science, Renaissance Periodization |
| `reset` | General coaching structure |

Sources and links: [`RESOURCES.md`](../../RESOURCES.md).

The books are worth reading directly. These skills apply the ideas; they do not
replace them.

## Note on `/train` and `/money-review`

Both carry explicit safety constraints in their instructions — `/train` refuses
to design aggressive restriction and names the signals that mean *see a doctor*
rather than *keep going*; `/money-review` is general information, not
personalized financial advice. Those constraints are deliberate. If you edit
these files, keep them.
