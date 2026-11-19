# Ziel-Checkliste V2 · Arbeitsabnahme am 19.11.2026

Quelle ist die neue Nutzer-Checkliste vom 18.11.2026. Alle 61 Punkte werden hier mit eigenem Nachweis geführt. Der Master-Prompt V7 bleibt die ausführliche fachliche Spezifikation.

Ausgangsbasis ist PR #5, Branch feature/v7-data-day-accommodation-rail, HEAD 160572eeccb6ce7329af24e463b118425b65193d. Die Umsetzung liegt auf dem lokalen Branch codex/checklist-v2-audit.

## Einzelprüfung

| ID | Anforderung | Stand dieser Runde | Nachweis | Nächster Schritt |
|---|---|---|---|---|
| P0.1 | GitHub-HEAD, aktuelles PR #5, Tests/CI und alle entscheidenden Projektdateien lesen. | teilweise | PR #5 HEAD 160572e und zwei erfolgreiche CI-Jobs gelesen. 453 Ausgangstests lokal bestanden. | Entscheidende Module pro nächstem Arbeitspaket erneut prüfen. |
| P0.2 | Ist-Funktionen inventarisieren; Dubletten und Risiken identifizieren. | bestanden | Aktuelle Module zu Karte, Tagesplan, Filtern, Warenkorb, Quellen und Schweiz inventarisiert. | Große Startantwort und 24.826 DOM-Knoten der Datenseite als Risiken weiter bearbeiten. |
| P0.3 | Original-Referenzbilder wirklich öffnen; Desktop/Tablet/Mobil-„Vorher“-Screenshots. | teilweise | 33 neue Vorher-PNGs auf dem unveränderten PR-HEAD. Originalreferenzen im gesuchten Dateibestand fehlen. | Ursprüngliche Barcelona-/InterrailPlan-Bilder erneut zugänglich machen und wirklich öffnen. |
| P0.4 | Soll-Ist-Tabelle pro Seite, Designprioritäten, testbare Akzeptanzkriterien. | bestanden | Seitenmatrix und konkrete Kriterien in diesem Dokument. 61 Anforderungen einzeln erfasst. | Nach jedem Umsetzungspaket Nachweise aktualisieren. |
| P1.1 | Apple Design Skill `SKILL.md` + relevante Einzelrichtlinien lesen. | teilweise | Apple-SKILL.md in verfügbaren Skills, Workspace, Anhängen, .claude und .copilot nicht gefunden. Offizielle HIG Foundations, Accessibility und Motion gelesen. | Original-Skill lesen, sobald er zugänglich ist. Keine Skill-Abnahme behaupten. |
| P1.2 | Hartes Kachelraster, schwere Rahmen/Schatten und überflüssige Boxen deutlich reduzieren. | zu prüfen | Baseline zeigt weiterhin viele Container und 28 nacheinander geladene CSS-Dateien. | Gezielt pro Seite visuell korrigieren und Vorher/Nachher vergleichen. |
| P1.3 | Ansprechende Startseite, Reise-Hero, intuitive Navigation, hochwertige Typografie. | teilweise | Startseite und Navigation bei drei Breiten aufgenommen. | Reise-Hero und Typografiekontrast visuell abnehmen. |
| P1.4 | Bildstarke Orts-/Unterkunftskarten, schnelle Quick Peeks, klare CTA-Struktur. | teilweise | Vorhandene Fotokarten und fünfteiliger Ortsinspektor im Chrome-Gesamttest. | Konkrete Unterkunftsfotos auf Motiv und Lizenz prüfen. |
| P1.5 | Karte und Tagesplan an Referenzkomposition angleichen; mobil intelligent stapeln. | teilweise | Kartenkomposition in 1440/820/390-PNGs aufgenommen. Kein Seitenüberlauf. | Originalreferenz-Abgleich und visuelle Korrekturrunde stehen aus. |
| P1.6 | Ruhiges, konsistentes Designsystem (Farben, Typografie, Abstände, Icons, Zustände). | teilweise | Designvariablen und viele historische Überschreibungen im aktuellen Branch. | Zustände und Kontrast systematisch messen, Änderungen klein halten. |
| P1.7 | Weniger störende Textblöcke und Fragezeichen; progressive Offenlegung. | teilweise | Aufklappbare Quellenbereiche vorhanden. Warenkorbhinweise gekürzt. | Die übrigen Hauptseiten auf unnötige Textblöcke prüfen. |
| P1.8 | Pro Hauptseite sichtbarer Vorher-/Nachher-Screenshot, Korrekturdurchgang. | teilweise | Je elf Hauptseiten mit Vorher/Nachher für drei Größen vorhanden. | Alle Bilder visuell vergleichen und konkrete Designkorrekturen belegen. |
| P2.1 | Messbare Ladezeiten/Bottlenecks feststellen und optimieren. | teilweise | Startantwort von etwa 6,74 MB auf 0,835 MB komprimiert. Identischer Inhalt im API-Test. | Einzellauf ohne Parallelbelastung und Datenseiten-DOM optimieren. |
| P2.2 | Vollbildkarte ohne überlagernde schwere Steuerelemente. | vorhanden, weiter prüfen | V69-Vollbildkarte und vorhandene Chrome-Fälle. | Auf allen drei Größen erneut visuell prüfen. |
| P2.3 | Klare Modi Mein Tag/Stadt/Gesamtroute/Merkliste, wirklich getrennte Datensichten. | vorhanden, weiter prüfen | Mein Tag, Stadt, Gesamtroute, Merkliste in bestehendem Browserflow. | Datenmengen und Rückwechsel für die Schweizer Variante gezielt prüfen. |
| P2.4 | Animierter Stadtrouten-Indikator mit Ankunftspuls, inhaltlichen Symbolen, Play/Pause/Skip. | vorhanden, weiter prüfen | route-city-story-player-v70.mjs und v71-Ankunftsszenen. | Play/Pause/Skip und Ankunftspuls gegen echte Screenshots prüfen. |
| P2.5 | Bedienbare Sidebar/Drawer/Overlay und Animation aus / Reduced Motion. | teilweise | Drawer und Reduced Motion im vorhandenen Chrome-Test, Audit unter reduce. | Reine Tastaturbedienung und Fokus-Rückgabe gezielt abnehmen. |
| P2.6 | Bild-/Marker-Lazy Loading, Cache und Race-Condition-Prüfung. | teilweise | Bild-Lazy-Loading, begrenzte Marker und Request-Maps vorhanden. | Schnelle Varianten-/Filterwechsel mit gezielten Race-Tests prüfen. |
| P2.7 | Eigene Pins hinzufügen, benennen, verändern und löschen. | vorhanden, weiter prüfen | Manuelle Punkte und CRUD-Fälle sind implementiert. | Vollständigen Pin-CRUD in der Hauptvariante erneut ausführen. |
| P2.8 | Mehrstopproute mit 2–8 Stopps, Umordnen, Fokus, Übernahme in Tagesplan. | vorhanden, weiter prüfen | Mehrstopp-Modul und Route-Studio vorhanden, aktuelle Regression grün. | 2 und 8 Stopps mit Umordnung und Übernahme gezielt abnehmen. |
| P2.9 | Fuß-/Rad-/ÖPNV-Routing nur bei wirklich vorhandenem Routenergebnis. | teilweise | Router und Geometrieprüfungen in bestehender Regression. | Fuß/Rad/ÖPNV und Providerfehler je Modus mit echten Ergebnissen prüfen. |
| P2.10 | Höhenprofil/Auf-/Abstieg für Wanderwege nur aus tatsächlicher Weggeometrie + Höhendaten. | offen | Belegte Betreiberwerte vorhanden. Geometriegebundenes Höhenprofil bisher nicht nachgewiesen. | GPX/Geometrie und Höhendaten mit Herkunft für die konkrete Tour verbinden. |
| P2.11 | Schnell editierbare Tagespunkte, Undo, Konflikt-/Budgetvorschau. | vorhanden, weiter prüfen | quickDayEdit, Undo und Konflikt-/Budgetmodelle vorhanden. | Schnellbearbeitung mit Geld- und Zeitfolgen in Hauptvariante prüfen. |
| P3.1 | Gemeinsame Filter-/Such-/Sortierbedienung für alle wichtigen Kategorien. | teilweise | browse-hub, activity-directory und smart-filters implementiert. | Filterkriterien pro Hauptkategorie auf gleiche Bedienung prüfen. |
| P3.2 | Unterkunftsansicht mit echten Fotos, 3-Personen-Gesamtpreisen und Status. | teilweise | Unterkunftskarten und datierte Dreier-Suchpreise im Branch. | Fotos und Preisbestandteile für konkrete Kandidaten einzeln belegen. |
| P3.3 | Unterkunftsfilter Betten/Küche/Storno/Preis/Lage/Quelle. | teilweise | Betten, Küche, Preis und Stationsfilter gelesen. | Storno- und Quellenfilter samt leeren Ergebnissen abnehmen. |
| P3.4 | 2–4 Unterkünfte sauber nebeneinander vergleichen; fehlende Daten sichtbar. | teilweise | Unterkunftsvergleich mit Lückenanzeigen vorhanden. | Zwei bis vier konkrete Unterkünfte im Browser nebeneinander prüfen. |
| P3.5 | Aktivitäten, Gastronomie und Transport mit sinnvollen Kriterien vergleichen. | teilweise | Aktivitäts-/Gastronomievergleich und Bahnmodul vorhanden. | Vergleichskriterien und Preisbezug je Kategorie abnehmen. |
| P3.6 | Merkliste und Variantenwechsel ohne Datenverwechslung. | teilweise | Merkliste vorhanden, neue Einkaufsvorräte zwischen Varianten getestet. | Alle Merklisten- und Variantenflüsse auf falsche Zuordnung prüfen. |
| P4.1 | Exakt 14 Tage vom 01.–14.09.2027 richtig auswählen und vervollständigen. | teilweise | Audit explizit mit interrail_swiss und 14-Tage-Zeitraum ausgeführt. | Jeden Tag inhaltlich abnehmen und Hauptvariante als Einstieg prüfen. |
| P4.2 | Paris 01.–02.09., Barcelona 03.–05.09., Sète 06.–07.09., Nizza 08.–09.09. | teilweise | Datierte Quell-/Tagesentwürfe vorhanden. | Paris, Barcelona, Sète und Nizza gegen konkrete Datumsgrenzen prüfen. |
| P4.3 | 10.09. Reisetag Nizza → Kandersteg ohne erfundene Tagesfülle. | teilweise | V82 benennt 10.09. als langen Reisetag mit unbestätigtem Tripsy-Zeitfenster. | Tatsächlichen Tagesplan auf überladene Aktivitäten prüfen. |
| P4.4 | **11.09. Oeschinensee**: höhere nördliche Heuberg-Panoramatour als anspruchsvollere Option plus leichte Alternative. | offen | Oeschinensee-Quellen vorhanden. Nördliche Heuberg-Option noch nicht gezielt nachgewiesen. | Anspruchsvolle Heuberg-Tour und leichte Alternative mit Quellen verknüpfen. |
| P4.5 | **12.09. Kandersteg → Appenzell**: Ruhe, Ankommen, Einkauf, Essen. | teilweise | V82 hat Ankunfts-/Ruhetag-Hinweise. | 12.09. auf Ankommen, Einkauf und Essen im tatsächlichen Plan prüfen. |
| P4.6 | **13.09. Seealpsee**: mittlere bis leicht anspruchsvolle Tagestour, Optionen Richtung Äscher/Ebenalp prüfen. | teilweise | Seealpsee- und Äscher-Hinweise vorhanden. | Mittlere Tour und Ebenalp-Option mit Länge, Höhenmetern und Exponiertheit konkret vergleichen. |
| P4.7 | 14.09. Rückreise nach München ohne unbestätigte 2027-Fahrpläne als Fakten. | teilweise | 2027-Quellenstatus und Rückreisedaten im Bahnmodul vorhanden. | 14.09. Rückfahrt nach München im Tagesplan und Budget prüfen. |
| P4.8 | Wanderlänge, echte Höhenmeter, Wegklassifikation, Exponiertheit, Öffnung/Wetter und Alternative. | teilweise | SAC-/Betriebs-/Wetterhinweise vorhanden. | Echte Tourgeometrie, Höhenwerte und Alternative pro Route belegen. |
| P4.9 | Alle Haupttage mit Bildern, Tageskarte, flexiblen Aktivitäten und nachvollziehbaren Quellen. | teilweise | 14 Tagesentwürfe und lizenzierte Ortsbilder vorhanden. | Alle 14 Tage einzeln mit Karte, Bildzuordnung, flexiblen Punkten und Quellen abnehmen. |
| P5.1 | Ketten pro Kernstadt mit offiziellen Standort-/Katalogquellen recherchieren. | teilweise | Vorhandene kuratierte Einkaufsorte und Betreiberlinks gelesen. | Ketten für sechs Kernstädte anhand offizieller Standort-/Katalogquellen abgleichen. |
| P5.2 | Häufigkeit pro Stadt nur bei belastbarer Zählgrundlage zeigen. | teilweise | Begrenzte Geodatenabfrage wird als solche benannt. | Stadtweite Häufigkeitsangaben nur mit vollständiger Zählgrundlage abnehmen. |
| P5.3 | Vergleichbarer Basiskorb mit Preis/Einheit/Währung/Datum/Quelle. | teilweise | Barcelona-Referenzkorb, manuelle Preisstichtage, EUR/CHF ohne automatische Umrechnung. | Vergleichbare Körbe der übrigen Kernstädte mit Datum und Quelle ergänzen. |
| P5.4 | Schnelle günstige Rezepte mit Mengen für 3 Personen und Kochdauer. | teilweise | Ein vorhandenes Pasta-Rezept und Portions-/Packungsrechnung für drei getestet. | Weitere schnelle Rezepte mit Einkauf, Mengen und Kochdauer ergänzen. |
| P5.5 | Frühstück/Mittag/Abend und Küche/Unterkunft zusammenbringen. | offen | Vorhandene Rezeptauswahl ist auf Abendessen begrenzt. | Frühstück und Mittag samt Küchen-/Aufenthaltsbezug integrieren. |
| P5.6 | Funktionsfähiger Warenkorb mit Mengenaggregation, Extras, Entfernen und Abhaken. | bestanden | Aggregation, Vorräte, Zusatzartikel, Entfernen, Wiederherstellen und Abhaken in Modell und Chrome geprüft. | Weitere Städtekörbe auf demselben Modell ergänzen. |
| P5.7 | Preis pro Gericht/Person nur aus transparent belegbaren Annahmen. | teilweise | Portions- und ganze Packungspreise sowie echte Ausgaben getrennt gerechnet. | Rezeptweise Mengenannahmen und Quellenstand prüfen. |
| P5.8 | Einkauf als optionaler Tagesstopp, Preisänderung nur mit Bestätigung. | teilweise | Einkaufsorte als Aktivität planbar. Preisänderungen werden erst beim Speichern übernommen. | Optionalen Einkaufsstopp direkt aus dem Warenkorb durchspielen. |
| P5.9 | Manuelles Eintragen/Löschen von Preisen und gespeicherten Vorräten. | bestanden | Preise und Vorräte eingeben, ändern und leeren. Test gegen Wiederladen und Gruppengrößenwechsel. | Gespeicherte Vorräte auch auf Smartphone visuell prüfen. |
| P6.1 | Gezieltes Anreichern der aktiven Variante statt erst aller Nebenvarianten. | teilweise | Neue Abnahme fokussiert interrail_swiss. Bestehende Varianten bleiben erhalten. | Weitere Recherche auf die offenen Haupttage priorisieren. |
| P6.2 | Echte, lizenzierte, korrekt zugeordnete Bilder priorisieren. | teilweise | Bestehende Commons-Zuordnungen und Lizenzinformationen vorhanden. | Motivgenauigkeit und fehlende Unterkunftsfotos einzeln abnehmen. |
| P6.3 | Kurzvorschau + tiefe Details, Preise, Öffnungszeiten, Dauer, Quelle. | vorhanden, weiter prüfen | Quick Peeks und fünfteiliger Inspektor im aktuellen Browserflow. | Datenvollständigkeit pro Haupttag prüfen. |
| P6.4 | Google-Maps-Links korrekt nach Suchlink vs. genauem Ort markieren. | vorhanden, weiter prüfen | google-maps-Modul und Suchlink-Tests vorhanden. | Adresse, Suchlink und Gebietslage für Hauptvariantenpunkte abnehmen. |
| P6.5 | Booking-/Airbnb-/Betreiberlinks bei nachweisbaren Einträgen. | vorhanden, weiter prüfen | Booking-/Airbnb-/Betreiberreferenzen im aktuellen Katalog. | Ziel-URL und Status konkreter Hauptvarianten-Unterkünfte prüfen. |
| P6.6 | Kartenpunkte nur bei belegter Position, sonst plausible Gebietslage kenntlich. | teilweise | Provenienz-, Standort- und Gebietslagentests vorhanden. | Kartenpositionen der Haupttouren anhand individueller Quellen prüfen. |
| P6.7 | Unklare 2027-Verfügbarkeiten konsequent als vorläufig anzeigen. | teilweise | Vorläufige Preise/Fahrpläne im Katalog und aktuellen Tests gekennzeichnet. | Alle sichtbaren 2027-Signale der Hauptvariante prüfen. |
| P6.8 | Pro fehlendem Datensatz Grund und nächste Quelle dokumentieren. | teilweise | Einzellückenberichte und Datenprüfung im Branch vorhanden. | Aktuelle offene Daten je Haupttag mit Grund und nächster Quelle zusammenführen. |
| P7.1 | Test-/Build-Fehler zuerst beheben, nie auf defekter Grundlage fortsetzen. | bestanden | 453 Ausgangstests, 456 Tests nach Änderung. Windows-Profilbereinigung korrigiert. | Bei weiteren Änderungen betroffene Prüfungen erneut ausführen. |
| P7.2 | Regressions- und Browserfälle auf Desktop, Tablet, Smartphone. | teilweise | Chrome-Gesamttest und 33-Seiten-Audit in drei Größen ausgeführt. | Vollständige Originalsuite mit privaten Tripsy-Kopien bleibt separat. |
| P7.3 | Visueller Abgleich anhand echter Vorher-/Nachher-Bilder. | teilweise | 66 neue Vorher/Nachher-PNGs dokumentiert. | Alle Seiten visuell vergleichen und Korrekturen belegen. |
| P7.4 | Performance-Kennzahlen, Kontrast, Keyboard, Fokus, Reduced Motion prüfen. | teilweise | Timing, Bytezahl, Überlauf und Buttonnamen gemessen. Reduced Motion aktiv. | Kontrast, Tastatur und Fokus mit eigenständigen Nachweisen prüfen. |
| P7.5 | Jede Änderung in nachvollziehbaren Commits, keine ungeprüften globalen Refactors. | in Arbeit | Eigener Arbeitsbranch ab PR-HEAD. Kleine fachliche Änderungen. | Geprüfte Änderungen in nachvollziehbaren lokalen Commits sichern. |
| P7.6 | Kein Merge/Deployment/Booking; abschließende offene Punkte mit Gründen und Nachweisen. | teilweise | Offene Punkte in dieser Liste einzeln mit Grund und nächstem Schritt. | Abschlussprüfung aller 61 Anforderungen steht aus. |

## Seitenmatrix und Akzeptanzkriterien

Die PNGs liegen unter outputs/Abnahme-V2/vorher und outputs/Abnahme-V2/nachher im ursprünglichen Aufgabenordner. Die elf Seiten wurden bei 1440, 820 und 390 Pixeln mit der Schweizer Hauptvariante aufgenommen. Die Messung verwendet isolierte Seed-Daten, reduzierte Bewegung und blockierte externe Medien. Aus dem Ergebnis folgt keine Bestätigung externer Bilder, Kartenkacheln oder echter Geräte.

| Seite | Ist-Beobachtung | Nächste Designpriorität | Prüfkriterium |
|---|---|---|---|
| overview | Vier Einstiege, Reise-Cockpit und Tagesübersicht | Hero und vereinfachte Hierarchie | Hauptaktion vor technischen Detailbereichen, 14 Haupttage erreichbar |
| plan | Zeitleiste und Datumswechsel vorhanden | Weniger gleichgewichtige Sektionen | Tagespunkte schnell editierbar, Änderungen nach Reload erhalten |
| map | Getrennte Sichten, Vollbild, Routenanimation | Karte, Drawer und Bedienflächen abgleichen | Alle Modi mit unterschiedlichen Daten und eindeutiger Auswahl |
| lodging | Bildkarten, Dreier-Suchpreise, Vergleich | Foto- und Preiszustände präzisieren | Zwei bis vier Häuser mit Belegung, Küche, Storno und Quellen vergleichbar |
| activities | Kategorien und Recherchefilter | Kernkriterien zuerst | Suche, Filter, Merken und Tagesübernahme bedienbar |
| discover | Weitere Optionen und Galerie | Quick Peek und Hauptaktion | Optionen bleiben durch Quelle und Status zuordnungsfähig |
| rail | Pass-/Fahrplan-/Korridorprüfungen | Zeitfolge und Handlungsbedarf priorisieren | 7-Tage-Pass und separate Lokalbahn ohne erfundene Abfahrt |
| food | Einkaufsorte, Rezepte, Warenkorb | Warenkorb und Preisdetails reduzieren | Vorräte, Extras, Entfernen, Abhaken, Preisstichtag und Gruppensumme korrekt |
| budget | Kategorien, Salden, Ausgaben | Unbekannte Beträge deutlicher integrieren | Restcent genau, kein doppelter Einkauf und keine CHF/EUR-Vermischung |
| group | Profile und Gruppenanteile | Relevante Präferenzen zuerst | Drei Reisende korrekt und Varianten unabhängig |
| data | Umfangreiche Einzelprüfungen, bis zu 24826 DOM-Knoten | Erzeugung großer Detailbereiche auf Abruf | Lücken mit Quelle und nächster Handlung ohne lange Hauptseitenblockade |

## Tatsächliche Lücken und Quellen

- Die ursprünglichen Referenzbilder und die benannte Apple-SKILL.md wurden in den zugänglichen Beständen nicht gefunden. Die neuen Vorher-Aufnahmen zeigen den tatsächlichen PR-HEAD.
- Gelesene Apple-Primärquellen sind Foundations, Accessibility und Motion. Ihre Kriterien werden auf die Weboberfläche übertragen.
- Der aktuelle portable Testlauf nutzt den dokumentierten Seed-Fallback. Private Tripsy-Rohdateien gehören weiter zur separaten Originalregression.
- 2027-Fahrpläne, Zimmerbelegung, Schlussrechnung und Wetter-/Wegzustand brauchen datierte Anbieterbelege.

[Apple Foundations](https://developer.apple.com/design/human-interface-guidelines/foundations) · [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · [Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

## Originale Nutzer-Checkliste

<details>
<summary>Vollständigen übergebenen Wortlaut anzeigen</summary>

# PRIORISIERTE ZIELLISTE & ABNAHME-CHECKLISTE V2
**18.11.2026 · Gilt für `feature/v7-data-day-accommodation-rail` · An Codex übergeben**

Legende: `[ ]` = noch nicht durch diese neue Arbeitsrunde nachgewiesen; bestehende Implementation ist NICHT automatisch fehlend. Für jeden Punkt vor dem Coding den Ist-Status feststellen und Ergebnis/Screenshot/Test dokumentieren.

## P0 – Ausgangslage und Referenzen
- [ ] GitHub-HEAD, aktuelles PR #5, Tests/CI und alle entscheidenden Projektdateien lesen.
- [ ] Ist-Funktionen inventarisieren; Dubletten und Risiken identifizieren.
- [ ] Original-Referenzbilder wirklich öffnen; Desktop/Tablet/Mobil-„Vorher“-Screenshots.
- [ ] Soll-Ist-Tabelle pro Seite, Designprioritäten, testbare Akzeptanzkriterien.

## P1 – Visuelles Redesign / Apple-Design-Audit
- [ ] Apple Design Skill `SKILL.md` + relevante Einzelrichtlinien lesen.
- [ ] Hartes Kachelraster, schwere Rahmen/Schatten und überflüssige Boxen deutlich reduzieren.
- [ ] Ansprechende Startseite, Reise-Hero, intuitive Navigation, hochwertige Typografie.
- [ ] Bildstarke Orts-/Unterkunftskarten, schnelle Quick Peeks, klare CTA-Struktur.
- [ ] Karte und Tagesplan an Referenzkomposition angleichen; mobil intelligent stapeln.
- [ ] Ruhiges, konsistentes Designsystem (Farben, Typografie, Abstände, Icons, Zustände).
- [ ] Weniger störende Textblöcke und Fragezeichen; progressive Offenlegung.
- [ ] Pro Hauptseite sichtbarer Vorher-/Nachher-Screenshot, Korrekturdurchgang.

## P2 – Funktion, Animation, Performance, Karte
- [ ] Messbare Ladezeiten/Bottlenecks feststellen und optimieren.
- [ ] Vollbildkarte ohne überlagernde schwere Steuerelemente.
- [ ] Klare Modi Mein Tag/Stadt/Gesamtroute/Merkliste, wirklich getrennte Datensichten.
- [ ] Animierter Stadtrouten-Indikator mit Ankunftspuls, inhaltlichen Symbolen, Play/Pause/Skip.
- [ ] Bedienbare Sidebar/Drawer/Overlay und Animation aus / Reduced Motion.
- [ ] Bild-/Marker-Lazy Loading, Cache und Race-Condition-Prüfung.
- [ ] Eigene Pins hinzufügen, benennen, verändern und löschen.
- [ ] Mehrstopproute mit 2–8 Stopps, Umordnen, Fokus, Übernahme in Tagesplan.
- [ ] Fuß-/Rad-/ÖPNV-Routing nur bei wirklich vorhandenem Routenergebnis.
- [ ] Höhenprofil/Auf-/Abstieg für Wanderwege nur aus tatsächlicher Weggeometrie + Höhendaten.
- [ ] Schnell editierbare Tagespunkte, Undo, Konflikt-/Budgetvorschau.

## P3 – Suche, Filter und Vergleiche
- [ ] Gemeinsame Filter-/Such-/Sortierbedienung für alle wichtigen Kategorien.
- [ ] Unterkunftsansicht mit echten Fotos, 3-Personen-Gesamtpreisen und Status.
- [ ] Unterkunftsfilter Betten/Küche/Storno/Preis/Lage/Quelle.
- [ ] 2–4 Unterkünfte sauber nebeneinander vergleichen; fehlende Daten sichtbar.
- [ ] Aktivitäten, Gastronomie und Transport mit sinnvollen Kriterien vergleichen.
- [ ] Merkliste und Variantenwechsel ohne Datenverwechslung.

## P4 – Hauptvariante Interrail Test 2 – Schweiz
- [ ] Exakt 14 Tage vom 01.–14.09.2027 richtig auswählen und vervollständigen.
- [ ] Paris 01.–02.09., Barcelona 03.–05.09., Sète 06.–07.09., Nizza 08.–09.09.
- [ ] 10.09. Reisetag Nizza → Kandersteg ohne erfundene Tagesfülle.
- [ ] **11.09. Oeschinensee**: höhere nördliche Heuberg-Panoramatour als anspruchsvollere Option plus leichte Alternative.
- [ ] **12.09. Kandersteg → Appenzell**: Ruhe, Ankommen, Einkauf, Essen.
- [ ] **13.09. Seealpsee**: mittlere bis leicht anspruchsvolle Tagestour, Optionen Richtung Äscher/Ebenalp prüfen.
- [ ] 14.09. Rückreise nach München ohne unbestätigte 2027-Fahrpläne als Fakten.
- [ ] Wanderlänge, echte Höhenmeter, Wegklassifikation, Exponiertheit, Öffnung/Wetter und Alternative.
- [ ] Alle Haupttage mit Bildern, Tageskarte, flexiblen Aktivitäten und nachvollziehbaren Quellen.

## P5 – Lebensmittel, Supermärkte, Essensplaner
- [ ] Ketten pro Kernstadt mit offiziellen Standort-/Katalogquellen recherchieren.
- [ ] Häufigkeit pro Stadt nur bei belastbarer Zählgrundlage zeigen.
- [ ] Vergleichbarer Basiskorb mit Preis/Einheit/Währung/Datum/Quelle.
- [ ] Schnelle günstige Rezepte mit Mengen für 3 Personen und Kochdauer.
- [ ] Frühstück/Mittag/Abend und Küche/Unterkunft zusammenbringen.
- [ ] Funktionsfähiger Warenkorb mit Mengenaggregation, Extras, Entfernen und Abhaken.
- [ ] Preis pro Gericht/Person nur aus transparent belegbaren Annahmen.
- [ ] Einkauf als optionaler Tagesstopp, Preisänderung nur mit Bestätigung.
- [ ] Manuelles Eintragen/Löschen von Preisen und gespeicherten Vorräten.

## P6 – Qualitätsdaten und Quellen
- [ ] Gezieltes Anreichern der aktiven Variante statt erst aller Nebenvarianten.
- [ ] Echte, lizenzierte, korrekt zugeordnete Bilder priorisieren.
- [ ] Kurzvorschau + tiefe Details, Preise, Öffnungszeiten, Dauer, Quelle.
- [ ] Google-Maps-Links korrekt nach Suchlink vs. genauem Ort markieren.
- [ ] Booking-/Airbnb-/Betreiberlinks bei nachweisbaren Einträgen.
- [ ] Kartenpunkte nur bei belegter Position, sonst plausible Gebietslage kenntlich.
- [ ] Unklare 2027-Verfügbarkeiten konsequent als vorläufig anzeigen.
- [ ] Pro fehlendem Datensatz Grund und nächste Quelle dokumentieren.

## P7 – Qualität, Test, Nachweis
- [ ] Test-/Build-Fehler zuerst beheben, nie auf defekter Grundlage fortsetzen.
- [ ] Regressions- und Browserfälle auf Desktop, Tablet, Smartphone.
- [ ] Visueller Abgleich anhand echter Vorher-/Nachher-Bilder.
- [ ] Performance-Kennzahlen, Kontrast, Keyboard, Fokus, Reduced Motion prüfen.
- [ ] Jede Änderung in nachvollziehbaren Commits, keine ungeprüften globalen Refactors.
- [ ] Kein Merge/Deployment/Booking; abschließende offene Punkte mit Gründen und Nachweisen.

## Nachtrag für Codex nach jedem späteren Wunsch
Ergänzung datieren, gegen bestehende Zielgruppe prüfen, Priorität vergeben, Abnahmekriterium ergänzen, Konflikte mit bisherigen Entscheidungen explizit beschreiben. Nichts stillschweigend entfernen.
</details>
