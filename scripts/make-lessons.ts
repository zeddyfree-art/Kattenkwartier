/**
 * Puzzles for the school lessons: small boards whose hardest step is exactly the
 * technique of the lesson, so the example is clean and easy to follow.
 *
 *   npx tsx scripts/make-lessons.ts      # writes src/levels/lessons.json
 */
import { writeFileSync } from 'node:fs';
import { generate } from '../src/puzzle';
import { grade } from '../src/solver';
import { MIN_REGION, encodeLevel, type LevelData } from '../src/levels';

/** Per technique: board size and how many puzzles. */
const PLAN: { tech: number; n: number; minRegion: number }[] = [
  { tech: 1, n: 5, minRegion: 1 }, // rules + last spot (a one-cell colour is a fine first example)
  { tech: 2, n: 5, minRegion: MIN_REGION }, // line lock
  { tech: 3, n: 6, minRegion: MIN_REGION }, // blocker
  { tech: 4, n: 6, minRegion: MIN_REGION }, // pair
  { tech: 5, n: 7, minRegion: MIN_REGION }, // group
  { tech: 6, n: 7, minRegion: MIN_REGION }, // what if
];
const PER = 3;
const TRIES = 4000;

const out: Record<number, LevelData[]> = {};
for (const { tech, n, minRegion } of PLAN) {
  const found: (LevelData & { score: number })[] = [];
  for (let seed = 1; seed <= TRIES; seed++) {
    const p = generate(n, 50000 + seed);
    const sizes = new Array<number>(n).fill(0);
    p.regions.flat().forEach((v) => sizes[v]++);
    if (Math.min(...sizes) < minRegion) continue;
    const g = grade(p.regions);
    if (!g.solved || g.level !== tech) continue;
    if (tech === 6 && g.counts[6] !== 1) continue;
    // Few steps of the lesson's technique and a short puzzle overall: the clearest examples.
    found.push({ ...encodeLevel(p, g), score: g.effort });
    if (found.length >= PER * 8) break;
  }
  found.sort((a, b) => a.score - b.score);
  if (found.length < PER) throw new Error(`te weinig lespuzzels voor techniek ${tech}: ${found.length}`);
  out[tech] = found.slice(0, PER).map(({ r, s, g, e, k }) => ({ r, s, g, e, k }));
  console.error(`techniek ${tech} (${n}×${n}): ${found.length} gevonden, effort ${out[tech].map((d) => d.e).join(', ')}`);
}
writeFileSync(new URL('../src/levels/lessons.json', import.meta.url), JSON.stringify(out) + '\n');
