import type { Puzzle } from './puzzle';
import type { Grade } from './solver';

/** Levels are always 10×10. Worlds of 20 levels, each a step harder. */
export const LEVEL_SIZE = 10;

export const WORLDS = [
  { name: 'Kattenmand', minTech: 1, maxTech: 2, intro: 'Laatste plekjes en lijnsloten.' },
  { name: 'Vensterbank', minTech: 3, maxTech: 3, intro: 'Nieuw: blokkades. Een kat hier zou een kleur helemaal afsluiten.' },
  { name: 'Tuinmuur', minTech: 4, maxTech: 4, intro: 'Nieuw: tweetallen. Twee kleuren die samen twee rijen vullen.' },
  { name: 'Dakgoot', minTech: 5, maxTech: 5, intro: 'Nieuw: groepen van drie of vier kleuren.' },
  { name: 'Schoorsteen', minTech: 6, maxTech: 6, intro: 'Nieuw: "wat als". Soms moet je een stap vooruit denken.' },
  { name: 'Kerktoren', minTech: 6, maxTech: 6, intro: 'Vaker vooruitdenken.' },
  { name: 'Vuurtoren', minTech: 6, maxTech: 6, intro: 'Langere puzzels met meerdere lastige stappen.' },
  { name: 'Wolkenrand', minTech: 6, maxTech: 6, intro: 'Voor echte puzzelaars.' },
  { name: 'Sterrenhemel', minTech: 6, maxTech: 6, intro: 'Bijna de top.' },
  { name: 'Maanlicht', minTech: 6, maxTech: 6, intro: 'De allerzwaarste puzzels.' },
] as const;

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
