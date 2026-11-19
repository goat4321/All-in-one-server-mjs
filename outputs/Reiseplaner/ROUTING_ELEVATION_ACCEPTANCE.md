# Routing und GPX-Höhenprofile – Prompt 05 (19.11.2026)

**Basis:** Prompt 04, Branch `chat/route-story-pins-2026-11-19` (CI erfolgreich). Isolierte Umsetzung auf `chat/routing-elevation-2026-11-19`. Kein Merge, kein Deployment; privater Windows-HEAD unbekannt.

## Gültige Datengrundlagen und echte Prüfgrenzen

| Modus | Belegtes Verfahren | Verfügbarkeit / Cache | Nicht behaupten |
| --- | --- | --- | --- |
| Zu Fuß | Bestehendes `POST /api/walk` mit FOSSGIS `/routed-foot/`, `steps[].mode=walking`, validierten Endpunkten und vorhandener SQLite-Cachetrennung | Nur Einzelanfragen, ≤25 km direkte Entfernung, 1,05 s Abstand; zusätzlich unveränderte geprüfte Seed-Routen | Keine Gehminuten aus Luftlinie, kein garantiert geöffneter Weg |
| Fahrrad | Neues `POST /api/bike` mit **anderem FOSSGIS-Profil** `/routed-bike/`, voller GeoJSON-Linie, tatsächlicher Streckenlänge und Anbieterdauer; Endpunkte müssen innerhalb von 75 m liegen | Nur gleicher Reiseort, Luftlinie ≤80 km; gemeinsamer Router-Limiter ≥1,1 s; höchstens 100 Bike-Caches, 24 h pro erfolgreicher Antwort, rein im RAM; kein Eingriff in vorhandenen Fußweg-Cache | Keine Fahrradmiete, Eintritts- oder ÖPNV-Preise; kein Bike-Automatismus ohne FOSSGIS-Antwort |
| ÖPNV | Bestehender, lokal geladener GTFS-Referenzfahrplan, ausschließlich `/api/transit`; ermitteltes Ergebnis mit Linien/Fahrtdatum/Legs | `data/transit-barcelona.meta.json` aktuell **22.10.2026–18.06.2027**. Außerhalb des Metazeitraums niemals Fahrzeit; externe Betreiber/Google-Maps-Links | Kein bestätigter Fahrplan für September 2027, kein angenommener Tarif |

**Lizenzen und Richtlinien:** FOSSGIS betreibt die Demo-OSRM-Router für Fuß/Rad/Auto. Das API-Schema enthält auch beim Fahrrad den festen Pfadbestandteil `route/v1/driving`; entscheidend ist der ausdrücklich getrennte Server-Prefix `/routed-bike/`. FOSSGIS verlangt Attribution, identifizierenden User-Agent, maximal **eine Anfrage pro Sekunde**, kein Scraping oder hohes Anfragevolumen. Diese öffentliche Schnittstelle ist kein vertraglich garantierter Produktionsdienst. OSM-Kartendaten stehen unter ODbL, Attribution „© OpenStreetMap-Mitwirkende“. Quellen:
- https://routing.openstreetmap.de/about.html
- https://www.fossgis.de/aktivitäten/langzeitförderungen/osrm/
- https://www.openstreetmap.org/copyright
- https://project-osrm.org/docs/

## Drei originale GPX-Tracks – **unverändert**

Kanonisch: `data/hiking-evidence.json`. Roh-GPX-Downloads sind als `gpxUrl`/SHA-256 referenziert; Geometrie und Originalhöhen sind als Punktfolgen im Archiv vorhanden. Dieses Datenarchiv wird durch Prompt 05 **nicht überschrieben oder umgeschrieben**.

| Original | Punkte | Aus Archivpunktfolge errechnet | Betreiberreferenz | Datenqualität |
| --- | ---: | --- | --- | --- |
| Heuberg | 187 | ~8,09 km, ↑539 m, ↓539 m | 9 km, ↑453 m, ↓453 m | Originalhöhen vorhanden; merkliche Abweichung, mögliche Wegvariante/Vertikalrauschen |
| Seealpsee via Hüttentobel | 542 | ~7,33 km, ↑371 m, ↓371 m | 7,34 km, ↑377 m, ↓377 m | Originalhöhen vorhanden; relativ kleine Abweichung |
| Ebenalp–Wildkirchli–Äscher | 212 | ~2,15 km; Höhenprofil **gesperrt** | 1,5 km, ↑169 m, ↓181 m | Alle 212 Höhenwerte sind **0**, explizit unbrauchbare Platzhalter; keine 0-m-Höhenlinie vortäuschen |

Vierte Variante „Leichter Seezugang“ besitzt bewusst **keinen** GPX-Track. Keine neue Geometrie wurde ergänzt. Sie bleibt in der UI ohne scheinpräzise Distanz-/Höhenkurve.

GPX-Distanz wird zwischen tatsächlich aufeinanderfolgenden Punkten je Segment als WGS84-Haversine berechnet; separate GPX-Segmente werden **nicht** durch ungesicherte Verbindungen verbunden. Auf-/Abstieg sind Summen roher Delta-Höhen *ohne Glättung*. Diese Größen müssen nicht mit den Betreiber-Werten übereinstimmen: Strecken-Varianten, Trackdichte, Höhenmodell/GPS-Rauschen sowie Darstellung von Teilstrecken sind mögliche Gründe, aber nicht als konkret nachgewiesen auszugeben. Betreiber-Minuten werden niemals automatisch durch aus GPX-Distanz geschätzte Minuten ersetzt.

## Verifikation und Tests

- `test/map-routing-availability.test.mjs`: falscher Profilpfad, ungültige Koordinaten, fehlende Geometrie, unpassende Endpunkte, Modus-Cache, Anbieterfehler, Offline, GTFS außerhalb des Zeitraums.
- `test/hiking-evidence.test.mjs`: unvollständige/ungültige GPX-Segmentstrukturen, explizite Nullmeter-Platzhalter, echter Meeresspiegel 0 m als Gegenbeispiel, drei Original-Punktzahlen und berechnete Abweichungen.
- `test/map-pins-routes-browser.mjs`: echte Chrome-Kartenansicht und Rad/Fuß/ÖPNV-Umschalter, Screenshot Radmodus, zuvor bereits belegte Fußweg-Linie und Stoppreihenfolge. Das ist **kein Live-Test** des öffentlichen Fahrrad-Routers; API-Bike-Tests nutzen ausdrücklich synthetische Mockdaten.
- Offene Risikopunkte: öffentliche Anbieter nicht dauerhaft verfügbar; keine Fahrrad-Freigabe-Prüfung einzelner Straßen; keine Live-GTFS-Garantie; keine private Windows-/Original-Tripsy-Regression oder Geräteabnahme.

**Sicherheit:** Kein Kauf, keine Buchung, keine Änderung an Preis-/Budgetlogik, Varianten-ID, Tagesauswahl, drei GPX-Originalen oder Benutzer-GPX-Dateien.
