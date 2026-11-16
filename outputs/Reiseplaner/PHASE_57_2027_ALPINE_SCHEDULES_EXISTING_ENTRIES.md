# Phase 57: Veröffentlichte Fahrzeiten 2027, sieben bestehende Orte und vier neue Quellenfotos

**Recherchiert am 16. November 2026.** Diese Änderungen liegen im Entwicklungsbranch `feature/v7-data-day-accommodation-rail`, nicht in `main`. Keine Buchungen und kein Deployment.

## 7 bestehende Nutzer-Einträge verbessert

Die sieben Datensätze stehen in `lib/verified-place-updates-v57.mjs` und ergänzen durch `lib/uploaded-places-v50.mjs` auch bereits vorhandene identische Orte, ohne sie zu duplizieren. Jede Quelle erhält in `catalog.sources` den Schlüssel `operator-v57:new_NNN`.

| V50-ID | Ort | Neue Details und Originalquelle |
| --- | --- | --- |
| new_011 | Parc Montsouris, Paris | [Stadt Paris](https://www.paris.fr/lieux/parc-montsouris-1810) nennt Eingänge, Ausstattung und eine eigene Tarif-/Stundentabelle für September 2027; Park ist nicht pauschal rund um die Uhr offen |
| new_012 | Piscine Joséphine Baker, Paris | [Schwimmbad](https://www.paris.fr/lieux/piscine-josephine-baker-2930) hat 25-m-Becken mit getrennten Schul-/Vereinszeiten; [städtischer Sommertarif](https://www.paris.fr/en/pages/swimming-pools-prices-conditions-of-access-and-accessibility-33562) 2026 rund 6,50 €, Jahres- und Tageskalender 2027 offen |
| new_091 | Hoher Kasten, Appenzell/Brülisau | [Seilbahn](https://www.hoherkasten.ch/entdecken/seilbahnen/seilbahn-hoher-kasten/) veröffentlicht für **16.08.–17.10.2027** Berg 08:00–17:00 und Tal 08:20–17:20, etwa 20-Minuten-Takt. Regulär CHF 40 retour/28 einfach. **GA/Halbtax gilt NICHT** |
| new_093 | Appenzeller Schaukäserei, Stein AR | [Betreiber](https://www.schaukaeserei.ch/de/): Mai–Oktober 09:00–18:30, Schauproduktion üblicherweise bis 15 Uhr; [Appenzeller Tourismus](https://www.appenzell.ch/de/sommer/schaukaesereien/appenzeller-schaukaeserei-ag.html): CHF 13 Erwachsene ab 17, CHF 12 für Lernende/Studierende mit Nachweis |
| new_097 | Grindelwald Sportzentrum | [Preise](https://www.sportzentrum-grindelwald.ch/preise/): Hallenbad oder öffentlicher Eislauf je CHF 10, mit gültiger Gästekarte CHF 5; Fitness/Sauna inkl. Bad je CHF 30/15; [Öffnungszeiten](https://www.sportzentrum-grindelwald.ch/oeffnungszeiten/) beachten. **Das Schwimmerbecken ist 17 m, kein 25-m-Becken** |
| new_100 | Luftseilbahn Allmenalp | [Betreiberseite](https://www.allmenalp.ch/de/index.html): Betriebswiederaufnahme **06.05.2027** angekündigt. **Noch kein Sept.-2027-Fahrplan**; [2026-Tarif](https://www.allmenalp.ch/de/luftseilbahn/preise.html) CHF 24 retour/18 einfach, mit gültigem Halbtax/GA oder Gästekarte CHF 19 retour. [Talstation](https://www.allmenalp.ch/de/luftseilbahn/anreise.html) Allmenbahnstrasse 23, etwa 15 Gehminuten ab Bahnhof |
| new_101 | Sunnbüel & Gemmipass | [Seilbahnbetreiber](https://sunnbuel.ch/fahrplan-tarife/): **26.06.–12.09.2027** täglich 08:10–17:20, letzte Bergfahrt 17:10. 2026-Tarif CHF 42 retour/31,50 einfach, mit Halbtax/GA CHF 21 retour, 2027er Preis prüfen; [Talstation](https://sunnbuel.ch/kontakt/) Innere Dorfstrasse 219 |

### Quellenqualität und unveränderte Daten

Die neuen V57-Objekte unterscheiden **bereits veröffentlichte 2027er Saisonintervalle** (`publishedSeason2027`, `seasonWindow2027`, `schedulingAssurance`) von bloßen historischen Öffnungszeiten und noch unsicheren Startdaten. Die Informationen sind **keine Zusage für einen konkreten Reisetag**: Wetter, Wartung, Platzkapazität und Tarifänderungen können die Nutzung verhindern.

`price`, `point`, `selected`, `booked` und `geoEvidence` bleiben unberührt; Betreiberpreise gehen nicht in das Budget ein. Die Stadt-/Bergbahn-Adressen werden bei bekannten V53/V56/V57-Einträgen von `public/google-maps.mjs` bevorzugt verwendet, damit statt eines gesamten Wandergebiets die **öffentliche Talstation** gesucht wird. Es wird **kein** ungeprüfter GPS-Pin daraus erzeugt.

## 4 neue Commons-Bilder mit konkreter Motivzuordnung

1. [Piscine Joséphine Baker, Paris](https://commons.wikimedia.org/wiki/File:Piscine_Josephine_Baker_Paris.jpg), Cahtls, CC BY-SA 4.0, Außenansicht 2020.
2. [Seilbahn Brülisau–Hoher Kasten](https://commons.wikimedia.org/wiki/File:Br%C3%BClisau_Kastenbahn_HoherKasten.jpg), Ark001, CC BY-SA 4.0, 2016; **nicht** das Restaurant.
3. [Klettersteig Allmenalp](https://commons.wikimedia.org/wiki/File:Klettersteig_Allmenalp_Kandersteg.jpg), BenHur, CC BY-SA 3.0, Aufnahme von 2008; **nicht** die Talstation oder 2027er Streckenzustand.
4. [Seilbahn Kandersteg–Sunnbüel](https://commons.wikimedia.org/wiki/File:Seilbahn_Kandersteg-Sunnb%C3%BCel_(1344619257).jpg), Martin Abegglen, CC BY-SA 2.0, 2007; historische Aufnahme.

Die Fotos sind öffentlich unter entsprechender Lizenz nutzbar und werden bei der Anzeige von Commons extern geladen. Für unbekannte Objektfotos werden keine Zimmerbilder oder fremde Bilder ohne geeignete Lizenz verwendet.

## UI und Tests

- Ortsprofile zeigen getrennt den historischen Betreiberpreis, publizierte 2027er Saisonzeiten und noch fehlende Buchungsbestätigung.
- Aktivitätskarten heben eine bereits publizierte 2027er Fahrplanreferenz hervor, ohne ein Ticketversprechen zu formulieren.
- Bei talstationsbezogenen Sehenswürdigkeiten verwendet Google Maps die öffentliche Betreiberadresse statt eines Mehr-Orte-Titels.
- `test/verified-place-v57.test.mjs` prüft sieben Betreiberreferenzen, 2027-Planungsintervalle, fehlende Buchungskonfirmation, unveränderte Koordinaten/Budgets, vier zugeordnete Lizenzfotos und den Maps-Destination-Query.
