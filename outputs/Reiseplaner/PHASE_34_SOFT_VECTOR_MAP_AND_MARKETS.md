# Phase 34 – Foto-Bubbles, Vektorkarte und Supermärkte

Stand 14. November 2026. Änderungen im Entwicklungsbranch feature/v7-data-day-accommodation-rail, Pull Request #5.

## Verbindliche Bildreferenz

Das Nutzerfoto zeigt eine sehr helle Pastellkarte mit Grünflächen, dezentem Blau für Wasser, Foto-Kreis-Markern, weißen Bildrändern, Kategorienchips und Ortsnamen direkt unter den Bildern. Seine Sternbewertungen, Fotos und Ortskoordinaten sind keine Datenquelle für die anderen Reisestädte.

## Implementierung

1. Die alte Rasterquelle tile.openstreetmap.org wurde entfernt. Im Browser wird unmittelbar CARTO Positron/Light angezeigt. Optional wird MapLibre GL JS mit OpenFreeMap Positron als Vektorstil zugeschaltet; falls WebGL, CDN oder Vektordaten nicht laden, bleibt die helle Ersatzkarte sichtbar. Beide freien Anbieter verwenden weiterhin OSM-basierte Geodaten, aber nicht das klassische OSM-Kartenbild.
2. Zoom unter 11: einfache Punkte und Cluster. Ab 11: Kategorie-Icons. Ab 14,2: maximal 24 große, kreisförmige Foto-Bubbles mit kurzen Namen und Kategoriechips, ausschließlich mit zuvor konkret zugeordneten Wikimedia-Commons-Motiven.
3. Eine Bewertung erscheint nur, falls sie im jeweiligen Datensatz als Zahl von 0 bis 5 vorhanden ist; keine erfundenen Bewertungen.
4. Große Buttons Alle Kartenpunkte und Stadtansicht wechseln zwischen allen tatsächlich vorhandenen Koordinaten der Reise und dem aktiven Reiseort. Nicht exakt geolokalisierte Einträge erhalten keinen erfundenen Kartenpin.
5. Der Schalter Supermärkte anzeigen lädt bei Bedarf Lebensmittelgeschäfte über die lokale Route /api/supermarkets?city=... . Der Server erlaubt nur bereits vorhandene Reiseorte und speichert Abfrageergebnisse 24 Stunden. Beim Wechsel in eine andere Reisestadt wird bei eingeschaltetem Filter nachgeladen.
6. Die OpenStreetMap/Overpass-Suche berücksichtigt derzeit einen Radius von 6,5 km um den vorhandenen Ortsmittelpunkt und maximal 160 Einträge. Diese Quelle liefert keine vollständige Liste aller Geschäfte der Großstadt. Flächen-Mittelpunkte sind keine bestätigten Ladeneingänge, Öffnungszeiten und Geschäftsbetrieb nicht geprüft.
7. Eigene Marker-, Quellen- und Zoom-Tests liegen unter test/map-photo-v34.test.mjs. Zusätzlich gelten prefers-reduced-motion und die vorhandene Bewegungsabschaltung.

## Datenquellen und Betrieb

OpenFreeMap-Stil: https://tiles.openfreemap.org/styles/positron
OpenFreeMap-Einbindung: https://openfreemap.org/quick_start/
MapLibre-Leaflet-Adapter: https://github.com/maplibre/maplibre-gl-leaflet
Supermärkte: https://overpass-api.de/api/interpreter (nutzerinitiierte Abfrage)
Geschäfte: https://www.openstreetmap.org/copyright
Fotos: geprüfte Wikimedia Commons File-Seiten aus public/curated-place-photos.mjs.

## Einschränkung

Eine vollständige neue Browseraufnahme nach Phase 34 liegt bislang nicht vor. GitHub Actions scheitert teils bereits vor dem ersten ausgeführten Workflow-Schritt. Live-Geodaten und der externe Vektorstil benötigen Internetzugang auf dem Nutzergerät. Es wird keine pixelgenaue Übereinstimmung, Echtzeit-Öffnung oder Vollständigkeit aller Supermärkte behauptet.

## Betroffene Dateien

public/map.mjs, public/map-photo-v34.css, public/vector-basemap.mjs, public/photo-map-model.mjs, public/index.html, public/views.mjs, public/app.mjs, public/explorer-ui.mjs, lib/supermarket-source.mjs, server.mjs, package.json, test/map-photo-v34.test.mjs.
