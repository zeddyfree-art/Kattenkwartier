/**
 * Step 2 of making levels: (re)grade the pools and pick 10 worlds × 20 levels (10×10).
 *
 *   npx tsx scripts/make-pool.ts 100000 1500 pool/p0.json   # (several in parallel)
 *   npx tsx scripts/make-levels.ts pool/*.json               # writes src/levels/10.json
 *
 * Every level: one solution, solvable with the solver's (human) techniques, no colour
 * area smaller than MIN_REGION. Each world has its own techniques (see WORLDS); worlds
 * that share techniques are split by total effort. Within a world: easier to harder.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { grade } from '../src/solver';
import { LEVELS_PER_WORLD, MIN_REGION, WORLDS, decodeLevel, encodeLevel, type LevelData } from '../src/levels';
import { DAILY_LEVELS } from '../src/store';

const raw = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as LevelData[]);
const unique = [...new Map(raw.map((d) => [d.r, d])).values()];
const pool: (LevelData & { w: number })[] = [];
for (const d of unique) {
  const p = decodeLevel(d);
  const sizes = new Array<number>(p.n).fill(0);
  p.regions.flat().forEach((v) => sizes[v]++);
  if (Math.min(...sizes) < MIN_REGION) continue;
  const g = grade(p.regions);
  if (!g.solved) continue;
  pool.push({ ...encodeLevel(p, g), w: g.counts[6] });
}
const used = new Set<string>();
const pick = (list: LevelData[], k: number) => {
  list.sort((x, y) => x.e - y.e);
  return Array.from({ length: k }, (_, i) => list[Math.round((i * (list.length - 1)) / (k - 1))]);
};
const fits = (d: LevelData & { w: number }, w: (typeof WORLDS)[number]) =>
  !used.has(d.r) && d.g >= w.minTech && d.g <= w.maxTech && d.w >= w.whatIf[0] && d.w <= w.whatIf[1];

const out: LevelData[] = new Array(WORLDS.length * LEVELS_PER_WORLD);
const place = (wi: number, levels: LevelData[]) => {
  levels.forEach((d, k) => { out[wi * LEVELS_PER_WORLD + k] = { r: d.r, s: d.s, g: d.g, e: d.e, k: d.k }; used.add(d.r); });
};
// Worlds with their own technique first, so they get first pick.
WORLDS.forEach((w, wi) => {
  if (wi >= 4 && wi <= 7) return;
  const list = pool.filter((d) => fits(d, w));
  if (list.length < LEVELS_PER_WORLD) throw new Error(`te weinig puzzels voor ${w.name}: ${list.length}`);
  place(wi, pick(list, LEVELS_PER_WORLD));
});
// Worlds 5–8 share techniques: take the hardest remaining half and split it by effort.
const shared = pool.filter((d) => fits(d, WORLDS[4])).sort((x, y) => x.e - y.e);
const hard = shared.slice(Math.floor(shared.length / 2));
if (hard.length < 4 * LEVELS_PER_WORLD) throw new Error(`te weinig puzzels voor wereld 5–8: ${hard.length}`);
for (let k = 0; k < 4; k++) {
  const slice = hard.slice(Math.floor((k * hard.length) / 4), Math.floor(((k + 1) * hard.length) / 4));
  place(4 + k, pick(slice, LEVELS_PER_WORLD));
}
writeFileSync(new URL('../src/levels/10.json', import.meta.url), JSON.stringify(out) + '\n');
console.error(`wrote ${out.length} levels from a pool of ${pool.length}`);

// Daily puzzles: everything not used as a level, grouped by weekday difficulty, in a fixed shuffled order.
const daily: Record<number, LevelData[]> = {};
let x = 12345;
const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
for (const [day, d] of Object.entries(DAILY_LEVELS)) {
  const list = pool.filter((p) => !used.has(p.r) && p.g >= d.min && p.g <= d.max && p.w <= 2)
    .map((p) => ({ r: p.r, s: p.s, g: p.g, e: p.e, k: p.k }));
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  daily[Number(day)] = list.slice(0, 104); // two years of each weekday
  daily[Number(day)].forEach((p) => used.add(p.r));
}
writeFileSync(new URL('../src/levels/daily.json', import.meta.url), JSON.stringify(daily) + '\n');
console.error('daily:', Object.entries(daily).map(([d, l]) => `${d}:${l.length}`).join(' '));
