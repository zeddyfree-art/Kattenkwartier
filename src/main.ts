import './style.css';
import { calico } from './cat';
import { CAT, COST, CROSS, EMPTY, Game, basePoints, type Mode, type SavedGame } from './game';
import { exportFile, readFile, applyBackup } from './backup';
import { driveAvailable, driveLinked, hasToken, lastSync, syncDrive, unlinkDrive } from './drive';
import { LEVEL_SIZE, LEVELS_PER_WORLD, WORLDS, decodeLevel, type LevelData } from './levels';
import { loadPack } from './packs';
import type { Puzzle } from './puzzle';
import { TECH_NAMES, type Step } from './solver';
import {
  addTopScore, load, progress, save, saveProgress, saveSettings, settings, titleFor, totalPoints,
} from './store';
import { APP_VERSION, CHANGELOG, applyUpdate, watchForUpdates } from './update';

/** Soft but distinct region colours (enough for 14×14). Order matches COLOR_NAMES in solver.ts. */
const PALETTE = [
  '#f2899b', '#8fd18a', '#f6c85f', '#7fb3ee', '#b993e6', '#f5a066', '#5cc8bb',
  '#f4b9d8', '#c9e07a', '#a3a6f2', '#dcb38d', '#9fdcf5', '#d98fb5', '#b4c39c',
];

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const homeEl = $('home');
const gameEl = $('game');
const boardEl = $('board');
const trackerEl = $('tracker');
const loadingEl = $('loading');
const toastEl = $('toast');
const hintPanel = $('hint-panel');

let pack: LevelData[] | null = null;
let game: Game | null = null;
let cells: HTMLDivElement[] = [];
let flash = new Set<number>();

// ---------- Helpers ----------

let toastTimer = 0;
function toast(text: string, kind: 'info' | 'bad' = 'info') {
  toastEl.textContent = text;
  toastEl.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 2800);
}

function starsHtml(k: number, max = 3): string {
  return Array.from({ length: max }, (_, i) => `<span class="star ${i < k ? 'on' : ''}">★</span>`).join('');
}

function levelKey(n: number, index: number) {
  return `${n}:${index}`;
}

function levelLabel(index: number) {
  const w = Math.floor(index / LEVELS_PER_WORLD);
  return `${WORLDS[w].name} · level ${index + 1}`;
}

function solvedInWorld(n: number, w: number): number {
  let k = 0;
  for (let i = w * LEVELS_PER_WORLD; i < (w + 1) * LEVELS_PER_WORLD; i++) if (progress.levels[levelKey(n, i)]) k++;
  return k;
}

/** A world opens once half of the previous world is solved. */
function worldOpen(n: number, w: number): boolean {
  return w === 0 || solvedInWorld(n, w - 1) >= LEVELS_PER_WORLD / 2;
}

function show(screen: 'home' | 'game') {
  homeEl.hidden = screen !== 'home';
  gameEl.hidden = screen !== 'game';
  if (screen === 'home') renderHome();
  window.scrollTo(0, 0);
}

// ---------- Home ----------

function renderHome() {
  const n = LEVEL_SIZE;
  const pts = totalPoints();
  const t = titleFor(pts);
  $('player-title').textContent = t.title.name;
  $('player-points').textContent = t.next
    ? `${pts} punten · nog ${t.next.min - pts} tot ${t.next.name}`
    : `${pts} punten · hoogste titel!`;
  const fill = t.next ? (pts - t.title.min) / (t.next.min - t.title.min) : 1;
  $('player-bar').style.width = `${Math.round(fill * 100)}%`;
  const solved = Object.keys(progress.levels).filter((k) => k.startsWith(`${n}:`)).length;
  $('home-sub').textContent = `${n}×${n} · ${solved} van ${pack?.length ?? 100} levels opgelost`;
  $('btn-continue').textContent = game && !game.solved ? 'Verder spelen' : nextLevelIndex() >= 0 ? 'Volgende level' : 'Nieuwe puzzel';
  $('btn-free').textContent = settings.size === LEVEL_SIZE ? 'Vrij spel' : `Vrij spel ${settings.size}×${settings.size}`;

  const worlds = $('worlds');
  worlds.replaceChildren();
  if (!pack) {
    worlds.innerHTML = '<div class="card"><p>De levels konden niet geladen worden.</p></div>';
    return;
  }
  WORLDS.forEach((w, wi) => {
    const open = worldOpen(n, wi);
    const card = document.createElement('div');
    card.className = `world card ${open ? '' : 'locked'}`;
    const stars = Array.from({ length: LEVELS_PER_WORLD }, (_, k) => progress.levels[levelKey(n, wi * LEVELS_PER_WORLD + k)]?.stars ?? 0)
      .reduce((a, b) => a + b, 0);
    card.innerHTML = `
      <div class="world-head">
        <div><h3>Wereld ${wi + 1}: ${w.name}</h3><p>${open ? w.intro : `🔒 Los ${LEVELS_PER_WORLD / 2} levels op in ${WORLDS[wi - 1]?.name} om deze wereld te openen.`}</p></div>
        <div class="world-stars">★ ${stars}/${LEVELS_PER_WORLD * 3}</div>
      </div>`;
    const grid = document.createElement('div');
    grid.className = 'level-grid';
    for (let k = 0; k < LEVELS_PER_WORLD; k++) {
      const index = wi * LEVELS_PER_WORLD + k;
      const res = progress.levels[levelKey(n, index)];
      const b = document.createElement('button');
      const current = game && !game.solved && game.mode.kind === 'level' && game.n === n && game.mode.index === index;
      b.className = `level ${res ? 'done' : ''} ${current ? 'current' : ''}`;
      b.disabled = !open || !pack;
      b.innerHTML = `<span class="num">${index + 1}</span><span class="stars">${res ? starsHtml(res.stars) : ''}</span>`;
      b.addEventListener('click', () => startLevel(index));
      grid.append(b);
    }
    card.append(grid);
    worlds.append(card);
  });
}

function nextLevelIndex(): number {
  const n = LEVEL_SIZE;
  const total = pack?.length ?? 0;
  for (let i = 0; i < total; i++) {
    if (!worldOpen(n, Math.floor(i / LEVELS_PER_WORLD))) break;
    if (!progress.levels[levelKey(n, i)]) return i;
  }
  return -1;
}

$('btn-continue').addEventListener('click', () => {
  if (game && !game.solved) { show('game'); return; }
  const i = nextLevelIndex();
  if (i >= 0) startLevel(i);
  else void startFree();
});
$('btn-free').addEventListener('click', () => {
  if (game && !game.solved && game.mode.kind === 'free' && game.n === settings.size) show('game');
  else void startFree();
});

// ---------- Starting puzzles ----------

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function makeFree(n: number, seed: number): Promise<{ puzzle: Puzzle; tech: number }> {
  return new Promise((resolve) => {
    worker.onmessage = (e: MessageEvent<{ puzzle: Puzzle; tech: number }>) => resolve(e.data);
    worker.postMessage({ n, seed });
  });
}

function confirmLeave(): boolean {
  if (!game || game.solved || !game.marks.some((m) => m !== EMPTY)) return true;
  return confirm('Je huidige puzzel is nog niet af. Toch een andere beginnen? (Wat je daarin hebt gezet gaat verloren.)');
}

function startLevel(index: number) {
  if (!pack) return;
  const n = LEVEL_SIZE;
  if (game && game.mode.kind === 'level' && game.mode.index === index && game.n === n && !game.solved) { show('game'); return; }
  if (!confirmLeave()) return;
  const d = pack[index];
  setGame(new Game(decodeLevel(d), { kind: 'level', n, index }, d.g));
  show('game');
}

async function startFree() {
  if (!confirmLeave()) return;
  const n = settings.size;
  const seed = (progress.freeSeed[n] ?? 0) + 1;
  progress.freeSeed[n] = seed;
  saveProgress();
  closeHint();
  game = null;
  show('game');
  boardEl.replaceChildren();
  trackerEl.replaceChildren();
  $('game-title').textContent = `Vrij spel #${seed}`;
  $('game-sub').textContent = `${n}×${n}`;
  $('score').textContent = '–';
  loadingEl.hidden = false;
  const { puzzle, tech } = await makeFree(n, seed);
  loadingEl.hidden = true;
  setGame(new Game(puzzle, { kind: 'free', n, seed }, tech));
}

function setGame(g: Game) {
  game = g;
  hint = null;
  hintPanel.hidden = true;
  buildBoard();
  render();
  saveGame();
}

function saveGame() {
  if (!game) return;
  save('current2', game.save());
  save('lastPlayed', new Date().toISOString());
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
  const m = game.mode;
  $('game-title').textContent = m.kind === 'level' ? `Level ${m.index + 1}` : `Vrij spel #${m.seed}`;
  const world = m.kind === 'level' ? `${WORLDS[Math.floor(m.index / LEVELS_PER_WORLD)].name} · ` : '';
  $('game-sub').textContent = `${world}${n}×${n} · ${TECH_NAMES[game.tech] ?? ''}`;
}

function render() {
  if (!game) return;
  const g = game;
  const auto = settings.autoCross ? g.autoCrosses() : new Set<number>();
  const conflicts = g.conflicts();
  const wrong = new Set(g.wrongCats());
  const regionsWithCat = new Set(g.cats().filter((i) => g.isSolution(i)).map((i) => g.region(i)));
  const focus = hint ? new Set(hint.focusCells) : null;
  const targets = hint && hint.stage >= 2 ? new Set(hint.targetCells) : null;
  g.marks.forEach((m, i) => {
    const el = cells[i];
    const state = m === CAT ? 'cat' : m === CROSS ? 'cross' : auto.has(i) ? 'auto' : 'empty';
    if (el.dataset.state !== state) {
      el.dataset.state = state;
      el.innerHTML = state === 'cat' ? calico() : state === 'empty' ? '' : '<span class="x"></span>';
    }
    el.classList.toggle('conflict', conflicts.has(i) || wrong.has(i));
    el.classList.toggle('wrong', wrong.has(i));
    el.classList.toggle('given', g.given.has(i));
    el.classList.toggle('flash', flash.has(i));
    el.classList.toggle('dim', !!focus && !focus.has(i));
    el.classList.toggle('target', !!targets?.has(i));
  });
  [...trackerEl.children].forEach((t, k) => {
    const found = regionsWithCat.has(k);
    if (t.classList.contains('found') !== found) {
      t.classList.toggle('found', found);
      t.innerHTML = found ? calico() : '';
    }
  });
  boardEl.classList.toggle('solved', g.solved);
  $('score').textContent = String(g.score());
  $<HTMLButtonElement>('btn-undo').disabled = !g.canUndo();
  $<HTMLButtonElement>('btn-redo').disabled = !g.canRedo();
  for (const id of ['btn-check', 'btn-hint', 'btn-help']) $<HTMLButtonElement>(id).disabled = g.solved;
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
    // From an empty cell we paint crosses, from a cross we erase them.
    down.mode = down.startMark === EMPTY ? 'paint' : down.startMark === CROSS ? 'erase' : null;
    if (!down.mode) return;
    down.dragging = true;
    game.checkpoint();
    closeHint();
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
    const result = game.cycle(down.i);
    closeHint();
    flash.clear();
    if (result === 'newWrong') {
      toast(`Deze kat staat fout. −${Math.round(game.base() * COST.wrongCat)} punten`, 'bad');
    } else if (result === 'wrong') {
      toast('Deze kat staat fout.', 'bad');
    }
    render();
  }
  down = null;
  saveGame();
  if (game.solved) celebrate();
}

boardEl.addEventListener('pointerup', endPointer);
boardEl.addEventListener('pointercancel', () => { down = null; render(); });

// ---------- Hints: Waar? → Waarom? → Doe maar ----------

interface HintState {
  /** 1 = "where" shown, 2 = "why" shown */
  stage: 1 | 2;
  step: Step | null;
  /** Fix-up hints (a wrong cat, or a cross where a cat belongs). */
  fix: number[] | null;
  focusCells: number[];
  targetCells: number[];
  whyText: string;
}
let hint: HintState | null = null;

function charge(fraction: number) {
  if (!game || game.solved) return;
  game.hintCost = Math.round((game.hintCost + fraction) * 100) / 100;
}

function closeHint() {
  hint = null;
  hintPanel.hidden = true;
  if (game) render();
}

function showHintPanel(text: string, canWhy: boolean, doLabel: string) {
  $('hint-text').textContent = text;
  $('hint-why').hidden = !canWhy;
  $('hint-do').innerHTML = doLabel;
  hintPanel.hidden = false;
}

$('btn-hint').addEventListener('click', () => {
  if (!game || game.solved) return;
  const g = game;
  const wrongCats = g.wrongCats();
  if (wrongCats.length) {
    hint = { stage: 2, step: null, fix: wrongCats, focusCells: wrongCats, targetCells: wrongCats, whyText: '' };
    showHintPanel(
      wrongCats.length === 1 ? 'De rode kat staat op een foute plek. Haal hem eerst weg.' : 'De rode katten staan op een foute plek. Haal ze eerst weg.',
      false, 'Haal weg',
    );
    render();
    return;
  }
  const wrongX = g.wrongCrosses();
  if (wrongX.length) {
    charge(COST.where);
    hint = { stage: 2, step: null, fix: wrongX, focusCells: wrongX, targetCells: wrongX, whyText: '' };
    showHintPanel('Hier staat een kruisje op een plek waar wél een kat hoort. Daardoor klopt de rest niet meer.', false, 'Haal weg');
    render();
    saveGame();
    return;
  }
  const step = g.nextStep(settings.autoCross);
  if (!step) { toast('Geen hint gevonden. Probeer Kat plaatsen.'); return; }
  charge(COST.where);
  const focusCells = [...new Set(step.focus.flatMap((u) => u.cells))];
  const targetCells = step.place >= 0 ? [step.place] : step.cross;
  const names = step.focus.map((u) => g.solver.unitName(u));
  const where = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} en ${names[names.length - 1]}`;
  hint = { stage: 1, step, fix: null, focusCells, targetCells, whyText: step.text };
  showHintPanel(`Kijk eens goed naar ${where}.`, true, `Doe maar <em>−${COST.doIt * 100}%</em>`);
  render();
  saveGame();
});

$('hint-why').addEventListener('click', () => {
  if (!hint || !game) return;
  if (hint.stage < 2) charge(COST.why);
  hint.stage = 2;
  showHintPanel(hint.whyText, false, `Doe maar <em>−${COST.doIt * 100}%</em>`);
  render();
  saveGame();
});

$('hint-do').addEventListener('click', () => {
  if (!hint || !game) return;
  const g = game;
  if (hint.fix) {
    g.checkpoint();
    for (const i of hint.fix) g.marks[i] = EMPTY;
  } else if (hint.step) {
    charge(COST.doIt);
    g.applyStep(hint.step);
    flash = new Set(hint.targetCells);
    setTimeout(() => { flash.clear(); render(); }, 1200);
  }
  closeHint();
  saveGame();
  if (g.solved) celebrate();
});

$('hint-close').addEventListener('click', closeHint);

// ---------- Buttons ----------

$('btn-undo').addEventListener('click', () => { closeHint(); game?.undo(); render(); saveGame(); });
$('btn-redo').addEventListener('click', () => { closeHint(); game?.redo(); render(); saveGame(); });

$('btn-check').addEventListener('click', () => {
  if (!game) return;
  const wrongX = game.wrongCrosses();
  const wrongCats = game.wrongCats();
  flash = new Set([...wrongX, ...wrongCats]);
  render();
  if (wrongX.length) toast(wrongX.length === 1 ? 'Eén kruisje staat op de plek van een kat.' : `${wrongX.length} kruisjes staan op de plek van een kat.`);
  else if (wrongCats.length) toast('Haal de rode kat weg, die staat fout.');
  else toast('Alles wat je hebt gezet klopt. Ga zo door!');
  setTimeout(() => { flash.clear(); render(); }, 2400);
});

$('btn-help').addEventListener('click', () => {
  if (!game) return;
  closeHint();
  const i = game.placeHelpCat();
  if (i < 0) return;
  toast(`Kat geplaatst. −${Math.round(game.base() * COST.cat)} punten`);
  flash = new Set([i]);
  render();
  saveGame();
  setTimeout(() => { flash.clear(); render(); }, 1200);
  if (game.solved) celebrate();
});

$('btn-home').addEventListener('click', () => { closeHint(); saveGame(); show('home'); });

// ---------- Solved ----------

function nextAfter(index: number): number {
  const i = index + 1;
  if (!pack || i >= pack.length) return -1;
  return worldOpen(LEVEL_SIZE, Math.floor(i / LEVELS_PER_WORLD)) ? i : -1;
}

function celebrate() {
  if (!game) return;
  const g = game;
  closeHint();
  const before = titleFor(totalPoints()).index;
  const score = g.score();
  const stars = g.stars();
  let label: string;
  let extra = '';
  if (g.mode.kind === 'level') {
    const key = levelKey(g.n, g.mode.index);
    const prev = progress.levels[key];
    if (prev && score > prev.best) extra = ` Nieuw record (was ${prev.best}).`;
    else if (prev) extra = ` Je record blijft ${prev.best}.`;
    progress.levels[key] = { best: Math.max(prev?.best ?? 0, score), stars: Math.max(prev?.stars ?? 0, stars) };
    label = levelLabel(g.mode.index);
  } else {
    progress.freePoints += score;
    progress.freeSolved++;
    label = `Vrij spel #${g.mode.seed}`;
  }
  const rank = addTopScore({ score, label: `${label} (${g.n}×${g.n})`, stars, date: new Date().toISOString().slice(0, 10) });
  saveProgress();
  void syncDrive(false).catch(() => {}); // quietly, only if Drive was used in the last hour
  const after = titleFor(totalPoints());
  const parts = [`+${score} van de ${basePoints(g.n, g.tech)} punten.${extra}`];
  if (rank === 0 && progress.top.length > 1) parts.push('Je beste score ooit!');
  else if (rank > 0 && rank < 10) parts.push(`Nummer ${rank + 1} in je beste scores.`);
  if (after.index > before) parts.push(`Je bent nu ${after.title.name}! 🎉`);
  $('win-text').textContent = parts.join(' ');
  $('win-stars').innerHTML = starsHtml(stars);
  const nextIsLevel = g.mode.kind === 'level' && nextAfter(g.mode.index) >= 0;
  $('win-next').textContent = g.mode.kind === 'free' ? 'Nieuwe puzzel' : nextIsLevel ? 'Volgende level' : 'Naar levels';
  setTimeout(() => $<HTMLDialogElement>('dlg-win').showModal(), 700);
}

const winDlg = $<HTMLDialogElement>('dlg-win');
winDlg.querySelector('.win-cat')!.innerHTML = calico();
winDlg.addEventListener('close', () => {
  if (winDlg.returnValue !== 'next' || !game) return;
  if (game.mode.kind === 'free') void startFree();
  else {
    const i = nextAfter(game.mode.index);
    if (i >= 0) startLevel(i);
    else show('home');
  }
});

// ---------- Dialogs ----------

document.querySelectorAll<HTMLElement>('[data-open]').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.open === 'dlg-scores') renderScores();
    $<HTMLDialogElement>(b.dataset.open!).showModal();
  }),
);

function renderScores() {
  $('score-list').innerHTML = progress.top.length
    ? progress.top.map((e) => `<li><strong>${e.score}</strong><span class="what">${e.label}</span><span class="stars">${starsHtml(e.stars)}</span></li>`).join('')
    : '<li class="empty">Nog geen scores. Los je eerste puzzel op!</li>';
}

const autoEl = $<HTMLInputElement>('set-auto');
const sizeEl = $<HTMLSelectElement>('set-size');
const settingsDlg = $<HTMLDialogElement>('dlg-settings');
document.querySelectorAll('.btn-settings').forEach((b) =>
  b.addEventListener('click', () => {
    autoEl.checked = settings.autoCross;
    sizeEl.value = String(settings.size);
    renderBackup();
    settingsDlg.showModal();
  }),
);
autoEl.addEventListener('change', () => { settings.autoCross = autoEl.checked; saveSettings(); render(); });
sizeEl.addEventListener('change', () => {
  settings.size = Number(sizeEl.value);
  saveSettings();
  renderHome();
});

// ---------- Back-up ----------

function renderBackup() {
  const row = $('drive-row');
  row.hidden = !driveAvailable();
  const when = lastSync();
  $('drive-status').textContent = !driveLinked()
    ? 'Bewaar je voortgang in je eigen Google Drive en zet hem over naar een ander apparaat.'
    : when ? `Gekoppeld. Laatst gesynchroniseerd: ${new Date(when).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}.` : 'Gekoppeld.';
  $('btn-drive').textContent = driveLinked() ? 'Nu synchroniseren' : 'Koppel Google Drive';
  $('btn-drive-unlink').hidden = !driveLinked();
}

function afterRestore(changedCurrent: boolean) {
  renderHome();
  if (changedCurrent) {
    // The unfinished puzzle came from the other device: reload to open it.
    toast('Bijgewerkt, ook met de puzzel waar je op je andere apparaat mee bezig was.');
    setTimeout(() => location.reload(), 1200);
  }
}

$('btn-drive').addEventListener('click', async () => {
  const b = $<HTMLButtonElement>('btn-drive');
  b.disabled = true;
  b.textContent = 'Bezig…';
  saveGame();
  try {
    const changed = await syncDrive(true);
    toast('Gesynchroniseerd met Google Drive ✓');
    afterRestore(changed);
  } catch (e) {
    toast((e as Error).message, 'bad');
  }
  b.disabled = false;
  renderBackup();
});
$('btn-drive-unlink').addEventListener('click', () => { unlinkDrive(); renderBackup(); });
$('btn-export').addEventListener('click', () => { saveGame(); void exportFile(); });
const importEl = $<HTMLInputElement>('import-file');
$('btn-import').addEventListener('click', () => importEl.click());
importEl.addEventListener('change', async () => {
  const f = importEl.files?.[0];
  importEl.value = '';
  if (!f) return;
  try {
    const b = await readFile(f);
    const changed = applyBackup(b, true);
    toast('Back-up teruggezet ✓');
    afterRestore(changed);
  } catch (e) {
    toast((e as Error).message || 'Dit bestand kon niet gelezen worden.', 'bad');
  }
});
// Keep Drive up to date when she leaves the app (only if signed in within the last hour).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hasToken()) { saveGame(); void syncDrive(false).catch(() => {}); }
});

/** After an update: show what's new once. Returns true for a brand-new player. */
function showNews(): boolean {
  const seen = load<string | null>('seenVersion', null);
  const isNewPlayer = !seen && !load('current', null) && !load('current2', null);
  save('seenVersion', APP_VERSION);
  if (seen === APP_VERSION || isNewPlayer) return isNewPlayer;
  const entry = CHANGELOG.find((c) => c.version === APP_VERSION);
  if (!entry) return false;
  $('news-title').textContent = `Nieuw in versie ${entry.version}`;
  $('news-list').innerHTML = entry.items.map((i) => `<li>${i}</li>`).join('');
  const dlg = $<HTMLDialogElement>('dlg-news');
  dlg.querySelector('.win-cat')!.innerHTML = calico();
  dlg.showModal();
  return false;
}

watchForUpdates(() => { $('update-banner').hidden = false; });
$('btn-update').addEventListener('click', () => {
  saveGame();
  void applyUpdate();
});

// ---------- Start ----------

document.querySelector('.ico-cat')!.innerHTML = calico();
document.querySelector('.player-cat')!.innerHTML = calico();
$('version').textContent = `Versie ${APP_VERSION} · open source (MIT) · zonder reclame`;

async function init() {
  pack = await loadPack(LEVEL_SIZE);
  const saved = load<SavedGame | null>('current2', null);
  if (saved?.v === 2 && saved.puzzle?.regions?.length === saved.puzzle.n) {
    game = new Game(saved.puzzle, saved.mode as Mode, saved.tech, saved);
    buildBoard();
    render();
  }
  show('home');
  if (showNews()) $<HTMLDialogElement>('dlg-rules').showModal();
}
void init();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
