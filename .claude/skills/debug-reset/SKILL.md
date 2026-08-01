---
name: debug-reset
description: Break out of a stuck debugging loop by forcing a different approach instead of more effort. Use when you have been on the same bug for more than about 30 minutes, or are trying the same kind of fix repeatedly.
---

# Debug Reset

Based on Price Pritchett's core argument in *you²*: when you are stuck, the
problem is usually the approach, not the effort. His image is a fly battering
itself against a windowpane — trying harder and harder at the one method it
knows — while a few feet away an open door stands wide.

More effort on the wrong approach produces nothing but a tired fly.

This skill is the open door. It applies to debugging, where "try harder" is the
default failure mode and almost never the fix.

## Process

Ask these in order. One at a time. Wait for the answer.

1. **What exactly have you tried?** List every attempt. Do not summarize —
   enumerate. Patterns only become visible when the list is written down.

2. **What do all those attempts have in common?** This is the windowpane. Name
   the shared assumption underneath them. Almost always there is one, and almost
   always it has gone unexamined because it felt like fact rather than guess.

3. **What are you certain is true that you have not verified?** "The config is
   loading." "That function gets called." "The data looks like I think it does."
   Certainty you have not checked this session is the usual culprit.

4. **Verify exactly one of those.** Not by reasoning — by running something.
   Print it, log it, breakpoint it, curl it. Reasoning is what got you here.

5. **If it is still alive, invert.** Instead of "why is this broken," ask "what
   would have to be true for this to work?" and check each condition. Different
   question, different search space.

## Escape hatches when the above fails

- **Shrink it.** Delete everything until the bug disappears. What you deleted
  last contains it.
- **Change altitude.** You have been reading lines. Read the architecture — or
  the reverse.
- **Explain it out loud, in full.** Rubber-duck it. The gap you skip over while
  explaining is the bug.
- **Stop.** Genuinely. Sleep, walk, do something else. This is not
  procrastination; it is the highest-yield move after two fruitless hours, and
  it is the one people refuse because it feels like giving up.

## Constraints

- Do not propose fixes until step 4 has actually been run. The point is to break
  the guess-and-check loop, not to add your guesses to it.
- If the user answers vaguely, push back once and ask for specifics.
- Name the windowpane explicitly when you spot it. "Every attempt you have made
  assumes X. Have you checked X?" That sentence is the whole value here.
