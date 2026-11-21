# Phase 7 – Betreiberreferenzen, alle Karten-/Tarif-Felder und Vollständigkeitsprüfung

**Stichtag:** 13.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · Draft-PR #5.

## Methode

1. **Bestandsdaten erhalten:** Zuerst Research v0.2, die vorhandenen 39 Gastro-/Shop-Referenzen v0.3, 42 Airbnb-Wunschlisten v0.4 und 102 neu recherchierte Geodaten v0.6 übernehmen. Keine manuelle Buchung, kein Überschreiben alter Tripsy-Felder.
2. **Offizielle Preis-/Betriebsdaten ergänzen:** `data/research-v07/operator-reference-20261113.json` mit 23 Betreiber-Tarifreihen für Paris, Barcelona, Sète, Nizza, Genua und Venedig; zusätzlich acht Attraktions-/Betriebsreferenzen, SNCF-Zugmuster und 2027er Buchungsfensterhinweise.
3. **Anzeigen statt fälschen:** `lib/catalog.mjs` hängt Quellen an zugehörige Sehenswürdigkeiten, hält Preisreferenzen aber von `item.price`, dem Gruppenbudget, bestätigten Tickets und Buchungsdaten strikt getrennt. Die Nahverkehrsseite zeigt alle Tarifvarianten und den offiziellen Betreiberplaner. Die Bahnseite zeigt 2026-Beispielzeiten ausdrücklich als solche.
4. **Vollständigkeitsnachweis:** `catalog.research.coverageV07` erstellt für jeden bestehenden Katalogeintrag und jede Variante eine Quellen-/Karten-/Preis-/Öffnungszeiten-/Buchungsprüfung. Unter **Daten & Fristen** sind die Einträge vollständig nach Stadt, Kategorie und fehlenden Nachweisen aufgelistet. Alle haben Google-Maps-Such- und ÖPNV-Links.

## Detailprüfung

- Google Maps Standortsuche: **nur namens-/adressbezogene Suche** bei fehlendem exaktem Punkt; der abgelegte `orientationCityPoint` ist ausdrücklich **kein POI-Pin**.
- Quellenkoordinaten und nachrecherchierte Gebiets-/Objektzentren werden voneinander unterschieden. Die 102 neuen eindeutigen Orte kommen aus research-v06, nicht aus einer willkürlichen Stadtzentrum-Zuordnung.
- Airbnb: 42 unterschiedliche Wunschlisteneinträge mit 40 historischen Beispielgruppenpreisen; je nach Reisevariante einzeln sichtbar. Die genauen privaten Hausadressen und Endpreise 2027 sind **nicht öffentlich verifiziert**.
- Restaurants/Cafés: 39 zusätzliche Einträge mit Adresse, Speisen- und Öffnungsreferenz; bei fehlender Karte und 2027er Menü-Endpreis kein erfundener Wert.
- ÖPNV: 23 separate Preisvarianten 2026, jeweils mit Betreiber-URL und Gültigkeit. Zehnfahrtenkarten werden nicht als 10 frei übertragbare Einzelpreise behandelt, wenn der Anbieter eine Einzelpersonenzuordnung vorsieht.
- Bahn: 12 vorhandene Korridore mit offiziellen Betreiberlinks, ein konkretes SNCF-Muster Paris Gare de Lyon → Barcelona Sants vom 13.11.2026 (6:50 Stunden; 07:42–14:32 oder 14:42–21:32) und offizielle SNCF/SBB-Verkaufsfenster. Dies sind **keine bestätigten Abfahrten im September 2027**.
- Saisondaten: Gondelbahn Oeschinensee vom 24.04. bis 19.09.2027, 08:30–18:00 Uhr veröffentlicht; 2026er Preisreferenzen separat in CHF. Für den Venedig-Zugangsbeitrag 2027 ist September derzeit nicht im veröffentlichten Gebührenkalender aufgeführt; endgültige Bedingungen separat prüfen.

## Zuverlässigkeit

- `test/operator-v07.test.mjs` kontrolliert sämtliche vier Varianten, Koordinatenpräzision, Tarifquellen und Saisongültigkeit sowie die Airbnb-Grenzen.
- GitHub Actions **43417371332**: 54/54 Node-Tests, Chrome-Browsertest, 16 kanonische Quellen, Kartenreport und lokaler HTTP-Smoke-Test erfolgreich.
- Kartenreport, variantenbezogen: **642 Einträge; 306 Quellenkartenpunkte; 336 ohne belegte exakte Position**. Varianten können dieselben Ziele mehrfach enthalten.
- Die 336 sind nicht in 336 unabhängige öffentlich verfügbare Adressen auflösbar: darunter Gruppenaktivitäten ohne festen Punkt, Unterkünfte mit geheim gehaltenen Hausadressen und mehrdeutige Anbieter.

## Originalquellen (Auswahl)

- Paris 2026: https://www.iledefrance-mobilites.fr/tarifs-titre-de-transport-en-commun-2026
- Barcelona 2026: https://www.tmb.cat/en/barcelona-fares-metro-bus/transport-ticket-fares
- Sète: https://www.mobilite.agglopole.fr/tarifs/
- Nizza: https://www.lignesdazur.com/fr/tickets-la-journee
- Genua: https://www.amt.genova.it/amt/biglietti-e-abbonamenti-2/biglietti-e-carnet/biglietto-ordinario/
- Venedig ACTV: https://muoversi.venezia.it/en/content/vaporetto
- Venedig Rolling Venice: https://www.veneziaunica.it/en/buy-tickets/public-trasport-in-venice/actv-3-days-transport-rolling-venice
- Park Güell: https://parkguell.barcelona/en/planning-your-visit/prices-and-times
- Sagrada Família: https://sagradafamilia.org/en/faqs
- Oeschinensee 2027: https://www.oeschinensee.ch/en/tarife-fahrplan/
- SNCF Paris–Barcelona: https://www.sncf-connect.com/en-en/train/route/paris/barcelona
- SNCF Buchungsstart 2027: https://www.sncf-connect.com/en-en/article/the-opening-of-ticket-sales-for-winter-and-spring-summer-2027
- SBB Buchungsfenster: https://www.sbb.ch/en/help-and-contact/products-services/tickets/switzerland/tickets.html
- Geodaten: © OpenStreetMap-Mitwirkende, ODbL; gesonderte OSM-Quellen je Kartenobjekt.

## Weiterhin offen

Kein Vollzugriff auf die ursprünglichen dynamischen Airbnb-Detailseiten zum heutigen Zeitpunkt und keine bestätigten September-2027-Checkoutpreise. Keine garantierten 2027er Fahrpläne, Sitzplätze oder Echtzeit-ÖPNV-ETAs aus 2026-GTFS. Die 336 restlichen variantenspezifischen nicht geolokalisierten Einträge bleiben ausdrücklich als theoretische Stadt-/Suchreferenzen, nicht als erfundene exakte Pins.

**Kein Merge nach main und kein neuer externer Deploy.** Die Änderung liegt zum Review im Draft-PR #5.
