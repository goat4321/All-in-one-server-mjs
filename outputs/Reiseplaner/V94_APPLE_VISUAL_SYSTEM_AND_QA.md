# V94 – Apple-inspiriertes, ruhiges und flüssiges Web-Designsystem

**Datum:** 21.11.2026  
**Repository:** `goat4321/All-in-one-server-mjs`  
**Branch:** `feature/v7-data-day-accommodation-rail` · PR #5 (Draft, nicht gemergt)  
**Code-HEAD der bestätigten vollständigen Abnahme:** `748070f3838e253fecf97fce0c019ffd801b151a`  
**CI:** [GitHub Actions #44950411848](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44950411848) · **success**

## 1. Analyse, Referenzen und Zielbild

Ausgangssituation: V91/V93 haben besonders auf Smartphones bereits Hover-/Animations-Unruhe und viele kleine Klickflächen reduziert. Die ergänzende Screenshotprüfung zeigte jedoch eine uneinheitliche Informationshierarchie: mehrere konkurrierende Flächen- und Rundungsfamilien, dichte Rechercheblöcke vor primären Nutzungsaufgaben, Alt-CSS mit fest vorgegebenen Light-Farben und kontrastarmen Dark-Mode-Bereichen. Fotos, vier Reisevarianten und echte Quellen sollten unverändert bleiben.

Gelesene Quelle: [eigenes Repository `goat4321/apple-design-skill`](https://github.com/goat4321/apple-design-skill/blob/main/SKILL.md), insbesondere die Referenzen `references/hig/accessibility.md`, `layout.md`, `typography.md`, `color.md`, `designing-for-ios.md`, `buttons.md`, `motion.md`, `dark-mode.md`, `materials.md`, `tab-bars.md`, `scroll-views.md` und `references/cross-platform.md`.

**Designthese:** Der Reiseplaner soll nach einem zusammenhängenden, informativen Reiseprodukt aussehen, nicht nach einer Sammlung verschieden gestylter Verwaltungskarten. Fotos und Karte sind Inhalt. Navigation und Interaktionsflächen bleiben funktional, ruhig und erkennbar; der grüne Markencharakter bleibt erhalten. Die Apple HIG werden auf eine bestehende Web-App übertragen, ohne Apple-Look/Logos/SF-Font zu kopieren und ohne pauschal überall Glassmorphism hinzuzufügen.

## 2. Änderungen an der Umsetzung

| Datei | Änderung |
|---|---|
| `public/apple-visual-system-v94.css` | Neue finale Designschicht: semantische Hell-/Dunkelfarben, konsistente Abstände und Rundungen, reduzierte Schatten, 44px Primäraktionen, Formulare, Fokus- und Motion-Feedback, Karten-, Tagesplan-, Foto-, Essens- und Unterkunftsansichten |
| `public/index.html` | V94 hinter V91 als letzte CSS-Schicht geladen |
| `public/views.mjs` | Kartenzahlen ohne `undefined` bei fehlendem Explorer; Essen im kombinierten Browse: Suche/Filter vor Angebotskarten, Detailpreiskatalog nach Angebotskarten; Direktlink zur Preisrecherche |
| `public/market-basket-ui-v86.mjs` | Zielanker für unveränderte Preisrecherchedaten |
| `package.json` | Neuer V94-Modelltest Bestandteil des portablen Testlaufs |
| `test/apple-visual-system-v94.test.mjs` | Struktur-/Responsive-/Accessibility-/Mode-Invarianten |
| `test/calm-design-v91.test.mjs` | Reihenfolge historischer und neuer CSS-Layer angepasst |
| `test/portable-browser.mjs` | Prüft Dark-Mode-Fotokarte als helle Schrift auf dunklem Untergrund, statt falscher historischer Light-Mode-Annahme; Preisrecherche-Screenshot nach Scroll |
| `test/quality-audit-v88-browser.mjs` | V94-Styling, Dark Mode, Primärbuttonhöhe, Unterlaufen und Seitenhierarchie in 63 realen Chrome-Snapshots geprüft; dunkle Screenshots hinzugefügt; mobile Zielwerte verschärft |

**Konkrete Korrekturen aus iterativer CI:** Primärer Kartenbutton war in der ersten Fassung nur rund 35px hoch, durch endgültige CSS-Priorität auf mindestens 44px korrigiert. Alte helle Oberfläche und neue helle Schrift führten beim Themewechsel zu temporär unlesbarer Fotokarte: verzögerten Background-Transition entfernt und alten Fotokarten-Assertionstest an die korrekte Dunkelansicht angepasst. Der letzte Link `a.place-photo-unavailable-source` besitzt mobil mindestens 36px echte Klickfläche; der Wikimedia-Quelllink selbst wird nicht verändert.

## 3. Messbare Abnahme

**Grüner Code-HEAD:** `748070f3838e253fecf97fce0c019ffd801b151a`. Run [#44950411848](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44950411848) mit **539/539 portable Tests** (V93: 530), ohne Fehlschlag; zusätzlich Chrome-App-Flow, Regressionen für mehrstufige Karte, Unterkünfte, Persistenz, HTTP-Start. Die Labormessung erfasst **7 Hauptseiten × 3 Breiten (390/768/1440) × 3 Modi (Light/Dark/Reduced Motion) = 63 Snapshots**. Maximaler horizontaler Überlauf **0px**, Runtime-Ausnahmen **0**.

| Seite bei 390px | Vor V94 (V93) unter 24px | Nach V94 unter 24px |
|---|---:|---:|
| Übersicht | 0 | 0 |
| Karte | 0 | 0 |
| Tagesplan | 0 | 0 |
| Unterkünfte | 0 | 0 |
| Entdecken | 1 | 0 |
| Essen | 0 | 0 |
| Daten | 0 | 0 |

Dies misst kleine DOM-Interaktionsrechtecke unter 24px in einer reproduzierbaren synthetischen Ansicht, **nicht** die Erfüllung der generellen HIG-Empfehlung für 44pt Touch-Ziele oder eine vollständige WCAG-Prüfung. Die gespeicherten Karten-, Budget-, Foto- und Unterkunftsdaten wurden durch den Designcode nicht verändert.

## 4. Offene Punkte

- Echte iPhones, Android, Systemvergrößerung, VoiceOver/NVDA und vollständige WCAG-Farbkombinationen noch nicht extern verifiziert.
- Real-User-Performance (LCP/INP/FPS) und vollständiges qualitatives Abnehmen sämtlicher offener Forschungsdisclosures bleiben offen; Labor-`renderMs` nicht als Feldmetrik ausgeben.
- Der Branch ist **nicht** `main`, kein automatisches Deployment. Private Original-Tripsy-Dateien und nicht hochgeladene Windows-Änderungen bleiben unangetastet; lokaler Stand zuerst `git status`/`git fetch` sicher vergleichen, niemals blind `reset --hard`.
- Für eine grundlegende technische Bereinigung könnten künftig historische CSS-Generationen modular zusammengefasst werden. **Nicht** als Teil dieser Runde vorgenommen, weil das umfangreiche Karten-/Vergleichsverhalten regressionskritisch ist.

## 5. Lokal ansehen

In deinem bestehenden lokalen Projekt: erst `git status --short`, `git branch --show-current`, `git fetch origin feature/v7-data-day-accommodation-rail` und `git log --left-right --oneline HEAD...origin/feature/v7-data-day-accommodation-rail` vergleichen. Nur sicher synchronisieren, ohne lokale Änderungen zu überschreiben; danach den vorhandenen `Start-Reiseplaner.cmd` ausführen und `http://127.0.0.1:4173/?variant=interrail_swiss` öffnen.
