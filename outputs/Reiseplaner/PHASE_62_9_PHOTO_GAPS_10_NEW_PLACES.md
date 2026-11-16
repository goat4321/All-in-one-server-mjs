# Phase 62 – Neun Foto-Lücken geschlossen, zehn neue Orte, Anna-Göldi-Saisonbericht korrigiert

**Bearbeitet am 16.11.2026** auf `feature/v7-data-day-accommodation-rail`. Der Hauptbranch und alle bestätigten Tagespläne bleiben unverändert; es wurde nichts gebucht.

## A. Neun bisher noch fehlende V61-Fotos

In `public/curated-place-photos.mjs` hinzugefügt; die Fotos werden bei den passenden öffentlichen Aktivitäten (keine privaten Unterkünfte!) angezeigt und bleiben extern von Commons geladen. Künstler, Lizenz, tatsächliches Motiv und historisches Fotojahr bleiben im Credit sichtbar.

| Ort | Commons-Datei und Quelle | Attribution |
|---|---|---|
| Musée de la Libération Paris | [Barrière d’Enfer / Museumspavillon](https://commons.wikimedia.org/wiki/File:Barri%C3%A8re_d%27Enfer%2C_place_Denfert-Rochereau%2C_Paris_03.jpg) | Coyau · CC BY-SA 3.0 · Gebäudepanorama 2010 |
| Museu Marítim Barcelona | [Museumsfassade / Foyer](https://commons.wikimedia.org/wiki/File:001_Museu_Mar%C3%ADtim_de_Barcelona%2C_fa%C3%A7ana_nord%2C_des_del_vest%C3%ADbul.jpg) | Enric · CC BY-SA 4.0 · 2025 |
| Villa Masséna Nizza | [Villa von außen](https://commons.wikimedia.org/wiki/File:Nice%2Cmus%C3%A9e_Mass%C3%A9na100.jpg) | Finoskov · CC BY-SA 4.0 · 2016 |
| Terra Amata Nizza | [Innenraum / Sammlung](https://commons.wikimedia.org/wiki/File:Vue_de_l%27int%C3%A9rieur_du_mus%C3%A9e.jpg) | Jadakeo · CC BY-SA 4.0 · 2016 |
| Museo Chiossone Genua | [Museumszugang](https://commons.wikimedia.org/wiki/File:Museo_d%27arte_orientale_Edoardo_Chiossone.JPG) | Cymothoa exigua · CC BY-SA 3.0 · 2013 |
| Ca’ Pesaro Venedig | [Palast am Kanal](https://commons.wikimedia.org/wiki/File:Ca%27_Pesaro_(Venezia).jpg) | Adriano · CC BY-SA 3.0 · 2005 |
| Alp Sigel Appenzell | [Alp-Sigel-Landschaft](https://commons.wikimedia.org/wiki/File:Auf_der_Alp_Sigel_im_Appenzellerland.jpg) | Barbara Steinemann · CC BY-SA 4.0 · 2019, **keine Seilbahnkabine** |
| Anna Göldi Museum | [Hänggiturm / Museumsgebäude](https://commons.wikimedia.org/wiki/File:H%C3%A4nggiturm_Ennenda%2C_Gemeinde_Glarus_(19123595121).jpg) | Samuel Trümpy Photography / Gemeinde Glarus · CC BY 2.0 · 2015 |
| Berglistüber Wasserfall | [Wasserfall Fätschbach](https://commons.wikimedia.org/wiki/File:Berglist%C3%BCber_F%C3%A4tschbach.jpg) | Pixabay-Nutzer allerlei · CC0 1.0 · 2008 |

Die Datei-Erstellung sichert Attribution, nicht den fortdauernden Betrieb von Commons. Für echte Offline-Bilder muss weiter ein lokaler, lizenz- und bildrechtlich korrekter Download/Cache erfolgen.

## B. Zehn neue optionale V62-Aktivitäten

`data/research-v62/official-discoveries.json`, `lib/operator-discoveries-v62.mjs`, `lib/catalog.mjs` und die bestehenden UI-Module importieren und zeigen 10 einzigartige neue Orte in den vier Reisevarianten.

| Ort | Neue Daten | Quelle |
|---|---|---|
| Paris: Musée Curie | 2026 Mi–Sa 13–17 Uhr, **kostenlos**, im August vollständig geschlossen. Explizit **nicht** in `interrail_august` importiert | [Institut Curie, Museumsordnung](https://curiotheque.musee.curie.fr/s/fr/page/reglement-interieur) |
| Paris: Parc des Buttes-Chaumont | Kostenlos, aktuelle Sperrungen der Insel, Tempel und Kaskaden sowie getrennte 2027-Zeitfenster; keine angenommene Öffnung des Tempels | [Stadt Paris](https://www.paris.fr/lieux/parc-des-buttes-chaumont-1757) |
| Barcelona: CCCB | 2026 8 € pro Ausstellung online, 10 € vor Ort, getrennte Ermäßigungsbedingungen, Di–So 10–20 Uhr | [CCCB Betreiber](https://www.cccb.org/en/visit) |
| Sète: Musée de la Mer | **Eintritt frei**, Referenz Mo/Mi–So 10–18 Uhr, Dienstag zu, Adresse 1 rue Jean Vilar | [Offizielles Tourismusamt](https://en.tourisme-sete.com/musee-de-la-mer-sete.html) |
| Nizza: Palais Lascaris | 5 € regulär, kostenlos unter 18 oder für Studierende mit Nachweis, barocker Museumsbau ohne Aufzug | [Stadt Nice](https://www.nice.fr/lieux/palais-lascaris/) |
| Nizza: Musée de la Photographie Charles Nègre | 5 € regulär, Studierende/unter 18 mit Nachweis kostenlos; Galerie-Mittagspause | [Stadt Nice](https://www.nice.fr/lieux/musee-de-la-photographie-charles-negre/) |
| Genua/Pegli: Parco Villa Durazzo Pallavicini | 2026 11 € werktags, 13 € am Wochenende; eingeschränkte 13–18-Jahre-Tarife, lange Anreise bis Pegli | [Parkbetreiber](https://www.villadurazzopallavicini.it/en/informazioni-pratiche/) |
| Genua/Nervi: Parchi di Nervi | Frei zugänglicher öffentlicher Park; 2026 für Hitzesommer zeitweise bis 21 Uhr geöffnet. Das ist **kein** garantierter 2027er Fahr-/Öffnungsplan | [Stadt Genova](https://smart.comune.genova.it/articoli-comunicati-stampa/parchi-e-giardini-anche-questanno-chiusura-posticipata-alle-21-il-caldo) |
| Venedig: Museo Fortuny | 15 € regulär, 7,50 € bei Schüler-/Studierendenstatus 15–25 bzw. weiteren Bedingungen. Kombiticket mit Ca’ Pesaro prüfbar | [Musei Civici di Venezia](https://fortuny.visitmuve.it/en/visitor-information/) |
| Appenzell: Kunsthalle Appenzell | Öffnung 2026 April–Oktober Mi–Fr 12–18 Uhr, Sa/So 11–17 Uhr; CHF 15 Kombiticket Kunsthalle/Kunstmuseum, Studierende mit Nachweis CHF 10 | [Appenzellerland Tourismus](https://www.appenzell.ch/de/kultur-und-braeuche/museen/kunsthalle-appenzell.html) |

Der Import verwendet nur die schon geplanten Ortsvarianten. Die zehn unterschiedlichen Orte werden auf 25 Varianteninstanzen verteilt: Classic 9, Swiss-Interrail 7, August 8, Schweiz-Seen 1. `point:null`, `price:null`, `selected:false`, `booked:false` bleiben Default. Kein Tagesplan wird überschrieben.

### Ein einziger neuer öffentlicher Kartennachweis

Das offizielle Tourismusamt von Sète veröffentlicht für das Musée de la Mer den öffentlichen Museumskoordinatenpunkt **43.39365, 3.69172**. Drei Varianten übernehmen diesen **öffentlich belegten Objekt-/Gebietspunkt**, gekennzeichnet `geoEvidence.isCentroid:true`; dies beweist weder die genaue Eingangsposition noch Barrierefreiheit. Die übrigen neun neuen Orte verwenden nur Adressen in Google Maps und keine erfundenen Koordinaten.

### Datenqualitätskorrektur Anna Göldi Museum

Die offizielle Seite `https://www.annagoeldimuseum.ch/informationen/` nennt **Saison 2026**, vom 1. April bis 1. November, nicht Saison 2027. In `data/research-v61/official-discoveries.json` wurde die irrtümlich behauptete 2027er Saison entkräftet. `discoveryV61.publishedSeason2027=false`, und der zugehörige Test sowie die V61-Dokumentation wurden korrigiert. Kein Veranstaltungs- oder Öffnungsversprechen für 2027.

### Tests

`test/operator-discoveries-v62.test.mjs` prüft Quellen, 25 Varianteninstanzen, Fotos, August-Ausschluss, Sète-Pin, Buchung/Preis-Nullwerte und Entkräftung falscher 2027-Zeitreferenz. In `test:portable` eingetragen. Alle Preise sind 2026er Referenzen, keine September-2027-Buchungsbestätigung.
