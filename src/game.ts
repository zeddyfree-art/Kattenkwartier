import type { Puzzle } from './puzzle';

/** What the player put in a cell. Auto-crosses are derived, not stored. */
export const EMPTY = 0;
export const CROSS = 1;
export const CAT = 2;
export type Mark = typeof EMPTY | typeof CROSS | typeof CAT;

export interface Snapshot {
  marks: Mark[];
  /** Cats placed by the "Kat plaatsen" helper (shown slightly differently). */
  given: number[];
}

export interface SavedGame extends Snapshot {
  puzzle: Puzzle;
  helpCats: number;
  solved: boolean;
}

export class Game {
  readonly n: number;
  marks: Mark[];
  given: Set<number>;
  helpCats = 0;
  solved = false;
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  constructor(readonly puzzle: Puzzle, saved?: SavedGame) {
    this.n = puzzle.n;
    this.marks = saved ? [...saved.marks] : new Array<Mark>(this.n * this.n).fill(EMPTY);
    this.given = new Set(saved?.given ?? []);
    this.helpCats = saved?.helpCats ?? 0;
    this.solved = saved?.solved ?? false;
  }

  region(i: number): number {
    return this.puzzle.regions[Math.floor(i / this.n)][i % this.n];
  }

  cats(): number[] {
    const out: number[] = [];
    this.marks.forEach((m, i) => m === CAT && out.push(i));
    return out;
  }

  /** Do two cells see each other (same row/column/region, or touching)? */
  sees(a: number, b: number): boolean {
    if (a === b) return false;
    const n = this.n;
    const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
    return ra === rb || ca === cb || this.region(a) === this.region(b) ||
      (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1);
  }

  /** Cells crossed out automatically because a cat blocks them. */
  autoCrosses(): Set<number> {
    const out = new Set<number>();
    const cats = this.cats();
    for (let i = 0; i < this.marks.length; i++) {
      if (this.marks[i] === CAT) continue;
      if (cats.some((c) => this.sees(c, i))) out.add(i);
    }
    return out;
  }

  /** Cats that clash with another cat. */
  conflicts(): Set<number> {
    const out = new Set<number>();
    const cats = this.cats();
    for (const a of cats) for (const b of cats) if (this.sees(a, b)) { out.add(a); out.add(b); }
    return out;
  }

  snapshot(): Snapshot {
    return { marks: [...this.marks], given: [...this.given] };
  }

  private restore(s: Snapshot) {
    this.marks = [...s.marks];
    this.given = new Set(s.given);
  }

  /** Call before every user change, so it can be undone. */
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

  set(i: number, m: Mark) {
    if (this.solved) return;
    this.marks[i] = m;
    if (m !== CAT) this.given.delete(i);
    this.checkSolved();
  }

  /** Tap cycle: empty → cross → cat → empty. */
  cycle(i: number) {
    const next: Mark = this.marks[i] === EMPTY ? CROSS : this.marks[i] === CROSS ? CAT : EMPTY;
    this.set(i, next);
  }

  /** Place one correct cat the player has not found yet. Returns the cell or -1. */
  placeHelpCat(): number {
    const n = this.n;
    const missing = this.puzzle.solution
      .map((c, r) => r * n + c)
      .filter((i) => this.marks[i] !== CAT);
    if (!missing.length) return -1;
    const target = missing[Math.floor(Math.random() * missing.length)];
    this.checkpoint();
    // Remove wrong cats that clash with the helper cat.
    for (const c of this.cats()) if (this.sees(c, target)) this.marks[c] = EMPTY;
    this.marks[target] = CAT;
    this.given.add(target);
    this.helpCats++;
    this.checkSolved();
    return target;
  }

  /** Cats that are not part of the solution (for the "Controleer" button). */
  wrongCats(): number[] {
    const n = this.n;
    return this.cats().filter((i) => this.puzzle.solution[Math.floor(i / n)] !== i % n);
  }

  private checkSolved() {
    const cats = this.cats();
    this.solved = cats.length === this.n && this.conflicts().size === 0;
  }

  save(): SavedGame {
    return { puzzle: this.puzzle, marks: this.marks, given: [...this.given], helpCats: this.helpCats, solved: this.solved };
  }
}
