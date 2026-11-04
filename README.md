# 🐱 Kattenkwartier

Een open-source, reclamevrije kattenlogica-puzzel voor iPad en telefoon.

**Regels:** zet op een gekleurd n×n-bord precies één kat in elke rij, elke kolom en elk kleurgebied. Katten mogen elkaar niet raken, ook niet diagonaal.

- Geen reclame, geen account, geen tracking
- 10×10-borden die steeds moeilijker worden (groter kan via de instellingen)
- Onbeperkt hints en katten laten plaatsen (kost wel punten)
- Levels, sterren, kattentitels en high scores (geen klok, solospel)
- Web-app (PWA): zet hem op je beginscherm en speel offline

Het volledige plan staat in [`docs/VOORSTEL.md`](docs/VOORSTEL.md).

**Status:** versie 0.3:
- 200 levels (10×10) in 10 werelden die steeds moeilijker worden. Een groter bord (tot 14×14) kun je kiezen voor Vrij spel.
- Een logische oplosser die de moeilijkheid bepaalt en hints in stapjes geeft (Waar? → Waarom? → Doe maar).
- De Kattenschool: zeven korte lessen die elk trucje uitleggen en laten oefenen.
- Score, sterren, high scores en kattentitels.
- Back-up als bestand of via Google Drive (zie [`docs/GOOGLE-DRIVE.md`](docs/GOOGLE-DRIVE.md)).
- Een melding zodra er een update is.

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
- `src/school.ts`, `src/schoolUi.ts`, `src/levels/lessons.json`: de Kattenschool, één les per techniek (`scripts/make-lessons.ts` maakt de lespuzzels)
- `src/levels.ts`, `src/levels/10.json`: de werelden en de vooraf gemaakte levels (`scripts/make-pool.ts` en daarna `scripts/make-levels.ts`)
- `src/backup.ts`, `src/drive.ts`: back-up als bestand en synchronisatie met Google Drive
- `src/update.ts`: updatemelding en "wat is nieuw"
- `src/game.ts`: speltoestand, score, auto-kruisjes, foute katten, ongedaan maken
- `src/store.ts`: voortgang, high scores en kattentitels (lokaal op het apparaat)
- `src/main.ts`: interface en bediening
- `src/cat.ts`: de lapjeskat (SVG)

## Licentie

[MIT](LICENSE)
