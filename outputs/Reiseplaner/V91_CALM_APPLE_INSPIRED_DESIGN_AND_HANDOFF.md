# V91 · Ruhiges, flüssiges Grunddesign – Plan, Änderungen und Abnahme

**Datum:** 21.11.2026. **Repository:** `goat4321/All-in-one-server-mjs`, Branch `feature/v7-data-day-accommodation-rail`, PR #5. Ausgangs-HEAD `dde20b390c86c08f9c400dc6827901dac23143f0` (V90-CI #44883548630 erfolgreich).

## 1. Plan und gestalterische Leitentscheidung

**Ziel:** Der Reiseplaner soll wie ein zusammenhängendes, ruhiges Reiseprodukt wirken, nicht wie eine Serie springender Admin-Kacheln. Der bestehende grüne Reisecharakter, echte Foto-/Quellenzuordnung, Karte, Tagesplan, vier Varianten und Unterkünfte bleiben.

**Tatsächlich gelesene öffentliche Gestaltungsquellen:**
- Apple HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Apple HIG Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Frei zugängliches GitHub-Skill `KanishkRanjan/apple-design-skill/SKILL.md`: https://github.com/KanishkRanjan/apple-design-skill/blob/main/SKILL.md

Das **ursprünglich vom Nutzer gemeinte, möglicherweise andere** Apple-Design-Skill im privaten Referenzordner ist nicht zugänglich. Das öffentliche GitHub-Skill ist eine dokumentierte Inspiration, nicht die unbelegte Behauptung, das private Original gelesen zu haben. Bewusst die Produktsicht angewendet: Lesbarkeit und Orientierung, neutrale Contentflächen, dezente Steuerflächen; kein undifferenziertes Liquid-Glass-Overlay, kein Apple-Logo, keine selbst gehosteten SF-Schriften.

**Prüfbare Kriterien:**
1. Seitenübergreifende Light-/Dark-Tokens statt mehrerer konkurrierender Graus/Grüns; klare Typografie und konzentriertes Farbkonzept.
2. Schatten und Einzelrahmen zurücknehmen, Hauptnavigation als einzige transluzente Funktionsfläche, Inhalt/Fotos vollständig erhalten.
3. Keine springenden Karten bei Hover; nur kurze Farbe-/Konturwechsel, höchstens 1,8 % Bildzoom als dezenter Hinweis bei echter Maus.
4. Kein JS-Ripple-Element bei Klick, kein erzwungenes Layout-Reflow für Spotlight; höchstens vier kurze Seiteneinstiegs-Reveals statt bis zu 96 Einzelanimationen.
5. 390/768/1440 Pixel, Light/Dark, Reduced Motion und `data-motion=off` – keine Regression in Routendarstellung, Bedienbarkeit, Laden oder Unterkünften.

## 2. Tatsächlich geänderter Code

- `public/calm-design-v91.css` **neu**: geordnete, letzte CSS-Designschicht nach `stay-decision.css`. Harmonisiert beide Farbmodi, gemeinsame Oberflächen, kompakte Schatten, Navigation, Buttonzustände, Kartenvoransicht, Unterkünfte, Detail- und Aktivitätskarten. Dunkle Primärbuttons behalten Weiß-auf-dunkelgrün statt Weiß-auf-hellgrün. Visuell stabile Hover-/Active-Zustände; ruhige Dialog- und Seiteneinstiegs-Einblendung. `prefers-reduced-motion` und bestehende `data-motion=off` behalten Vorrang.
- `public/index.html`: explizit **nach** allen historischen Styles eingebunden; bestehende Module/Geometrie/CSS-Schichten nicht gelöscht.
- `public/motion-ux.mjs`: Observer statt bis zu 96 nur noch maximal **12 Seitenelemente**; Zielmenge nur Seite/Hero, keine zahlreichen Karten/Zeilen. JS-Ripple-Insertion und erzwungener Keyboard-/Spotlight-Reflow entfallen. Standardmäßige `:active`- und `:focus-visible`-Darstellung bleibt.
- `test/motion-ux.test.mjs`, `test/portable-browser.mjs`: alte Erwartungen „jede Karte hüpft“ und „Button erzeugt Ripple“ auf tatsächlich gewünschte ruhige Darstellung angepasst. Das ist eine bewusste Verhaltensänderung, kein Abschalten der Bedienbarkeit.
- `test/calm-design-v91.test.mjs` **neu**, `package.json`: sechs CSS-/Modul-/Accessibility-Invarianttests im portablen Testsatz.
- `test/quality-audit-v88-browser.mjs`: prüft in den 63 tatsächlichen Chrome-Snapshots CSS-Ladereihenfolge, maximal vier Reveal-Elemente, Light-/Dark-Navigation, kürzere Bewegungen bei OS-Einstellung und horizontale Überläufe.

**Bewusst unverändert:** sämtliche Reisedaten und Quellen, Preise, Fotos/Attribution, Varianten, Kartenpins, gespeicherte Unterkunftsvergleiche, Budget, private Daten, API und Routing-Logik. Keine Apple-Markenzeichen oder kopierten Fremdassets.

**Zusätzlicher V91-Korrekturdurchgang:** Bereits vorhandene 190-ms-Themeübergänge führten zusammen mit historischen lokalen `--paper:#fffefa`-Werten auf Desktop/Tablet zu schwer lesbarer Dark-Mode-Navigation und hellem Suchfeld. Das finale `calm-design-v91.css` setzt das dunkle Navigationsmaterial in der tatsächlich spezifischeren Kopfzeilenregel auf `#202e25`, mit heller Schrift. Die 63 Chrome-Snapshots prüfen nach Abschluss der Farbtransition die echten berechneten Farben statt nur Text-Token. Bild- und Optionskarten behalten statischen, leichten Schatten; Hover wechselt nur den Konturton statt `box-shadow` repaint-intensiv zu animieren. Bei `prefers-reduced-transparency:reduce` deaktivieren Kopfzeile und mobile Navigation Blur und verwenden deckende Flächen. Der zusätzliche Test `test/calm-design-v91.test.mjs` erhöht V91 auf **527** portable Tests.

**Apple-GitHub-Referenzen ergänzend gelesen:** [`references/motion.md`](https://github.com/KanishkRanjan/apple-design-skill/blob/main/references/motion.md), [`references/layout.md`](https://github.com/KanishkRanjan/apple-design-skill/blob/main/references/layout.md) und [`references/materials.md`](https://github.com/KanishkRanjan/apple-design-skill/blob/main/references/materials.md). Anwendung: Inhalt vor Effekt, kurze unterbrechbare Bewegung, keine Transparenz auf Inhaltskarten.

## 3. Vorher/Nachher und Grenzen

**Vorher (V90, bestätigter CI #44883548630):** alte `motion-ux.mjs` beobachtete bis zu **96** Karten-/Panel-Elemente pro Szene und erzeugte pro Pointer-Klick zusätzliche Ripple-DOM-Knoten; `motion-polish.css` hatte u. a. Hover-Lift `translateY(-3px)`, Kartenzoom `scale(1.065)`, Pop/Bounce und gewichtige Shadows. Die Unterkunft hatte trotz vorhandener V90-Paginierung 1.517 initiale DOM-Elemente bei 390px; diese technische Paginierung wird nicht verändert.

**Nachher (Code-Invarianten):** max. zwölf Observer-Ziele (vorher 96, Obergrenze **−87,5 %**); nur noch Seiteneinstiege statt Karten, **null** neue Ripple-DOM-Knoten; kein erzwungenes Spotlight-`offsetWidth`. Hover-Lift für Karten entfernt, optionaler echter Maus-Fotozoom von 6,5 % auf 1,8 % begrenzt. Diese Zahlen beschreiben **CSS/JS-Verhalten**, keine gemessene echte FPS-/INP-/LCP-Geschwindigkeit.

**Tatsächlich verifizierter letzter V91-Code-HEAD `9405062e748c`**: GitHub Actions [#44911502188](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44911502188) **success**. **527/527 portable Tests, 0 Fehlschläge**, Syntax- und Quellvalidatoren, isolierte SQLite-/Origin-/HTTP-Smoke-Prüfung, echter Chrome-Gesamtablauf (Mahlzeiten, Warenkorb, Persistenz, Budget, Karte, Unterkünfte, Multi-Stop-Routen, Varianten) sowie **63** synthetische Designmessungen über sieben Seiten × 390/768/1440 px × Light/Dark/Reduced Motion. `V88_AUDIT_SUMMARY`: DOM-Min 396, DOM-Max 3243, maximaler horizontaler Überlauf **0 px**, erkannte JS-Runtime-Ausnahmen **0**, maximaler einzelner Laborsnapshot-Renderwert **90,5 ms** (kein Real-User-Web-Vital). 8→16 Unterkunftskarten und zwei Vergleichskandidaten bestanden weiterhin. Die CI-Screenshots `quality/v88-overview-1440.png`, `quality/v88-overview-390.png`, `quality/v88-map-390.png`, `quality/v88-discover-390.png` wurden visuell geöffnet und geprüft; Original-Referenzbilder sind weiterhin nicht zugänglich.

**Noch offen:** Exakte manuelle Referenzbildübereinstimmung (Originaldateien privat), iOS-/Android-Geräte, VoiceOver/NVDA, ganze-Farbschema-WCAG-Abnahme, reale Web Vitals und synchronisierte lokale Windows-Dateien. Kein Merge nach `main`, kein Deployment, keine Buchung/Zahlung.

## 3a. V92-Fortsetzung: Mobile Quellennachweise gezielt verbessern

Nach der erfolgreichen V91-Abnahme (Code-HEAD `9405062e`) zeigte das 390px-Labor noch sechs zu kleine Bildquellenlinks auf der Startseite und je einen auf Unterkünfte/Entdecken/Essen. V92 erweitert **nur** die vorhandenen `a.destination-credit`- und `a.hub-hero-photo-credit`-Trefferflächen bei max. 650px auf mindestens 32px Höhe, mit ruhigem Abstand und Tastaturfokus. Andere Links, Fotos, Urheberinformationen, Reisevarianten, Karten, Routen und Daten bleiben unangetastet.

**Gemessen in echter Headless-Chrome-CI:** Vorher-V91 #44912077919: 527/527 Tests, Startseite 6 und Unterkünfte 1 Link(s) unter 24px; nachher-V92 [#44921640348](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44921640348), Code-HEAD `9a157bf1103275172678fdce41146700286f1a3f8`, **success** mit **528/528** portablen Tests, 63 Chrome-Messungen und normalen App-/HTTP-/Routentests. Mobile 390px: Übersicht **6→0**, Unterkünfte **1→0**, Entdecken **2→1**, Essen **14→13** kleine Trefferflächen; weiterhin **0px Überlauf**, **0 JS-Ausnahmen**. Zugehörige Änderungen: `calm-design-v91.css`, `test/calm-design-v91.test.mjs`, `test/quality-audit-v88-browser.mjs`.

**Grenzen:** Ziel ist eine eng begrenzte Verbesserung, keine vollständige 44px-Touch-Target-/WCAG-Abnahme. Bei Essen (13), Tag (8) und Karte (6) bleiben messbar kleinere Sekundärlinks/Details; vor einem weiteren pauschalen CSS-Eingriff müssen deren tatsächliche Bedienelemente und Layouts untersucht werden. Dies ist eine synthetische Chrome-Messung ohne realen iPhone-/Android- oder VoiceOver-Test.

## 4. Lokale Website sicher ansehen

```bat
cd /d "C:\Users\nagog\Documents\Codex\2026-11-12\entwickle-meine-nutzbare-all-in-one"
git status --short
git branch --show-current
git log -1 --oneline
git fetch origin feature/v7-data-day-accommodation-rail
git log --left-right --oneline HEAD...origin/feature/v7-data-day-accommodation-rail
```

Lokale ungesicherte Änderungen oder abweichende Commits **nicht** mit `reset --hard`, blindem `pull` oder erzwungenem Checkout überschreiben. Erst lokalen Stand sichern und Konflikte vergleichen. Erst nach sicherer Synchronisierung: `call Start-Reiseplaner.cmd`; Browser `http://127.0.0.1:4173/?variant=interrail_swiss`.

Zur vollständigen portablen Prüfung: `cd outputs\Reiseplaner`, `npm run check:portable`, `npm run test:quality`, `npm run test:stay-browser`. Die lokale SQLite-Datenbank und private Tripsy-Originale bleiben getrennt.

## 3b. V93 · Eigene Apple-Skill und kleine mobile Bedienelemente

**Referenzkorrektur:** Das eigene GitHub-Repository [goat4321/apple-design-skill](https://github.com/goat4321/apple-design-skill) ist erreichbar. V91 arbeitete mit einer fremden öffentlichen Skill, weil das eigene Repository dort nicht gefunden wurde. Für V93 wurden das eigene SKILL.md sowie die HIG-Referenzen `accessibility.md`, `layout.md`, `typography.md`, `color.md`, `designing-for-ios.md`, `buttons.md`, `menus.md`, `motion.md`, `dark-mode.md`, `maps.md`, `design-principles.md` und `cross-platform.md` tatsächlich gelesen.

**Code:** Eine mobile, gezielte letzte Ebene in `public/calm-design-v91.css` erhöht die interaktive Fläche der gemessenen Sekundärlinks auf mindestens 36px und der betreffenden Disclosure-Zeilen auf mindestens 44px. Fotoattributionslinks auf der Karte behalten ihre Quellennachweise und erhalten mindestens 32px Höhe. Keine neuen Schattentürme, Spring-/Bounce-Effekte, JavaScript-Animate-Observer oder andere künstliche Flächen. Hintergrundfarben ändern sich nur leise bei echter Maus, Tastaturfokus bleibt sichtbar. `prefers-reduced-motion` und `data-motion=off` deaktivieren diese neuen Transitionen.

**Vorher (V92, Chrome bei 390px, hell):** Essen 13, Tagesplan 8, Karte 6, Entdecken 1 unter-24px-Bedienelemente. Konkret: Rezept-/Warenkorb-Sprünge, Produktquellen, Essenskarten-Disclosure, Tagesplan-Links, Karten-Bildquelle und Quellenmenü. **Ziel:** höchstens 2 / 1 / 1 / 1, ohne horizontalen Überlauf. Neue `test/calm-design-v91.test.mjs`-Invarianten und strenge Browser-Assertions prüfen das automatisch.

**Testgrenze:** Diese Notiz dokumentiert die Codeänderung, nicht einen schon bestätigten grünen GitHub-Actions-Lauf. 36px Sekundärlinks bleiben bewusst unter Apples 44pt-Empfehlung für allgemeine Touch-Ziele; wegen der dicht belegten Quellen und Kartenbilder ist es ein Kompromiss, keine vollständige HIG-/WCAG-Abnahme. Browser- und Geräteergebnis muss nach Commit geprüft werden. Daten, vier Varianten, Lizenzen, gespeicherte Planungen, Buchungen, `main` und Deployment nicht geändert.
