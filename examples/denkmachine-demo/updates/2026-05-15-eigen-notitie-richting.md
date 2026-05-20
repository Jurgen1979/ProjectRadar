# projectupdate – grondslag local-first vastgelegd

## datum
2026-05-15

## bron
eigen notitie

## korte context
Eigen reflectie na een week schetsen. Cloud-route afgewogen tegen local-first. Geconcludeerd: local-first.

## beslissingen
- v1 wordt local-first, file-first
- geen DB, geen login, geen SaaS
- gebruiker behoudt eigen projectdata

## argumentatie
- vendor lock-in vermijden = vertrouwen winnen
- markdown/json is universeel
- AI-vriendelijk (modellen kunnen direct met de bestanden werken)

## open vragen
- desktop-wrapper later via Tauri?
- hoe doen we filesystem-toegang netjes in een gewone webapp?

## volgende acties
- PRD schrijven die deze keuze cementeert
- starten met Next.js + Node fs

## risico's of aandachtspunten
- filesystem-toegang in browser is beperkt — moet via lokale server

## belangrijke outputs
- gedachtenexperiment: kan ik mijn projectmap morgen openen zonder de app? -> ja, gewone tekstbestanden

## dashboardzin
Local-first principe vastgelegd, fundament gezet voor v1.
