/** Screens of the school: the list of lessons and one lesson at a time. */
import type { LevelData } from './levels';
import { LESSONS, applyExample, askFocus, check, fill, lessonExamples, type Example, type Lesson } from './school';
import { NO, YES, type Step } from './solver';
import { sound } from './sound';
import { progress, saveProgress } from './store';
import { t as words } from './theme';

export interface SchoolDeps {
  regionStyle: (el: HTMLElement, k: number) => void;
  catHtml: () => string;
  /** Show the school screen (true) or go back home (false). */
  showScreen: (school: boolean) => void;
}

type Phase = 'intro' | 'demo' | 'ask' | 'answered' | 'done';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

let deps: SchoolDeps;
let packs: Record<string, LevelData[]> | null = null;
let lessonIdx = -1;
let examples: Example[] = [];
let exIdx = 0;
let phase: Phase = 'intro';
/** The step shown right now (the one found by the player may differ from the planned one). */
let shown: Step | null = null;
let misses = 0;
let cells: HTMLDivElement[] = [];

async function loadPacks() {
  packs ??= (await import('./levels/lessons.json')).default as unknown as Record<string, LevelData[]>;
  return packs;
}

export function initSchool(d: SchoolDeps) {
  deps = d;
  $('btn-school').addEventListener('click', () => openList());
  $('btn-school-back').addEventListener('click', () => {
    if (lessonIdx >= 0) openList();
    else deps.showScreen(false);
  });
  $('lesson-board').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.cell');
    if (el) tap(Number(el.dataset.i));
  });
}

/** "2 van 7 lessen gedaan" on the home screen. */
export function schoolStatus(): string {
  const done = LESSONS.filter((l) => progress.lessons?.[l.tech]).length;
  return done === LESSONS.length ? `Alle ${LESSONS.length} lessen gedaan ✓` : `${done} van ${LESSONS.length} lessen gedaan`;
}

/** First lesson for a world that is not done yet (or the first one for that world). */
export function lessonForWorld(w: number): number {
  const list = LESSONS.map((l, k) => ({ l, k })).filter(({ l }) => l.worlds.includes(w));
  return (list.find(({ l }) => !progress.lessons?.[l.tech]) ?? list[0])?.k ?? -1;
}

export function hasLesson(w: number): boolean {
  return LESSONS.some((l) => l.worlds.includes(w));
}

function worldsLabel(l: Lesson): string {
  return l.worlds.length > 1 ? `Wereld ${l.worlds.map((w) => w + 1).join(' en ')}` : `Wereld ${l.worlds[0] + 1}`;
}

export function openList() {
  lessonIdx = -1;
  deps.showScreen(true);
  $('school-title').textContent = words().school;
  $('school-sub').textContent = 'Leer de trucjes van elke wereld';
  $('school-list').hidden = false;
  $('lesson').hidden = true;
  $('school').classList.remove('in-lesson');
  const list = $('school-list');
  list.replaceChildren(...LESSONS.map((l, k) => {
    const b = document.createElement('button');
    const done = !!progress.lessons?.[l.tech];
    b.className = `lesson-item card ${done ? 'done' : ''}`;
    b.innerHTML = `
      <span class="lesson-num">${done ? '✓' : k + 1}</span>
      <span class="lesson-info"><strong>${l.title}</strong><small>${worldsLabel(l)} · ${l.worlds.map((w) => words().worlds[w]).join(', ')}</small></span>
      <span class="lesson-go">›</span>`;
    b.addEventListener('click', () => void openLesson(k));
    return b;
  }));
}

export async function openLesson(k: number) {
  const l = LESSONS[k];
  if (!l) return;
  lessonIdx = k;
  deps.showScreen(true);
  $('school').classList.add('in-lesson');
  $('school-list').hidden = true;
  $('lesson').hidden = false;
  $('school-title').textContent = `Les ${k + 1}: ${l.title}`;
  $('school-sub').textContent = `${words().school} · ${worldsLabel(l)}`;
  examples = lessonExamples(l, await loadPacks());
  exIdx = 0;
  phase = 'intro';
  shown = null;
  buildBoard();
  render();
}

function lesson(): Lesson {
  return LESSONS[lessonIdx];
}

function ex(): Example | undefined {
  return examples[exIdx];
}

function buildBoard() {
  const e = ex();
  const board = $('lesson-board');
  board.replaceChildren();
  cells = [];
  if (!e) return;
  const n = e.puzzle.n;
  board.style.setProperty('--n', String(n));
  for (let i = 0; i < n * n; i++) {
    const el = document.createElement('div');
    el.className = 'cell';
    el.dataset.i = String(i);
    deps.regionStyle(el, e.puzzle.regions[Math.floor(i / n)][i % n]);
    el.setAttribute('role', 'gridcell');
    board.append(el);
    cells.push(el);
  }
}

function list(names: string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} en ${names[names.length - 1]}`;
}

function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = `${cls} small`;
  b.innerHTML = label;
  b.addEventListener('click', onClick);
  return b;
}

function render() {
  const l = lesson();
  const e = ex();
  const text = $('lesson-text');
  const actions = $('lesson-actions');
  actions.replaceChildren();

  // Progress dots: intro, then one per example.
  const steps = 1 + examples.length;
  const at = phase === 'intro' ? 0 : phase === 'done' ? steps : 1 + exIdx;
  $('lesson-dots').innerHTML = Array.from({ length: steps }, (_, k) => `<i class="${k < at ? 'on' : k === at ? 'now' : ''}"></i>`).join('');

  // Board
  $('lesson-wrap').hidden = phase === 'intro' || phase === 'done' || !e;
  if (e) {
    const focusUnits = phase === 'ask' ? askFocus(e.step) : shown ? shown.focus : [];
    const focus = new Set(focusUnits.flatMap((u) => u.cells));
    const targets = new Set(shown && (phase === 'demo' || phase === 'answered') ? (shown.place >= 0 ? [shown.place] : shown.cross) : []);
    cells.forEach((el, i) => {
      const s = e.state[i] === YES ? 'cat' : e.state[i] === NO ? 'cross' : 'empty';
      if (el.dataset.state !== s) {
        el.dataset.state = s;
        el.innerHTML = s === 'cat' ? deps.catHtml() : s === 'cross' ? '<span class="x"></span>' : '';
      }
      el.classList.toggle('dim', focus.size > 0 && !focus.has(i));
      el.classList.toggle('target', targets.has(i));
    });
  }

  if (phase === 'intro') {
    text.innerHTML = l.intro.map((p) => `<p>${fill(p)}</p>`).join('');
    actions.append(button(e ? 'Laat zien →' : 'Klaar', 'primary', () => {
      if (!e) { finish(); return; }
      phase = 'demo';
      shown = e.step;
      render();
    }));
    return;
  }

  if (phase === 'done') {
    const next = lessonIdx + 1 < LESSONS.length ? LESSONS[lessonIdx + 1] : null;
    text.innerHTML = `<p class="lesson-cheer">Goed gedaan! 🎉</p><p>${fill(l.outro)}</p>`;
    actions.append(button('Alle lessen', 'secondary', () => openList()));
    if (next) actions.append(button(`Volgende les: ${next.title} →`, 'primary', () => void openLesson(lessonIdx + 1)));
    else actions.append(button('Naar de levels', 'primary', () => deps.showScreen(false)));
    return;
  }

  if (!e) return;
  const nextLabel = exIdx + 1 < examples.length ? 'Volgende voorbeeld →' : 'Klaar →';
  const goNext = () => {
    if (exIdx + 1 < examples.length) {
      exIdx++;
      phase = 'ask';
      shown = null;
      misses = 0;
      buildBoard();
      render();
    } else finish();
  };

  if (phase === 'demo') {
    text.innerHTML = `<p><strong>Kijk mee.</strong> ${shown!.text}</p>`;
    actions.append(button('Doe het', 'primary', () => {
      applyExample(e);
      phase = 'answered';
      sound.cross();
      render();
      text.innerHTML = `<p>${shown!.place >= 0 ? `Daar staat de ${words().one}.` : 'Weggestreept.'} ${examples.length > 1 ? `Nu jij!` : ''}</p>`;
    }));
    return;
  }

  if (phase === 'ask') {
    const names = askFocus(e.step).map((u) => e.solver.unitName(u));
    const prompt = names.length || !l.askFree ? l.ask.replace('{focus}', `<strong>${list(names)}</strong>`) : l.askFree;
    const extra = misses === 0 ? '' : misses === 1
      ? `<p class="lesson-miss">Dat vakje kan nog. Kijk nog eens goed.</p>`
      : `<p class="lesson-miss">Nog niet. Probeer een ander vakje, of tik op <em>Laat zien</em>.</p>`;
    text.innerHTML = `<p>${fill(prompt)}</p>${extra}`;
    actions.append(button('Laat zien', 'secondary', () => {
      shown = e.step;
      applyExample(e);
      phase = 'answered';
      render();
      text.innerHTML = `<p><strong>Zo zit het.</strong> ${e.step.text}</p>`;
      $('lesson-actions').replaceChildren(button(nextLabel, 'primary', goNext));
    }));
    return;
  }

  // answered
  actions.append(button(nextLabel, 'primary', goNext));
}

function tap(i: number) {
  const e = ex();
  if (!e || phase !== 'ask') return;
  const step = check(e, i);
  if (!step) {
    if (e.state[i] === 0) { misses++; sound.wrong(); render(); }
    return;
  }
  shown = step;
  if (step === e.step) applyExample(e);
  else for (const j of step.cross) e.state[j] = NO;
  phase = 'answered';
  if (step.place >= 0) sound.cat(); else sound.cross();
  render();
  $('lesson-text').innerHTML = `<p><strong>Goed gezien!</strong> ${step.text}</p>`;
}

function finish() {
  const l = lesson();
  progress.lessons ??= {};
  progress.lessons[l.tech] = true;
  saveProgress();
  phase = 'done';
  sound.solved();
  render();
}
