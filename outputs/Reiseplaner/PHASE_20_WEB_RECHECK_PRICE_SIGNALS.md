# Phase 20 – Web-Nachprüfung, neue konkrete Orte, universelle Preisstufen

**Recherche:** 14.11.2026 · **Repository:** `goat4321/All-in-one-server-mjs` · **Branch:** `feature/v7-data-day-accommodation-rail` · Draft PR #5. Keine Änderung am Hauptbranch, an externen Buchungen oder am aktiven Gruppenbudget.

## 1. Umfang der Einzelprüfung

| Vorhandenes Zusatzpaket | Bereits bestehende Anzahl | Neue Prüfung / Umsetzung | Unverifizierte Restangaben |
|---|---:|---|---|
| Aktivitäten | 57 | Jede ID im datierten Audit. 24 quellenbasierte öffentliche geografische Objekt-/Gebietsreferenzen; 13 mit spezifischen Betreiberfakten/Tarifhinweisen | 33 ohne einzeln belegten Ortsanker; keine garantierten Eintrittsslots oder Öffnungszeiten 2027 außerhalb expliziter Betreiberfenster |
| Unterkunftssuche | 35 | 10 Städte mit exakt denselben alten Datumsfenstern/3 oder 4 Gästen neu gesucht. **22 erneut im Suchergebnis**, 13 nicht erneut in der begrenzten Ergebnisliste. 19 zuvor dokumentierte unabhängige OSM-Ortsreferenzen, 1 Konflikt bei Hotel Alpina | Einzelzimmer-/Bettenbelegung, vollständige Steuern, Zimmerstorno und verbindlicher Checkout für alle 35 offen |
| Fernbahn und Autotransfer | 29 | 29 individuelle Datums-/Operator-/Reservierungsprüfungen, Betreiber-Links und nächste Aktion | Kein veröffentlichtes September-2027-Start-/Ankunftspaar für die konkreten Abschnitte als bestätigte Buchung übernommen, keine belegte Zugnummer oder konkreter Preis |
| Allgemeine Essen-/Abend-/Regenideen | 40 | 40 Einzelbegründungen, 9 mit unabhängig dokumentierten Gastrobetriebsreferenzen, 7 mit mindestens einer neuen konkreten Indoor-Alternative | Keine pauschalen 2027-Menü-Endpreise, keine feste Tourbuchung |
| Ergänzende konkrete Optionen | 8 | Betreiber-/Kommunaltarife für Paris, Barcelona, Sète, Nizza, Genua, Venedig, Grindelwald (2) | 2027er Eintrittszeiten/Tarife und ggf. Berechtigung/Einlass separat prüfen |

Alle 57 + 35 ursprünglichen Zusatzkandidaten sind erhalten. 8 verifizierbare **neue** Indoor-Optionen erscheinen im vorhandenen **Entdecken**-Katalog als ungewählte Alternativen. Die 29 Bahn- und 40 Ideen-Datensätze bleiben im bestehenden Research-/Bahn-/Verpflegungsschema, statt falsch in einen aktiven Kalender aufgenommen zu werden. Airbnb-Privatadressen werden nicht erraten.

### Dateien / Datenflüsse

- `data/research-v20/activity-audit-20261114.json`: 57 individualisierte Prüfschritte inkl. Quellen, Koordinatenqualität und Preisbedingungen.
- `data/research-v20/lodging-audit-20261114.json`: 35 Unterkünfte, 22 datierte Suchanzeigen, 19 unabhängige Standortreferenzen, 1 Konflikt, 13 nicht erneut gefunden in den Ergebnissen.
- `data/research-v20/rail-food-audit-20261114.json`: 29 Bahn- und 40 Konzept-Prüfungen mit fehlenden Angaben.
- `data/research-v20/verified-indoor-alternatives.json`: 8 neue konkrete, ausdrücklich nicht gebuchte und noch nicht 2027-validierte Betreiberoptionen.
- `lib/research-v20.mjs`: read-only Import, sichere Quellen-/Koordinaten-/Preisprüfung, eindeutige IDs, keine automatischen Buchungen.
- `public/research-v20-ui.mjs`: detaillierte Dokumentationsansichten in **Bahn**, **Verpflegung** und **Daten & Fristen**.
- `public/visual-experience.mjs`, `public/place-profile.mjs`, `public/views.mjs`, `public/survey-v19-ui.mjs` und `public/design-round2.css`: einheitliche, sichtbare Preisstufen in den alten und neuen Ortslisten, Tageskarten, Hotelvergleichen, Popup- und Detailansichten.

## 2. Transparente Preisstufen

Die Symbole `€`, `€€`, `€€€` sind **grobe, technische Preissignal-Klassen** aus vergleichbaren vorhandenen EUR-Beträgen, **keine** Stadt-/Anbieter-Bewertungen. Sie werden nur angezeigt, wenn ein zugehöriger Betrag und seine Bezugsgröße vorliegen.

| Kategorie | € | €€ | €€€ | Bezugsgröße |
|---|---:|---:|---:|---|
| Unterkunft | unter 30 € | 30–unter 60 € | ab 60 € | **pro Person/Nacht**, bei passender Gruppengröße und nachgewiesener Nächtezahl |
| Restaurant / Menü | unter 15 € | 15–unter 35 € | ab 35 € | veröffentlichte **volle Menüoption** pro Person; nicht automatisch Gesamtcheckout |
| Eintritt / Aktivität | unter 10 € | 10–unter 40 € | ab 40 € | pro Person bei EUR-Preisreferenz |
| Verkehr | unter 20 € | 20–unter 70 € | ab 70 € | pro Person, nur tatsächlich vergleichbarer EUR-Referenzbetrag |

- `0 €`: eindeutig kostenloser Basiszugang, Zusatzfahrten/Essen nicht enthalten.
- `€?`: unbekannter Preis oder nicht mit der gewählten Bezugsgröße vergleichbar (einzelne Café-Artikel, ältere Airbnb-Suchdaten für andere Zeiträume, fehlende Zimmergruppe, CHF ohne Kurs, bedingte kostenlose EWR-Eintritte, bloße Restaurantidee).
- Wird ein eindeutiger Menüpreis veröffentlicht, darf ein einzelnes Getränk, ein Cicchetto oder eine Vorspeise nicht als vollständiger Restaurantbesuch gelten. Daher unterscheidet die Preislogik `fixed_menu`, `delivery_complete_menu` und `group_menu_per_person` ausdrücklich von `dish`/`retail_product`/`beverage`.
- Eine aktuellere Unterkunftssuche wird in der **Preisstufen-Anzeige** mit klarer Quellenkennung bevorzugt, während der ursprüngliche Suchwert im aktiven Quell-/Budgetdatenfeld `price` unverändert bleibt. Der Vergleich ist kein Checkout.

## 3. Konkret belegte neue Betreiberbeispiele

| Ort | Anbieter | Preisquelle (Stand 2026 / Vorjahresbroschüre) | Wichtige Bedingung |
|---|---|---|---|
| Paris | Arkose Bouldern | 18 € pro Erwachsenensession | Standort zuerst auswählen, Aktion-/Leihpreise separat. https://arkose.com/tarifs |
| Barcelona | Sharma Climbing Poblenou | 15 €, Ermäßigung 13 € (unter 18 / Studierende unter 25 mit Nachweis) | Optional +1 € Unfallversicherung. https://sharmaclimbing.com/en/spain/barcelona-poble-nou/schedules-and-rates/ |
| Sète | Centre Raoul Fonquerne | 5,30 € Erwachsene laut kommunalem 2025/26-Tarifblatt, Studierende ggf. −20 % | Öffnungen für September 2027 offen. https://www.agglopole.fr/wp-content/uploads/2026/03/Centre-balneaire-Fonquerne-Horaires-et-Tarifs.pdf |
| Nizza | Piscine Jean Bouin | 4,40 € Stadttarif; Nicht-Metropolbewohner laut Betreiber +50 % (rechnerisch 6,60 € vor weiteren Bedingungen) | Deshalb keine verbindliche Buchungs-/Betragszuordnung. https://www.nice.fr/lieux/piscine-jean-bouin/ |
| Genua | FPX Nuoto | 6,50 € regulär, 5,50 € ermäßigt unter Voraussetzungen | Sommerrevision/Öffnungsfenster prüfen. https://www.fpxnuoto.it/libera-balneazione-2/ |
| Venedig/Mestre | Nuoto Venezia Centro | 7 € Mo–Sa, 5 € Sonntag (2025/26) | Aktueller 2027-Tarif offen. https://www.nuotovenezia.it/contenuti/1077/documenti/piscina-2025-2026-nuoto-libero.pdf |
| Grindelwald | Sportzentrum Hallenbad | 10 CHF regulär, 5 CHF mit gültiger Gästekarte | CHF ohne EUR-Symbol-Einstufung. https://www.sportzentrum-grindelwald.ch/preise/ |
| Grindelwald | Sportzentrum Boulderraum | 20 CHF regulär, 10 CHF Gästekarte, Schuhmiete +7 CHF | CHF ohne EUR-Symbol-Einstufung. https://www.sportzentrum-grindelwald.ch/preise/ |

## 4. Für 2027 ausdrücklich publizierte Ausnahmen

- **Eiffelturm:** gültige offizielle Preisliste ab **11.01.2027**: 2. Etage Treppe 12–24 Jahre **7,60 €**, Erwachsene 15,20 €; Jugendpreis bisher in der importierten Forschung veraltet. https://www.toureiffel.paris/sites/default/files/2026-10/tarifs_2027_en.pdf
- **Nizza, Parc de la Colline du Château:** vom Betreiber veröffentlichtes **01.04.–30.09.2027, täglich 08:30–20:00 Uhr**, öffentlicher Zugang kostenfrei. Mögliche kurzfristige Sperrung ausgenommen. https://www.explorenicecotedazur.com/culture/parc-de-la-colline-du-chateau/
- **Oeschinensee:** Sommergondelbetrieb **24.04.–19.09.2027, 08:30–18:00 Uhr** auf Betreiberseite. Historische 2026er Sommer-Hochsaisonreferenz 40 CHF hin/zurück **nicht** als verbindlicher 2027-Ticketbetrag klassifiziert. https://www.oeschinensee.ch/tarife-fahrplan/
- **Louvre:** unter 26 nur kostenlos bei EWR-Staatsangehörigkeit bzw. einschlägiger EWR-Wohnsitzberechtigung; ohne individuelle Prüfung kein automatischer 0-€-Preis. https://www.louvre.fr/en/visit/hours-admission
- **Sagrada Família:** 24 € unter 30, 26 € Standard, veröffentlichter **aktueller Tarif**, keine bestätigte 2027er Eintrittszeit. https://sagradafamilia.org/en/prices?inheritRedirect=true
- **Park Güell:** aktuell 18 € regulär, zeitgebundener Eintritt, 2027 erneut prüfen. https://parkguell.barcelona/en/planning-your-visit/prices-and-times

## 5. Unterkunftsabgleich und Grenzen

Alle **zehn** zuvor definierten Reiseort-/Gruppen-/Datumsanfragen geprüft: Paris (3), Barcelona (3), Sète (3), Nizza (3), Genua (3), Venedig (3), Appenzell (4), Glarus (4), Grindelwald (4), Kandersteg (4). Die Zahl bezeichnet Erwachsene, nicht Zimmerbetten.

- **22 von 35** frühere Anbieter kamen in den frischen, teils limitierten Trefferlisten wieder vor. **13 von 35** wurden nicht wieder gelistet, aber daraus folgt **keine** Nichtverfügbarkeit. Detaillierte Einzelpreise/Adressen und Fehlergründe im JSON und im Quellenbildschirm.
- **Hotel Alpina Kandersteg:** alter Suchwert 579,79 € für 4/2 Nächte, neuer Suchwert 530,17 €. Die Differenz von 49,62 € ist **nicht** als identisches Zimmerangebot oder tatsächlicher Preisverfall erwiesen. Außerdem widersprechen sich zuvor dokumentierte Ortskoordinaten um 392 m. Beides wird angezeigt und nicht automatisch als exakter Eingang übernommen.
- Keine der 35 Anbieter-Suchanzeigen beweist Einzelbetten, gesicherte Zimmeraufteilung, vollständigen End-Checkout, Steuern oder kostenloses Storno. Keine Reservierung durchgeführt.
- 19 Zuordnungen zu alten unabhängigen OSM-Ortsreferenzen wurden per Namen, Stadt und Abweichung bis 250 m zwischen Anbieter- und Quellenposition geprüft; öffentlich belegte Gebäude-/Gebietsreferenz nicht mit Eingang verwechseln.

## 6. Bahn und Essen: Einzelfälle behalten Gründe

**SNCF am 14.11.2026:** offiziell TGV INOUI bis 02.07.2027 im Verkauf, INTERCITÉS überwiegend bis 31.03.2027. Für **29** datierte September-/Augustabschnitte bleiben Zugnummer, Abfahrt, Ankunft, Reservierungsinventar und Ticketpreis unbestätigt. Originale historische Reservierungsreferenzen dürfen sichtbar bleiben, aber niemals als neuer Buchungsbetrag. Quelle: https://www.sncf-connect.com/en-en/article/the-opening-of-ticket-sales-for-winter-and-spring-summer-2027

**40 Essens-/Abendideen:** Bei Allgemeinformulierungen wie „Supermarkt und kochen“ fehlen Küchenbeleg, Warenkorb, Datum und Menge. „Regionale Speise“ ist noch kein verifiziertes Menüangebot; frühere 39 datierte Einzelbetriebsrecherchen können als **separat** ausgewiesene konkrete Alternativen angehängt werden, ohne die allgemeine Idee als erledigt zu markieren. Öffentliche kostenlose Abendgestaltung kann `0 €` ohne Getränke oder ÖPNV sein. Regenprogramm jetzt an sieben Ortskonzepten um acht dokumentierte Betreiberoptionen ergänzt; wo kein passender Ort nachgewiesen wurde, bleibt es „€?“ mit Recherchegrund.

## 7. Qualität, Tests, Versionsschutz

`test/research-v20.test.mjs` ergänzt die portable Testmatrix: 57/35/29/40 Archivprüfung, 24 öffentliche Geopunkte, 19 Hotel-Georeferenzen, 22 Suchpreis-Neubeobachtungen, 8 neue Betreiberoptionen, 1 Hotel-Ortskonflikt, Preisstufen-Grenzen (0 €, €/€€/€€€, €?, CHF), keine Buchung und wiederholbare katalogbasierte Berechnung.

Automatisierte Prüfungen: `npm run test:portable`, Python Original-Validator, JavaScript-Syntax, Kartenreport, Chrome-Browser- und Server-Smoke via `.github/workflows/reiseplaner-ci.yml`.

**Offen:** reale gerätespezifische UI-Abnahme, vollständige 2027-Checkouts aller 35 Objekte, tatsächliche September-/August-Bahnverbindungen, letzte 33 aktivitätsbezogene Einzel-GPS-Referenzen, private Airbnb-Adressen und ausschließlich generische abendliche/essensbezogene Beträge. Diese Lücken werden nicht als erledigt behauptet.

**Start lokal:** Entwicklungsbranch als ZIP → `outputs/Reiseplaner/Start.cmd` mit Node.js 24 → `http://127.0.0.1:4173`. Kein Merge nach `main`, kein öffentliches Deployment.
