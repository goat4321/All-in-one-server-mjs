# Phase 52 – Echte Clubfotos, Tageswechsel ohne Löschen, robustere schlüssellose Karte

**Erarbeitet am 15. November 2026** · Draft PR #5 · Branch `feature/v7-data-day-accommodation-rail` · **`main` unverändert**.

## Ausgangslage

Der Nutzer sah bei „Clubs & Partys“ drei Karten für Razzmatazz, einen optionalen Barcelona-Clubabend und Sala Apolo, aber statt spezifischer Aufnahmen nur dunkle Platzhalter bzw. ein allgemeines Stadtmotiv. Die Tagesplan-Schnellaktion konnte Einträge bereits direkt hinzufügen/entfernen, jedoch nur durch Entfernen und erneutes Hinzufügen auf einen anderen Reisetag verschieben. Bei gescheitertem MapLibre-Import wechselte die Karte zum textreichen OSM-Raster-Hintergrund mit ungünstigen vertikalen Straßenbeschriftungen.

## Änderung 1: Zwei unabhängig dokumentierte Fotos tatsächlicher Clubs

In `public/curated-place-photos.mjs` zwei **objektspezifische Fassadenbilder** mit direkten Commons-Dateibeschreibungsseiten, Fotograf, Lizenz und Hinweis auf CSS-Bildausschnitt eingebunden (kein Hosting oder Download fremder Bilder im Repository):

1. **Sala Apolo**, Barcelona: `083 Sala Apolo, c. Nou de la Rambla 113 (Barcelona).jpg`, Fotograf **Enric**, **CC BY-SA 4.0**, Originalaufnahme 2025. Quelle: https://commons.wikimedia.org/wiki/File:083_Sala_Apolo,_c._Nou_de_la_Rambla_113_(Barcelona).jpg . Das Foto dokumentiert die Fassade mit der **113**, während Betreiberquellen zuvor **113/107** je nach Teilseite auswiesen; dieser Quellenkonflikt bleibt ausdrücklich bestehen.
2. **Sala Razzmatazz**, Barcelona: `0 - Sala Razzmatazz - facade.JPG`, Fotograf **Jordiferrer**, **CC BY-SA 3.0**, Aufnahme 2013. Quelle: https://commons.wikimedia.org/wiki/File:0_-_Sala_Razzmatazz_-_facade.JPG . Gebäudeaufnahme, **kein Clubprogramm 2027**.

Beide sind in der vorhandenen Lizenz-/Fotocredit-Pipeline `curatedPlacePhoto` abrufbar. Die UI zeigt weiterhin Bildquelle, Verfasser und Lizenz sowie das urheberrechtlich relevante Zuschneiden.

## Änderung 2: Tagesplanung ohne Umweg und besserer Überblick

- `public/day-plans-ui.mjs`: Im kompakten Aktionsbereich oberhalb der Timeline gibt es zusätzlich „N Tagesideen übernehmen“, sofern bislang nicht übernommene **nicht-optionale** Tagesideen vorhanden sind. **Keine festen Zeiten und keine Buchung** werden erzeugt. Die recherchierten 46 Tagespläne bleiben unterhalb des Tagesablaufs und über einen Sprunglink erreichbar.
- `public/day-quick-edits-v50.mjs`: Neue Aktion `move` für bestehende, nicht gebuchte/gesperrte Aktivitäten. Sie erlaubt **nur andere passende Reisetage derselben Stadt**, setzt den Plan auf den neuen Tag und **setzt alte Start-/Endzeiten auf null**, statt einen Termin aus einem anderen Tag falsch zu übertragen. Bereits vorhandene andere Nutzereingaben bleiben erhalten.
- `public/browse-hub-v35.mjs`: Eingetragene Aktivitäten erhalten neben der Tageswahl jetzt **„Tag ändern“ und „Entfernen“**, ohne den Umweg über einen Formular-Dialog. `public/app.mjs` speichert diese Auswahl über dieselbe bereits vorhandene undo-fähige Speicherung wie „Hinzufügen“.
- `public/readability-day-v50.css`: Neue Aktionsbuttons sind kompakt, klar beschriftet und responsiv.

## Änderung 3: OpenFreeMap-Vektorkarte vor unruhigem OSM-Raster bevorzugen

- Keine Kosten- oder API-Schlüsselannahme: **OpenFreeMap Positron** bleibt der kostenlose Vektor-Hintergrund. Raster OpenStreetMap bleibt ehrlicher, interaktiver Notfall-Fallback.
- `public/vector-basemap.mjs`: Ein erstgenannter, fest gepinnter Browsermodulimport von `@maplibre/maplibre-gl-leaflet@0.1.4` über **unpkg** wird bei Netz-/Modulfehlern um eine zweite **jsDelivr**-Quelle ergänzt. Erst danach greift der bisherige Raster-Fallback.
- `server.mjs`: Die bestehende Content Security Policy wurde ausschließlich für `https://cdn.jsdelivr.net` im Modul-Script- und Connect-Kontext ergänzt. Andere Fremdquellen bleiben blockiert.
- **Grenze:** Dieser Fallback kann eine blockierte Modul-CDN-Verbindung beheben. Er ersetzt kein WebGL/MapLibre und garantiert nicht, dass der Browser in jedem Netz den Vektorstil anzeigen kann. Straßenbeschriftungen auf den **fertigen Rasterkartenkacheln** lassen sich mit CSS nicht individuell entfernen.

## Qualitätssicherung

- `test/nightlife-quality-v51.test.mjs` jetzt mit exakten Bildquellen und Lizenzmetadaten sowie Batch-Adopt-Nachweis.
- `test/day-quick-v50.test.mjs`: Neuer Test zu Tag verschieben, Stadtvalidierung, Terminlöschung, gebuchter Aktivität und unveränderter anderer Tagesplanung.
- `test/portable-browser.mjs`: Auf echte importierte Club-Aktivität `uploaded:v50:new_036` bezogene Add → Move → Remove-Testsequenz; DOM- und Bildquellenprüfung, neuer Screenshot `52-clubs-mit-echten-lizenzierten-fassadenfotos-desktop.png` und `52-clubabend-auf-anderen-reisetag-verschoben.png`.
- `test/keyless-basemap.test.mjs`: Beide API-keylosen Modul-CDNs und explizite CSP-Erlaubnis, keine CARTO-Abhängigkeit.
- Browser-Prüfläufe werden mit dem finalen Stand erneut ausgeführt und separat im PR kommentiert.

**Weitere offene Punkte:** Die 105 Einträge aus dem Nutzerpaket tragen überwiegend nur selbst deklarierte Verifikationslabels, bei vielen fehlen unabhängige Originalquellen oder exakte Eingangskoordinaten. September-2027-Eintritts-/Angebotsbedingungen und Veranstaltungen sind nicht bestätigt; kein ungesicherter Preis wurde automatisch buchbar gemacht.
