# The Impression Engine

A single-file app for changing one paradigm on purpose.

Open `index.html` in any browser. No build step, no server, no dependencies, no account. Everything you enter stays in that browser's local storage and is never sent anywhere. On a phone, add it to the home screen and it behaves like an app.

## What it is

Three sources, implemented as a daily mechanism rather than a reading list:

- **Bob Proctor** — a paradigm is a bundle of habits held in the subconscious, and results are its printout. There are two ways in: an emotional impact you cannot schedule, or constant spaced repetition you can.
- **Price Pritchett, _You²_** — the change is a discontinuous leap, not a ramp. You behave your way into the new thinking, and the method arrives after the commitment, not before it.
- **_Change Your Paradigm, Change Your Life_** — the self-image sets a ceiling, the terror barrier marks the edge of the old paradigm, and displacement happens on boring days.

The library inside the app restates the working principles in plain language with the source attached. It is not a substitute for reading the originals.

## The one idea the app is built around

Repetition and behaviour **multiply**. They do not add.

- Impressions with no out-of-character action is rehearsal. You memorise a sentence and change nothing.
- Action with no impression snaps back the first hard week, because the subconscious never got the new instruction.

So the displacement figure on the Reading screen is a geometric mean of the two sides. Either one at zero puts the whole number at zero, and the app says which side is weak rather than congratulating you on the other.

## How to use it

1. **Shift** — a six-step build. Read your results, name the paradigm behind them, list the three habits it wears, write the replacement statement, set a C-goal, and define the swaps plus one daily out-of-character act. The statement is validated against five ways affirmations fail (future tense, negatives, no feeling word, too long to hold, too thin to picture). The C-goal is checked for incremental language, because an A-goal keeps the old method alive.
2. **Today** — strike the statement five times a day from six rotating angles: speak it, see it, feel it, write it from memory, prove it from the last 24 hours, seal it before sleep. Then the daily act, the habit swaps, one faculty drill, and the terror barrier check.
3. **Record** — evidence, wall crossings and retreats, and filed failures. A retreat is logged, never scolded: it marks where the edge sits.
4. **Reading** — displacement figure, streaks, milestones at 30 / 60 / 90 days, and a stepped chart of out-of-character acts. Stepped on purpose — the change is discontinuous.

## Data

Local storage only, tied to the one browser. Clearing site data or switching phones wipes it.

**Back up** on the Reading screen gives you the JSON two ways: copy the text, or save it as a file. Copying is the one that always works — saving a file needs a host that allows it, which the published page asks the viewer for and a local file handles itself. **Restore** takes pasted text or a file, and replaces everything currently stored.
