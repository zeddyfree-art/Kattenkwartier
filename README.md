# 🐱 Kattenkwartier

Een open-source, reclamevrije kattenlogica-puzzel voor iPad en telefoon.

**Regels:** zet op een gekleurd n×n-bord precies één kat in elke rij, elke kolom en elk kleurgebied. Katten mogen elkaar niet raken, ook niet diagonaal.

- Geen reclame, geen account, geen tracking
- 10×10-borden die steeds moeilijker worden (groter kan via de instellingen)
- Onbeperkt hints en katten laten plaatsen (kost wel punten)
- Levels, sterren, kattentitels en high scores (geen klok, solospel)
- Web-app (PWA): zet hem op je beginscherm en speel offline

Het volledige plan staat in [`docs/VOORSTEL.md`](docs/VOORSTEL.md).

**Status:** speelbaar prototype (stap 1 van het plan): oneindig veel 10×10-puzzels met precies één oplossing, tikken/slepen, auto-kruisjes, conflictmarkering, controleren, katten laten plaatsen, ongedaan maken en voortgang bewaren.

## Spelen

Open `https://zeddyfree-art.github.io/Kattenkwartier/` in Safari, tik op **Deel → Zet op beginscherm**. Daarna heeft de app een eigen icoon en werkt hij ook offline.

## Ontwikkelen

```bash
npm install
npm run dev      # lokaal, ook bereikbaar vanaf iPad op hetzelfde wifi
npm test         # generator en spelregels testen
npm run build    # productieversie in dist/
```

Elke push naar `main` publiceert automatisch via GitHub Actions. Eenmalig instellen: repo **Settings → Pages → Source: GitHub Actions**.

## Code

- `src/puzzle.ts`: generator en oplosser (elke puzzel heeft precies één oplossing)
- `src/game.ts`: speltoestand, auto-kruisjes, conflicten, ongedaan maken
- `src/main.ts`: interface en bediening
- `src/cat.ts`: de lapjeskat (SVG)

## Licentie

[MIT](LICENSE)
