import { describe, expect, it } from 'vitest';
import { generate, solve } from '../src/puzzle';
import { readFileSync } from 'node:fs';
import { mergeProgress } from '../src/backup';
import { COATS, catSvg } from '../src/cat';
import { PALETTES } from '../src/palettes';
import { TITLES, UNLOCKS, isUnlocked } from '../src/store';
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
  it('a tap sets a cross, and a tap on a cross or a cat clears it; undo/redo work', () => {
    const g = newGame(1);
    g.checkpoint(); g.tap(0);
    expect(g.marks[0]).toBe(CROSS);
    g.checkpoint(); g.tap(0);
    expect(g.marks[0]).toBe(EMPTY);
    g.checkpoint(); g.set(0, CAT);
    g.checkpoint(); g.tap(0);
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

describe('levels', () => {
  const pack = JSON.parse(readFileSync(new URL('../src/levels/10.json', import.meta.url), 'utf8')) as LevelData[];

  it('has 10 worlds of 20 unique 10×10 levels', () => {
    expect(WORLDS).toHaveLength(10);
    expect(pack).toHaveLength(WORLDS.length * LEVELS_PER_WORLD);
    expect(new Set(pack.map((d) => d.r)).size).toBe(pack.length);
    expect(pack.every((d) => d.s.length === 10)).toBe(true);
  });

  it('every level has one solution and can be solved without guessing at its world\'s difficulty', () => {
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

  it('worlds get harder', () => {
    expect(WORLDS.slice(0, 5).map((w) => w.minTech)).toEqual([TECH.single, TECH.blocker, TECH.pair, TECH.group, TECH.whatIf]);
    const avg = (w: number) => pack.slice(w * 20, w * 20 + 20).reduce((s, d) => s + d.e, 0) / 20;
    for (let w = 5; w < 10; w++) expect(avg(w)).toBeGreaterThanOrEqual(avg(w - 1));
  });
});

describe('back-up', () => {
  it('merges progress without losing results', () => {
    const a = { levels: { '10:0': { best: 90, stars: 2 }, '10:1': { best: 50, stars: 1 } }, freeSeed: { 10: 3 }, freePoints: 100, freeSolved: 1,
      top: [{ score: 90, label: 'a', stars: 2, date: 'x' }] };
    const b = { levels: { '10:0': { best: 80, stars: 3 }, '10:2': { best: 70, stars: 3 } }, freeSeed: { 10: 5, 12: 1 }, freePoints: 40, freeSolved: 2,
      top: [{ score: 90, label: 'a', stars: 2, date: 'x' }, { score: 95, label: 'b', stars: 3, date: 'y' }] };
    const m = mergeProgress(a, b);
    expect(m.levels['10:0']).toEqual({ best: 90, stars: 3 });
    expect(Object.keys(m.levels).sort()).toEqual(['10:0', '10:1', '10:2']);
    expect(m.freeSeed).toEqual({ 10: 5, 12: 1 });
    expect(m.top.map((e) => e.score)).toEqual([95, 90]);
  });
});

describe('look and unlocks', () => {
  it('every palette has 14 distinct colours with names', () => {
    for (const p of PALETTES) {
      expect(p.colors).toHaveLength(14);
      expect(p.names).toHaveLength(14);
      expect(new Set(p.colors).size).toBe(14);
      expect(new Set(p.names).size).toBe(14);
    }
  });

  it('every unlock points to an existing coat or palette and a real title', () => {
    for (const u of UNLOCKS) {
      expect(u.title).toBeGreaterThan(0);
      expect(u.title).toBeLessThan(TITLES.length);
      const list = u.kind === 'coat' ? COATS : PALETTES;
      expect(list.some((x) => x.id === u.id)).toBe(true);
    }
  });

  it('unlocks follow the points', () => {
    expect(isUnlocked('coat', 'lapjes', 0)).toBe(true);
    expect(isUnlocked('palette', 'kleurenblind', 0)).toBe(true);
    expect(isUnlocked('coat', 'rood', 499)).toBe(false);
    expect(isUnlocked('coat', 'rood', 500)).toBe(true);
    expect(isUnlocked('coat', 'koningin', 19999)).toBe(false);
    expect(isUnlocked('coat', 'koningin', 20000)).toBe(true);
  });

  it('draws every coat with unique clip ids', () => {
    const a = catSvg(COATS[0]), b = catSvg(COATS[0]);
    expect(a.match(/clipPath id="([^"]+)"/)![1]).not.toBe(b.match(/clipPath id="([^"]+)"/)![1]);
    for (const c of COATS) expect(catSvg(c)).toContain('<svg');
  });
});
