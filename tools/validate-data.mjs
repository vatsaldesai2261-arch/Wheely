#!/usr/bin/env node
// Dependency-free validator for the Yoga Adventure Wheel dataset.
// Run: node tools/validate-data.mjs   (exits non-zero on any failure)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warn = [];

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(root, rel), 'utf8'));
  } catch (e) {
    errors.push(`${rel}: ${e.message}`);
    return null;
  }
}

const MIN_POSES = 500;
const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'advanced']);
const REQUIRED_STRINGS = ['id', 'english', 'category', 'funFact', 'story', 'description', 'emoji'];

const index = readJson('data/poses/index.json');
if (index) {
  const catIds = new Set(index.categories.map((c) => c.id));
  const seen = new Map(); // id -> shard
  let total = 0;

  for (const shard of index.shards) {
    const rel = `data/poses/${shard}`;
    const poses = readJson(rel);
    if (!poses) continue;
    if (!Array.isArray(poses)) { errors.push(`${rel}: not a JSON array`); continue; }
    total += poses.length;

    for (const p of poses) {
      const at = `${rel} → "${p.id ?? p.english ?? '?'}"`;
      for (const f of REQUIRED_STRINGS) {
        if (typeof p[f] !== 'string' || p[f].length === 0) errors.push(`${at}: missing/empty "${f}"`);
      }
      if (typeof p.sanskrit !== 'string') errors.push(`${at}: "sanskrit" must be a string (may be empty)`);
      if (typeof p.sanskritDevanagari !== 'string') errors.push(`${at}: "sanskritDevanagari" must be a string`);
      if (typeof p.animalName !== 'string') errors.push(`${at}: "animalName" must be a string`);
      if (!Array.isArray(p.benefits) || p.benefits.length < 1) errors.push(`${at}: "benefits" must be a non-empty array`);
      if (!DIFFICULTIES.has(p.difficulty)) errors.push(`${at}: bad difficulty "${p.difficulty}"`);
      if (!Number.isInteger(p.duration) || p.duration < 5 || p.duration > 60) errors.push(`${at}: bad duration "${p.duration}"`);
      if (p.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errors.push(`${at}: id is not kebab-case`);
      if (p.category && !catIds.has(p.category)) errors.push(`${at}: unknown category "${p.category}"`);
      if ((p.difficulty === 'hard' || p.difficulty === 'advanced') && !p.safetyNote) {
        errors.push(`${at}: ${p.difficulty} pose requires a safetyNote`);
      }
      if (p.id) {
        if (seen.has(p.id)) errors.push(`${at}: duplicate id (also in ${seen.get(p.id)})`);
        else seen.set(p.id, shard);
      }
    }
  }

  if (total < MIN_POSES) errors.push(`dataset has ${total} poses; needs ≥ ${MIN_POSES}`);
  else console.log(`✓ ${total} poses across ${index.shards.length} shards`);
}

// Auxiliary data files: must parse and have the expected top-level shape.
const belts = readJson('data/belts.json');
if (belts && (!Array.isArray(belts) || belts.length < 2 || belts[0].minXp !== 0)) {
  errors.push('data/belts.json: must be an array of belts starting at minXp 0');
}
const ach = readJson('data/achievements.json');
if (ach && !Array.isArray(ach)) errors.push('data/achievements.json: must be an array');
const stories = readJson('data/stories.json');
if (stories && !Array.isArray(stories)) errors.push('data/stories.json: must be an array');
const animals = readJson('data/animals.json');
if (animals && !Array.isArray(animals?.habitats)) errors.push('data/animals.json: needs a "habitats" array');

for (const w of warn) console.warn(`⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('✓ all data files valid');
