# Workflow

Projectradar is een rustige projectcontrolekamer. De dagelijkse routine bestaat uit drie dingen: dingen erin gooien, status laten samenvatten, en wekelijks reviewen.

## Eenmalige setup

1. Kopieer `.env.local.example` naar `.env.local`.
2. Zet `PROJECTRADAR_ROOT` op een lege of bestaande map ergens op je schijf.
3. Optioneel: zet `AI_PROVIDER`, `AI_MODEL` en je API key. Zie [README](../README.md#ai-providers).
4. `npm run dev` en open `http://localhost:3000`.

Op `/projects` zie je een lege ruimte met twee knoppen:
- **+ eerste project aanmaken** — start blanco.
- **of: gebruik voorbeeldproject** — kopieert `examples/denkmachine-demo/` naar je root zodat je meteen ziet hoe een gevuld project eruitziet.

## Dagelijks gebruik

### 1. AI-sessie afsluiten als update

Wanneer je een waardevolle ChatGPT/Claude/Gemini-sessie hebt:

1. Vraag de AI om de **einde-van-chat updateprompt** (zie [Templates](#templates) in de app of [docs/prompts.md](./prompts.md)).
2. Open `/inbox`, kies het project, plak de output, klik **Opslaan als update**.
3. Klaar. De update landt als `YYYY-MM-DD-bron-titel.md` in `/projects/<slug>/updates/`, en `lastUpdated` in de meta wordt automatisch gebumpt.

Werkt ook zonder AI: typ je eigen notitie in dezelfde plek.

### 2. Snel een notitie kwijt zonder context-switch

Op de projectdetailpagina zit **Update toevoegen** in de header. Datzelfde formulier, project pre-selected.

### 3. Status laten samenvatten

Wanneer je het overzicht kwijt bent:

1. Open een project, klik **Status genereren**.
2. AI leest `project-status.md`, `project-log.md`, `decision-log.md` en de laatste updates.
3. Je krijgt een **preview** naast de huidige status. De rechterkant is **bewerkbaar** — pas aan voor je goedkeurt.
4. Klik **Goedkeuren en overschrijven**. De oude versie wordt automatisch gebackupt naar `/projects/<slug>/exports/status-backups/`.

Belangrijk: AI overschrijft nooit zonder dat jij op de groene knop drukt.

### 4. Metadata aanpassen

Verandert de status, het wacht-op-veld of de prioriteit?

1. Klik **Metadata bewerken** in de header.
2. Pas het formulier aan. Slug, id en aanmaakdatum blijven onaangetast.

## Wekelijks reviewen

Open `/review`. Je krijgt direct (zonder AI) zes buckets:

- wacht op mij
- wacht op klant
- geen volgende actie
- stilgevallen
- hoog risico
- onduidelijk

Dat is meestal genoeg om te zien waar je aandacht naartoe moet. Optioneel klik je **AI-review genereren** voor een geprioriteerd voorstel deze week.

**Exporteren**:
- **Kopieer als markdown** — handig om in een dagverslag of journaal te plakken.
- **Exporteer naar /exports** — schrijft `<root>/exports/weekly-review-YYYY-MM-DD-HHMM.md`. Een tijdmachine van je reviews.

## Per project archiveren

Op de detailpagina klik je **Exporteer project** voor een volledige snapshot (meta, status, links, log, beslissingen, alle updates) in `<projectdir>/exports/project-export-YYYY-MM-DD-HHMM.md`. Handig om met iemand te delen of als snapshot voor je archief.

## Wanneer iets stuk lijkt

- **Lege map verwijderd of file weg?** De detailpagina toont een **Herstel ontbrekende onderdelen** panel met preview en knoppen. Je ziet eerst wat er geschreven gaat worden, dan beslis je.
- **`project.meta.json` corrupt?** Het project verschijnt in de "Niet geladen" sectie op het dashboard met de exacte foutmelding. Editor erin, JSON repareren, refresh.
- **AI staat uit?** `/settings` vertelt waarom (geen key, geen model, etc.). Alle niet-AI-features blijven werken.
