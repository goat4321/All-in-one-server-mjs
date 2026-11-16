# Phase 61 – 16 neue offizielle Reiseoptionen, sieben individuelle Commons-Fotos

**Stand:** 16.11.2026. Nur Entwicklungsbranch `feature/v7-data-day-accommodation-rail`; keine Änderung am Standardbranch, keine Buchungen, keine Veröffentlichung.

## Daten- und Kartenimport

Neu: `data/research-v61/official-discoveries.json` mit **16 individuellen Einträgen** und `lib/operator-discoveries-v61.mjs` als abgesicherter Import. Duplikatschutz über Stadt und normalisierten Namen. Die neuen Optionen werden lediglich in vorhandene Städte der jeweiligen Reiseroute eingetragen, nicht in den Tagesplan geschrieben. Insgesamt werden die 16 unterschiedlichen Orte in **38 Varianteninstanzen** abgebildet, da Orte wie Paris und Barcelona in mehreren Varianten vorkommen.

| Stadt | Neue Einträge | Öffentliche Betreiber-/Stadtquelle |
|---|---|---|
| Paris | Musée Bourdelle; Musée de la Libération de Paris | [Bourdelle](https://www.bourdelle.paris.fr/visiter/preparer-sa-visite/informations-pratiques); [Befreiungsmuseum](https://www.museeliberation-leclerc-moulin.paris.fr/venir-au-musee/informations-pratiques) |
| Barcelona | El Born Centre de Cultura i Memòria; Museu Marítim; CosmoCaixa; Parc del Laberint d’Horta | [Barcelona Stadt](https://guia.barcelona.cat/detall/el-born-centre-de-cultura-i-memoria_92086008839.html); [Maritimes Museum](https://www.mmb.cat/en/visit/plan-your-visit/); [CosmoCaixa](https://guia.barcelona.cat/en/detall/cosmocaixa-barcelona_97042092100.html); [Labyrinth](https://guia.barcelona.cat/detall/parc-del-laberint-d-horta_92086011952.html) |
| Nizza | Villa Masséna; Musée Terra Amata | [Stadt Nice: Masséna](https://www.nice.fr/lieux/musee-massena/); [Terra Amata](https://www.nice.fr/lieux/musee-terra-amata/) |
| Genua | Palazzo Reale; Museo d’Arte Orientale Chiossone | [Palazzo Reale](https://palazzorealegenova.cultura.gov.it/orari-e-biglietti/); [Musei di Genova: Chiossone](https://www.museidigenova.it/it/museo-darte-orientale-e-chiossone) |
| Venedig | Museo di Palazzo Grimani; Museo del Vetro Murano; Ca’ Pesaro | [Palazzo Grimani](https://museogrimani.cultura.gov.it/informazioni/); [Museo del Vetro](https://museovetro.visitmuve.it/de/besucherinformation/); [Ca’ Pesaro](https://capesaro.visitmuve.it/de/besucherinformation/) |
| Appenzell | Seilbahn Alp Sigel | [Appenzellerland Tourismus](https://www.appenzell.ch/de/service/verkehr.html?tx_wstourismus_tourismus%5Baction%5D=show&tx_wstourismus_tourismus%5Btraffic%5D=15) |
| Glarus | Anna Göldi Museum Ennenda; Berglistüber | [Anna Göldi Museum](https://www.annagoeldimuseum.ch/informationen/); [Schweiz Tourismus](https://www.myswitzerland.com/de-at/erlebnisse/berglistueber/) |

Besonders relevante Tarif- und Zugangsbedingungen:
- Palazzo Reale Genua: 12 € Vollpreis; **2 € für EU-Bürger von 18 bis 25 Jahren**, Gültigkeit des Kombitickets für Palazzo Reale + Spinola beachten.
- Museo Chiossone Genua: 9 € regulär, **2 € für 18–25-Jährige** laut Stadtmuseen.
- Museo di Palazzo Grimani: **14 € regulär, 2 € für 18–25-Jährige**; 2027 erneut kontrollieren.
- Museu Marítim Barcelona: Museum derzeit **sonntags ab 15 Uhr frei**; die Santa Eulàlia ist zeitweise nicht zu besichtigen.
- Parc del Laberint d’Horta: 2,23 € regulär, mittwochs und sonntags frei; Zahlung nach Stadtinformation nur per Karte und teils beschränkte Besucherzahl.
- CosmoCaixa Barcelona: 8 € regulär; **18 Jahre allein kein Gratis-Tarif**.
- Murano Glasmuseum und Ca’ Pesaro: 7,50 € Ermäßigung nach **Schüler-/Studierendenstatus 15–25 oder weiteren Bedingungen**, nicht automatisch nur wegen des Alters.
- Seilbahn Alp Sigel: CHF 27 Retour in der 2026-Referenz, **GA/Halbtax ausdrücklich ungültig**.
- **Anna Göldi Museum hat bereits eine 2027er Saison vom 1. April bis 1. November veröffentlicht** (Mi–So 13:30–18:00); das ist weder eine Ticketbuchung noch die Garantie für einen bestimmten Öffnungstag.

## Sieben Commons-Fotos

Jedes Foto ist per Stadt und exaktem Ortsnamen zugeordnet. Die Datei-Beschreibungen auf Wikimedia Commons wurden einzeln auf Fotograf, Fotoobjekt und CC-Lizenz geprüft:

| Ort | Commons-Datei | Credit / Lizenz |
|---|---|---|
| Bourdelle | [Paris musee bourdelle ext.jpg](https://commons.wikimedia.org/wiki/File:Paris_musee_bourdelle_ext.jpg) | Velvet, CC BY-SA 4.0 |
| CosmoCaixa | [CosmoCaixa building.jpg](https://commons.wikimedia.org/wiki/File:CosmoCaixa_building.jpg) | Jirka Dl, CC BY-SA 3.0 |
| El Born | [El Born Centre Cultural.jpg](https://commons.wikimedia.org/wiki/File:El_Born_Centre_Cultural.jpg) | Bene Riobó, CC BY-SA 4.0 |
| Laberint d’Horta | [Laberint d’Horta.jpg](https://commons.wikimedia.org/wiki/File:Laberint_d%27Horta.jpg) | Mirkaah, CC BY-SA 3.0 |
| Palazzo Reale | [Genova-palazzo Reale.jpg](https://commons.wikimedia.org/wiki/File:Genova-palazzo_Reale.jpg) | Fernando Galardi, CC BY-SA 4.0 |
| Palazzo Grimani | [Palazzo Grimani, Venice - 2026.jpg](https://commons.wikimedia.org/wiki/File:Palazzo_Grimani%2C_Venice_-_2026.jpg) | Stavros Argyropoulos, CC BY-SA 4.0; bereits bearbeitet, 2026 |
| Murano Glasmuseum | [Murano museo del vetro.JPG](https://commons.wikimedia.org/wiki/File:Murano_museo_del_vetro.JPG) | Abxbay, CC BY-SA 3.0 |

`public/curated-place-photos.mjs` nutzt externe Commons-Foto-URLs und hält Attribution/Dateiquelle sichtbar. Ein Bild darf niemals einer privaten Unterkunft zugeordnet werden. **9 der 16 neuen Orte haben noch kein individuell geprüftes Motiv.**

## Sicherheitsgrenzen

Alle neuen Einträge haben `price:null`, `booked:false`, `selected:false`, `start:null`, `end:null`, `point:null` und `geoEvidence:null`. Offizielle Straßenadressen werden mit `googleMapsSearchUrl` und ÖPNV-Links angezeigt, **nicht** zu erfundenen GPS-Eingängen. Alle Preise sind Betreiber-/Stadt-Referenzen vom November 2026. Der veröffentlichte Saisonhinweis beim Anna Göldi Museum bleibt ausdrücklich ohne Ticketbestätigung.

Tests in `test/operator-discoveries-v61.test.mjs`: Quellen, Variante, Duplikate, Foto-Match und Lizenz, Budget/Buchung, Kartenlinks, besondere 18–25-Tarife und 2027-Saisonbezug. In `npm run test:portable` ergänzt.
