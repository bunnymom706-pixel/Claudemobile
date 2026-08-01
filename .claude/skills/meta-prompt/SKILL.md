---
name: meta-prompt
description: Write a good prompt for a task instead of writing it yourself. Use before any substantial AI task, or when output has been mediocre and it is unclear why.
---

# Meta Prompt

The premise: mediocre AI output is usually an instruction problem, not a model
problem. Rather than iterating on a weak prompt, have the prompt written
properly once.

## Process

1. **Collect the inputs.** Ask for:
   - The goal — what the AI should actually accomplish
   - Context — who they are, their situation, constraints
   - What a great result looks like, specifically
   - What has already been tried and failed, if anything

2. **Ask up to five clarifying questions.** Only about things that would
   materially change the prompt. Skip this if the request is already
   unambiguous — questions for their own sake waste the user's time.

3. **Write the prompt.** It should:
   - Assign a specific role with real expertise, not a generic "expert"
   - Specify the *process* to follow, not only the desired output
   - Define the output format precisely
   - State constraints on what *not* to do — often the highest-leverage part
   - Include a self-check step before the model responds

4. **Deliver it in a code block** so it can be copied directly.

5. **Explain the key structural choices** in about three bullets. This is what
   makes the next prompt better, so it matters more than it looks.

## What separates a good prompt from a bad one

- **Specific role** beats generic authority. "A code reviewer who optimizes for
  the next reader" beats "an expert programmer."
- **Process instructions** beat output requests. Telling the model *how* to
  think produces better results than describing what you want back.
- **Negative constraints** are underused. "Do not summarize, do not hedge, do
  not suggest alternatives I did not ask about" removes most bad output.
- **One question at a time**, for anything interactive. A list of questions gets
  the easy ones answered and the rest skipped.
- **Examples** beat description when the format is unusual.

## Constraints

- Do not answer the original request. Write the prompt for it. This is the most
  common failure of this skill — the model gets interested in the task and
  starts doing it.
- Do not pad with role-play flourishes. "You are a world-class genius" adds
  nothing; specificity does.
- If the task genuinely does not need a custom prompt, say so and answer it
  directly. Not everything needs scaffolding.
