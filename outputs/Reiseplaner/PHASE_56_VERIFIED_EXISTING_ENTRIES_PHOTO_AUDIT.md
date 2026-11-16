# Phase 56 – Bestehende Einträge vertieft, gezielte Commons-Bilder, Bildprüfung vollständig durchsuchbar

**Stand:** 16. November 2026, nur Branch `feature/v7-data-day-accommodation-rail`, kein Merge, kein Deployment.

## Fünf in V50 bereits enthaltene Orte, nun mit offiziellen Quellen

`lib/verified-place-updates-v56.mjs` enthält fünf individuelle Prüfnotizen, die `lib/uploaded-places-v50.mjs` sowohl an schon vorhandene identische Einträge als auch an neu importierte Varianten anfügt. Der alte Nutzer-Preis wird **nicht** als offizieller 2027-Tarif übernommen. Jede neue Quelle ist als `operator-v56:new_...` im globalen `catalog.sources` recherchierbar.

| Import-ID | Ort | Betreiberprüfung |
| --- | --- | --- |
| `new_010` | Atelier des Lumières, Paris | [Eintrittspreise](https://www.atelier-lumieres.com/en/plan-your-visit/practical-information/rates) und [variable Veranstaltungszeiten](https://www.atelier-lumieres.com/en/plan-your-visit/practical-information/opening-times): 2026 regulär ab 18 €, Jugend 12–25 Jahre ermäßigt ab 16 €; zeitgebundenes Ticket, **Programm September 2027 offen** |
| `new_029` | Font Màgica, Barcelona | [Städtische Show-/Wartungszeiten](https://guia.barcelona.cat/en/detall/horari-il-luminacio-font-magica-fonts-de-montjuic_99400787700.html): kein verlässlicher, nach Datum bestätigter September-2027-Termin; kostenloser Außenbereich beweist **keine laufende Show** |
| `new_030` | MNAC, Barcelona | [Offizielle Eintritts-/Dachterrassenregeln](https://www.museunacional.cat/en/opening-hours-and-prices): 12 € regulärer Museumseintritt, 2 € nur für Basis-/Dachzugang, samstags nach 15 Uhr bzw. ersten Monatssonntag Museum frei, frühzeitige Reservierung empfohlen |
| `new_043` | MIAM, Sète | [Museum](https://miam.org/horaires-tarifs/): Di–So 10–18 Uhr, 5,60 € Erwachsene, 2,60 € für 10–18-Jährige oder Studierende, erster Monatssonntag kostenlos; Ausweis/Berechtigung und Tarifstand erneut prüfen |
| `new_095` | Gletscherschlucht Grindelwald | [Betreiber](https://www.outdoor.ch/de/outdoor-experience/gletscherschlucht-grindelwald) und [Grindelwald Tourismus](https://grindelwald.swiss/de/map/detail/gletscherschlucht-grindelwald-aaa98968-c9e4-4a2a-b871-8c25abefc234.html): 2026 CHF 21 Erwachsene, saisonal Mai–November, wetterabhängig, ca. 2 km hin/zurück, Bus 122 zum Eingang; September 2027 unbestätigt |

Alle neuen Betreiberadressen werden nur als öffentliche **Suchadressen in Google Maps** verwendet. Die zuvor gespeicherten, unbestätigten GPS-Werte bleiben unverändert, ihre Provenienz wird nicht nachträglich als überprüft bezeichnet.

## Fünf neue, im November 2026 auf Commons einzeln geprüfte Motivdateien

Die Lizenz- und Urheberinformationen bleiben in `public/curated-place-photos.mjs` und sind in den Detailkarten sichtbar:

1. [Parc Montsouris, Paris](https://commons.wikimedia.org/wiki/File:Parc_Montsouris_-_Paris_XIV_(FR75)_-_2025-04-27_-_1.jpg) – Chabe01, CC BY-SA 4.0, Bild von 2025.
2. [Font Màgica von Montjuïc](https://commons.wikimedia.org/wiki/File:Barcelona_Font_m%C3%A0gica_de_Montju%C3%AFc_01.jpg) – Ad Meskens, CC BY-SA 4.0, Bild von 2017.
3. [MNAC-Fassade, Barcelona](https://commons.wikimedia.org/wiki/File:Museu_Nacional_d%27Art_de_Catalunya.JPG) – Vishwa.ar, CC BY-SA 3.0 ES, Bild von 2013. **Kein Dachterrassenfoto**.
4. [MIAM, Sète](https://commons.wikimedia.org/wiki/File:MIAM.0.jpg) – Demeester, CC BY-SA 3.0, Bild von 2010.
5. [Gletscherschlucht Grindelwald](https://commons.wikimedia.org/wiki/File:GrindelwaldGletscherschlucht.jpg) – Herzi Pinki, CC BY-SA 3.0, Aufnahme von 1998. Historisches Motiv, kein Nachweis des heutigen Wegzustands.

Achtung: Die Bilddateien werden über `Special:FilePath` von Wikimedia geladen. Ein lokaler Bildcache existiert nicht; fehlgeschlagene Bildladungen nutzen beschriftete Stadt-/Icon-Ersatzbilder. Es werden keine fremden Hotel-/Airbnb-Zimmerbilder als eigene Motive ausgegeben.

## Foto-Lücken: nicht mehr nur Top 25

Bisher war im UI nur eine Prioritätenauswahl der ersten 25 fehlenden Quellenfotos erreichbar. Die überarbeitete `media-coverage.mjs` zeigt zuerst maximal 25 priorisierte Einträge; **sämtliche übrigen** stehen anschließend in aufklappbaren, alphabetisch sortierten Stadtgruppen. Das responsive CSS liegt in `public/styles.css`.

Jede offene Zeile hat Detailansicht, eine Quellenfoto-Ergänzung und einen Google-Maps-Suchlink. Für **öffentlich benannte Attraktionen** ist zusätzlich die gezielte Commons-Suche verlinkt. Private Airbnb-Angebote bekommen bewusst keine öffentliche Suche nach einem konkreten Objektfoto, damit keine zufälligen Häuser als Unterkunftsbilder erscheinen.

## Automatische Schutz- und Regressionstests

`test/verified-place-v56.test.mjs` überprüft Quellenanbindung, Herkunft, Preis-/Buchungsgrenzen, die fünf lizenzierte Bildmotive, Betreiberhinweise in Profilen und Karten, vollständige Bildlückenanzeige und private Airbnb-Suchbeschränkung.

## Weiter offen

Zahlreiche weitere konkrete Ortseinträge haben noch keine eigens verifizierte Wikimedia-Datei und keine extern überprüfte Eingangskoordinate. September-2027-Öffnungszeiten, Buchbarkeit, Hosteldaten, Zuschläge und Zugfahrpläne werden nicht angenommen. Keine externen Buchungen oder Veröffentlichungen durchgeführt.
