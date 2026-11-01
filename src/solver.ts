/**
 * Human-style logical solver. Finds the easiest next deduction, explains it in plain
 * Dutch, and grades puzzles by the hardest technique needed.
 *
 * Cell state: 0 = unknown, 1 = cross (no cat), 2 = cat.
 */

export const UNKNOWN = 0;
export const NO = 1;
export const YES = 2;

/** Technique levels, from easy to hard. */
export const TECH = {
  basic: 0, // cells that share a row/column/colour with, or touch, a cat
  single: 1, // a row, column or colour has one free cell left
  lineLock: 2, // a colour fits in one row/column (or the reverse)
  blocker: 3, // a cat here would leave some row/column/colour without room
  pair: 4, // two colours share two rows/columns (or the reverse)
  group: 5, // three or more colours share as many rows/columns
  whatIf: 6, // try a cat, follow the logic, it breaks
} as const;

export const TECH_NAMES = ['Basis', 'Laatste plek', 'Lijnslot', 'Blokkade', 'Tweetal', 'Groep', 'Wat als'];

export interface Unit { kind: 'row' | 'col' | 'region'; index: number; cells: number[] }

export interface Step {
  level: number;
  /** Cell to place a cat on (or -1). */
  place: number;
  /** Cells to cross out. */
  cross: number[];
  /** Units to highlight for the "Waar?" hint. */
  focus: Unit[];
  /** Plain-language explanation for the "Waarom?" hint. */
  text: string;
}

export const COLOR_NAMES = [
  'roze', 'groen', 'geel', 'blauw', 'paars', 'oranje', 'turquoise',
  'lichtroze', 'limoen', 'lavendel', 'beige', 'lichtblauw', 'oudroze', 'saliegroen',
];

export class Solver {
  readonly n: number;
  readonly units: Unit[];
  readonly rows: Unit[];
  readonly cols: Unit[];
  readonly regs: Unit[];
  /** seen[i] = cells that cannot hold a cat if cell i holds one. */
  readonly seen: number[][];
  readonly regionOf: number[];

  constructor(readonly regions: number[][]) {
    const n = (this.n = regions.length);
    this.regionOf = regions.flat();
    this.rows = [...Array(n).keys()].map((r) => ({ kind: 'row' as const, index: r, cells: [...Array(n).keys()].map((c) => r * n + c) }));
    this.cols = [...Array(n).keys()].map((c) => ({ kind: 'col' as const, index: c, cells: [...Array(n).keys()].map((r) => r * n + c) }));
    this.regs = [...Array(n).keys()].map((k) => ({ kind: 'region' as const, index: k, cells: [] as number[] }));
    this.regionOf.forEach((k, i) => this.regs[k].cells.push(i));
    this.units = [...this.rows, ...this.cols, ...this.regs];
    this.seen = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n;
      const s = new Set<number>([...this.rows[r].cells, ...this.cols[c].cells, ...this.regs[this.regionOf[i]].cells]);
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) s.add(rr * n + cc);
        }
      s.delete(i);
      this.seen.push([...s]);
    }
  }

  unitName(u: Unit): string {
    if (u.kind === 'row') return `rij ${u.index + 1}`;
    if (u.kind === 'col') return `kolom ${u.index + 1}`;
    return `${COLOR_NAMES[u.index % COLOR_NAMES.length]}`;
  }

  private list(names: string[]): string {
    return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} en ${names[names.length - 1]}`;
  }

  free(state: Uint8Array, u: Unit): number[] {
    return u.cells.filter((i) => state[i] === UNKNOWN);
  }

  hasCat(state: Uint8Array, u: Unit): boolean {
    return u.cells.some((i) => state[i] === YES);
  }

  /** Place a cat and cross everything it sees. */
  place(state: Uint8Array, i: number) {
    state[i] = YES;
    for (const j of this.seen[i]) if (state[j] === UNKNOWN) state[j] = NO;
  }

  broken(state: Uint8Array): boolean {
    for (const u of this.units) {
      let cats = 0, free = 0;
      for (const i of u.cells) {
        if (state[i] === YES) cats++;
        else if (state[i] === UNKNOWN) free++;
      }
      if (cats > 1 || (cats === 0 && free === 0)) return true;
    }
    for (let i = 0; i < state.length; i++)
      if (state[i] === YES && this.seen[i].some((j) => state[j] === YES)) return true;
    return false;
  }

  done(state: Uint8Array): boolean {
    return state.reduce((s, v) => s + (v === YES ? 1 : 0), 0) === this.n;
  }

  /** Easiest next deduction, or null when stuck. */
  next(state: Uint8Array, maxLevel: number = TECH.whatIf): Step | null {
    return (
      this.basic(state) ??
      this.single(state) ??
      this.lineLock(state) ??
      this.blocker(state) ??
      (maxLevel >= TECH.pair ? this.groups(state, 2, 2) : null) ??
      (maxLevel >= TECH.group ? this.groups(state, 3, Math.min(4, Math.floor(this.n / 2))) : null) ??
      (maxLevel >= TECH.whatIf ? this.whatIf(state) : null)
    );
  }

  private basic(state: Uint8Array): Step | null {
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== YES) continue;
      const cross = this.seen[i].filter((j) => state[j] === UNKNOWN);
      if (cross.length) {
        const r = Math.floor(i / this.n) + 1, c = (i % this.n) + 1;
        return {
          level: TECH.basic, place: -1, cross,
          focus: [this.rows[r - 1], this.cols[c - 1], this.regs[this.regionOf[i]]],
          text: `De kat in rij ${r}, kolom ${c} blokkeert haar rij, kolom en kleur, en de vakjes eromheen.`,
        };
      }
    }
    return null;
  }

  private single(state: Uint8Array): Step | null {
    // Colours first: that is how most people look at the board.
    for (const u of [...this.regs, ...this.rows, ...this.cols]) {
      if (this.hasCat(state, u)) continue;
      const f = this.free(state, u);
      if (f.length === 1) {
        return {
          level: TECH.single, place: f[0], cross: [], focus: [u],
          text: `In ${this.unitName(u)} is nog maar één vakje vrij. Daar moet de kat staan.`,
        };
      }
    }
    return null;
  }

  private lineLock(state: Uint8Array): Step | null {
    const n = this.n;
    const tryLock = (a: Unit, lines: Unit[], lineOf: (i: number) => number): Step | null => {
      if (this.hasCat(state, a)) return null;
      const f = this.free(state, a);
      if (!f.length) return null;
      const ids = new Set(f.map(lineOf));
      if (ids.size !== 1) return null;
      const line = lines[[...ids][0]];
      const inA = new Set(a.cells);
      const cross = this.free(state, line).filter((i) => !inA.has(i));
      if (!cross.length) return null;
      return {
        level: TECH.lineLock, place: -1, cross, focus: [a, line],
        text: `Alle vrije vakjes van ${this.unitName(a)} liggen in ${this.unitName(line)}. ` +
          `De kat van ${this.unitName(line)} is dus die van ${this.unitName(a)}; de rest van ${this.unitName(line)} valt af.`,
      };
    };
    const row = (i: number) => Math.floor(i / n), col = (i: number) => i % n, reg = (i: number) => this.regionOf[i];
    for (const a of this.regs) {
      const s = tryLock(a, this.rows, row) ?? tryLock(a, this.cols, col);
      if (s) return s;
    }
    for (const a of [...this.rows, ...this.cols]) {
      const s = tryLock(a, this.regs, reg);
      if (s) return s;
    }
    return null;
  }

  private blocker(state: Uint8Array): Step | null {
    // A cell is impossible if a cat there would leave some unit without free cells.
    let best: Step | null = null;
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== UNKNOWN) continue;
      const blocked = new Set(this.seen[i]);
      blocked.add(i);
      for (const u of this.units) {
        if (u.cells.includes(i) || this.hasCat(state, u)) continue;
        const f = this.free(state, u);
        if (f.length && f.every((j) => blocked.has(j))) {
          const r = Math.floor(i / this.n) + 1, c = (i % this.n) + 1;
          const step: Step = {
            level: TECH.blocker, place: -1, cross: [i], focus: [u],
            text: `Een kat op rij ${r}, kolom ${c} zou alle vrije vakjes van ${this.unitName(u)} blokkeren. Daar kan dus geen kat.`,
          };
          // Collect all cells that block the same unit for a more useful hint.
          if (!best) best = step;
          else if (best.focus[0] === u) best.cross.push(i);
          break;
        }
      }
    }
    return best;
  }

  /**
   * k colours whose free cells fit in k rows (or columns): other colours leave those rows.
   * And the reverse: k rows (or columns) whose free cells fit in k colours.
   */
  private groups(state: Uint8Array, kMin: number, kMax: number): Step | null {
    const n = this.n;
    const row = (i: number) => Math.floor(i / n), col = (i: number) => i % n, reg = (i: number) => this.regionOf[i];
    const pairs: [Unit[], Unit[], (i: number) => number][] = [
      [this.regs, this.rows, row], [this.regs, this.cols, col],
      [this.rows, this.regs, reg], [this.cols, this.regs, reg],
      [this.rows, this.cols, col], [this.cols, this.rows, row],
    ];
    for (let k = kMin; k <= kMax; k++) {
      for (const [as, lines, lineOf] of pairs) {
        const open = as.filter((u) => !this.hasCat(state, u) && this.free(state, u).length);
        if (open.length <= k) continue;
        const sets = open.map((u) => new Set(this.free(state, u).map(lineOf)));
        const combo: number[] = [];
        const search = (start: number, lineSet: Set<number>): Step | null => {
          if (lineSet.size > k) return null;
          if (combo.length === k) {
            if (lineSet.size !== k) return null;
            const inside = new Set(combo.flatMap((x) => open[x].cells));
            const ls = [...lineSet].map((x) => lines[x]);
            const cross = ls.flatMap((l) => this.free(state, l)).filter((i) => !inside.has(i));
            if (!cross.length) return null;
            const aNames = combo.map((x) => this.unitName(open[x]));
            const lNames = ls.map((l) => this.unitName(l));
            return {
              level: k === 2 ? TECH.pair : TECH.group, place: -1, cross: [...new Set(cross)],
              focus: [...combo.map((x) => open[x]), ...ls],
              text: `${this.list(aNames)} passen samen alleen in ${this.list(lNames)}. ` +
                `Die ${k} katten vullen ${this.list(lNames)} helemaal; daar is geen plek voor andere katten.`,
            };
          }
          for (let x = start; x < open.length; x++) {
            combo.push(x);
            const s = search(x + 1, new Set([...lineSet, ...sets[x]]));
            combo.pop();
            if (s) return s;
          }
          return null;
        };
        const s = search(0, new Set());
        if (s) return s;
      }
    }
    return null;
  }

  /**
   * Follow the simple consequences (up to blockades) of a supposed cat; returns false
   * on contradiction. Kept short on purpose: a "what if" a person can follow in their head.
   */
  private propagate(state: Uint8Array): boolean {
    for (let guard = 0; guard < 500; guard++) {
      if (this.broken(state)) return false;
      const s = this.next(state, TECH.blocker);
      if (!s) return true;
      if (s.place >= 0) this.place(state, s.place);
      for (const i of s.cross) state[i] = NO;
    }
    return true;
  }

  private whatIf(state: Uint8Array): Step | null {
    // Try cells in the tightest units first: shortest chains, easiest to follow.
    const units = this.units
      .filter((u) => !this.hasCat(state, u))
      .map((u) => this.free(state, u))
      .filter((f) => f.length > 1)
      .sort((a, b) => a.length - b.length);
    const tried = new Set<number>();
    for (const f of units)
      for (const i of f) {
        if (tried.has(i)) continue;
        tried.add(i);
        const copy = state.slice();
        this.place(copy, i);
        if (!this.propagate(copy)) {
          const r = Math.floor(i / this.n) + 1, c = (i % this.n) + 1;
          return {
            level: TECH.whatIf, place: -1, cross: [i], focus: [this.rows[r - 1], this.cols[c - 1]],
            text: `Stel dat er een kat staat op rij ${r}, kolom ${c}. Als je dan verder redeneert, ` +
              `blijft er ergens geen plek over voor een kat. Daar kan dus geen kat.`,
          };
        }
      }
    return null;
  }
}

export interface Grade {
  solved: boolean;
  /** Hardest technique needed. */
  level: number;
  /** Total effort: sum of step weights (for ordering puzzles within a world). */
  effort: number;
}

const WEIGHT = [0, 1, 2, 4, 7, 11, 16];

/** Solve from scratch with the easiest steps and report how hard that was. */
export function grade(regions: number[][]): Grade {
  const s = new Solver(regions);
  const state = new Uint8Array(s.n * s.n);
  let level = 0, effort = 0;
  for (let guard = 0; guard < 2000; guard++) {
    if (s.done(state)) return { solved: true, level, effort };
    const step = s.next(state);
    if (!step) break;
    level = Math.max(level, step.level);
    effort += WEIGHT[step.level];
    if (step.place >= 0) s.place(state, step.place);
    for (const i of step.cross) state[i] = NO;
  }
  return { solved: false, level, effort };
}
