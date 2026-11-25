# Phase 60 – 16 zusätzliche Orte, 7 echte Commons-Fotos und 2 öffentliche Kartenreferenzen

**Recherche-/Importstand:** 16. November 2026. Ausschließlich im Entwicklungsbranch `feature/v7-data-day-accommodation-rail`. Keine Änderungen an `main`, keine Buchung, kein Deployment.

## Umsetzung

- `data/research-v60/official-discoveries.json` enthält **16 unterschiedliche** neue Kandidaten mit individuellen öffentlichen Quellen, Beschreibungen, veröffentlichten Adressen, Öffnungszeiten-Referenzen, Preisreferenzen, Tags und geschätzten Besuchsdauern.
- `lib/operator-discoveries-v60.mjs` importiert nur Kandidaten in Reisevarianten, deren `trip.route` die Stadt bereits enthält: **14 Kandidaten in `interrail_august`**, **2 in `swiss_lakes`**. Keine neuen Routentage werden eingefügt oder bereits geplante Tagespunkte verändert.
- Kategorien: `food` für die Halles de Narbonne und das Berggasthaus Äscher, übrige `activity`. Damit können bestehende Aktivitäts-, Essen- und Schnell-zum-Tag-Funktionen die neuen Einträge wiederverwenden.
- Jede Option startet mit `selected:false`, `booked:false`, `price:null`, `start:null` und `end:null`. Alle Preise sind **publizierte Tarifreferenzen, keine feststehenden Kosten für August/September 2027**.
- `lib/catalog.mjs` registriert `operator-v60:<id>` in `catalog.sources` und stellt Importstatistik unter `catalog.research.operatorDiscoveryV60` bereit.
- `public/place-profile.mjs`, `public/browse-hub-v35.mjs` und `public/entry-completeness.mjs` verarbeiten `discoveryV60` und zeigen Quellen, zeitgebundene Einschränkungen und historische Tarife an. Keine allgemeine Betreiberöffnung gilt als tatsächlich gebuchter 2027-Termin.

## Neue Einträge nach Reisegebiet

| Ort | Neue Ziele | Besonderheiten aus öffentlichen Quellen |
|---|---|---|
| Toulouse | Jardin Japonais Pierre Baudis; Halle de La Machine; Musée Aeroscopia | [Tourismusamt Garten](https://www.toulouse-tourisme.com/activite/jardin-japonais/), [Halle](https://www.toulouse-tourisme.com/activite/la-halle-de-la-machine/) und [Aeroscopia](https://www.toulouse-tourisme.com/activite/musee-aeroscopia/). Halle 2026: 12 € Besuch **oder** Fahrt, 21 € kombiniert. Aeroscopia 16 € regulär, 13 € nur nach Ermäßigungsvoraussetzungen. Montaudran/Blagnac liegen außerhalb des Zentrums. |
| Narbonne | Les Halles; Horreum Romain; Musée Narbo Via | [Stadt Narbonne: Markthalle](https://www.narbonne.fr/halles) 07–14 Uhr, am Montag teilweise eingeschränkt; [Narbo Via Horreum](https://narbovia.fr/accueil-2-2/visiter/visiter-horreum/) 6 € Referenz; [Narbo Via Kontakte/Öffnung](https://narbovia.fr/accueil/nous-contacter/) mit Museumszeiten. |
| Marseille | Parc du Palais Longchamp; Fort Saint-Jean (Mucem-Außenanlagen); Centre de la Vieille Charité | [Tourismusamt: Longchamp](https://www.marseille-tourisme.com/decouvrez-marseille/culture-et-patrimoine/parc-longchamp-marseille-4eme-fr-2791907/) veröffentlicht allgemeine 2027er Parkzeiten; [Mucem](https://mucem.org/infos-pratiques/fort-saint-jean/) bestätigt freie Außenanlagen, Ausstellungen separat; [Stadt Marseille](https://musees.marseille.fr/centre-de-la-vieille-charite-cvc) nennt kostenlos zugängliche Museen in der Vieille Charité. |
| Ventimiglia | Giardini Botanici Hanbury; Museo Archeologico Girolamo Rossi | [Gartenbetreiber](https://giardinihanbury.com/giardino/info-visitatori/orari-tariffe): 2026 10 € regulär, bei Wetterwarnung geschlossen, Anreise zur Mortola per Bus/Taxi; [Archäologiemuseum](https://www.marventimiglia.it/informazioni): 6 € regulär, teilweise geteilte Tageszeiten. |
| Mailand | Museo del Novecento; BAM Biblioteca degli Alberi; Museo Nazionale Scienza e Tecnologia Leonardo da Vinci | [Museo Novecento: Tarife](https://www.museodelnovecento.org/it/biglietti-abbonamenti-card): 5 € 18–25-Jährige, 10 € regulär; [BAM-Betreiber](https://bam.milano.it/visitare-il-parco/) öffentlicher Park; [Technikmuseum](https://www.museoscienza.org/visitare/informazioni) mit eigenen Workshop-/Tageskalendern und extra U-Boot-Führungen. |
| Glarus | Landesplattenberg Engi | [Glarnerland Tourismus](https://glarnerland.ch/de/map/poi/offentliche-fuhrungen-durch-den-landesplattenberg-engi--id--civ_s9t_behsgacb-gfgj-ebsb-rada-hfdaddjugjjc.html): Führungen 2026 ca. 2,5 Std., CHF 28 Referenz; 2027er Veranstaltung noch nicht bekannt, Engi außerhalb Glarus. |
| Wasserauen | Berggasthaus Äscher | [Appenzellerland Tourismus](https://www.appenzell.ch/de/gastronomie/restaurants/berggasthaus-aescher.html): Einkehr ab Ebenalp mit ca. 15–20 Minuten Bergweg, saisonale Öffnung; Menüpreise und 2027er Bergbahnbetrieb separat prüfen. |

## Quellenbelegte öffentliche Gebietspunkte (keine behaupteten Eingänge)

1. `Les Halles de Narbonne`: öffentliches Tourismusinventar [Aude Tourisme](https://www.audetourisme.com/fr/fiche/narbonne/les-halles_TFOPCULAR011FS00011/) publiziert Koordinaten 43°10′52,83″N / 3°00′19,03″E. Bei der Importübernahme in Dezimalgrad konvertiert (43.1813417, 3.0052861).
2. `Giardini Botanici Hanbury`: [italienische ISPRA-Behördendatenbank](https://www.isprambiente.gov.it/it/attivita/museo/regioni/musei/giardini-botanici-hanbury) nennt 43.784514, 7.554547 für das Gartengelände.

Beide Punkte tragen `geoEvidence.url`, `isCentroid:true` und `locationReferenceV07.precision:'sourced_area_center'`. Die Karte beschriftet sie als **öffentlich belegte Gebiets-/Objektpunkte, nicht als exakten Besuchereingang**. Alle anderen 14 neuen Einträge haben weiterhin `point:null`, werden jedoch per adressbasierter Google-Maps-Suche und ÖPNV-Routing erreichbar gemacht.

## 7 individuell dokumentierte CC-Fotos

Alle Bilddateien sind nach den Wikimedia-Commons-Dateibeschreibungen per Ortsnamen zugeordnet, mit Bildautor und Lizenz im Detailprofil. Fotos bleiben externe Wikimedia-Assets mit gestalteten Fallbacks. Keines gehört zu einem privaten Hotel oder Airbnb.

| Ort | Wikimedia-Original | Urheber / Lizenz |
|---|---|---|
| Jardin Japonais Toulouse | [Jardin Japonais, Toulouse.jpg](https://commons.wikimedia.org/wiki/File:Jardin_Japonais%2C_Toulouse.jpg) | Mike Peel, CC BY-SA 4.0 |
| Les Halles Narbonne | [Les halles de Narbonne.jpg](https://commons.wikimedia.org/wiki/File:Les_halles_de_Narbonne.jpg) | Ptitgonevx, CC BY-SA 3.0 |
| Palais Longchamp | [Palais Longchamp.jpg](https://commons.wikimedia.org/wiki/File:Palais_Longchamp.jpg) | Papafred, CC BY-SA 3.0 |
| Fort Saint-Jean Marseille | [Fort Saint-Jean, Marseille.jpg](https://commons.wikimedia.org/wiki/File:Fort_Saint-Jean%2C_Marseille.jpg) | Vlad Mandyev, CC BY-SA 4.0 |
| Vieille Charité Marseille | [La Vieille Charité, Marseille.jpg](https://commons.wikimedia.org/wiki/File:La_Vieille_Charit%C3%A9%2C_Marseille.jpg) | Vincent 13, CC BY-SA 3.0 |
| Museo del Novecento | [Edificio del Museo del Novecento ...jpg](https://commons.wikimedia.org/wiki/File:Edificio_del_Museo_del_Novecento_in_piazza_del_Duomo%2C_Milano.jpg) | Paolobon140, CC BY-SA 4.0 |
| BAM Mailand | [Milano - Biblioteca degli Alberi - 01.jpg](https://commons.wikimedia.org/wiki/File:Milano_-_Biblioteca_degli_Alberi_-_01.jpg) | Guilhem Vellut, CC BY 2.0 |

## Tests

`test/operator-discoveries-v60.test.mjs` sichert unter anderem:
- Alle 16 Kandidaten werden ohne Namensduplikate korrekt in die passenden Varianten importiert.
- Bestehende Reisepläne, Budgets, Buchungen und Termine bleiben unverändert.
- 2 einzeln belegte öffentliche Gebietspunkte werden niemals zu „exakten Eingängen“ hochgestuft.
- 7 Fotoreferenzen zeigen den konkreten Ort und werden nicht für Unterkünfte missbraucht.
- Offizielle Preis-/Quellenhinweise erscheinen im Profil und in der Ortauswahl.
- Ungültige URLs, schlechte Koordinaten und doppelte IDs werden vor dem Import verworfen.

Die Tests sind in `npm run test:portable` eingebunden.

## Weiter offen

14 neue Einträge ohne unabhängig belegte GPS-Punkte, 9 neue Einträge ohne spezifisches Quellenfoto, genaue 2027-Tagesöffnungen, Reisezeiten zu außerhalb gelegenen Attraktionen, tatsächliche Hotel-Checkoutpreise und Buchungen. Die optionalen Einträge sind nicht automatisch auf Tage verteilt.
