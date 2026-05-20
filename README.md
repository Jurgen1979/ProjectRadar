# Projectradar

Local-first projectdashboard op gewone markdown- en JSON-bestanden. Geen database, geen login, geen cloud — je projectdata blijft in een map die jij beheert. AI is optioneel.

## Wat doet het

Eén scanbaar dashboard over alle projecten die je verspreid hebt over ChatGPT-gesprekken, Gmail-labels, Drive-mappen, lokale projectfolders, Replit, GitHub en losse documenten. Per project zie je status, dashboardzin, volgende actie, wacht-op, risico, leeftijd van de laatste update, signalen en links. Geheugen voor je werk, niet nog een projecttool.

## Snelstart

```bash
npm install
cp .env.local.example .env.local
# Zet PROJECTRADAR_ROOT op een (lege) map waar je /projects gaat zetten.
# Optioneel: zet AI_PROVIDER + AI_MODEL + API key.
npm run dev
```

Open <http://localhost:3000>. Klik **of: gebruik voorbeeldproject** voor een meteen gevuld dashboard.

## Features in v1

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

## Configuratie

Twee plekken, beide optioneel:

1. **`.env.local`** — runtime-configuratie:
   - `PROJECTRADAR_ROOT` — absoluut pad naar je projectroot
   - `AI_PROVIDER` — `openrouter` / `openai` / `none`
   - `AI_MODEL` — modelnaam (zie hieronder)
   - `OPENROUTER_API_KEY` of `OPENAI_API_KEY` afhankelijk van provider
2. **`projectradar.config.json`** in de projectroot — defaults voor o.a. `staleDays`, `reviewWindowDays`, `maxUpdatesForStatusGeneration`, `backupOnStatusOverwrite`. Env-waarden overrulen dit bestand.

Als beide ontbreken draait de app met defaults, zonder AI.

### AI providers

| Provider | Aanbevolen voor | Env-vars |
|---|---|---|
| `openrouter` | flexibel tussen modellen wisselen (Claude, GPT, Gemini, lokaal, …) | `OPENROUTER_API_KEY`, optioneel `OPENROUTER_REFERER` + `OPENROUTER_TITLE` voor je OpenRouter-dashboard |
| `openai` | rechtstreeks OpenAI-modellen | `OPENAI_API_KEY` |

Beide providers gebruiken intern de OpenAI-compatible API (OpenRouter via `https://openrouter.ai/api/v1`). Wisselen is een `.env.local`-aanpassing. AI is volledig opt-in: zonder key blijft de app werken, de AI-features verschijnen dan met een uitleg waarom ze uit staan.

## Docs

- [Workflow](docs/workflow.md) — dagelijkse en wekelijkse routine
- [Bestandsstructuur](docs/file-structure.md) — uitleg per file en per map
- [Prompts](docs/prompts.md) — alle copy-paste prompts en de interne AI-prompts
- [Voorbeeldproject](docs/example-project.md) — wat zit er in `denkmachine-demo`

## Scripts

- `npm run dev` — Next.js dev-server (Turbopack)
- `npm run build` — productie-build
- `npm run start` — productie-start
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — unit tests (node:test, geen browser nodig)

## Mappenstructuur van de code

```
src/
  app/             # Next.js routes (server + client components)
    projects/      # dashboard, detail, new, edit, updates, status, exports
    inbox/         # ultraminimale inbox
    review/        # heuristische + AI-review
    templates/     # prompts en file-templates met copy
    settings/      # read-only configuratie
  components/      # gedeelde UI (cards, pills, forms, recovery panel, …)
  lib/
    ai/            # provider-resolver, prompts, generate-status, generate-review
    fs/            # path-safety en atomic-write
    parse/         # markdown- en JSON-parsers
    projects/      # loaders, signals, create, add-update, recover, save-status
    schema/        # Zod-schemas (meta, config, enums)
    serialize/     # meta + file templates
    export/        # markdown builders + writer
  types/           # gedeelde types
examples/
  denkmachine-demo/  # voorbeeldproject (kopieerbaar vanuit de app)
docs/                # workflow / file-structure / prompts / example-project
tests/               # node:test op pure helpers en write-flow
```
