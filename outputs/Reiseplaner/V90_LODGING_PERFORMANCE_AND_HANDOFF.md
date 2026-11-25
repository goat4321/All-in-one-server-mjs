# V90 · Unterkunftsansicht: Performance, progressive Kartendarstellung und Browserabnahme

**Datum:** 21.11.2026 · **Repository:** `goat4321/All-in-one-server-mjs` · **PR:** #5 · **Branch:** `feature/v7-data-day-accommodation-rail`

## 1. Sichere Quelle und Ausgangszustand

Ausgangspunkt war tatsächlich `079119ecf33ec295737941c3ff53b3b39ca378d1`, letzte erfolgreiche CI #44879332442. Die vorhandenen Remote-Quellen wurden gelesen: `V89_INTEGRATION_AND_NEXT_HANDOFF.md`, `CHECKLIST_V2.md` (61 Punkte), `STATUS.md`, `DECISIONS.md`, `public/views.mjs`, `app.mjs`, `browse-hub-v35.mjs`, `browse-hub-v35.css`, `test/portable-browser.mjs`, `test/stay-browser.mjs` und `test/quality-audit-v88-browser.mjs`. Der nur lokal beschriebene Stand auf dem Windows-Rechner und private Tripsy-/SQLite-Dateien bleiben unzugänglich. `outputs/Abnahme-V2/` ist auf GitHub weiterhin nicht vorhanden. Die aktuell vollständige Liste liegt in `outputs/Reiseplaner/CHECKLIST_V2.md`.

**Vorher, echter Headless-Chrome-CI-Snapshot auf 390 px, interrail_swiss, Seed-Daten:** Unterkunftsansicht **4.349 DOM-Elemente, 377 sichtbare/interaktive HTML-Controls, 23 Bilder, 29 Controls kleiner 24 px**. Eine Liste bis zu 24 Karten sowie umfangreiche Schweizer Recherche- und Anbieterquellen waren schon im zugeklappten Zustand als HTML eingebaut. Alle 4 Varianten und die 14 Schweizer Tage blieben zuvor bereits als Daten erhalten.

## 2. Tatsächliche Codeänderungen

1. `public/views.mjs` rendert beim Öffnen der Unterkunftsansicht nur die ersten **8** statt 24 Unterkunftskarten. Ein von den übrigen Reiseideen unabhängiger `stayBrowseLimit` ist zuständig. „Weitere 8 Optionen“ lädt weitere 8, bis alle gefilterten Kandidaten sichtbar sind. Die tatsächliche **Trefferzahl, Sortierung, Filterung und der vollständige unabhängig gerenderte 2–4er-Vergleich** werden nicht gekürzt.
2. `public/views.mjs` rendert die aufwendige `stay-swiss-research` und den detaillierten `hub-technical-details`-Quellenblock nur bei geöffnetem `<details>`. Vor dem Öffnen bleibt lediglich die native, tastaturbedienbare Zusammenfassung vorhanden. Der sichtbare Vergleich bleibt jederzeit verfügbar, der zusätzliche tabellarische Detailvergleich auf Wunsch.
3. `public/app.mjs` verwaltet die separate Unterkunftspaginierung, setzt sie bei neuer Suche, Ort, Reise, Facetten-Reset und erneutem Aufruf korrekt zurück, erhält den bestehenden Preis-/Karten- und Reiseideen-Workflow. Native `toggle`-Ereignisse bauen recherchierte Inhalte **erst auf bewusste Nutzeröffnung** ein und stellen den Fokus danach wieder auf die Zusammenfassung. Mehrere Ausklapp-/Sortiervorgänge nutzen weiterhin denselben Zustand; kein neues paralleles Quellensystem.
4. `public/browse-hub-v35.css`: Der Search-Label-Text „Angebote durchsuchen“ bleibt für Screenreader vorhanden, wird jedoch über die etablierte `sr-only`-Technik tatsächlich visuell ausgeblendet. Vorher hatte der Text Platzhalter und Suchsymbol in der sichtbaren Suche überlagert.
5. `test/portable-browser.mjs` und `test/quality-audit-v88-browser.mjs`: gezielte Regression für 8→16 Karten, vollständigen 2-Optionen-Vergleich, Lazy-Recherche, explizite Budget-Unverändertheit und Screenreader-Label. Der gesamte 63-Messpunkte-Laboraudit bei 390/768/1440, Light/Dark/Reduced Motion bleibt aktiv. Für V90 zusätzliche mobile Screenshot `quality/v90-lodging-compare-390.png`.

## 3. Quantitative Vorher-/Nachher-Messung

| Synthetische Seed-Daten, Unterkunft bei 390 px | V89 vorher | V90 nachher |
|---|---:|---:|
| DOM-Elemente | 4.349 | **1.517** (−65,1 %) |
| Controls | 377 | **135** (−64,2 %) |
| DOM-Bilder (lazy) | 23 | **9** (−60,9 %) |
| Controls <24 px (heuristisch) | 29 | **1** |
| Initiale Unterkunftskarten | bis 24 | **8** |
| Horizontaler Seitenüberlauf | 0 px | 0 px |
| JS-Runtime-Ausnahmen | 0 | 0 |

**Auch bei 768 und 1440 px** messen die finalen Screenshots 1.517 DOM-Elemente, 9 Bilder und 0 horizontalen Seitenüberlauf; die Label-Beschriftung ist semantisch vorhanden und visuell versteckt. Der einzelne kleine Quelllink bei 390 px ist noch offen. **Nicht als realen LCP/INP-Vorteil interpretieren:** Renderzeiten schwanken je Headless-Chrome-Lauf, die Netzwerklatenz und Nutzergeräte sind nicht repliziert.

**Sichtprüfung tatsächlich durchgeführt:** `quality/v88-lodging-390.png`, `quality/v88-lodging-768.png`, `quality/v88-lodging-1440.png` und `quality/v90-lodging-compare-390.png` aus den GitHub-CI-Artefakten. Der Quellenstatus „Objektfoto nicht belegt“ und historische Planpreise sind in der Vergleichsansicht sichtbar; keine erfundenen September-2027-Buchungen, Hotelbilder oder Preise. Die Suchleiste ist auf dem finalen 390px-Screenshot ohne Überlagerung.

## 4. Tests und Sicherheitsnachweise

**Letzter bestätigter Code-HEAD vor Dokumentation:** `62671fc4795a9ec397c3468e125529ddfe1f6baf`, **CI #44882978787 erfolgreich**; https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44882978787

- **520/520 portable Node-Tests**, keine Fehler, Syntax aller JavaScript-Dateien, beide Datenvalidatoren, Importpaket, API/Origin-Smoke, Research- und Kartenabdeckung.
- Echter Chrome-Gesamttest für Mahlzeiten, drei Reisende, Mehrfachkörbe/Bestand/Preise/Budget, Persistenz/Reload, Filter, Karten und Mobile, außerdem unabhängiger Unterkunftstest mit 2–4 Vergleichskandidaten, Storno-/Küchen-/Bett-/Bahnhof-/Quellenfiltern und Varianten-Isolation.
- Neue V90-Chrome-Prüfung: **8 Startkarten → 16 nach Nachladen**, 2 eigenständige Vergleichskarten mit originalen IDs, Schweizer Recherche erst nach Öffnen, Detailquellen erst nach Öffnen, **0 zusätzliche Budgetbuchungen**. Der Test prüft außerdem, dass eine von Entdecken übernommene Suchanfrage bewusst zurückgesetzt werden kann.
- **63** Headless-Chrome-Laboraudit-Snapshots über sieben Seiten, drei Breiten, Light/Dark/Reduced Motion; Label ohne visuelle Überlagerung in Unterkünften, Entdecken und Essen; 0 horizontale Überläufe, 0 erkannte fehlende Eingabelabel (Heuristik), 0 Runtime-Ausnahmen. Alte und neue Screenshots wurden tatsächlich in CI erzeugt.

**Kein Anspruch auf vollständige WCAG-Abnahme, echte VoiceOver-/NVDA-Testgeräte, aktuelle Google-Maps-Erreichbarkeit oder originale lokale Windows-Tests.** Altbestände/Varianten wurden nicht umgeschrieben, gespeichert/booked/confirmed-Logik und Budget blieben unverändert. Kein Merge, Deployment, Kauf oder Buchung.

## 5. Priorisierte drei Restarbeiten

1. **P1:** 390px-Vergleichsbreite und einzelne kleine Quelllinks (1 verbleibend in initialer Ansicht) weiter prüfen; manuelle Screenreader-Fokusreihenfolge in vollständig geöffneten Quellenpanels und Long-Scroll-UX auf realem iPhone/Android testen.
2. **P1:** Die nächste schwerste Seite im synthetischen Audit gezielt isolieren und eine weitere kleine, stabile DOM-/Bild-Profiloptimierung durchführen; vergleichbare Baseline und echte Screenshots sichern, ohne URL-/Karten-/Foto-Herkunft zu verschleiern.
3. **P1/P2:** Lokalen Windows-/Tripsy-Stand und originale Referenzbilder sicher abgleichen; echte lizenzierte Unterkunftsfotos, 3-Personen-Zimmerbelegung, 2027-Preis-/Storno-/Küchenbelege und September-Verfügbarkeiten separat nachprüfen. Kein 2027-Endpreis aus historischen Suchwerten ableiten.

Die **61-Punkte-V2-Checkliste** bleibt streng: 18 erledigt im belegten Funktionsumfang, 41 teilweise, 2 nicht verifizierbar. V90 ergänzt konkrete Nachweise ohne unbelegte Häkchen.

## 6. Sicherer lokaler Start nach Versionsabgleich

Nur als Anweisung für Windows; **hier nicht ausgeführt**:

```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
git status --short
git branch --show-current
git log -1 --oneline
git fetch origin feature/v7-data-day-accommodation-rail
git log --left-right --oneline HEAD...origin/feature/v7-data-day-accommodation-rail
```

Bei lokal veränderten oder divergierten Dateien zuerst Backup und Git-Vergleich, **kein blindes** `pull`, `reset --hard` oder `checkout -f`. Wenn der richtige vollständige Checkout und Node ≥24 vorhanden sind:

```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
node --version
call Start-Reiseplaner.cmd
```

Browser: `http://127.0.0.1:4173/?variant=interrail_swiss`. Für portable Prüfung im Ordner `outputs\Reiseplaner`: `npm run check:portable` und `npm run test:quality` (Chrome erforderlich). Die ursprüngliche vollständige lokale Testreihe mit privaten Rohdaten bleibt gesondert auszuführen.
