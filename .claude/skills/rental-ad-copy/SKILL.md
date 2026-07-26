---
name: rental-ad-copy
description: Use when Sophia Reddehase (One Place Locators) asks to write, draft, or revise ad copy for a rental listing/unit — e.g. "write a rental ad for this unit," "make a Facebook post for [property]," "listing copy for unit ___," or just names a property and wants an ad. Looks up the property's official listing page on the web when only a property name is given, then generates the ad text following her locked voice/format/privacy rules. Does not post anywhere or automate Facebook.
---

# Rental Ad-Copy Spec (Sophia Reddehase, One Place Locators)

This is a locked format. Follow every rule exactly. Do not improvise around
the fixed lines — reproduce them verbatim. If required info (price, unit
number, confirmed special) is missing, stop and ask instead of guessing.

## Non-goal

This skill produces ad copy text only. It does not log into Facebook, does
not automate posting, and does not drive a browser session on its own.
Actually publishing the ad happens through the user's own logged-in browser
session with Claude as a supervised assistant — never as an unattended bot.
If a request asks for scripted/automated Facebook posting, decline that part
specifically and offer to keep helping with the text and with supervised,
in-browser posting instead.

## Voice

Warm but professional, confident, personal, polished. Sounds like a
knowledgeable friend, never like an AI or a brochure. Short, clear sentences.
No fluff, no filler, no slang. Never use em dashes anywhere in the ad.

## Privacy rule

The full street address is an internal reference only — never in the public
ad text. The public body must not include the property name, cross streets,
or identifying landmarks. General area/neighborhood flavor is fine (e.g.
"South Austin," "near the greenbelt").

## Given just a property name

When Sophia gives only a property name (no pasted listing details), look up
the property yourself before writing anything:

1. Web search for the property's **official** leasing website (its own
   domain, or its management company's portal page for that property —
   e.g. Greystar, RPM Living). Prefer the official page over third-party
   aggregators (Zillow, Apartments.com, ApartmentList, etc.).
2. From that official page, identify: the management company (this decides
   whether the TMLP rule below applies), ZIP/area, standout feature,
   bed/bath mix, current amenities, and — if shown — current unit
   availability, pricing, and any specials.
3. Many property sites don't show live unit numbers or exact pricing
   publicly (they gate it behind an inquiry form). If the unit number,
   price, or TMLP isn't actually visible on the official page, that counts
   as unconfirmed — do not carry over a number from an aggregator site or
   an older cached page as if it were current. Stop and tell Sophia what
   you found and what's missing, and ask her to confirm or supply it.
4. Use the property's full name/address only to search and to disambiguate
   — never in the public ad text (see Privacy rule above).
5. If the search turns up nothing usable (no official page, ambiguous
   property name, multiple similarly-named properties), say so and ask
   Sophia to point you to the property or paste the details instead.

## Structure, in order

1. **Slogan** (first public line, required every time). Playful,
   Austin-flavored, matched to the unit's standout feature (yard, view,
   pool, garage, downtown, trails). No emoji. Never reuse a slogan across
   ads in the same batch, and never reuse the wording of the rest of the ad
   body either — every ad in a batch should read as genuinely distinct, not
   a find-and-replace of the same template. Facebook's spam detection
   suppresses near-duplicate posts, so sameness costs reach.

2. **Special line** (only if there is an actual confirmed special). Accent
   emoji + the hyped special, and always note the special is on top of base
   rent. If there is no special, skip this line entirely — never write
   "no special."

3. **Header**: signature emoji + ZIP + area + standout feature callout.

4. **Service intro** (fixed line, verbatim every time):
   "I do the searching so you do not have to, and it is always free to you.
   The property pays me, never you."

5. **Insider line** (optional). One short, genuinely strong local insight.
   Skip entirely if nothing is genuinely strong — don't force one.

6. **Unit details**: standout feature first, then bed/bath, one sentence.
   No square footage.

7. **Pricing**:
   - Default (non-Greystar): "Unit ___, starting at $___. Special: [details]
     (special is on top of base rent)".
   - **Greystar properties**: Total Monthly Leasing Price (TMLP) is
     mandatory and goes on its own line above the base rent line:
     "Total Monthly Leasing Price: $___
     Unit ___, base rent $___. Special: [details] (special is on top of
     base rent)"
     TMLP is always the number that's emphasized first; base rent is
     supporting detail underneath it, never the lead figure.
   - Never guess a price, TMLP, or unit number — if it isn't public or
     confirmed, stop and ask before writing the ad.

8. **Amenities**: accent emoji header, max 3 bullets. Prioritize, in this
   order of preference: pool, gym, dog park, garage, EV charging, rooftop,
   coworking. Pet policy (if included) gets the reserved paw emoji — the
   paw emoji is used nowhere else in the ad.

9. **CTA** (fixed line, verbatim every time):
   "I can help you with this one and anywhere in Austin or the surrounding
   areas. Availability changes daily. DM me before it is gone. I cover
   Austin, Cedar Park, Round Rock, Pflugerville, Georgetown, and more."

10. **Signature** (fixed, verbatim every time):
    "Sophia Reddehase | One Place Locators | License #831516"
    "Prices and availability subject to change."

## Emoji rules

- Maximum 3 emoji in the entire ad, total.
- No emoji in the slogan.
- Only use an emoji when it's actually applicable to this unit (e.g. a pool
  emoji only if there's a pool; a car emoji only if parking is the
  highlight).
- Never repeat the same emoji twice in one ad.
- The paw emoji is reserved exclusively for the pet policy line.

## Symbol dividers

Use one consistent divider style per ad (e.g. ★, ✦, ✧, ✩), and vary the
style across different ads in a batch. Never use em dashes as dividers or
anywhere else in the ad.

## Missing-information rule

If the price, unit number, or a specific special isn't public or hasn't been
confirmed, do not guess or invent it. Stop and ask the user for the missing
detail before producing the ad.

## Marketplace reach tips (mention alongside the ad, not part of it)

These aren't part of the ad text itself — surface them as a quick aside when
handing over a finished ad, since they're what actually drives organic reach
on Marketplace:

- Lead with photos in this order: exterior/curb appeal, kitchen, living
  room, primary bedroom, bathroom, then the standout feature. Aim for 8-12
  photos, natural daylight.
- Best posting windows: weekday evenings (6-8pm) and Sunday afternoon.
- Reply to comments fast — early engagement is what gets a listing shown
  to more people.
- File it under the correct Marketplace category and filters (bedrooms,
  price, pet-friendly) — a mis-filed listing gets suppressed in search
  regardless of copy quality.
- Never mass-post identical copy across many groups/listings on a
  schedule — that's against Marketplace's Commerce Policies and risks
  suppression or a ban, on top of being outside this skill's non-goal above.
