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

