import { describe, expect, it } from 'vitest';
import { generate, solve } from '../src/puzzle';
import { CAT, CROSS, EMPTY, Game } from '../src/game';

function connected(regions: number[][], id: number): boolean {
  const n = regions.length;
  const cells: [number, number][] = [];
  regions.forEach((row, r) => row.forEach((v, c) => v === id && cells.push([r, c])));
  const seen = new Set([cells[0].join()]);
  const stack = [cells[0]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [rr, cc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || regions[rr][cc] !== id || seen.has(`${rr},${cc}`)) continue;
      seen.add(`${rr},${cc}`);
      stack.push([rr, cc]);
    }
  }
  return seen.size === cells.length;
}

describe('generator', () => {
  for (let seed = 1; seed <= 15; seed++) {
    it(`10×10 puzzle ${seed} has exactly one valid solution and connected regions`, () => {
      const p = generate(10, seed);
      expect(solve(10, p.regions, 5)).toEqual([p.solution]);
      for (let k = 0; k < 10; k++) expect(connected(p.regions, k)).toBe(true);
      // Solution obeys all rules
      expect(new Set(p.solution).size).toBe(10);
      for (let r = 1; r < 10; r++) expect(Math.abs(p.solution[r] - p.solution[r - 1])).toBeGreaterThan(1);
      expect(new Set(p.solution.map((c, r) => p.regions[r][c])).size).toBe(10);
    });
  }

  it('is deterministic per seed', () => {
    expect(generate(10, 42)).toEqual(generate(10, 42));
  });

  it('can make a 12×12 puzzle', () => {
    const p = generate(12, 3);
    expect(solve(12, p.regions, 2)).toHaveLength(1);
  });
});

describe('game', () => {
  it('cycles empty → cross → cat → empty and undoes', () => {
    const g = new Game(generate(10, 1));
    g.checkpoint(); g.cycle(0);
    expect(g.marks[0]).toBe(CROSS);
    g.checkpoint(); g.cycle(0);
    expect(g.marks[0]).toBe(CAT);
    g.checkpoint(); g.cycle(0);
    expect(g.marks[0]).toBe(EMPTY);
    g.undo();
    expect(g.marks[0]).toBe(CAT);
    g.redo();
    expect(g.marks[0]).toBe(EMPTY);
  });

  it('flags touching cats as conflicts', () => {
    const g = new Game(generate(10, 1));
    g.set(0, CAT);
    g.set(11, CAT);
    expect([...g.conflicts()].sort()).toEqual([0, 11]);
  });

  it('auto-crosses row, column, region and neighbours of a cat', () => {
    const p = generate(10, 1);
    const g = new Game(p);
    g.set(55, CAT);
    const auto = g.autoCrosses();
    expect(auto.has(50)).toBe(true); // same row
    expect(auto.has(5)).toBe(true); // same column
    expect(auto.has(44)).toBe(true); // diagonal neighbour
  });

  it('is solved after the helper places every cat', () => {
    const g = new Game(generate(10, 2));
    for (let k = 0; k < 10; k++) g.placeHelpCat();
    expect(g.solved).toBe(true);
    expect(g.helpCats).toBe(10);
  });
});
