# Collapse

A single-file teaching app for Sophia Reddehase, licensed Texas apartment locator
(One Place Locators, TX #831516), built around one target: **$5,000 a week, net.**

It came out of the @awwlexis "Quantum Physics Is the KEY" talk, and it takes that
framing seriously without pretending physics moves money. Eight real ideas from
quantum mechanics are stated accurately, then translated into locator work you can
do on a Tuesday in Austin. Sitting underneath the model is the part that actually
produces income: a commission engine driven by your own numbers.

Open `index.html` in a browser. There is no build step, no dependency, and no
network call. Everything you type is saved to `localStorage` on that one device.

## What's in it

**Model** — Eight lessons, each with three parts: the physics as physics, what it
does *not* mean, and what it actually implies for your business. The entanglement
lesson exists mostly to debunk the version of itself that gets sold in
manifestation circles.

**Engine** — Your goal divided by your real numbers. Rent, property fee, broker
split, lead→tour and tour→lease rates, leads per ad, and the fees you never
collect. It returns net per lease and the weekly and daily targets for leases,
tours, leads, and ads.

Two outputs matter more than the rest:

- *Leverage ranking.* Each lever gets one realistic two-week push, clamped to its
  actual headroom, ranked by weekly dollars added at the same ad volume. A
  uniform "+10% on everything" comparison is worthless here, because weekly
  revenue is a pure product of those factors, so every lever would pay
  identically. With realistic moves the ranking discriminates, and anything
  already near its ceiling sinks to the bottom on its own.
- *The cash lag.* You get paid roughly 45 days after move-in, so the week you
  earn $5,000 and the week you receive $5,000 are about nine weeks apart. Most
  people quit inside that lag and call it failure.

**Today** — The weekly targets divided into one day, with a streak. Checking
items off drives the probability curve at the top of the screen: its mean slides
toward the goal and its variance narrows. A fully checked day puts the odds near
69%, not 100%, because doing the work stacks the deck without removing the
variance. That is the honest version of the bell curves from the video.

**Pipeline** — Every live lead valued at your current rates and weighted by
stage. Any lead that reaches Toured without a registered guest card raises a
fee-at-risk alert, because that single omission is the most common way a
commission you already earned disappears.

**Drills** — Thirteen questions mixing the model with the mechanics of getting
paid in Texas: guest card timing, TMLP on Greystar and RPM properties, the
body-price/price-field match rule, the payment lag, and who actually pays you.

## Notes

The default inputs are Austin-market starting points, not gospel. Overwrite them
with what your last twenty leases actually did; every target and ranking in the
app recalculates from them.

At the defaults, $5,000 a week works out to about 5.2 leases every week, roughly
22 a month. That is top-tier Austin production. The app is built to be honest
about that rather than encouraging.
