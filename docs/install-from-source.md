# Projectradar Desktop — bouwen vanaf source

Vanaf v1.1 is Projectradar een Tauri-desktopapp. Eindgebruikers downloaden in principe een installer (`.dmg` / `.msi`) vanaf een release-pagina. Dit document beschrijft hoe je die installer **zelf** bouwt — bijvoorbeeld omdat:

- je een eigen build met patches wilt,
- de gehoste installer nog niet uitgebracht is voor jouw platform,
- of je gewoon nieuwsgierig bent.

## Wat je nodig hebt

| Tool | Doel |
|---|---|
| **Node.js 22+** + **npm** | de frontend (Next.js) bouwen |
| **Rust + Cargo** (`rustup`) | de Tauri shell bouwen |
| **OS-specifieke build-tools** | zie tabel hieronder |

| OS | Vereiste tools |
|---|---|
| **macOS** | Xcode Command Line Tools (`xcode-select --install`) |
| **Windows** | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) |
| **Linux** | `libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `libayatana-appindicator3-dev`, `libsoup-3.0-dev`, `build-essential` |

## Bouwen

```bash
git clone https://github.com/jurgen1979/projectradar.git
cd projectradar
git checkout claude/projectradar-v1-analysis-uME5F

npm install
npm run tauri:build
```

De installer landt in `src-tauri/target/release/bundle/` — afhankelijk van je platform:

- macOS → `bundle/dmg/Projectradar_1.1.0_*.dmg` + `bundle/macos/Projectradar.app`
- Windows → `bundle/msi/Projectradar_1.1.0_x64_en-US.msi` en/of `bundle/nsis/Projectradar_1.1.0_x64-setup.exe`
- Linux → `bundle/appimage/projectradar_1.1.0_amd64.AppImage` en/of `bundle/deb/projectradar_1.1.0_amd64.deb`

## Bekende beperking — Tauri prod build geblokkeerd in v1.1

`npm run tauri:build` faalt op een Next.js 16-quirk in `output: 'export'`. Tot dat is opgelost:

- **Tauri DEV werkt volledig**: `npm run tauri:dev` opent de webview tegen de Next dev-server. Alle UX-flows (welkomstscherm, projectroot kiezen, AI-instellingen, status genereren) werken end-to-end.
- **Tauri PROD installer** vereist eerst een refactor van dynamische pages naar pure client components (zie `docs/desktop-sprint-log.md` Fase 6).

In de tussentijd: gebruik `npm run tauri:dev` of bouw zonder Tauri (`npm run dev` + env-vars) zoals in v1.0.

## Code signing en notarization

Niet in v1.1.

- **macOS** levert een unsigned `.dmg`. Bij eerste open: rechtermuisknop → **Open** → "Toch openen". Gatekeeper onthoudt het daarna.
- **Windows** levert een unsigned `.msi`. SmartScreen waarschuwt bij eerste run met "Windows heeft je pc beveiligd". Klik **Meer info** → **Toch uitvoeren**.

Voor publieke distributie zonder die waarschuwingen heb je nodig:
- macOS: Apple Developer ID ($99/jaar) + `notarytool` om Apple te laten staplen.
- Windows: Authenticode certificaat (~$200/jaar) of EV-cert (~$400/jaar voor instant SmartScreen-erkenning).

Beide zijn op de roadmap voor v1.2.

## GitHub Actions

`.github/workflows/desktop-build.yml` bouwt de installers automatisch in CI op `macos-latest` en `windows-latest` zodra je een tag `v*` pusht. Artifacts komen onder de workflow-run te staan.

Trigger handmatig: GitHub → Actions → "Desktop installer build" → Run workflow.

Vereist nog: de Next.js 16-quirk hierboven oplossen voor de prod-build commando te laten slagen.

## Tauri DEV-mode draaien

Voor ontwikkeling en testen:

```bash
npm run tauri:dev
```

Tauri start de Next dev-server op poort 1420 en opent een eigen webview-venster met je app. Hot-reload werkt voor de frontend; voor Rust-changes draait `cargo watch` los.

Eerste keer dat je het draait kan 2-3 minuten duren (Rust dependencies compileren). Daarna is het sub-secondes.
