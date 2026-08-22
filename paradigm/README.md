# The Impression Engine

> Looking for the simple one? [`mirror/`](mirror/) is the **Paradigm Mirror** — type what is happening and it names the paradigm underneath, highlighting the words in your own sentence that gave it away. No program, no streak. Start there if you are not sure what to point this at.

A single-file app for changing a paradigm on purpose, and for shifting your state on demand when the old one flares up.

No build step, no server, no dependencies, no account, no network calls. Everything you enter stays in your own browser and is never sent anywhere — including not into this public repository.

## Getting it on your home screen

**iPhone.** Open the Pages URL in **Safari** (it must be Safari, not Chrome), tap the share button, then **Add to Home Screen**. It launches full screen with no browser chrome and works with no signal.

**Android.** Open it in Chrome, then **Install app** from the menu.

**Anywhere.** `index.html` also runs by double-clicking it. Everything works except offline caching, which needs a real https origin.

To publish the Pages URL: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys the `paradigm/` folder on every push to `main`, and the URL will be `https://<owner>.github.io/Claudemobile/`.

## What it is

Three bodies of work, implemented as a mechanism rather than a reading list:

- **Bob Proctor** — a paradigm is a bundle of subconscious habits, mostly installed before age seven, running roughly 95% of behaviour. Results are its printout. Two ways in: an emotional impact you cannot schedule, or spaced repetition you can. Feeling is your conscious awareness of the vibration you are in.
- **Napoleon Hill** — exact amount, what you give in return, definite date, begin at once ready or not, written statement read aloud twice daily. Proctor taught these for fifty years.
- **Price Pritchett, _You²_** — the change is a discontinuous leap, not a ramp. You behave your way into it, and the method arrives after the commitment.

And then, where the evidence contradicts the naive version of that practice, the evidence wins. Full citations in `RESEARCH.md`.

## The two ideas the app is built on

**One. Repetition and behaviour multiply — they do not add.** Impressions with no out-of-character act is rehearsal. Action with no impression snaps back the first hard week. So the displacement figure is a geometric mean: either side at zero puts the whole number at zero, and the app names which side is weak instead of averaging the failure away.

**Two. Visualising the outcome on its own makes things worse.** Oettingen found vivid positive fantasy predicted *less* weight lost, slower recovery and lower starting salaries — the mind treats the imagined result as partly achieved and stands down. So no picture step in this app runs without an obstacle step immediately after it, and every one closes on an if-then plan.

## The screens

**Shift me now** — always on screen, on every tab. A ninety-second protocol for when the old paradigm flares: *locate* the feeling (naming it is what starts it moving), *breathe to neutral* with five rounds of cyclic sighing, *choose the image*, *name the obstacle*, *commit an if-then move*, then re-rate yourself. Every run is logged with its before-and-after, so the Record tab can tell you whether it actually works for you.

**Today** — strike the statement several times a day from six rotating angles: speak it, contrast it, feel it, write it from memory, prove it from the last 24 hours, seal it before sleep. Then the daily out-of-character act, the habit swaps, one faculty drill, and the terror-barrier check.

**Paradigms** — run several, switch the active one, archive the finished. Holds the money-roots module and the number.

- *Money roots* — eight items scoring the four Klontz money scripts, then the inherited rule and the counter-rule you choose instead. It asks what rule you were handed. It never asks what happened, and there is no field for it.
- *The number* — target income divided by average rent and commission into leases, then into conversations, then into a count you can do before lunch.

**Record** — instant shifts with their average movement, evidence, wall crossings and retreats, filed failures.

**Reading** — displacement score, streaks, 30/60/90 milestones, and out-of-character acts drawn as a step chart, because the change is discontinuous.

**Law** — every principle in plain language with its source, including the six findings that correct the practice.

## Believability, and why it matters

Wood, Perunovic & Lee found that people repeating "I am a lovable person" felt **worse** afterwards if they had low self-esteem, and better only if they already had high self-esteem. An affirmation collides with what you actually believe, and the collision goes to the incumbent.

So the builder asks you to rate the statement 1–10 for how true it feels when you say it out loud. Below 5, it routes you to a bridge statement you can actually accept — including the interrogative "Will I…?" form, which outperforms the declarative on real behaviour — and promotes you to the full statement only once you have logged ten pieces of evidence for it.

## Data

Local storage only, tied to that one browser. Clearing site data or switching phones wipes it. **Back up** on the Paradigms tab gives you the JSON two ways: copy the text, which always works, or save it as a file. **Restore** takes pasted text or a file. Do it before switching phones.

## Boundary

This is belief and behaviour work. It is not treatment for trauma and does not substitute for it. If the childhood material itself becomes the loud part — not the money rule, the memory — that is a different track and it needs a qualified person.
