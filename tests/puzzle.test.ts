import { describe, expect, it } from 'vitest';
import { generate, solve } from '../src/puzzle';
import { readdirSync, readFileSync } from 'node:fs';
import { CAT, CROSS, EMPTY, Game, type Mode } from '../src/game';
import { LEVELS_PER_WORLD, WORLDS, decodeLevel, type LevelData } from '../src/levels';
import { NO, Solver, TECH, grade } from '../src/solver';

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

const mode: Mode = { kind: 'free', n: 10, seed: 1 };
const newGame = (seed: number) => new Game(generate(10, seed), mode, 3);

describe('game', () => {
  it('cycles empty → cross → cat → empty and undoes', () => {
    const g = newGame(1);
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

  it('flags a wrong cat immediately and charges it once', () => {
    const g = newGame(1);
    const wrongCell = [...Array(100).keys()].find((i) => !g.isSolution(i))!;
    const full = g.score();
    expect(g.set(wrongCell, CAT)).toBe('newWrong');
    expect(g.wrongCats()).toEqual([wrongCell]);
    expect(g.score()).toBeLessThan(full);
    const after = g.score();
    g.set(wrongCell, EMPTY);
    expect(g.set(wrongCell, CAT)).toBe('wrong');
    expect(g.score()).toBe(after);
    expect(g.stars()).toBe(2);
  });

  it('only auto-crosses around correct cats', () => {
    const g = newGame(1);
    const right = g.puzzle.solution[5] + 50;
    g.set(right, CAT);
    const auto = g.autoCrosses();
    expect(auto.has(50 + ((g.puzzle.solution[5] + 5) % 10))).toBe(true); // same row
    expect(auto.has(right)).toBe(false);
  });

  it('is solved after the helper places every cat, with one star', () => {
    const g = newGame(2);
    for (let k = 0; k < 10; k++) g.placeHelpCat();
    expect(g.solved).toBe(true);
    expect(g.stars()).toBe(1);
    expect(g.score()).toBe(Math.round(g.base() * 0.1));
  });

  it('can be solved with hint steps only, without ever crossing a cat cell', () => {
    for (const seed of [3, 4, 5]) {
      const g = newGame(seed);
      for (let k = 0; k < 300 && !g.solved; k++) {
        const step = g.nextStep(true)!;
        expect(step).not.toBeNull();
        for (const i of step.cross) expect(g.isSolution(i)).toBe(false);
        if (step.place >= 0) expect(g.isSolution(step.place)).toBe(true);
        g.applyStep(step);
      }
      expect(g.solved).toBe(true);
    }
  });
});

describe('solver', () => {
  it('solves generated puzzles without guessing and finds the real solution', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const p = generate(10, seed);
      const g = grade(p.regions);
      expect(g.solved).toBe(true);
    }
  });

  it('every deduction step is correct', () => {
    const p = generate(10, 7);
    const s = new Solver(p.regions);
    const state = new Uint8Array(100);
    while (!s.done(state)) {
      const step = s.next(state)!;
      for (const i of step.cross) expect(p.solution[Math.floor(i / 10)]).not.toBe(i % 10);
      if (step.place >= 0) expect(p.solution[Math.floor(step.place / 10)]).toBe(step.place % 10);
      if (step.place >= 0) s.place(state, step.place);
      for (const i of step.cross) state[i] = NO;
      expect(step.text.length).toBeGreaterThan(10);
    }
  });
});

describe('level packs', () => {
  const dir = new URL('../src/levels/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

  it('has a 10×10 pack', () => {
    expect(files).toContain('10.json');
  });

  for (const f of files) {
    it(`${f}: 5 worlds of 20 unique, logically solvable levels in the right difficulty`, () => {
      const pack = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as LevelData[];
      expect(pack).toHaveLength(WORLDS.length * LEVELS_PER_WORLD);
      expect(new Set(pack.map((d) => d.r)).size).toBe(pack.length);
      pack.forEach((d, i) => {
        const w = WORLDS[Math.floor(i / LEVELS_PER_WORLD)];
        const p = decodeLevel(d);
        expect(solve(p.n, p.regions, 2)).toEqual([p.solution]);
        const g = grade(p.regions);
        expect(g.solved).toBe(true);
        expect(g.level).toBe(d.g);
        expect(d.g).toBeGreaterThanOrEqual(w.minTech);
        expect(d.g).toBeLessThanOrEqual(w.maxTech);
      });
    });
  }

  it('worlds get harder', () => {
    expect(WORLDS.map((w) => w.minTech)).toEqual([TECH.single, TECH.blocker, TECH.pair, TECH.group, TECH.whatIf]);
  });
});
