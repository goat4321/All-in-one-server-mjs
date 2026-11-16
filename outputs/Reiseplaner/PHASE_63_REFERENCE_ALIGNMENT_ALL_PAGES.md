# Phase 63 – Abgleich der gesamten Reiseplaner-Website mit den hochgeladenen Referenzbildern

**Stand:** 16. November 2026. **Änderungen ausschließlich** in `feature/v7-data-day-accommodation-rail` / PR #5. Kein Merge oder Deployment. Die Reisedaten, Koordinatenbelege und Buchungszustände bleiben unberührt.

## Tatsächlich verwendete visuelle Referenzen

Die folgenden bereits vom Nutzer bereitgestellten Bilder wurden visuell geprüft; die Namen sind lokale Bibliotheksdateien, nicht neue Quellen oder erfundene Screenshots:

- **Barcelona-Reise im grünen Reiseplaner.png** (1672×941): klare obere Reise-Navigation; breiter Stadtheader mit Foto; ~31 % links Tageszeiten-/Fototimeline und Datumspills; ~69 % rechts große Karte mit schwebendem Moduswechsel, Routenmarkierung und Fotokarten unmittelbar darunter.
- **image(20261113-212628).png**: luftiges weißes Dashboard, ruhige Navigation, klare statt dicht gefüllte Karten.
- **18-reference-day-map-desktop-1440.png** und **22-reference-city-map-1440.png**: frühere echte Website-Screenshots, verglichen mit dem gewünschten Referenzlayout. Damaliges Defizit: dauerhaft sichtbare Sidebar bzw. übermäßige technische Bereiche, Karte zu wenig im Fokus.
- **19-reference-day-map-mobile-390.png** und **43-mobile-karte-ohne-ueberlagerung-390.png**: reale mobile Ansicht mit Karte, Quellenpunkten, Auswahlpanel und sechs bottom-nav Tabs.
- **51-tagesplan-kurze-bedienung-1280.png**: Tagesplan mit Schnellbearbeitungs-Chips, fehlende Foto- und Tagesablauf-Hierarchie im Vergleich zur Barcelona-Referenz.
- **52-clubs-mit-echten-lizenzierten-fassadenfotos-desktop(1).png**: Aktivitätskarten mit teils verzögert extern ladenden Commons-Fotos, viele Datenqualitätsfelder, die visuell stärker zurücktreten sollten.

## Priorisierte Abweichungen und konkrete Änderungen

| Bereich | Bisheriger Zustand | Phase-63-Anpassung |
|---|---|---|
| Navigation, alle Seiten | Kartenseite hatte andere Kopfnavigation als die übrigen Reisebereiche; Seitenleiste blieb auf Desktop präsent | Einheitliche sticky obere Reise-Navigation, Offcanvas-Seitennavigation für Unterseiten, zentrales Suchfeld, direktes Merken/Entdecken; Buttons arbeiten auch außerhalb der Kartenseite |
| Reiseheader | Foto-Kachel + Details eher technisch und klein | Fotobetonter, dennoch quellenbewusster Header mit Reisezeitraum, Reisenden und Bearbeitungs-/Kartenaktionen, weichere Übergänge, bessere Lesbarkeit |
| Karten-Desktop ≥1180 px | Links Datums-/Ortsfilter, rechts Karte; Bildrecherche visuell untergeordnet | Layout ca. **31,5 % Agenda links / 68,5 % Karte+Galerie rechts**; Kartenoberfläche im ersten Desktop-Viewport, Fotogalerie direkt im rechten Spaltenfluss |
| Tagesplanung | Zu viele Elemente und sekundäre Buttons gleichzeitig | Kompakteres bebildertes Tageslayout, weichere Reihenfolge, runde Day-Pills und direktes Hinzufügen/Löschen über bereits bestehende Actions |
| Stadt/Gesamtroute | Rechercheliste verdrängte oft den eigentlichen Tagesablauf | Agenda bleibt in **allen Kartenmodi** sichtbar. Die vollständigen Filter-/Ortslisten bleiben in einem aufklappbaren, bedienbaren Bereich erhalten |
| Fotokarten | Schwankende Kachelformate und viel technische Provenienz im Hauptfokus | Einheitliches Bildformat/-verhältnis, ruhige 2-zeilige Beschreibung, klare Detail-/Merken-Aktionen; Lizenzangaben bleiben sichtbar |
| Aktivitäten, Unterkünfte, Übersicht | Boxartige Filter-/Infobereiche, je Seite abweichende visuelle Identität | Gemeinsame Rundungen, Schatten, typografische Hierarchie, Chip-Farben, Medienhöhen und Interaktionszustände |
| Inspektor/Modals | Sehr technische Faktensammlung im Vordergrund | Foto und Ortsname visuell stärker gewichtet, bestehende fünf Reiter und echte Quelleninformationen erhalten |
| Smartphone 390 px | Karte/Detail/Unterseiten teils überladen | Gestapelter Ablauf: Reiseidentität → Datum → breite Karte → ortsbezogene Agenda/Details → Galerie, sechs Tabs in einer unteren Zeile, kein horizontaler Seitenüberlauf |
| Tablet 820 px | Desktop-Darstellung unter 1180 px zu eng | Einspaltige Karten-/Agenda-/Fotoreihenfolge, getrennte Kontrollen ohne schwebende Überlagerungen |
| Animation | Zu viele gleichzeitige Übergänge | Subtile Hover-Effekte, vorhandene Vorzugseinstellung `data-motion=off` sowie `prefers-reduced-motion` weiter unterstützt |

## Geänderte Dateien

- `public/views.mjs`: gemeinsame Navigation und Kopfbereich für alle Seiten; Agenda im Kartenmodus immer präsent; Quellenlisten über `<details class="reference-places-drawer">` erreichbar
- `public/app.mjs`: globales Merkliste-Kommando `nav-saved`, Suchnavigation von Unterseiten zur Karte und Fokus-Wiederherstellung bei Suchfeldwechsel
- `public/reference-realignment-v63.css`: bewusst **letzte** CSS-Schicht für Desktop, Tablet, Mobil, Dashboard, Reiseheader, Tagesplan, Karten-/Fotobereich, Auswahllisten, Filter, Unterkunfts- und Aktivitätskarten sowie Inspektor
- `public/index.html`: neue CSS-Schicht nach den alten Designrunden eingebunden, ohne die älteren CSS-Dateien oder Funktionalität zu löschen
- `test/reference-realignment-v63.test.mjs`: sechs zusätzliche Regressionstests für die genannten Elemente
- `package.json`: diese Tests in `test:portable` aufgenommen

## Abnahme und überprüfte Grenzen

- Die bisherigen **352** Tests wurden um sechs ergänzt, nun **358 / 358** grün, **0 fehlgeschlagen**.
- Beide CI-Workflows der Version `7223e87a5b3d1b98f0b5caeb2fad1de662b236d9` liefen erfolgreich:
  - https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43910454349
  - https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43910449911
- Bereits im ersten Browser-Vergleich fiel eine Abweichung auf: Der Desktop-Kartenbereich begann zu tief (Anforderung: Oberkante unter 210 px). Die Position wurde durch Anpassung von Header, Arbeitsbereich und Hero korrigiert. Danach liefen die Chrome-Abnahmetests erfolgreich.
- Die Karte nutzt weiterhin die vorhandene freie OSM-/MapLibre-Technik; erfundene exakte GPS-Eingänge, gefälschte Routenzeiten, Hotelpreise oder Öffnungssignale werden nicht eingesetzt.
- Fotoquelle, Urheber und Lizenz werden weiter gezeigt, und fehlgeschlagene Wikimedia-Bildladungen bleiben als solche erkennbar. **Die Anzahl echter lizenzierter Objektfotos ist eine Datenfrage, kein per CSS lösbares Designproblem.**
- Auch wenn Farben, Fluss und Größen nahe an der Referenz liegen, ist keine pixelgenaue Nachbildung der Konzeptgrafik möglich: Deren Restaurant-Ratings, Route, Stunden und Bilder sind keine verifizierten realen Interrail-Daten. Die Website zeigt nur tatsächliche Einträge und belegte Quellen.
- Kein Merge und kein öffentliches Deployment; für die Sichtkontrolle des neuen Designs ist eine aktuelle lokale Preview bzw. die aus CI gespeicherten Screenshots notwendig.

## Sinnvolle nächste Schritte

1. Bei den konkreten 390-/820-/1440-px-Renderings letzte Abstands-, Überlagerungs- und Kartenbewegungsabweichungen anhand der neu erzeugten Chrome-Screenshots vergleichen.
2. Für noch fehlende öffentliche Attraktionen mit realen Commons-Lizenzen weitere Bilder ergänzen; niemals ein beliebiges Stadtmotiv als exakte Sehenswürdigkeit ausgeben.
3. Die vielen älteren CSS-Runden mittelfristig in weniger, klar benannte Designmodule konsolidieren. Diese Phase hat sie aus Sicherheitsgründen nur überschrieben, nicht entfernt.
4. Für die Tagesplanung einen optionalen kompakten Referenzmodus hinzufügen, der Datenqualitätsdetails hinter einem bewusst geöffneten Bereich zeigt, ohne Quellenpflicht oder verifizierte Fakten aufzugeben.
