# Desktop sprint log — Projectradar v1.1

Pure Tauri v2 desktop-installer. Geen sidecar, geen Electron, geen nieuwe productfeatures.

## Omgeving / fundamentele beperking

Sprint draait in een Linux cloud-container met:
- Node 22.22.2 + npm 10.9.7
- Rust 1.94.1 + Cargo 1.94.1
- WebKit2GTK 4.1, GTK3, libssl-dev (Tauri Linux native deps)
- `xvfb-run` voor headless display
- Geen Xcode, geen macOS SDK, geen MSVC toolchain

**Wat dat betekent voor de installer-targets**:

| Target | Bouwbaar hier? | Strategie |
|---|---|---|
| Linux (.AppImage, .deb) | ✅ ja | Smoke-test gebruikt deze als proxy voor architectuur-validatie |
| macOS (.dmg) | ❌ nee — vereist macOS host of Apple toolchain | GitHub Actions workflow `macos-latest`, of lokaal op Mac |
| Windows (.msi/.exe) | ❌ nee — vereist Windows host of MSVC cross-toolchain | GitHub Actions workflow `windows-latest`, of lokaal op Win |

Sprint-resultaat is daarom **complete codebase + CI workflow + Linux build als bewijs**. De `.dmg` en `.msi` worden door GitHub Actions of door de gebruiker zelf op het juiste platform gebouwd. Dit wordt in Fase 6 expliciet vastgelegd in de pipeline en gedocumenteerd in `docs/install-from-source.md`.

## Per fase

### Fase 0 — Tauri shell + static export

**Status: groen.**

Gedaan:
- `@tauri-apps/cli@2`, `@tauri-apps/api@2`, `@tauri-apps/plugin-{dialog,fs,store}@2` toegevoegd.
- Tauri Linux native deps in container: `libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `libayatana-appindicator3-dev`, `libsoup-3.0-dev` (via apt).
- App-icon gegenereerd (Pillow → 1024px PNG → `npx tauri icon` voor alle platforms).
- `src-tauri/` scaffold: `Cargo.toml`, `build.rs`, `src/{main,lib}.rs`, `tauri.conf.json`, `capabilities/default.json`.
- Plugins geregistreerd: dialog, fs, store. Capabilities zijn breed (fs scope: home/document/desktop/appdata) zodat de gebruiker zelf z'n projectroot mag kiezen — Tauri's dialog garandeert de keuze.
- npm scripts: `tauri`, `tauri:dev`, `tauri:build`, plus placeholder `build:static`.

Checks:
- `cargo check` schoon (Rust + alle Tauri deps compileren, 1m23s eerste keer).
- `npm test` → 57/57 groen.
- `npm run typecheck` schoon.
- `npm run build` schoon (alle 12 routes dynamic).
- Geen `tauri dev` headless launch — vereist X-server. Wordt in Fase 4 indirect getest via static export pipeline.

Afwijking van plan:
- `beforeBuildCommand` wijst nu naar `npm run build:static` (alias voor `next build`). De echte static-export-config komt in Fase 4 als alle pages client-side draaien.

Volgende fase: IO-laag migreren naar Tauri-fs. Pure parsers/schemas/templates blijven 1-op-1.

### Fase 1 — IO-laag migreren

**Status: groen.**

Architectuur:
- Nieuwe `src/lib/io/types.ts` introduceert `FsIO` interface: read/write/stat/exists/mkdir/copyDir + sync path helpers (join/basename/dirname).
- Twee implementaties: `nodeFsIO` (node:fs/promises, voor tests + server actions + dev-mode) en `tauriFsIO` (@tauri-apps/plugin-fs, voor desktop straks).
- `tauriFsIO` wordt alléén in client-context geïmporteerd; tests blijven werken zonder Tauri.
- Nieuwe `src/lib/io/paths.ts` met browser-safe slug-validatie, path-join, dirname/basename en `resolveUnderRoot` voor traversal-bescherming. Handelt Windows-drive-letters en forward/backward slashes.
- Oude `src/lib/fs/` verwijderd — geen callsites meer.

Loaders/writers refactored om `FsIO` als eerste parameter te nemen:
- `loadProject`, `loadAllProjects`, `loadDashboardData`
- `createProject`, `addUpdate`, `updateProjectMeta`
- `recoverFile`, `recoverFolders`, `detectMissing`, `previewRecoveryContent`
- `saveStatusWithBackup`
- `seedDemoProject` (krijgt nu ook expliciet `sourceDir` zodat Tauri later z'n eigen resource-pad kan kiezen)
- `buildReviewData`
- `writeExport`
- `gatherStatusContext`
- `generateStatus`, `generateReview` krijgen ook een `AiCallConfig` parameter (provider + model + baseURL + key + headers) zodat de caller bepaalt waar die vandaan komt

`generateStatus`/`generateReview` zelf doen geen env-lookup meer. Server actions resolven via nieuwe `src/lib/server-io.ts` helper (`serverFsIO` + `resolveServerAi`). Tauri-client zal dit straks via app-config doen.

Alle server actions en pages bijgewerkt om `serverFsIO` mee te geven. Alle tests bijgewerkt om `nodeFsIO` mee te geven.

Checks:
- `npm test` → **57/57 groen** (zelfde testsuite als v1, alle paden gemigreerd).
- `npm run typecheck` schoon.
- `npm run build` schoon (alle 12 routes dynamic).
- Geen `server-only` markers meer in lib/projects/* of lib/ai/* of lib/export/* — alleen `src/lib/server-io.ts` blijft server-only.

Risico/afwijking:
- `tauri-fs.ts` import (van `@tauri-apps/plugin-fs`) zit nu in de codebase maar wordt alleen vanuit client-context (Fase 4) geïmporteerd. Build slaagt omdat geen enkel server-side bestand het importeert.

Volgende fase: app-config naar Tauri store + first-run flow zonder env-var.

### Fase 2 — Config en projectroot via app-data

**Status: groen.**

Gedaan:
- `src/lib/io/app-config.ts` — Zod-schema voor de Tauri-stored config blob, met defaults voor alle velden. Schema:
  - `projectRoot: string | null`
  - `ai: { provider, model, apiKey, openRouterReferer?, openRouterTitle?, baseUrlOverride? }`
  - `staleDays`, `reviewWindowDays`, `maxUpdatesForStatusGeneration`, `backupOnStatusOverwrite`, `defaultLanguage`
- `deriveAiStatus(config)` produceert dezelfde `AiCallConfig` shape als `resolveServerAi` — Tauri-client en server-side actions zijn aan dezelfde interface gekoppeld.
- `maskApiKey()` voor UI-display (`••••••••1234`).
- `src/lib/io/tauri-store.ts` — load/save/patch helpers rond `@tauri-apps/plugin-store`. Auto-save aan, single-blob `projectradar.json` in app data dir. Tolerant voor missing/corrupt store (valt terug op defaults).

Dev fallback:
- `getConfigStatus()` in `src/lib/config.ts` blijft ongewijzigd. Wie `npm run dev` draait gebruikt `.env.local` + env-vars.
- Tauri webview gebruikt `loadAppConfig()` + `deriveAiStatus()` — komt aan bod in Fase 3 (onboarding) en Fase 4 (page-conversion).

Checks:
- `npm test` → **66/66 groen** (9 nieuwe tests in `tests/io/app-config.test.ts`).
- `npm run typecheck` schoon.
- `npm run build` schoon.

Volgende fase: welkomstscherm + native folder picker + persistente projectroot.

### Fase 3 — First-run onboarding

**Status: groen.**

Gedaan:
- `src/lib/io/detect-runtime.ts` — `isTauriRuntime()` check via `window.__TAURI_INTERNALS__`.
- `src/lib/io/folder-picker.ts` — wrapper rond `@tauri-apps/plugin-dialog` `open({ directory: true })`. Onderscheidt "user cancelled" van een echte fout.
- `src/components/app-config-provider.tsx` — `AppConfigProvider` React-context, laadt Tauri-store lazy (dynamic import) zodat web-builds geen Tauri-bundel meekrijgen. Exposeert `useAppConfig()` met `runtime`, `config`, `loading`, `setConfig`, `patchConfig`.
- `src/components/tauri-welcome-guard.tsx` — wanneer Tauri-runtime + geen `projectRoot` → `router.replace("/welcome")`. `/welcome` en `/settings` zijn whitelisted.
- `src/components/web-only.tsx` — `WebOnly` en `TauriOnly` helpers voor UI-onderdelen die per runtime moeten differen.
- `src/app/welcome/page.tsx` — welkomstscherm met "Kies bestaande Projectradar-map" en "Maak nieuwe Projectradar-map". Beide openen de native folder picker. Na keuze: schrijft naar Tauri-store en redirect naar `/projects`.
- `src/app/layout.tsx` — wrapt alles in `AppConfigProvider` + `TauriWelcomeGuard`. Bestaande server-side `ConfigBanner` zit nu in een `WebOnly`-wrapper.

Checks:
- `npm test` → 66/66 groen (geen testbarrière voor onboarding; component-renderen vereist DOM/Tauri, zit niet in node:test scope).
- `npm run typecheck` schoon.
- `npm run build` schoon — nieuwe route `/welcome` zichtbaar in route lijst.

Beperking:
- Volledige verificatie van de Tauri-flow vereist een Tauri webview (komt in Fase 4-6 build-pipeline). In dev-web mode redirect /welcome direct naar /projects omdat we geen Tauri-runtime detecteren.

Volgende fase: pages naar client-flow, server actions vervangen door desktop-compatible async functies.

### Fase 4 — Pages/clientflow herstellen

**Status: groen.**

Strategie: dual-mode rendering via `<TauriOnly>`/`<WebOnly>`. Web-mode behoudt het bestaande server-component pad; Tauri-mode rendert client-componenten die `tauriFsIO` + app-config gebruiken.

- `src/lib/io/use-resolved-io.ts` — `useResolvedIO()` hook returneert `{ io, root, config }` voor client-pages, met loading/no-root states. `appConfigToProjectConfig()` bridge.
- `src/lib/io/use-unified-action.ts` — `useUnifiedAction(webAction, tauriHandler)` dispatcht op runtime; gebruikt door alle forms.
- `src/lib/io/resource.ts` — wrapt `resolveResource()` voor bundled examples (gebruikt door seed-demo).
- `src/lib/tauri-handlers/projects.ts` — alle Tauri-side equivalents van server actions (createProject, editMeta, addUpdate, inboxSave, recoverFile, recoverFolders, generateStatus, approveStatus, generateReview, exportDashboard, exportReview, exportProject, seedDemo).
- Resources: `examples/denkmachine-demo/**/*` toegevoegd aan `tauri.conf.json` `bundle.resources` zodat de demo meekomt in de installer.

Per page een `_tauri-*.tsx` client-component naast het bestaande server-component, beide gerenderd door de top-level page maar gefilterd via `TauriOnly`/`WebOnly`:
- `/projects` → `TauriDashboard` (loadDashboardData via tauriFsIO)
- `/projects/[slug]` → `TauriProjectDetail` (loadProject + detectMissing + previews via tauriFsIO)
- `/projects/[slug]/edit` → `TauriEdit` (loadProject voor pre-fill)
- `/projects/[slug]/updates/new` → directe form-render in Tauri-mode (form valideert zelf)
- `/projects/[slug]/status/generate` → `TauriStatusGenerate` (current status + AI config uit store)
- `/inbox` → `TauriInbox` (loadAllProjects)
- `/review` → `TauriReview` (buildReviewData)

Forms aangepast met `useUnifiedAction`:
- NewProjectForm, EditMetaForm, AddUpdateForm, InboxForm, RecoveryPanel (file + folder), SeedDemoButton, StatusGeneratorForm (gen + approve), ReviewActions (AI-review)
- ExportButton accepteert nu `webAction` + `tauriAction` props
- Forms doen client-side `router.push(/projects/<slug>)` op `redirectSlug` (Tauri kan geen server redirect)

Removed:
- `import "server-only"` uit `lib/serialize/{templates,meta}.ts` — pure code, nu vanuit zowel client als server bereikbaar via tauri-handlers.

Checks:
- `npm test` → 66/66 groen
- `npm run typecheck` schoon
- `npm run build` schoon, 13 routes (incl. /welcome)

Beperking:
- Volledige verificatie in een echte Tauri webview vereist een display (Fase 6+). Functionele logica is via tests gevalideerd; UI is via build geverifieerd.

Volgende fase: settings UI voor AI met OpenRouter/OpenAI + Test-verbinding-knop, AI-statusgenerator end-to-end met store-config.

### Fase 5 — AI settings en providerlaag

**Status: groen.**

- `src/lib/ai/test-connection.ts` — kleine completion call (temp=0, 1-word prompt) om key+model snel te valideren.
- `src/app/settings/_tauri-settings.tsx` — schrijfbare Settings UI:
  - Projectroot wijzigen via native folder picker
  - AI provider/model/key/HTTP-Referer/X-Title/baseURL override
  - Key gemaskeerd getoond (`••••••••1234`), met "toon"-toggle
  - Bewerking-detectie: alleen wanneer user iets typt dat niet met `•` begint vervangt de key — anders blijft de bestaande staan
  - "Test verbinding"-knop met latency + sample-output
  - Live status-pill bij elk model: ingeschakeld / uitleg waarom uit

Web-mode settings blijven read-only met env-info (geen wijziging in dev-flow).

AI-statusgenerator is end-to-end aangesloten op de store-config:
- `generateStatusTauri` uit Fase 4 leest config via `loadAppConfig()` + `deriveAiStatus()`
- Zelfde voor `generateReviewTauri`

Checks:
- `npm test` 66/66 groen
- `npm run typecheck` schoon
- `npm run build` schoon

Volgende fase: installer/build pipeline + GitHub Actions workflow voor Win/macOS artifacts.






