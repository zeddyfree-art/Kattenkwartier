import './style.css';
import { calico } from './cat';
import { CAT, CROSS, EMPTY, Game, type SavedGame } from './game';
import type { Puzzle } from './puzzle';

/** Soft but distinct region colours (enough for 14×14). */
const PALETTE = [
  '#f2899b', '#8fd18a', '#f6c85f', '#7fb3ee', '#b993e6', '#f5a066', '#5cc8bb',
  '#f4b9d8', '#c9e07a', '#a3a6f2', '#dcb38d', '#9fdcf5', '#d98fb5', '#b4c39c',
];

interface Settings { autoCross: boolean; size: number }
interface Progress { seed: Record<string, number>; solved: Record<string, number> }

const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem('kk:' + key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem('kk:' + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

const settings: Settings = { autoCross: true, size: 10, ...store.get<Partial<Settings>>('settings', {}) };
const progress: Progress = { seed: {}, solved: {}, ...store.get<Partial<Progress>>('progress', {}) };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const boardEl = $('board');
const trackerEl = $('tracker');
const loadingEl = $('loading');
const subtitleEl = $('subtitle');
const toastEl = $('toast');

let game: Game | null = null;
let cells: HTMLDivElement[] = [];
let flash = new Set<number>();

// ---------- Puzzle loading ----------

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function makePuzzle(n: number, seed: number): Promise<Puzzle> {
  return new Promise((resolve) => {
    worker.onmessage = (e: MessageEvent<Puzzle>) => resolve(e.data);
    worker.postMessage({ n, seed });
  });
}

async function startPuzzle(n: number, seed: number) {
  loadingEl.hidden = false;
  boardEl.classList.add('busy');
  const puzzle = await makePuzzle(n, seed);
  loadingEl.hidden = true;
  boardEl.classList.remove('busy');
  progress.seed[n] = seed;
  store.set('progress', progress);
  setGame(new Game(puzzle));
}

function setGame(g: Game) {
  game = g;
  buildBoard();
  render();
  save();
}

function save() {
  if (game) store.set('current', game.save());
}

// ---------- Board ----------

function buildBoard() {
  if (!game) return;
  const { n, puzzle } = game;
  boardEl.style.setProperty('--n', String(n));
  boardEl.replaceChildren();
  cells = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const reg = puzzle.regions[r][c];
      const el = document.createElement('div');
      el.className = 'cell';
      el.dataset.i = String(r * n + c);
      el.style.setProperty('--bg', PALETTE[reg % PALETTE.length]);
      // Thick lines between different colours make the regions easy to read.
      if (r > 0 && puzzle.regions[r - 1][c] !== reg) el.classList.add('bt');
      if (c > 0 && puzzle.regions[r][c - 1] !== reg) el.classList.add('bl');
      el.setAttribute('role', 'gridcell');
      boardEl.append(el);
      cells.push(el);
    }
  trackerEl.replaceChildren(
    ...Array.from({ length: n }, (_, k) => {
      const t = document.createElement('span');
      t.className = 'track';
      t.style.setProperty('--bg', PALETTE[k % PALETTE.length]);
      return t;
    }),
  );
}

function render() {
  if (!game) return;
  const auto = settings.autoCross ? game.autoCrosses() : new Set<number>();
  const conflicts = game.conflicts();
  const regionsWithCat = new Set(game.cats().map((i) => game!.region(i)));
  game.marks.forEach((m, i) => {
    const el = cells[i];
    const state = m === CAT ? 'cat' : m === CROSS ? 'cross' : auto.has(i) ? 'auto' : 'empty';
    if (el.dataset.state !== state) {
      el.dataset.state = state;
      el.innerHTML = state === 'cat' ? calico() : state === 'empty' ? '' : '<span class="x"></span>';
    }
    el.classList.toggle('conflict', conflicts.has(i));
    el.classList.toggle('given', game!.given.has(i));
    el.classList.toggle('flash', flash.has(i));
  });
  [...trackerEl.children].forEach((t, k) => {
    const found = regionsWithCat.has(k);
    if (t.classList.contains('found') !== found) {
      t.classList.toggle('found', found);
      t.innerHTML = found ? calico() : '';
    }
  });
  boardEl.classList.toggle('solved', game.solved);
  const n = game.n;
  const seed = game.puzzle.seed;
  const helpText = game.helpCats ? ` · ${game.helpCats}× geholpen` : '';
  subtitleEl.textContent = `Puzzel ${seed} · ${n}×${n}${helpText}`;
  ($('btn-undo') as HTMLButtonElement).disabled = !game.canUndo();
  ($('btn-redo') as HTMLButtonElement).disabled = !game.canRedo();
  ($('btn-check') as HTMLButtonElement).disabled = game.solved;
  ($('btn-help') as HTMLButtonElement).disabled = game.solved;
}

// ---------- Input: tap cycles, drag paints crosses ----------

let down: { i: number; startMark: number; dragging: boolean; mode: 'paint' | 'erase' | null } | null = null;

function cellAt(x: number, y: number): number {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.cell');
  return el && boardEl.contains(el) ? Number(el.dataset.i) : -1;
}

boardEl.addEventListener('pointerdown', (e) => {
  if (!game || game.solved) return;
  const i = cellAt(e.clientX, e.clientY);
  if (i < 0) return;
  e.preventDefault();
  boardEl.setPointerCapture(e.pointerId);
  down = { i, startMark: game.marks[i], dragging: false, mode: null };
});

boardEl.addEventListener('pointermove', (e) => {
  if (!down || !game) return;
  const i = cellAt(e.clientX, e.clientY);
  if (i < 0) return;
  if (!down.dragging) {
    if (i === down.i) return;
    // Start a drag: from an empty cell we paint crosses, from a cross we erase them.
    down.mode = down.startMark === EMPTY ? 'paint' : down.startMark === CROSS ? 'erase' : null;
    if (!down.mode) return;
    down.dragging = true;
    game.checkpoint();
    applyDrag(down.i);
  }
  applyDrag(i);
});

function applyDrag(i: number) {
  if (!game || !down) return;
  if (down.mode === 'paint' && game.marks[i] === EMPTY) game.set(i, CROSS);
  if (down.mode === 'erase' && game.marks[i] === CROSS) game.set(i, EMPTY);
  render();
}

function endPointer() {
  if (!down || !game) return;
  if (!down.dragging) {
    game.checkpoint();
    game.cycle(down.i);
    flash.clear();
    render();
  }
  down = null;
  save();
  if (game.solved) celebrate();
}

boardEl.addEventListener('pointerup', endPointer);
boardEl.addEventListener('pointercancel', () => { down = null; render(); });

// ---------- Buttons ----------

function toast(text: string) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout((toast as unknown as { t?: number }).t);
  (toast as unknown as { t?: number }).t = window.setTimeout(() => toastEl.classList.remove('show'), 2600);
}

$('btn-undo').addEventListener('click', () => { game?.undo(); render(); save(); });
$('btn-redo').addEventListener('click', () => { game?.redo(); render(); save(); });

$('btn-check').addEventListener('click', () => {
  if (!game) return;
  const wrong = game.wrongCats();
  flash = new Set(wrong);
  render();
  if (wrong.length) toast(wrong.length === 1 ? 'Eén kat staat niet goed.' : `${wrong.length} katten staan niet goed.`);
  else toast(game.cats().length ? 'Alle katten staan goed. Ga zo door!' : 'Nog geen katten om te controleren.');
  setTimeout(() => { flash.clear(); render(); }, 2400);
});

$('btn-help').addEventListener('click', () => {
  if (!game) return;
  const i = game.placeHelpCat();
  if (i < 0) return;
  flash = new Set([i]);
  render();
  save();
  setTimeout(() => { flash.clear(); render(); }, 1200);
  if (game.solved) celebrate();
});

$('btn-new').addEventListener('click', () => {
  if (game && !game.solved && game.marks.some((m) => m !== EMPTY) && !confirm('Deze puzzel overslaan en een nieuwe beginnen?')) return;
  nextPuzzle();
});

function nextPuzzle() {
  const n = settings.size;
  void startPuzzle(n, (progress.seed[n] ?? 0) + 1);
}

function celebrate() {
  if (!game) return;
  const key = `${game.n}:${game.puzzle.seed}`;
  const firstTime = !(key in progress.solved);
  if (firstTime) progress.solved[key] = game.helpCats;
  store.set('progress', progress);
  const total = Object.keys(progress.solved).length;
  const help = game.helpCats ? ` met ${game.helpCats} geholpen kat${game.helpCats > 1 ? 'ten' : ''}` : ' helemaal zelf';
  $('win-text').textContent = `Puzzel ${game.puzzle.seed} opgelost${help}. Totaal ${total} puzzel${total > 1 ? 's' : ''} opgelost.`;
  setTimeout(() => ($('dlg-win') as HTMLDialogElement).showModal(), 700);
}

const winDlg = $('dlg-win') as HTMLDialogElement;
winDlg.querySelector('.win-cat')!.innerHTML = calico();
winDlg.addEventListener('close', () => { if (winDlg.returnValue === 'next') nextPuzzle(); });

// Settings
const autoEl = $('set-auto') as HTMLInputElement;
const sizeEl = $('set-size') as HTMLSelectElement;
const settingsDlg = $('dlg-settings') as HTMLDialogElement;
$('btn-settings').addEventListener('click', () => {
  autoEl.checked = settings.autoCross;
  sizeEl.value = String(settings.size);
  settingsDlg.showModal();
});
autoEl.addEventListener('change', () => { settings.autoCross = autoEl.checked; store.set('settings', settings); render(); });
sizeEl.addEventListener('change', () => {
  settings.size = Number(sizeEl.value);
  store.set('settings', settings);
});
settingsDlg.addEventListener('close', () => {
  if (game && game.n !== settings.size && (game.solved || !game.marks.some((m) => m !== EMPTY))) nextPuzzle();
  else if (game && game.n !== settings.size) toast(`De volgende nieuwe puzzel wordt ${settings.size}×${settings.size}.`);
});

const rulesDlg = $('dlg-rules') as HTMLDialogElement;
$('btn-rules').addEventListener('click', () => rulesDlg.showModal());
document.querySelector('.ico-cat')!.innerHTML = calico();

// ---------- Start ----------

const saved = store.get<SavedGame | null>('current', null);
if (saved?.puzzle && saved.puzzle.n === saved.puzzle.regions?.length) {
  setGame(new Game(saved.puzzle, saved));
} else {
  if (!store.get('seenRules', false)) {
    rulesDlg.showModal();
    store.set('seenRules', true);
  }
  void startPuzzle(settings.size, (progress.seed[settings.size] ?? 0) + 1);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
