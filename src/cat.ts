/** Hand-made cat faces in different coats. All drawn here, no outside artwork. */

export interface Coat {
  id: string;
  name: string;
  /** Head colour */
  base: string;
  /** Outline / dark details */
  ink: string;
  /** Iris colour */
  eye: string;
  /** Inner ear */
  ear: string;
  /** Markings drawn on top of the head (clipped to the head shape) */
  marks: (id: string) => string;
  crown?: boolean;
}

const HEAD = 'M14 40 L16 8 L38 24 Q50 20 62 24 L84 8 L86 40 Q92 58 84 72 Q72 92 50 92 Q28 92 16 72 Q8 58 14 40 Z';

export const COATS: Coat[] = [
  {
    id: 'lapjes', name: 'Lapjeskat', base: '#fffaf3', ink: '#3a2f2a', eye: '#3a2f2a', ear: '#f4a9b4',
    marks: () => `
      <path d="M0 0 H50 Q44 22 46 34 Q34 42 22 54 Q10 56 0 52 Z" fill="#2e2a2b"/>
      <path d="M100 0 H58 Q62 14 74 22 Q86 36 100 34 Z" fill="#e8843c"/>
      <path d="M70 70 Q84 62 100 70 V100 H74 Q66 84 70 70 Z" fill="#e8843c"/>`,
  },
  {
    id: 'rood', name: 'Rode kater', base: '#f3a35c', ink: '#5a321a', eye: '#4d7a2a', ear: '#f7c3a8',
    marks: () => `
      <path d="M44 22 L46 36 M50 20 L50 36 M56 22 L54 36" stroke="#d27a2c" stroke-width="4" stroke-linecap="round"/>
      <path d="M8 50 L22 52 M8 60 L20 60 M92 50 L78 52 M92 60 L80 60" stroke="#d27a2c" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="50" cy="74" rx="17" ry="13" fill="#fff4e6"/>`,
  },
  {
    id: 'cypers', name: 'Cyperse kat', base: '#a99682', ink: '#3b2f27', eye: '#5c8a3a', ear: '#e7b9a6',
    marks: () => `
      <path d="M38 22 Q42 32 44 38 M50 20 L50 38 M62 22 Q58 32 56 38" stroke="#5e4d3e" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M6 46 Q16 48 24 52 M6 58 L22 60 M94 46 Q84 48 76 52 M94 58 L78 60" stroke="#5e4d3e" stroke-width="4" stroke-linecap="round" fill="none"/>
      <ellipse cx="50" cy="74" rx="15" ry="12" fill="#e9dccb"/>`,
  },
  {
    id: 'zwartwit', name: 'Zwart-witte kat', base: '#2e2a2b', ink: '#141112', eye: '#8fb83a', ear: '#b46a76',
    marks: () => `
      <path d="M50 30 Q42 46 30 62 Q30 90 50 92 Q70 90 70 62 Q58 46 50 30 Z" fill="#fffaf3"/>`,
  },
  {
    id: 'siamees', name: 'Siamees', base: '#f4e6d2', ink: '#4a3328', eye: '#3f8fd6', ear: '#6b4a3a',
    marks: () => `
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#6b4a3a" opacity=".85"/>
      <path d="M14 40 L16 8 L38 24 Z M86 40 L84 8 L62 24 Z" fill="#6b4a3a"/>`,
  },
  {
    id: 'grijs', name: 'Grijze kat', base: '#9ca6b2', ink: '#2f3640', eye: '#e39b2d', ear: '#d9a7b0',
    marks: () => `
      <ellipse cx="50" cy="74" rx="16" ry="12" fill="#b9c1cb"/>`,
  },
  {
    id: 'koningin', name: 'Kattenkoningin', base: '#fffaf3', ink: '#3a2f2a', eye: '#3a2f2a', ear: '#f4a9b4', crown: true,
    marks: () => `
      <path d="M0 0 H50 Q44 22 46 34 Q34 42 22 54 Q10 56 0 52 Z" fill="#2e2a2b"/>
      <path d="M100 0 H58 Q62 14 74 22 Q86 36 100 34 Z" fill="#e8843c"/>
      <path d="M70 70 Q84 62 100 70 V100 H74 Q66 84 70 70 Z" fill="#e8843c"/>`,
  },
];

export const coatById = (id: string) => COATS.find((c) => c.id === id) ?? COATS[0];

let uid = 0;
let current = COATS[0];

export function setCoat(id: string) {
  current = coatById(id);
}

/** Cat face markup. Fresh ids each call (clip-path ids must be unique per SVG). */
export function catSvg(coat: Coat = current): string {
  const id = `kk-${uid++}`;
  const eyeWhite = coat.base === '#2e2a2b' ? '#fff' : '#fff';
  const crown = coat.crown
    ? `<path d="M30 14 L34 -2 L42 8 L50 -6 L58 8 L66 -2 L70 14 Q50 20 30 14 Z" fill="#f6c443" stroke="#b07d12" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="50" cy="6" r="2.6" fill="#e0475b"/>`
    : '';
  return `
<svg viewBox="0 -8 100 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="cat-svg">
  <defs><clipPath id="${id}"><path d="${HEAD}"/></clipPath></defs>
  <g class="kk-body">
    <path d="${HEAD}" fill="${coat.base}"/>
    <g clip-path="url(#${id})">${coat.marks(id)}</g>
    <path d="${HEAD}" fill="none" stroke="${coat.ink}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M21 17 L33 26 L22 30 Z" fill="${coat.ear}"/>
    <path d="M79 17 L67 26 L78 30 Z" fill="${coat.ear}"/>
    <g class="kk-eyes">
      <ellipse cx="35" cy="52" rx="7.5" ry="9" fill="${eyeWhite}" stroke="${coat.ink}" stroke-width="1.5"/>
      <ellipse cx="65" cy="52" rx="7.5" ry="9" fill="${eyeWhite}" stroke="${coat.ink}" stroke-width="1.5"/>
      <ellipse cx="36" cy="53" rx="5" ry="7" fill="${coat.eye}"/>
      <ellipse cx="64" cy="53" rx="5" ry="7" fill="${coat.eye}"/>
      <ellipse cx="36" cy="53" rx="2.4" ry="5" fill="#1d1715"/>
      <ellipse cx="64" cy="53" rx="2.4" ry="5" fill="#1d1715"/>
      <circle cx="37.8" cy="49.5" r="1.8" fill="#fff"/>
      <circle cx="65.8" cy="49.5" r="1.8" fill="#fff"/>
    </g>
    <path d="M46 64 Q50 62 54 64 Q50 69 46 64 Z" fill="#f08a9a"/>
    <path d="M50 67 Q50 72 44 73 M50 67 Q50 72 56 73" fill="none" stroke="${coat.ink}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M10 60 L28 63 M10 68 L28 67 M90 60 L72 63 M90 68 L72 67" stroke="${coat.ink === '#141112' ? '#d8d2cc' : coat.ink}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    ${crown}
  </g>
</svg>`;
}

/** Old name, kept so the rest of the code reads naturally. */
export const calico = () => catSvg();
