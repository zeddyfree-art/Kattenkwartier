/**
 * Hand-made animal faces: cats in different coats, and red pandas.
 * All drawn here as SVG, no outside artwork.
 */
import { t } from './theme';

/** One picture the player can choose (a cat coat or a red panda look). */
export interface Look {
  id: string;
  name: string;
  /** SVG body; `uid` keeps clip-path ids unique on the page. */
  draw: (uid: string) => string;
}

// ---------- Cats ----------

interface CatCoat {
  id: string;
  name: string;
  base: string;
  ink: string;
  eye: string;
  ear: string;
  marks: string;
  crown?: boolean;
}

const HEAD = 'M14 40 L16 8 L38 24 Q50 20 62 24 L84 8 L86 40 Q92 58 84 72 Q72 92 50 92 Q28 92 16 72 Q8 58 14 40 Z';

const CROWN = `<path d="M30 14 L34 -2 L42 8 L50 -6 L58 8 L66 -2 L70 14 Q50 20 30 14 Z" fill="#f6c443" stroke="#b07d12" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="50" cy="6" r="2.6" fill="#e0475b"/>`;

const CALICO_MARKS = `
  <path d="M0 0 H50 Q44 22 46 34 Q34 42 22 54 Q10 56 0 52 Z" fill="#2e2a2b"/>
  <path d="M100 0 H58 Q62 14 74 22 Q86 36 100 34 Z" fill="#e8843c"/>
  <path d="M70 70 Q84 62 100 70 V100 H74 Q66 84 70 70 Z" fill="#e8843c"/>`;

const CAT_COATS: CatCoat[] = [
  { id: 'lapjes', name: 'Lapjeskat', base: '#fffaf3', ink: '#3a2f2a', eye: '#3a2f2a', ear: '#f4a9b4', marks: CALICO_MARKS },
  {
    id: 'rood', name: 'Rode kater', base: '#f3a35c', ink: '#5a321a', eye: '#4d7a2a', ear: '#f7c3a8',
    marks: `
      <path d="M44 22 L46 36 M50 20 L50 36 M56 22 L54 36" stroke="#d27a2c" stroke-width="4" stroke-linecap="round"/>
      <path d="M8 50 L22 52 M8 60 L20 60 M92 50 L78 52 M92 60 L80 60" stroke="#d27a2c" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="50" cy="74" rx="17" ry="13" fill="#fff4e6"/>`,
  },
  {
    id: 'cypers', name: 'Cyperse kat', base: '#a99682', ink: '#3b2f27', eye: '#5c8a3a', ear: '#e7b9a6',
    marks: `
      <path d="M38 22 Q42 32 44 38 M50 20 L50 38 M62 22 Q58 32 56 38" stroke="#5e4d3e" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M6 46 Q16 48 24 52 M6 58 L22 60 M94 46 Q84 48 76 52 M94 58 L78 60" stroke="#5e4d3e" stroke-width="4" stroke-linecap="round" fill="none"/>
      <ellipse cx="50" cy="74" rx="15" ry="12" fill="#e9dccb"/>`,
  },
  {
    id: 'zwartwit', name: 'Zwart-witte kat', base: '#2e2a2b', ink: '#141112', eye: '#8fb83a', ear: '#b46a76',
    marks: `<path d="M50 30 Q42 46 30 62 Q30 90 50 92 Q70 90 70 62 Q58 46 50 30 Z" fill="#fffaf3"/>`,
  },
  {
    id: 'siamees', name: 'Siamees', base: '#f4e6d2', ink: '#4a3328', eye: '#3f8fd6', ear: '#6b4a3a',
    marks: `
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#6b4a3a" opacity=".85"/>
      <path d="M14 40 L16 8 L38 24 Z M86 40 L84 8 L62 24 Z" fill="#6b4a3a"/>`,
  },
  {
    id: 'grijs', name: 'Grijze kat', base: '#9ca6b2', ink: '#2f3640', eye: '#e39b2d', ear: '#d9a7b0',
    marks: `<ellipse cx="50" cy="74" rx="16" ry="12" fill="#b9c1cb"/>`,
  },
  { id: 'koningin', name: 'Kattenkoningin', base: '#fffaf3', ink: '#3a2f2a', eye: '#3a2f2a', ear: '#f4a9b4', marks: CALICO_MARKS, crown: true },
];

function drawCat(c: CatCoat, id: string): string {
  const whisker = c.ink === '#141112' ? '#d8d2cc' : c.ink;
  return `
  <defs><clipPath id="${id}"><path d="${HEAD}"/></clipPath></defs>
  <path d="${HEAD}" fill="${c.base}"/>
  <g clip-path="url(#${id})">${c.marks}</g>
  <path d="${HEAD}" fill="none" stroke="${c.ink}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M21 17 L33 26 L22 30 Z" fill="${c.ear}"/>
  <path d="M79 17 L67 26 L78 30 Z" fill="${c.ear}"/>
  <g class="kk-eyes">
    <ellipse cx="35" cy="52" rx="7.5" ry="9" fill="#fff" stroke="${c.ink}" stroke-width="1.5"/>
    <ellipse cx="65" cy="52" rx="7.5" ry="9" fill="#fff" stroke="${c.ink}" stroke-width="1.5"/>
    <ellipse cx="36" cy="53" rx="5" ry="7" fill="${c.eye}"/>
    <ellipse cx="64" cy="53" rx="5" ry="7" fill="${c.eye}"/>
    <ellipse cx="36" cy="53" rx="2.4" ry="5" fill="#1d1715"/>
    <ellipse cx="64" cy="53" rx="2.4" ry="5" fill="#1d1715"/>
    <circle cx="37.8" cy="49.5" r="1.8" fill="#fff"/>
    <circle cx="65.8" cy="49.5" r="1.8" fill="#fff"/>
  </g>
  <path d="M46 64 Q50 62 54 64 Q50 69 46 64 Z" fill="#f08a9a"/>
  <path d="M50 67 Q50 72 44 73 M50 67 Q50 72 56 73" fill="none" stroke="${c.ink}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M10 60 L28 63 M10 68 L28 67 M90 60 L72 63 M90 68 L72 67" stroke="${whisker}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
  ${c.crown ? CROWN : ''}`;
}

// ---------- Red pandas ----------

interface PandaLook {
  id: string;
  name: string;
  /** Rusty fur */
  base: string;
  /** Darker fur: tear marks, inner ears */
  dark: string;
  /** Light markings (muzzle, brows, ear rims) */
  light: string;
  extra?: 'bamboo' | 'flower' | 'crown' | 'scarf';
}

const PANDA_HEAD = 'M8 54 Q6 28 30 22 Q50 16 70 22 Q94 28 92 54 Q92 80 70 89 Q50 96 30 89 Q8 80 8 54 Z';

const PANDA_LOOKS: PandaLook[] = [
  { id: 'rodepanda', name: 'Rode panda', base: '#c95a2b', dark: '#6e2a14', light: '#fff6ea' },
  { id: 'gember', name: 'Gemberpanda', base: '#e0864a', dark: '#8a3f1c', light: '#fff8ee' },
  { id: 'bamboe', name: 'Bamboepanda', base: '#c95a2b', dark: '#6e2a14', light: '#fff6ea', extra: 'bamboo' },
  { id: 'donker', name: 'Donkere panda', base: '#8f3b1d', dark: '#3f170a', light: '#f6e7d6' },
  { id: 'bloem', name: 'Bloemenpanda', base: '#d06a35', dark: '#702c14', light: '#fff6ea', extra: 'flower' },
  { id: 'sneeuw', name: 'Sneeuwpanda', base: '#e7b98c', dark: '#9a5a32', light: '#ffffff', extra: 'scarf' },
  { id: 'pandakoningin', name: 'Pandakoningin', base: '#c95a2b', dark: '#6e2a14', light: '#fff6ea', extra: 'crown' },
];

function drawPanda(p: PandaLook, id: string): string {
  const ink = '#2b1810';
  const extra =
    p.extra === 'crown' ? CROWN.replace(/M30 14/, 'M30 18').replace(/Q50 20 30 14/, 'Q50 24 30 18')
    : p.extra === 'bamboo' ? `<path d="M74 2 Q78 14 74 30" stroke="#5c9a3c" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M75 12 Q88 4 94 10 Q86 16 75 14 Z" fill="#7cc35a"/><path d="M74 20 Q62 12 56 18 Q64 24 74 22 Z" fill="#7cc35a"/>`
    : p.extra === 'flower' ? `<g transform="translate(78 22)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="5" ry="8" cy="-7" fill="#f7a8c4" transform="rotate(${a})"/>`).join('')}<circle r="4.5" fill="#f6c443"/></g>`
    : p.extra === 'scarf' ? `<path d="M22 84 Q50 100 78 84 L80 94 Q50 108 20 94 Z" fill="#4f8fd6"/><path d="M64 92 L70 106 L78 104 L72 90 Z" fill="#3a74b8"/>`
    : '';
  return `
  <defs><clipPath id="${id}"><path d="${PANDA_HEAD}"/></clipPath></defs>
  <!-- ears -->
  <path d="M10 34 Q6 8 30 12 Q34 24 28 32 Z" fill="${p.light}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M15 30 Q13 16 27 17 Q28 25 24 30 Z" fill="${p.dark}"/>
  <path d="M90 34 Q94 8 70 12 Q66 24 72 32 Z" fill="${p.light}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M85 30 Q87 16 73 17 Q72 25 76 30 Z" fill="${p.dark}"/>
  <path d="${PANDA_HEAD}" fill="${p.base}"/>
  <g clip-path="url(#${id})">
    <ellipse cx="50" cy="76" rx="24" ry="17" fill="${p.light}"/>
    <ellipse cx="14" cy="66" rx="12" ry="9" fill="${p.light}"/>
    <ellipse cx="86" cy="66" rx="12" ry="9" fill="${p.light}"/>
    <path d="M30 56 Q24 70 30 84 L38 82 Q34 70 38 58 Z" fill="${p.dark}"/>
    <path d="M70 56 Q76 70 70 84 L62 82 Q66 70 62 58 Z" fill="${p.dark}"/>
  </g>
  <ellipse cx="34" cy="40" rx="7" ry="4.5" fill="${p.light}"/>
  <ellipse cx="66" cy="40" rx="7" ry="4.5" fill="${p.light}"/>
  <path d="${PANDA_HEAD}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
  <g class="kk-eyes">
    <ellipse cx="35" cy="53" rx="6.5" ry="7.5" fill="${ink}"/>
    <ellipse cx="65" cy="53" rx="6.5" ry="7.5" fill="${ink}"/>
    <circle cx="37.5" cy="50" r="2.3" fill="#fff"/>
    <circle cx="67.5" cy="50" r="2.3" fill="#fff"/>
  </g>
  <path d="M44 66 Q50 62 56 66 Q54 71 50 72 Q46 71 44 66 Z" fill="${ink}"/>
  <path d="M50 72 Q50 77 45 78 M50 72 Q50 77 55 78" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
  ${extra}`;
}

// ---------- Public ----------

export const COATS: Look[] = CAT_COATS.map((c) => ({ id: c.id, name: c.name, draw: (id) => drawCat(c, id) }));
export const PANDAS: Look[] = PANDA_LOOKS.map((p) => ({ id: p.id, name: p.name, draw: (id) => drawPanda(p, id) }));

/** The looks for the active theme (cats or red pandas). Index = unlock slot. */
export const activeLooks = (): Look[] => (t().id === 'pandas' ? PANDAS : COATS);

let uid = 0;
let currentCat = COATS[0];
let currentPanda = PANDAS[0];

export function setCoat(catId: string, pandaId: string) {
  currentCat = COATS.find((c) => c.id === catId) ?? COATS[0];
  currentPanda = PANDAS.find((p) => p.id === pandaId) ?? PANDAS[0];
}

/** Animal face markup for the given look (default: the chosen one in the active theme). */
export function catSvg(look?: Look): string {
  const l = look ?? (t().id === 'pandas' ? currentPanda : currentCat);
  return `<svg viewBox="0 -8 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="cat-svg">${l.draw(`kk-${uid++}`)}</svg>`;
}

export const calico = () => catSvg();
