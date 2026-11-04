/**
 * The school: one short lesson per technique, in the order the worlds need them.
 * Each lesson explains the trick, shows it once ("Kijk mee"), and then lets the
 * player find it on two more small boards ("Nu jij").
 */
import { decodeLevel, type LevelData } from './levels';
import type { Puzzle } from './puzzle';
import { NO, Solver, TECH, UNKNOWN, YES, type Step, type Unit } from './solver';
import { t as words } from './theme';

export interface Lesson {
  /** Technique shown (solver level). */
  tech: number;
  /** Which puzzles to use (key in lessons.json). */
  pack: number;
  title: string;
  /** Worlds (0-based) where this trick is new. */
  worlds: number[];
  intro: string[];
  /** "Nu jij" prompt; {focus} becomes the units to look at. */
  ask: string;
  /** Prompt when there is no unit to point at. */
  askFree?: string;
  outro: string;
}

export const LESSONS: Lesson[] = [
  {
    tech: TECH.basic, pack: TECH.single, title: 'De spelregels', worlds: [0],
    intro: [
      'Elke <strong>rij</strong> krijgt precies één {one}, elke <strong>kolom</strong> ook, en elke <strong>kleur</strong> ook.',
      '{Many} mogen elkaar <strong>niet raken</strong>, ook niet schuin.',
      'Staat er een {one}, dan kan er niets meer in zijn rij, zijn kolom en zijn kleur, en ook niet in de acht vakjes eromheen. Die streep je weg met een kruisje.',
    ],
    ask: 'Nu jij. Tik op een vakje dat door de {one} af valt.',
    outro: 'Met <em>Auto-kruisjes</em> aan (Instellingen) gaat dit wegstrepen vanzelf. Dan kun je je helemaal op de trucjes richten.',
  },
  {
    tech: TECH.single, pack: TECH.single, title: 'Laatste plek', worlds: [0],
    intro: [
      'Heeft een rij, kolom of kleur nog maar <strong>één vrij vakje</strong>? Dan moet de {one} daar staan: elke rij, kolom en kleur krijgt er immers één.',
      'Kijk vooral naar kleine kleuren, en naar rijen en kolommen waar al veel kruisjes staan.',
    ],
    ask: 'Nu jij. Kijk naar {focus}. Tik op het vakje waar de {one} moet staan.',
    outro: 'Met deze truc begint bijna elke puzzel, en je hebt hem in elke wereld nodig.',
  },
  {
    tech: TECH.lineLock, pack: TECH.lineLock, title: 'Lijnslot', worlds: [0],
    intro: [
      'Liggen alle vrije vakjes van een kleur <strong>in één rij</strong>? Dan staat de {one} van die rij zeker in die kleur. Je weet nog niet op welk vakje, maar wel dat de rest van die rij af valt.',
      'Het werkt ook met kolommen. En andersom: liggen alle vrije vakjes van een rij in één kleur, dan valt de rest van die kleur af.',
      'Zoek naar smalle kleuren: een strookje vakjes naast of onder elkaar.',
    ],
    ask: 'Nu jij. Kijk naar {focus}. Tik op een vakje dat af valt.',
    outro: 'Laatste plek en lijnslot zijn alles wat je nodig hebt in wereld 1 ({w0}).',
  },
  {
    tech: TECH.blocker, pack: TECH.blocker, title: 'Blokkade', worlds: [1],
    intro: [
      'Soms kun je een vakje wegstrepen zonder te weten waar de {many} wél staan. Je doet dan even alsof: <strong>stel dat hier een {one} staat</strong>.',
      'Die {one} blokkeert zijn hele rij, zijn hele kolom, zijn hele kleur en de acht vakjes eromheen. Gaat daardoor een <strong>andere</strong> rij, kolom of kleur helemaal dicht, zonder één vrij vakje? Dat kan niet, want die heeft ook een {one} nodig. Dus kan er op dat vakje geen {one}.',
      'Let op: het gaat om al die blokkades <strong>samen</strong>. Sommige vakjes vallen af omdat ze ertegenaan liggen, andere omdat ze dezelfde kleur, rij of kolom hebben.',
      'Voorbeeld: een kleur heeft nog twee vrije vakjes, naast elkaar. De vakjes er direct boven en onder raken ze allebei. Een {one} daar laat die kleur zonder plek, dus daar kan geen {one}.',
      'Waar zoek je? Bij rijen, kolommen of kleuren met nog maar twee of drie vrije vakjes dicht bij elkaar. Welk vakje raakt ze allemaal tegelijk?',
    ],
    ask: 'Nu jij. Kijk naar {focus}: daar zijn nog maar weinig vakjes vrij. Welk vakje zou ze allemaal blokkeren? Tik erop.',
    outro: 'Blokkades zijn nieuw in wereld 2 ({w1}).',
  },
  {
    tech: TECH.pair, pack: TECH.pair, title: 'Tweetal', worlds: [2],
    intro: [
      'Kijk naar <strong>twee kleuren</strong> die allebei alleen nog in <strong>dezelfde twee rijen</strong> passen. Die kleuren hebben die twee rijen samen nodig: de ene kleur krijgt de ene rij, de andere kleur de andere.',
      'Dan is er in die twee rijen geen plek meer voor {many} van andere kleuren. Alle vakjes van andere kleuren in die rijen vallen af.',
      'Het werkt ook met kolommen. En andersom: als alle vrije vakjes van twee rijen in dezelfde twee kleuren liggen, vallen de andere vakjes van die kleuren af.',
      'Tip: zoek twee kleine kleuren die over dezelfde rijen of kolommen liggen.',
    ],
    ask: 'Nu jij. Kijk naar {focus}. Tik op een vakje dat af valt.',
    outro: 'Tweetallen zijn nieuw in wereld 3 ({w2}).',
  },
  {
    tech: TECH.group, pack: TECH.group, title: 'Groep', worlds: [3],
    intro: [
      'Een groep is een groot tweetal: <strong>drie (of vier) kleuren</strong> die samen maar in <strong>drie (of vier) rijen</strong> passen.',
      'Die kleuren vullen die rijen helemaal. Andere kleuren kunnen daar dus niet meer: hun vakjes in die rijen vallen af.',
      'Niet elke kleur hoeft in alle drie de rijen te liggen. Het gaat erom dat ze <strong>samen</strong> niet buiten die rijen komen.',
      'Het werkt ook met kolommen, en andersom met rijen die samen in drie kleuren vallen.',
    ],
    ask: 'Nu jij. Kijk naar {focus}. Tik op een vakje dat af valt.',
    outro: 'Groepen zijn nieuw in wereld 4 ({w3}). In wereld 5 tot en met 8 komen alle trucjes samen, in steeds langere puzzels.',
  },
  {
    tech: TECH.whatIf, pack: TECH.whatIf, title: 'Vooruitdenken', worlds: [8, 9],
    intro: [
      'Lukt geen enkele truc meer? Dan denk je kort vooruit. Kies een vakje en zeg: <strong>stel dat hier een {one} staat</strong>.',
      'Kijk wat er dan meteen moet. Vaak heeft een kleur, rij of kolom daarna nog maar één plek. Zet die {one} in gedachten neer en kijk opnieuw.',
      'Loopt het binnen twee of drie stapjes vast (een rij, kolom of kleur zonder plek, of twee {many} die elkaar raken)? Dan kan op het eerste vakje geen {one}.',
      'Loopt het niet vast? Dan weet je nog niets. Ga niet verder gokken, maar probeer een ander vakje. Begin bij krappe kleuren met twee of drie vrije vakjes.',
    ],
    ask: 'Nu jij. Denk vooruit: welk vakje laat {focus} zonder plek? Tik erop.',
    askFree: 'Nu jij. Denk vooruit vanuit een krappe kleur, rij of kolom. Op welk vakje loopt het vast? Tik erop.',
    outro: 'Vooruitdenken heb je alleen nodig in wereld 9 ({w8}, één keer per puzzel) en wereld 10 ({w9}, een paar keer).',
  },
];

/** Fill in the animal words and world names. */
export function fill(s: string): string {
  const w = words();
  return s
    .replace(/\{one\}/g, w.one).replace(/\{many\}/g, w.many)
    .replace(/\{One\}/g, w.One).replace(/\{Many\}/g, w.Many)
    .replace(/\{w(\d)\}/g, (_, k) => w.worlds[Number(k)]);
}

export interface Example {
  puzzle: Puzzle;
  solver: Solver;
  /** Board just before the step: 0 free, 1 crossed, 2 cat. */
  state: Uint8Array;
  step: Step;
}

/**
 * Play a puzzle with the easiest steps until the lesson's technique is the next one.
 * Everything easier is already done, so the example shows exactly this trick.
 */
export function findExample(d: LevelData, tech: number): Example | null {
  const puzzle = decodeLevel(d);
  const solver = new Solver(puzzle.regions);
  const state = new Uint8Array(puzzle.n * puzzle.n);
  for (let guard = 0; guard < 500 && !solver.done(state); guard++) {
    const step = solver.next(state);
    if (!step) return null;
    if (step.level === tech) return { puzzle, solver, state, step };
    if (step.place >= 0) state[step.place] = YES;
    for (const i of step.cross) state[i] = NO;
  }
  return null;
}

/** Units to point at while the player looks for the step (not giving it away). */
export function askFocus(step: Step): Unit[] {
  // Blocker: the unit that would be closed. What if: the unit that runs out of room.
  if (step.level === TECH.blocker) return step.focus.slice(0, 1);
  if (step.level === TECH.whatIf) return step.focus.length > 2 ? step.focus.slice(-1) : [];
  return step.focus;
}

/** Cells that count as the right answer. */
export function answers(step: Step): number[] {
  return step.place >= 0 ? [step.place] : step.cross;
}

/**
 * Is a tap on cell i a right answer? Returns the step to show for it. For blockers and
 * "what if" any cell the trick rules out counts, with the explanation for that cell.
 */
export function check(ex: Example, i: number): Step | null {
  if (ex.state[i] !== UNKNOWN) return null;
  if (ex.step.level === TECH.blocker) return ex.solver.blockerFor(ex.state, i);
  if (ex.step.level === TECH.whatIf) return ex.solver.whatIfFor(ex.state, i);
  if (!answers(ex.step).includes(i)) return null;
  // A tap on one cell of a bigger step: the whole step is applied.
  return ex.step;
}

/** The examples of a lesson: the first one is shown, the others are for the player. */
export function lessonExamples(l: Lesson, packs: Record<string, LevelData[]>): Example[] {
  const list = (packs[String(l.pack)] ?? []).map((d) => findExample(d, l.tech)).filter((x): x is Example => !!x);
  // Show first what is hardest to point at; the player gets the ones with a clear place to look.
  return list.sort((a, b) => (askFocus(a.step).length ? 1 : 0) - (askFocus(b.step).length ? 1 : 0));
}

/** Apply the step to the example board. */
export function applyExample(ex: Example) {
  if (ex.step.place >= 0) ex.state[ex.step.place] = YES;
  for (const i of ex.step.cross) if (ex.state[i] === UNKNOWN) ex.state[i] = NO;
}
