# Reiseplaner – Phase 58/59: Genauere Betreiberquellen, drei Ortsbilder und ehrliche Öffnungszeiten-Abdeckung

**Recherchedatum: 16.11.2026.** Änderungen nur in `feature/v7-data-day-accommodation-rail`. Kein Merge nach `main` und keine externe Buchung.

## 1. Fünf vorhandene V50-Einträge anhand öffentlicher Betreiberinformationen ergänzt

Jeder Eintrag erhält `officialAccessV58` mit `sourceUrl`, optional `secondarySourceUrl`, `visitorAddress`, `priceReference`, `hoursReference`, `september2027EventConfirmed:false` und `forTravelYearBookingConfirmed:false`. Das alte `point`, `price`, `selected`, `booked` und `geoEvidence` werden absichtlich nicht verändert. Quellen sind im globalen Katalog als `operator-v58:new_NNN` dokumentiert.

| Original-ID | Ort | Verifizierte Referenz vom November 2026 |
|---|---|---|
| `new_013` | Ground Control, Paris | [Betreiber: Infos](https://www.groundcontrolparis.com/infos-pratiques/) und [FAQ](https://www.groundcontrolparis.com/contact/): Mi–Do 12–00 Uhr, Fr–Sa 12–01 Uhr, So 12–20:30 Uhr. Letzter Einlass 1 Stunde vorher. Großteil der Veranstaltungen kostenlos, Getränke und Speisen nicht pauschal inklusive. Konkrete September-2027-Events nicht bestätigt. |
| `new_033` | Base Nàutica Municipal Mar Bella, Barcelona | [Stadt Barcelona](https://guia.barcelona.cat/es/detall/base-nautica-municipal-de-la-mar-bella_95150102154.html), [Tourismusamt](https://www.barcelonaturisme.cat/wv3/es/page/1117/playa-mar-bella.html): Wassersportzentrum am Passeig Marítim del Bogatell 102, mit Kurs-/Kajak-/Segelangeboten; frühzeitige Reservierung empfohlen. Kein belegter Fixpreis oder freie 2027-Kurszeit. |
| `new_042` | Théâtre de la Mer, Sète | [Jazz à Sète](https://www.jazzasete.com/informations-pratiques/) und [Tourismusamt/Bootsshuttles 2026](https://en.tourisme-sete.com/navettes-maritimes-festivalieres-de-sete-sete.html): nur bei Veranstaltungen, kein täglich geöffnetes Museum; Veranstaltungs-Einlass z. B. 20 Uhr, Konzert z. B. 21 Uhr im Sommer 2026. Shuttle nur für bestimmte Festivaltage 2026, **nicht als 2027-Verkehrsangebot buchen**. |
| `new_072` | Il Bigo, Genua | [Aquarium/Betreiber-Tickets](https://www.acquariodigenova.it/biglietti-bigo), [Porto Antico](https://portoantico.it/cosa-trovi/bigo-ascensore-panoramico/): 40 m Höhe, rundum drehende Kabine; 6 € regulär 2026, 5 € nur mit veröffentlichtem Spezialanspruch; keine automatische Ermäßigung für 18-Jährige. Öffnungszeiten je Saison-/Tageskalender. |
| `new_092` | Kronberg Bobbahn, Jakobsbad | [Bobbahn](https://kronberg.ch/angebot/bobbahn.html), [Zeiten](https://kronberg.ch/index/oeffnungszeiten.html): 1000-m-Abfahrt direkt am Tal, 5–7 Minuten, CHF 9 **pro Bob für ein oder zwei Personen**, kein Bergbahnticket nötig. Bobbahn nur bei trockenem Wetter; bislang veröffentlichte Frühjahrssaison 2027 beweist noch keine Öffnung im September. |

## 2. Drei Commons-Ortsfotos mit geprüftem Motiv und Lizenz

| Ort | Datei | Lizenz |
|---|---|---|
| Ground Control Paris | [Paris - Ground Control (47128148922).jpg](https://commons.wikimedia.org/wiki/File:Paris_-_Ground_Control_(47128148922).jpg) | Fred Romero, **CC BY 2.0**, 2018, zugeschnitten |
| Théâtre de la Mer | [Théatre de la Mer à Sète.jpg](https://commons.wikimedia.org/wiki/File:Th%C3%A9atre_de_la_Mer_%C3%A0_S%C3%A8te.jpg) | Christian Ferrer, **CC BY-SA 3.0**, 2013, zugeschnitten |
| Il Bigo | [Bigo Genova.jpg](https://commons.wikimedia.org/wiki/File:Bigo_Genova.jpg) | Al*from*Lig, **CC BY-SA 4.0**, 2023, zugeschnitten |

Fotozuordnung ausschließlich für exakte öffentliche Ortsnamen, nicht für private Airbnb-Unterkünfte. Urheber-/Lizenzlink und Kennzeichnung als Ausschnitt in den Bildern. Die Bilder laden extern von Wikimedia, nicht offline.

## 3. Google Maps und Preisanzeige

Die direkte Google-Maps-Suche nutzt für überprüfte V53/V56/V57/V58-Orte eine offizielle Besucheradresse, bevor ein alter Nutzer-Pin oder ein mehrteiliger Aktivitätsname eingesetzt wird. Das Linklabel lautet **„Google Maps · öffentliche Betreiberadresse“**, nicht „verifizierter Pin“. Private Airbnb-Wunschlisten behalten nur eine sichere Umgebungssuche.

In `public/browse-hub-v35.mjs` erscheint bei belegten Betreiberpreisen die Betreiberreferenz vorrangig vor der alten Nutzer-Schätzung und ein direkter **Betreiberquelle**-Link. Die Info ist ausdrücklich **nicht** als aktuell buchbarer Preis oder Budgetposition gespeichert.

## 4. Datenqualitätsfehler bei Öffnungszeiten korrigiert

Bisher wurde in `public/entry-completeness.mjs` jede nicht-leere `openingHoursNote` als belegte Öffnungszeit gezählt. Alle **105 ursprünglichen V50-Recherchekandidaten** haben jedoch standardmäßig den Warnplatzhalter „Öffnungszeiten und mögliche Veranstaltungen im September 2027 nicht bestätigt“. Das ist kein belegter Zeitplan und führt im ursprünglichen Vollständigkeits-Audit zu falschem „keine offene Zeitlücke“.

Neue Funktion `hasDocumentedOpeningReference` berücksichtigt strukturierte Öffnungszeiten und konkrete Stundenreferenzen. Platzhalter-Warnungen allein füllen den Stunden-Nachweis nicht mehr. Bei echten Betreiberseiten mit konkreten 2026/2027er Stunden bleibt die historische Referenz erhalten; ein veröffentlichter Plan wird weiterhin **nicht** zu einer 2027er Ticket- oder Betriebszusage.

Das verändert lediglich die sichtbare Dokumentationsqualität, nicht die Reiseplanung. Die auditierte Anzahl offener Stundenfelder kann dadurch steigen – das ist absichtlich korrekter, kein Datenverlust.

## 5. Regressionsprüfungen

`test/verified-place-v58.test.mjs`: fünf V58-Quellen, Altersrabatte, Maps-Adresswahl, drei lizensierte Fotos, unveränderte Buchung/GPS/Preis und sichtbare Betreiberreferenz.

`test/opening-hours-audit-v59.test.mjs`: keine Scheingenauigkeit durch den V50-Stundenplatzhalter, echte Zeitfenster bleiben erhalten, Aktivitäten ohne konkrete Anbieterzeiten bleiben als offene Prüfpunkte markiert.

Beide Tests in `test:portable` eingebunden. Geschützte Hotel-/Airbnb-Adressen, Veranstaltungsbuchungen und 2027-Tickets bleiben unverändert offen.

## Nächste offene Arbeiten

- Mehr konkrete Bilder mit dokumentierter Wiederverwendungslizenz.
- Objekt-spezifische GPS-Koordinaten nur aus unabhängigen Belegen übernehmen; Quellenbild-Kamerastandpunkt ist nicht der Objekteingang.
- September-2027-Veranstaltungen/Seilbahnbetrieb/Hosteltarife später erneut beim Betreiber prüfen.
- Für Restaurants/Clubs gesonderte Angebote und abweichende Öffnungsregeln erfassen.
