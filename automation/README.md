# automation

Scripts for the parts of the pipeline that can run without anyone at the desk.

See `../how-automation-works.md` for the plain-language version and
`../automation.md` for the reference tables.

## Scripts

| Script | What it does |
| --- | --- |
| `preflight.mjs` | Checks network, credentials, and browser. Run it first. |
| `spark-login.mjs` | Logs into Spark APT with the cloud's own Chromium and captures the real page structure. |

Run:

```
node automation/preflight.mjs
node automation/spark-login.mjs
```

`preflight.mjs` exits 1 with a named cause when something is missing. Scheduled
tasks should run it before anything else, so a bad run says what was wrong
instead of firing on time and quietly doing nothing.

## Current status

`preflight.mjs` fails on three of four checks. All three fixes are environment
settings at claude.ai/code, not code in this repo:

- Network policy does not allow `app.sparkapt.com`
- `SPARK_EMAIL` is not set
- `SPARK_PASSWORD` is not set

Chromium is already installed and passes.

## Why `spark-login.mjs` only explores

Nobody has loaded Spark APT from a cloud session yet, so the page structure is
unknown. Selectors written for a page nobody has seen produce a script that
looks finished and silently does nothing, which is the failure this whole
effort started with.

So the first run logs in and captures screenshots plus the real structure of
each page. Lead detection, searches, and guest cards get written against those
captures. One discovery run, then the real automation.

## Facebook Marketplace has no script

There is nothing to write here, and that is not a tooling gap.

- Outbound requests to `facebook.com` are refused by the egress gateway with a
  403 policy denial. Routing around an egress policy is not on the table.
- Even with the host allowed, a login from a datacenter IP on a fresh browser
  profile is an unrecognized device. Facebook answers with a checkpoint, and an
  unattended task cannot complete a checkpoint. Making that login look like a
  known device is exactly the evasion that gets accounts disabled, and the
  account is the lead pipeline.
- The Chrome extension path is driven by the model inside a session. It is a
  prompt, not a script, so no code makes it run unattended.

Marketplace stays manual, on a Routine created from inside the browser-attached
session and fired by hand. See `../CLAUDE.md`.

## Credentials

Credentials belong in environment variables, never in a Routine's prompt.
Prompt text is stored server side and shows up in any listing of scheduled
tasks.
