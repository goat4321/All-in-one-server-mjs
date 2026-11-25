# Phase 64 – schnellere Kartenansicht und neue Orts-Piktogramme

Stand: 16.11.2026. Branch: `feature/v7-data-day-accommodation-rail`, PR #5. Nicht in `main` gemergt oder öffentlich deployed.

## Visuelle Referenzanalyse

Die bereits bereitgestellten Referenzen wurden erneut als Bilder inspiziert:
- `Barcelona-Reise im grünen Reiseplaner.png`: klare, schwebende Karten-Pills, feine runde Ortsymbole, Fotos erst bei relevantem Zoom, grüne Routen, kurze beschriftete Reiseabschnitte
- `22-reference-city-map-1440.png`: aktuelle Website-Karte mit zahlreichen rein numerischen Clustern und **blauen H**, grünen A und orangen R als unattraktiven Einzelmarkern
- `19-reference-day-map-mobile-390.png`: mobile Karte mit großen orangefarbenen **R**-Pins, obwohl Piktogramme das Ziel sofort verständlicher vermitteln könnten

Die konzeptionelle Barcelona-Grafik enthält teils nur beispielhafte Fotomotive, Ratings, Wege und Live-Öffnungszeiten. Diese dürfen nicht als überprüfte Informationen in den Reiseplaner übernommen werden.

## Tatsächliche Ladeursachen

1. `public/app.mjs render()` zerstörte bei jedem Zustand-/Filterwechsel die vollständige `TripMap`-Instanz. Das löste erneutes Leaflet-Setup, Kartenlayer und ggf. WebGL-Neuinitialisierung aus.
2. `TripMap` begann den externen MapLibre-Adapter zu laden, bevor überhaupt ein schneller lokaler Kartenhintergrund sichtbar war. Import-Versuche gegen zwei fremde CDNs und ein Vektor-Stil-Timeout konnten das Rendering unnötig verzögern.
3. Externes MapLibre-CSS wurde im HTML-Kopf als normales render-blockierendes Stylesheet geladen, obwohl die Vektorkarte nur eine spätere Erweiterung ist.
4. Die Markerrenderfunktion gruppierte zwar Daten, erzeugte aber auch für nicht sichtbare Ortsmarker Leaflet-DOM. Bei Kartenbewegungen und Ortsauswahlen wurden unnötig große Markergruppen neu aufgebaut.
5. Für die Karte wurden SVG-Glyphen durch abstrakte Unicode-Zeichen wie `▣` und Kategorienbuchstaben wie `H/R/A` ersetzt, die weder einheitlich noch passend zum Referenzdesign waren.

## Umsetzung

### Kartengeschwindigkeit

- Die echte Leaflet-DOM und Map-Instanz bleiben erhalten, wenn die Kartenansicht beim Rendern weiter vorhanden ist: keine erneute Basiskarten-Netzwerkinitialisierung bei Filtern, Tagwechseln oder Auswahländerungen.
- Kartenposition und Zoom bleiben bei `restoreView` erhalten; ein bewusster neuer Seiten-/City-Wechsel darf weiterhin den relevanten Ausschnitt anpassen.
- Der erste echte `fit()` setzt das Kartenfenster, **danach** startet sofort der freie OSM-Rasterhintergrund. Die nachgelagerte MapLibre-Vektoransicht kann ihn nur bei erfolgreichem Stil-Load ersetzen.
- Das externe MapLibre-CSS wird nicht mehr im HTML-Head geladen. Bei Bedarf lädt `vector-basemap.mjs` es dynamisch gemeinsam mit dem optionalen MapLibre-Adapter.
- Marker werden mit 22 % Puffer auf den sichtbaren Kartenausschnitt begrenzt. Die Originaldaten bleiben für Suche, Merkliste und Kartenzentrierung vollständig vorhanden.
- Das Verschieben der Karte rendert nur die aktuell relevanten Marker; ein einfacher Pin-Klick verändert den ausgewählten Marker direkt und rekonstruiert nicht alle POI-Marker.
- Die vielen Marker-Eintrittsanimationen entfallen, inklusive Berücksichtigung von `prefers-reduced-motion` und der site-eigenen Bewegungsvorgabe.

### Piktogramme

Alle Icons sind selbstständig mit inline SVG gespeichert, ohne externe Font-/Icon-Bibliothek:

| Typ | Tatsächliche Darstellung |
|---|---|
| Unterkunft | Haus mit Tür statt blauem `H` |
| Restaurant | Gabel/Besteck statt `R` |
| Supermarkt/Einkauf | Einkaufstasche statt `S` |
| Sehenswürdigkeit, allgemein | Kompass statt `A` |
| Bahnhof/Transport | Zug statt `B` |
| Park/Garten | Baum |
| Strand | Wellen/Wasser |
| Museum/Galerie | Museum/Säulen |
| Club/Nachtleben | Musiknote |
| Aussicht/Wanderung/Schlucht | Bergsilhouette |

Bei Einzelmarkern, Fotomarkern und gleichartigen Clustern wird dieselbe visuelle Sprache verwendet. Normale **numerische Tages- und Stoppreihenfolgen bleiben Zahlen**; gemeinsame oder unterschiedliche Ortscluster tragen weiterhin echte Anzahlen und werden nicht als einzelne überprüfte Orte ausgegeben. Farbpalette: Salbeigrün, helles Blau, gedämpftes Orange, Ocker und Lavendel. Das Quellenqualitätskennzeichen (gestrichelt/gepunktet/neutral) bleibt unverändert.

## Dateien

- `public/map-marker-icons-v64.mjs`: einheitliche SVG-Piktogramme, Schutz gegen unsichere dynamische SVGs, Kategorie-Untertyp-Erkennung
- `public/photo-map-model.mjs`: Piktogramme in kleinen Karten- und Fotoblasen
- `public/map.mjs`: Raster zuerst, viewport-basierte Marker-Auswahl, kleine Clusterpiktogramme und schnelle Auswahl ohne vollständiges Repaint
- `public/app.mjs`: bestehende Leaflet-Instanz beim Seitenrendern erhalten, nur bei tatsächlich nicht mehr sichtbarer Karte zerstören
- `public/vector-basemap.mjs`, `public/index.html`: externes CSS erst bei Vektorupgrade statt beim HTML-First-Paint
- `public/map-symbols-performance-v64.css`: Icon-Palette, SVG-Größen, Cluster-Layout und Animationseinschränkungen
- `test/map-symbols-performance-v64.test.mjs`: sieben neue Regressionstests, Browserintegrationstest sichert DOM-Identität bei Kartenmodus-Wechsel

## Abnahme und noch offene Messungen

- 365 Node-Tests grün, darunter neue Icon-, Sicherheits-, Raster-/Performance- und Seitenstrukturtests.
- Die GitHub-Chrome-Abnahme kontrolliert tatsächlich, dass beim Wechsel des Kartenscopes **dieselbe #map-DOM-Instanz** erhalten bleibt.
- Externe Kartenserver können trotzdem langsam oder vorübergehend unerreichbar sein. Die genaue Zeit bis zum ersten vollständig sichtbaren OSM-Kartenkachelbild kann nur mit einem **Online-Netzwerkprofil und realer Verbindung** gemessen werden. Die CI-Browserabnahme verwendet absichtlich `?offlineMap`, um stabil und reproduzierbar zu bleiben. Deshalb ist aus diesen Tests keine seriöse vorher/nachher-Reduktion in Sekunden oder Prozent ableitbar.
- Ein bereits öffentlich bereitgestellter Build aktualisiert sich nicht durch einen GitHub-Branch-Commit. Der Branch muss vor Live-Beurteilung gemergt und gegebenenfalls neu deployed werden.
