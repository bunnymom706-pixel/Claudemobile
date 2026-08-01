---
name: explain-this
description: Build a fast, accurate mental model of unfamiliar code. Use when opening a new codebase, reading someone else's module, or returning to your own code after months away.
---

# Explain This

Get someone from "I have no idea what this does" to "I could change this
safely" in one pass. Optimize for a working mental model, not completeness.

## Process

1. **Purpose, in one sentence.** What does this code exist to do, in terms of
   the problem rather than the implementation? If that sentence is hard to
   write, say so — that is real information about the design.

2. **The shape.** What are the main pieces and how do they relate? A short list
   or a rough diagram beats prose. Name the entry point explicitly — the single
   most useful fact about unfamiliar code is where execution starts.

3. **Trace one real path end to end.** Pick the most common operation and follow
   it all the way through, naming each function and file. One concrete trace
   teaches more than a description of every branch.

4. **The non-obvious parts.** What would surprise someone reading this? Implicit
   ordering, global state, a naming convention that misleads, a function that
   does more than its name suggests, a workaround for something external.

5. **Where you would change it.** For the kinds of change most likely to be
   wanted, name the file and function to touch, and what else moves with it.

## Constraints

- Do not narrate line by line. They can read; they need structure.
- Say plainly when something is confusing rather than inventing a rationale for
  it. "This is unclear and here is my best guess" beats false confidence.
- Distinguish what the code *does* from what it *appears intended* to do when
  those differ — that gap is usually a bug or a stale abstraction.
- Point out load-bearing code explicitly. Knowing what not to touch is as
  valuable as knowing where to start.

## Output

- **Purpose** — one sentence
- **Shape** — the main pieces and the entry point
- **One traced path** — end to end, with file and function names
- **Surprises** — what is not obvious from reading
- **If you need to change it** — where to start, what moves with it
