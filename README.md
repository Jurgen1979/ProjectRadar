# Projectradar

Local-first projectdashboard op gewone markdown- en JSON-bestanden. Geen database, geen login, geen cloud — je projectdata blijft in een map die jij beheert.

Status: **v0.1 — Fase 0** (basisproject, layout, configuratie, helpers). Parsing, dashboard, updates en AI volgen in latere fasen.

## Snelstart

```bash
npm install
cp .env.local.example .env.local
# zet PROJECTRADAR_ROOT naar een (lege) map waarin je /projects gaat zetten
npm run dev
```

Open <http://localhost:3000>. Zonder `PROJECTRADAR_ROOT` toont de app een gele banner. Dat is normaal in Fase 0.

## Scripts

- `npm run dev` — Next.js dev-server (Turbopack)
- `npm run build` — productie-build
- `npm run start` — productie-start
- `npm run typecheck` — `tsc --noEmit`

## Configuratie

Twee plekken, beide optioneel:

1. **`.env.local`** — runtime-configuratie:
   - `PROJECTRADAR_ROOT` — absoluut pad naar je projectroot
   - `AI_PROVIDER` — `openrouter` / `openai` / `none`
   - `AI_MODEL` — modelnaam (zie hieronder)
   - `OPENROUTER_API_KEY` of `OPENAI_API_KEY` afhankelijk van provider
2. **`projectradar.config.json`** in de projectroot — defaults voor o.a. `staleDays`, `reviewWindowDays`. Env-waarden overrulen dit bestand.

Als beide ontbreken draait de app met defaults, zonder AI.

### AI providers

| Provider | Aanbevolen voor | Env-vars |
|---|---|---|
| `openrouter` | flexibel tussen modellen wisselen (Claude, GPT, Gemini, lokaal, …) | `OPENROUTER_API_KEY`, optioneel `OPENROUTER_REFERER` + `OPENROUTER_TITLE` voor je OpenRouter-dashboard |
| `openai` | rechtstreeks OpenAI-modellen | `OPENAI_API_KEY` |

Beide providers gebruiken intern de OpenAI-compatible API (OpenRouter via `https://openrouter.ai/api/v1`). Wisselen is een `.env.local`-aanpassing. AI is volledig opt-in: zonder key blijft de app werken, de AI-features verschijnen dan met een uitleg waarom ze uit staan.

## Mappenstructuur (huidig)

```
src/
  app/
    layout.tsx              # header + navigatie + config-banner
    page.tsx                # redirect → /projects
    projects/               # dashboard (placeholder)
    inbox/                  # ultraminimale update-inbox (placeholder)
    review/                 # heuristische review (placeholder)
    templates/              # statische prompts (placeholder)
    settings/               # read-only weergave actieve config
  components/
    nav.tsx
    config-banner.tsx
    placeholder.tsx
  lib/
    config.ts               # env + config-bestand laden + AI-status
    utils.ts                # cn() helper
    fs/
      paths.ts              # slug-veiligheid, path-traversal-bescherming
      atomic-write.ts       # temp + rename
    schema/
      enums.ts              # status, waitingOn, riskLevel, priority
      config.ts             # Zod schema projectradar.config.json
      meta.ts               # Zod schema project.meta.json
```

De projectdata zelf (de mappen met `project.meta.json` etc.) leeft **buiten** deze repo, op de plek waar `PROJECTRADAR_ROOT` naar wijst.
