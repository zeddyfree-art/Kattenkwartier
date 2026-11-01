import type { LevelData } from './levels';

const packs = import.meta.glob<LevelData[]>('./levels/*.json', { import: 'default' });

/** Loads the level pack for a board size (lazy, so only the chosen size is downloaded). */
export async function loadPack(n: number): Promise<LevelData[] | null> {
  const load = packs[`./levels/${n}.json`];
  return load ? load() : null;
}
