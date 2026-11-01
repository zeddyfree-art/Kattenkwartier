/** Kattenkwartier puzzle core: one cat per row, column and region; cats may not touch. */

export interface Puzzle {
  n: number;
  /** regions[r][c] = region index 0..n-1 */
  regions: number[][];
  /** solution[r] = column of the cat in row r */
  solution: number[];
  seed: number;
}

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random column per row so that no two cats share a column or touch. */
function randomPlacement(n: number, rand: () => number): number[] {
  const cols: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const place = (r: number): boolean => {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()], rand)) {
      if (used[c]) continue;
      if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
      used[c] = true;
      cols[r] = c;
      if (place(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  place(0);
  return cols;
}

/** Grow n connected regions outward from the solution cells. */
function growRegions(n: number, sol: number[], rand: () => number): number[][] {
  const reg = Array.from({ length: n }, () => new Array<number>(n).fill(-1));
  sol.forEach((c, r) => (reg[r][c] = r));
  let left = n * n - n;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // Per-region growth weight gives a mix of big and small regions.
  const weight = Array.from({ length: n }, () => 0.5 + rand());
  const size = new Array<number>(n).fill(1);
  while (left > 0) {
    // Collect frontier: (cell, neighbouring region)
    const frontier: [number, number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (reg[r][c] !== -1) continue;
        for (const [dr, dc] of dirs) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && reg[rr][cc] !== -1) frontier.push([r, c, reg[rr][cc]]);
        }
      }
    // Small regions grow faster, so sizes stay varied but not extreme.
    const w = (k: number) => weight[k] / (size[k] * size[k]);
    const total = frontier.reduce((s, f) => s + w(f[2]), 0);
    let x = rand() * total;
    let pick = frontier[frontier.length - 1];
    for (const f of frontier) {
      x -= w(f[2]);
      if (x <= 0) { pick = f; break; }
    }
    reg[pick[0]][pick[1]] = pick[2];
    size[pick[2]]++;
    left--;
  }
  return reg;
}

/**
 * Find up to `limit` solutions. Each solution is a column per row.
 * Branches on the row, column or region with the fewest free cells.
 */
export function solve(n: number, regions: number[][], limit = 2): number[][] {
  const found: number[][] = [];
  const units: number[][] = [];
  for (let i = 0; i < n; i++) {
    units.push([...Array(n).keys()].map((c) => i * n + c)); // row
    units.push([...Array(n).keys()].map((r) => r * n + i)); // column
  }
  const byRegion: number[][] = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) byRegion[regions[r][c]].push(r * n + c);
  units.push(...byRegion);
  // For each cell: cells that become unavailable when a cat sits here.
  const blocks: number[][] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const set = new Set<number>();
      for (let k = 0; k < n; k++) { set.add(r * n + k); set.add(k * n + c); }
      for (const x of byRegion[regions[r][c]]) set.add(x);
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) set.add(rr * n + cc);
        }
      blocks.push([...set]);
    }
  const free = new Uint8Array(n * n).fill(1);
  const done = new Uint8Array(units.length);
  const unitsOf: number[][] = Array.from({ length: n * n }, () => []);
  units.forEach((u, i) => u.forEach((x) => unitsOf[x].push(i)));
  const cats: number[] = [];
  const rec = () => {
    if (found.length >= limit) return;
    if (cats.length === n) {
      const sol = new Array<number>(n);
      for (const x of cats) sol[Math.floor(x / n)] = x % n;
      found.push(sol);
      return;
    }
    let best = -1, bestCount = Infinity;
    for (let i = 0; i < units.length; i++) {
      if (done[i]) continue;
      let cnt = 0;
      for (const x of units[i]) cnt += free[x];
      if (cnt < bestCount) { bestCount = cnt; best = i; if (cnt === 0) return; }
    }
    for (const x of units[best]) {
      if (!free[x]) continue;
      const cleared = blocks[x].filter((y) => free[y]);
      for (const y of cleared) free[y] = 0;
      const closed = unitsOf[x].filter((u) => !done[u]);
      for (const u of closed) done[u] = 1;
      cats.push(x);
      rec();
      cats.pop();
      for (const u of closed) done[u] = 0;
      for (const y of cleared) free[y] = 1;
      if (found.length >= limit) return;
    }
  };
  rec();
  return found;
}

function isConnectedWithout(regions: number[][], n: number, id: number, skipR: number, skipC: number, anchorR: number, anchorC: number): boolean {
  const seen = new Set<number>([anchorR * n + anchorC]);
  const stack = [[anchorR, anchorC]];
  let count = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === id && !(r === skipR && c === skipC)) count++;
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n || (rr === skipR && cc === skipC)) continue;
      if (regions[rr][cc] !== id || seen.has(rr * n + cc)) continue;
      seen.add(rr * n + cc);
      stack.push([rr, cc]);
    }
  }
  return seen.size === count;
}

/**
 * Generate a puzzle with exactly one solution. Deterministic for a given (n, seed).
 *
 * 1. Place n non-touching cats (the solution).
 * 2. Grow a connected region around each cat.
 * 3. Hill-climb: move single border cells to a neighbouring region while the number of
 *    solutions does not go up, until only the intended solution is left.
 */
export function generate(n: number, seed: number): Puzzle {
  const rand = rng(seed * 7919 + n);
  const LIMIT = 40;
  const maxSize = Math.round(n * 2.2);
  for (;;) {
    const sol = randomPlacement(n, rand);
    const regions = growRegions(n, sol, rand);
    let sols = solve(n, regions, LIMIT);
    for (let step = 0; step < 4000 && sols.length > 1; step++) {
      // Half of the time target a cell used by another solution, otherwise any cell.
      let r: number, c: number;
      if (rand() < 0.6) {
        const alts = sols.filter((x) => x.some((v, k) => v !== sol[k]));
        const alt = alts[Math.floor(rand() * alts.length)];
        const rows = [...Array(n).keys()].filter((k) => alt[k] !== sol[k]);
        r = rows[Math.floor(rand() * rows.length)];
        c = alt[r];
      } else {
        r = Math.floor(rand() * n);
        c = Math.floor(rand() * n);
        if (sol[r] === c) continue;
      }
      const id = regions[r][c];
      const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n && regions[rr][cc] !== id);
      if (!neigh.length) continue;
      const anchor = sol.findIndex((cc, rr) => regions[rr][cc] === id);
      if (!isConnectedWithout(regions, n, id, r, c, anchor, sol[anchor])) continue;
      const [tr, tc] = neigh[Math.floor(rand() * neigh.length)];
      // Keep regions from swallowing the board: cap their size.
      const to = regions[tr][tc];
      if (regions.flat().filter((v) => v === to).length >= maxSize) continue;
      regions[r][c] = to;
      const next = solve(n, regions, LIMIT);
      if (next.length <= sols.length || rand() < 0.05) sols = next;
      else regions[r][c] = id; // undo
    }
    if (sols.length === 1) return { n, regions, solution: sols[0], seed };
  }
}
