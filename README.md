# Projectradar

Local-first projectdashboard op gewone markdown- en JSON-bestanden. Geen database, geen login, geen cloud — je projectdata blijft in een map die jij beheert. AI is optioneel.

## Wat doet het

Eén scanbaar dashboard over alle projecten die je verspreid hebt over ChatGPT-gesprekken, Gmail-labels, Drive-mappen, lokale projectfolders, Replit, GitHub en losse documenten. Per project zie je status, dashboardzin, volgende actie, wacht-op, risico, leeftijd van de laatste update, signalen en links. Geheugen voor je werk, niet nog een projecttool.

## Snelstart — desktopapp (v1.1)

Geen terminal, geen Node, geen Git nodig.

1. Download de installer voor je platform van de [release-pagina](https://github.com/jurgen1979/projectradar/releases).
2. Open `Projectradar.dmg` (macOS) of `Projectradar.msi` (Windows) en installeer.
3. Start Projectradar. Bij eerste start kies je een projectmap via een native dialoog.
4. Op het lege dashboard: **+ nieuw project** of **of: gebruik voorbeeldproject**.

Volledige uitleg: [docs/desktop-quickstart.md](docs/desktop-quickstart.md).

> **v1.1 status**: Tauri DEV-mode (`npm run tauri:dev`) is volledig functioneel. De prod-installer (`npm run tauri:build`) is geblokkeerd door een Next 16-quirk met static export — zie `docs/desktop-sprint-log.md` en `docs/install-from-source.md`. CI workflow + alle code zijn klaar; refactor van dynamic-route pages naar pure client components staat op de v1.2-roadmap.

## Snelstart — developer (npm run dev)

Voor wie zelf wil bijdragen of de webversie wil draaien:

```bash
git clone https://github.com/jurgen1979/projectradar.git
cd projectradar
npm install
cp .env.local.example .env.local
# Zet PROJECTRADAR_ROOT op een (lege) map waar je /projects gaat zetten.
# Optioneel: zet AI_PROVIDER + AI_MODEL + API key voor AI features.
npm run dev
```

Open <http://localhost:3000>.

Voor Tauri-dev-mode: `npm run tauri:dev` opent de native webview tegen je dev-server.

## Features

- **Dashboard** met filters, signaal-pills (wacht-op-mij/-klant, stilgevallen, geen volgende actie, hoog risico, onduidelijk), tag-filter en zoekveld.
- **Projectdetail** met huidige status, volgende actie, gegroepeerde links, recente updates, beslissingen, log en bronnen.
- **Project aanmaken** met scaffold van alle standaardfiles.
- **Update toevoegen** vanuit het project of vanuit de **Inbox** (één pagina: plak, kies project, opslaan).
- **Metadata bewerken** via volledig formulier met Zod-validatie.
- **Herstel ontbrekende files en mappen** met preview voordat er iets geschreven wordt.
- **AI-statusgenerator** met preview, bewerkbare voorstel-zijde, en automatische backup van de oude status.
- **Review-pagina** met heuristische buckets en optionele AI-review.
- **Exports** naar markdown: dashboard, weekly review, en per project.
- **Templates-pagina** met alle prompts en file-templates voor gebruik buiten de app.
- **Welkomstscherm + native folder picker** (Tauri desktop) — geen env-vars nodig.
- **Settings UI** voor AI-config met OpenRouter/OpenAI, gemaskte key + test verbinding.

## AI providers

| Provider | Aanbevolen voor | Configuratie |
|---|---|---|
| `openrouter` | flexibel tussen modellen wisselen (Claude, GPT, Gemini, lokaal, …) | Settings → API key + bv. `OPENROUTER_REFERER` / `OPENROUTER_TITLE` voor je dashboard |
| `openai` | rechtstreeks OpenAI-modellen | Settings → API key |

Beide providers gebruiken intern de OpenAI-compatible API (OpenRouter via `https://openrouter.ai/api/v1`). Wisselen is een Settings-aanpassing. AI is volledig opt-in: zonder key blijft de app werken, de AI-features verschijnen dan met een uitleg waarom ze uit staan.

In **desktop mode** komt de configuratie uit de app-config (Tauri store). In **dev mode** uit `.env.local`.

## Configuratie (dev mode)

`.env.local` — runtime-configuratie:
- `PROJECTRADAR_ROOT` — absoluut pad naar je projectroot
- `AI_PROVIDER` — `openrouter` / `openai` / `none`
- `AI_MODEL` — modelnaam
- `OPENROUTER_API_KEY` of `OPENAI_API_KEY`

`projectradar.config.json` in de projectroot — defaults voor o.a. `staleDays`, `reviewWindowDays`, `maxUpdatesForStatusGeneration`, `backupOnStatusOverwrite`.

## Docs

**Voor gebruikers**:
- [Desktop quickstart](docs/desktop-quickstart.md) — installatie zonder terminal
- [Workflow](docs/workflow.md) — dagelijkse en wekelijkse routine
- [Voorbeeldproject](docs/example-project.md) — wat zit er in `denkmachine-demo`
- [Prompts](docs/prompts.md) — alle copy-paste prompts

**Voor bouwers**:
- [Install from source](docs/install-from-source.md) — Tauri installer zelf bouwen
- [Bestandsstructuur](docs/file-structure.md) — uitleg per file en per map
- [Desktop sprint log](docs/desktop-sprint-log.md) — wat is gebouwd in v1.1, wat blokkeert nog

## Scripts

- `npm run dev` — Next.js dev-server (Turbopack)
- `npm run build` — productie web-build
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — unit tests (node:test, 66 tests, geen browser nodig)
- `npm run tauri:dev` — Tauri desktop in dev-mode (Rust + webview)
- `npm run tauri:build` — Tauri installer voor je platform (geblokkeerd in v1.1)

## Mappenstructuur van de code

```
src/
  app/             # Next.js routes (server + client components)
    welcome/       # eerste-keer-flow (Tauri)
    projects/      # dashboard, detail, new, edit, updates, status, exports
    inbox/         # ultraminimale inbox
    review/        # heuristische + AI-review
    templates/     # prompts en file-templates met copy
    settings/      # Tauri schrijfbaar, web read-only
  components/      # gedeelde UI (cards, pills, forms, recovery panel, …)
  lib/
    ai/            # provider-resolver, prompts, generate-status, review,
                   # test-connection
    io/            # FsIO abstractie (node + tauri), paths, app-config,
                   # tauri-store, folder-picker, detect-runtime
    parse/         # markdown- en JSON-parsers
    projects/      # loaders, signals, create, add-update, recover,
                   # save-status, review
    schema/        # Zod-schemas (meta, config, enums)
    serialize/     # meta + file templates
    export/        # markdown builders + writer
    tauri-handlers/  # client-side equivalents van server actions
  types/           # gedeelde types
src-tauri/         # Tauri Rust shell (Cargo.toml, lib.rs, tauri.conf.json)
examples/
  denkmachine-demo/  # voorbeeldproject (kopieerbaar vanuit de app)
docs/                # workflow / file-structure / prompts / sprint log / quickstart
tests/               # node:test op pure helpers en write-flow
```
