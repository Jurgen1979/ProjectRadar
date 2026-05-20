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


