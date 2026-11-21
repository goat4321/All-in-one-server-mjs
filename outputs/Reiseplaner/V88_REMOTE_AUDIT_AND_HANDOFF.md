# V88 · Remote-Abnahme 12–14, Accessibility- und Projektübergabe
**Datum:** 20.11.2026 · **Repository:** `goat4321/All-in-one-server-mjs` · **PR:** #5 · **Branch:** `feature/v7-data-day-accommodation-rail`.

## Datenbasis und Synchronisationsgrenze
Prüfbarer Beginn dieses Arbeitsdurchgangs: Remote-HEAD `a1e6b1f6a4f715d103773068cf57de0451b5f769`, erfolgreiches GitHub-CI #44822543178. Der Remote-Branch ist neuer als die im Nutzerprompt genannten `13c0f9a` / `ab26f9b`. In GitHub ist `outputs/Reiseplaner/CHECKLIST_V2.md` vorhanden und enthält 61 Anforderungen; `outputs/Abnahme-V2/CHECKLIST_V2.md` ist dort **nicht** vorhanden. Die private lokale Arbeitskopie unter `C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one\` und `data/tripsy-*.json` sind in diesem Chat nicht auslesbar. **Keinen lokalen Test, Git-Fetch oder Roaming-Status behaupten.** Es erfolgte keine Synchronisation des Windows-Rechners.

## Umsetzung der drei Prompts
**Prompt 12:** Die früheren V87-Ortskarten werden aus unveränderten Tages-IDs aufgebaut und nutzen die vorhandenen `place-profile.mjs`-Quellen-/Lizenzmechanismen, offizielle vorhandene Links und ausdrücklich als *Google Maps Suche* bezeichnete Ortslinks. Neue V88-Bildreferenz für die zuvor bildlose Idee `survey-v19:act-055`, „Kandersteg – ruhiger Dorfnachmittag“:
- `Kandersteg Valley.jpg` (Fred Friggens, 29.07.2017, CC BY 2.0); https://commons.wikimedia.org/wiki/File:Kandersteg_Valley.jpg und https://creativecommons.org/licenses/by/2.0/ . Historische Ortsansicht, **kein 2027-Zugangsbeleg**, keine Unterkunftsfotografie.
- Vorhandene V87-Fotos Heuberg und Äscher wurden nicht ersetzt; sie dokumentieren nur Ortsblick/Teilziel. Ursprüngliche 158 kuratierte Bildzeilen vor dem V88-Neuzugang sind eine Quellzuordnung, keine 158 neu validierten 2027-Fotos.
- Keine Buchungs-/Preis-/Öffnungsbehauptungen September 2027 und keine falschen Objekt-/Airbnb-Adressen; vorhandene Links werden nicht als bestätigte exakte Eingänge bezeichnet. Die offizielle Commons-Hotlink-Dokumentation erlaubt `Special:FilePath`, rät aber wegen Veränderbarkeit von der Abhängigkeit ab. Quell- und Lizenzprüfung jedes Bilds und Offline-Fallback bleiben notwendig.

**Prompt 13:** Neues separates headless-Chrome-Laboraudit in `test/quality-audit-v88-browser.mjs`, CI-Schritt in `.github/workflows/reiseplaner-ci.yml`, `npm run test:quality`. 7 Seiten (Start, Karte, Tagesplan, Unterkünfte, Entdecken, Essen, Daten) × 1440/768/390 px × Light/Dark/Reduced-Motion = 63 Messpunkte. JSON-Bericht und 21 echte PNG-Screenshots im CI-Artefakt `reiseplaner-ui-review/quality/`. Erfasst unkomprimierte HTML-Antwort, DOM, Laborklick/Scrollframe, elementare zugängliche Namen/Labels, kleine Touch-Ziele, Bilder und Lazy Loading, Offline-Fehler, horizontalen Überlauf, Laufzeitfehler, Tokenkontrast und berechnete Animationseinschränkung. Zusätzlich Tastatur-Tabfolge und Browse-Suchfilter-Probe. Ein automatischer Audit ist **kein** vollständiger WCAG-/Screenreader-/Real-User-INP-/LCP-/CLS-Test.

**Vorher-Messung** in CI #44824128670 bei HEAD `f02e306`: 2.417 Byte HTML; 395–6.288 DOM-Elemente; 0 horizontaler Überlauf; 0 unlabeled Inputs nach Heuristik; 0 JS-Ausnahmen; längster Laborklick 102,2 ms; bis zu **51** zu kleine klickbare Ziele (meist Quellen-/Fotolinks). Für die abschließende Nachher-Messung den neuesten V88-GitHub-CI-Lauf prüfen und dessen JSON dem Vorher-Artefakt gegenüberstellen; nicht automatisch eine Verbesserung behaupten.

**Gezielte Reparaturen**: Quelle-/Bildlizenzlinks in `public/day-plans-v32.css` erhalten größere Klickflächen und sichtbare Fokusmarkierungen; Legibilität der Schweizer Quellenkarten wird erhöht, große Offline-Fallbacks mobil verkleinert, überflüssiger Hover-Transform bei Reduced Motion entfernt. In `public/views.mjs` bleibt der Essen-Seitenkopf vor der recherchierten Supermarktkettenübersicht. Bestehende Daten und Buchungen werden nicht umgeschrieben.

**Prompt 14:** Alle **61** echten Zeilen in `CHECKLIST_V2.md` normiert: **18 erledigt im angegebenen Funktionsumfang, 41 teilweise, 2 nicht verifizierbar**. Alte lokale Prüfaussagen sind als historisch zu lesen. **Erledigt** bedeutet *nachweisbare UI-/Planungsfunktion auf zugänglicher Remote-Datenbasis*, nicht Live-Verfügbarkeit oder den privaten Windows-Stand. Keine spekulativen neuen Häkchen.

## Qualitätsgrenzen und nächste Prioritäten
1. **P0:** Vor einem lokalen Pull/Build den tatsächlichen Windows-Arbeitsstand und alle uncommitteten Dateien abgleichen. Private `data/tripsy-*.json` und `private/reiseplan.sqlite` nie überschreiben, niemals nach GitHub pushen.
2. **P1:** Echte 2027-Verfügbarkeit von Unterkunft, Bahn, Seilbahn/Wanderwegen und lokale Filialpreise prüfen. In V86 fehlen **118 von 130** konkreten Stadt-Ketten-Produkteinzelpreisen; nationale historische Katalogpreise nicht als lokal verfügbar ausgeben.
3. **P1:** 14 Schweizer Tage und die 29 vorhandenen Tagesideen betreffen **nur die redaktionelle Tagesliste**. Transport, Unterkunft, Essen und unbelegte einzelne POIs bleiben eigene unbestätigte Objekte; keine künstlichen 2027-Angebote erzeugen. Tages-10 (10.09.) und Rückreise 14.09. ohne neue Aktivitäten.
4. **P1:** Mobil und Desktop echte Bildschirm-/Screenreader-/Tastatur-Abnahme mit NVDA/VoiceOver; kleine Touch-Ziele und DOM-Last Karte weiter reduzieren. Browser-Audits prüfen keinen Nutzerbetrieb und keine echte Netzlatzenz/Maptile-Last.
5. **P2:** Fehlende lizenzierte Objektfotos gezielt ergänzen, Archiv- und Nutzungsrechte/Quellen korrekt angeben; Hotelzimmer/Airbnb nur mit echten objektbezogenen Rechtequellen. Exakte Maps-Adressen/öffentliche Öffnungszeiten separat kontrollieren.

## Exakter Windows-Start (nur wenn vollständiger Projektordner und Node ≥24 vorhanden)
In **cmd.exe**:

```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
node --version
call Start-Reiseplaner.cmd
```

Im Browser anschließend `http://127.0.0.1:4173/?variant=interrail_swiss` aufrufen, falls nicht automatisch geöffnet. Das Startskript im Repo ruft `outputs\Reiseplaner\Start.cmd` auf. Es ist **kein** `npm install` erforderlich, sofern die lokale Kopie dem Repo entspricht. Vor Wechsel des GitHub-ZIP-Ordners den laufenden Server stoppen und `Daten-sichern.cmd` verwenden.

**Vor jeder Synchronisierung:**

```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
git status --short
git branch --show-current
git log -1 --oneline
git fetch origin feature/v7-data-day-accommodation-rail
git log --left-right --oneline HEAD...origin/feature/v7-data-day-accommodation-rail
```

Das sind **Anweisungen, keine hier ausgeführten Windows-Befehle**. Bei abweichendem Verlauf oder lokalen Änderungen kein blindes `git pull`, `reset --hard` oder branch-Überschreiben. Aus einem vollständigen lokalen Checkout danach `call Pruefen-Reiseplaner.cmd`; für den isolierten CI-kompatiblen Teil im Ordner `outputs\Reiseplaner`: `npm run check:portable`, für den zusätzlichen Browser-Laboraudit `npm run test:quality`. Die lokale volle `npm test`-Reihe mit privaten Rohdateien muss gesondert auf dem Windows-Stand erfolgen.

## Nachweislinks
- `CHECKLIST_V2.md`, `STATUS.md`, `DECISIONS.md`, `MARKET_SWISS_QUALITY_V86_V87.md`, `V88_REMOTE_AUDIT_AND_HANDOFF.md`
- Neue Medien-/UI-Tests: `test/swiss-14-quality-v87.test.mjs`, `test/quality-audit-v88-browser.mjs`
- Bestehende Integrationsprüfungen: `test/portable-browser.mjs`, `test/meal-race-browser.mjs`, `test/map-pins-routes-browser.mjs`, `test/map-route-race-browser.mjs`, `test/stay-browser.mjs`
- GitHub Actions: `https://github.com/goat4321/All-in-one-server-mjs/actions`
- PR #5: `https://github.com/goat4321/All-in-one-server-mjs/pull/5`

**Kein Merge nach main, kein Deployment, keine Buchungen oder Zahlungen.**
