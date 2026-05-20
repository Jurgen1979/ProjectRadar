# Projectradar Desktop — quickstart voor gebruikers

Geen terminal, geen `npm`, geen Node, geen Git, geen `.env.local`. Download de installer, open de app, kies een map. Klaar.

## Installeren

### macOS

1. Download `Projectradar-1.1.0-*.dmg` van de release-pagina.
2. Open de DMG en sleep **Projectradar** naar `Applications`.
3. Eerste keer openen: **rechtermuisknop op Projectradar → Open** in Finder. macOS toont een waarschuwing omdat de app niet bij Apple gesigneerd is — klik **Open**. Vanaf dan opent hij gewoon met dubbelklik.

### Windows

1. Download `Projectradar_1.1.0_x64_en-US.msi` van de release-pagina.
2. Dubbelklik om te installeren.
3. SmartScreen waarschuwt bij eerste run: "Windows heeft je pc beveiligd". Klik **Meer info** → **Toch uitvoeren**.
4. Vanaf de tweede start opent de app meteen.

### Linux

Optioneel `.AppImage` of `.deb`. Geen signing-vereisten.

## Eerste opstart

1. **Welkomstscherm** verschijnt.
2. Kies één van twee opties:
   - **"Kies bestaande Projectradar-map"** — als je al een map hebt waar je projecten in wilt (of komen te staan).
   - **"Maak nieuwe Projectradar-map"** — opent de native folder picker; in de dialoog kun je een nieuwe map maken.
3. De app onthoudt je keuze. Je hoeft dit niet opnieuw te doen tenzij je een andere root wilt.

## Je eerste project

Op het dashboard staan twee knoppen:

- **+ nieuw project** — formulier in de app, vult alle standaardbestanden in.
- **of: gebruik voorbeeldproject** — kopieert het Denkmachine-demoproject naar je root zodat je meteen ziet hoe een gevuld project eruitziet.

## AI inschakelen (optioneel)

Projectradar werkt volledig zonder AI. De AI-features (status genereren, wekelijkse review) zijn aan/uit via een api-key.

1. Open **Instellingen** in de header.
2. Onder **AI**:
   - **Provider**: `openrouter` (aanbevolen) of `openai`.
   - **Model**: bv. `anthropic/claude-sonnet-4-6` (via OpenRouter) of `gpt-4o-mini` (via OpenAI).
   - **API key**: plak je sleutel. Wordt lokaal opgeslagen en als `••••••••` getoond.
   - Optioneel: **HTTP-Referer** + **X-Title** voor je OpenRouter-dashboard.
3. Klik **Opslaan**, dan **Test verbinding** voor een snelle controle.

Een OpenRouter-key haal je bij [openrouter.ai](https://openrouter.ai). Wisselen tussen Claude / GPT / Gemini / lokale modellen is daar één regel `AI_MODEL` aanpassen.

## Waar staat je data?

Op de plek die je tijdens de eerste opstart hebt gekozen. Bijvoorbeeld:

```
/Users/jij/Documents/Projectradar/
├── projects/
│   ├── denkmachine-demo/
│   ├── eigen-project/
│   └── ...
└── exports/
    ├── dashboard-2026-05-20-1430.md
    └── weekly-review-2026-05-20-1430.md
```

Alles is gewone markdown + JSON. Je kunt het:

- openen met je editor naar keuze,
- back-uppen door een kopie van de map te maken,
- syncen via Dropbox / iCloud / Drive,
- versioneren met git.

## Configuratie zit lokaal

De app onthoudt projectroot en AI-config in haar eigen app-data map:

- macOS: `~/Library/Application Support/app.projectradar.desktop/projectradar.json`
- Windows: `%APPDATA%\app.projectradar.desktop\projectradar.json`
- Linux: `~/.config/app.projectradar.desktop/projectradar.json`

Je kunt dat bestand desnoods met de hand bewerken — vorm is een gewone JSON-blob met dezelfde keys als de Instellingen UI.

## Updaten

v1.1 heeft **geen auto-updater**. Download elke nieuwe versie zelf en installeer over de bestaande heen. Je projectroot en instellingen blijven behouden (die zitten in app-data, niet in de app-bundle).

## Hulp

- README van de repo voor algemene info
- `docs/workflow.md` voor dagelijkse routine
- `docs/file-structure.md` voor uitleg van projectmappen
- `docs/prompts.md` voor AI-prompts (ook in de app onder "Templates")
- `docs/install-from-source.md` als je zelf wilt bouwen
