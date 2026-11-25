# V97 – Mehr Bewegung, ohne Bedienbarkeit zu beeinträchtigen

**Code-HEAD:** `47040dba6d9d3bb4f4e5def7843cfc2a14e511a3` · **CI:** [#45074473280](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45074473280) **success**, 554/554 portable Node-Tests, 63 Chrome-Labormessungen, 0 px Overflow und 0 JS-Ausnahmen. Änderungen ausschließlich in `outputs/Reiseplaner/`, Branch `feature/v7-data-day-accommodation-rail`, PR #5. Keine Änderung an `main` oder Deployment.

## Ausgangslage und Referenz

Die ursprüngliche V91-Bewegung war absichtlich stark eingeschränkt (230 ms Reveal nur bei vier Seitenkopftypen; Fotoladeanimation deaktiviert; gespeicherte Orte ohne visuelles Feedback). Die Nutzeranforderung V97 war, im gesamten Reiseplaner mehr Animationen und einen flüssigeren Eindruck zu erhalten. Referenz war die eigene Skill `goat4321/apple-design-skill/references/hig/motion.md`: Bewegung soll kurz, zweckgebunden, optional, jederzeit unterbrechbar und nicht nur dekorativ sein.

## Implementierung

1. **Seiten-/Tages-/Stadtwechsel:** `public/motion-ux.mjs` fügt `motion-scene-enter` nur bei einer echten Änderung von `motionSceneKey` dem `main.workspace` hinzu. CSS: 285 ms Opazität + 7 px Eintritt, ohne CSS-Layoutreflow. Kartenansicht ist ausdrücklich ausgeschlossen. Reine Filter- und Texteingabe-Rerenders spielen die Scene-Animation nicht ab.
2. **Abschnitte beim Eintritt in den sichtbaren Bereich:** 345 ms Fade/Translate (9 px), optional bis zu zwölf strukturelle Elemente pro Scene, begrenzt auf Hero, Überschrift, Suche, Timeline und verwandte Kapitel – **nicht** Hunderte Karten. `IntersectionObserver`, kein versteckter Inhalt bei fehlendem Observer.
3. **Fotos:** 240 ms Lade-Fade für bereits vorhandene lizenzierte Bildquellen, 2,8 % Bild-Zoom bei Maus-Hover nur mit `hover:hover` und `pointer:fine`, ohne die Karten selbst zu verschieben. Fehlende externe Fotos werden nicht als vorhanden fingiert.
4. **Interaktion:** Buttons/Chips 95–175 ms Farb-/Press-Feedback, minimales Drücken `scale(.985)`, Mobile-Dock-Icon-Fokus. Keine Click-Ripple-DOM-Erzeugung.
5. **Aufklappbare Informationen / Auswahl:** 235 ms Eintritt von geöffneten Detailtexten, kurzer nicht endloser Feedbackring bei gespeichertem/ausgewähltem Ort; Budgetbalken 420 ms nur beim echten Scene-Eintritt. Kein künstlicher Buchungserfolgs-Effekt.
6. **Barrierefreiheit:** Die vorhandene Systemeinstellung `prefers-reduced-motion:reduce` sowie `data-motion=off` setzen neue Animationen und Zoom/Press-Transformationen außer Kraft. Sichtbare Textinformationen, Fokuszustände, Map-Controls, Reisen, Budgetdaten und Bildquellen bleiben unverändert.

## Testausführung

- GitHub Actions [#45074473280](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45074473280): **554/554** portable Tests, **63** echte Chrome-Labormessungen für 7 Ansichten × 390/768/1440px × Light/Dark/Reduced Motion; **0 px** horizontaler Überlauf, **0** JS-Ausnahmen.
- Gemessene normale Content-Seitenübergänge: `v97-scene-in` mit **0,285 s** auf Übersicht, Tagesplan, Unterkunft, Entdecken, Essen und Daten.
- Kartenansicht: **kein** kompletter Scene-Transform, stattdessen höchstens selektive Inhalts-Reveals.
- Unit-Tests prüfen, dass Filter-Rerenders den Scene-Effekt nicht wiederholen, Map keinen Scene-Transform bekommt und Reduced Motion keine Observer/Scene-Klassen setzt. Browser prüft tatsächliche CSS-Animationsdauer und OS-Opt-out.
- Zwei zwischenzeitliche CI-Fehler wurden korrigiert: eine zu breite Test-Regex und die Testreihenfolge beim Umschalten von Reduced Motion. Anschließend nötige CSS-Spezifität der OS-Abschaltung korrigiert.

## Offen / nicht behaupten

Keine echte iPhone-Safari-/Android-Touchabnahme, kein Real-User-FPS-/Web-Vitals-Tracking, keine online verifizierten Wikimedia-Bildladequoten, keine vollständige WCAG/HIG-Zertifizierung. Animationen im echten Browser nach lokalem Git-Abgleich und Start von `Start-Reiseplaner.cmd` ansehen; GitHub-Screenshots sind statisch und können die Animationen nicht darstellen. `main`, Deployment, private Tripsy-Daten und ungespeicherte lokale Windows-Dateien wurden nicht verändert.
