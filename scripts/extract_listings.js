/*
 * Read the bottom N of your own Marketplace listings into a JSON scaffold.
 *
 * HOW TO RUN
 *   1. Open  facebook.com/marketplace/you/selling  in your normal browser.
 *   2. Scroll to the very bottom until nothing new loads. Marketplace lazy
 *      loads, so anything you have not scrolled past does not exist yet as far
 *      as this script is concerned.
 *   3. Open DevTools (F12 or Cmd+Option+I), click Console, paste this whole
 *      file, press Enter.
 *   4. It prints a JSON scaffold and copies it to your clipboard. Paste that
 *      into ads/listings.json.
 *
 * WHAT IT DOES NOT DO
 *   This only reads what is already rendered on screen. It does not click, post,
 *   publish, delete, or change a single thing on your account, and it does not
 *   send your data anywhere. Deleting stays manual and supervised, one listing
 *   at a time, which is what keeps the account safe.
 *
 * A NOTE ON THE OUTPUT
 *   Facebook does not expose unit numbers, base rent, TMLP, or current specials
 *   on the listings page, so the scaffold deliberately leaves those fields out
 *   rather than guessing. generate_ads.py will refuse each ad and tell you
 *   exactly which fields to confirm. That refusal is the feature.
 *
 *   Facebook's markup is obfuscated and changes often. If this pulls nothing,
 *   it is the selectors, not you. Say so and it can be re-pointed.
 */

(() => {
  const COUNT = 20;        // how many to take
  const FROM_BOTTOM = true; // bottom of the list, per Sophia

  const DIVIDERS = ["★", "✦", "✧", "✩", "✪", "❖", "◆"];

  // Every listing card is anchored by a link to its own item page. That is the
  // most stable handle on the page, so start there and walk outward.
  const seen = new Map();
  for (const link of document.querySelectorAll('a[href*="/marketplace/item/"]')) {
    const id = (link.getAttribute("href").match(/\/marketplace\/item\/(\d+)/) || [])[1];
    if (!id || seen.has(id)) continue;

    // Climb until the ancestor holds meaningfully more text than the link
    // itself. That block is the card.
    let card = link;
    for (let i = 0; i < 6 && card.parentElement; i++) {
      card = card.parentElement;
      if (card.innerText && card.innerText.length > link.innerText.length + 20) break;
    }

    const lines = (card.innerText || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    seen.set(id, {
      id,
      url: `https://www.facebook.com/marketplace/item/${id}`,
      lines,
      price: (lines.find((l) => /^\$[\d,]+/.test(l)) || "").trim(),
      title: lines.find((l) => !/^\$/.test(l) && l.length > 8) || "",
    });
  }

  const all = [...seen.values()];
  if (!all.length) {
    console.warn(
      "No listing cards found. Are you on facebook.com/marketplace/you/selling, " +
        "and did you scroll to the bottom? If yes, the selectors need updating."
    );
    return;
  }

  const picked = FROM_BOTTOM ? all.slice(-COUNT) : all.slice(0, COUNT);

  const listings = picked.map((item, i) => {
    // Titles often carry bed/bath. Pull it only when it is unambiguous.
    const beds = (item.title.match(/(\d+)\s*(?:bed|br|bd)\b/i) || [])[1];
    const baths = (item.title.match(/(\d+(?:\.5)?)\s*(?:bath|ba)\b/i) || [])[1];
    const zip = (item.lines.join(" ").match(/\b(78\d{3})\b/) || [])[1];

    const out = {
      id: String(i + 1).padStart(2, "0"),
      _source: { marketplace_id: item.id, url: item.url, scraped_title: item.title, scraped_price: item.price },
      internal: {
        property_name: "FILL IN: property name, internal only, never printed",
        address: "FILL IN: street address, internal only, never printed",
        also_never_print: [],
      },
      management: "FILL IN: greystar, or the actual management company",
      area: "FILL IN: general area, for example South Austin near the greenbelt",
      slogan: "FILL IN: written per unit, must differ from every other ad",
      standout: "FILL IN: the one real feature this ad is built around",
      header_emoji: "FILL IN: one emoji that is actually true of this unit",
      amenities: [],
      divider: DIVIDERS[i % DIVIDERS.length], // varied across the batch already
    };

    // Only emit what was actually read off the page. Anything absent stays
    // absent so the generator flags it instead of inventing it.
    if (zip) out.zip = zip;
    if (beds) out.beds = Number(beds);
    if (baths) out.baths = Number(baths);

    // unit, base_rent, tmlp and special are intentionally omitted. The listings
    // page does not show them, and a stale special is worse than no ad.
    return out;
  });

  const payload = JSON.stringify({ listings }, null, 2);
  console.log(`Found ${all.length} listings, took the ${FROM_BOTTOM ? "bottom" : "top"} ${picked.length}.`);
  console.log(payload);
  try {
    copy(payload); // DevTools helper
    console.log("Copied to clipboard. Paste into ads/listings.json.");
  } catch {
    console.log("Copy the JSON above by hand.");
  }
  return payload;
})();
