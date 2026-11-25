# Phase 31 – Animationen und Interaktivität

Stand 14. November 2026. Entwicklungsbranch feature/v7-data-day-accommodation-rail, PR #5 Draft. Reise- und Buchungsdaten wurden nicht geändert.

## Implementiert

1. Pointer-Ripples am Klickpunkt, Tastatur-Feedback, leicht federnde aktive Buttons, Navigation und Mobile-Dock.
2. Gestaffelte Einblendungen der Startseiten-, Reise-, Orts-, Unterkunfts- und Tageskarten beim Scrollen; ohne JS bleiben alle Inhalte sichtbar.
3. Sanfter Fotoload und Bildzoom für lizenzierte Ortsbilder; auch Bilder in nachträglich geöffneten Dialogen.
4. Auswahlanimation bei Kalender-Tagen, Stopps und Ortskarten; gezieltes Spotlight für Karte und Tagesliste.
5. Merkliste zeigt erst nach tatsächlich erfolgreicher lokaler Änderung ein kurzes Speichern-Feedback.
6. Routenlinien: schematische Städteroute mit Bewegung, abweichende Darstellung für tatsächlich berechnete Fußwege, kurze Fokuseffekte und Pinringe.
7. Drawer, Dialog, Backdrop, Registerkarten, Details und Benachrichtigungen mit kurzen Einblendungen.
8. Formfokus, Kategorien, Tabellen, Fortschrittsbalken, Gruppenstimmen und Routenstopps mit aktionsbezogenem Feedback.
9. Globaler Animationen-ein/aus-Schalter in der bestehenden Seitenleiste; die alte lokale Motion-Einstellung wird wiederverwendet.

## Architektur

- public/motion-polish.css definiert Animationen, Transitionen und globale reduzierte Bewegung.
- public/motion-ux.mjs registriert delegierte Pointer-/Tastaturereignisse, IntersectionObserver sowie tatsächliche Foto-Loadereignisse.
- public/app.mjs bindet die optionalen Effekte an bestehende Render- und Auswahlprozesse an.
- test/motion-ux.test.mjs ergänzt Unit-Tests, test/portable-browser.mjs Browser-Prüfungen.
- Alle Effekte respektieren prefers-reduced-motion sowie den Speicherzustand map-motion=off.
- IntersectionObserver beobachtet maximal 96 Elemente je neuem Szenenkontext. Es gibt keinen permanenten JS-Scrollhandler.
- Es werden keine Routengeometrien, Öffnungszeiten oder bestätigte Buchungen erfunden.

## Prüfstatus

6 von 6 isolierten Motion-Tests wurden aus dem aktuellen GitHub-Quelltext in der V8-Umgebung erfolgreich ausgeführt. Syntax von App und Testdateien wurde geprüft. Ein vollständiger Chrome-Screenshotvergleich dieser Revision ist weiterhin offen, weil GitHub-Actions seit Phase 29 bereits vor dem ersten Workflow-Schritt mit einem Runner-Startfehler abbricht. Der letzte vollständig erfolgreich ausgeführte Browser-Baseline-Lauf ist #43616200064 und stammt aus einem früheren Stand.

Nicht gemergt und nicht deployed.
