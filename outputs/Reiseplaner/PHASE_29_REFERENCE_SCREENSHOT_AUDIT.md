# Phase 29 – Strenger Abgleich mit Original-Referenzbildern (14.11.2026)

**Geltungsbereich:** Reisekarte und Tagesablauf, nicht die anderen Verwaltungsseiten. Draft-PR #5. **Verbindliche visuelle Hauptreferenz** ist `Barcelona-Reise im grünen Reiseplaner.png` (1672 × 941). Zweite fachliche Referenz ist `image-gen-1(4).png` („InterrailPlan“, ebenfalls 1672 × 941). Weitere tatsächlich geöffnete Referenzdateien: `image(20261113-212622).png`, `image(20261113-212628).png`, `image(20261113-212641).png`, `image(20261113-212651).png`, `image(20261113-212732).png`, `image(20261113-212740).png`, `image(20261113-212243).png`, `image(20261113-212310).png`, `image(20261113-212325).png` sowie die bisherigen `reiseplaner_v18_designvergleich(1).png` und `18-reference-day-map-desktop-1440(2).png`. Einige sind Varianten/Schrägansichten desselben Navica-/Designyow-Dashboards; sie wurden nicht als unabhängige Anwendungsdaten behandelt.

## 1. Referenzbilder – konkrete verbindliche Merkmale

| Bildgruppe | Befund und umgesetzte Zielvorgabe |
| --- | --- |
| Barcelona-Reise – **Hauptziel** | Horizontaler weißer Kopf (ca. 60 px), darunter kompakter panorama-/fotoorientierter Reiseabschnitt; Tageschronologie links (ca. 27 % der Breite), großer Kartenausschnitt rechts (ca. 67 %). Karte und Kalender beginnen ungefähr bei y=170 px, Kartenbereich 450 px hoch. Ab y≈640 folgt eine einzeilige Foto-Entdeckung mit großen Bildausschnitten, weichen Schatten, 15–24-px-Rundungen und klaren grünen Aktionspillen. Gruppen Morgen/Mittag/Nachmittag/Abend erkennbar, aber nur wenn echte Zeit-/Tagesdaten existieren. |
| InterrailPlan – Reise-/Transportlogik | Ausgesprochene Zeitleiste links, visuell getrennte Verkehrsmittel/Wege, präzise Routenbeschriftungen neben der Karte; Kollisionen direkt am Tagesablauf. Blaue/teal Verkehrslinien sind **Funktionsreferenz**, nicht Auftrag, die grüne primäre Barcelona-Markenpalette zu ersetzen. |
| Navica (212622, 212732, 212740) | Dünne dezente Rahmen, runde Suchfelder, klarer Kopf, großzügige Weißräume, reduzierte Informationsdichte. Keine Übernahme fremder exemplarischer Wetter-/Flugkarten oder Bewertungen. |
| Designyow (212628, 212641, 212651) | Kleine offene Navigationschips, minimalistische Detailkarten und lockere Typografiestufen statt mehrerer massiver farbiger Kästen; responsive, aber keine identischen Layout-Daten. |
| 212243 und 212310 | Konzepttafel bzw. Karte-Detail-Layout: kontextnahe Karte statt isolierter Datenliste; Hauptfokus auf Ort, Auswahl und Handlungen. |
| 212325 / vorhandenes Markenprojekt | Dunkelgrüne Premium-Markenanmutung als Sekundärreferenz für Typografiekontrast und sparsame CTA-Betonung, **nicht** dunkelgrüner Hintergrund der hellen Reisekarte. |

**Widersprüche der verschiedenen Vorlagen** werden in der konkreten Reisekarten-Seite zugunsten der eindeutig passenden *Barcelona-Reise*-Hauptvorlage aufgelöst. Diese Rangfolge verhindert eigenmächtige Stilwechsel.

## 2. Ist-/Soll-Vergleich anhand echter Screenshots

**Ausgangsscreenshot:** GitHub-Action-Rendering `18-reference-day-map-desktop-1440.png` aus Phase 28 / vor Phase 29, 1440 × 900. **Nachher-Screenshot:** echter Headless-Chrome-Lauf `22-reference-city-map-1440.png` aus Action #43616200064 (Commit `6a0e988`), ebenfalls 1440 × 900; vor dem neuesten kompakten Fahrplanhinweis. Ein visueller Drei-Spalten-Vergleich liegt als separate PNG-Datei in der aktuellen Unterhaltung.

| Abweichung | Vorher (ungefähr) | Nachher, tatsächlich im Screenshot | Beurteilung |
| --- | --- | --- | --- |
| Navigation | Dauerhafte 224px-Sidebar links | Horizontale Primärnavigation, Seitenleiste via Menü erreichbar | Grundlayout näher an Barcelona |
| Reisekopf | Technischer Titel „Karten-Explorer“ erst ab y≈139 und hohe Warnleiste davor | Kompakter Reise-Kopf y≈75–164 mit tatsächlichem Reisenamen | Wichtiges Hierarchieproblem behoben |
| Kartenanfang | y≈258 px | y≈177 px | 81px näher an Referenz (y≈170) |
| Kartenposition | x≈661, ca. 735px breit | x≈430, ca. 960px breit | Anteil und Platzierung stark verbessert |
| Linke Tagesseite | x≈252–645, 393px | x≈35–417, 382px | Sehr ähnlicher relativer Anteil wie Referenz; aktive Tagespille |
| Bildergalerie | Im ersten Desktop-Screenshot nicht sichtbar | Ab ungefähr y≈755, die ersten Karten sichtbar | Erheblich besser, aber weiterhin später als Referenz (ca. y≈640) |
| Bild-Ladefehler | Zerbrochene externe Bildquelle teilweise sichtbar | Lizenziertes Ortsbild im Hero wird bei Ladefehlern durch ruhiges Rauten-Fallback ersetzt | Keine falsche Bebilderung behauptet |
| Farben und Rundungen | Kleinere technische Boxen in einer Seite mit dauerhaftem Verwaltungsmenü | Größere grüne Hauptpille, cremeweiße Karten, 11–20px-Rundungen, reduzierte Konturen | Klar näher an Reisevorlage |
| Mobile | Datumsauswahl, Karte und Ortssuche separat gestapelt | Weiterhin bedienbar; 390px- und 820px-Checks im erfolgreichen Action-Lauf | Kein horizontaler Überlauf im erfolgreichen Browserdurchlauf |

## 3. Implementierte Dateien und Iterationen

1. `public/views.mjs`: echte Map-spezifische horizontale Navigation, kontextuelles Suchfeld, Umstellen der Source-Notice ans Ende der Karte, Karten-Titel und Stadtfolge als einklappbarer Bereich; Plan-, Unterkunfts-, Budget- und andere Ansichten behalten ihre Navigation.
2. `public/reference-map-scene.mjs`: tatsächlicher Reise- und Stadtname mit quellengebundenem Cover-Motiv statt generischem „Karten-Explorer“.
3. `public/app.mjs`: Header-Suche auf bestehendes `mapSearch` gebunden und Bildfehler-Fallback für die neue Hero-Miniatur; keine Buchungs- oder Routendaten geändert.
4. `public/reference-fidelity.css`: visuell maßgebliches Desktop-/Tablet-/Mobile-Layout; Kartenbreite, zweispaltiger Tages-/Kartenaufbau, Positionen, Typografie, Foto- und Rahmenradien, Scroll-/Overflow-Verhalten, weniger dominante Kartenfußzeile.
5. `test/reference-map-scene.test.mjs` und `test/portable-browser.mjs`: reale Reisekopf-Assertions, Referenz-Geometrieprüfung und zusätzliche Stadt-Screenshotaufnahme.

**Bisherige Korrekturschleifen:** (a) Fix alter Karten-Top-Offsets von 12px; (b) Tablet-Navigation bei 820px verkleinert, ohne Aktionen zu entfernen; (c) fehlerhafte Cover-Bildanzeige repariert; (d) kilometerlange Gesamtroutenleiste als `details` statt Dauerfläche; (e) vertikalen Legendenspacer verdichtet; (f) lokalen historischen Fahrplanhinweis zuletzt als kompaktes `details` neu positioniert.

**Erfolgreicher echter Browser- und CI-Durchlauf:** Action #43616200064, nach (a–e). Alle vorbestehenden Modellprüfungen plus responsive Chrome-Tests bestanden. Der nachfolgende Commit `945dda4` mit (f) liegt im Branch. Seine GitHub Actions-Läufe #43616631788 (Versuche 1–3) meldeten innerhalb von 1–2 Sekunden **Runner-Startfehler ohne Testschritte**. Deshalb wird (f) **nicht** als neu screenshot-geprüft behauptet; es ist eine Codeänderung mit noch offenem End-to-End-Abnahmelauf.

## 4. Offen und nicht vortäuschen

- Der Referenz-Screenshot ist ein fotoreicher Beispielreiseplan mit vier sichtbaren Stopps. Der gespeicherte ausgewählte Tag der echten lokalen Testvariante enthält zum Screenshotzeitpunkt **0 geplante Stopps**. Es werden keine Beispielstopps als echte Planung eingetragen, nur vorhandene unverbindliche Ideen angezeigt.
- Die Referenz zeigt hochwertige Fotos, Ratings, Open-now und 16-Minuten-Fußwege. Ohne individuelle Bildlizenzen, aktuelle Öffnungszeiten und echte Routerabfragen werden diese Werte nicht erfunden. In CI können Commons-Fotos und OSM-Kacheln nicht zuverlässig geladen werden: Die Kartenfarben und Straßenkarte bleiben in Screenshots daher sichtbar abweichend.
- Nicht alle Referenzdesigns sind miteinander konsistent (Barcelona/Interrail vs. Navica). Der Hauptscreen folgt Barcelona; die Zeitleiste folgt zusätzlich Interrail. **Keine visuelle 1:1-Übereinstimmung behauptet.**
- Zuletzt geänderter Fahrplan-Caveat braucht nach erneuter CI-Bereitschaft einen finalen Screenshot. Kein Merge, keine öffentliche Bereitstellung und keine Buchung vorgenommen.
