/** Back-up of everything the game saves: as a file, or merged with a copy in Google Drive. */
import { load, progress, save, saveProgress, settings, type Progress, type ScoreEntry } from './store';

export interface Backup {
  app: 'kattenkwartier';
  v: 1;
  savedAt: string;
  settings: typeof settings;
  progress: Progress;
  current: unknown;
  lastPlayed: string | null;
}

export function makeBackup(): Backup {
  return {
    app: 'kattenkwartier',
    v: 1,
    savedAt: new Date().toISOString(),
    settings: { ...settings },
    progress: JSON.parse(JSON.stringify(progress)) as Progress,
    current: load('current2', null),
    lastPlayed: load<string | null>('lastPlayed', null),
  };
}

export function isBackup(x: unknown): x is Backup {
  const b = x as Backup;
  return !!b && b.app === 'kattenkwartier' && b.v === 1 && !!b.progress && typeof b.progress === 'object';
}

/** Combine two progress records without losing anything: best results win. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const levels = { ...a.levels };
  for (const [k, r] of Object.entries(b.levels ?? {})) {
    const l = levels[k];
    levels[k] = l ? { best: Math.max(l.best, r.best), stars: Math.max(l.stars, r.stars) } : r;
  }
  const freeSeed = { ...a.freeSeed };
  for (const [k, s] of Object.entries(b.freeSeed ?? {})) freeSeed[k] = Math.max(freeSeed[k] ?? 0, s);
  const key = (e: ScoreEntry) => `${e.score}|${e.label}|${e.date}`;
  const top = [...new Map([...(a.top ?? []), ...(b.top ?? [])].map((e) => [key(e), e])).values()]
    .sort((x, y) => y.score - x.score)
    .slice(0, 20);
  const daily = { ...(a.daily ?? {}) };
  for (const [k, r] of Object.entries(b.daily ?? {})) {
    const l = daily[k];
    daily[k] = l ? { best: Math.max(l.best, r.best), stars: Math.max(l.stars, r.stars) } : r;
  }
  return {
    levels,
    daily,
    freeSeed,
    freePoints: Math.max(a.freePoints ?? 0, b.freePoints ?? 0),
    freeSolved: Math.max(a.freeSolved ?? 0, b.freeSolved ?? 0),
    top,
    lessons: { ...(a.lessons ?? {}), ...(b.lessons ?? {}) },
  };
}

/**
 * Merge a back-up into this device. Progress is combined; the unfinished puzzle
 * is taken from whichever device played last. Returns true if the current puzzle changed.
 */
export function applyBackup(b: Backup, takeCurrent: boolean): boolean {
  Object.assign(progress, mergeProgress(progress, b.progress));
  saveProgress();
  const local = load<string | null>('lastPlayed', null);
  const unfinished = !!b.current && !(b.current as { solved?: boolean }).solved;
  if (takeCurrent && unfinished && b.lastPlayed && (!local || b.lastPlayed > local)) {
    save('current2', b.current);
    save('lastPlayed', b.lastPlayed);
    return true;
  }
  return false;
}

/** Save the back-up as a file (on iPad: via the share sheet, e.g. to Files). */
export async function exportFile() {
  const name = `kattenkwartier-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(makeBackup(), null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Kattenkwartier back-up' });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function readFile(file: File): Promise<Backup> {
  return file.text().then((t) => {
    const data = JSON.parse(t) as unknown;
    if (!isBackup(data)) throw new Error('Dit is geen Kattenkwartier-back-up.');
    return data;
  });
}
