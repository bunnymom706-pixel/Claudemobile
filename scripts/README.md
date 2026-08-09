# Marketplace ad rebuild

Rebuild a batch of listings without inventing numbers and without tripping
Marketplace's spam detection.

## The four steps

**1. Extract.** Open `facebook.com/marketplace/you/selling`, scroll to the very
bottom until nothing new loads, open DevTools Console, paste
`scripts/extract_listings.js`. It reads the bottom 20 and copies out a JSON
scaffold. Read only. It clicks nothing.

**2. Fill in.** Paste the scaffold into `ads/listings.json` and replace every
`FILL IN` line. Unit number, base rent, TMLP for Greystar, and the exact
current special are deliberately not in the scaffold, because the listings page
does not show them and last month's special is worse than no ad at all. Get
those from the property.

**3. Generate.**

    python3 scripts/generate_ads.py ads/listings.json

Writes one draft per ad into `drafts/`, plus `00-delete-checklist.md`. Any ad
missing a confirmed number is refused with a list of what to confirm. Rerun as
you fill gaps.

**4. Swap, by hand.** Work the checklist in your own browser. Post the
replacement, confirm it is live, then delete the one it replaces.

## What the generator checks

Every ad is validated before it is written:

- property name and street address never reach the public text, including
  partial leaks like a street number or one distinctive word
- max 3 emoji, no repeats, none in the slogan, paw only on the pet policy line
- no em dashes, one divider per ad, varied across the batch
- service intro, CTA, and signature reproduced verbatim
- Greystar ads lead with Total Monthly Leasing Price

## Two things this deliberately will not do

**It does not post or delete.** No script here touches your account. Marketplace
suppression keys on automated posting, and the account is the lead pipeline, so
publishing stays manual and supervised, one listing at a time.

**It does not template the writing.** Slogans and insider lines are written per
unit. Twenty ads sharing a sentence pattern is itself a spam signal, and the
generator fails a batch with duplicate slogans for that reason.

## Pacing

Do not run 20 deletes and 20 posts in one sitting. Spread them over several
days. Post the replacement before deleting the original so the unit is never
unsearchable. If a listing only needs a fresher timestamp, renew it instead of
rebuilding it.

## If the extractor pulls nothing

Facebook's markup is obfuscated and changes often. Empty output means the
selectors need re-pointing, not that you did it wrong.
