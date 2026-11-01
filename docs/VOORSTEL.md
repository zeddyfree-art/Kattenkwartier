# Kattenkwartier — projectbrief

*Een open-source, reclamevrije kattenpuzzel in de geest van Meowdoku. Gemaakt voor één speler: een ervaren sudokuspeler op iPad (en soms telefoon).*

---

## 1. Wat is Meowdoku eigenlijk?

Meowdoku (Oakever Games, iOS/Android) is geen echte sudoku maar een variant van de **Queens-puzzel** (ook bekend als *Star Battle* met één ster per rij) met katten:

1. Elke **rij** heeft precies één kat.
2. Elke **kolom** heeft precies één kat.
3. Elk **gekleurd gebied** heeft precies één kat.
4. Katten mogen elkaar **niet raken**: niet naast elkaar en ook niet diagonaal.

Een n×n-bord heeft dus n gebieden en n katten; de rest van het bord blijft leeg. Elke puzzel heeft één oplossing die je zonder gokken kunt vinden. Spelers zetten kruisjes (X) in vakjes die niet kunnen en plaatsen katten waar het moet.

**Wat er mis is met het origineel:** heel veel reclame (na bijna elk level), een hartjessysteem (3 levens; een kat op een foute plek kost een hartje, alle drie kwijt = opnieuw beginnen), beperkte hints/katten-hulpjes die je met reclame moet 'verdienen', en kleine borden in het begin. Precies dat lossen we op.

Kattenkwartier is een **eigen spel in hetzelfde puzzelgenre**: eigen naam, eigen tekeningen, eigen levels uit onze eigen generator. We nemen niets over van Meowdoku zelf (geen plaatjes, geen levels, geen merk).

**Naam:** *Kattenkwartier* — elke kat zoekt z'n eigen kwartier. (Alternatieven: *Spinsel*, *Poezenplek*, *Miauwlogica*.)

---

## 2. Doelen

- Geen reclame, geen account, geen tracking. Open source (MIT).
- Mooi en rustig: zachte kleuren, lieve katten, prettig op een iPad.
- Moeilijk genoeg voor een goede sudokuspeler: **10×10** als vaste maat, steeds lastiger door diepere logica. Grotere borden (11×11 t/m 14×14) zijn een optie in de instellingen.
- Levelen en high scores, zodat er iets te verdienen valt.
- **Onbeperkt hints en katten laten plaatsen** — maar dat kost punten.
- Makkelijk te delen en bij te werken zonder App Store.

---

## 3. Spelbesturing (iPad-eerst)

| Actie | Gebaar |
|---|---|
| Kruisje zetten | Tik op leeg vakje |
| Kat plaatsen | Dubbeltik (of tik op een vakje met X) |
| Leegmaken | Tik op een kat |
| Veel kruisjes snel | Vinger over het bord slepen |
| Ongedaan maken / opnieuw | Knoppen onderaan, onbeperkt |

Extra hulpjes (instelbaar, standaard aan):
- **Auto-kruisjes:** na het plaatsen van een kat worden rij, kolom, gebied en buurvakjes vanzelf gekruist (zoals in het origineel). Uitzetbaar voor puristen.
- **Conflictmarkering:** twee katten die botsen kleuren rood. Geen hartjes, geen game-over.
- Grote vakjes, ook op 14×14 nog goed te tikken op een iPad; op de telefoon kan je in- en uitzoomen.

---

## 4. Levels en moeilijkheid

Ze is al goed, dus geen 5×5-tutorial. Een korte uitleg van één scherm, daarna meteen 10×10.

**Bordgrootte:** standaard en in alle levels **10×10** (haar keuze). In de instellingen staat een schuifje *Bordgrootte* (10–14); daarmee worden nieuwe puzzels groter. Voortgang en high scores worden per maat bijgehouden.

**Moeilijkheid komt uit logische diepgang:** de oplosser in de app weet welke redeneringen nodig zijn, en geeft elke puzzel een moeilijkheidsscore.

| Technieken (oplopend) | Voorbeeld |
|---|---|
| Enkelvoudig | Gebied heeft nog maar één vrij vakje |
| Lijn-vergrendeling | Gebied ligt helemaal in één rij → rest van de rij valt af |
| Buren-uitsluiting | Elk vakje van een gebied raakt cel X → X valt af |
| Groepen (n gebieden in n rijen) | Drie gebieden passen in drie rijen → andere gebieden mogen daar niet |
| Ketens / "wat als" | Diep vooruitkijken (alleen in de zwaarste levels) |

**Opbouw:** werelden van 20 levels, allemaal 10×10. Binnen een wereld loopt de logica op; elke nieuwe wereld voegt een techniek toe (zie tabel). Zo voelt het als vooruitgang zonder plotselinge muur.

```
Wereld 1  levels 1–20     enkelvoudig + lijn-vergrendeling
Wereld 2  levels 21–40    + buren-uitsluiting
Wereld 3  levels 41–60    + groepen van 2
Wereld 4  levels 61–80    + groepen van 3 en meer
Wereld 5  levels 81–100   + ketens / "wat als" (zwaar)
Daarna:   Eindeloos: willekeurig gegenereerd, kies moeilijkheid
Plus:     Dagpuzzel: elke dag één nieuwe puzzel
```

Staat de bordgrootte in de instellingen hoger dan 10, dan genereert de app de levels in die maat met dezelfde moeilijkheidsopbouw.

**Generator:** puzzels worden vooraf gemaakt met een vaste seed, gecontroleerd op precies één oplossing en ingedeeld op moeilijkheid. Levels staan als klein JSON-bestand in de app; nieuwe werelden toevoegen = één bestand erbij.

---

## 5. Score, hints en levelen

**Punten per puzzel:**

```
Basispunten     = bordgrootte² × moeilijkheidsfactor
Hint            = −10% van de basispunten per hint
Kat laten zetten= −25% van de basispunten per kat
Foutcontrole    = gratis
Minimum         = altijd minstens 10% (opgelost is opgelost)
```

**Hints zijn onbeperkt en lopen in stapjes op**, zodat ze zelf kan kiezen hoeveel hulp ze wil:
1. *Waar?* — een rij/gebied licht op waar iets valt af te leiden (goedkoop).
2. *Waarom?* — korte uitleg in gewone taal ("Paars past alleen in rij 4 en 5…").
3. *Doe maar* — de kruisjes worden gezet.
4. *Kat plaatsen* — één juiste kat (duurste).

**Sterren per level:** ⭐⭐⭐ zonder hulp, ⭐⭐ met hints, ⭐ met geplaatste katten. Oude levels kun je opnieuw spelen voor betere sterren.

**Levelen (speler-niveau):** totale punten geven een kattentitel — Kitten → Huiskat → Straatkat → Kattenkoningin. Elk niveau ontgrendelt iets kleins: een nieuwe kattensoort, een kleurenpalet of een bordthema.

**Geen klok.** Er loopt geen tijd mee en snelheid telt niet mee in de score. Rustig puzzelen.

**High scores:** per level de beste score en sterren, plus totaalscore en kattentitel. Solospel: alles lokaal op het apparaat, geen online ranglijst.

---

## 6. Uiterlijk

- **Kleuren:** 15 zachte, goed te onderscheiden pasteltinten. Optie voor kleurenblind-vriendelijk palet met subtiele patronen.
- **Katten:** eigen getekende SVG-katten (geen bestaande personages). **Hoofdkat: een lapjeskat in zwart, wit en rood.** Later te ontgrendelen vachten: rood, cyperse, zwart, siamees. Ze knipperen af en toe, en bij het oplossen rekken ze zich uit en gaan ze liggen.
- **Licht- en donkermodus**, automatisch volgens het apparaat.
- **Geluid:** zachte miauw/spinnen, standaard uit, met één knop aan.

---

## 7. Delen en updaten — het voorstel

**Web-app als PWA op GitHub Pages**, net als de schaakapp.

- Code op GitHub (`zeddyfree-art/Kattenkwartier`), via GitHub Actions automatisch gepubliceerd naar `https://zeddyfree-art.github.io/Kattenkwartier/`.
- Op de iPad: link openen in Safari → Deel → **Zet op beginscherm**. Dan heeft ze een eigen icoon, start het schermvullend en werkt het **offline**.
- **Updaten:** jij pusht naar GitHub; de volgende keer dat ze de app opent met internet haalt hij de nieuwe versie op. Geen App Store, geen gedoe.
- **Voortgang** staat lokaal op het apparaat. Let op: iOS kan opslag wissen van websites die je lang niet opent; als app op het beginscherm is dat veel minder een risico. Daarom een **Back-up-knop** (exporteer/importeer een code of bestand), ook handig om voortgang van iPad naar telefoon te zetten.

---

## 8. Techniek (lean)

- **Vite + TypeScript**, geen zwaar framework; bord als SVG of CSS-grid.
- Modules: `solver` (logische oplosser + moeilijkheidsgrader), `generator` (gebieden kweken vanuit een geldige oplossing, uniciteit checken), `game` (staat, undo, score), `ui`.
- Service worker voor offline + updates; `manifest.json` met kattenicoon.
- Opslag: `localStorage`/IndexedDB.
- Tests op de oplosser: elke meegeleverde puzzel moet precies één oplossing hebben en zonder gokken oplosbaar zijn.

---

## 9. Bouwvolgorde

1. **Speelbaar prototype:** één 10×10-puzzel, tikken/dubbeltikken, auto-kruisjes, conflicten, oplossen herkennen.
2. **Generator + oplosser** met moeilijkheidsgrading; wereld 1 (20 levels) genereren.
3. **Hints (4 stappen), score, sterren, high scores.**
4. **PWA:** offline, icoon, op beginscherm zetten, back-up.
5. **Mooimaken:** katten-SVG's, animaties, paletten, geluid.
6. **Uitbreiden:** werelden 2–5, grotere borden via instellingen, eindeloze modus, dagpuzzel.

Na stap 1 kan ze al testen en meedenken.

---

## 10. Beslissingen (antwoorden van de speler)

| Vraag | Antwoord |
|---|---|
| Auto-kruisjes | Standaard **aan**, uit te zetten in de instellingen |
| Klok / tijdbonus | **Geen klok** |
| Favoriete kat | **Lapjeskat: zwart/wit/rood** |
| Samen spelen / scores vergelijken | **Nee, solospel** |
| Bordgrootte | **10×10 is genoeg**; grotere maat als optie in de instellingen |
