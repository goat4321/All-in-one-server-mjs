# Ziel-Checkliste V2 · Arbeitsabnahme am 19.11.2026

Quelle ist die neue Nutzer-Checkliste vom 18.11.2026. Alle 61 Punkte werden hier mit eigenem Nachweis geführt. Der Master-Prompt V7 bleibt die ausführliche fachliche Spezifikation.

Ausgangsbasis ist PR #5, Branch feature/v7-data-day-accommodation-rail, HEAD 160572eeccb6ce7329af24e463b118425b65193d. Die Umsetzung liegt auf dem lokalen Branch codex/checklist-v2-audit.

## Einzelprüfung

| ID | Anforderung | Stand dieser Runde | Nachweis | Nächster Schritt |
|---|---|---|---|---|
| P0.1 | GitHub-HEAD, aktuelles PR #5, Tests/CI und alle entscheidenden Projektdateien lesen. | teilweise | PR #5 HEAD 160572e und zwei erfolgreiche CI-Jobs gelesen. 453 Ausgangstests lokal bestanden. | Entscheidende Module pro nächstem Arbeitspaket erneut prüfen. |
| P0.2 | Ist-Funktionen inventarisieren; Dubletten und Risiken identifizieren. | bestanden | Aktuelle Module inventarisiert. Startantwort komprimiert; Datenseite beim Öffnen von 27.491 auf 387 DOM-Knoten reduziert. | Übrige Seiten und die zahlreichen historischen CSS-Schichten weiter gezielt prüfen. |
| P0.3 | Original-Referenzbilder wirklich öffnen; Desktop/Tablet/Mobil-„Vorher“-Screenshots. | teilweise | 33 neue Vorher-PNGs auf dem unveränderten PR-HEAD. Originalreferenzen im gesuchten Dateibestand fehlen. | Ursprüngliche Barcelona-/InterrailPlan-Bilder erneut zugänglich machen und wirklich öffnen. |
| P0.4 | Soll-Ist-Tabelle pro Seite, Designprioritäten, testbare Akzeptanzkriterien. | bestanden | Seitenmatrix und konkrete Kriterien in diesem Dokument. 61 Anforderungen einzeln erfasst. | Nach jedem Umsetzungspaket Nachweise aktualisieren. |
| P1.1 | Apple Design Skill `SKILL.md` + relevante Einzelrichtlinien lesen. | teilweise | Apple-SKILL.md in verfügbaren Skills, Workspace, Anhängen, .claude und .copilot nicht gefunden. Offizielle HIG Foundations, Accessibility und Motion gelesen. | Original-Skill lesen, sobald er zugänglich ist. Keine Skill-Abnahme behaupten. |
| P1.2 | Hartes Kachelraster, schwere Rahmen/Schatten und überflüssige Boxen deutlich reduzieren. | teilweise | Datenseite flach mit neun Aufklappzeilen. Unterkunftsvergleich ohne verschachtelte Schattenkarten, ausgerichtete Fakten; lange Schweizer Recherche nach der Hauptbedienung aufklappbar. Frische Vorher/Nachher-Bilder und visueller Korrekturdurchgang. | Übrige Hauptseiten und historische CSS-Schichten weiter gezielt vereinfachen. |
| P1.3 | Ansprechende Startseite, Reise-Hero, intuitive Navigation, hochwertige Typografie. | teilweise | Startseite und Navigation bei drei Breiten aufgenommen. | Reise-Hero und Typografiekontrast visuell abnehmen. |
| P1.4 | Bildstarke Orts-/Unterkunftskarten, schnelle Quick Peeks, klare CTA-Struktur. | teilweise | Vorhandene Fotokarten und fünfteiliger Ortsinspektor im Chrome-Gesamttest. | Konkrete Unterkunftsfotos auf Motiv und Lizenz prüfen. |
| P1.5 | Karte und Tagesplan an Referenzkomposition angleichen; mobil intelligent stapeln. | teilweise | Kartenkomposition in 1440/820/390-PNGs aufgenommen. Kein Seitenüberlauf. | Originalreferenz-Abgleich und visuelle Korrekturrunde stehen aus. |
| P1.6 | Ruhiges, konsistentes Designsystem (Farben, Typografie, Abstände, Icons, Zustände). | teilweise | Datenseite: 47 Textstellen je Ansicht. Unterkunftsvergleich/Filterhinweis: 142 Textstellen je Ansicht, drei helle Breiten und dunkler Desktop. Hinweis- und Dunkelmodus-Farben korrigiert; Mindestwerte und Grenzen im jeweiligen Abnahmebericht. | Andere Seiten, weitere Formulare/Tabellen und Fokuszustände systematisch prüfen. |
| P1.7 | Weniger störende Textblöcke und Fragezeichen; progressive Offenlegung. | teilweise | Datenseite mit neun Prüfgruppen und individuellen Feldgründen auf Abruf. Unterkunftssuche beginnt vor der vollständig erhaltenen aufklappbaren Schweizer Sonderrecherche. Warenkorbhinweise gekürzt. | Übrige Hauptseiten auf unnötige Textblöcke prüfen. |
| P1.8 | Pro Hauptseite sichtbarer Vorher-/Nachher-Screenshot, Korrekturdurchgang. | teilweise | Je elf Hauptseiten mit Vorher/Nachher für drei Größen vorhanden. Frischer 33-Seiten-Vergleich und tatsächlicher visueller Korrekturdurchgang der Datenseite hell/mobil/dunkel. | Übrige Seiten ebenfalls vollständig visuell vergleichen; Originalreferenzen fehlen weiter. |
| P2.1 | Messbare Ladezeiten/Bottlenecks feststellen und optimieren. | teilweise | Startantwort komprimiert; initialer Datenseiten-DOM 27.491 auf 387 (-98,6 Prozent). Getrennte serielle Vorher-/Nachher-Audits, Rohzeiten und Grenzen in DATA_PAGE_ACCEPTANCE.md. | Übrige Engpässe separat messen; keine allgemeine Geschwindigkeitsgarantie ableiten. |
| P2.2 | Vollbildkarte ohne überlagernde schwere Steuerelemente. | teilweise | Sichtbarer Einstieg und tatsächliche Vollbildfläche bei 1440/820/390 geprüft. Alle primären Aktionen im Fenster; umbrochene mobile Leiste, Schließen erste Zeile, Kategorien darunter. Pinmodal tatsächlich geöffnet. | Alle offenen Drawer-/Animationszustände und dunkle Kontraste weiter abnehmen; Livekacheln sind im reproduzierbaren Lauf blockiert. |
| P2.3 | Klare Modi Mein Tag/Stadt/Gesamtroute/Merkliste, wirklich getrennte Datensichten. | vorhanden, weiter prüfen | Mein Tag, Stadt, Gesamtroute, Merkliste in bestehendem Browserflow. | Datenmengen und Rückwechsel für die Schweizer Variante gezielt prüfen. |
| P2.4 | Animierter Stadtrouten-Indikator mit Ankunftspuls, inhaltlichen Symbolen, Play/Pause/Skip. | vorhanden, weiter prüfen | route-city-story-player-v70.mjs und v71-Ankunftsszenen. | Play/Pause/Skip und Ankunftspuls gegen echte Screenshots prüfen. |
| P2.5 | Bedienbare Sidebar/Drawer/Overlay und Animation aus / Reduced Motion. | teilweise | Drawer/Reduced Motion im Chrome-Test. Neue Datengruppen mit nativen Enter-/Space-Ereignissen und erhaltenem Fokus geöffnet/geschlossen. | Sidebar, Karten-Drawer und übrige Overlays vollständig per Tastatur abnehmen. |
| P2.6 | Bild-/Marker-Lazy Loading, Cache und Race-Condition-Prüfung. | teilweise | Fünf Routenentwurfs-Races und Segmentcache geprüft. Zwei weitere tatsächliche Bahnhof-Cache-Anfragengruppen schützen bestätigten Unterkunftsfilter-Fokus und unbestätigten Zahlenentwurf; native Aufklapp-Race korrigiert. | Bild-/Markerdaten und andere Anfragearten bei schnellen Filter-/Variantenwechseln separat prüfen. |
| P2.7 | Eigene Pins hinzufügen, benennen, verändern und löschen. | bestanden für lokale Pinverwaltung | Echter Kartenklick, Koordinateneingabe, Entwurf/Escape, Umbenennen, Verschieben, Entfernen, Undo und Neuladen in der Hauptvariante geprüft. Ungeplant/manuell/ungeprüft; bestehende Startzeit im Modell bewahrt, alte Punktbelege beim Verschieben gelöscht. | Echte Quellen und genaue Eingänge bleiben eigene Prüfaufgaben; Entfernen ist rücknehmbare lokale Ausblendung. |
| P2.8 | Mehrstopproute mit 2–8 Stopps, Umordnen, Fokus, Übernahme in Tagesplan. | bestanden für lokale Fußwegplanung | Zwei und acht Stopps mit sieben gespeicherten echten FOSSGIS-Wegen, Neunter-/Dublettenschutz, Umordnung, nativer Enter-Fokus, drei Breiten, Übernahme/Undo/erneute Wahl/echte Timeline nach Neuladen geprüft. Gelöschte Pins können nicht wiederbelebt werden. | Verfügbarkeit, Wegzustand, Eintritt und Öffnung für September 2027 separat bestätigen. |
| P2.9 | Fuß-/Rad-/ÖPNV-Routing nur bei wirklich vorhandenem Routenergebnis. | teilweise | Datierte FOSSGIS-Fußgeometrie mit Quellenhash und tatsächlichen Endpunkten geprüft. HTTP: fehlender Weg ohne Dauer, Nicht-Fußmodus abgelehnt/ungecacht, September 2027 außerhalb ÖPNV-Paket liefert keine Verbindung. | Radmodul ist noch nicht integriert; weitere Anbieter-/Fehlerfälle und tatsächliche gültige 2027-ÖPNV-Daten bleiben offen. |
| P2.10 | Höhenprofil/Auf-/Abstieg für Wanderwege nur aus tatsächlicher Weggeometrie + Höhendaten. | teilweise | Drei Original-GPX-Tracks mit 187/542/212 Punkten. Zwei verwendbare Höhenprofile. Die Ebenalp-Nullmeter-Platzhalter erzeugen ausdrücklich kein Profil. Segmentlücken werden nicht verbunden. Betreiberwerte bleiben separat. | Leichter Seezugang ohne GPX und Ebenalp ohne verwendbare Höhen bleiben ohne erfundenes Profil. Höhenmodell-Genauigkeit und konkrete SAC-Stufen weiter offen. |
| P2.11 | Schnell editierbare Tagespunkte, Undo, Konflikt-/Budgetvorschau. | teilweise | Routenübernahme mit Undo, unbekannten Pinpreisen und realen Zeitfenstern geprüft. Bekannte Zugankünfte, vorherige Übernacht-Termine und Gehintervalle werden vor Übernahme geschützt. Uhrzeitänderung erhält Geometrie. | Schnellbearbeitung einzelner Hauptvariantenpunkte mit vollständiger Geld-/Zeitvorschau prüfen; unbekannte Endzeiten bleiben unsicher. |
| P3.1 | Gemeinsame Filter-/Such-/Sortierbedienung für alle wichtigen Kategorien. | teilweise | browse-hub/activity-directory vorhanden; Unterkunftssuche mit kombinierbaren UND-Kriterien, leerem Ergebnis/Reset und EUR-Sortierung im tatsächlichen Chrome geprüft. Vergleich bleibt bei Suche/Sortierung erhalten. | Aktivitäten, Gastronomie und Transport auf entsprechende Kriterien und konsistente Bedienung prüfen. |
| P3.2 | Unterkunftsansicht mit echten Fotos, 3-Personen-Gesamtpreisen und Status. | teilweise | Vier vorhandene Barcelona-Angebote mit Gruppensumme, Personenanteil, Zeitraum/Status und historischem Suchdatum im Chrome geprüft. Fehlende Objektfotos stehen im Direktvergleich ausdrücklich als fehlend; kein fremdes Stadtmotiv als Ersatz. | Lizenzierte konkrete Unterkunftsfotos, Pflichtgebühren und aktuelle Angebotsbedingungen bleiben zu belegen. |
| P3.3 | Unterkunftsfilter Betten/Küche/Storno/Preis/Lage/Quelle. | bestanden für vorhandene lokale Daten | Kombinierbare UND-Kriterien, Gruppenbezug, EUR-Preisgrenze, tatsächliche Wegzeiten und URL-Hostnamen geprüft. Chrome: Booking + 32 Euro/Nacht, zusätzliche Küche ohne Treffer, Storno ohne Nachweis leer, Reset und Tastatur. Fallback ohne private Rohdateien besteht ebenfalls. | Tatsächliche Belegung, Tarifstorno und neue 2027-Angebote sind weiterhin Datenprüfungen, keine vom Filter erzeugten Bestätigungen. |
| P3.4 | 2–4 Unterkünfte sauber nebeneinander vergleichen; fehlende Daten sichtbar. | bestanden für lokalen Vergleich | Vier konkrete Barcelona-Kandidaten, zwei/drei/vier Auswahl, fünfte abgewiesen, Entfernen/Leeren, Daten/Status/Gruppenpreis und Quellenlinks im echten Chrome geprüft. Desktop-Fakten ausgerichtet, zwei Tablet-/eine Mobilspalte, Lücken sichtbar; alle vier Reisestände bytegleich. | Fotos/Endpreise/2027-Verfügbarkeit separat belegen; STAY_COMPARISON_ACCEPTANCE.md führt die genauen Daten und Grenzen. |
| P3.5 | Aktivitäten, Gastronomie und Transport mit sinnvollen Kriterien vergleichen. | teilweise | Aktivitäts-/Gastronomievergleich und Bahnmodul vorhanden. | Vergleichskriterien und Preisbezug je Kategorie abnehmen. |
| P3.6 | Merkliste und Variantenwechsel ohne Datenverwechslung. | teilweise | Vorräte/Pins variantengetrennt; Routenantworten nach Variantenwechsel verworfen. Unterkunftsfilter beim Wechsel zurückgesetzt, Vergleich/Filter ändern keine der vier gespeicherten Varianten; alle Zustände bytegleich im Original- und Fallback-Chrome. | Übrige Merklisten-/Filterflüsse auf falsche Zuordnung prüfen. |
| P4.1 | Exakt 14 Tage vom 01.–14.09.2027 richtig auswählen und vervollständigen. | teilweise | Exakte 14-Tage-Abfolge im neuen Fachtest. Tagweises Inventar in SWISS_14_DAY_AUDIT.md. Browser startet ausdrücklich interrail_swiss. | Übrige Tagesdetails und Quellenlücken weiter inhaltlich abnehmen. |
| P4.2 | Paris 01.–02.09., Barcelona 03.–05.09., Sète 06.–07.09., Nizza 08.–09.09. | bestanden | Test vergleicht Datum und Stadt für alle 14 Tage einzeln mit der angeforderten Folge. | Bei Datumsänderungen erneut prüfen. |
| P4.3 | 10.09. Reisetag Nizza → Kandersteg ohne erfundene Tagesfülle. | bestanden | Keine zusätzlichen Vorschlagsaktivitäten, ein unbestätigter Fernreiseabschnitt. Aktiver Originalpunkt nur Ankunft/Einkauf; Zeitfenster ausdrücklich vorläufig. | Durchgehende 2027-Verbindung bleibt beim Betreiber zu prüfen. |
| P4.4 | **11.09. Oeschinensee**: höhere nördliche Heuberg-Panoramatour als anspruchsvollere Option plus leichte Alternative. | bestanden als Planungsoption | Offizielle Heuberg-Tour, Original-GPX, eigenes Profil, echte Kartenlinie und leichte Alternative im Tagesplan. Browserprüfung auf drei Größen. Auswahl, Undo und Neuladen geprüft. | Konkreten Wegstatus und Gondel-Zeitslot vor Reise neu prüfen. |
| P4.5 | **12.09. Kandersteg → Appenzell**: Ruhe, Ankommen, Einkauf, Essen. | teilweise | V82 hat Ankunfts-/Ruhetag-Hinweise. | 12.09. auf Ankommen, Einkauf und Essen im tatsächlichen Plan prüfen. |
| P4.6 | **13.09. Seealpsee**: mittlere bis leicht anspruchsvolle Tagestour, Optionen Richtung Äscher/Ebenalp prüfen. | bestanden als Planungsoption | Hüttentobel-Runde SAC T2, 7,34 km / 377 m Betreiberreferenz plus separate Ebenalp–Äscher-Runde. Zwei Original-GPX-Tracks; Seealpsee mit Profil, Ebenalp-Höhen wegen Nullmeter-Platzhaltern ausdrücklich unverfügbar. Steiler Äscher–Seealpsee-Abstieg ausgeschlossen. | Regionalticket, Wetter, Weg- und Seilbahnstatus für September 2027 prüfen. |
| P4.7 | 14.09. Rückreise nach München ohne unbestätigte 2027-Fahrpläne als Fakten. | bestanden für Entwurf | Fachtest prüft leeren Aktivitätsvorschlag, eine Rückfahrt nach München und confirmed2027=false. Bestehende Bahn-/Pass-Regression grün. | Buchbare 2027-Zugkette bleibt offen. |
| P4.8 | Wanderlänge, echte Höhenmeter, Wegklassifikation, Exponiertheit, Öffnung/Wetter und Alternative. | teilweise | SAC-/Betriebs-/Wetterhinweise vorhanden. | Echte Tourgeometrie, Höhenwerte und Alternative pro Route belegen. |
| P4.9 | Alle Haupttage mit Bildern, Tageskarte, flexiblen Aktivitäten und nachvollziehbaren Quellen. | teilweise | 14 Tagesentwürfe und lizenzierte Ortsbilder vorhanden. | Alle 14 Tage einzeln mit Karte, Bildzuordnung, flexiblen Punkten und Quellen abnehmen. |
| P5.1 | Ketten pro Kernstadt mit offiziellen Standort-/Katalogquellen recherchieren. | teilweise | Vorhandene kuratierte Einkaufsorte und Betreiberlinks gelesen. | Ketten für sechs Kernstädte anhand offizieller Standort-/Katalogquellen abgleichen. |
| P5.2 | Häufigkeit pro Stadt nur bei belastbarer Zählgrundlage zeigen. | teilweise | Begrenzte Geodatenabfrage wird als solche benannt. | Stadtweite Häufigkeitsangaben nur mit vollständiger Zählgrundlage abnehmen. |
| P5.3 | Vergleichbarer Basiskorb mit Preis/Einheit/Währung/Datum/Quelle. | teilweise | Neun offizielle nationale Produktreferenzen vom 19.11.2026 für Frankreich/Spanien/Schweiz; ähnlicher Dreierkorb mit Einheiten, EUR/CHF und Produktunterschieden. Renderer und Quellenumfang getestet. | Vollständige lokale Körbe und Filialangebote der sechs Städte fehlen; keine Stadt- oder 2027-Verfügbarkeit behauptet. |
| P5.4 | Schnelle günstige Rezepte mit Mengen für 3 Personen und Kochdauer. | bestanden als Planungsoption | Vier einfache Rezeptfamilien für sechs Hauptorte, insgesamt 25 Rezept-/Restaurantoptionen. Mengen für drei, Dauer, Schritte, Ausstattung und Annahmen sichtbar; Portions- und Packungskosten getrennt. | Offene Produktpreise weiter belegen; keine belegte Günstigster-Ketten- oder Verfügbarkeitsaussage. |
| P5.5 | Frühstück/Mittag/Abend und Küche/Unterkunft zusammenbringen. | bestanden für lokale Planung | Drei Slots im echten Chrome gespeichert, gemeinsam gerechnet und nachgeladen. Frühstück an vorheriger Nacht; gewählte Unterkunft, Ankunft und tatsächliche Zeit/Dauer vor Check-out in Fachtests geprüft. Unbekannter Zugang bleibt offen. | Küchen-/Kühlmöglichkeit der später konkret gewählten Unterkünfte vor Reise bestätigen. |
| P5.6 | Funktionsfähiger Warenkorb mit Mengenaggregation, Extras, Entfernen und Abhaken. | bestanden | Aggregation, Vorräte, Zusatzartikel, Entfernen, Wiederherstellen und Abhaken in Modell und Chrome geprüft. | Weitere Städtekörbe auf demselben Modell ergänzen. |
| P5.7 | Preis pro Gericht/Person nur aus transparent belegbaren Annahmen. | teilweise | Verbrauchte Zutaten und volle Packungen getrennt; neun offizielle Produktreferenzen mit Datum, neun unbelegte Produkte mit offenem Preis/Grund/nächster Quelle. Kalte Rezepte, offene Teilsummen und unbekanntes CHF getestet. | Die neun offenen Preise und lokale Verfügbarkeit belegen; Zeit-/Mengenannahmen bleiben ausdrücklich Planung. |
| P5.8 | Einkauf als optionaler Tagesstopp, Preisänderung nur mit Bestätigung. | bestanden für lokale Planung | Optionalen Laden aus dem Warenkorb auswählen, Zeit speichern, Undo, Wiederwahl, Dublettenschutz und Persistenz im Chrome-Flow geprüft. Waren unverändert nur einmal gerechnet; Preise erst nach bestätigtem Speichern geändert. | Konkrete Ladenöffnung und Eingang vor Reise prüfen. |
| P5.9 | Manuelles Eintragen/Löschen von Preisen und gespeicherten Vorräten. | bestanden | Preise und Vorräte eingeben, ändern und leeren. Test gegen Wiederladen und Gruppengrößenwechsel. | Gespeicherte Vorräte auch auf Smartphone visuell prüfen. |
| P6.1 | Gezieltes Anreichern der aktiven Variante statt erst aller Nebenvarianten. | teilweise | Neue Abnahme fokussiert interrail_swiss. Bestehende Varianten bleiben erhalten. | Weitere Recherche auf die offenen Haupttage priorisieren. |
| P6.2 | Echte, lizenzierte, korrekt zugeordnete Bilder priorisieren. | teilweise | Bestehende Commons-Zuordnungen und Lizenzinformationen vorhanden. | Motivgenauigkeit und fehlende Unterkunftsfotos einzeln abnehmen. |
| P6.3 | Kurzvorschau + tiefe Details, Preise, Öffnungszeiten, Dauer, Quelle. | vorhanden, weiter prüfen | Quick Peeks und fünfteiliger Inspektor im aktuellen Browserflow. | Datenvollständigkeit pro Haupttag prüfen. |
| P6.4 | Google-Maps-Links korrekt nach Suchlink vs. genauem Ort markieren. | vorhanden, weiter prüfen | google-maps-Modul und Suchlink-Tests vorhanden. | Adresse, Suchlink und Gebietslage für Hauptvariantenpunkte abnehmen. |
| P6.5 | Booking-/Airbnb-/Betreiberlinks bei nachweisbaren Einträgen. | vorhanden, weiter prüfen | Booking-/Airbnb-/Betreiberreferenzen im aktuellen Katalog. | Ziel-URL und Status konkreter Hauptvarianten-Unterkünfte prüfen. |
| P6.6 | Kartenpunkte nur bei belegter Position, sonst plausible Gebietslage kenntlich. | teilweise | Provenienz-, Standort- und Gebietslagentests vorhanden. | Kartenpositionen der Haupttouren anhand individueller Quellen prüfen. |
| P6.7 | Unklare 2027-Verfügbarkeiten konsequent als vorläufig anzeigen. | teilweise | Vorläufige Preise/Fahrpläne im Katalog und aktuellen Tests gekennzeichnet. | Alle sichtbaren 2027-Signale der Hauptvariante prüfen. |
| P6.8 | Pro fehlendem Datensatz Grund und nächste Quelle dokumentieren. | teilweise | Einzellückenberichte und Datenprüfung im Branch vorhanden. | Aktuelle offene Daten je Haupttag mit Grund und nächster Quelle zusammenführen. |
| P7.1 | Test-/Build-Fehler zuerst beheben, nie auf defekter Grundlage fortsetzen. | bestanden | 453 Ausgangstests; vollständige Regression mit privaten Rohkopien, neue Fachtests und HTTP-Prüfung grün. Windows-Profilbereinigung und fehlender Unterkunfts-Quellenalias korrigiert. | Aktuelle Zahlen und Logs stehen in STATUS.md. |
| P7.2 | Regressions- und Browserfälle auf Desktop, Tablet, Smartphone. | bestanden für lokale Browserabnahme | Originaldaten-Suite, vollständiger Chrome-Flow, elf Hauptseiten bei 1440/820/390 Pixeln und neun echte Wanderkarten-Vorschauen geprüft. Neues Mahlzeitenpaket mit sechs Ansichten und eigenem PUT-Rennfall; Details in MEALS_ACCEPTANCE.md. | Externe Livekarten, Bildabrufe und echte Mobilgeräte bleiben gesonderte Prüfungen. |
| P7.3 | Visueller Abgleich anhand echter Vorher-/Nachher-Bilder. | teilweise | 66 neue Vorher/Nachher-PNGs dokumentiert. | Alle Seiten visuell vergleichen und Korrekturen belegen. |
| P7.4 | Performance-Kennzahlen, Kontrast, Keyboard, Fokus, Reduced Motion prüfen. | teilweise | Datenseite DOM/Timing/47 Texte/Enter-/Space-Fokus. Unterkunftsvergleich 142 Texte je Ansicht: mindestens 5,95:1 hell bei drei Breiten, 6,61:1 dunkel/Desktop. Native Enter/Tab, verspätete Antworten mit unfertigem Entwurf/Fokus und echter Maus-Reset geprüft; bestehender Reduced-Motion-Audit grün. | Weitere Formulare/Tabellen, dunkler Fokus, übrige Seiten und Screenreader bleiben offen; keine vollständige Barrierefreiheitsbehauptung. |
| P7.5 | Jede Änderung in nachvollziehbaren Commits, keine ungeprüften globalen Refactors. | bestanden für diese Runde | Eigener Arbeitsbranch; Warenkorb, Kompression/Abnahme und Wander-/Quellenkorrekturen in benannten lokalen Commits. | Keine Veröffentlichung oder Zusammenführung ausgeführt. |
| P7.6 | Kein Merge/Deployment/Booking; abschließende offene Punkte mit Gründen und Nachweisen. | teilweise | Offene Punkte in dieser Liste einzeln mit Grund und nächstem Schritt. | Abschlussprüfung aller 61 Anforderungen steht aus. |

## Seitenmatrix und Akzeptanzkriterien

Die PNGs liegen unter outputs/Abnahme-V2/vorher und outputs/Abnahme-V2/nachher im ursprünglichen Aufgabenordner. Die elf Seiten wurden bei 1440, 820 und 390 Pixeln mit derselben Schweizer Hauptvariante und denselben lokalen Tripsy-Rohkopien aufgenommen. Jede Prüfung verwendet eine eigene isolierte SQLite-Datenbank, reduzierte Bewegung und blockierte externe Medien. 66 Hauptseitenbilder plus 18 Bilder der Tourkarten und GPX-Linien liegen vor. Der unveränderte Vorher-Stand schlägt gezielt bei der überlaufenden Tour-Beschriftung fehl; der korrigierte Nachher-Stand besteht. Aus den Bildern folgt keine Bestätigung externer Bilder, Kartenkacheln oder echter Geräte.

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
| data | Initial 387 DOM-Knoten; neun Prüfgruppen auf Abruf | Geöffnete Tabellen und übrige Tastatur-/Kontrastzustände prüfen | Vollständige Quellen, Feldgründe, Exporte und Import bei geringer Anfangslast erhalten |

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
