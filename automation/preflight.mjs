#!/usr/bin/env node
// Preflight for the unattended automations.
//
// Every scheduled task should run this first. It turns a silent failure
// ("the task fired and nothing happened") into a named cause, which was the
// original problem with the hourly triggers.
//
// Exit 0 = safe to proceed. Exit 1 = stop, the report says why.

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'

const run = promisify(execFile)

const HOSTS = ['https://app.sparkapt.com/']
const VARS = ['SPARK_EMAIL', 'SPARK_PASSWORD']
const BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'

// curl is used rather than fetch because it reads HTTPS_PROXY reliably;
// Node's built-in fetch ignores it unless NODE_USE_ENV_PROXY is set.
async function reachable(url) {
  try {
    const { stdout } = await run('curl', [
      '-sS', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20', url,
    ])
    const code = stdout.trim()
    if (code === '000') return { ok: false, detail: 'blocked by egress policy (proxy denied CONNECT)' }
    return { ok: true, detail: `HTTP ${code}` }
  } catch (err) {
    return { ok: false, detail: (err.stderr || err.message).trim().split('\n')[0] }
  }
}

const checks = []

for (const url of HOSTS) {
  const { ok, detail } = await reachable(url)
  checks.push({ name: `network: ${new URL(url).host}`, ok, detail })
}

for (const v of VARS) {
  const ok = Boolean(process.env[v])
  checks.push({ name: `env: ${v}`, ok, detail: ok ? 'set' : 'not set' })
}

checks.push({
  name: 'browser: chromium',
  ok: existsSync(BROWSERS_PATH),
  detail: existsSync(BROWSERS_PATH) ? BROWSERS_PATH : `missing at ${BROWSERS_PATH}`,
})

const width = Math.max(...checks.map((c) => c.name.length))
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(width)}  ${c.detail}`)
}

const failed = checks.filter((c) => !c.ok)
if (failed.length === 0) {
  console.log('\nPreflight passed.')
  process.exit(0)
}

console.log(`\nPreflight failed: ${failed.length} of ${checks.length} checks.`)
console.log('\nFixes live in environment settings at claude.ai/code, not in this repo:')
if (failed.some((c) => c.name.startsWith('network')))
  console.log('  - Network policy: allow the blocked host above')
if (failed.some((c) => c.name.startsWith('env')))
  console.log('  - Environment variables: add the unset names above (never put these in a prompt)')
process.exit(1)
