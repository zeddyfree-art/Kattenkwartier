/**
 * Step 1 of making levels: generate and grade many 10×10 puzzles.
 *   npx tsx scripts/make-pool.ts <fromSeed> <count> <out.json>
 */
import { writeFileSync } from 'node:fs';
import { generate } from '../src/puzzle';
import { grade } from '../src/solver';
import { encodeLevel } from '../src/levels';

const [from, count, out] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const pool = [];
for (let seed = from; seed < from + count; seed++) {
  const p = generate(10, seed);
  const g = grade(p.regions);
  if (g.solved) pool.push(encodeLevel(p, g));
  if (seed % 200 === 0) console.error(seed);
}
writeFileSync(out, JSON.stringify(pool));
