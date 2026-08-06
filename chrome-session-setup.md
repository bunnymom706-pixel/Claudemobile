# Chrome session setup

The Claude in Chrome extension is driven by prompts inside the one session it
is attached to — there is no script file for this path. So the "code" is the
block below.

**How to use it:** open the session your Chrome extension is connected to
(or start a new one and attach the extension), then paste the entire block
between the markers as one message. That session will create the scheduled
Routines bound to itself — which is the only binding where browser automation
can work. Do not paste it into any other session; a Routine created elsewhere
fires into a session with no browser and does nothing.

If the extension later gets attached to a different session, the Routines keep
firing into the old one and silently stop working. The fix is to paste this
block again in the newly attached session and delete the old Routines.

---BEGIN SETUP PROMPT---

You are in the session my Claude in Chrome extension is attached to. Set up my
browser automations so they fire into THIS session. My timezone is
America/Chicago (currently UTC-5); convert all times below to UTC when writing
cron expressions.

First verify the browser is actually connected: load the Claude in Chrome
browser tools via ToolSearch and call the tab-context tool. If the browser
tools are not available in this session, STOP — tell me the extension is not
attached here and that I should paste this block in the session where it is.
Create nothing in that case.

If the browser is connected, create TWO recurring Routines using
create_trigger. For each: do NOT set create_new_session_on_fire and do NOT set
persistent_session_id, so they self-bind to this session. Then list both back
to me with their schedules so I can confirm.

=== ROUTINE 1: "Marketplace sweep (browser session)" ===
Schedule: 9:07 AM, 1:07 PM, and 5:37 PM Central, every day.
Prompt for the Routine:

You are running Sophia Reddehase's Facebook Marketplace sweep inside her
browser-attached session. She is a Texas-licensed real estate agent
(apartment locator, Austin).

0. GUARD: Load the Claude in Chrome browser tools and call the tab-context
   tool first. If the browser tools are unavailable, or her desktop/Chrome is
   not currently connected, end IMMEDIATELY with the single line "Browser not
   connected — skipped." Do not retry, do not troubleshoot, do not message her
   beyond that line.
1. Open https://www.facebook.com/marketplace/inbox in a new tab. If not
   logged in, stop and report it in one line.
2. Find conversations with unread or unanswered incoming messages. For each,
   read the full conversation and the listing it concerns.
3. REPLY RULES (strict):
   - Reply only to genuine inquiries about a listing. Skip spam, scams, and
     anything ambiguous or sensitive; list skipped items in the summary.
   - Answer only from information visible in the listing or conversation. If
     unknown, say Sophia will follow up shortly with details.
   - Warm, brief, professional. 1-3 sentences.
   - Priority goal: move the conversation to email or phone. When someone is
     genuinely interested, ask for the best email to send options to.
   - TREC compliance: no guarantees or promises, no misleading claims,
     nothing that violates fair housing (never discuss or filter by protected
     classes), no legal or lending advice, no negotiating price or lease
     terms. Anything contractual: Sophia will follow up personally.
   - Never include license numbers or credentials in replies. Never claim to
     be the property owner. Never mention safety or meetup precautions.
   - Do not schedule or confirm showings; Sophia confirms timing personally.
   - Never click Delete, Block, Report, or any destructive control.
4. Close the tab you opened.
5. Summary: number of new messages, each conversation (listing + sender first
   name) with the exact reply sent, any email/phone captured, skipped items
   with reasons. Zero new messages = one line saying so.

=== ROUTINE 2: "Spark APT sweep (browser session)" ===
Schedule: 9:22 AM, 1:22 PM, and 5:52 PM Central, every day.
Prompt for the Routine:

You are running Sophia Reddehase's Spark APT client sweep inside her
browser-attached session. Timezone America/Chicago. Unattended run: make
reasonable choices and report them, ask nothing.

0. GUARD: Load the Claude in Chrome browser tools and call the tab-context
   tool first. If the browser tools are unavailable or her desktop/Chrome is
   not connected, end IMMEDIATELY with the single line "Browser not
   connected — skipped." No retries, no troubleshooting.
1. Open Spark APT (sparkapt.com, already logged in via her Chrome). Check for
   NEW clients/leads since the last sweep. None = end with one line.
2. For each new client:
   a. ZOHO: via the Zoho CRM connector, find or create the client record.
   b. SEARCH: run a property search matching their criteria, minimum
      commission 100%. Fewer than 3 results: rerun at 50% minimum and
      combine. Still 2 or fewer: proceed but flag "LOW INVENTORY".
   c. Select the best properties, up to 5.
   d. SPARK SENDS: send guest cards to selected properties and share the
      property list with the client through Spark APT's built-in sharing.
   e. ZOHO UPDATE: add the selected properties to the client's record as a
      note.
   f. GMAIL DRAFT (never send): draft an email to the client with the list
      link and properties, for Sophia to review and send.
3. Summary: new clients, matches per client, guest cards sent, Zoho updates,
   drafts created, LOW INVENTORY flags, any failures.
RULES: never auto-send email to clients — drafts only; Spark APT in-platform
sends are allowed. If Zoho or Gmail connectors are unavailable, report the
specific blocker instead of retrying. Do not modify Zoho beyond the additions
described.

=== END OF ROUTINES ===

Finally: remind me that these only run while this laptop is awake, Chrome is
open, and the extension stays attached to this session, and that runs while
I'm away are skipped quietly by design.

---END SETUP PROMPT---

## Why three fixed times and not hourly

The old hourly trigger failed ~24 times a day into the void. Three sweeps at
desk-hours catch nearly everything an hourly one would (a Marketplace reply
that waits two hours loses nothing), each run takes over the browser while it
works, and a fixed hourly reply pattern is what platform automation detection
looks for. The account is the lead pipeline; see CLAUDE.md.

## What this does not solve

Runs are skipped whenever the laptop is closed. That is inherent to the
extension path, not a bug. The laptop-free halves are separate: the Gmail
pipeline sweep (no browser at all), and cloud Chromium for Spark APT once
`app.sparkapt.com` and SPARK_EMAIL/SPARK_PASSWORD are set in environment
settings — see `automation/README.md`.
