# Claude Rules

## Todoist

### Overdue task sweep

When asked to clean up overdue Todoist tasks:

1. Find everything overdue (`find-tasks-by-date` with `startDate: today`,
   `overdueOption: overdue-only`).
2. Reschedule each one to today with `reschedule-tasks` — not `update-tasks`,
   which wipes recurrence patterns.
3. Re-label by context (see below).

### Context labels

Available contexts: `phone`, `anywhere`, `errands`, `car`, `home`, `body`,
`iPad`, `thomas-apt`, `travel`. `next` and `waiting` are status labels, not
contexts — leave them alone when relabeling.

**Rule:** anything that gets done by sending an email, making a call, chasing
an invoice, or following up on a payment gets the `phone` context. These are
all things Sophia does from her phone, so `anywhere` is the wrong label for
them — swap it for `phone`.

Replace only the context label; keep `next` / `waiting` as they were.
