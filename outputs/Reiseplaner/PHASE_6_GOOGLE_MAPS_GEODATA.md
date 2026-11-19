# Phase 6 – Google Maps, ÖPNV-Verknüpfung und Ortsrecherche

**Datum:** 13.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · Draft-PR #5.

## Ergebnis: Google Maps ohne erfundene Koordinaten

Die bestehenden Seiten (Karte/Explorer, Unterkünfte, Entdecken, Quellen- und Kartendetails, Bahn und Mehrstopp-Tagesplan) verwenden `public/google-maps.mjs`. Für jede katalogisierte Aktivität, Unterkunft, Gastronomie- und Einkaufsoption sowie die Verkehrseinträge ist eine Google-Maps-Suche verfügbar; auf den relevanten Seiten gibt es zusätzlich die Google-Maps-ÖPNV-Anreise bzw. A→B-Verbindung.

Google Maps URL-Schema: `https://www.google.com/maps/search/?api=1&query=...` und `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=transit`. Für URLs ist **kein Google Maps API-Schlüssel** erforderlich. Quelle: https://developers.google.com/maps/documentation/urls/get-started

Präzision: Beim vorhandenen geprüften POI-Punkt kann die Quelle die Koordinate übergeben. Bei bekannter Straßenadresse wird nach Name/Adresse/Stadt gesucht; fehlt die Adresse, nach Name/Stadt. Bei Airbnb-Wunschlisten wird ausschließlich die Ortsumgebung verlinkt, niemals ein angeblich exakter Eigentumswohnungsstandort. Eine Google-Suche allein **beweist keinen Treffer** und führt nicht zu einer automatisch importierten Koordinate.

Die interne Routenberechnung setzt weiter belastbare Koordinaten und ein gültiges Fuß- bzw. Fahrplanpaket voraus. Für Orte ohne exakte Koordinaten können Start und Ziel dennoch an Google Maps übergeben werden. Google Maps berechnet erst beim Öffnen eine Verbindung für den dort gewählten Verkehrstag; keine Verfügbarkeit oder Fahrtzeit 2027 wird behauptet.

## Erweiterte Kartenabdeckung

Die vorangegangene, technische Zählung blendete Einträge mit Positionierungsproblemen aus. Diese sind nun als **unlokalisierte, gekennzeichnete Kartenlisten-Einträge** sichtbar.

| Varianteübergreifende Zählung | Vorherige Implementierung | Jetzt |
| --- | ---: | ---: |
| Gelistete Einträge über die vier Varianten | 534 | 642 |
| Bestehende Koordinaten | 143 | 143 |
| Ohne genauen Kartenpunkt | 391 | 499 |

**Interpretation:** +108 bislang unterdrückte, ungeklärte (einschließlich mehrfach verwendeter Airbnb-)Kandidaten sind wieder sichtbar. Es sind weder 642 einzigartige POIs noch 499 unterschiedliche Stellen. Der Schritt erzeugt keine neuen geprüften Koordinaten.

## Punkt-für-Punkt-Quellenprüfung

`scripts/geo-research-v05.mjs` erzeugt eine einmalige Kandidatenprüfung anhand der in allen Varianten fehlenden Punkte. Nur **namentlich** gesuchte POIs innerhalb eines räumlich beschränkten Gebietes werden bei OpenStreetMap/Overpass angefragt; private Airbnb-Adressen werden nie durch geratenes Geocoding ersetzt. Präzise Straßen-/Hausnummernübereinstimmung wird von bloßer Namensgleichheit getrennt. Ergebnisformat `data/research-v05/osm-candidates.json` mit `verified`, `review`, `unmatched` und `failed`.

Die getrennte GitHub-Action `reiseplaner-geo-research.yml` ist ein **nur explizit auszuführender Einmalprozess**; keine automatische Bulk-Geokodierung bei jedem PR-Commit. Verwende keine unbegrenzten wiederkehrenden Requests. Begrenzung der öffentlichen Infrastruktur beachten, insbesondere https://wiki.openstreetmap.org/wiki/Overpass_API. Kandidaten dürfen erst nach Einzelprüfung und Datenabgleich in die Karte übernommen werden. Verifizierte Objekte können Geometrie-Mittelpunkte statt zugängliche Eingänge sein.

## Tests

- `test/google-maps.test.mjs`: Google Maps für alle Optionen, URL-Länge, Fallback ohne Koordinaten, intermodale Verbindungen, Airbnb-Ortsbereich.
- `test/portable-browser.mjs`: Kartensuche, ÖPNV-Weiterleitung, mehrstufiger Tagesplan und weitere End-to-End-Ansichten.
- GitHub Actions Run 43387242639: **50/50 Modelltests**, Chrome-Browsertest, Datenprüfung und Server-Smoke-Test bestanden (Stand dieser Dokumentationsrunde).
- Die historischen Tripsy-Originaldateien wurden weiterhin nicht auf dem Windows-Zielrechner gegengetestet.

## Noch offen

Die **vollständige Verifizierung der 499 variantenbezogen unlokalisierten Einträge** ist nicht mit Google-Maps-Links gleichzusetzen. Eine vollständige belastbare Datenbank aller genauen Geokoordinaten, 2027er Öffnungszeiten und Fahrtzeiten erfordert Einzeltreffer, Plausibilisierung, Anbieterprüfung und ggf. neue Datenquellen. Google Maps selbst liefert durch Links keine API-Daten an den Reiseplaner.

Kein Merge nach `main`, kein Deployment, keine Buchung, kein Austausch privater Originaldaten.
