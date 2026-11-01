/** Everything that is saved on the device. */

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

export const settings: Settings = { autoCross: true, size: 10, coat: 'lapjes', palette: 'pastel', sound: false, ...load<Partial<Settings>>('settings', {}) };
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

/** Player titles, unlocked by total points. */
export const TITLES = [
  { name: 'Kitten', min: 0 },
  { name: 'Speelse kitten', min: 500 },
  { name: 'Huiskat', min: 1500 },
  { name: 'Vensterbankkat', min: 3500 },
  { name: 'Straatkat', min: 7000 },
  { name: 'Tuinkoningin', min: 12000 },
  { name: 'Kattenkoningin', min: 20000 },
];

export function titleFor(points: number) {
  let k = 0;
  while (k + 1 < TITLES.length && points >= TITLES[k + 1].min) k++;
  return { index: k, title: TITLES[k], next: TITLES[k + 1] ?? null };
}

/** What each title unlocks. Everything without an entry is available from the start. */
export const UNLOCKS: { title: number; kind: 'coat' | 'palette'; id: string }[] = [
  { title: 1, kind: 'coat', id: 'rood' },
  { title: 2, kind: 'coat', id: 'cypers' },
  { title: 2, kind: 'palette', id: 'herfst' },
  { title: 3, kind: 'coat', id: 'zwartwit' },
  { title: 4, kind: 'coat', id: 'siamees' },
  { title: 4, kind: 'palette', id: 'oceaan' },
  { title: 5, kind: 'coat', id: 'grijs' },
  { title: 6, kind: 'coat', id: 'koningin' },
];

/** The title needed for an item (0 = from the start). */
export function unlockTitle(kind: 'coat' | 'palette', id: string): number {
  return UNLOCKS.find((u) => u.kind === kind && u.id === id)?.title ?? 0;
}

export function isUnlocked(kind: 'coat' | 'palette', id: string, points = totalPoints()): boolean {
  return titleFor(points).index >= unlockTitle(kind, id);
}
