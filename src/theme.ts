/** Themes: the same game with cats or with red pandas. All animal words live here. */

export interface Theme {
  id: 'katten' | 'pandas';
  label: string;
  app: string;
  /** "kat" / "panda" */
  one: string;
  /** "katten" / "panda's" */
  many: string;
  One: string;
  Many: string;
  titles: string[];
  worlds: string[];
  /** Sound description in settings */
  soundText: string;
  /** Word for the coat picker heading */
  coatWord: string;
}

export const THEMES: Theme[] = [
  {
    id: 'katten', label: 'Katten', app: 'Kattenkwartier',
    one: 'kat', many: 'katten', One: 'Kat', Many: 'Katten',
    titles: ['Kitten', 'Speelse kitten', 'Huiskat', 'Vensterbankkat', 'Straatkat', 'Tuinkoningin', 'Kattenkoningin'],
    worlds: ['Kattenmand', 'Vensterbank', 'Tuinmuur', 'Dakgoot', 'Schoorsteen', 'Kerktoren', 'Vuurtoren', 'Wolkenrand', 'Sterrenhemel', 'Maanlicht'],
    soundText: 'Zachte geluidjes bij kruisjes en katten, en een miauw als je klaar bent.',
    coatWord: 'Vacht',
  },
  {
    id: 'pandas', label: "Rode panda's", app: 'Pandakwartier',
    one: 'panda', many: "panda's", One: 'Panda', Many: "Panda's",
    titles: ['Pandababy', 'Speelse panda', 'Boompanda', 'Bamboepanda', 'Klimpanda', 'Bergpanda', 'Pandakoningin'],
    worlds: ['Bamboebos', 'Boomtak', 'Mosheuvel', 'Bergbeek', 'Nevelwoud', 'Rotswand', 'Wolkenwoud', 'Sneeuwtop', 'Sterrenberg', 'Maanlicht'],
    soundText: "Zachte geluidjes bij kruisjes en panda's, en een piepje als je klaar bent.",
    coatWord: 'Panda',
  },
];

let current: Theme = THEMES[0];

export function setTheme(id: string) {
  current = THEMES.find((x) => x.id === id) ?? THEMES[0];
}

/** The active theme's words. */
export const t = (): Theme => current;
