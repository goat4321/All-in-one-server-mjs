# Phase 33 – Dritter Referenzabgleich (14.11.2026)

## Tatsächlich geprüfte Vorlagen

- **Barcelona-Reise im grünen Reiseplaner.png**, 1672 × 941 Pixel. Echte Originaldatei vom Nutzer aus früherer Unterhaltung, erneut in der aktuellen Sitzung geöffnet. Verbindliche Hauptvorlage der Reisekarte.
- **image-gen-1(4).png**, 1672 × 941 Pixel, InterrailPlan-Tagesplan: präzise Tageschronologie, Verkehrsmittel, Konflikthinweise und Routenkarte.
- **image(20261113-212628).png**, 1024 × 768, Designyow: ruhige Typografie, hierarchische Übersicht, sparsame Kartenränder.
- **image(20261113-212740).png**, 1024 × 768, Navica: weiche Premiumkacheln, kompaktes Informationslayout.
- **22-reference-city-map-1440.png**, 1440 × 900, **tatsächlicher letzter verfügbarer Chrome-Screenshot** des Reiseplaners aus Phase 29. Dieses Bild ist älter als Phase 30–32; seine Abweichungen werden deshalb nur als Baseline verwendet. Kein neues V33-Browserbild wird als vorhanden behauptet.

## Konkrete Abweichungen und Codekorrekturen

| Bereich | Beobachtung am Vorher-Screenshot | Tatsächliche Änderung in V33 |
| --- | --- | --- |
| Galerie | Vollbreit unter linker Liste und Karte; erst deutlich unter dem Kartenende sichtbar | `mapPhotoDiscovery` befindet sich jetzt direkt als vierter Grid-Child im rechten Kartenbereich, Desktop CSS: zweite Spalte / dritte Zeile; gemeinsame weiße Kartengruppe |
| Tagesübersicht | Leerer Planungstag zeigt nur „keine Stopps“ und separate Recherchevorschläge | Tatsächliche V32-Tagesslots erscheinen in der linken Spalte als visuelle chronologische Vorschau mit Morgen/Mittag/Nachmittag/Abend, Foto oder belegtem Platzhalter, Zahlen und großen Übernahmeaktionen |
| Kartenkarte | Überschrift „Karte“ ohne Bezug zum Reisetag | „Tag 4 · Barcelona“ usw. und Anzahl realer Aktivitätsideen (keine behauptete Buchung oder Wegzeit) |
| Kartenpunkte | Bei ungeplanter Aktivität viele Quellenmarker, aber kein erkennbarer Tagesentwurf | Zusätzliche nummerierte V32-Preview-Pins **nur wenn eine exakte Quellposition vorliegt und der Referenzpunkt kein Centroid ist**; bei mindestens zwei Punkten dünne grüne gestrichelte Luftlinie, klar als schematisch markiert; keine Gehzeit aus dieser Strecke |
| Kartenlegende | Technische Legende konkurriert in der einfachen Ansicht mit Map und Fotos | Einfache Ansicht ohne große Legende; relevante Vorsichtsinformation als kleiner Kartenhinweis |
| Suchfelder | Die Vorlage hat eine große Kopfzeilensuche; vorherige einfache Ansicht versteckte sie und zeigte unten eine doppelte Suche | Desktop ab 1180 px: eine zentrale Kopfzeilensuche; linke redundante Suche versteckt. Mobil bleibt die direkte Ortssuche erreichbar |
| Bilder | Referenz: mehrere große Ortsbilder auf einer horizontalen Reihe | Einfacher Modus priorisiert bis zu vier lizenzierte Motive der aktuellen Stadt, anschließend bei Bedarf der Reiseroute; keine fremden Bewertungen oder fiktiven Öffnungszeiten |
| Reisekopf | Referenzhintergrundfoto, große Bildminiatur und lesbares Datum | Hero-Miniatur 116 × 77 px auf Desktop, größere zulässige Hintergrundfoto-Fläche, deutsches Datum 01.09.–14.09.2027 statt ISO, Herkunft im `title` erhalten |
| Feinlayout | Zu enge Tagesauswahl, zu kleine Kacheln, technischer Rahmen | Größere Tagespillen, runde Fotokarten, gruppierte Zeitabschnitte, reduzierte Borderelemente, dynamisch eingezogene Tageskarten |
| Accessibility | Animationen teils immer sichtbar | Alle neuen Effekte respektieren `prefers-reduced-motion` und `data-motion=off` |

**Geometrie als Zielwert auf Desktop:** Header 60 px, Reisekopf rund 99 px, Inhalt ab ungefähr 170 px; Tagesleiste 101 px, Karte rund 455 px im einfachen Modus, Fotogalerie anschließend im selben rechten Spaltenbereich. Dies sind **CSS-Designvorgaben**, keine nachher gemessenen Screenshotwerte.

## Wichtige Datenintegrität

- Die 46 vorhandenen V32-Tage und 97 Aktivitätszuordnungen bleiben unangetastet.
- Die V33-Vorschau zeigt *unverbindliche Ideen*, keine bereits hinzugefügten Reiseaktivitäten; Übernahme nur nach Nutzeraktion.
- Kein Preis, keine Bewertung, keine Öffnungszeit und keine exakte Routenführung wird aus der Referenzgrafik übernommen. Die dort abgebildeten 16/12/14-Minuten-Wegzeiten gehören zu einer anderen Beispielreise.
- Wo lizenzierte Bilder nicht laden, bleiben einheitliche Kategorie-Platzhalter.
- Wenn einem vorgeschlagenen Ort eine unabhängige, genaue Quellposition fehlt, werden keine nummerierten Fotomarker dort erfunden; die Route kann deshalb je nach Stadt weniger visuelle Stopps als die Vorlage haben.

## Tests / verbleibende Lücke

- Reine JS-Syntaxprüfung für Map, Render, App, Testmodule: erfolgreich.
- Isolierter Funktionscheck von `mapDayAgenda`: drei tatsächlich vorgeschlagene Barcelona-Slots werden in Morgen/Nachmittag/Abend eingeteilt, keine alte Leerstandsmeldung, keine Buchung behauptet.
- Isolierter Check sourceBackedDayPreview: verwirft fehlende Ortsprüfung, optionale Punkte und Centroid, übernimmt nur echte POIs.
- **Kein vollständiger aktueller Browser-Screenshotvergleich nach V33 vorhanden.** Die zuletzt beobachteten GitHub-Actions-Läufe endeten mit Runner-Startfehlern (0 Schritte), daher bleibt der reale visuelle Abgleich auf Desktop, Tablet und Smartphone ungeprüft. Ohne die Anwendung neu zu starten, darf keine pixelgenaue Übereinstimmung zugesichert werden.

