import { generate } from './puzzle';
import { grade } from './solver';

/** Free play: make a puzzle that a person can solve without guessing. */
self.onmessage = (e: MessageEvent<{ n: number; seed: number }>) => {
  const { n, seed } = e.data;
  for (let k = 0; ; k++) {
    const puzzle = generate(n, seed * 101 + k);
    const g = grade(puzzle.regions);
    if (g.solved) {
      (self as unknown as Worker).postMessage({ puzzle: { ...puzzle, seed }, tech: g.level });
      return;
    }
  }
};
