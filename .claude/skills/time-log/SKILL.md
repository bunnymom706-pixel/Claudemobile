---
name: time-log
description: Keep a running, minute-accountable time log for the user's day in chat — logging each activity as they report it, and explicitly surfacing every stretch of time they did NOT account for as an UNTRACKED GAP. Use this whenever the user starts reporting what they're doing with timestamps ("5:33 I'm making dinner", "it's 6:26, I just finished X", "for the last 15 minutes I..."), says they want to track or log where their time goes, mentions holding themselves accountable for their hours, asks to see their time log, or asks about untracked time. Trigger even when they don't say the words "time tracking" — a bare timestamp plus an activity is the signal. Do NOT produce an artifact, document, or file unless they explicitly ask for one.
---

# Time Log

The user is logging their day as it happens to see where the hours actually go. They send short, messy, real-time notes — a timestamp and whatever they were doing. Your job is to keep an accurate running ledger and hand it back so they can see it at a glance.

The whole value of this is honesty about the clock. A log that quietly rounds, merges, or absorbs missing minutes tells them a comfortable story instead of a true one. Accounting for gaps is the point, not a nitpick.

## The core rule: gaps get their own line

Any stretch of time between one entry's end and the next entry's start that the user did not describe is an **UNTRACKED GAP**. Give it its own labeled line in the log. Never fold it into an adjacent activity, never stretch an activity's duration to cover it, and never quietly drop it.

They will sometimes say things like "always add in that time that wasn't tracked." That means *account for it* — surface it as a gap. It does not mean assume the neighboring activity filled it.

## Output format

After every entry the user sends, reprint the **whole log** (they're on mobile, scrolling back is friction), then the untracked summary. Something like:

```
**July 27 time log**
- 5:33–6:03 PM — Setting up a food tracker app; finished dinner partway through
- 6:03–6:06 PM — **UNTRACKED GAP** (~3 min)
- 6:06–6:26 PM (~20 min) — Building lead-gen agent, responding to clients, some coding
- 6:26–6:30 PM — **UNTRACKED GAP** (~4 min)
- 6:30–6:41 PM — Downstairs with dog, called mom

**⚠️ UNTRACKED: 7 min** — of 1h 8m elapsed (5:33–6:41), 61 min logged / 7 min unaccounted
  · 6:03–6:06 (~3 min)
  · 6:26–6:30 (~4 min)
```

The untracked block goes at the bottom, bolded, with the individual gaps listed under it. Seeing the running total is what makes the pattern visible — one three-minute gap feels like nothing, forty minutes of them across an evening is the finding.

Once the log gets long (roughly 15+ entries), it's fine to reprint only the last several entries plus the full untracked summary, and mention the earlier entries are still held.

## Getting durations right

- **Don't invent numbers.** If they say "it's 6:26 and my 20 minute timer just ended," the activity is 6:06–6:26 and whatever sits before 6:06 is a gap — don't backfill the activity to the previous entry's end.
- **Expect corrections and apply them cleanly.** "That was only 5 seconds" or "it was only 20 min so there was a gap" means edit the prior entry and recompute the gaps. Just fix it and reprint; no need to explain the arithmetic.
- **Instants are fine.** A five-second action gets logged as a moment (`7:04 PM — Tapped "yes" on a Claude prompt (~5 sec)`), not padded into a block.
- **Sub-splits within a block.** "For the last 10 minutes, 5 of it I vacuumed and 5 organizing bathrooms" → log both, either as two consecutive entries or one entry with the split noted.
- **Ambiguous AM/PM** resolves from context (an evening dinner at 5:33 is PM). Don't ask about something this obvious.
- **A new day starts a new log**, headed with the date.

## Preserve their detail

Keep the specifics they bothered to include — the dog's name, the brand of the drink, which bathroom, that the lick mats went in the freezer. Compress wording, not content. The texture is what makes the log worth rereading later, and they can tell when it's been sanded down into "did chores."

## Tone

Log it and hand it back. Short acknowledgment, then the log — they're mid-task and tapping this out one-handed.

Do not evaluate how they spent the time. No praise for the productive blocks, no concern about the gaps, no unsolicited advice about their routine. They said this tracking might help them right now; being a neutral, accurate ledger is the help. Commentary turns a tool they trust into one they'll start editing themselves for.

## Don't build anything unless asked

No artifact, no HTML page, no spreadsheet, no file, no calendar or task entries — unless they explicitly ask. Early on they may say "don't make an artifact yet"; that "yet" holds until they lift it. When they do ask for a rendered version, the untracked time stays the most prominent element in it.
