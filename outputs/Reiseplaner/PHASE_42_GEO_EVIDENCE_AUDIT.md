# Phase 42 · Öffentliche Ortsanker und Datenherkunft (15.11.2026)

## Korrekturen der vorhandenen Reiseversion
- **35/57** öffentliche Einzelaktivitäten im V20-Archiv mit einem Quellenpunkt (30 vor dieser Runde).
- Fünf neue aktive Orientierungspunkte: Markt am Cours Saleya (Vieux-Nice), Jardin Exotique (Èze, als optionaler Garten, kein allgemeiner Dorfeingang), dokumentierte Uferpromenade Fondamenta delle Zattere (Venedig; Flächenbezug), Blue Moon am Lido (dortige Strandanlage; **keine** pauschale Preis-/Zugangsbestätigung) sowie Place du Capitole (Toulouse; Innenstadtplatz, **nicht** Matabiau-Gleis).
- Öffentliche Quelle und eingeschränkter räumlicher Bezug werden pro Ort separat im `geoNote` und `geoSourceUrl` gespeichert. Keine gesamte Stadt- oder Spazierroute aus einem einzelnen Koordinatenpaar konstruiert.
- **Montpellier nicht aktiv**: Place de la Comédie ist als geprüfter `candidatePoint` im Archiv dokumentiert, bleibt aber `point:null`, da `montpellier` nicht im Destinationskatalog existiert. Der potenzielle Alternativstopp wird erst bei tatsächlich modellierter Stadt/Route freigegeben. Die Datenübersicht zeigt diesen Fall unter „Alternativstädte“; keine neue Reisevariante wurde ungefragt angelegt.
- Cours-Saleya-Marktzeiten 2026 nur als **historische Bedingung**, nie als zugesicherte September-2027-Öffnung/Verfügbarkeit.

## Funktionale Weiterentwicklung
- Zusätzlich zur bestehenden Liste **fehlender POI-Koordinaten** gibt es im Reiseatlas den getrennten Bereich **„Kartenpositionen ohne unabhängigen Koordinatenbeleg“**.
- Vorhandene, aber nicht unabhängig bestätigte Anbieterkoordinaten und andere ungeprüfte Einzelpunkte sind getrennt filterbar, einzeln lesbar und über das `geo_evidence`-Prüffeld direkt zum vollständig filterbaren Daten-Audit verlinkt. Reine Ankunft-Synthetik und private Airbnb-Datensätze werden in dieser Quellenliste nicht gezeigt.
- Aktivitäten-Reiter ergänzt: **„Mit Koordinatenbeleg“** vs. **„Punkt ohne Quellenbeleg“**; „Mit Kartenpunkt“ umfasst weiterhin beide Gruppen. Es wird niemals automatisch eine neue Koordinate/Route gespeichert.
- Laufende Node-Regression mit Quellen- und Georäumlichkeitstests sowie Headless-Chrome-Regression für Detailseite, Koordinatenfilter, Audit und mobilen Quellenbereich.

## Bewusste offene Bereiche
- Die übrigen **22/57** Einzelaktivitäten ohne Quellenpunkt sind zum Teil flexible Ideen, Gebietsrouten oder noch nicht ausgewählte Anbieter. Nicht jede Aktivität hat sinnvollerweise eine präzise Objektadresse.
- Die Variantenübersichten enthalten zusätzliche POI-Datensätze aus anderen Quellen; Archivzahlen und variantenspezifische Zahlen nicht gleichsetzen oder summieren, ohne Mehrfachverwendung zu berücksichtigen.
- Exakte Betreiberöffnung, Fahrplan, Tarif und Unterkunfts-Checkout für September 2027 sind nicht pauschal bestätigt.
- Externes Wikimedia-Bildhosting, Online-OpenFreeMap-Tile-Download und Tests mit vier privaten Tripsy-Originaldateien sind nicht vollständig in der Offline-Chrome-CI abgedeckt.
- Keine Buchungen, keine Veröffentlichung, keine Änderungen an `main`. PR #5 bleibt Draft.

## Lokale Abnahme
GitHub-Actions mit Node ≥24: `npm run check:portable`, `node test/portable-browser.mjs` mit gesetztem `REISEPLAN_SCREENSHOT_DIR`. Die ZIP-Starter sind weiterhin nutzbar. Screenshots enthalten unter anderem `42-aktivitaeten-einzelnachweise-desktop.png` und `42-koordinatenquellen-smartphone-390.png`.
