# Phase 44 · Kartenkoordinaten, Sammelmarker und Routenbewegung (15.11.2026)

## Tatsächlich umgesetzte Änderungen

- **10 zusätzliche öffentlich belegte Orientierungspositionen** im bestehenden V20-Aktivitätenarchiv. Vorher 35/57, jetzt **45/57** mit Quellenkoordinate. Vorhandene 24 gesondert geprüfte Besuchs-/Tarif-Einzelnachweise werden nicht durch die neuen reinen Standortreferenzen künstlich erhöht.
- Die Kartenprüfung der vier Reisevarianten meldet **829 Einträge, 554 Kartenpunkte und 275 ohne individuellen Kartenpunkt** (vorher 829/535/294). Varianten können denselben öffentlichen Ort mehrfach verwenden.
- Stadt-Sammelmarker für noch offene Positionen zeigen eine **neutrale Anzahl mit „offen“ statt „?123“**. Diese Sammelmarker sind keine Einzelobjekte, keine Rechenpunkte für Fußwege und keine Unterkunftsadressen.
- Ein aktiver berechneter Fußweg zeigt ein kompaktes Label (Gehzeit und Meter) auf dem **geometrischen Streckenmittelpunkt nach Segmentlänge**; ein bloßer Koordinatenmittelpunkt wäre bei Kurven irreführend. Die CSS-Richtungsbewegung gilt nur für wirklich berechnete Fußweg-Geometrie, nicht für gestrichelte Luftlinien. „Bewegung reduzieren“ und der appinterne Aus-Schalter werden respektiert.
- Routenqualität und Quellennachweis bleiben getrennt: Eine echte OSRM-Geometrie beweist keinen geprüften Eingang. Bei Gebiets- und Anbieterpunkten gibt der bestehende Route-Studio-Qualitätshinweis weiter Auskunft.

## Neue Georeferenzen, Quellen und Grenzen

| ID | Stadt | Aktivität | Punkt / Quellenbezug | Nachweis |
|---|---|---|---|---|
| act-015 | Barcelona | Poblenou Café- und Straßenrunde | Rambla del Poblenou als Orientierung, kein bestimmtes Café | https://www.barcelonabusturistic.cat/es/la-rambla-del-poblenou |
| act-028 | Nizza | Abendrunde Port Lympia | Port-Lympia-Haltepunkt als Ausgangspunkt, keine vollständige Hafenrunde | https://mapcarta.com/fr/N7057879201 |
| act-031 | Genua | Corso Italia 2,5 km | Piazza Raffaele Rossetti als Orientierung; 2,5 km nicht als bestätigte Geometrie | https://mapcarta.com/W57966151 |
| act-038 | Venedig | Cannaregio-Abendrunde | Ponte delle Guglie als Startpunkt, nicht der vollständige Weg | https://mapcarta.com/W555651485 |
| act-046 | Appenzell | Seealpsee-Picknick | Berggasthaus Seealpsee als öffentliches Gebäude, nicht individuell gewählter Picknickplatz | https://www.deine-berge.de/POI/Hotel-Pension/Schweiz/Appenzeller-Alpen/Hoehe-1150m/3959/Berggasthaus-Seealpsee.html |
| act-047 | Glarus | Klöntalersee-Uferroute | Güntlenau-Park-/Uferstart, nicht Wanderweg | https://parkandhike.ch/parkplatz/kloental/ |
| act-051 | Grindelwald | Eigerblick-Dorfrunde | Bahnhof Grindelwald als Start, kein bestimmtes Café | https://www.outdooractive.com/de/poi/jungfrau-region/bahnhof-grindelwald/1283975/ |
| act-052 | Grindelwald | First Flyer | Bergstation Grindelwald-First, kein verifizierter separater Flyer-Eingang | https://www.bergbahnen.org/de/datenbank/seilbahn/581/ |
| act-054 | Kandersteg | Oeschinensee-Seepause | Berghaus am See, nicht Uferzugang oder Seilbahnstation | https://www.outdooractive.com/r/43484396 |
| act-055 | Kandersteg | Dorfnachmittag | Bahnhof Kandersteg als Start, kein individuelles Café | https://geofinder.ch/28509 |

Alle zehn Datensätze erhalten `geoSourceUrl`, `geoNote`, `pointPrecision`, `reviewedOn` und `isCentroid:true`: Das bedeutet einen Orientierungspunkt auf einem öffentlichen Gebäude, benannten öffentlichen Ort, Bahnhof oder Flächenbezug. **Es ist nicht die Zusicherung eines konkreten Eintritts, Treffpunkts oder vollständigen Wegverlaufs.**

## Noch offen / Qualitätsanforderungen

1. **275 variantenspezifische Einträge ohne individuellen Kartenpunkt** sind keine einheitliche offene Koordinatenliste; darunter sind private Airbnb-Adressen, nicht ortsfeste Aktivitäten, Transportprodukte und öffentliche Adressen ohne unabhängigen GPS-Beleg. Keine hypothetischen Hausnummern als genaue Kartenpunkte übernehmen.
2. Für **12 der 57 V20-Aktivitäten** bleibt mangels exakt gewählten Wegstarts, Anbieter- oder Treffpunkts ein einzelner Pin nicht gerechtfertigt; die noch nicht modellierte Stadt Montpellier bleibt bewusst ein Alternativstopp und wird nicht in die Route eingeschleust.
3. Eine **online mit echten OpenFreeMap/OSM-Kacheln und Fotos geladene Smartphone-Karte** ist noch nicht manuell abgenommen: Die portable Chrome-CI prüft Darstellung und Bedienbarkeit, externe Bilder/Kacheln können im Testumfeld fehlen.
4. Die tatsächlich **vier privaten Tripsy-Originaldateien** wurden nicht in GitHub-CI getestet. Keine Buchung, Preise, Plätze, September-2027-Fahrpläne oder exakten Unterkunftszugänge dadurch bestätigt.
5. Nächste sinnvolle UX-Stufe: Gebäude- und Routing-Eingänge im Detail getrennt anzeigen, Routen-Timing auf realen Fußwegen in der aktiven Stadt mit echten Kacheln testen, bei bestätigter öffentlicher Adresse ohne GPS den Anbieterstandort manuell gegen OSM/Photon prüfen statt blind zu geokodieren.

## Prüfstand

- Node-Modelltests einschließlich neuer Geodaten-, Streckenmittelpunkt- und Schematisch-/Real-Trennung.
- Geocoding-/Katalog- und Servervalidator, Offline-Chrome-Desktop-/Mobilregression, API-Smoke-Test, Karten-Abdeckungsbericht.
- GitHub Actions Run: https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43719027362 — **245/245 Tests bestanden** bei Code-Stand `c3f8314c4432d2a344b03a477bbe6d423470c915`; Dokumentations-/Screenshot-Änderungen danach separat prüfen.
- `main` bleibt unverändert; PR #5 bleibt ein Draft.
