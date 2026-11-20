# Prompt 08 – Redaktionelle Vollständigkeitsprüfung Interrail mit Schweiz, 01.–14.09.2027

**Stand:** 20.11.2026 · **nur `interrail_swiss` / 3 Personen**. Keine Änderung der vier ursprünglichen Trips, des Passes, der Preise, der Buchungsstatus oder der `data/day-plans-v32.json`. Vom GitHub-Branch `chat/unified-discovery-2026-11-20` (PR #14, `075cc37d`) abgezweigt; aktueller Windows-HEAD nicht zugänglich. Separate `swiss_lakes`-Reise mit vier Reisenden vollständig unberührt.

Die originale V32-Reise hatte bereits 14 Tage, 27 Aktivitätsslots (auch optionale Ideen) und sieben Fernreisetage. Die folgende redaktionelle Schicht ergänzt die vorhandenen Vorschläge um **42 explizit ungebuchte Morgen-/Mittag-/Abend-Abschnitte** und je Tag Essens-, Transfer-, Puffer- und Alternativhinweise. Nur `activityId`s, die bereits im entsprechenden V32-Tag existieren, bekommen einen `Zum Tag`-Knopf. Organisation, Essen, Strandvorsicht, Gepäck und Puffertage werden **nie** als erfundene POIs in die Karte oder den aktiven Tagesplan geschrieben. Echte Fotos kommen ausschließlich aus `placeThumbnailHtml` und dessen vorhandener lizenzierter Ortsbildquelle; Fotos fremder Unterkünfte oder fiktive Bildnachweise werden nicht erstellt.

## Vorhandene Planung, identifizierte Lücken und gezielte Ergänzungen

| Tag | Stadt / Reisezweck | Vorher: V32-Ortsideen | Fehlender oder problematischer Abschnitt | Ergänzung ohne Dateneingriff |
| --- | --- | ---: | --- | --- |
| 01.09. | Paris: München-Anreise, Seine | 2 | Vormittag und Verpflegung ohne Transferkontext | Zugproviant, Gepäck- und Ankunftspuffer, bestehender Seine-/Quartier-Latin-Abend |
| 02.09. | Paris: Aussicht, Montmartre | 3 | Essen und Wege zwischen Stadtteilen | Stadtblöcke, Bäckerei-Picknick, Metro-/Wegepuffer, verifizierbare externe Links |
| 03.09. | Barcelona: Paris-Anreise | 2 | Morgendliche Fernreise und Check-in | Reservierungshinweis, Ankunft/Gepäck, Strand nur bei tatsächlicher Zeit |
| 04.09. | Barcelona: Parc, Bogatell, Club? | 3 | Optionaler Club hatte keine klare Abend-Alternative | Club bleibt freiwillig, ruhiger Abend und sicherer Rückweg als Alternative |
| 05.09. | Barcelona: Turó, Montjuïc | 3 | Uneindeutiges Verhältnis zur Sagrada-Option und nächste Fahrt | Zwei Stadtblöcke, nur optionales Ticket, Küche/Packen für Sète |
| 06.09. | Sète: Ankunft, Hafen | 2 | Zug am Vormittag und Gepäckphase | Reise, Hafen, Pointe Courte, Ankunftsreserve |
| 07.09. | Sète: Strand, Aussicht | 3 | Sonnenschutz, Mittagspause, Lebensmitteleinkauf | Drei Quellenideen und klarer Hitze-/Wasserpuffer |
| 08.09. | Nizza: Sète-Anreise | 2 | Vormittagsfahrt und vermutlich späte Ankunft | Strand nur bei tatsächlicher Ankunft, kein fiktiver Abendmarkt |
| 09.09. | Nizza: Küste und Hafen | 3 | Vorbereitung für sehr lange Weiterfahrt am Folgetag | Rückkehrreserve, Abend früh beenden, Reiseproviant |
| **10.09.** | **Nizza → Kandersteg** | **0 bewusst** | **12:10-Stunden-Referenz und Anschlüsse, kein gesicherter Gesamtzug** | **Drei reine Logistikabschnitte; null zusätzliche Sehenswürdigkeiten, SBB-/Reservierungslink und Alternative Zwischenübernachtung nur als erneuter Prüfauftrag** |
| **11.09.** | **Oeschinensee** | **3, davon 1 optional** | **Betrieb, Wetter, Geh-/Rückweg, Essen, Preisbelege** | **Gondel, Seeufer, fakultativer Dorfabschluss. Betreiber nennt Sommerbetrieb 24.04.–19.09.2027, 08:30–18:00 Uhr; konkrete Fahrt/Wetter offen** |
| **12.09.** | **Kandersteg → Appenzell** | **1** | **Anreise-/Check-in-Phasen vor der Abendrunde** | **Zwei Logistikblöcke, bestehende Appenzell-Altstadtidee, Ruhe- und Einkaufspuffer** |
| **13.09.** | **Wasserauen → Seealpsee** | **2** | **Extra Regionalfahrt, Wegqualität, Rückkehr und Bergwetter** | **Vorhandene Wanderung + See-Picknick, Rückweg als nicht verortete Organisation, Appenzeller Bahnen extra prüfen; kein achter Pass-Tag angenommen** |
| 14.09. | München-Heimreise | 0 bewusst | Auschecken, Puffer, Essen für den Zug | Drei reine Logistikblöcke, keinerlei neue Besichtigungen |

## Veröffentlichte Quellen und Vertrauensgrenzen

- Bereits im Projekt: `data/day-plans-v32.json`, `data/trips.json`, `data/transport.json`, `data/research-v19-survey-first/activities.json`, `data/sources.json`, offizieller Schweiz-Fokus V82 sowie lizenzierte Bildrenderer.
- **Oeschinensee (verifiziert 20.11.2026):** https://www.oeschinensee.ch/tarife-fahrplan/ – veröffentlichte *Sommer-Betriebsperiode 2027*, **keine Tagesfahrten- oder Ticketgarantie**.
- **Seealpsee:** https://www.appenzell.ch/en/summer/hiking/hiking-tour-suggestions.html – Toureninformationen des Appenzellerland-Tourismus; tatsächliche Wege/Wetter vor Ort prüfen.
- **Appenzeller Bahnen:** https://appenzellerbahnen.ch/de/reiseinformationen/fahrplan.html – aktuelle und frühere Fahrpläne, aber keine konkrete September-2027-Fahrt in die App hinein erfunden.
- **SBB:** https://www.sbb.ch/en/help-and-contact/products-services/timetable.html – Erklärungen zur Vorläufigkeit des Bahnfahrplans.
- Andere Länderverbindungen, Tickets und Fahrpreise nur über bereits vorhandene konkrete Projektquellen verlinkt.

## Sicherheits- und Prüfkriterien

- Inhalt von `data/interrail-swiss-editorial-v08.json` ist **ausschließlich Vorschlags-/Redaktionsmaterial**, nicht Buchungs- oder Kostenänderung.
- Das Original `day-plans-v32.json` wird weder überschrieben noch vollständig neu generiert; `lib/catalog.mjs` lädt das neue Dokument als zusätzliche Anzeigeebene.
- 14 Quelltage werden mit dem bestehenden Reisekalender und den 3 Reisenden abgeglichen. Pro Tag genau `morning`, `noon`, `evening`, und `activityId` muss in einem bereits vorhandenen Tages-V32-Slot vorkommen.
- Die drei anderen Varianten einschließlich `swiss_lakes` sehen diese Anzeige **nicht**.
- Node-Tests und Chrome-E2E prüfen insbesondere 10–13.09., Paris 02.09., Barcelona 04.09., 1440/820/390 px, aktive Übernahme nur durch `day-plan-add`, danach Undo und Unversehrtheit aller vier gespeicherten Varianten.
- Bekannte Grenzen: neuerer Windows/Codex-Arbeitsstand und private Tripsy-Originaldateien sind nicht zugänglich. 2027er Fahrpläne/Preise, Unterkunftsküche und tatsächliche Wander-Bedingungen lassen sich heute nicht verbindlich bestätigen. Keine Käufe, Buchungen, Deployments, PR-Merges.
