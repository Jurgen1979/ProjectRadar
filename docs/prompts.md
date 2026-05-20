# Prompts

Alle prompts uit Projectradar staan ook in de app op `/templates` met een **Kopieer**-knop. Deze pagina is de read-only versie voor offline referentie.

## Einde-van-chat updateprompt

Plak dit op het einde van een ChatGPT/Claude/Gemini/Codex-sessie zodat je een gestructureerde projectupdate krijgt. De output kun je direct in Projectradar plakken (Inbox of Update toevoegen).

```text
Maak een Projectradar-update voor dit project.

Schrijf geen lange samenvatting van het hele gesprek. Haal alleen de bruikbare projectinformatie eruit.

Gebruik exact deze structuur:

## datum
[vandaag]

## bron
[ChatGPT / Claude / Gemini / Codex / Replit / eigen notitie]

## korte context
Waar ging deze sessie over?

## beslissingen
Welke keuzes zijn gemaakt?

## argumentatie
Waarom zijn die keuzes gemaakt?

## open vragen
Wat is nog niet beslist?

## volgende acties
Wat moet er concreet gebeuren?

## risico's of aandachtspunten
Wat kan fout lopen of verwarren?

## belangrijke outputs
Welke teksten, bestanden, prompts, links of richtingen zijn belangrijk?

## dashboardzin
Eén zin die de huidige stand van dit project samenvat.
```

## Wekelijkse reviewprompt

Voor wanneer je handmatig een review wilt vragen (in plaats van de ingebouwde knop in `/review`).

```text
Maak een projectreview over alle actieve projecten.

Doel: toon waar aandacht nodig is, niet gewoon een lijst van alles.

Let vooral op:
- projecten zonder duidelijke volgende actie
- projecten die wachten op mij
- projecten die wachten op klant
- projecten met hoog risico
- projecten die lang niet geüpdatet zijn
- projecten met tegenstrijdige of vage status
- projecten met veel activiteit maar weinig beslissing

Gebruik deze structuur:

# projectreview

## eerst aandacht geven aan

## wacht op mij

## wacht op klant

## onduidelijk of rommelig

## risico's

## mogelijk archiveren of pauzeren

## voorstel voor deze week
```

## Interne prompts (info)

De app gebruikt deze prompts intern bij **Status genereren**. Je hoeft ze niet zelf te gebruiken; ze staan hier voor transparantie en voor wie de prompts wil tunen.

### AI-statusgenerator — system prompt

```text
Je bent Projectradar, een kritische projectstatus-assistent.

Je taak is niet om alles samen te vatten. Je taak is om uit projectbestanden de actuele stand van een project te halen.

Regels:
- Wees kort, concreet en scanbaar.
- Verzin niets.
- Als informatie ontbreekt, zeg dat expliciet.
- Als bronnen elkaar tegenspreken, benoem het.
- Maak onderscheid tussen beslissing, open vraag en actie.
- Behandel oudere informatie als minder betrouwbaar dan recente updates, tenzij duidelijk anders vermeld.
- Schrijf in het Nederlands, tenzij projectinstellingen anders aangeven.
- Geen corporate taal.
- Geen overdreven lange uitleg.
- Output moet bruikbaar zijn in een dashboard.
```

### AI-statusgenerator — user prompt

`[project.meta.json]`, `[project-status.md]`, etc. worden runtime ingevuld.

```text
Maak een nieuwe projectstatus op basis van onderstaande projectcontext.

Gebruik exact deze markdownstructuur:

# projectstatus – [projectnaam]

## korte status

## dashboardzin

## huidige fase

## laatste belangrijke beslissing

## volgende actie

## wacht op

## open vragen

## risico's / aandachtspunten

## belangrijke context

## laatst bijgewerkt

Projectmetadata:
[project.meta.json]

Bestaande status:
[project-status.md]

Projectlog:
[project-log.md]

Decision log:
[decision-log.md]

Recente updates:
[laatste updatefiles]
```
