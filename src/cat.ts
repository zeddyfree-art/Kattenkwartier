/** Hand-made calico (lapjeskat) face: white with black and red-orange patches. */
let uid = 0;

/** Returns fresh markup each call (clip-path ids must be unique per SVG). */
export function calico(): string {
  const id = `kk-head-${uid++}`;
  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <clipPath id="${id}"><path d="M14 40 L16 8 L38 24 Q50 20 62 24 L84 8 L86 40 Q92 58 84 72 Q72 92 50 92 Q28 92 16 72 Q8 58 14 40 Z"/></clipPath>
  </defs>
  <path d="M14 40 L16 8 L38 24 Q50 20 62 24 L84 8 L86 40 Q92 58 84 72 Q72 92 50 92 Q28 92 16 72 Q8 58 14 40 Z" fill="#fffaf3" stroke="#3a2f2a" stroke-width="3.5" stroke-linejoin="round"/>
  <g clip-path="url(#${id})">
    <path d="M0 0 H50 Q44 22 46 34 Q34 42 22 54 Q10 56 0 52 Z" fill="#2e2a2b"/>
    <path d="M100 0 H58 Q62 14 74 22 Q86 36 100 34 Z" fill="#e8843c"/>
    <path d="M70 70 Q84 62 100 70 V100 H74 Q66 84 70 70 Z" fill="#e8843c"/>
  </g>
  <path d="M14 40 L16 8 L38 24 Q50 20 62 24 L84 8 L86 40 Q92 58 84 72 Q72 92 50 92 Q28 92 16 72 Q8 58 14 40 Z" fill="none" stroke="#3a2f2a" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M21 17 L33 26 L22 30 Z" fill="#f4a9b4"/>
  <path d="M79 17 L67 26 L78 30 Z" fill="#f4a9b4"/>
  <g class="kk-eyes">
    <ellipse cx="35" cy="52" rx="7.5" ry="9" fill="#fff"/>
    <ellipse cx="65" cy="52" rx="7.5" ry="9" fill="#fff" stroke="#3a2f2a" stroke-width="1.5"/>
    <ellipse cx="36" cy="53" rx="4.5" ry="6.5" fill="#3a2f2a"/>
    <ellipse cx="64" cy="53" rx="4.5" ry="6.5" fill="#3a2f2a"/>
    <circle cx="37.5" cy="50" r="1.8" fill="#fff"/>
    <circle cx="65.5" cy="50" r="1.8" fill="#fff"/>
  </g>
  <path d="M46 64 Q50 62 54 64 Q50 69 46 64 Z" fill="#f08a9a"/>
  <path d="M50 67 Q50 72 44 73 M50 67 Q50 72 56 73" fill="none" stroke="#3a2f2a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M10 60 L28 63 M10 68 L28 67 M90 60 L72 63 M90 68 L72 67" stroke="#3a2f2a" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
</svg>`;
}
