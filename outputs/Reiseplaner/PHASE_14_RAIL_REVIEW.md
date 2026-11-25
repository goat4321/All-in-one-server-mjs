# Phase 14 – Bahn-Prüfzeitleiste

**Stand:** 13.11.2026. **Status:** Bedienfunktion und voraussichtliche Kontrolltermine, nicht Buchbarkeit.

## Ausgangsdaten und Modell
Grundlage sind die je Variante in `data/research-v02/transport_research_queue.json` gespeicherten Originalabschnitte. `public/rail-review-timeline.mjs` nutzt `railSalesStatus` und zeigt für jeden Abschnitt eine Karte mit Datum, Streckennamen, ungefährer nächster Kontrollmöglichkeit, Link zur Betreiber-Verkaufsregel und dem bestehenden `rail-reminder`-Dialog. Der Modellstatus wird beim erneuten Öffnen nach dem aktuellen Datum abgeleitet, ändert aber weder gebuchte Tickets noch lokale Gruppenpreise.

## Konkrete Orientierung, Klassikvariante
- München → Paris am 01.09.2027: ab ungefähr 01.03.2027 prüfen (international, je Betreiber).
- Paris → Barcelona am 03.09.2027: ab ungefähr 03.05.2027 prüfen (typische SNCF-Vorlaufannahme, variabel).
- Barcelona → Sète am 06.09.2027: ab ungefähr 06.05.2027 prüfen (internationale Verfügbarkeit gesondert).
- Sète → Nizza am 08.09.2027: ab ungefähr 08.05.2027 prüfen (typische SNCF-Vorlaufannahme).
- Nizza → Genua am 10.09.2027, Genua → Venedig am 12.09.2027 und Venedig → München am 14.09.2027: die konservativen Modellorientierungen müssen beim konkreten Anbieter überprüft werden; sie sind kein offizieller Fahrplan.

## Offizielle Quellen
- SNCF-Fahrkartenverkauf: https://www.sncf-connect.com/en-en/help/ticket-sales-opening
- SNCF-Verkaufsankündigung vom 12.11.2026: https://www.sncf-connect.com/en-en/article/the-opening-of-ticket-sales-for-winter-and-spring-summer-2027
- DB-Sitzplatzreservierungen: https://int.bahn.de/en/faq/seat-reservations-booking-period

**Offen:** alle verbindlichen Abfahrten, Preise, Pass-Sitzplätze, ÖPNV-Zubringer und tatsächlichen Anschlüsse September 2027. Es gibt hier keine Aussage, die ein September-Ticket bereits zum Verkauf bestätigt.

## Tests
Der neue Node-Test `test/rail-review-timeline.test.mjs` prüft Originalabschnitte, offene Statusflags, 2027-Daten und Modellterminwechsel. Der Headless-Chrome-Test kontrolliert die gerenderte Zeitleiste und die vorhandenen Wiedervorlageaktionen. `test/verification.test.mjs` prüft zusätzlich den veröffentlichten SNCF-Grenzstand explizit am 13.11.2026.