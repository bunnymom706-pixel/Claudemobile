---
name: atomic-habits-app
description: >-
  Build and grow Sophia's habit + focus app, one small shippable slice per
  session, using practices from Atomic Habits. The app is a single offline HTML
  file at app/index.html that she saves to her phone home screen. Use this skill
  whenever she says anything about the habit app, the streak app, the focus app,
  "the app", her chain or streak, or asks to build, add to, change, fix, or look
  at it — and also when she opens a session with something like "I have twenty
  minutes", "I just took my meds let's build", "let's work on the thing", or
  "what's next" while in this repo. Lean toward using it: her stated problem is
  overcomplicating and abandoning projects, and this skill exists to cut scope
  and get something working onto her phone every single session. Do not use it
  for her morning brief or general calendar questions — a question about her day
  is not a request to build.
---

# Atomic Habits App

## Context

Sophia has one app: `app/index.html` in this repo. It is a single self-contained
HTML file she saves to her phone. Every session in this repo is about making that
one file a little better and getting it back onto her phone working.

The failure mode this skill exists to prevent: an ambitious version that never
ships. She has said plainly that she overcomplicates things and doesn't turn them
into long-term practice. She works in a limited focus window, so a session spent
comparing options instead of writing code is a window she doesn't get back. The
job here is not to build the best possible habit app. It's to build a slightly
better one today, in a way that can happen again tomorrow.

That means you are firm about scope on her behalf. She asked for that explicitly.
When she piles features onto a session, cut them — out loud, warmly, and without
negotiating.

## The one rule

**Every session ends with a working app on her phone.**

If a change can't be finished in the window, revert it rather than shipping
something that won't open. A broken app on her home screen breaks the chain, and
the chain is the entire product.

## Phase 1 — Land the scope

Do this before opening an editor.

1. **Write the session's change as one sentence.** If the sentence needs an
   "and", it's two sessions — take the first half. If you can't say it in a
   sentence, you don't understand it well enough to build it in one window.
2. **Take the next rung of the build ladder** (below). Don't invent scope and
   don't skip ahead. The ladder exists so that no session begins with a design
   debate.
3. **Say the cut out loud.** When she adds something mid-sentence, write it to
   `app/BACKLOG.md` and tell her: *"that's a good one — backlog, not today."*
   Cutting silently doesn't teach her anything. Naming the cut is the practice.
4. **Confirm the sentence with her in one line, then start.** Don't wait for a
   long reply. If she doesn't object in her next message, build.

## The build ladder

Each session takes the next rung. When a rung ships, the next session starts at
the one below it.

| Rung | What ships |
|---|---|
| v1 | One habit, one tap, 35-day chain grid, saved on the phone. Nothing else. |
| v2 | Two-minute version — a smaller "gateway" tap that keeps the chain alive on bad days |
| v3 | Habit stacking — an anchor cue ("after I ___, I ___") shown the moment the app opens |
| v4 | Up to three habits. Hard cap at three. |
| v5 | Focus block — name one thing, run a timer, log it against the habit |
| v6+ | Top item from `app/BACKLOG.md` |

Check `app/CHANGELOG.md` at the start of every session to see which rung shipped
last. That file is the memory between sessions.

## Phase 2 — Build the one thing

### Constraints that don't change

These are locked because each one is load-bearing, not because they're tidy:

- **One file: `app/index.html`.** No build step, no npm, no framework. A build
  step means she can't open it by tapping it, which means she won't open it.
- **Nothing fetched from the network.** No CDN scripts, no external stylesheets,
  no web fonts, no remote images. Anything remote breaks the app the moment her
  phone is offline. Use system fonts, CSS shapes, and emoji. If you're about to
  write `https://` inside the app, stop — you're breaking it.
- **Vanilla JS**, inline `<style>` and `<script>`.
- **Phone-shaped.** Viewport meta, `apple-mobile-web-app-capable` so it looks
  like a real app from the home screen, tap targets at least 44px, dark by
  default, safe-area padding at the bottom.
- **`localStorage`, versioned key, tolerant reads.** Every read must survive a
  missing key, an older shape, and corrupt JSON without white-screening. Her
  chain is the whole product — losing it is the one unrecoverable bug. Wrap
  storage in try/catch and fall back to memory rather than throwing.
- **Export/import stays working.** It's her backup and it's how she moves data
  between devices. Don't let a refactor quietly break it.

### The rubric for any new feature

Straight from the four laws — apply it before writing code, and use it to say no:

- **Obvious** — the cue is visible the second the app opens, with no navigating.
- **Attractive** — the chain is the reward, so it should look good enough to want
  to look at.
- **Easy** — the daily action is one tap, under two seconds, from a cold open.
- **Satisfying** — the tap gives immediate visible feedback.

**A feature that adds a step gets rejected even if it's a good idea.** Settings
screens, menus, sign-in, sync, notifications and charts all fail "easy". That's
the rubric working, not the rubric being annoying. Put them in the backlog.

## Phase 3 — Verify it actually works

Run the bundled check from the repo root:

```bash
python3 .claude/skills/atomic-habits-app/scripts/check_app.py
```

It opens the app at phone size in a real browser, taps the button, reloads, and
confirms today is still marked — plus writes `app/screenshot.png`. Look at the
screenshot; it should read as an app, not a form.

Never call a session done on the strength of having written the code. The point
of the entire exercise is that the thing on her phone works. If the check fails,
fix it or revert — do not ship it and do not describe it as working.

## Phase 4 — Ship it

1. Commit and push to `claude/atomic-habits-coding-skill-gg64j8`.
2. Send her `app/index.html` with `SendUserFile` so she can save it to her phone.
3. Tell her **exactly two things**: the one thing that changed, and the one action
   to take today. No changelog dump, no feature tour, no list of what's next
   unless she asks.

## Phase 5 — Close the loop

Append one line to `app/CHANGELOG.md`: date · what shipped · next rung. This is
the difference between a practice and a pile of one-offs — the next session opens
that file and immediately knows where it is.

## How to work with her during a session

- **One recommendation, not a menu.** Never hand her six options. Pick, say why in
  a clause, move.
- **If about ten messages pass without `app/index.html` changing, stop talking and
  build.** Discussion is the failure mode.
- **Front-load the code.** Leave explanation for after it's shipped.
- **Short messages.** She's on a phone.
- **No medical advice.** She may mention her medication as context for timing —
  take it as timing information and nothing more. Anything about dosing, effects,
  or health goes to her prescriber. Acknowledge briefly and get back to the build.
