# Bestandsstructuur

Projectradar is **file-first**. Alle projectdata leeft in een mappenstructuur die je zelf kunt openen met een editor, kunt versioneren met git, of kunt back-uppen door een map te kopiëren. De app voegt niets toe wat je niet in tekst kunt zien.

## Globaal

```
PROJECTRADAR_ROOT/
├─ projectradar.config.json          # optioneel — defaults voor stale-drempel etc.
├─ exports/                          # globale exports (dashboard, weekly review)
│  ├─ dashboard-2026-05-20-1430.md
│  └─ weekly-review-2026-05-20-1430.md
└─ projects/
   ├─ <slug-1>/
   ├─ <slug-2>/
   └─ ...
```

`PROJECTRADAR_ROOT` is het pad dat je in `.env.local` zet. Slugs zijn lowercase met streepjes — die regel komt later terug bij elk project.

## Per project

```
projects/<slug>/
├─ project.meta.json     # verplicht — strict gevalideerd
├─ project-status.md     # huidige status, AI-gegenereerd of handmatig
├─ project-links.md      # gegroepeerde links naar werkplekken en documenten
├─ project-log.md        # chronologisch logboek
├─ decision-log.md       # vastgelegde beslissingen
├─ updates/              # markdown-bestanden, één per update
│  └─ YYYY-MM-DD-bron-titel.md
├─ sources/              # optionele bronbestanden (pdf, png, docx, …)
└─ exports/              # per-project exports + status-backups
   ├─ project-export-YYYY-MM-DD-HHMM.md
   └─ status-backups/
      └─ YYYY-MM-DD-HHMM-project-status.md
```

### `project.meta.json`

Machineleesbare projectinformatie. Wordt aan de schrijfkant gevalideerd met Zod — onbekende velden mogen, maar bekende velden moeten kloppen.

```json
{
  "id": "denkmachine",
  "name": "Denkmachine",
  "client": "intern",
  "type": "product",
  "status": "active",
  "phase": "positionering",
  "priority": "high",
  "tags": ["ai", "product"],
  "waitingOn": "me",
  "nextAction": "Logo-richting finaliseren",
  "riskLevel": "medium",
  "lastUpdated": "2026-05-19",
  "createdAt": "2026-04-01"
}
```

Toegelaten waarden:
- `status`: `active` / `paused` / `waiting` / `done` / `archived` / `idea`
- `waitingOn`: `me` / `client` / `third-party` / `none` / `unclear`
- `riskLevel`: `none` / `low` / `medium` / `high` / `unclear`
- `priority`: `low` / `medium` / `high`

`id` is gelijk aan de slug (mapnaam), `createdAt` blijft staan, `lastUpdated` wordt automatisch gebumpt wanneer je een nieuwe update toevoegt.

### `project-status.md`

De actuele, menselijke status. Vaste sectiekoppen die de app herkent:

- `## korte status`
- `## dashboardzin`
- `## huidige fase`
- `## laatste belangrijke beslissing`
- `## volgende actie`
- `## wacht op`
- `## open vragen`
- `## risico's / aandachtspunten`
- `## belangrijke context`
- `## laatst bijgewerkt`

Onbekende secties worden bewaard en getoond — de parser is tolerant. AI-gegenereerde statussen volgen exact deze structuur.

### `project-links.md`

Drie groepen onder `## werkplekken`, `## documenten`, `## losse links`. Items kunnen:
- `- label: https://...` — label + URL
- `- [label](https://...)` — markdown-link
- `- https://...` — kale URL (label = URL)
- `- label:` — label zonder URL (placeholder)

### `project-log.md`

Chronologisch. Elke entry begint met `## YYYY-MM-DD`, gevolgd door een korte vrije notitie.

### `decision-log.md`

Per beslissing een `## YYYY-MM-DD – titel`, met vier subsecties (`### beslissing`, `### waarom`, `### impact`, `### nog te herzien?`).

### `updates/`

Eén markdownfile per update, naam `YYYY-MM-DD-bron-titel.md`. Standaard secties: `## datum`, `## bron`, `## korte context`, `## beslissingen`, `## argumentatie`, `## open vragen`, `## volgende acties`, `## risico's of aandachtspunten`, `## belangrijke outputs`, `## dashboardzin`. Bij "raw"-mode bewaar je je geplakte tekst zonder template-secties — handig als je AI al gestructureerde output heeft gegeven.

### `sources/`

Vrij — pdf, png, docx, txt, … De app toont alleen de filelijst met absoluut pad. Browsers blokkeren directe `file://`-links, dus openen doe je met je editor of bestandsbeheer.

### `exports/`

- `project-export-*.md` — snapshots van het hele project.
- `status-backups/` — automatische backups van `project-status.md` vóór elke AI-overschrijving.

## Globale exports

`<root>/exports/` bevat:

- `dashboard-*.md` — momentopnames van het projectdashboard
- `weekly-review-*.md` — momentopnames van de review (heuristisch + AI indien gegenereerd)

Filenames krijgen altijd een timestamp, dus oude exports worden nooit overschreven. Bij collisions binnen dezelfde minuut komt een `-2`, `-3`-suffix.

## Wat als je een file verwijdert?

De app blijft draaien, geeft een vriendelijke melding boven het projectdetail, en biedt een **Herstel** knop die je eerst de inhoud laat zien voordat je akkoord geeft. Niets gebeurt stilzwijgend.
