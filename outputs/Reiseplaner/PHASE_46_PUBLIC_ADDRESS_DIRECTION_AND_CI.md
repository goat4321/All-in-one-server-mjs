# Phase 46 · Öffentliche Adressen, Kartenquellen und Laufrichtung

**15.11.2026 · Arbeitsbranch:** `feature/v7-data-day-accommodation-rail` (Draft PR #5). `main` bleibt unverändert.

## 1. Datenstand, keine erfundenen Pins

Die Karte zählt weiterhin **829 variantenspezifische Einträge, 556 Kartenpositionen und 273 Einträge ohne individuellen Punkt**. Das sind keine 829 eindeutigen Orte, sondern Zahlen über vier Reisemodelle. Ein technisch vorhandener Punkt ist nicht notwendigerweise ein unabhängig belegter Eingang.

Im öffentlichen Hausadressenarchiv sind **50 Anbieter-/Restaurantanschriften** hinterlegt. Davon haben **34** einen zugeordneten Quellenpunkt, **16** besitzen weiterhin nur die veröffentlichte Anschrift. Innerhalb dieser 16 bleiben **6 Sète**, **4 Genua**, **6 Venedig/Mestre** ohne unabhängig bestätigten Einzel-GPS-Punkt.

Zusätzliche Quellengegenproben für vier italienische Datensätze:

- **Cavour modo21, Genua:** Betreiber nennt Piazza Cavour **21r**; italienisches Tourismusportal nennt **21 Rosso**, also dieselbe Nummernkonvention. Das ist eine Adressbestätigung, *kein* nachgewiesener GPS-Eingang. Quellen: https://modo21.it/ristorazione/come-prenotare-da-cavour-modo21/ und https://www.italia.it/it/liguria/genova/dove-mangiare/cavour-modo21 .
- **Cittadella 3, Genua:** In der Booking-Darstellung steht **„Scalinata della Cittadella 2 piano“**. Das könnte das zweite Geschoss und nicht eine zweifelsfreie Hausnummer bedeuten. Das amtliche Civis-Bestandsverzeichnis führt mehrere Gebäude in dieser Gasse, belegt aber nicht, *welches* Haus mit der Unterkunft gemeint ist. Die zuvor gespeicherte Nummer 2 war ausdrücklich **nicht verifiziert** und wurde deshalb aus dem aktuellen navigationsrelevanten Adresseintrag entfernt. Bei einer unklaren Geschoss-/Hausnummer-Angabe ist die manuelle Übernahme eines automatisch gefundenen Hausnummern-Pins gesperrt. Quellen: https://www.booking.com/hotel/it/cittadella-3.html und https://civis.comune.genova.it/civisdb/scheda-1762003.html .
- **4 Venice rooms, Mestre:** Der Listingtext führt Corte Marin Sanudo **15** mit **30174**. 2GIS führt dieselbe beziehungsweise umgestellte Straßenbezeichnung Corte Sanudo Marin **15**, aber mit **30173**. Beide PLZ-Angaben müssen vor einem exakten Punkt oder einer verbindlichen Anreise verifiziert werden. Quellen: https://www.booking.com/hotel/it/4-venice-rooms-piazza-ferretto-m9-museum-duomo-teatro-toniolo-airport-wi-fi-cent.de.html und https://2gis.it/padova/geo/9289309886861882 .
- **Bacarino, Venedig:** Öffentlich genannte Adresse Salizada San Giovanni Grisostomo **5755**. Der ähnlich klingende OSM-Treffer **Bacarandino** liegt an Calle dei Corazzeri **3939** und ist **ein anderes Lokal**. Nicht übernehmen. Quellen: https://www.tripadvisor.it/Restaurant_Review-g187870-d33473744-Reviews-Bacarino_Venezia-Venice_Veneto.html und https://mapcarta.com/N3240766156 .

Diese vier Hinweise sind als **Recherchequalifizierungen** in `data/research-v09/verified-public-addresses.json` gespeichert. Es wurden dadurch **null** zusätzliche unsichere Gebäude- oder Straßenmittenpins übernommen.

## 2. Interaktive Kartenarbeit

- Neuer Filter **„Veröffentlichte Anschriften“** in der eigenständigen Karten-Prüfliste, zusätzlich zu den bisherigen Filtern. Er unterscheidet bereits publizierte Haus-/Objektanschriften von nur groben Ortsideen und privaten Airbnb-Einträgen.
- Die öffentlich nachweisbare Anschrift wird ohne erfundene Hausnummer in der Ortskarte angezeigt; die rechtlichen und geografischen Einschränkungen stehen hinter dem aufklappbaren Punkt **„Genauigkeit und Prüfstand“**. Direkte Adresssuche in Google Maps plus OSM-Suche sowie Original- und zusätzliche Gegenprüfquellen sind verfügbar. Externe Suchen werden *nicht* als unabhängige Verifizierung behandelt.
- Nachgewiesene Adressen werden in der bereits vorhandenen fairen Städte-Round-Robin-Vorschau priorisiert, ohne andere Städte zu verdrängen. Private Airbnb-Adressen werden nie aus zufälligen Suchtreffern ergänzt.

## 3. Routeninteraktion und Bewegung

- `routeDirectionAt(points, .73)` berechnet entlang **echter Fußweg-Geometrie** die Position bei 73 % Weglänge und die geografisch korrekte Peilung auf dem Teilsegment. Ab 150 Metern kann ein kleines Richtungssymbol angezeigt werden.
- In **Route Studio** und auf der **einfachen A→B-Fußwegansicht** wird eine zurückhaltende, genordete Laufrichtungsmarkierung eingeblendet. Sie ist auch ohne Animation lesbar, respektiert `prefers-reduced-motion` und die App-Einstellung „Bewegung aus“.
- Das Zeitlabel bleibt an der berechneten Hälfte der Linienlänge, nicht fälschlich in der Luftlinie zwischen Start/Ziel. Keine Richtungspfeile und keine Gehdauer auf schematischen, nicht berechneten Luftlinien.
- Die schmale gezeichnete Route hatte bisher `interactive:false` trotz registriertem Klick-Handler. Ein **unsichtbarer 19px breiter interaktiver Linienbereich** ermöglicht jetzt die Auswahl der jeweiligen Etappe auf Touchscreens.
- Die einfache A→B-Karte zeigt grüne Fußweggeometrie nur, wenn `walkOnly===true`. ÖPNV-Gesamtrouten werden nicht versehentlich als Fußweg eingefärbt; ihre separate Darstellung bleibt erhalten.

## 4. Tests und Grenzen

- Vorher nicht aufgerufene Modelltests aus Phase 44/45 sind jetzt Teil des verpflichtenden `npm run test:portable`.
- Zusätzliche Unit-Tests: Richtungspeilung Nord/Ost/Süd/West/Knick, degenerierte Koordinaten, 16 öffentliche Adressen und Privatobjekte, source-only Filter, genau dokumentierte abgelehnte Italien-Kandidaten.
- Erweiterter echter Chrome-Test: klickbare schematische Strecke ohne falsch eingeblendeten Richtungspfeil; neue Filteransicht mit sichtbarer publizierter Adresse und Google-Maps-Suchlink. Neue Desktop-Screenshot-Datei `46-hausadressen-quellenpruefung-desktop.png`.
- **Offen:** 273 variantenspezifische nicht lokalisierte Einträge, von den öffentlichen Archivkandidaten 16 nur per Anschrift, viele Provider-GPS ohne unabhängigen Gebäudenachweis; zusätzliche Foto-/Lizenzbelege und eine Online-Abnahme mit echten geladenen Kartenkacheln.

**Wichtig:** Die Routengeometrie wird nur von einem tatsächlich berechneten Fußweg übernommen, aber die Routenexistenz ist kein unabhängiger Nachweis des Hotel- oder Wohnungseingangs. Die strikte 75-Meter-Endpunktprüfung aus Phase 45 bleibt bestehen.
