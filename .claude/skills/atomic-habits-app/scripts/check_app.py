#!/usr/bin/env python3
"""Check that app/index.html actually works before shipping it to her phone.

Opens the app at phone size in a real browser, taps the button, reloads, and
confirms today is still marked. Writes app/screenshot.png so the look can be
eyeballed too.

Run from the repo root:
    python3 .claude/skills/atomic-habits-app/scripts/check_app.py

Exits non-zero with a readable reason if anything fails. A failure means fix or
revert -- never ship it and never describe it as working.
"""

import os
import re
import sys
from datetime import date
from pathlib import Path

os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
os.environ.setdefault("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("playwright is not installed. Run: pip3 install playwright\n"
             "(Chromium is already at /opt/pw-browsers -- never run 'playwright install'.)")

REPO = Path(__file__).resolve().parents[4]
APP = REPO / "app" / "index.html"
SHOT = REPO / "app" / "screenshot.png"


def chromium_path():
    """Find the preinstalled Chromium.

    The pip playwright version and the preinstalled browser build often disagree,
    which makes playwright ask for 'playwright install'. Don't -- point it at the
    binary that's already on disk instead.
    """
    root = Path(os.environ["PLAYWRIGHT_BROWSERS_PATH"])
    found = sorted(root.glob("chromium-*/chrome-linux/chrome"))
    return str(found[-1]) if found else None

failures = []


def check(label, ok, detail=""):
    print(("  PASS  " if ok else "  FAIL  ") + label + (f" -- {detail}" if detail and not ok else ""))
    if not ok:
        failures.append(label)
    return ok


def main():
    if not APP.exists():
        sys.exit(f"No app at {APP}")

    source = APP.read_text()
    print(f"Checking {APP.relative_to(REPO)}\n")

    # Anything remote breaks the app the moment her phone is offline.
    remote = re.findall(r'(?:src|href)\s*=\s*["\']https?://', source)
    check("no remote resources (works offline)", not remote,
          f"found {len(remote)} external src/href")

    today = date.today().isoformat()
    console_errors = []

    with sync_playwright() as p:
        exe = chromium_path()
        browser = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            has_touch=True,
            is_mobile=True,
        )
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        page.goto(APP.as_uri())
        page.wait_for_selector("#doneBtn")

        check("page loads with no console errors", not console_errors,
              "; ".join(console_errors[:3]))

        cell = f'.cell[data-date="{today}"]'
        check("today's cell exists in the grid", page.locator(cell).count() == 1)

        box = page.locator("#doneBtn").bounding_box()
        check("tap target is at least 44px tall", box and box["height"] >= 44,
              f"{box['height'] if box else 0}px")

        started_on = "on" in (page.locator(cell).get_attribute("class") or "")
        if started_on:  # leftover state from a previous run
            page.locator("#doneBtn").click()

        page.locator("#doneBtn").click()
        check("tapping the button marks today",
              "on" in (page.locator(cell).get_attribute("class") or ""))
        check("streak shows at least 1 after tapping",
              (page.locator("#streak").inner_text().strip() or "0") != "0")

        page.reload()
        page.wait_for_selector("#doneBtn")
        check("today is STILL marked after a reload (the chain survives)",
              "on" in (page.locator(cell).get_attribute("class") or ""))

        # v2: the two-minute gateway must also keep the chain alive.
        page.locator("#doneBtn").click()  # clear today back to empty
        check("two-minute button is visible when today is empty",
              page.locator("#liteBtn").is_visible())
        page.locator("#liteBtn").click()
        check("two-minute tap marks today as lite",
              "lite" in (page.locator(cell).get_attribute("class") or ""))
        check("two-minute tap keeps the streak alive",
              (page.locator("#streak").inner_text().strip() or "0") != "0")
        page.reload()
        page.wait_for_selector("#doneBtn")
        check("lite day survives a reload",
              "lite" in (page.locator(cell).get_attribute("class") or ""))
        page.locator("#doneBtn").click()
        check("a full tap upgrades a lite day to full",
              "on" in (page.locator(cell).get_attribute("class") or "")
              and "lite" not in (page.locator(cell).get_attribute("class") or ""))

        # The backup text is her escape hatch if the phone ever loses the data.
        page.locator("#backupToggle").click()
        check("backup contains today's date",
              today in (page.locator("#backupText").input_value() or ""))
        page.locator("#backupToggle").click()

        # Seed a demo chain purely for the screenshot -- an empty grid doesn't show
        # whether the thing looks good, and this browser profile is thrown away.
        page.evaluate(
            """() => {
              const d = new Date(); d.setHours(12,0,0,0);
              const ymd = x => x.toISOString().slice(0,10);
              const days = [];
              for (const back of [0,1,2,3,5,7,8,9,12,13,14,15,18,19,20]) {
                const c = new Date(d); c.setDate(c.getDate() - back); days.push(ymd(c));
              }
              const lite = [];
              for (const back of [4,11]) {
                const c = new Date(d); c.setDate(c.getDate() - back); lite.push(ymd(c));
              }
              localStorage.setItem('chain.v1', JSON.stringify({v:1, name:'Take my meds', days, lite}));
            }"""
        )
        page.reload()
        page.wait_for_selector("#doneBtn")
        page.wait_for_timeout(150)
        page.screenshot(path=str(SHOT))
        browser.close()

    print(f"\nScreenshot: {SHOT.relative_to(REPO)}")
    if failures:
        print(f"\n{len(failures)} check(s) failed. Fix or revert -- do not ship this.")
        return 1
    print("\nAll checks passed. Safe to ship.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
