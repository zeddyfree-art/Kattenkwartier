/** Everything that is saved on the device. */
import { t } from './theme';

const PREFIX = 'kk:';

export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): the game still works, it just forgets */
  }
}

export interface Settings {
  autoCross: boolean;
  size: number;
  coat: string;
  pandaCoat: string;
  theme: string;
  palette: string;
  sound: boolean;
}

export interface LevelResult {
  best: number;
  stars: number;
}

export interface ScoreEntry {
  score: number;
  label: string;
  stars: number;
  date: string;
}

export interface Progress {
  /** "n:index" → best result */
  levels: Record<string, LevelResult>;
  /** Next free-play seed per size */
  freeSeed: Record<string, number>;
  /** Points earned in free play (all of them add up). */
  freePoints: number;
  freeSolved: number;
  /** Personal top list */
  top: ScoreEntry[];
}

export const settings: Settings = { autoCross: true, size: 10, coat: 'lapjes', pandaCoat: 'rodepanda', theme: 'katten', palette: 'pastel', sound: false, ...load<Partial<Settings>>('settings', {}) };
export const progress: Progress = {
  levels: {}, freeSeed: {}, freePoints: 0, freeSolved: 0, top: [],
  ...load<Partial<Progress>>('progress2', {}),
};

export function saveSettings() { save('settings', settings); }
export function saveProgress() { save('progress2', progress); }

export function totalPoints(): number {
  return Object.values(progress.levels).reduce((s, l) => s + l.best, 0) + progress.freePoints;
}

export function addTopScore(entry: ScoreEntry): number {
  progress.top.push(entry);
  progress.top.sort((a, b) => b.score - a.score);
  progress.top = progress.top.slice(0, 20);
  return progress.top.indexOf(entry);
}

/** Player titles, unlocked by total points. Names come from the theme (cats or pandas). */
export const TITLE_POINTS = [0, 500, 1500, 3500, 7000, 12000, 20000];

export const titleName = (k: number) => t().titles[k];

export function titleFor(points: number) {
  let k = 0;
  while (k + 1 < TITLE_POINTS.length && points >= TITLE_POINTS[k + 1]) k++;
  const at = (i: number) => ({ name: titleName(i), min: TITLE_POINTS[i] });
  return { index: k, title: at(k), next: k + 1 < TITLE_POINTS.length ? at(k + 1) : null };
}

/**
 * What each title unlocks. Animal looks (cat coats or panda looks) unlock by their
 * position: look 1 with title 1, look 2 with title 2, and so on. Palettes are listed here;
 * everything else is available from the start.
 */
export const PALETTE_UNLOCKS: Record<string, number> = { herfst: 2, oceaan: 4 };

/** The title needed: for a look, its position in the list; for a palette, PALETTE_UNLOCKS. */
export function unlockTitle(kind: 'look' | 'palette', key: string | number): number {
  if (kind === 'look') return Number(key);
  return PALETTE_UNLOCKS[key as string] ?? 0;
}

export function isUnlocked(kind: 'look' | 'palette', key: string | number, points = totalPoints()): boolean {
  return titleFor(points).index >= unlockTitle(kind, key);
}
