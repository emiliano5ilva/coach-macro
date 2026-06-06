#!/usr/bin/env node
// scripts/check-env.mjs
// Reads CLIENT var names from .env.example, checks each is present + non-empty
// in .env.local. Prints PASS or a list of MISSING/EMPTY vars.
// NEVER prints values — only names and present/missing status.
//
// Usage:  node scripts/check-env.mjs   (or: npm run check-env)
// Gating: npm run build:sim runs this first; exits nonzero → build aborts.

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── Load .env.local ──────────────────────────────────────────────────────────

const localPath = resolve(root, '.env.local');
if (!existsSync(localPath)) {
  console.error('\n✗ .env.local not found.');
  console.error('  Create it and populate VITE_* vars. See .env.example.\n');
  process.exit(1);
}

function parseEnvFile(path) {
  const vars = {};
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name  = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    vars[name] = value;
  }
  return vars;
}

const localVars = parseEnvFile(localPath);

// ── Parse .env.example: CLIENT vars only (VITE_* section) ───────────────────
// We stop at the SERVER VARS section because those aren't in .env.local.

const examplePath = resolve(root, '.env.example');
if (!existsSync(examplePath)) {
  console.error('\n✗ .env.example not found — cannot determine required vars.\n');
  process.exit(1);
}

const exampleText = readFileSync(examplePath, 'utf8');

// Buckets for CLIENT vars
const bootVars    = [];  // [BOOT]    — crash if missing
const coreVars    = [];  // [CORE]    — feature critically broken
const featureVars = [];  // [FEATURE] — feature degrades; app boots
const devVars     = [];  // [DEV]     — empty is fine in prod

let inClientSection = false;
let lastTag = '';

for (const raw of exampleText.split('\n')) {
  const line = raw.trim();

  // Detect entering/leaving the CLIENT section
  if (line.includes('CLIENT VARS') && line.includes('VITE_')) {
    inClientSection = true;
    continue;
  }
  if (inClientSection && line.includes('SERVER VARS')) {
    break; // Stop; server vars not in .env.local
  }
  if (!inClientSection) continue;

  // Pick up tag from comment lines like "# [BOOT] Supabase..."
  if (line.startsWith('#')) {
    const tagMatch = line.match(/\[(BOOT|CORE|FEATURE|DEV)\]/);
    if (tagMatch) lastTag = tagMatch[1];
    continue;
  }

  // Extract var name from assignment lines
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  const name = line.slice(0, eq).trim();
  if (!name) continue;

  if      (lastTag === 'BOOT')    bootVars.push(name);
  else if (lastTag === 'CORE')    coreVars.push(name);
  else if (lastTag === 'DEV')     devVars.push(name);
  else                            featureVars.push(name);
}

// ── Check each bucket ────────────────────────────────────────────────────────

function check(names) {
  const missing = [], empty = [];
  for (const n of names) {
    if (!(n in localVars))    missing.push(n);
    else if (!localVars[n])   empty.push(n);
  }
  return { missing, empty };
}

const bootCheck    = check(bootVars);
const coreCheck    = check(coreVars);
const featureCheck = check(featureVars);
// DEV vars: missing/empty is fine — just note it

// ── Report ───────────────────────────────────────────────────────────────────

console.log('\n══ Coach Macro env check ══════════════════════════════════════════════\n');

function reportGroup(label, { missing, empty }, warn = false) {
  if (missing.length === 0 && empty.length === 0) {
    console.log(`  ✓ ${label}: all present`);
  } else {
    const sym = warn ? '⚠ ' : '✗';
    console.log(`  ${sym} ${label}:`);
    for (const n of missing) console.log(`      MISSING: ${n}`);
    for (const n of empty)   console.log(`      EMPTY:   ${n}`);
  }
}

reportGroup('[BOOT] — crash if absent',            bootCheck);
reportGroup('[CORE] — AI/features dead if absent', coreCheck);
reportGroup('[FEATURE] — optional integrations',   featureCheck, true);

const devMissing = devVars.filter(n => !(n in localVars));
if (devMissing.length > 0) {
  console.log(`  ℹ [DEV-ONLY] — empty is fine in prod; present or missing:`);
  for (const n of devVars) {
    const status = localVars[n] ? 'present' : (n in localVars ? 'empty (ok)' : 'absent (ok)');
    console.log(`      ${n}: ${status}`);
  }
} else {
  console.log(`  ✓ [DEV-ONLY]: accounted for`);
}

console.log('\n───────────────────────────────────────────────────────────────────────');

// Fatal: BOOT or CORE vars missing/empty
const fatalMissing = [
  ...bootCheck.missing, ...bootCheck.empty,
  ...coreCheck.missing, ...coreCheck.empty,
];

if (fatalMissing.length > 0) {
  console.error(`\n✗ ${fatalMissing.length} BOOT/CORE var(s) missing or empty — build aborted.`);
  console.error('  Restore them from your password manager. See .env.example.\n');
  console.error('  Tip: `vercel env pull` only restores what Vercel\'s dev environment');
  console.error('  knows about. VITE_* client vars often must be added back manually.\n');
  process.exit(1);
}

const featureWarnings = featureCheck.missing.length + featureCheck.empty.length;
if (featureWarnings > 0) {
  console.warn(`\n⚠  ${featureWarnings} feature var(s) missing — those integrations won't work.`);
  console.warn('  This is non-fatal. Continuing build.\n');
} else {
  console.log('\n✓ All BOOT and CORE vars present. Build proceeding.\n');
}

process.exit(0);
