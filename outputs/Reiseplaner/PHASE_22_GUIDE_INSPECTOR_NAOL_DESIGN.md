# Phase 22 – Offizielle Ortsguides, interaktiver Ortsinspektor und reiferes UI

**Datum:** 14.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · **Draft-PR #5** · **Status:** implementiert, Browser-/CI-Test separat vermerkt.

## Ausgangslage und Designbezug

Der Reiseplaner enthält ursprünglich vier Reisevarianten mit 828 Katalogeinträgen (über Varianten hinweg mehrfach dieselben Orte). In Phase 21 wurde eine dynamische pro-Eintrag-Prüfung (Quellen, Fotos, Öffnungszeiten, Preis, geografische Genauigkeit) sowie eine kontrollierte Wikimedia-Commons-Bildsuche eingeführt. Diese Daten bleiben erhalten.

Das Design orientiert sich am übermittelten Konzept und bisherigen Referenz-Screenshots: Wanderlog (Karte neben Liste), Tripsy (reisebezogene Kurz- und Langinformationen), Designyow/Navica (viel Weißraum, deutliche Hierarchie statt massiver Kachelstrukturen). Das Premium-/Agenturdesign „Naol Websites“ wird **als zuvor definierter Stilwunsch** interpretiert: großzügige Abstände, helles Layout, große Coverbilder, sachliche Typografie, reduzierte Buttons, subtile Übergänge. Die *aktuell live geschaltete* Agenturwebsite war nicht zuverlässig abrufbar, weshalb **kein** exakter Screenshot-Nachbau behauptet wird. Anstelle frei erfundener Fotos bleiben bisherige lizenzierte Motive, hochauflösende Covers und ausdrücklich gekennzeichnete Fallbacks.

Die CSS-Anpassungen in `public/design-round2.css` verfeinern Hauptüberschriften, Zeitkarten, Karte/Listenselektion, Navigationshover, Modal-Visuals und schwächere Trenner. Der bestehende Karten-Explorer wurde nicht ersetzt oder degradiert; bestehende Routen, Buchungs- und Budgetfunktionen bleiben unverändert.

## Neue 21 individuell zugeordnete Ortsguides

`data/research-v22/operator-guides.json` ergänzt **21 sorgfältig zugeordnete** bisherige V19-Aktivitätseinträge:

| Stadt/Region | Aktivitäts-ID | Neue Information (Referenz, nicht gebuchte Leistung) |
| --- | --- | --- |
| Paris | act-003 | Sacré-Cœur: öffentlicher Besuch der Basilika, kostenloser Kirchenraum, Tageszeiten, Kuppel als separat bezahlte Option |
| Paris | act-005 | Louvre: wöchentlicher Schließtag, Abendöffnungen und bedingte EWR-Unter-26-Ermäßigung statt automatischer Annahme von 0 € |
| Paris | act-006 | Eiffelturm: offiziell veröffentlichter 2027-Treppentarif 7,60 € (12–24 J.) bzw. 15,20 € Erwachsene; kein Kauf |
| Barcelona | act-011 | Turó de la Rovira: Saison-/Arealöffnungszeiten bis 19:30 und kein angeblicher unbegrenzter Sunsetzugang |
| Barcelona | act-012 | Sagrada Família: Ticketumfang, regulärer und unter-30-Referenzpreis sowie Audio-App; 2027-Checkout offen |
| Barcelona | act-013 | Park Güell: Basisticket und Zeitfenster-Einlass, 30-Minuten-Kulanz; 2027-Checkout offen |
| Nizza/Èze | act-024, act-027 | Schlossbergpark bis 20 Uhr im Sommer; Èze-Dorf ohne Gartenpflicht, Jardin Exotique getrennt bepreist |
| Genua | act-032–034 | 2 km Nervi-Promenade, Castelletto-Aussicht samt öffentlichem Lift, historischer Porto Antico und Einzelangebote getrennt |
| Venedig | act-037, act-040–042 | Rialtobrücke, Lido-, Murano/Burano-Anfahrt, ACTV 72h Rolling-Venice-Jugendpaket als Verkehrs-Referenz (nicht doppelt buchen) |
| Schweiz/Alpen | act-049, act-050, act-053 | Grindelwald First: Cliff Walk und separat zu bezahlende Gondel, Bachalpsee etwa zwei Stunden zu Fuß, offizielle Oeschinensee-Gondel-Saisonzeiten 2027 |
| Appenzell | act-044–046 | Dorf-/Hauptgassenführung, dokumentierte **separate T2-Rundwanderung** Wasserauen–Seealpsee (7,34 km / 377 hm / 2h30) und Seealpsee-Ufer-/Einkehrreferenz |

Jeder Datensatz enthält Titel, verständliche ausführliche Beschreibung, konkrete Highlights, praktische Warnungen, **exakt einen individuellen offiziellen Referenzlink** und einen Quellen-/Gültigkeitsstatus. Die Detailinformationen werden via `lib/research-v22.mjs` in `lib/catalog.mjs` **nur** anhand des exakten IDs `survey-v19:act-XXX` und des passenden Ortes an bestehende Einträge angehängt. Kein Eintrag wird hinzugebucht oder automatisch ausgewählt. Keine bestehende Gruppen-Summe wird überschrieben. Die Originalquelle erscheint zusätzlich in der normalen Quellenliste (`guide-v22:...`).

**Spezialfall Seealpsee:** Die touristisch beschriebene T2-Rundwanderung über Hüttentobel ist **nicht dieselbe** wie der ursprünglich vorgesehene leichtere Wirtschaftsstraßen-Hin-und-Rückweg. Der neue Guide benennt das ausdrücklich, statt eine vermeintlich identische Wanderstrecke mit falschen Parametern darzustellen.

**Preisrecht und Quellen:** Von Betreibern veröffentlichte 2026-Tarife oder allgemein saisonale Öffnungszeiten dürfen nicht zu bestätigten September-2027-Kaufpreisen werden. 2027 veröffentlichte Eiffelturm-Tarife bzw. Oeschinensee-Betriebsfenster werden genau so gekennzeichnet – ohne daraus eine Buchungszusage zu machen.

## Neuer vollständiger Ortsinspektor

`public/place-inspector.mjs` liefert die interaktive Eintragsansicht für **alle** Arten von Einträgen. `public/forms.mjs` öffnet statt der alten umfangreichen Faktenliste einen einheitlichen, großflächigen, responsiven Inspektor.

- **Übersicht:** lizenzierter Foto-Cover oder ehrlich gekennzeichneter Platzhalter; beschreibende Kurzfassung; beim verknüpften V22-Guide Betreiberfakten, Highlights, praktischer Risikohinweis mit Originalquelle; bisherige vollständige recherchierte Fakten aufklappbar.
- **Fotos:** bestehende Galerie, Commons-Suche und manuelle Aufnahme von Bildlink, Autor, Lizenzquelle. Keine unzulässig kopierten Hotel-Zimmerbilder.
- **Kosten:** sichtbare `€`/`€€`/`€€€`/`€?`-Stufe, bisheriger Referenzbetrag, Buchungsstatus, Bedingungshinweise, Quellentarif; keine imaginären CHF-EUR-Wechselkurse oder nicht belegten Checkout-Angebote.
- **Quellen:** Quellenliste, aktualisierte offizielle Betreiberquelle, Ausführungen zur Verifizierbarkeit, Prüflücken und genaue Prüfschritte.
- **In der Nähe:** maximal fünf andere geografisch verortete Aktivitäten der **gleichen Stadt** innerhalb von fünf Kilometern. Haversine-Kilometer sind **nur Luftlinie**, nicht Gehzeit oder Strecke. Jeder Treffer lässt sich im selben Dialog öffnen.

Der Kopf zeigt Stadt, Objekttyp, Titel, Preisstufe, belegte Quellen, Fotos, offene Qualitätsprüfpunkte sowie **„Auf Karte zeigen“**. Der Fuß erlaubt vorherigen/nächsten Eintrag gleicher Kategorie und Stadt (alphabetische Nachbarschaft). Keine Auswirkung auf Reiseroute oder Auswahl ohne explizites Benutzerhandeln.

`public/app.mjs` steuert die fünf Tabs als echte ARIA-Tabs (Tab-Taste, Links/Rechts, Home/End), wechselt Ortsdatensätze und navigiert beim Kartenbutton zur zugehörigen Stadt/Karte. Ein Dialogwechsel erfolgt direkt im Modal, nicht über eine komplette Seiten-Neuberechnung.

### Wort- und Dateninspektoren als verständliche aufklappbare Erklärungen

`public/inspector-glossary.mjs` integriert in die passenden Tabs sieben per Maus/Tastatur aufklappbare Begriffserklärungen:
1. Preisstufen / €?
2. Gültigkeit eines Webquellenbelegs
3. Buchungsbegriff
4. Exakter Kartenpunkt versus Gebiets-/Gebäudezentrum
5. Luftlinie versus reale Geh- und Fahrstrecke
6. Lizenzrechte für Bildübernahme
7. Abgrenzung aktueller Tarife von explizit veröffentlichten 2027-Tarifen.

Diese Hilfen sind **im Kontext des jeweiligen Eintrags** abrufbar, nicht in einem separaten Tutorial oder als dauerhafte Warn-Box-Flut.

### Bild- und mobile Designs

Breite Hero-Fotos bei passender Creative-Commons-Lizenz, ansprechende Geografie-/Quellen-Cover-Fallbacks, kompakte Fakten-Chips, optisch flache Quellenlisten, ruhige Akzentfarbe. Der Dialog hat Desktop max. 920 px, Mobil max. Viewport-Breite, lesbare Zeilenlängen und horizontal scrollbareren Tabstrip. Animationsfreie Variante bei `prefers-reduced-motion: reduce`.

Der bisherige Karten-Explorer, die detaillierte Tagesplanung, Unterkunfts-/Zug- und Essensdatenbereiche sowie die zugehörigen Verknüpfungen bleiben erhalten.

## Prüfnachweise und offene Restaufgaben

Die mit Node 24 ausgeführte `test:portable`-Suite umfasst alle früheren Regressionen plus `test/research-v22-inspector.test.mjs`. Diese kontrolliert: exakt **21** Guide-IDs, sichere HTTPS-Quelle und Gültigkeit, korrekte V19-Zuordnung, 2027-Tickets/2026-Referenzen, keine Buchungs- oder Budgetänderung, die komplexe Seealpsee-T2-Variante, alle **828** Eintragsinspektoren, fünf zugängliche Tabs, erklärende Glossare und korrekte Luftlinienlogik. Der echte `test/portable-browser.mjs`-Chrome-Lauf testet Tabs, Anzeige, Fotos, City-/Datenbrowser und responsive Viewports. Screenshots `11-place-inspector-overview.png`, `12-place-inspector-cost.png`, `13-place-inspector-mobile-390.png` werden in `reiseplaner-ui-review` bei erfolgreichem CI-Lauf hochgeladen.

**Noch offen:**
- Es gibt weiterhin fehlende Bilder, einzelne Geodaten, nicht bestätigte 2027-Checkoutpreise und Bahnfahrpläne. Die bestehende dynamische Datenabdeckung **Daten & Fristen** erfasst diese ohne vorgetäuschte Vollständigkeit.
- Neue Guide-Texte sind eine **Auswahl von 21**, kein universell persönlich recherchierter Ersatz für 828 variantenspezifische Einträge.
- Ein öffentliches Hotel-/Airbnb-Buchungsfoto darf ohne nachgewiesenes Nutzungsrecht nicht als eigenständiges Website-Foto importiert werden.
- Externe Commons-API ist während browserisolierter Tests nicht live verifiziert; nutzerseitiges Auswahl-/Rechtedatenverfahren bleibt kontrolliert.
- Die Live-Seite „Naol Websites“ war zur Bearbeitung nicht zuverlässig erreichbar; Styling auf Basis des beschriebenen User-Referenzkonzepts.
- Es wurden weder Live-Buchungen noch automatisch bestätigte 2027-Fahrpläne erzeugt. Kein PR-Merge oder Deployment.

## Aufrufen

Im GitHub-Branch `feature/v7-data-day-accommodation-rail` `outputs/Reiseplaner/Start.cmd` mit Node.js 24 starten; danach `http://127.0.0.1:4173` öffnen. In **Karte**, **Entdecken**, **Tagesplan**, **Unterkünfte** einen Eintrag über **Details** öffnen: der neue Inspektor ersetzt die alte Detail-Liste. In **Daten & Fristen** bleiben alle fehlenden Fakten und Bildlücken sichtbar.
