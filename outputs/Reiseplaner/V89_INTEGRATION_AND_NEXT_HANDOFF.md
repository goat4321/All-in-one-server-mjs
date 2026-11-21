# V89 · Gesamtintegration / Prompt 14 + autonomer Fortschritt / Prompt 15

**Stand:** 21.11.2026. Repository `goat4321/All-in-one-server-mjs`, Branch `feature/v7-data-day-accommodation-rail`, PR #5. Codeänderungen V89 bis `0cf1503b15b939b1c3bf2076207e9cdbeaec37b9`; nach diesem Bericht gilt **der jeweils aktuell aus GitHub abgerufene Commit** als Remote-HEAD.

## A. Sicherer Ausgangsstand, Datenquellen und 61 Einzelpunkte

- Ursprünglich vorgegebene lokale Berichte `502/502`, `13c0f9a`, `ab26f9b` sind historisch. Tatsächlich bestätigter GitHub-HEAD vor V89: `f180a7e6e7dffc350509029920ef9751f7292c92`; zugehöriger CI-Lauf #44826438566 **erfolgreich**.
- Die verlangten Pfade `outputs/Abnahme-V2/STATUS.md`, `CHECKLIST_V2.md`, `DECISIONS.md` sind auf diesem GitHub-Branch **nicht vorhanden**. Die tatsächlich verfügbare, vollständige 61er-Liste ist `outputs/Reiseplaner/CHECKLIST_V2.md`, daneben `outputs/Reiseplaner/STATUS.md` und `DECISIONS.md`.
- Die 61 Punkte wurden unter V88 einzeln mit Status/Nachweis/nächstem Schritt überarbeitet: **18 erledigt (nur im nachgewiesenen Funktionsumfang), 41 teilweise, 2 nicht verifizierbar**. Diese Einstufung wird durch V89 nicht zu einer Vollabnahme umgedeutet. Originale Referenzbilder und der spezifische Apple Design Skill bleiben nicht verifizierbar. Testeinschätzungen zu früheren lokalen Windows-Dateien sind ausschließlich archivierte Berichte.
- Private lokale Arbeitskopie `C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one\`, ungesyncte Dateien, die vier privaten Tripsy-Rohdateien und `private/reiseplan.sqlite` sind nicht zugänglich. Daher **keine** Behauptung, der Remote-Branch enthalte den allerneuesten lokalen Stand. Kein Merge, kein Deployment, keine Buchungen, keine Zahlungen.

## B. Prompt 15 – gewählte größte sichere Verbesserung

**Evidenz vor der Änderung:** V88-Labortest, Headless-Chrome 390px, einfache Kartenansicht: **6.225 DOM-Elemente, 883 interaktive Elemente, 66 Lazy-Images**, obwohl die detaillierte Liste 60 Ortskarten beim ersten Rendern erzeugte. Die Liste war ein DOM-/UX-Bottleneck; die Kartendaten aller 4 Varianten sind hiervon logisch getrennt.

**Umsetzung:**
- `public/app.mjs`: In der **einfachen** Karte `ex.limit=12` statt initial 60, bei ausdrücklich angeforderter Listen-Erweiterung 12 → 24 → 48 ...; bei voller Exploreransicht bleibt das bestehende 60er-Verhalten. Daten aus `explorerData` werden **nicht** gefiltert oder entfernt, es werden nur weniger HTML-Karten gleichzeitig aufgebaut.
- `public/explorer-ui.mjs`: Die Schaltfläche „Weitere ... anzeigen“ kommuniziert die echte nächste Menge. Marker-, Filter-, Tages- und Karten-Datensätze behalten ihre ursprünglichen IDs. Ein Marker außerhalb der zuerst gerenderten 12 kann über „In Liste“ die benötigte Anzahl ausklappen.
- `test/quality-audit-v88-browser.mjs`: Dokumentiert gerenderte Karten je Viewport, prüft max. 12 Karten im einfachen Ausgangsmodus, die Erweiterung auf max. 24, unveränderte Gesamtresultate und den Sprung zu einem zuvor nicht sichtbaren Ort. `npm run test:quality` wird in CI ausgeführt.

**Erstes echtes Nachher-Ergebnis (CI #44878789711, erfolgreich):**

| Synthetische 390px-Kartenmessung | V88-Vorher | V89-Nachher |
|---|---:|---:|
| DOM-Elemente | 6.225 | 2.478 |
| Interaktive DOM-Elemente | 883 | 307 |
| Im DOM gerenderte Ortslisten-Karten | 60 | 12 |
| Images im DOM | 66 | 18 |
| Horizontaler Überlauf | 0 px | 0 px |

**Reduktion: 60,2 % DOM-Knoten, 65,2 % sichtbare/erfassbare Controls der Seite.** Vergleich bezieht sich auf denselben synthetischen Chrome-/Seed-Modus; kein behaupteter Real-User-LCP-/INP-Vorteil. Die maximale Seitenschaltzeit aller sieben Seiten (abweichende Laborsamples) lag nach V89 bei 108,5 ms statt zuvor 106,2 ms; daraus lässt sich keine allgemeine Latenzbeschleunigung folgern. Nach der neuen Browserprüfung wird separat angezeigt, ob der „In Liste“-Sprung funktioniert; den CI-Status nie erfinden.

## C. Unveränderte Integrationsnachweise und Grenzen

- `interrail_swiss`: 14 Tagespläne 01.–14.09.2027, **29 eindeutige redaktionelle Tagesideen**; keine erfundene Tagesfülle am 10. und 14.09.; 12.09. als ruhiger Transfer-/Ankunftstag erhalten. Heuberg, Seealpsee, Ebenalp/Äscher behalten schwierige Wegklassifikationen und ohne nutzbare GPX-Höhenwerte kein Nullprofil.
- Drei-Personen-Mahlzeiten: bestehende Rezept-, Mengen-, Vorrats-, Packungs-/Extras-, Preis-/Budgetbestätigungs- und Undo-Logik bleibt unverändert. V86: 12/130 stadtbezogene Preistabellenzellen mit archivierten nationalen Einzelbelegen, 118 offen; nicht als aktuelle Filialpreise oder billigste gesamte Warenkörbe ausgewiesen.
- Unterkünfte: bestehende 2–4er-Vergleichsansicht, Küchen-/Betten-/Storno-/Preis-/Lage-/Quellenfilter und offene Checkoutpreise unverändert. Neue Livepreise und 2027-Buchbarkeit nicht verifiziert.
- Karte: 60er-Datenpool, geographisch belegte Pins und ungenaue Rechercheorte logisch getrennt; bestehende Filter, Pins, gespeicherte Mehrstopprouten, Gruppenstimmen, Tagesadoption und Race-Tests im CI.
- Bilder: historische spezifische Commons-Motive für Heuberg/Äscher und Kandersteg-Dorf, konkrete Urheber/Lizenz, Fall-Back/Offline-Bildprüfung und Google-Maps-Suchlink statt erfundener Hausnummern. Einzelne externe Hotlink-Erreichbarkeit und Bildlizenzprüfung des ganzen Altbestands bleiben offen.
- V88 Labor (7 Seiten × 3 Breiten 390/768/1440 × Light/Dark/Reduced Motion): 63 quantitative Messungen mit 21 PNG-Screenshots, Render-/DOM-/Touch-Ziel-/Fokus-/Kontrast-/Offline-Bild-/Laufzeitfehler-Proben. Keine vollständige WCAG-Zertifizierung, Screenreader- oder Real-User-Web-Vitals-Abnahme.

## D. Laufende und ausführbare Prüfungen

Der letzte bei Beginn dieses Dokuments **bestätigte** Lauf `https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44878789711` war erfolgreich: **520/520 portable Tests**, vollständiger Chrome-Funktionsdurchlauf, V88-Messroutine, HTTP-/SQLite-Seed-Smoke, Meal-Save-Races, Karten-/Routen-Pin-Flows, Map-Races, Unterkunftsvergleich und Screenshots. Ein späterer Commit kann einen neuen CI-Lauf starten; dessen Ergebnis muss separat abgewartet werden.

In `outputs/Reiseplaner` bei Node ≥24 und verfügbarem Chrome/Edge:
```bat
npm run check:portable
npm run test:quality
npm run test:meal-race
npm run test:map-browser
npm run test:map-race
npm run test:stay-browser
```
Die vollständige lokale `npm test`-Abnahme enthält zusätzliche Quellen und benötigt ggf. private Tripsy-Dateien. Fehlende Quelldaten nicht unbemerkt durch generierte Dateien ersetzen.

## E. Exakter lokaler Windows-Start und **sichere** Synchronisierung

Nur als **Anleitung**, auf dem Windows-PC nicht hier ausgeführt:
```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
git status --short
git branch --show-current
git log -1 --oneline
git fetch origin feature/v7-data-day-accommodation-rail
git log --left-right --oneline HEAD...origin/feature/v7-data-day-accommodation-rail
```

Bei divergiervenden lokalen Commits oder ungecommitten Dateien: **kein** `git pull`, `reset --hard` oder `checkout -f`. Zuerst lokale Änderungen, vier Tripsy-Kopien und SQLite sichern und mit GitHub abgleichen. Danach, **wenn** das Arbeitsverzeichnis tatsächlich die freigegebene neueste Fassung enthält:
```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
node --version
call Start-Reiseplaner.cmd
```
Website bei Bedarf: `http://127.0.0.1:4173/?variant=interrail_swiss`. `Start-Reiseplaner.cmd` ruft die echte `outputs\Reiseplaner\Start.cmd` auf. Private Datenbank wird nicht automatisch aus einem neuen ZIP übernommen; vorher Server stoppen und `Daten-sichern.cmd` einsetzen.

## F. Priorisierte nächste **drei** Schritte

1. **P1 – Unterkunftsseite DOM/UX:** Nach der Kartenoptimierung ist die Unterkunftsseite mit **4.349 DOM-Elementen** die schwerste synthetische Seite. Vorher/Nachher messen; Detailkarten/Quellen ohne Verlust von 2–4er-Vergleich, Filtern, gespeicherten Entscheidungen, Preisstatus oder Quellen progressiv darstellen. 390/768/1440 und Tastaturbewegung prüfen.
2. **P1 – echte lokale Synchronisierung und Referenzvergleich:** Windows-HEAD und private Originaldaten versioniert sichern, Referenzbilder zugänglich machen, echte Start-/Karten-/Tages-/Unterkunfts-Screenshots mit Originalen abgleichen. Nicht das bloße Vorhandensein von CI-PNGs als abgeschlossenen Referenzvergleich ausgeben.
3. **P2 – fehlende datierte Quellen und 2027-Verfügbarkeit:** 118 unbesetzte Supermarkt-Preispositionen, 14-Tage-Reiseverbindungen, Unterkunfts-Zimmer-/Bettensituation, Wanderwegöffnungen und lizenzierte POI-Bilder priorisiert mit offiziellen Primärquellen prüfen; nicht bestätigte Angaben bleiben sichtbar offen.

**Kein Merge nach `main`, kein Deployment, keine Reservierung/Zahlung.**
