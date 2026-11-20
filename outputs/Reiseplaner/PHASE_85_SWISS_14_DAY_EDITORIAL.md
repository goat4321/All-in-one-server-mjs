# V85 · Redaktionell vollständige 14 Tage, nur `interrail_swiss`

Stand: 20.11.2026. Prüfbasis GitHub-Branch `feature/v7-data-day-accommodation-rail`, PR #5. Vor Beginn lag der Remote-HEAD bei `44dbec1f`, drei Commits vor `13c0f9a` und zwei vor `ab26f9b`. Der nur auf dem Windows-PC liegende, möglicherweise jüngere Arbeitsstand und die privaten Tripsy-Rohdateien waren nicht zugänglich. Im GitHub-Stand liegen die überarbeiteten Datenblöcke von V82/V84 und die bisherige V32-Tagesplanung.

## Vorheriger Plan und neu abgedeckte Lücken

Die vorhandenen Aktivitäten und sieben Fernreisetage bleiben die Quelle für aktive Planung. V85 erzeugt **keine neuen aktiven Aktivitäten, Nächte, Buchungen oder Preise**. Die Vormittags-/Mittags-/Abend-Karten sind redaktionelle *Ideen*, die den bereits vorhandenen V32-Tagesplan ergänzen.

| Datum | Originalplan (aktive/importierte Einträge bleiben unberührt) | Ergänzter redaktioneller Schwerpunkt |
|---|---|---|
| 01.09. Paris | Seine/Quartier Latin, Fernzug | Morgen: Zugproviant und Abfahrt, Mittag: Ankommen, Abend: Viertel/Verpflegung |
| 02.09. Paris | Trocadéro, Montmartre, Canal | Drei Viertel mit echten Ortswechseln, Pausen, Bistro-/Picknickoption |
| 03.09. Barcelona | Barceloneta, Poblenou, Fernzug | Zugtag bis Barcelona Sants, Check-in vor Strand und flexiblem Abend |
| 04.09. Barcelona | Ciutadella, Bogatell, optional Club | Mittagspicknick, Strand/Bewegung, Club nur bei bestätigtem Termin/Alter/Preis |
| 05.09. Barcelona | Turó de la Rovira, Montjuïc, optional Sagrada | Aussichtsfenster, langer Transfer zwischen Hügeln, Abendproviant |
| 06.09. Sète | Canal Royal, Pointe Courte, Fernzug | Ankunfts- und Check-in-Puffer, kleiner Einkauf, ruhige Hafenrunde |
| 07.09. Sète | Corniche, Mont Saint-Clair, Picknick | Küstenwind, steile Wege, Einkauf und längere Erholung |
| 08.09. Nizza | Promenade, Altstadt, Fernzug | Reise bis Nice-Ville, kein Pflichtbesuch bei später Ankunft |
| 09.09. Nizza | Villefranche, Château, Port Lympia | Eigenständiger Regionalausflug und Vorbereitung der langen Alpenfahrt |
| 10.09. Kandersteg | Fernzug, keine neuen Aktivitätsideen | Drei reine Reise- und Versorgungsblöcke; RE1/Simplon und Check-in prüfen |
| 11.09. Kandersteg | Oeschinensee-Gondel, Seeufer, optionale Erholung | **Eine** passende Wanderroute wählen; Betreiberzeit 2027, Wetter, Gondel und Reserve |
| 12.09. Appenzell | Fernzug, kurzer Dorfspaziergang | **Sonntag**: Vorräte vorher besorgen, Unterkunft, Ruhe |
| 13.09. Appenzell | Seealpsee-Wanderung und Picknick | Separates Wasserauen-Regionalticket für drei; T2- und leichte Varianten nicht vermengen |
| 14.09. München | Heimreise, keine Aktivitätsideen | Frühstück/Check-out, letzter Pass-Reisetag, Anschlussreserve |

Jeder der 14 Tage besitzt nun drei unterscheidbare sichtbare Blöcke, Hinweise zu Verpflegung/Küche, Kostenstatus, Transfers/Öffnung, Zeitpuffer, einer Alternative und mindestens zwei Anbieter-/Tourismuslinks. Vorhandene lizenzierte Ortsbilder werden ausschließlich über `placeThumbnailHtml` aus dem bisherigen Katalog verwendet; wo kein sachgerechtes Motiv vorhanden ist, bleibt Symbol/Stadtmotiv statt eines erfundenen Objektfotos. Die zwei reinen Reisetage nutzen höchstens ausdrücklich als Ortsmotiv gekennzeichnete Bilder. Es wurden **keine** neuen Bilddateien oder Bildlizenzen behauptet.

## Integration und Isolation

- Neu: `public/swiss-day-editorial-v85.mjs`. `renderSwissDayEditorialV85(ctx)` liefert ausschließlich für `ctx.trip.id === 'interrail_swiss'`, drei Reisende und den passenden vorhandenen Tag Inhalte. Es gibt weder Speichern noch Budgetmutation.
- Integration in vorhandenes `public/day-plans-ui.mjs`: V85 wird vor dem weiterhin vorhandenen V82-Risiko- und GPX-Bereich gezeigt. Die ursprüngliche Aktivitätsliste, bewusste Hinzufügen-Aktionen und das vorhandene Undo bleiben unangetastet.
- Responsives Design in `public/day-plans-v32.css` für Desktop, Tablet und Smartphone. Auch bei reduzierter Bewegung kein zusätzlicher automatischer Effekt.
- `test/swiss-day-editorial-v85.test.mjs` sichert alle 14 Tage, 42 Zeitblöcke, Quellen und die Vier-Reisen-Trennung ab.
- `test/portable-browser.mjs` enthält konkrete Chrome-Prüfungen und Screenshot-Aufnahmen für **10., 11., 12., 13. September** sowie **Paris 02.09.** und **Barcelona 05.09.**, plus 390-px-Prüfungen für zwei Schweizer Tage. Ergebnisse sind aus dem konkreten Actions-Lauf zu entnehmen; diese Datei allein ist kein Nachweis eines bestandenen Laufs.

## Noch offen

1. Originaldaten-/SQLite-Gesamtregression mit den vier privaten lokalen Tripsy-Dateien und dem neuesten nicht synchronisierten Windows-Stand. Die öffentliche CI nutzt eine gekennzeichnete Seed-Fallback-Datenbank.
2. Ankunfts- und Abfahrtszeiten, endgültige TGV-/EC-Reservierungen, Interrail-Kontingente, Unterkunfts-Check-ins, Küchenzugang und konkrete September-2027-Nahverkehrstarife für drei Personen.
3. Reale Live-Bilder und korrekte Lizenzen jedes vorhandenen Ortsbilds sowie echte Bildabrufe müssen gesondert visuell geprüft werden. Keine künstlichen Hotelbilder, keine fingierten exakten Pins.
4. Öffentlich publizierter Oeschinensee-Sommerbetrieb ist nicht identisch mit garantierter Öffnung am 11.09.2027; Wegstatus/Heuberg/Zugänglichkeit bleiben wetterabhängig.
5. Die Tagesideen sind **kein fertiger Stundenfahrplan** und erzeugen keine automatisch gebuchten Verpflegungs- oder Ticketbeträge. Einkaufswarenkorb und Mahlzeitenverwaltung bleiben separat interaktiv.

**Keine Änderungen an `swiss_lakes`, `interrail_classic`, der vierten Reise, `main`, Reservierungen, Zahlungen oder Deployments beabsichtigt oder durch V85 implementiert.**