# Recherche v0.4 – Airbnb-Wunschlisten, Bahn-Korridore und ÖPNV

**Stand:** 13. November 2026  
**Branch:** `feature/v7-data-day-accommodation-rail` · Draft-PR #5  
**Grundsatz:** Die Originalreisen/Tripsy-Quelldaten, `main` und externe Buchungen bleiben unverändert.

## 1. Eingelesene Airbnb-Wunschlisten

Die beiden im verbundenen Browser sichtbaren Wunschlisten enthielten 42 unterschiedliche Unterkunftseinträge. Der Dateiname der Wunschliste gibt **nicht** den tatsächlichen Wohnort wieder.

| Tatsächliches Zielgebiet im Reiseplaner | Referenzen |
| --- | ---: |
| Genua, einschließlich Pieve Ligure | 11 |
| Venedig | 5 |
| Nizza, einschließlich Saint-Laurent-du-Var | 9 |
| Sète | 5 |
| Paris, einschließlich Aubervilliers und Issy-les-Moulineaux | 7 |
| Barcelona, einschließlich Sant Cugat del Vallès | 3 |
| Kandersteg | 2 |
| **Gesamt** | **42** |

- Quelldatei: `data/research-v04/airbnb-wishlists.json`. Gespeichert sind Inserats-ID und -Link, Anzeigetitel, sichtbare Bewertungen, sichtbare Bettenzahl, grobe Ortsangabe, Quelle und Preis-Snapshot.
- 40 Einträge hatten einen **angezeigten** Gesamtpreis; bei zwei Einträgen war kein verwendbarer Preis sichtbar. Angezeigte Preise sind Momentaufnahmen, keine bestätigten Checkouts.
- Suchansicht: 3 Gäste. Nur für die Wunschliste „Venedig September“ ist 08.–09.09.2027 im sichtbaren Auszug eindeutig als Suchzeitraum bekannt. In der anderen Wunschliste wird kein präzises An-/Abreisedatum unterstellt.
- Die 42 Einträge werden als **ungebuchte, nicht ausgewählte Alternativen** nur für passende Reiseorte in die Varianten aufgenommen, mit `price: null`. Sie erscheinen in der Unterkunftsansicht/Ortsliste, können verglichen und für einen späteren Anbietercheck geöffnet werden. Der Referenzpreis kann angezeigt werden, fließt **nicht** als verbindlicher Hotelpreis in das Reisebudget ein.
- Airbnb zeigt in Wunschlisten keine verlässlich objektscharfen Adressen. Deshalb sind **alle 42 Kartenkoordinaten null**. Zwei Einträge haben nur eine anhand der Gruppenreihenfolge vermutete Stadtzuordnung und einen sichtbaren Warnhinweis. Keine fiktiven Airbnb-Pins.
- **Ungeprüft:** Platz für drei Erwachsene in der gewählten Zimmerkonfiguration, Bettaufteilung, Küche, Hausregeln, Storno, Kaution, Reinigung, Kurtaxe, endgültiger Checkout, Station-zu-Unterkunft-Fußweg, genaue Lage, Buchbarkeit in der tatsächlichen Variante.
- **Technische Grenze:** Das Lesen der verbundenen Wunschlisten war möglich, nicht aber das Öffnen aller einzelnen Angebotsdetailseiten innerhalb dieser Chat-Sitzung. Ausstattung oder genaue Standortkoordinaten werden daher nicht behauptet.

## 2. Nahverkehr und Karten

Die vorhandenen lokalen Verkehrsnetze für Barcelona, Genua, Nizza und Venedig sind weiterhin im Projekt enthalten. Ergänzt wurden datierte Tarifreferenzen in `public/transit.mjs`:

| Stadt | Referenz für einzelne Fahrt | Alternative | Einschränkung |
| --- | --- | --- | --- |
| Paris | 2,55 € Métro/Train/RER | 12,30 € Navigo Jour | Bus/Tram separat, Flughafenbedingungen prüfen |
| Barcelona | 2,90 € Einzelfahrt (1 Zone) | T-dia 12 €; T-casual 10 Fahrten 13 € | T-casual personenbezogen, Flughafenzuschlag möglich |
| Sète | 1,30 € App/Bankkarte | Tageskarte via App 5 € | Fahrerkauf und Papierkarte teurer |
| Nizza | 1,70 € Solo | 24 Stunden 7 € | Bereits in v0.3 |
| Genua | 2,00 € AMT | MetDaily 10 € | Bereits in v0.3 |
| Venedig | 9,50 € Vaporetto | Bus/Tram 1,50 € ohne Vaporetto | 24-h-Wasserpass 25 €, 48-h 35 € |

**Alle Tarife sind 2026er Referenzen, keine für September 2027 zugesagten Preise.** Im Fahrplanbereich sind Betreiber- und Tarifquellen verlinkt.

Ausgangslage aus PR #5: 534 **variantenbezogene** Einträge, 143 mit präzisen Koordinaten, 391 ohne. Die 42 zusätzlichen Airbnb-Angebote sind ebenfalls unlokalisiert, jeweils in den passenden Varianten. Nicht aus einem Stadtmittelpunkt auf den genauen Standort schließen. Der vorhandene Einzeladress-Prüfprozess über OSM/Nominatim bleibt bewusst in nutzerbestätigter Form erhalten.

## 3. Fernverkehr, Interrail und Reiserouten

Neue Datei `data/research-v04/rail-reference.json` mit 12 **nicht verifizierten** Bahn-Korridoren für klassische Strecke, Schweizer Alternative und französische Nachtzugprüfung:

- München → Paris → Barcelona → Sète → Nizza → Genua → Venedig → München.
- Alternative via Nizza → Kandersteg → Appenzell → München.
- Prüfkorridor Paris → Toulouse → Barcelona.

Die Website zeigt zu den zur Reisevariante passenden Korridoren Links auf die **offiziellen Betreiber** DB, SNCF, Renfe, Trenitalia, SBB und ÖBB. Daneben Regeln/Quellen zu Nachtzug-Reisetagen, Reservierungsfenstern und Reservierungspflichten.

Kein präziser Zuglauf, keine Uhrzeit, kein Ticketpreis, kein vorhandener Sitzplatz und keine Interrail-Reservierung ist für September 2027 als bestätigt markiert. Der vorhandene 35-Punkte-Prüfkatalog und die 13 Routing-Alternativen bleiben erhalten; die neuen zwölf Korridore sind **zusätzliche Quellen-/Planungshinweise**, kein Ersatz.

## 4. Ausstehende Aufgaben

1. Geocoding der bekannten Restaurantadressen und touristischen POIs nach überprüfter Adresse/Objektzuordnung; keine automatische Zuordnung zum Stadtzentrum als vermeintlich genauer Pin.
2. Detailprüfung der 42 einzelnen Airbnb-Inserate (genaue Lage, Zimmer, Betten, Preis je tatsächlich gewünschter Nächte, Storno, Gebühren). Die Auflistung allein liefert diese Daten nicht.
3. Multimodale Echtzeitverbindungen/2027-Fahrplanfahrten, genaue Umstiege, Reservierungsinventare und nachprüfbare Preise, sobald sie beim Betreiber erhältlich sind.
4. Regression gegen die **privaten lokalen Tripsy-Rohdateien** und den tatsächlichen Windows-Lauf des Reiseplaners. GitHub-CI ist nur eine Teilprüfung.
5. Eine eventuell verfügbare öffentliche Deployment-URL muss separat geprüft werden; derzeit dokumentiert das Repository nur den lokalen Start unter `127.0.0.1:4173`.

**Tests:** `test/wishlist-v04.test.mjs` prüft Quellanzahl, Standort-/Preis-Vorsicht, Reisevarianten-Zuordnung und Vermeidung automatischer Buchungen/Budgetwerte. CI-Ergebnis separat über GitHub Actions prüfen.
