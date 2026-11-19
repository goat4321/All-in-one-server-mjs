# Phase 68 – 37 vorhandene V50-Reiseorte vertieft und sieben Objektfotos

Stand 16.11.2026 · Entwicklungsbranch `feature/v7-data-day-accommodation-rail`, Draft PR #5.

## Ziel / Änderungen

Statt neue, eventuell doppelte Orte zu importieren, bekommen **37 vorhandene öffentliche V50-Einträge** je fünf konkrete Besucherinformationen:
- Sehenswert: zwei quellennah formulierte Highlights;
- praktische Besuchsplanung: Eintritts- und Zutrittsregeln, zeitliche und räumliche Unterschiede;
- kombinierbare weitere Orte als **nicht automatisch eingeplante** Optionen;
- Anreise/Eingang: nur publizierte Adressen und verlässliche Orientierung, keine erfundenen exakten Eingangspins;
- vor Reisebeginn 2027 prüfen: individuelle Sicherheits-, Fahrplan-, Einlass- oder Veranstaltungslücken.

Betroffen: Paris (10), Barcelona (7), Sète (4), Nizza (2), Genua (3), Venedig (3), Appenzell/Wasserauen/Kandersteg/Grindelwald (8). Die tatsächlich befüllten 37 IDs stehen in `data/research-v68/existing-place-guides.json`. 13 zusätzliche öffentliche Primärquellen wurden für ausgewählte Ziele verknüpft; ältere geprüfte Betreiberlinks bleiben bestehen.

**Besonders wichtig:** Der kostenlose Spaziergang auf der Mole Saint-Louis ist nicht die kostenpflichtige Leuchtturmbesteigung; die kostenlose Via Garibaldi ist nicht automatisch eine kostenlose Palastinnenbesichtigung. Die MAMAC- und Montparnasse-Schließungen sowie der unsichere Zugang zur Fondaco-Dachterrasse bleiben ausdrücklich als Einschränkung im Guide. Alle 2027er zeitabhängigen Vorgänge sind offen, sofern keine aktuelle Betreiberpublikation den konkreten Zeitraum nennt.

## GitHub-Integration

- `lib/existing-place-guides-v68.mjs` validiert den Datensatz gegen die 105 ursprünglichen V50-Recherchestellen, nimmt ausschließlich nicht-private Ziele, sucht nach bestehender `uploaded:v50:`-ID oder exakt normalisiertem Stadt/Objektnamen und erstellt **keine** neuen Katalogeinträge.
- `lib/catalog.mjs` bindet das Paket nach dem vorherigen V50/V62-Import ein; 13 Quellen werden in der allgemeinen Quellenliste registriert.
- `public/place-profile.mjs` zeigt fünf neue Infofelder pro Eintrag und gegebenenfalls den zusätzlichen offiziellen Betreiber-/Stadtlink.
- `test/existing-place-guides-v68.test.mjs` prüft Integration, UI-Sichtbarkeit, Quellen, Dublettenvermeidung, keine neuen bestätigten 2027-Preise/Buchungen und Fotozuordnung; in `test:portable` integriert.

**Unverändert:** Nutzerkartenpunkte behalten ihre bisherige (teilweise unbestätigte) Provenienz. Keine Buchung, kein Reisetag, keine Personenauswahl, kein Preis-/Budgetbetrag, kein Hotel und keine private Unterkunft werden überschrieben.

## Sieben Wikimedia-Commons-Bilder

Jeweils konkretes Motiv, Dateiname, Urheber und Lizenz in `public/curated-place-photos.mjs`; externe `Special:FilePath`-URL mit Quellenlink und sichtbaren Credits, kein ungeprüftes Karten-/Suchmaschinen-/Hotelbild.

| Zugeteilter vorhandener Ort | Commons-Dateiseite | Credit / Lizenz |
|---|---|---|
| Île aux Cygnes (Paris) | [Statue de la Liberté, île aux Cygnes, Paris.jpg](https://commons.wikimedia.org/wiki/File:Statue_de_la_Libert%C3%A9,_%C3%AEle_aux_Cygnes,_Paris.jpg) | Polymagou · CC BY-SA 4.0 · zeigt Statue auf Insel |
| Parc de Cervantes (Barcelona) | [Barcelona - Parc de Cervantes 01.jpg](https://commons.wikimedia.org/wiki/File:Barcelona_-_Parc_de_Cervantes_01.jpg) | Joe Mabel · CC BY-SA 4.0 · Park |
| Phare du Môle Saint-Louis (Sète) | [Phare de Sète (1).jpg](https://commons.wikimedia.org/wiki/File:Phare_de_S%C3%A8te_(1).jpg) | Christian Ferrer · CC BY-SA 3.0 · Leuchtturmaußenansicht |
| Via Garibaldi (Genua) | [Genova via G. Garibaldi.jpg](https://commons.wikimedia.org/wiki/File:Genova_via_G._Garibaldi.jpg) | Al*from*Lig · CC BY-SA 4.0 · Straßenansicht |
| Carretera de les Aigües (Barcelona) | [Carretera de les aigues.jpg](https://commons.wikimedia.org/wiki/File:Carretera_de_les_aigues.jpg) | Lizel (Seiko09) · CC BY-SA 4.0 · Wegabschnitt |
| Mont Boron (Nizza) | [Mont Boron, Nice (20260619-IMG 3716).jpg](https://commons.wikimedia.org/wiki/File:Mont_Boron,_Nice_(20260619-IMG_3716).jpg) | Matti Blume · CC BY-SA 4.0 · Mont Boron |
| Giardini della Biennale (Venedig) | [Giardini Biennale 2026.jpg](https://commons.wikimedia.org/wiki/File:Giardini_Biennale_2026.jpg) | Baseluna014 · CC BY-SA 4.0 · Biennale-Eingang statt Gesamtpark |

**Qualität/Grenzen:** Automatisierte GitHub-Actions-Prüfung dokumentiert das technische Verhalten, nicht die Live-Erreichbarkeit von externen Commons-Dateien oder sichere Ticketverfügbarkeit für September 2027. Vor Übernahme in `main` müssen die CI-Prüfungen erfolgreich sein. Originale lokale Tripsy-Regression bleibt separat offen.
