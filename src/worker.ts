import { MIN_REGION } from './levels';
import { generate } from './puzzle';
import { grade } from './solver';

export interface MakeRequest {
  n: number;
  seed: number;
  /** Wanted hardest technique (inclusive range); default: anything. */
  minTech?: number;
  maxTech?: number;
}

/**
 * Make a puzzle a person can solve with logic: one solution, no colour area of one
 * cell, and at most two short "what if" steps. Deterministic for (n, seed, range).
 */
self.onmessage = (e: MessageEvent<MakeRequest>) => {
  const { n, seed, minTech = 0, maxTech = 6 } = e.data;
  for (let k = 0; ; k++) {
    const puzzle = generate(n, seed * 101 + k);
    const sizes = new Array<number>(n).fill(0);
    puzzle.regions.flat().forEach((v) => sizes[v]++);
    if (Math.min(...sizes) < MIN_REGION) continue;
    const g = grade(puzzle.regions);
    if (!g.solved || g.counts[6] > 2 || g.level < minTech || g.level > maxTech) continue;
    (self as unknown as Worker).postMessage({ puzzle: { ...puzzle, seed }, tech: g.level });
    return;
  }
};
