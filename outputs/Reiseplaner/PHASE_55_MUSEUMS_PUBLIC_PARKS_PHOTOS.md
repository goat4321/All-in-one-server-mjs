# Phase 55 – Acht belegte Ausflugsorte und fünf lizenzierte Commons-Fotos

**Stand:** 16. November 2026 · **Änderungen nur im Entwicklungsbranch** `feature/v7-data-day-accommodation-rail`.

## Acht neue optional recherchierte Einträge

Die Originaldaten stehen in `data/research-v55/official-discoveries.json` und werden durch `lib/operator-discoveries-v55.mjs` ausschließlich in den passenden Varianten der vier vorhandenen Reisen ergänzt. Reihenfolge der Strecken, Tageszeiten, Buchungsdaten, Ticketbestände und Preise der ursprünglichen Pläne bleiben unverändert.

| Stadt | Individueller Ort | Nachweis und Besonderheit |
|---|---|---|
| Paris | Musée d’Art Moderne de Paris | [Betreiber](https://www.mam.paris.fr/fr/node/20); dauerhafte Sammlung kostenlos, Sonderausstellungen separat; Dienstag bis Sonntag |
| Barcelona | MUHBA Plaça del Rei | [Stadt Barcelona](https://guia.barcelona.cat/en/detall/museu-d-historia-de-barcelona_92086011563.html); regulär 7,30 €, Studierenden-Ermäßigung nur mit Nachweis; Sonntag teilweise kostenlos |
| Sète | Musée Paul Valéry | [Museum](https://museepaulvalery-sete.fr/informations/); abhängig von Sommerausstellung 9,90 € / sonst 6,20 €; Studierenden-/Jugendbedingungen gesondert |
| Nizza | Parc Phoenix | [Betreiber](https://www.parc-phoenix.org/le-parc/infos-pratiques/); 5,50 € Vollpreis im bisherigen Tarif; 2027er Sommeröffnungszeiten laut [Tourismusamt](https://www.explorenicecotedazur.com/culture/parc-phoenix/) veröffentlicht; neuer Eingang bei Straßenbahn, Schließung bei Wetterwarnung |
| Genua | Palazzo Ducale | [Palazzo Ducale](https://palazzoducale.genova.it/home/); Gebäude täglich offen, wechselnde Ausstellungen mit jeweils eigenen Zeiten/Preisen |
| Venedig | Museo Correr | [Fondazione Musei Civici](https://correr.visitmuve.it/de/besucherinformation/); kombinierter Markusplatz-Museumspass, für 15- bis 25-jährige Schüler/Studierende 15 € nach den geltenden Bedingungen, nicht generell wegen Alters kostenlos |
| Appenzell | Kunstmuseum Appenzell | [Appenzellerland Tourismus](https://www.appenzell.ch/de/kultur-und-braeuche/museen/kunstmuseum-appenzell.html); CHF 15 regulär, CHF 10 Studierende mit Nachweis |
| Glarus | Kunsthaus Glarus | [Kunsthaus](https://kunsthausglarus.ch/de/information); CHF 10 regulär, CHF 5 bei nachgewiesener Berechtigung |

Keine Preise fließen automatisch in die tatsächliche Reise-Budgetberechnung ein. Die veröffentlichten Daten sind **Quellenreferenzen vom 16.11.2026**, keine vollständig bestätigten Ticketpreise oder Verfügbarkeiten für September 2027. Betreiberadressen sind überprüfbare Google-Maps-Suchbegriffe, aber **keine behaupteten GPS-Eingangspins**.

## Fünf neue Fotodateien

Fotomotive sind jeweils eindeutig zugeordnet. In `public/curated-place-photos.mjs` stehen Dateititel, Credits und das Original auf Commons:

1. [Musée Paul Valéry – Ausstellungsraum](https://commons.wikimedia.org/wiki/File:Exposition_au_mus%C3%A9e_Paul_Val%C3%A9ry_%C3%A0_S%C3%A8te.jpg), Aviwater, CC BY-SA 4.0.
2. [Parc Phœnix Nizza](https://commons.wikimedia.org/wiki/File:Parc_Ph%C5%93nix_%C3%A0_Nice.JPG), André Alliot, CC0 1.0.
3. [Palazzo Ducale Genua](https://commons.wikimedia.org/wiki/File:Genova_Palazzo_Ducale.jpg), Andrzej Otrębski, CC BY-SA 3.0.
4. [Ballsaal Museo Correr](https://commons.wikimedia.org/wiki/File:Venezia_-_Museo_Correr_-_salone_da_ballo.JPG), Monica Rondoni, CC BY-SA 4.0.
5. [Foyer Kunstmuseum Appenzell](https://commons.wikimedia.org/wiki/File:Kunstmuseum_Appenzell_-_Das_Foyer_im_Kunstmuseum_Appenzell.jpg), Urs Baumann / Kunstmuseum Appenzell, CC BY-SA 4.0.

Alle fünf Commons-Dateibeschreibungen wurden für diese Runde online geprüft. Keines dieser Bilder soll ein privates Hostel- oder Airbnb-Zimmer darstellen. Der Bilddownload erfolgt weiterhin zur Laufzeit über Wikimedia Commons, nicht als lokal gespeicherte Bilddatei.

## UI-Verbesserung

- Die bereits vorhandene Kartenfunktion verknüpft jeden neuen Eintrag mit einer adressbasierten Google-Maps-Suche und einem Anreise-Link; unbekannte Koordinaten bleiben `null`.
- `place-profile.mjs` und `browse-hub-v35.mjs` zeigen V54 **und V55**-Quellennotizen, Tarifreferenzen und den noch offenen Buchungsstatus.
- `media-coverage.mjs` zeigt in der priorisierten Fehlfoto-Liste neben „Quellenfoto ergänzen“ nun zwei direkte Recherche-Links: **Commons-Bildsuche** für den konkreten Eintrag und **Google Maps** für den Standort. Ungeprüfte Suchergebnisse werden nicht automatisch als Objektfotos übernommen.

## Testabdeckung

`test/operator-discoveries-v55.test.mjs` prüft variantengerechten Import, keine Duplikate, ungebuchte Preisreferenzen, die fünf Fotomatches und Lizenzangaben, Kartenlinks, Quellen im Ortsprofil sowie unerlaubte URL-Schemata. Diese Datei ist in `npm run test:portable` eingetragen.

## Weiter offen

Individuelle Quellenfotos für einen Großteil der übrigen Einträge; genaue Pins ohne unabhängig bestätigte Geodaten; 2027-Tagesverfügbarkeit von Museen, Hotels, Bahnen und Clubs; echte Unterkunfts-Endpreise. Kein Merge nach `main`, kein Deployment oder externe Buchung.
