# Voorbeeldproject — denkmachine-demo

De repo bevat een volledig ingevuld voorbeeldproject onder `examples/denkmachine-demo/`. Het is bedoeld als referentie: hoe ziet een gezond, gevuld Projectradar-project eruit?

## Wat zit erin

```
examples/denkmachine-demo/
├─ project.meta.json
├─ project-status.md      # ingevulde status met alle PRD-secties
├─ project-links.md       # voorbeeldlinks (werkplekken, documenten, losse links)
├─ project-log.md         # 5 chronologische entries
├─ decision-log.md        # 2 beslissingen met waarom/impact/herzien
├─ updates/               # 3 updates: chatgpt, claude en eigen notitie
├─ sources/               # README.txt legt uit waar /sources voor is
└─ exports/
   └─ example-ai-status.md  # voorbeeld van AI-gegenereerde status
```

## Hoe gebruik je het

### Optie 1 — vanuit de app

Wanneer je projectroot leeg is, toont `/projects` een knop **of: gebruik voorbeeldproject**. Klik die — de hele map wordt gekopieerd naar `<PROJECTRADAR_ROOT>/projects/denkmachine-demo/` en je belandt direct op de detailpagina.

### Optie 2 — handmatig

```bash
cp -r examples/denkmachine-demo "$PROJECTRADAR_ROOT/projects/denkmachine-demo"
```

Herstart de dev-server of refresh de pagina. Het project verschijnt op het dashboard.

## Wat kun je ermee doen

- Bekijk hoe het detailscherm eruitziet met alle PRD-secties gevuld.
- Klik **Status genereren** (als AI configured is) om te zien hoe het AI-voorstel afwijkt van de bestaande status.
- Klik **Exporteer project** om te zien hoe een volledige project-snapshot er als markdown uitziet.
- Verwijder `project-status.md` om de **Herstel ontbrekende onderdelen** flow te ervaren.
- Voeg een update toe via de header om te zien hoe `lastUpdated` automatisch mee-bumpt.

## Verschillen met een ouder project

Het voorbeeldproject is opgemaakt alsof het op `2026-05-19` actief was. Wanneer je het kopieert blijft die datum in de meta staan, en het project verschijnt mogelijk als "stilgevallen" wanneer je het na die datum opent. Dat is correct gedrag — je kunt de meta bijwerken via **Metadata bewerken** of een verse update toevoegen.
