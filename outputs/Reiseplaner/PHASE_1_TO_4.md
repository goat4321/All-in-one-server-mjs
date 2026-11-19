# Arbeitsstand V7 – Daten, Mehrstopp-Tage, Hotels und Bahn (13.11.2026)

**Branch:** `feature/v7-data-day-accommodation-rail`, aufbauend auf `feature/v7-unified-map-and-day-builder`. **Kein Merge in main, keine externen Buchungen, keine Tripsy-Schreibzugriffe.**

## 1. Datenabdeckung aus eigenen und externen Quellen

- Bereits zuvor: 20 kuratierte Research-v0.2-Quelldateien, vier Originalreisevarianten, 115 Aktivitäten im Vergleichskatalog, 92 datierte Hotel-Suchpreise, 35 bereinigte Transportabschnitte, 13 Routinghypothesen, 65 Ursprungssourcen und 32 offene Qualitätsbefunde.
- **Neu v0.3:** `data/research-v03/food-venues.json` enthält **39 zusätzlich recherchierte Restaurants, Cafés, Imbisse, Bäckereien und Einkaufsoptionen** in **12 Reiseorten**: Paris 4, Barcelona 3, Sète 3, Nizza 3, Genua 3, Venedig 3, Appenzell 4, Grindelwald 4, Kandersteg 3, Toulouse 3, Marseille 3, Mailand 3. Jeder Eintrag hat **Quellen-/Adressverweis, Art und typische Speisen, beobachtete Öffnungszeit, Datum, Status und noch offene Preis-/Koordinatenfrage**. Die Geschäfts-/Kartensuche ist keine Bestätigung der September-2027-Öffnungszeiten oder der Einzelmenüpreise. Für Streckenorte ohne nachgewiesene relevante Lokalangebote bleiben die Listen ehrlich leer; keine generischen Restaurants erfunden.
- **Sechs offizielle Betreiberfamilien** in `official-activity-evidence.json`: Sagrada Família, Park Güell, Eiffelturm, Aquarium Genua, Musée d’Orsay, Oeschinensee. Betreiberquellen, Eintrittsreferenzen, Berechtigungs-/Jugendtarife, ausgeschriebene Öffnungszeiten und Tätigkeitsbeschreibungen sind gesondert abgelegt. Die bisherigen Tripsy-Buchungen/Pläne und Budgetwerte wurden dadurch **nicht** geändert. Insbesondere erhält das Restaurant **Sagradas Tapas** keine Informationen der gleichnamig klingenden Basilika (Regressionstest).
- **Unbekannte genaue Koordinaten:** `POST /api/geocode` sucht **nur bei expliziter Nutzeraktion** eine bereits vorhandene Adresse über OpenStreetMap Nominatim. Max. 3 plausible Treffer im Zielraum, 1 Anfrage ungefähr alle 1,25 s, In-Memory-Cache und offline-503. Ein Klick auf **Kartenstandort prüfen** öffnet die Anbieter-Ergebnisse; erst eine zweite ausdrückliche Auswahl schreibt einen lokalen Kartenpunkt in die aktive Reisevariante. Kein Bulk-Geocoding oder erratener Stadtzentrumspin; keine Veränderung von externen OSM-/Tripsy-Daten.
- **Gemessene Katalog-Abdeckung (letzter komplett grüner Auditlauf vor den finalen Änderungen, 13.11.2026):** 36 Varianten-Stadt-Ansichten, **534 variantenspezifische Datensätze**, davon **143 mit Koordinaten** und **391 ohne Koordinaten**, **185 vorhandene Preisreferenzen**, **120 Öffnungsreferenzen**, **91 Restaurant-/Café-Ansichten**, **8 Einkaufsansichten**. Vorher 453/143/310/185/12/15/6; der Zuwachs in der Ansicht wiederholt dieselben echten Lokale über Varianten. **Nicht 534 unterschiedliche Orte**, nicht 120 verifizierte Öffnungszeiten am Reisetag. Mit `npm run report:map` erneut prüfen.
- Nicht vollständige Flächendeckung behaupten. Für viele der 92 Hotels fehlen echte Haus-/Eingangsposition, drei bestätigte Schlafplätze, Zusatzgebühren, finaler Checkout und Storno. Viele 2027er Betreiberöffnungszeiten/Preise sind nicht veröffentlicht.

## 2. Mehrstopp-Tagesplanung

- Die bestehende Karte hat **„Zur Mehrstopp-Route“**, Auswahl von **2–8 Stopps innerhalb einer Stadt**, Startuhrzeit, manuelle Reihenfolge sowie optionale Luftlinien-Vorsortierung.
- **Echte Wege statt erfundener Minuten:** `day-route.mjs` berechnet nur aus vorhandenen oder erfolgreich von `/api/walk` zurückgelieferten OSRM-Fußrouten die tatsächliche Gehweggeometrie, Dauer und die Zeitschiene. Fehlende Verbindungen sind sichtbar **offen**; reine Luftlinie wird niemals als tatsächliche Straße/ETA ausgegeben.
- Fehlende Besuchsdauer wird als editierbare **60-Minuten-Planannahme** angezeigt. Nur bei vollständig berechneten Fußwegen aktiviert sich **„Alle Stopps in den Tagesplan übernehmen“**. Dies schreibt nach ausdrücklichem Klick Datum/Start/Besuchsdauer in die **lokale aktive Variante**; bestehende Timings, Altersgrenzen, Sperrungen und Küchenabhängigkeiten werden geprüft, bei Konflikten wird nichts geändert. Kein automatischer Kauf/Reservierung.
- Gegenwärtig **keine komplette Multi-Modal-Optimierung mit aktuellem September-2027-GTFS** und keine Garantie auf Öffnungszeit-konforme Reihenfolge (Betreiberzeiten müssen separat geprüft werden). Multi-Stop-Tagesroute ist **Fußweg-orientiert**; ÖPNV-A→B bleibt im vorhandenen Map-Modul als Referenz oder externer Betreiberlink.

## 3. Hotelvergleich

- `stay-analysis.mjs` rechnet **nur belegte EUR-Gruppenbeträge** auf Aufenthaltsdauer/Person/Nacht, zeigt von Router berechnete echte Bahnhof-Fußwegminuten und markiert **offene Bettenanzahl, Steuern, Storno, Checkout, Küche**. CHF ohne verifizierten Umrechnungskurs bleibt unzureichend für EUR-Sortierung.
- Sortierung nach EUR-Gruppenpreis, berechnetem Fußweg oder Datenvollständigkeit; direkter Tabellenvergleich mit Preis pro Person/Nacht und offenen Nachweisen.
- Selbst vollständig angekreuzte Nutzerprüfungen sind **kein unabhängiger Anbieter-Checkout**; ungebuchte Suchpreise bleiben ungebucht, bis externe Buchung tatsächlich bestätigt wäre. Keine Zahlung ausgelöst.

## 4. Bahn und Interrail

- `rail-analysis.mjs` gruppiert **Pass-Reisetage nach lokaler Zugabfahrt**, prüft Passgültigkeit, Nachtzug-Konstellationen, Transfers unter 35 Min., 2027-Fahrplanlücken und fehlende Tickets. Alternativen mit unbekannten Zeitpunkten/Reservierungsplätzen werden ausdrücklich als Hypothesen gekennzeichnet und nicht buchbar gemacht.
- Die bestehende Fahrt- und Reservierungsverwaltung bleibt unverändert. Betreiberlinks, orientierende Buchungsfenster und lokale Wiedervorlagen bestehen fort.
- Der fehlende Zeitraum tatsächlicher August-/September-2027-Zugzeiten oder Sitzkontingente kann nicht aus einer 2026er Tarifreferenz abgeleitet werden. Künftiger Betreiberabgleich bleibt nötig.

## Qualität / Einschränkungen

- Automatisierte CI in `.github/workflows/reiseplaner-ci.yml`: Node 24 Syntax, Python-Validator, fokussierte Modelltests (`test/phase1to4.test.mjs` und `test/geocode.test.mjs`), Datenabdeckungsreport, realer Chrome-End-to-End-Flow und HTTP-Start ohne private Tripsy-Dateien.
- Letzter zuvor vollständig **erfolgreicher** End-to-End-Lauf: [Actions #43375367543](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43375367543), **41/41 Node-Tests**. **Die beiden später hinzugefügten Geocode-Integrationstests und finalen UI-Änderungen sind damit noch nicht von diesem Testlauf abgedeckt**; für die finale Beurteilung gilt der jeweils jüngste Branch-CI-Lauf. Separate vollständige Windows-Regression mit vier privaten `tripsy-*.json` über `Pruefen.cmd` steht weiter aus.
- Kein öffentliches Deployment, keine Angebots-/Karten-Massenerfassung, keine Kontoänderungen und kein Checkout.
