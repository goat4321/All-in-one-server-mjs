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

## 3. Vorher/Nachher und Grenzen

**Vorher (V90, bestätigter CI #44883548630):** alte `motion-ux.mjs` beobachtete bis zu **96** Karten-/Panel-Elemente pro Szene und erzeugte pro Pointer-Klick zusätzliche Ripple-DOM-Knoten; `motion-polish.css` hatte u. a. Hover-Lift `translateY(-3px)`, Kartenzoom `scale(1.065)`, Pop/Bounce und gewichtige Shadows. Die Unterkunft hatte trotz vorhandener V90-Paginierung 1.517 initiale DOM-Elemente bei 390px; diese technische Paginierung wird nicht verändert.

**Nachher (Code-Invarianten):** max. zwölf Observer-Ziele (vorher 96, Obergrenze **−87,5 %**); nur noch Seiteneinstiege statt Karten, **null** neue Ripple-DOM-Knoten; kein erzwungenes Spotlight-`offsetWidth`. Hover-Lift für Karten entfernt, optionaler echter Maus-Fotozoom von 6,5 % auf 1,8 % begrenzt. Diese Zahlen beschreiben **CSS/JS-Verhalten**, keine gemessene echte FPS-/INP-/LCP-Geschwindigkeit.

**Teststatus:** Die neue CI muss auf dem letzten dokumentierten HEAD separat bestätigt werden. Bestanden/nicht bestanden ist **nicht** aus einem früheren V90-Lauf ableitbar. Die vorhandene Chrome-Testpipeline führt Syntax, portable Tests, HTTP und API-Smoke, Browser-Funktionen, drei Breiten, Themen und Reduced Motion sowie Screenshot-Artefakte aus. Beim letzten erfolgreichen Vorgänger waren es 520/520 portablen Tests; V91 fügt sechs hinzu. Neue UI-Browserwerte aus `V88_PAGE` und `V88_AUDIT_SUMMARY` sind anhand des tatsächlichen finalen CI-Laufs nachzutragen/zu melden.

**Noch offen:** Exakte manuelle Referenzbildübereinstimmung (Originaldateien privat), iOS-/Android-Geräte, VoiceOver/NVDA, ganze-Farbschema-WCAG-Abnahme, reale Web Vitals und synchronisierte lokale Windows-Dateien. Kein Merge nach `main`, kein Deployment, keine Buchung/Zahlung.

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
