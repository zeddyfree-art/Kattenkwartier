import type { Puzzle } from './puzzle';
import { NO, Solver, YES, type Step } from './solver';

/** What the player put in a cell. Auto-crosses are derived, not stored. */
export const EMPTY = 0;
export const CROSS = 1;
export const CAT = 2;
export type Mark = typeof EMPTY | typeof CROSS | typeof CAT;

/** Where a puzzle comes from. */
export type Mode =
  | { kind: 'level'; n: number; index: number }
  | { kind: 'free'; n: number; seed: number };

/** Score penalties, as a fraction of the base points. */
export const COST = { where: 0.05, why: 0.05, doIt: 0.1, cat: 0.25, wrongCat: 0.1 } as const;

export interface Snapshot {
  marks: Mark[];
  given: number[];
}

export interface SavedGame extends Snapshot {
  v: 2;
  mode: Mode;
  puzzle: Puzzle;
  tech: number;
  helpCats: number;
  hintCost: number;
  wrong: number[];
  solved: boolean;
}

/** Base points: bigger and harder puzzles are worth more. */
export function basePoints(n: number, tech: number): number {
  const factor = [1, 1, 1.2, 1.5, 2, 2.5, 3][Math.min(Math.max(tech, 0), 6)];
  return Math.round(n * n * factor);
}

export class Game {
  readonly n: number;
  readonly solver: Solver;
  marks: Mark[];
  /** Cats placed by the "Kat plaatsen" helper. */
  given: Set<number>;
  /** Cells where a wrong cat was placed at some point (each costs points once). */
  wrong: Set<number>;
  helpCats = 0;
  /** Sum of hint costs, as a fraction of the base points. */
  hintCost = 0;
  solved = false;
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  constructor(readonly puzzle: Puzzle, readonly mode: Mode, readonly tech: number, saved?: SavedGame) {
    this.n = puzzle.n;
    this.solver = new Solver(puzzle.regions);
    this.marks = saved ? [...saved.marks] : new Array<Mark>(this.n * this.n).fill(EMPTY);
    this.given = new Set(saved?.given ?? []);
    this.wrong = new Set(saved?.wrong ?? []);
    this.helpCats = saved?.helpCats ?? 0;
    this.hintCost = saved?.hintCost ?? 0;
    this.solved = saved?.solved ?? false;
  }

  // ---------- Rules ----------

  region(i: number): number {
    return this.solver.regionOf[i];
  }

  isSolution(i: number): boolean {
    return this.puzzle.solution[Math.floor(i / this.n)] === i % this.n;
  }

  cats(): number[] {
    const out: number[] = [];
    this.marks.forEach((m, i) => m === CAT && out.push(i));
    return out;
  }

  /** Cats that are on a wrong spot right now. */
  wrongCats(): number[] {
    return this.cats().filter((i) => !this.isSolution(i));
  }

  /** Crosses on a spot where a cat belongs. */
  wrongCrosses(): number[] {
    return this.marks.flatMap((m, i) => (m === CROSS && this.isSolution(i) ? [i] : []));
  }

  sees(a: number, b: number): boolean {
    return a !== b && this.solver.seen[a].includes(b);
  }

  /** Cells crossed out automatically by correct cats (wrong cats are already flagged). */
  autoCrosses(): Set<number> {
    const out = new Set<number>();
    for (const c of this.cats()) {
      if (!this.isSolution(c)) continue;
      for (const j of this.solver.seen[c]) if (this.marks[j] !== CAT) out.add(j);
    }
    return out;
  }

  conflicts(): Set<number> {
    const out = new Set<number>();
    const cats = this.cats();
    for (const a of cats) for (const b of cats) if (this.sees(a, b)) { out.add(a); out.add(b); }
    return out;
  }

  // ---------- Score ----------

  base(): number {
    return basePoints(this.n, this.tech);
  }

  penalty(): number {
    return this.hintCost + this.helpCats * COST.cat + this.wrong.size * COST.wrongCat;
  }

  score(): number {
    const base = this.base();
    return Math.max(Math.round(base * 0.1), Math.round(base * (1 - this.penalty())));
  }

  stars(): number {
    if (this.helpCats > 0) return 1;
    if (this.hintCost > 0 || this.wrong.size > 0) return 2;
    return 3;
  }

  // ---------- Undo ----------

  snapshot(): Snapshot {
    return { marks: [...this.marks], given: [...this.given] };
  }

  private restore(s: Snapshot) {
    this.marks = [...s.marks];
    this.given = new Set(s.given);
  }

  checkpoint() {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > 500) this.undoStack.shift();
    this.redoStack = [];
  }

  canUndo() { return this.undoStack.length > 0 && !this.solved; }
  canRedo() { return this.redoStack.length > 0 && !this.solved; }

  undo() {
    const s = this.undoStack.pop();
    if (!s) return;
    this.redoStack.push(this.snapshot());
    this.restore(s);
  }

  redo() {
    const s = this.redoStack.pop();
    if (!s) return;
    this.undoStack.push(this.snapshot());
    this.restore(s);
  }

  // ---------- Moves ----------

  /** Returns 'wrong' when this placed a cat on a wrong spot. */
  set(i: number, m: Mark): 'wrong' | 'newWrong' | 'ok' {
    if (this.solved) return 'ok';
    this.marks[i] = m;
    if (m !== CAT) this.given.delete(i);
    this.checkSolved();
    if (m === CAT && !this.isSolution(i)) {
      if (this.wrong.has(i)) return 'wrong';
      this.wrong.add(i);
      return 'newWrong';
    }
    return 'ok';
  }

  /** Tap cycle: empty → cross → cat → empty. */
  cycle(i: number) {
    const next: Mark = this.marks[i] === EMPTY ? CROSS : this.marks[i] === CROSS ? CAT : EMPTY;
    return this.set(i, next);
  }

  /** Place one correct cat the player has not found yet. Returns the cell or -1. */
  placeHelpCat(): number {
    const n = this.n;
    const missing = this.puzzle.solution.map((c, r) => r * n + c).filter((i) => this.marks[i] !== CAT);
    if (!missing.length) return -1;
    const target = missing[Math.floor(Math.random() * missing.length)];
    this.checkpoint();
    for (const c of this.cats()) if (this.sees(c, target)) this.marks[c] = EMPTY;
    this.marks[target] = CAT;
    this.given.add(target);
    this.helpCats++;
    this.checkSolved();
    return target;
  }

  /** The easiest logical next step, seen from what the player has on the board. */
  nextStep(autoCross: boolean): Step | null {
    const s = this.solver;
    const state = new Uint8Array(this.n * this.n);
    const auto = autoCross ? this.autoCrosses() : new Set<number>();
    this.marks.forEach((m, i) => {
      if (m === CROSS || auto.has(i)) state[i] = NO;
    });
    // Correct cats are known; the solver crosses what they see only if auto-crosses are on.
    for (const c of this.cats()) if (this.isSolution(c)) state[c] = YES;
    return s.next(state);
  }

  /** Apply a hint step to the board (as the player's own marks). */
  applyStep(step: Step) {
    this.checkpoint();
    for (const i of step.cross) if (this.marks[i] === EMPTY) this.marks[i] = CROSS;
    if (step.place >= 0) {
      this.marks[step.place] = CAT;
    }
    this.checkSolved();
  }

  private checkSolved() {
    const cats = this.cats();
    this.solved = cats.length === this.n && cats.every((i) => this.isSolution(i));
  }

  save(): SavedGame {
    return {
      v: 2, mode: this.mode, puzzle: this.puzzle, tech: this.tech, marks: this.marks, given: [...this.given],
      wrong: [...this.wrong], helpCats: this.helpCats, hintCost: this.hintCost, solved: this.solved,
    };
  }
}
