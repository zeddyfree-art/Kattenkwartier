# 🐱 Kattenkwartier

Een open-source, reclamevrije kattenlogica-puzzel voor iPad en telefoon.

**Regels:** zet op een gekleurd n×n-bord precies één kat in elke rij, elke kolom en elk kleurgebied. Katten mogen elkaar niet raken, ook niet diagonaal.

- Geen reclame, geen account, geen tracking
- 10×10-borden die steeds moeilijker worden (groter kan via de instellingen)
- Onbeperkt hints en katten laten plaatsen (kost wel punten)
- Levels, sterren, kattentitels en high scores (geen klok, solospel)
- Web-app (PWA): zet hem op je beginscherm en speel offline

Het volledige plan staat in [`docs/VOORSTEL.md`](docs/VOORSTEL.md).

**Status:** versie 0.2: 100 levels in 5 werelden per bordmaat, logische oplosser met moeilijkheidsgraad, hints in stapjes (Waar? → Waarom? → Doe maar), score, sterren, high scores, kattentitels en een melding bij updates.

## Spelen

Open `https://zeddyfree-art.github.io/Kattenkwartier/` in Safari, tik op **Deel → Zet op beginscherm**. Daarna heeft de app een eigen icoon en werkt hij ook offline.

## Ontwikkelen

```bash
npm install
npm run dev      # lokaal, ook bereikbaar vanaf iPad op hetzelfde wifi
npm test         # generator en spelregels testen
npm run build    # productieversie in dist/
```

Elke push naar `main` publiceert automatisch via GitHub Actions. Verhoog bij een update `version` in `package.json` en zet een regel in `CHANGELOG` (`src/update.ts`): open apps tonen dan een melding "Er is een nieuwe update" en daarna wat er nieuw is. Eenmalig instellen: repo **Settings → Pages → Source: GitHub Actions**.

## Code

- `src/puzzle.ts`: generator (elke puzzel heeft precies één oplossing)
- `src/solver.ts`: menselijke oplosser: vindt de makkelijkste volgende stap, legt die uit en bepaalt de moeilijkheid
- `src/levels.ts`, `src/levels/*.json`: de werelden en vooraf gemaakte levels (`npx tsx scripts/make-levels.ts 10`)
- `src/update.ts`: updatemelding en "wat is nieuw"
- `src/game.ts`: speltoestand, score, auto-kruisjes, foute katten, ongedaan maken
- `src/store.ts`: voortgang, high scores en kattentitels (lokaal op het apparaat)
- `src/main.ts`: interface en bediening
- `src/cat.ts`: de lapjeskat (SVG)

## Licentie

[MIT](LICENSE)
