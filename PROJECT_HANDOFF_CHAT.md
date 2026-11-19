# PROJECT_HANDOFF_CHAT — Reiseplaner (Stand: 19.11.2026)

## Geltungsbereich und Vertrauensniveau
Diese Übergabe wurde **im normalen Chat über die verbundene GitHub-Integration** aus dem Remote-Commit `44dbec1f5e95054b38c37505f77f194ca2d9bcff` erstellt. **Kein Zugriff** auf den Windows-Ordner, die dortigen privaten Tripsy-Daten, uncommittete Änderungen, die lokale SQLite-Datenbank oder die Vorschau auf 127.0.0.1 wurde nachgewiesen. Deshalb ist diese Datei eine **Remote-Bestandsaufnahme, kein Beweis der lokalen Synchronität**.

Repository: `goat4321/All-in-one-server-mjs`  
Entwicklungsbranch: `feature/v7-data-day-accommodation-rail`  
Offener Draft-PR: #5 gegen `feature/v7-unified-map-and-day-builder` (nicht gegen main).  
Geprüfter Remote-HEAD: `44dbec1f5e95054b38c37505f77f194ca2d9bcff`  
Isolierter Dokumentationsbranch: `chat/handoff-2026-11-19-44dbec1`, von diesem HEAD abgezweigt. Kein Merge, Push auf den Entwicklungsbranch, Deployment, Kauf oder Buchung.

## Verifizierte GitHub-Commits (neueste zuerst)
- `44dbec1` — `feat(stays): combine evidence filters and clarify group comparison`
- `634ffde` — `feat(map): add own pins and protect multi-stop route drafts`
- `ab26f9b` — `perf(data): load audits on demand and prioritize deadlines`
- `13c0f9a` — `feat(meals): plan three daily meals with pooled groceries and safe dialogs`

Der Remote-HEAD liegt **3 Commits vor `13c0f9a`** bzw. **2 Commits vor `ab26f9b`** (GitHub-Compare, keine Rückstände gegenüber diesen historischen Commits). Ob Windows darüber hinaus **lokale** Commits oder uncommittete Änderungen besitzt, ist **nicht festgestellt**.

## Relevante Dokumentation
- `outputs/Reiseplaner/STATUS.md` — jüngster Stand: Unterkunftsfilter/-vergleich, 526/526 vollständige und 505/505 portable Tests **laut lokalem Projektbericht**.
- `outputs/Reiseplaner/CHECKLIST_V2.md` — 61-Punkte-Anforderungsliste und Status je Punkt.
- `outputs/Reiseplaner/DECISIONS.md` — fachliche und technische Entscheidungen; aktuell zu Unterkünften, Pins, Data-on-demand und Mahlzeiten.
- `outputs/Reiseplaner/STAY_COMPARISON_ACCEPTANCE.md`, `MAP_INTERACTION_ACCEPTANCE.md`, `DATA_PAGE_ACCEPTANCE.md`, `MEALS_ACCEPTANCE.md` — getrennte lokale Abnahmeberichte.
- Angefragtes Verzeichnis `outputs/Abnahme-V2/` ist **im abgefragten GitHub-Branch nicht vorhanden**. Der lokale Ordner wurde nicht gesehen.
- `outputs/Reiseplaner/TEST_LOCAL.md` beschreibt Tests mit vier privaten `data/tripsy-*.json`.

## Tatsächliche Architektur
- Lokale Node.js-24+-Anwendung ohne obligatorisches `npm install`.
- `outputs/Reiseplaner/server.mjs`: HTTP-Server und APIs `/api/bootstrap`, `/api/variant/:id`, `/api/walk`, `/api/transit`, `/api/geocode`; bindet an `127.0.0.1`.
- `lib/store.mjs`: Node-`sqlite`/`DatabaseSync`, validierte und getrennte Varianten-/Nutzerzustände.
- `lib/catalog.mjs`: Quellen und vier Reisevarianten, Research-Sammlungen und Fallback.
- `public/app.mjs` + `views.mjs`: Frontend-Steuerung/-Rendern; `model.mjs`/ `daily-budget.mjs`: Berechnungen.
- `public/map.mjs`, `map-pins.mjs`, `day-route*.mjs`: Karte, manuelle Punkte, Fußwege, Mehrstopprouten mit Revisions-/Race-Schutz.
- `public/stay-facets.mjs`, `stay-compare-ui.mjs`, `stay-analysis.mjs`: Unterkünfte und Vergleich.
- `public/data-page.mjs`: verzögert aufgeklappte Quellen-/Fristen-/Datenbereiche.
- UI beruht auf lokalen Modulen und vielen CSS-Schichten. Risiken: zentrales `app.mjs`, historische CSS-Overrides, zeitversetzte Fetch-Antworten, Datentrennung und falsche Preis-/Positionsgewissheit.

## Prüflage und Befehle
GitHub Actions auf **exakt `44dbec1`**: Läufe [44534237556](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44534237556) und [44534235124](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44534235124) am 19.11.2026 abgeschlossen mit `success`. Im ersten Lauf waren Syntax, Python-Validatoren, portable Node-Tests, HTTP/API-Smoke, Kartenbericht, Chrome-, Mahlzeiten-, Daten-, Karten-/Race- und Unterkunfts-Browserprüfungen sowie HTML-Server-Smoke erfolgreich. Die Chat-Umgebung hat diese Suite **nicht selbst erneut gestartet**. 526/526 ist der lokale Dokumentationsstand; der portable GitHub-Lauf bestätigt nicht die vier privaten Originaldateien.

Start unter Windows aus dem ZIP-/Repo-Hauptordner:
```cmd
node --version
call Start-Reiseplaner.cmd
```
Erwartet: Node **24 oder neuer**, lokale Adresse `http://127.0.0.1:4173/`, für Hauptvariante z. B. `http://127.0.0.1:4173/?variant=interrail_swiss`. Diese Adresse ist eine **konfigurierte lokale URL**, keine von ChatGPT erreichbare Website. Die bisherige Codex-Vorschau `http://127.0.0.1:4175/` ist nicht mit einem ZIP-Start gleichzusetzen. Port-Ausweichweg im Ordner `outputs/Reiseplaner`: `set REISEPLAN_PORT=4174` und `node server.mjs --open`.

Portable Tests im App-Ordner: `npm run check:portable`. Full: `npm test` (nur mit privaten Original-Rohkopien), `npm run test:browser`; zusätzliche Browserfälle: `npm run test:data-browser`, `npm run test:map-browser`, `npm run test:map-race`, `npm run test:stay-browser`, `npm run test:meal-race`. Im ZIP-Hauptordner `call Pruefen-Reiseplaner.cmd` (fehlende private Dateien -> ausdrücklich Teilprüfung).

### Sicherer Windows-Synchronitätscheck (vor funktionalen Änderungen!)
Im bestehenden lokalen Git-Ordner:
```cmd
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
git status --short --branch
git branch --show-current
git rev-parse HEAD
git log -6 --oneline
git remote -v
git ls-files --others --exclude-standard
git fetch origin
git rev-list --left-right --count HEAD...origin/feature/v7-data-day-accommodation-rail
git log --oneline origin/feature/v7-data-day-accommodation-rail..HEAD
git log --oneline HEAD..origin/feature/v7-data-day-accommodation-rail
```
Vor einem `pull`, `reset`, `checkout` oder Neu-Entpacken **nicht gesicherte Änderungen und die lokale SQLite-DB separat schützen**. `git fetch` verändert keine Arbeitsdateien. Eine gleichlautende HEAD-SHA allein schließt nicht gestagte oder nicht verfolgte Änderungen nicht aus. Sicher auf dem Remote-Entwicklungsbranch weiterarbeiten erst, wenn der lokale Vergleich ausgewertet ist; vorerst nur auf einem getrennten Branch.

Privatdaten werden **nicht** nach GitHub geladen. `outputs/Reiseplaner/.gitignore` ignoriert `private/`, `node_modules/` und `data/tripsy-*.json`. Datenbank liegt standardmäßig in `outputs/Reiseplaner/private/reiseplan.sqlite`; im ZIP-Root kann `Daten-sichern.cmd` nach Serverstopp sichern. Browser-`localStorage` ist davon nicht erfasst.

## Fünf nächste Aufgaben nach Nutzen
1. **P0: Lokalen Git-HEAD, Arbeitsbaum und SQLite sichern/abgleichen.** Vermeidet Rückfall und Verlust von Windows-only-Änderungen.
2. **P0: Vollständige private Windows-Regression durchführen.** 526 lokale Modelltests, Original-Import, Browser-Flow und Varianten-/Budgetpersistenz gegen den tatsächlich synchronisierten Stand prüfen.
3. **P1: Referenzbild- und Responsive-Abnahme der elf Hauptseiten.** Originalreferenzen zugänglich machen; 1440/820/390, Tastatur/Fokus, Dark Mode, Reduced Motion und historische CSS-Overrides gezielt korrigieren.
4. **P1: Schweizer Hauptvariante End-to-End testen.** Städte-/Tagesplan, Pins und Mehrstopprouten, Zeitkonflikte, Variantenisolation, Undo und Rückweg mit gespeicherten Zuständen real durchspielen.
5. **P1: Unterkunfts-/Aktivitäts-/Bahnbelege vervollständigen.** Fotos und Lizenzen, Belegungs-/Checkout-Nachweise, Quellen-/Adressqualität, 2027-Fahrpläne und separate ungeprüfte Preisannahmen priorisieren, ohne Buchbarkeit zu erfinden.

## Strikte Grenzen für Folge-Chats
Originalreisen, Varianten-Isolation, gespeicherte Zustände und Budgetlogik schützen. Kein Merge nach `main`, keine Reservierungen, Zahlungen, Publikation oder Deployments. Keine 2027er Preis-/Fahrplan-/Geokoordinatenbestätigungen ohne Quelle. Jede Änderung dokumentiert konkrete Dateien, selbst ausgeführte vs. fremd ausgeführte Prüfungen und Restlücken. Der bestehende PR #5 und der Remote-Entwicklungsbranch bleiben durch diese Übergabe **unverändert**.
