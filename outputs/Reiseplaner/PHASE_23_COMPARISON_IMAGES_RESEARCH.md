# Phase 23 – 16 neue offizielle Ortsrecherchen, echter Ortsvergleich und kuratierte Bilder

**Entwicklungszweig:** `feature/v7-data-day-accommodation-rail` · 14.11.2026 · PR #5 bleibt ein Draft, ohne Merge, Buchung oder Produktionsdeployment.

## 1. Sechzehn zusätzliche individuell belegte Ortsprofile

Der bereits implementierte `research-v22`-Atlas wird von **21 auf 37** eingehend recherchierte und per ID zugeordnete Ortsguides ausgebaut. Jede Ergänzung erhält weiterhin Titel, verständliche Faktenbeschreibung, konkrete Hinweise, Einschränkungen, offiziellen Betreiber-/Tourismuslink und expliziten Zeit-/Buchungsvorbehalt. Die ursprünglichen Preise, Wahlen, Standortzuordnungen, Buchungsdaten und Ausgaben werden dabei **nicht** geändert.

| ID | Ort | Belastbare zusätzliche Aussage | Quelle |
| --- | --- | --- | --- |
| act-002 | Paris, Seineufer | Quai de Montebello als **Teil** der langen Seine-Route, zwischen Petit Pont und Pont de l'Archevêché, Brücke Pont au Double nur für Fußgänger/Radfahrer | https://parisjetaime.com/transport/quai-de-montebello-p1987 |
| act-004 | Paris, Canal Saint-Martin | Im Oktober 2026 veröffentlichter öffentlicher Spaziergang ab Jacques Bonsergent über Quai de Valmy; Picknick am Square Villemin; Kanal insgesamt 4,5 km, davon rund 2 km unterirdisch | https://parisjetaime.com/ger/artikel/paris-ist-kosmopolitisch-a920 |
| act-007 | Paris, Quartier Latin | Historischer Spaziergang via Fontaine Saint-Michel, Boulevard Saint-Michel, Sorbonne und Straßenzüge mit Gastronomie; **kein automatisch kostenpflichtiger Eintritt in das Stadtviertel** | https://parisjetaime.com/ger/artikel/zeitloses-paris%20-a897 |
| act-025 | Nizza, Vieux-Nice / Cours Saleya | Der 2026er Obst-/Gemüse-/Fischmarkt ist nach dem veröffentlichten Zeitplan Dienstag–Sonntag 6–13:30 Uhr geöffnet, Zugang frei; montags statt dessen separate Antiquitätenstände; **2027 noch einmal prüfen** | https://www.explorenicecotedazur.com/evenement/marche-aux-fruits-legumes-et-maree-du-cours-saleya/ |
| act-030 | Genua, Boccadasse | Historisches Fischerviertel, kleiner Kieselstrand, Ort am östlichen Ende von Corso Italia, getrennte Gastronomie-/Strandangebote | https://www.visitgenoa.it/de/node/29573 |
| act-031 | Genua, Corso Italia | Öffentliche Meerespromenade mit Jogging- und Skater-Nutzung. Die „2,5 km“ der ursprünglichen Kartenidee sind keine belegte exakte Start-Ziel-Strecke | https://www.visitgenoa.it/de/node/25415 |
| act-035 | Genua, Altstadt | Caruggi, UNESCO-Palazzi dei Rolli, Kathedrale San Lorenzo, Focaccia als separat zu bezahlende Bäckereiwaren | https://www.visitgenoa.it/en/node/21427 |
| act-036 | Genua, Nervi-Küste | Anita-Garibaldi-Promenade rund 2 km, Spazier-/Sportkulisse über felsiger Küste, nicht mit der gesamten Anfahrt gleichsetzen | https://www.visitgenoa.it/en/node/1811 |
| act-052 | Grindelwald First Flyer | 800 m Seilrutsche, bis 84 km/h, vier Personen parallel, **35–125 kg** Betriebsvoraussetzung, CHF 35/CHF 26 als gegenwärtige Referenz; keine garantierten 2027 Slots | https://www.jungfrau.ch/de-ch/grindelwaldfirst/first-flieger/ |

### Ergänzende sieben offizielle Guides

| ID | Ort | Präzise Aussage und notwendige Abgrenzung | Quelle |
| --- | --- | --- | --- |
| act-008 | Bogatell Beach, Barcelona | Städtisches Strandprofil mit konkreter Adresse und Rauchverbot; veröffentlichte Zeiten der **assistierten Badeleistung sind keine Strandöffnungszeiten** | https://guia.barcelona.cat/en/detall/bogatell-beach_92168143754.html |
| act-019 | Sète, Canal Royal | Stadtkanal und Hafenpromenade; die touristische 45-Minuten-Bootstour wäre ein separat zu bezahlendes Erlebnis | https://www.archipel-thau.com/de/ein-archipel-aus-gemeinden/sete/die-highlights-von-sete/ |
| act-020 | Sète, Pointe Courte | Historisches Fischerviertel, niedrige Häuser, Film von Agnès Varda; Teilgebiet statt einzelner Gebäudeeingang | https://www.archipel-thau.com/de/ein-archipel-aus-gemeinden/sete/die-highlights-von-sete/ |
| act-026 | Villefranche-sur-Mer, Marinières | Öffentlich zugänglicher Strand ohne Eintritt laut Tourismusbüro, Badeaufsicht nur in der jeweiligen Saison; TER-Anreise ohne angenommenen 2027-Fahrplan | https://www.explorenicecotedazur.com/structure/plage-des-marinieres/ |
| act-028 | Nice, Port Lympia | Optionaler Küstenweg bis Villefranche ungefähr **6 km / 2h30 einfach** – ausdrücklich **nicht** mit kurzem Hafen-Abendspaziergang identisch | https://www.explorenicecotedazur.com/sortir/randonnees/sentiers-du-littoral/ |
| act-047 | Klöntalersee, Uferweg | Komplette Seeumrundung laut Schweiz Tourismus ungefähr **4 h**, aber ursprünglich geplante kurze Seeufertour ist nicht dasselbe | https://www.myswitzerland.com/de-de/reiseziele/kloentalersee/ |
| act-048 | Rhodannenberg, Picknick | Ein offiziell dokumentierter Trailrun ab Rhodannenberg ist **21 km / 1142 Höhenmeter** – getrennt von einer ungezwungenen Rast am See | https://www.myswitzerland.com/de-at/erlebnisse/route/trail-run-kloentalersee/ |

**Hinweis zum Stand:** Die Quellen belegen einzelne Hinweise auf städtischer oder touristischer Betreiberseite. Für 2027 gibt es noch keine allgemein bestätigten Eintrittskarten, Öffnungszeiten des einzelnen Strandservices oder verifizierten Bahnverbindungen.

**Keine bewusste Preisüberschreibung.** Ein Eintritt beim Anbieter und ein öffentlicher Weg sind eigenständige Leistungsarten. 2026-Veröffentlichungen belegen nicht automatisch die gleiche Bedingung im September 2027.

## 2. Neue Vergleichsfunktion im Ortsinspektor

Auch die zuvor eingeführte Fünf-Tab-Ansicht wird funktional erweitert:

1. **Zum Vergleich** beim ersten passenden Eintrag auswählen.
2. Den **nächsten Eintrag derselben Stadt und Kategorie** aus der Fußnavigation oder über die Liste öffnen.
3. Ein bis drei Einträge können unverbindlich in einer **temporären Auswahl je Reisevariante** liegen. Ab zwei Einträgen öffnet **Vergleich (2)** eine große Gegenüberstellung.
4. Bis zu drei Orte nebeneinander vergleichen: Bild, Ortsname, Preisstufe und Bezugsgröße, Buchungsstatus, konkrete Beschreibung, offizielle Guide-Highlights, verlinkte Primärquelle, Kartenkoordinaten und noch fehlende Belege.
5. Jede Spalte enthält **Details öffnen** und **Entfernen**, außerdem gibt es **Auswahl zurücksetzen**. Wählt man einen Ort aus einer anderen Stadt oder Kategorie, beginnt bewusst ein **neuer** Vergleich.
6. Es werden **keine** Favoriten, Reisetage, Tickets, Einkäufe oder Reservierungen geändert. Die Vergleichsauswahl besteht nur innerhalb der laufenden Browseransicht und wird beim Variantenwechsel zurückgesetzt.

Umsetzung:
- `public/inspector-comparison.mjs`: robuste vergleichende Darstellung aus tatsächlich vorhandenen, nicht automatisiert bereinigten Informationen. Fehlende Preise bleiben unbekannt, Quellen und Datengenauigkeit sichtbar.
- `public/place-inspector.mjs`: Vergleichssteuerung im vorhandenen Header.
- `public/forms.mjs`: leitet den reinen in-memory Vergleichsstatus zur Detaildarstellung durch.
- `public/app.mjs`: steuert add/remove/open/detail/clear mit strikter Trennung nach Stadt und Art, ohne persistente Änderungen.
- `public/design-round2.css`: reaktionsschnelle Vergleichstabelle mit horizontalem Scrollen, fixierter Eigenschaftenspalte, Ruheflächen, bildbetonten Spalten und guter Smartphone-Nutzung.
- `test/inspector-comparison.test.mjs` und `test/portable-browser.mjs`: Quellenerhalt, begrenzte Auswahl, echte Nutzeraktionen, keine falschen Buchungsbehauptungen, reale Browsertests und visuelle Screenshots.

## 3. Fünf neue Wikimedia-Commons-Fotos mit überprüfter Urheber-/Lizenzquelle

Von **25 auf 30** fest eingebundene Motivzuordnungsregeln. Jeweils nur `kind=activity` und genau die passende Stadt/Ortsnamen-Regel, keine Hotelzimmer oder beliebige generische Bilder:

| Eintrag | Bilddatei / direkte Beschreibung | Urheber | Lizenz |
| --- | --- | --- | --- |
| Trocadéro Paris | https://commons.wikimedia.org/wiki/File:Eiffel_Tower_seen_from_Trocad%C3%A9ro_Gardens.jpg | DiscoA340 | CC BY-SA 4.0 |
| Canal Saint-Martin Paris | https://commons.wikimedia.org/wiki/File:Paris_10e_Canal_Saint-Martin_758.jpg | GFreihalter | CC BY-SA 4.0 |
| Montjuïc Barcelona | https://commons.wikimedia.org/wiki/File:View_from_the_slope_of_Montju%C3%AFc_in_Barcelona.JPG | Image tube | CC BY-SA 4.0 |
| Vieux-Nice / Cours Saleya | https://commons.wikimedia.org/wiki/File:Cours_Saleya_market_fruit_stalls_Nice_2026.JPG | Mike is Michi | CC BY-SA 4.0 |
| Corso Italia Genua | https://commons.wikimedia.org/wiki/File:Passeggiata_corso_italia_genova.jpg | Alessio Sbarbaro | CC BY-SA 2.5 |

Die Daten enthalten Kreditangabe, Lizenzbezeichnung, Original-Dateiseite und Hinweis auf CSS-Bildausschnitt. Die Creative-Commons-2.5-Lizenz wird jetzt ebenfalls direkt verlinkt. Die aktuellen Quellenfotos können im Browser durch Wikimedia-Server oder zeitweiligen Offlinebetrieb ausfallen; dann zeigt die Website einen fallback statt einer falsch behaupteten Fotoabdeckung. Die neue Anzahl **30** beschreibt **Zuordnungsregeln**, nicht notwendigerweise 30 unterschiedliche Motive oder 30 vollständig bildversorgte Reiseorte.

## 4. Status und offene Arbeiten

Der verifizierte Entwicklungsstand liegt unter Pull Request #5 im Branch `feature/v7-data-day-accommodation-rail`; vor einem Einsatz auf der produktiven Website muss ausdrücklich ein Merge/Deployment erfolgen. Es wurden keine Fahrpläne für September 2027 erfunden oder Hotels gebucht.

**Weiterhin keine vollständige Abdeckung:** 828 variantebezogene Original-Katalogeinträge bedeuten nicht 828 verschiedene Orte. Individuelle Bild-/Hotel-, Bahn- und Öffnungszeitbelege fehlen teilweise. `Daten & Fristen` und die Ortsinspektor-Quellenbereiche zeigen diese Lücken.

## 5. Start und Visual-Prüfung

Nach Checkout des Entwicklungsbranchs in `outputs/Reiseplaner/` die `Start.cmd` ausführen (Node 24) und `http://127.0.0.1:4173` öffnen. Auf Karte oder Entdecken einen Ort auswählen → **Details** → **Zum Vergleich**; im gleichen Stadt-/Objekttyp einen zweiten wählen → **Vergleich (2)**. Neue Desktop-Screenshot-Datei `14-place-comparison-desktop.png` wird in GitHub Actions `reiseplaner-ui-review` erzeugt, sobald der Chrome-Testlauf erfolgreich ist.
