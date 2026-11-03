import type { Puzzle } from './puzzle';
import type { Grade } from './solver';

/** Levels are always 10×10. Worlds of 20 levels, each a step harder. (Shown names come from the theme.) */
export const LEVEL_SIZE = 10;

/**
 * Each world asks for a bit more. Worlds 1–4 add a technique; worlds 5–8 use the same
 * techniques but need more of them; only worlds 9–10 need a short "what if" (once or a
 * few times). This follows how commercial Queens-style puzzles are built: most need no
 * "what if" at all, and when they do it is a short one.
 */
export const WORLDS = [
  { name: 'Kattenmand', minTech: 1, maxTech: 2, whatIf: [0, 0], intro: 'Laatste plekjes en lijnsloten.' },
  { name: 'Vensterbank', minTech: 3, maxTech: 3, whatIf: [0, 0], intro: 'Nieuw: blokkades. Een {one} hier zou een kleur helemaal afsluiten.' },
  { name: 'Tuinmuur', minTech: 4, maxTech: 4, whatIf: [0, 0], intro: 'Nieuw: tweetallen. Twee kleuren die samen twee rijen vullen.' },
  { name: 'Dakgoot', minTech: 5, maxTech: 5, whatIf: [0, 0], intro: 'Nieuw: groepen van drie of vier kleuren.' },
  { name: 'Schoorsteen', minTech: 4, maxTech: 5, whatIf: [0, 0], intro: 'Alles door elkaar, en wat langer.' },
  { name: 'Kerktoren', minTech: 4, maxTech: 5, whatIf: [0, 0], intro: 'Meer tweetallen en groepen.' },
  { name: 'Vuurtoren', minTech: 4, maxTech: 5, whatIf: [0, 0], intro: 'Langere puzzels.' },
  { name: 'Wolkenrand', minTech: 4, maxTech: 5, whatIf: [0, 0], intro: 'De langste zonder vooruitdenken.' },
  { name: 'Sterrenhemel', minTech: 6, maxTech: 6, whatIf: [1, 1], intro: 'Nieuw: één keer kort vooruitdenken ("wat als").' },
  { name: 'Maanlicht', minTech: 6, maxTech: 6, whatIf: [2, 3], intro: 'Een paar keer kort vooruitdenken.' },
] as const;

/** Smallest colour area in a level: no free cats from the start. */
export const MIN_REGION = 2;

export const LEVELS_PER_WORLD = 20;

/** Compact level format: regions and solution as base-36 strings. */
export interface LevelData {
  /** n*n region ids, base 36 */
  r: string;
  /** solution column per row, base 36 */
  s: string;
  /** hardest technique */
  g: number;
  /** effort */
  e: number;
  /** generator seed */
  k: number;
}

export function encodeLevel(p: Puzzle, g: Grade): LevelData {
  return {
    r: p.regions.flat().map((v) => v.toString(36)).join(''),
    s: p.solution.map((v) => v.toString(36)).join(''),
    g: g.level,
    e: g.effort,
    k: p.seed,
  };
}

export function decodeLevel(d: LevelData): Puzzle {
  const n = d.s.length;
  const regions = Array.from({ length: n }, (_, r) => [...d.r.slice(r * n, r * n + n)].map((ch) => parseInt(ch, 36)));
  return { n, regions, solution: [...d.s].map((ch) => parseInt(ch, 36)), seed: d.k };
}
