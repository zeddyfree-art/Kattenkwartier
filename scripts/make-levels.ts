/**
 * Pre-generates the level packs: 5 worlds × 20 levels per board size.
 * Each world needs a harder technique than the one before; within a world,
 * levels are ordered by total effort.
 *
 *   npx tsx scripts/make-levels.ts 10      # writes src/levels/10.json
 */
import { writeFileSync } from 'node:fs';
import { generate } from '../src/puzzle';
import { grade } from '../src/solver';
import { WORLDS, encodeLevel, type LevelData } from '../src/levels';

const n = Number(process.argv[2] ?? 10);
const PER_WORLD = 20;
const POOL = 32; // collect a few extra per world, then spread them by effort
const buckets: LevelData[][] = WORLDS.map(() => []);

for (let seed = 100_000; buckets.some((b) => b.length < POOL); seed++) {
  const p = generate(n, seed);
  const g = grade(p.regions);
  if (!g.solved) continue;
  const w = WORLDS.findIndex((x) => g.level >= x.minTech && g.level <= x.maxTech);
  if (w < 0 || buckets[w].length >= POOL) continue;
  buckets[w].push(encodeLevel(p, g));
  if (seed % 20 === 0) console.error(n, seed, buckets.map((b) => b.length).join(' '));
}

const out = buckets.flatMap((b) => {
  b.sort((x, y) => x.e - y.e);
  // Evenly spaced picks from easiest to hardest.
  return Array.from({ length: PER_WORLD }, (_, k) => b[Math.round((k * (b.length - 1)) / (PER_WORLD - 1))]);
});
writeFileSync(new URL(`../src/levels/${n}.json`, import.meta.url), JSON.stringify(out) + '\n');
console.error(`wrote ${out.length} levels for ${n}×${n}`);
