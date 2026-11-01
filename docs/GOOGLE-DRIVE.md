# Google Drive-back-up instellen (eenmalig, ±10 minuten)

De app bewaart de back-up in een **verborgen app-map** in haar eigen Google Drive. Alleen Kattenkwartier kan die map zien. Er staat dus niets tussen haar gewone bestanden, en de app kan niet bij haar andere bestanden.

Daarvoor heeft de app een **Client ID** van Google nodig. Die maak je zo aan:

1. Ga naar <https://console.cloud.google.com/> en log in met je Google-account.
2. Maak bovenin een **nieuw project** aan, bijvoorbeeld met de naam `Kattenkwartier`.
3. Ga naar **APIs & Services → Library**, zoek **Google Drive API** en klik op **Enable**.
4. Ga naar **Google Auth Platform** (of **OAuth consent screen**):
   - App name: `Kattenkwartier`, en vul je e-mailadres in als support- en contactadres.
   - Audience / User type: **External**. Laat de app op **Testing** staan.
   - Voeg bij **Test users** het Gmail-adres van je vrouw toe, en dat van jezelf.
   - Voeg bij **Data access / Scopes** deze scope toe: `https://www.googleapis.com/auth/drive.appdata`.
5. Ga naar **Clients** (of **Credentials → Create credentials → OAuth client ID**):
   - Application type: **Web application**
   - Name: `Kattenkwartier web`
   - **Authorized JavaScript origins**: `https://zeddyfree-art.github.io`
   - Klik op **Create**.
6. Kopieer de **Client ID**. Die eindigt op `.apps.googleusercontent.com`. Stuur hem naar Claude, of zet hem zelf in `src/config.ts`.

De Client ID is niet geheim. Hij mag gewoon in de code staan. Deel het *client secret* niet; dat gebruikt de app ook niet.

## Gebruik

- In de app: **Instellingen → Back-up → Koppel Google Drive**. De eerste keer vraagt Google om toestemming.
  - Omdat de app in testmodus staat, zegt Google eerst "Google heeft deze app niet geverifieerd". Kies **Doorgaan**.
- Daarna doet **Nu synchroniseren** het volgende:
  - de voortgang uit Drive en die van dit apparaat worden samengevoegd. De beste score en de meeste sterren per level blijven bewaard.
  - het resultaat wordt in Drive opgeslagen.
- Op de telefoon doe je hetzelfde. Dan heeft ze daar dezelfde levels, sterren en scores.
- Een uur lang na het synchroniseren gaat het ook vanzelf: na elke opgeloste puzzel en wanneer ze de app verlaat. Daarna is er weer één tik op **Nu synchroniseren** nodig. Google laat een web-app niet langer ingelogd blijven zonder te vragen.

Werkt Google even niet, dan kan het ook met **Bewaar back-up** en **Zet terug**: een bestand dat ze in Bestanden, iCloud of Drive kan zetten.
