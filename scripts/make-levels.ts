/**
 * Step 2 of making levels: pick 10 worlds × 20 levels (10×10) from the graded pools.
 *
 *   npx tsx scripts/make-pool.ts 100000 1500 pool/p0.json   # (several in parallel)
 *   npx tsx scripts/make-levels.ts pool/*.json               # writes src/levels/10.json
 *
 * Worlds 1–4 each need one new technique. Worlds 5–10 all need "what if" and are
 * split by total effort, so they keep getting harder. Within a world levels go from
 * easier to harder.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { LEVELS_PER_WORLD, WORLDS, type LevelData } from '../src/levels';

const pool = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as LevelData[]);
const unique = [...new Map(pool.map((d) => [d.r, d])).values()];
const pick = (list: LevelData[], k: number) => {
  list.sort((x, y) => x.e - y.e);
  return Array.from({ length: k }, (_, i) => list[Math.round((i * (list.length - 1)) / (k - 1))]);
};

const out: LevelData[] = [];
// Worlds with their own technique.
WORLDS.forEach((w) => {
  if (w.minTech === 6) return;
  const list = unique.filter((d) => d.g >= w.minTech && d.g <= w.maxTech);
  if (list.length < LEVELS_PER_WORLD) throw new Error(`te weinig puzzels voor ${w.name}: ${list.length}`);
  out.push(...pick(list, LEVELS_PER_WORLD));
});
// "What if" worlds: split the hardest puzzles into equal slices by effort.
const hardWorlds = WORLDS.filter((w) => w.minTech === 6).length;
const hard = unique.filter((d) => d.g === 6).sort((x, y) => x.e - y.e);
if (hard.length < hardWorlds * LEVELS_PER_WORLD) throw new Error(`te weinig zware puzzels: ${hard.length}`);
for (let w = 0; w < hardWorlds; w++) {
  const slice = hard.slice(Math.floor((w * hard.length) / hardWorlds), Math.floor(((w + 1) * hard.length) / hardWorlds));
  out.push(...pick(slice, LEVELS_PER_WORLD));
}
writeFileSync(new URL('../src/levels/10.json', import.meta.url), JSON.stringify(out) + '\n');
console.error(`wrote ${out.length} levels; tier-6 pool ${hard.length}`);
