# Phase 37 – Keylose Karte, Aktivitäten, Medien und Datenlücken
Stand: 15.11.2026 · Branch `feature/v7-data-day-accommodation-rail` · Draft PR #5.

## Ziel und Reihenfolge
1. Kartenschicht ohne kostenpflichtigen Pflicht-Key
2. Sorgfältiger Umgang mit lizenzierten Bildern und erkennbaren Platzhaltern
3. Vollwertiger, mobiler Aktivitäten-Reiter
4. Nachvollziehbare Prüflücken mit Handlungsvorschlägen
5. Einheitliches Design
6. Visuelle Gesamtabnahme und letzte Animationsrunde

## Phase 1: Karte (implementiert, Browserabnahme offen)
- CARTO-Rasteransicht mit dem aktuellen "API KEY REQUIRED"-Wasserzeichen als Pflichtlayer entfernt.
- OpenFreeMap-Positron-Vektorkarte via MapLibre als Primärquelle.
- Bei Vektorfehlern ein nutzbarer, deutlich gekennzeichneter OpenStreetMap-Rasterfallback; Attribution, Status und manueller Neuversuch.
- Keine notwendigen Anbieter-API-Keys, kein gekaufter Tarif. Der öffentliche OSM-Tileserver eignet sich als sparsam genutzter Fallback, nicht für Bulk-Scans.
- Fehlerfälle, Layer-Neuladen und Kartenanzeige im Desktop werden in Node-/Chrome-Tests abgedeckt. Die aktuelle CI-Laufzeit kann weiterhin vor den Schritten ausfallen.

## Phase 2: Bilder (partiell umgesetzt, objektbezogene Recherche offen)
- Bereits belegte Wikimedia-Commons-Bilder bleiben eindeutigen Aktivitäten zugeordnet und mit Urheber/Quellenlink versehen.
- Fehlende Objektbilder erhalten dort, wo ein belegtes Bild derselben Stadt verfügbar ist, ein dekoratives **Stadtmotiv mit ausdrücklichem Hinweis: 'kein Foto dieses Eintrags'**. Der Daten-Audit zählt dieses nicht als bestätigtes Objektfoto.
- Karten-/Hotellisten haben damit hochwertigere Kontextdarstellungen, ohne Hotelzimmer, Airbnb-Adressen oder Restaurants zu erfinden.
- Fehler bei externen Bildern zeigen die vorhandene Illustration statt eines defekten Browsersymbols.
- Ohne geprüfte Einzelbilder und Bildrechte werden Anbieterfotos nicht automatisch übernommen. Vollständige Bildabdeckung bleibt offen.

## Phase 3: Aktivitäten (implementiert, E2E offen)
- Neuer Navigationsreiter `Aktivitäten` mit den bestehenden Varianten-Einträgen.
- Stadt- und Gesamtreiseansicht, Suchfeld, Schlagwortkategorien, Merkliste, Sortierung, Karte, Details und Plan-Aktionen.
- Bestehendes responsives Karten-/Card-Design, neue Filter-Chips, zurückhaltende Motion und Reduced-Motion-Schutz.
- Kategorien werden heuristisch aus Namen/Tags abgeleitet und sind keine Anbieterbestätigung.
- Eigens hinzugefügte Node-Tests sowie Chrome-Regression mit Screenshot vorbereitet.

## Phase 4: Offene Angaben (Audit verbessert, Recherche nicht vollständig)
- Das vorhandene komplette `entryCompletenessReport` prüft weiterhin **jeden unterschiedlichen Eintrag** der aktuellen Variante. Fehlende Fotos, Beschreibung, EUR-Preis, Öffnung, GPS-/Quellenposition, Webbeleg, Unterkunfts-Checkout und Zugfahrplan bleiben differenziert.
- Jede Datenlücke zeigt jetzt ein aufklappbares Protokoll mit **Warum offen**, **Dein Beitrag** und **Nächste Recherche**.
- Lokaler JSON-Export enthält jeden offen gebliebenen Eintrag und die einzelnen Felder, um gezielt Links, Fotos oder Bedingungen nachreichen zu können.
- Private Airbnb-Hauskoordinaten und nicht ortsfeste Ideen werden niemals automatisch als Haus-Pins geschätzt.
- **Keine fiktiven Erfolgsmeldungen:** Regelbasierte Lückenhinweise stellen keinen durchgeführten aktuellen Web-Einzelabruf dar. 2027er Hotel-Checkouts, Fahrpläne und manche Preisangaben können noch nicht belegt werden.

## Phasen 5 und 6: nächste Abnahme
- UI-Elemente vereinheitlicht durch bestehende Komponenten für Reiter und Cards; spezifische Filter, Bildblendung und Motion ergänzen.
- Vor weiteren großflächigen Animationsänderungen in Desktop/Mobil (1440×900 und 390×844) reale Screenshots und funktionierende Tastaturbedienung prüfen.
- Vollständige Testreihen: `npm run check:portable`, `node test/portable-browser.mjs`, `npm test` mit den vier ausschließlich lokalen Tripsy-Snapshots.
- Der Runner ist derzeit nicht zuverlässig verfügbar; bestanden wird erst nach tatsächlich ausgeführtem Lauf behauptet.

## Benutzerstart
Im GitHub-Branch (nicht `main`) **Code → Download ZIP**, vollständig entpacken und `Start-Reiseplaner.cmd` verwenden. Node.js >=24 erforderlich; lokale SQLite vorher sichern. `main` bleibt bis zur integralen Abnahme unverändert.
