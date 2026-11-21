# Phase 71 – Stadtankunft als Szene, echte Ideen & aufgeräumte Reiseanimation

Stand: 16.11.2026. Entwicklungsbranch und PR #5; **keine** Buchung, keine Preis- oder Fahrplanbehauptung.

## Visuelle Regie: Ankunft

1. **Reise zwischen Städten:** Ein einzelner türkisfarbener Punkt bewegt sich über die bereits vorhandene schematische Städtefolge. Kein Kamerawackeln beim Fahren. Linien sind **Luftlinien**, keine Bahngleise.
2. **Ankunft (0–0,3 s):** Punkt bremst aus, ein dünner Halo pulsiert am Stadtmarker; das Stadtsymbol führt zwei sanfte, kurze Bewegungen aus (kein Wackeln der ganzen Karte oder UI).
3. **Entdecken (0,3–2,5 s):** Höchstens **fünf** gebündelte Symbolkarten strahlen mit gestaffeltem Start nach oben, rechts, unten links usw. weg. Beispiele nur aus dem **tatsächlichen Reise-Katalog**: Aktivitäten, Restaurants, Natur/Strand, Nachtleben, Unterkunft. Die Grafik ist ein **illustrativer Orbit am Stadt-Referenzpunkt**, ausdrücklich **kein Orts-POI** und kein geokodierter Eingang.
4. **Lesbare Stadtkachel:** Die originale Reise-Steuerleiste zeigt den Stadtnamen, die Anzahl bekannter Ideen und 2–4 **echte** Einträge mit Kategorie und Status **„Im Plan“ oder „Idee“**. Keine langen Kartentooltips, keine automatischen Buchungen, kein ungeprüfter Preis.
5. **Abfahrt (nach ca. 3,1 s):** Die Orbital-Symbole verschwinden sanft; es bleiben der permanente Stadtmarker und der Reisepunkt. Am nächsten Ort beginnt die nächste Szene.

## Datenmodell / Trust

- `buildCityArrivalScene(trip,cities,items,activeIds)`: Nur Route-City-IDs, normalisierte Namen, vorhandene Datensätze. Ausgeschlossene Orte: `removed`, `duplicateOf`, `readOnlyExternal`, `explorerParent`, `kind=transport`, `kind=placeholder`; keine automatisch generierten Supermarktpositionen. Doppelte IDs/Namen nur einmal, Kategorien differenzieren. Strikte Maximalzahl, bevorzugt ausgewählte Einträge.
- `label` aus tatsächlichem Itemnamen, keine gewürfelten Highlights. Category icon und Status stammen aus Datensatz / aktiver Auswahl. Ohne Einträge bleibt eine schlichte Stadtankunft, **keine** frei erfundene Fotokarte.
- Keine Position des individuellen Ziels wird aus dem Stadtpunkt abgeleitet; Orbit ist rein gestalterisch.
- Repeated/cyclic cities keep their order by `index` and share only genuinely existing city info.

## Bedienung / Klarheit

- Statusleiste: Etappe N von M, „In Stadt angekommen“ bzw. „Unterwegs“, nächste Etappe und Fortschrittsbalken.
- Stop/Restart, Pause/Fortsetzen, Tempo 1×/1,5×/2× bleiben. Neu **„Ideen ansehen“**: Animation pausiert, die tatsächliche Stadtansicht und Ortsliste können gewählt werden (nicht ohne Absicht Tagesplan verändern).
- Weitere Info über **Orte & Filter**; während Story werden störende Kategorieleisten und Karten-HUDs ausgeblendet, die obligatorische Kartenattribution bleibt sichtbar.
- Desktop: kurzer Stadthalt als visuelle Szene und kleine Beispiele. Mobile: maximal drei lesbare Einträge; knapperes Orbit-Radius, keine Elemente außerhalb der Kartenfläche.
- `prefers-reduced-motion` und interne Bewegungseinstellung: **keine Vibration / keine fliegenden Icons / kein beweglicher Reisepunkt**; alle belegten Städte und die finale Übersicht direkt statisch.
- Keine Audio-/Vibration-API: „Vibrieren“ ist eine sanfte **visuelle** Markerbewegung, weder Gerät noch gesamter Bildschirm werden geschüttelt.

## Technischer Ablauf und Abnahmekriterien

1. Eigene pure Datenfunktion, ohne Services und ohne gefälschte Koordinaten.
2. Leaflet Story Overlay: aufeinanderfolgende Marker-Bursts mit CSS-Stagger, eigene Clear-/Cancel-Logik bei Weiterfahrt, Stop, Seitenwechsel, Umschalten, Datenwechsel.
3. DOM-Statusleiste aktualisiert nur einzelne Textknoten; keine `app.innerHTML`-Neudarstellung auf jedem Animationsframe (sonst langsame Karte).
4. Responsive CSS / hochwertige Markerhierarchie und eigener „geplant vs. möglich“-Text.
5. Node-Tests: 3–5 Kategorien, echte Namen, kein Place-Mutation, dedup, no unsupported claims, sparse cities.
6. Chrome-Browsertest: tatsächliche erste und zweite Stadtankunft, sichtbares Wackeln/Orbit, nächste Etappe, Pause, Stop, neues Starten, mobile Layout und reduzierte Bewegung.
7. GitHub Actions vollständig grün, dokumentierte Restunsicherheiten. Kein Merge, kein Deployment.
