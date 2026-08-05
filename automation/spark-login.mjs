#!/usr/bin/env node
// Logs into Spark APT with the cloud's own Chromium and reports what is on
// the page. No laptop, no Chrome extension.
//
// This is the DISCOVERY step, deliberately. Nobody has been able to load the
// site from a cloud session yet, so the real page structure is unknown.
// Writing selectors for a page nobody has seen produces code that looks
// finished and silently does nothing. This script logs in, captures what is
// actually there, and the working automation gets written against that.
//
// Run:  node automation/spark-login.mjs
// Needs: network policy allowing app.sparkapt.com, plus SPARK_EMAIL and
//        SPARK_PASSWORD as environment variables. Run preflight.mjs first.

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.SPARK_BASE_URL || 'https://app.sparkapt.com'
const EMAIL = process.env.SPARK_EMAIL
const PASSWORD = process.env.SPARK_PASSWORD
const OUT = process.env.SPARK_OUT_DIR || '/tmp/spark-discovery'

if (!EMAIL || !PASSWORD) {
  console.error('SPARK_EMAIL and SPARK_PASSWORD must be set. Run preflight.mjs.')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// Never let a hung page hold a scheduled run open forever.
page.setDefaultTimeout(30_000)

async function capture(label) {
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: true })
  const shape = await page.evaluate(() => {
    const text = (el) => (el.innerText || el.value || '').trim().slice(0, 80)
    const list = (sel) => [...document.querySelectorAll(sel)].slice(0, 60).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.type || undefined,
      name: el.name || undefined,
      id: el.id || undefined,
      testid: el.getAttribute('data-testid') || undefined,
      href: el.getAttribute('href') || undefined,
      text: text(el) || undefined,
    }))
    return {
      url: location.href,
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => h.innerText.trim()).slice(0, 40),
      inputs: list('input,select,textarea'),
      buttons: list('button,[role=button],input[type=submit]'),
      links: list('a[href]'),
      tables: [...document.querySelectorAll('table')].slice(0, 10).map((t) => ({
        headers: [...t.querySelectorAll('th')].map((th) => th.innerText.trim()).slice(0, 20),
        rowCount: t.querySelectorAll('tbody tr').length,
      })),
    }
  })
  writeFileSync(`${OUT}/${label}.json`, JSON.stringify(shape, null, 2))
  console.log(`captured ${label}: ${shape.title} (${shape.url})`)
  return shape
}

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await capture('01-landing')

  // Field names are unknown, so match on type and common attributes rather
  // than guessing a selector that may not exist.
  const email = page.locator('input[type=email], input[name*=email i], input[id*=email i]').first()
  const pass = page.locator('input[type=password]').first()

  if ((await pass.count()) === 0) {
    console.log('No password field on the landing page — capture 01-landing.json shows what is there.')
  } else {
    await email.fill(EMAIL)
    await pass.fill(PASSWORD)
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button[type=submit], input[type=submit], button:has-text("Log"), button:has-text("Sign")').first().click(),
    ])
    await page.waitForTimeout(3000)
    const after = await capture('02-after-login')

    // A password field still present almost always means the login failed.
    if ((await page.locator('input[type=password]').count()) > 0) {
      console.log('\nStill showing a password field. Login did not complete.')
      console.log('Check 02-after-login.png for the reason (bad credentials, 2FA, or a captcha).')
      console.log('If it is 2FA, unattended login will not work without an app password or an API key.')
    } else {
      console.log(`\nLogged in. Landed on: ${after.url}`)
      console.log(`Headings found: ${after.headings.join(' | ') || '(none)'}`)
    }
  }

  console.log(`\nArtifacts written to ${OUT}`)
  console.log('Next: write the lead-detection selectors against these captures, not against guesses.')
} catch (err) {
  console.error(`\nFailed: ${err.message}`)
  await page.screenshot({ path: `${OUT}/error.png`, fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
