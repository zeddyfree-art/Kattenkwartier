/** Board colour sets. Names are used in hint texts ("Alle vrije vakjes van groen…"). */

export interface Palette {
  id: string;
  name: string;
  colors: string[];
  names: string[];
  /** Add subtle patterns so colours can be told apart without seeing colour. */
  patterns?: boolean;
}

export const PALETTES: Palette[] = [
  {
    id: 'pastel', name: 'Pastel',
    colors: ['#f2899b', '#8fd18a', '#f6c85f', '#7fb3ee', '#b993e6', '#f5a066', '#5cc8bb', '#f4b9d8', '#c9e07a', '#a3a6f2', '#dcb38d', '#9fdcf5', '#d98fb5', '#b4c39c'],
    names: ['roze', 'groen', 'geel', 'blauw', 'paars', 'oranje', 'turquoise', 'lichtroze', 'limoen', 'lavendel', 'beige', 'lichtblauw', 'oudroze', 'saliegroen'],
  },
  {
    id: 'helder', name: 'Helder',
    colors: ['#e07fae', '#8fd06f', '#3ebfb5', '#d9604f', '#8f6ad8', '#9cc4e4', '#f4a43c', '#e8bf2c', '#4271c2', '#f2b3c9', '#c4dc4e', '#a9744f', '#8b98a8', '#c85bc1'],
    names: ['roze', 'groen', 'turquoise', 'rood', 'paars', 'lichtblauw', 'oranje', 'geel', 'donkerblauw', 'lichtroze', 'limoen', 'bruin', 'grijs', 'magenta'],
  },
  {
    id: 'kleurenblind', name: 'Kleurenblind-vriendelijk', patterns: true,
    colors: ['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#d55e00', '#cc79a7', '#999999', '#f5cd7a', '#a8d8f3', '#7fd0b5', '#e8b3d0', '#8a6d3b', '#cfcfcf'],
    names: ['oranje', 'hemelsblauw', 'groen', 'geel', 'blauw', 'vermiljoen', 'roze', 'grijs', 'lichtoranje', 'lichtblauw', 'mintgroen', 'lichtroze', 'bruin', 'lichtgrijs'],
  },
  {
    id: 'herfst', name: 'Herfst',
    colors: ['#c8553d', '#f28f3b', '#e4c35a', '#588b8b', '#93b7be', '#8c6a5d', '#b5838d', '#6d597a', '#a3b18a', '#dda15e', '#bc6c25', '#7d8f4e', '#f2c4a8', '#d6c7a1'],
    names: ['roestrood', 'oranje', 'mosterd', 'blauwgroen', 'grijsblauw', 'bruin', 'oudroze', 'pruim', 'salie', 'karamel', 'koper', 'olijf', 'perzik', 'zand'],
  },
  {
    id: 'oceaan', name: 'Oceaan',
    colors: ['#48cae4', '#0096c7', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#8ecae6', '#219ebc', '#95d5b2', '#ffb4a2', '#6d6875', '#c9ada7', '#90e0ef', '#52b788'],
    names: ['turquoise', 'zeeblauw', 'zeegroen', 'zand', 'koraal', 'rood koraal', 'hemelblauw', 'petrol', 'mint', 'zalm', 'leisteen', 'schelp', 'lichtblauw', 'zeewier'],
  },
];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

/** Pattern names for the colour-blind palette (index % 7). */
export const PATTERN_NAMES = ['', 'stippen', 'strepen', 'ruitjes', 'lijnen', 'golfjes', 'blokjes'];
