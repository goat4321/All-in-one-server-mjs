# Phase 8 – 336 offene Kartenplätze recherchiert und Menüpreisrecherche für alle 39 kuratierten Lokale

**Stand:** 13.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · **PR:** #5 (Draft).

## Ausgangslage und Ergebnismengen

Vor dieser Runde waren 336 von 642 Katalogeinträgen über alle vier Reisevarianten **ohne exakte Einzelposition**. Viele Referenzen erscheinen in mehreren Varianten. Die v0.6-Ortsrecherche hatte zu diesem Zeitpunkt **188 unterschiedliche noch offene Orte**: 74 mehrdeutige Photon-Ergebnisse, 68 ohne passenden Treffer und 46 nicht sinnvoll direkt geokodierbare Einträge (vor allem 42 private Airbnb-Angebote).

Diese Runde hat nach manuellen Einzelquellenprüfungen weitere **19 unterschiedliche Orte** aus den 188 georeferenziert (darunter Miam's und Chez François in Sète, 13 Bahnhofs-/Outdoor-Referenzen, Café Rauber, Tea Room Marmotte, Al Mercà). Die historische Geodatenprüfung enthält nun **121 akzeptierte einzigartige Quellenpunkte**, **60 Kandidaten mit Konflikten**, **63 ohne eindeutige öffentliche Übereinstimmung** und **46 nicht sinnvoll als feste POIs geokodierbare Objekte**.

Der aktuelle CI-Kartenreport lautet:

| Kennzahl | Ausgang | Jetzt |
| --- | ---: | ---: |
| Variantenübergreifende Karteneinträge | 642 | 642 |
| Mit belegtem PIN | 306 | **336** |
| Ohne genauen individuellen Pin | 336 | **306** |
| Vorher offen / jetzt offen, unterschiedliche Objekte | 188 | **169** |

Ein Gruppenaktivitätsort (z.B. Strand, Wald, Aussicht, Wanderweg) kann über eine belegte öffentliche **Referenzposition** auf der Karte erscheinen. Diese ist **kein vermessener Treffpunkt, keine Weggeometrie und keine bestätigte Erreichbarkeit**. Ein Bahnhof für ein Fahrtsegment ist ein belegter Startanker, nicht die tatsächliche Zugroute.

Die 42 Airbnb-Wunschlistenobjekte bleiben separat mit bekannten Stadt-/Umgebungsangaben und historischen Beispielpreisen aus research-v04 gespeichert. Für sie wird niemals ein Gebäude- oder Eingangsstandort geraten.

## Menü-Endpreisprüfung: jedes der 39 kuratierten Lokale

Unter `data/research-v08/food-menu-audit.json` erhält **jedes** der 39 Lokale einen Identifikator, Stadt, Adresse, Kartenlink, Nachweis-Status und, soweit vorhanden, datierte Menü-/Produktbeispiele mit Quellen-URL.

| Prüfergebnis | Unterschiedliche Lokale |
| --- | ---: |
| Mit mindestens einem konkreten Preisbeispiel und Quelle | **19** |
| Anbieter-/Tourismusseite auffindbar, aber ohne verifizierten numerischen Menüpreis | **6** |
| Kein verlässlicher spezifischer Einzelgerichtpreis belegbar | **14** |
| **Gesamtzahl geprüft** | **39** |

**19 mit Preisbeispiel ist nicht gleich 19 komplette Restaurant-Endpreise.** Einträge enthalten u.a. À-la-carte-Gerichte, Getränke, Tagesmenüs, nur Lieferplattform-Preise oder einen Einzelhandelspreis. Der Nutzer kann diese Fälle im `menuReference.sourceType` und `precision` unterscheiden.

Besonders vollständige/hervorgehobene Preisbeispiele:

- **Terminus Nord Paris:** 2-Gang-Mittagsmenü **24,50 €** p.P. und 3-Gang-Mittagsmenü **29,50 €** p.P. (Mo–Fr, Getränke extra). Quelle: https://www.terminusnord.com/menus-carte/
- **Quick Gare du Nord Paris:** `Menu Giant` **11,50 €**, `Long Bacon` **11,95 €**, `Giant Max` **13,20 €** auf Deliveroo. **Liefer-/Servicegebühren und möglicherweise höhere Lieferpreise**. Quelle: https://deliveroo.fr/fr/menu/paris/10eme-gare-du-nord/quick-paris-gare-du-nord
- **Sagradas Tapas Barcelona:** Patatas bravas **5,10 €**, Hähnchenkroketten **6,20 €** und andere Einzelgerichte auf der Betreiberkarte; kein automatisch vollständiges Tagesmenü. Quelle: https://www.sagradastapas.com/nuestra-carta/
- **Taller de Tapas Barcelona:** Betreiber-/Menüplattform listet Einzelgerichte; **15 % Terrassenzuschlag** laut Karte zusätzlich. Quelle: https://panel.refoodlution.com/preview/618
- **Miam's Sète:** Sommerkarte 2026 mit Hauptgerichten **15–20 €**; neuere Sommerkarte bevorzugen statt älterer Regionalportale. Quelle: https://restaurantguru.com/Miams-Dici-et-Dailleurs-Sete/menu
- **Le Monte Christo Sète:** **Gruppenmenü ab 28 € p.P. für 2027**, offenbar an Gruppenkriterien gebunden; **nicht automatisch für drei Reisende verfügbar**. Quelle: https://www.tourisme-occitanie.com/fr/fiche/restauration/le-monte-christo-sete_TFORESLAR034FS001R7/
- **Cavour modo21 Genua:** Glovo-Lieferangebote (z. B. Trofie al pesto **10,80 €**) **nicht** als Restaurant-Sitzplatz-Endpreis verwenden. Quelle: https://glovoapp.com/it/it/genova/stores/cavour-modo-21-gen
- **Restaurant AZADI Appenzell:** Just Eat-Angebote ausschließlich als Liefer-/Abholpreis in **CHF**. Quelle: https://www.just-eat.ch/speisekarte/azadi-bistro
- **Café 3692 Grindelwald:** lediglich Getränkepreis `Alpen-Cappuccino` **7 CHF** aus einer Drittanbieterkarte; **Frühstück/Abendessen nicht preislich bekannt**. Quelle: https://speisekarte.menu/restaurants/grindelwald/cafe-3692-m-kaufmann/menu
- **QRAFTwerk Grindelwald:** Verkaufsprodukt **3,90 CHF** aus Onlineshop; **kein Café-Gericht**. Quelle: https://qraftwerk.ch/

**Wichtiger Fehler vermieden:** Die Internetseite `chez-francois-sete.fr-rest.com/carte/` listet angeblich ein Lokal in der **Rue Paul Valéry 2**, während der gespeicherte Anbieter Chez François nach eigenen und Tourismusangaben **7–8 Quai Général Durand** ist. Daher wurden deren 16-/27-€-Menüs **nicht** als belegte Preise des gesuchten Restaurants zugeordnet.

## Integration

- `lib/catalog.mjs`: importiert und prüft die 39 Menükarten, Quellendaten und individuelle Statuswerte, ohne `item.price`, Reservierung, Bezahlung oder geplanten Budgets heimlich zu verändern.
- `public/map-explorer.mjs`: die Detailansicht zeigt konkrete Preise, Beispielgerichte, Originalmenü-URL, saisonale Grenzen sowie Zuschläge und Liefer-/Retail-Warnungen.
- `public/views.mjs`: unter **Verpflegung** eine ortsbezogene Tabelle sämtlicher relevanter Menü-Preisbeispiele und Quellen; unter **Daten & Fristen** zusätzlich die **vollständige nach Stadt getrennte Prüfliste der noch offenen eindeutigen Kartenobjekte** mit Google-Maps-Suche und Begründung. Bisherige v0.7-Einzelmatrix (642 Variantenreferenzen) bleibt vorhanden.
- `test/menu-geo-v08.test.mjs`: 39 Menüdatensätze, Budgettrennung, 42 Airbnb-Privatpositionen, eindeutige geografische Koordinaten, vollständige 290er Einzelquellenbilanz und Quellenintegrität.

## Nicht vollständig recherchierbare Positionen

- 42 Airbnb-Wunschlistenobjekte: tatsächliche präzise Adresse vor Buchung oft nicht öffentlich.
- Mehrdeutige Booking-Angebote mit allgemeinen Namen, ohne öffentliche verlässliche Adresse und präzise Geokoordinate.
- Frei gestaltete Aktivitäten wie Stadtbummel, Strand- oder Wanderweg ohne einen einzelnen vom Anbieter genannten Einstieg.
- Alle übrigen bestehenden Probleme bleiben sichtbar, mit ihrem Herkunftsstatus, alten Kandidaten und nächsten Prüfhinweisen; nicht erfundene GPS-Koordinaten sind `null`.

Die separate `scripts/food-geo-v08.mjs` ist eine **optionale, begrenzte** genauere Adressgeokodierung, die ausschließlich nach vollständigem Hausnummern-/Straßenmatch Kandidaten ausgibt. Sie ist **nicht als bereits erfolgreich ausgeführt** zu betrachten. Ob neue Kandidaten seriös verwertbar sind, muss mit den echten Restaurantdaten geprüft werden.

## Tests und Deployment

GitHub Actions **Run #43424150681:** 59/59 Node-Modelltests bestanden, Chrome-Browsertest, Datenvalidierung, HTTP-Smoke-Test und Kartenabdeckung erfolgreich. Kartenreport 642 / 336 / 306.

Keine Fusion nach `main`, kein Cloud-/Netlify-Deployment und keine tatsächlichen 2027er Buchungen. Bis 2027 sind Betreiberpreise und Öffnungszeiten erneut zu prüfen; historische Zahlen werden nicht als Endcheckout behauptet.
