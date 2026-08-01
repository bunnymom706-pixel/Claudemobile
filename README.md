# Claudemobile

Sophia's habit + focus app, and the skill that builds it.

## The app

`app/index.html` — one file, no server, works offline. Open it on your phone and
add it to your home screen.

**iPhone:** open the file in Safari → Share → *Add to Home Screen*
**Android:** open it in Chrome → ⋮ → *Add to Home screen*

One tap a day fills in a square. Don't break the chain.

Tap **Backup** at the bottom to copy your data out, or paste it back in to
restore it. Do this before switching phones — that text is your streak.

## The skill

`.claude/skills/atomic-habits-app/` — loads automatically in any Claude Code
session on this repo. It runs each build session: one small change, verified in
a real browser, shipped to the phone, logged.

- `app/CHANGELOG.md` — what shipped and what's next. Read first.
- `app/BACKLOG.md` — good ideas that aren't today's idea.

Verify the app before shipping any change:

```bash
python3 .claude/skills/atomic-habits-app/scripts/check_app.py
```
