# Automation

Why scheduled tasks fail, and what can actually run without someone at the desk.

Fill in specifics later. This is the shape they have to fit.

## The session model

Every scheduled task (a Routine) delivers its prompt into a session. Which session is decided once, when the Routine is created.

| Mode | Where the fire lands |
| --- | --- |
| Self-bind (default) | The session that created the Routine |
| Named session | One specific session, set by ID at creation |
| New session each fire | A fresh, empty session |

All three run in the cloud. There is no mode that runs on the laptop.

The difference that matters is not cloud versus local. It is **whether the session already has a browser attached.** A new session never does. The Chrome extension bridges to one conversation, not to an account and not to a machine.

## The rule that explains every failure

**Instructions cannot create capability.**

A prompt that says "connect to Chrome and open the site" only works in a session a browser is already attached to. In a fresh session that same sentence does nothing, no matter how well it is written. Rewriting it in more detail, or moving it into a skill or an agent, changes nothing.

Where a task runs is configuration. What it does once running is instructions. A failure in the first layer never gets fixed by work in the second.

Symptom to recognize: the task fires on schedule, reports nothing useful, and the laptop was open the whole time. That is a binding problem, not a prompt problem.

## Two kinds of browser work

Not every site that needs a browser needs *the* laptop. This is the distinction that decides whether a task can run unattended.

| Kind | Browser used | Laptop needed? |
| --- | --- | --- |
| Site with a normal username and password | The cloud's own Chromium, driven directly | No |
| Site with anti-bot or device-trust login | The real logged-in browser, via the Chrome extension | Yes |

A cloud session has Chromium pre-installed and can log into an ordinary site by itself, around the clock, with no laptop involved. Two things have to be set for that to work:

1. The environment's network policy has to allow the site's domain.
2. Credentials have to exist as environment variables, not typed into a prompt.

Both are environment settings, not code and not instructions.

The second kind is different. A datacenter IP with a fresh browser profile trips security review on consumer social platforms, and getting flagged risks the account. Those stay on the extension bridge, and the extension bridge needs the laptop.

Sort each stage into the right kind first. Assuming everything needs the laptop is what makes the whole pipeline look impossible when most of it is not.

## Where a skill lives decides who loads it

| Location | Loaded by |
| --- | --- |
| `.claude/skills/` in this repo | Cloud sessions |
| `~/.claude/skills/` on the desktop | Local sessions only |

A cloud session cannot read desktop files. A desktop skill is invisible to every scheduled cloud task.

## What can run unattended

| Stage | Unattended? | Why |
| --- | --- | --- |
| Marketplace inbox and replies | No | Extension bridge, laptop required |
| Locator platform lead detection | Yes, once configured | Cloud Chromium can log in |
| Intake form sent and collected | Yes | Email or SMS plus a form |
| Property list to client | Yes | Email |
| Guest cards on the locator platform | Yes, once configured | Cloud Chromium can log in |
| Tour scheduling | Yes | Email and calendar |
| Application and lease signature | Never | The client acts, with their own ID and payment |
| Invoice to property | Yes | Template email |
| Move-in and lead verification | Yes | Inbound email, parsed |
| Unpaid commission follow-up | Yes | Scheduled email |

The laptop dependency lives almost entirely at first contact. Once a lead gives an email address or phone number, everything after it can run with the laptop shut.

That is the design target: not zero touch, but **nothing required after the first reply.**

Before building anything for a stage, check which column it is in. Most of this list does not need the laptop, and the two locator-platform rows only need environment settings that have not been filled in yet.

## Creating a browser-bound Routine

For the stages that genuinely need the browser:

1. Open the session the Chrome extension is attached to.
2. Create the Routine from inside that session. It self-binds automatically, no ID to look up.
3. Prefer manual fire, or two or three fixed times when someone is reliably at the desk. Not hourly.

A Routine's session binding cannot be edited after creation. Repointing means delete and recreate.

## Known limits

- Runs only while the laptop is awake, Chrome is open, that session is open, and the extension is connected.
- It drives the real browser. It takes over a tab while it works, in view, not quietly in the background.
- Screen automation breaks on layout changes, popups, and two-factor prompts in ways an API would not.
- Templated replies on a fixed cadence is the pattern platform automation detection looks for. The account is the lead pipeline; losing it costs more than the automation saves.
- Marketplace posting stays manual on purpose. See `CLAUDE.md`.

## Compliance

Real estate work here is Texas licensed. The license holder is responsible for every communication sent under it, including ones a scheduled task sends. Client-facing copy stays TREC compliant, and the application and signing stages stay human regardless of what is technically possible.

## What automation does not do

It does not create leads. Automating the admin makes a high lease volume survivable. It does not produce the volume. Revenue still comes from conversations.
