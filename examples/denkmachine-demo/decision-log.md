# decision log – Denkmachine

## 2026-05-15 – keuze voor local-first aanpak

### beslissing
Alles wordt opgeslagen als markdown- en JSON-bestanden in een eigen projectmap. Geen database, geen cloudopslag, geen SaaS-login.

### waarom
Eigenaarschap van projectdata, portabiliteit tussen tools (editor, AI-chat, git), en geen vendor lock-in. Past bij de doelgroep van mensen die hun context al verspreid hebben staan.

### impact
Geen backend nodig voor v1. Wel beperkte browser-filesystemtoegang — daarom wordt v1 als lokale Next-app gedraaid met een geconfigureerd rootpad.

### nog te herzien?
Nee — dit is het fundament. Een latere cloud-/teamversie kan hier bovenop, niet in plaats van.

## 2026-05-10 – mockup-tool keuze

### beslissing
Figma in plaats van Sketch voor alle mockups en design-iteraties.

### waarom
Het team werkt al in Figma, geen migratie nodig, plugin-ecosysteem is sterker.

### impact
Geen.

### nog te herzien?
Nee.
