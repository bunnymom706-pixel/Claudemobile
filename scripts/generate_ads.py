#!/usr/bin/env python3
"""Generate One Place Locators Marketplace ad drafts from confirmed listing data.

Usage:
    python3 scripts/generate_ads.py ads/listings.json
    python3 scripts/generate_ads.py ads/listings.json --out drafts --strict

Reads a JSON file of listings, renders each one into the locked ad format, and
writes it to drafts/ as a .txt file you can open, read, and paste yourself.
Also writes a delete checklist that orders the swap safely.

What this script will not do:
  - It refuses to render an ad whose unit number, rent, TMLP, or special is
    unconfirmed. Missing data is an error, never a placeholder.
  - It fails the ad if the property name or street address leaks into the
    public text.
  - It does not log into Facebook, post, or delete anything. Those steps are
    manual and supervised, in your own browser, one at a time.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Locked copy. These lines are reproduced verbatim in every ad. Do not reword.
# ---------------------------------------------------------------------------

SERVICE_INTRO = (
    "I do the searching so you do not have to, and it is always free to you. "
    "The property pays me, never you."
)

CTA = (
    "I can help you with this one and anywhere in Austin or the surrounding areas. "
    "Availability changes daily. DM me before it is gone. I cover Austin, Cedar Park, "
    "Round Rock, Pflugerville, Georgetown, and more."
)

SIGNATURE = (
    "Sophia Reddehase | One Place Locators | License #831516\n"
    "Prices and availability subject to change."
)

# ---------------------------------------------------------------------------
# Format rules
# ---------------------------------------------------------------------------

DIVIDERS = ["★", "✦", "✧", "✩", "✪", "❖", "◆"]

PAW = "🐾"
MAX_EMOJI = 3
MAX_AMENITY_BULLETS = 3

# Priority order when more amenities are supplied than there is room for.
AMENITY_PRIORITY = ["pool", "gym", "dog park", "garage", "ev charging", "rooftop", "coworking"]

# Words too generic to count as an identifying leak on their own.
GENERIC_NAME_WORDS = {
    "the", "at", "on", "of", "and", "apartments", "apartment", "residences",
    "residence", "lofts", "loft", "flats", "towers", "tower", "place", "park",
    "living", "homes", "living", "austin", "north", "south", "east", "west",
    "downtown", "village", "commons", "station", "house", "club", "creek",
}

STREET_SUFFIXES = {
    "st", "street", "ave", "avenue", "rd", "road", "blvd", "boulevard", "dr",
    "drive", "ln", "lane", "way", "pkwy", "parkway", "ct", "court", "cir",
    "circle", "trl", "trail", "hwy", "highway", "ste", "suite", "apt", "unit",
}

# Symbols that look emoji-adjacent but are plain typographic marks. They are
# dividers and separators, not part of the 3-emoji budget.
NON_EMOJI_SYMBOLS = set(DIVIDERS) | {"·", "•", "–", "†", "‡", "※"}

EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF"      # pictographs, transport, supplemental
    "\U00002600-\U000027BF"       # misc symbols and dingbats
    "\U00002B00-\U00002BFF"       # arrows and stars
    "\U0001F1E6-\U0001F1FF]"      # regional indicators
    "️?"
)


class AdError(Exception):
    """A listing that cannot be rendered safely."""


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

REQUIRED_FIELDS = [
    "id", "internal", "management", "zip", "area", "slogan", "standout",
    "beds", "baths", "unit", "base_rent", "special", "amenities",
    "header_emoji", "divider",
]


def require_fields(listing):
    """Every required key must be present. Absent means unconfirmed, which is an error."""
    missing = [f for f in REQUIRED_FIELDS if f not in listing]
    if missing:
        raise AdError(f"unconfirmed or missing fields: {', '.join(missing)}")

    for field in ("unit", "base_rent"):
        if listing[field] in (None, "", "?", "TBD", "tbd"):
            raise AdError(f"{field} is not confirmed. Ask Sophia before writing this ad.")

    if is_greystar(listing):
        if listing.get("tmlp") in (None, "", "?", "TBD", "tbd"):
            raise AdError(
                "Greystar property with no confirmed Total Monthly Leasing Price. "
                "TMLP is mandatory and leads the pricing block."
            )

    special = listing["special"]
    if special is not None and not str(special).strip():
        raise AdError("special is blank. Use null for no special, or the exact wording.")
    if isinstance(special, str) and special.strip() in {"?", "TBD", "tbd", "unknown"}:
        raise AdError("special is not confirmed. Ask Sophia for the exact wording.")

    internal = listing["internal"]
    for key in ("property_name", "address"):
        if not internal.get(key):
            raise AdError(f"internal.{key} is required so the leak check can run against it.")

    if listing["divider"] not in DIVIDERS:
        raise AdError(f"divider must be one of {' '.join(DIVIDERS)}")


def is_greystar(listing):
    return str(listing.get("management", "")).strip().lower() == "greystar"


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def money(value):
    return f"${int(value):,}"


def order_amenities(amenities, has_pet_line):
    """Sort by the documented priority, then cap so total bullets stay at 3."""
    def rank(item):
        kind = str(item.get("kind", "")).strip().lower()
        return AMENITY_PRIORITY.index(kind) if kind in AMENITY_PRIORITY else len(AMENITY_PRIORITY)

    ordered = sorted(amenities, key=rank)
    room = MAX_AMENITY_BULLETS - (1 if has_pet_line else 0)
    return ordered[:max(room, 0)]


def render_unit_line(listing):
    """Standout feature first, then bed/bath. One clean sentence. No square footage."""
    beds, baths = listing["beds"], listing["baths"]
    bed_bath = f"{beds} bed, {baths} bath"
    custom = listing.get("unit_sentence")
    if custom:
        return custom
    return f"{listing['standout'].capitalize()} right outside your door. Spacious {bed_bath} layout."


def render_pricing(listing):
    unit, base = listing["unit"], listing["base_rent"]
    special = listing["special"]
    tail = (
        f" Special: {special} (special is on top of base rent)."
        if special else ""
    )
    if is_greystar(listing):
        return (
            f"Total Monthly Leasing Price: {money(listing['tmlp'])}\n"
            f"Unit {unit}, base rent {money(base)}.{tail}"
        )
    return f"Unit {unit}, starting at {money(base)}.{tail}"


def render(listing):
    require_fields(listing)

    div = listing["divider"]
    blocks = []

    # 1. Slogan, no emoji.
    blocks.append(listing["slogan"].strip())

    # 2. Special line, only when there is a real one.
    if listing["special"]:
        accent = listing.get("special_emoji")
        if not accent:
            raise AdError("a confirmed special needs a special_emoji for its accent.")
        headline = listing["special"][0].upper() + listing["special"][1:]
        blocks.append(f"{accent} {headline} (on top of base rent)!")

    # 3. Header.
    callout = listing.get("header_callout") or listing["standout"]
    blocks.append(f"{listing['header_emoji']} {listing['zip']} · {listing['area']} · {callout}")

    # 4. Service intro, verbatim.
    blocks.append(SERVICE_INTRO)

    # 5. Insider line, optional. Skipped rather than padded.
    if listing.get("insider"):
        blocks.append(listing["insider"].strip())

    # 6. Unit details.
    blocks.append(render_unit_line(listing))

    # 7. Pricing.
    blocks.append(render_pricing(listing))

    # 8. Amenities, max 3 bullets, pet policy owns the paw.
    pet = listing.get("pet_policy")
    bullets = [f"{div} {a['text']}" for a in order_amenities(listing["amenities"], bool(pet))]
    if pet:
        bullets.append(f"{div} {PAW} {pet}")
    if bullets:
        blocks.append("\n".join([f"{div} Amenities"] + bullets))

    # 9 and 10. CTA and signature, verbatim.
    blocks.append(CTA)
    blocks.append(SIGNATURE)

    return "\n\n".join(blocks)


# ---------------------------------------------------------------------------
# Output validation. Every ad passes these before it is written.
# ---------------------------------------------------------------------------

def identifying_tokens(internal):
    """Distinctive words from the property name and street address."""
    tokens = set()

    name = internal["property_name"].strip()
    tokens.add(name.lower())
    for word in re.findall(r"[A-Za-z']+", name):
        if word.lower() not in GENERIC_NAME_WORDS and len(word) > 3:
            tokens.add(word.lower())

    address = internal["address"].strip()
    tokens.add(address.lower())
    for word in re.findall(r"[A-Za-z']+", address):
        low = word.lower()
        if low not in GENERIC_NAME_WORDS and low not in STREET_SUFFIXES and len(word) > 3:
            tokens.add(low)
    for number in re.findall(r"\b\d{2,}\b", address):
        tokens.add(number)

    for extra in internal.get("also_never_print", []):
        tokens.add(str(extra).strip().lower())

    return {t for t in tokens if t}


def check_privacy(text, listing):
    """The absolute rule: no property name, no address, in any form."""
    haystack = text.lower()
    zip_code = str(listing["zip"])
    hits = []
    for token in identifying_tokens(listing["internal"]):
        if token == zip_code:
            continue  # the ZIP is the approved level of specificity
        if re.search(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])", haystack):
            hits.append(token)
    if hits:
        raise AdError(
            "property name or address leaked into the public ad text: "
            + ", ".join(sorted(hits))
        )


def count_emoji(text):
    stripped = "".join(c for c in text if c not in NON_EMOJI_SYMBOLS)
    return EMOJI_RE.findall(stripped)


def check_format(text, listing):
    emoji = count_emoji(text)
    if len(emoji) > MAX_EMOJI:
        raise AdError(f"{len(emoji)} emoji, limit is {MAX_EMOJI}: {' '.join(emoji)}")
    if len(set(emoji)) != len(emoji):
        raise AdError(f"repeated emoji: {' '.join(emoji)}")

    slogan = text.splitlines()[0]
    if count_emoji(slogan):
        raise AdError("the slogan must not contain an emoji.")

    # The paw is reserved for the pet policy line. Not "once", not "mostly": only there.
    paw_lines = [ln for ln in text.splitlines() if PAW in ln]
    pet = listing.get("pet_policy")
    expected = f"{listing['divider']} {PAW} {pet}" if pet else None
    if len(paw_lines) > 1 or (paw_lines and paw_lines[0] != expected):
        raise AdError("the paw emoji is reserved for the pet policy line only.")

    if "—" in text:
        raise AdError("em dash found. Sophia's voice rules them out entirely.")

    for name, locked in (("service intro", SERVICE_INTRO), ("CTA", CTA), ("signature", SIGNATURE)):
        if locked not in text:
            raise AdError(f"locked {name} is missing or was reworded.")

    other = [d for d in DIVIDERS if d != listing["divider"] and d in text]
    if other:
        raise AdError(f"mixed dividers: expected only {listing['divider']}, also found {' '.join(other)}")


def check_batch(listings):
    """Across a batch, slogans must be genuinely different and dividers varied."""
    problems = []

    slogans = {}
    for listing in listings:
        key = re.sub(r"[^a-z ]", "", listing.get("slogan", "").lower()).strip()
        slogans.setdefault(key, []).append(listing.get("id"))
    for key, ids in slogans.items():
        if key and len(ids) > 1:
            problems.append(f"duplicate slogan across ads {', '.join(map(str, ids))}")

    used = [l.get("divider") for l in listings]
    if len(listings) > 1 and len(set(used)) == 1:
        problems.append(
            f"every ad uses the same divider ({used[0]}). Vary it across the batch."
        )

    return problems


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def delete_checklist(rendered):
    """The swap order that keeps the account safe. Replacement first, delete second."""
    lines = [
        "# Listing swap checklist",
        "",
        "Work this by hand in your own logged-in browser, one row at a time.",
        "Nothing here is automated, and nothing gets published without you.",
        "",
        "Rules that matter more than speed:",
        "",
        "1. Post the replacement and confirm it is live BEFORE deleting the old listing.",
        "   Deleting first means a gap where the unit is not searchable at all.",
        "2. Spread these across several days. A burst of 20 deletes and 20 new posts in",
        "   one sitting is the exact pattern Marketplace suppression watches for, and the",
        "   account is the lead pipeline.",
        "3. Save each new one as a draft first, review it, then publish it yourself.",
        "",
        "| # | Draft file | Property (internal) | Unit | Replacement posted | Old listing deleted |",
        "| - | ---------- | ------------------- | ---- | ------------------ | ------------------- |",
    ]
    for i, (listing, path) in enumerate(rendered, start=1):
        lines.append(
            f"| {i} | `{path.name}` | {listing['internal']['property_name']} "
            f"| {listing['unit']} | [ ] | [ ] |"
        )
    lines += [
        "",
        "The internal column is for your eyes only. It never appears in the ad text,",
        "and this file stays out of the public repo.",
        "",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("listings", type=Path, help="JSON file of confirmed listings")
    parser.add_argument("--out", type=Path, default=Path("drafts"), help="output directory")
    parser.add_argument("--strict", action="store_true", help="exit nonzero if any ad fails")
    args = parser.parse_args()

    data = json.loads(args.listings.read_text(encoding="utf-8"))
    listings = data["listings"] if isinstance(data, dict) else data

    args.out.mkdir(parents=True, exist_ok=True)

    rendered, failures = [], []
    for listing in listings:
        ad_id = listing.get("id", "?")
        try:
            text = render(listing)
            check_privacy(text, listing)
            check_format(text, listing)
        except AdError as exc:
            failures.append((ad_id, str(exc)))
            continue
        except KeyError as exc:
            failures.append((ad_id, f"missing field {exc}"))
            continue

        path = args.out / f"{ad_id}-{listing['zip']}-unit-{listing['unit']}.txt"
        path.write_text(text + "\n", encoding="utf-8")
        rendered.append((listing, path))

    for problem in check_batch([l for l, _ in rendered]):
        failures.append(("batch", problem))

    if rendered:
        (args.out / "00-delete-checklist.md").write_text(
            delete_checklist(rendered), encoding="utf-8"
        )

    print(f"wrote {len(rendered)} draft(s) to {args.out}/")
    for listing, path in rendered:
        print(f"  ok    {path.name}")
    for ad_id, reason in failures:
        print(f"  FAIL  {ad_id}: {reason}", file=sys.stderr)

    if failures:
        print(
            f"\n{len(failures)} ad(s) not written. Nothing was guessed. "
            "Confirm the details above and rerun.",
            file=sys.stderr,
        )
        if args.strict:
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
