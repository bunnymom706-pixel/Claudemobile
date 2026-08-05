# How the automation actually works

Plain-language version. The reference tables live in `automation.md`.

## Does it use my Chrome?

No. It uses its own Chrome, in the cloud. Not mine.

Think of it like a car:

- **Spark APT** — the cloud rents its own car. Mine can stay in the garage. It just needs the keys, which is what the saved email and password are.
- **Facebook** — no rentals allowed. It has to be my car, in my driveway, engine running. That is what the Chrome extension does: it remote-drives my actual browser.

| | Whose Chrome | My laptop |
| --- | --- | --- |
| Spark APT | The cloud's own | Can be shut |
| Facebook | Mine, via the extension | Must be open |

Why Facebook will not take a rental: it sees a strange browser from a strange location logging into my account, and locks it. Spark APT does not care. It just checks the username and password.

## Why the scheduled tasks were failing

A scheduled task always runs in the cloud. When it starts, it opens a brand new session.

The Chrome extension is connected to one specific conversation, not to my account and not to my computer. A brand new session has no browser attached to it. So the task woke up, found no browser, and quit.

My laptop being open never mattered. Nothing was pointed at the new session.

**The rule:** instructions cannot create capability. A prompt that says "connect to Chrome" only works in a session that already has a browser. Writing it more carefully, or moving it into a skill or an agent, changes nothing. Where a task runs is a setting. What it does once running is instructions. A problem in the first is never fixed by work in the second.

## What to set once

In claude.ai/code, environment settings:

1. **Network policy** — allow `app.sparkapt.com`
2. **Environment variables** — `SPARK_EMAIL` and `SPARK_PASSWORD`

No code. No laptop. No extension.

Current status: Chromium is already installed in the container. The domain is blocked (proxy returns 403). The two variables are not set.

## What happens on each run

1. Scheduled task fires into a fresh cloud session
2. Container boots, loads the repo and my skills
3. Launches its own Chromium, logs into Spark APT with the saved credentials
4. Pulls the leads that have not been handled yet
5. For each: runs the search at my commission thresholds, sends guest cards, sends the property list
6. Gmail drafts the client email, Zoho updates the record
7. Sends a summary to my phone
8. Container is destroyed

3am, laptop shut. It runs.

## The one decision to make first

A fresh session has no memory. It cannot know what the last run did unless there is somewhere for it to look. Without that, it re-sends guest cards to the same leads on every single run.

That record cannot live in the public repo, because those are client names.

**Zoho is the right home.** Tag each lead as handled, and every run queries for the untagged ones. Same approach later for invoicing and follow-up.

Decide this before building anything else. Getting it wrong fails loudly, in front of clients.

## What stays manual no matter what

- **Applications and lease signing** — the client does these with their own ID and card
- **Facebook Marketplace replies** — browser-locked, and automating them risks the account, which is the lead pipeline
- **Anything going out under my license** — TREC makes me responsible for every message a scheduled task sends

Keep client emails as drafts, not auto-send, until I have watched it run for a week.

## The realistic target

Not zero touch. The honest version is **nothing required after the first reply.**

The laptop dependency lives almost entirely at first contact. Once a lead gives an email or a phone number, everything after that can run with the laptop closed.

Automation does not create leads. It makes a high lease volume survivable. It does not produce the volume. Revenue still comes from conversations.
