# Phase 17 – Umsetzung der Designreferenzen

**Datum:** 13.11.2026 · **Reiseplaner v1.7** · Draft PR #5, Entwicklungsbranch.

## Welche Muster aus den Bildreferenzen übernommen wurden

Die hellen Designyow-Dashboard-Vorlagen wurden für eine stärkere typografische Hierarchie, eine leise vertikale Seitennavigation, Thumbnail-Ziellisten, eine strukturierte Reise-Kopfzeile und wenige gleichzeitig sichtbare Hauptaktionen verwendet. Aus den Navica-Dashboard-Bildern wurden datenbasierte Fortschrittsbalken, kompakte KPIs und eine klare Abstufung zwischen Primär- und Nebendaten übernommen. Der Wanderlog-Bezug dient als Grundidee für die gekoppelte Karte und den Tagesplan.

**Nicht übernommen, weil sachlich unzutreffend:** beispielhafte persönliche Begrüßungen, echte Live-Standorte anderer Personen, Wetterdaten, Bordkarten/Flüge, Währungsumrechnungen ohne reale Quelle, erdachte Hotelbewertungen sowie frei geschätzte Echtzeit-Fußwege. Das Projekt bleibt ein privates Reiseplanungswerkzeug, keine Community-/Buchungsplattform.

## Startseite

- `public/views.mjs` erzeugt `cockpit-welcome`, `destination-filmstrip`, `cockpit-progress` und einklappbare `cockpit-reference`-Tabellen. Bestehende Originalrouten, Vergleichswerte, Fristen und offizielle Hinweise sind erhalten.
- Fotos werden nur aus `curatedPlacePhoto(item)` für eindeutig übereinstimmende Sehenswürdigkeiten mit Wikimedia-Quellenlinks bzw. den bereits hinterlegten Nutzer-Attributionen übernommen. Ziele ohne passendes Foto zeigen Icons. Bestehender Katalog bleibt unverändert.
- Bereits belegte Größen: Reisezeitraum, Variantenmitglieder, Städtezahl, aktuelle bekannte Euro-Planwerte, unbekannte Planwert-Positionen sowie die vorhandenen Prüfungen.

## Tagesplan und Karte

- `public/place-profile.mjs` stellt `placeThumbnailHtml` für kleine Foto-/Icon-Kacheln mit Abbildung nur bei vorhandener Lizenz/Attribution bereit. Der vollständige Detaildialog enthält weiterhin den Bildnachweis.
- `public/visual-experience.mjs` liefert reine Hilfsfunktionen für die zeitliche Einordnung. Nur gültige `HH:MM`-Planzeiten werden gruppiert: 00:00–04:59 Nacht, 05:00–10:59 Morgen, 11:00–13:59 Mittag, 14:00–17:59 Nachmittag und 18:00–23:59 Abend. Fehlende/ungültige Zeiten erzeugen keinen Zeitblock.
- Der Kostenindikator `planCostSignal(item,people)` nutzt ausschließlich gültige EUR-Planpreise und teilt bekannte Gruppenbeträge für Aktivität/Verkehr/Essen durch die Reisendenzahl. Stufen **Essen:** kleiner als 15 € → `€`, 15–34,99 € → `€€`, ab 35 € → `€€€`; **Aktivitäten:** kleiner als 10 €, 10–39,99 €, ab 40 €; **Verkehr:** kleiner als 20 €, 20–69,99 €, ab 70 €. Bekannte Nullbeträge erscheinen als `0 €` ausdrücklich nur als Plangröße. Unterkunftspreise werden mit exaktem vorhandenen Gruppen-Planwert, aber ohne nicht belegte Nachtklassifizierung ausgewiesen (`€?`). Fremdwährungen, Gruppengrößenkonflikte und fehlende Preise bleiben `Preis offen`.
- Die Kartenansicht bietet bei `Gesamt` die vorhandene schematische Städtefolge, bei `Tag` den echten gewählten Stadtnamen und Reisetag sowie eine nur aus `ctx.day` abgeleitete Zeitfolge. Klicken auf einen Eintrag hebt den tatsächlichen aktuellen Planstopp hervor; `Flexibel` wird niemals als Uhrzeit geschätzt.
- Die bisherige grüne, animierte Linienführung arbeitet weiterhin nur mit vorhandener berechneter Weggeometrie. Nicht verifizierte Luftlinien bleiben gestrichelt. Bei `prefers-reduced-motion:reduce` werden Übergänge und Route-Flow deaktiviert.

## Informationsdichte und Bildfehler

- In der kompakten Ortsliste stehen `Merken` und `Auf Karte` bzw. `Details` sofort bereit. Weitere Bedienelemente werden in einem semantischen `details`-Element geöffnet, ohne Funktionen zu entfernen. Das spart Buttons und lässt die Darstellung dem Nutzer angepasst.
- Hinweise zu Fallback-Forschungsdaten werden nicht unterdrückt, sondern sichtbar als kompakte Statuszeile geführt, mit aufklappbarer Quellenwarnung.
- Für Commons- oder Nutzer-Fotos, die offline oder durch Browser-/Proxyfehler blockiert sind, behandelt eine delegierte `error`-Listener-Routine nur Bilder im Zielbild, Miniaturbild und Ortsprofil. Bilder werden versteckt und vorhandene Kategorie-/Ortsplatzhalter sichtbar; Attribution und Source-Link bleiben erreichbar.

## Test- und Qualitätsstand

- Unit-Test `test/visual-experience.test.mjs`, ergänzte `test/place-profile.test.mjs`, Node-Modultests, reale Chrome-DOM-Tests für Reise-Cockpit, Karten-Metadaten, Zeitfolge, Preis-Einstufung, aufklappbare Aktionen und Bildfehler.
- GitHub Actions exportiert 7 Screenshots (`01`–`07`), darunter `07-dashboard-fortschritt.png`, für Desktop, Tablet, Smartphone und ausgewählte Karte.
- Einschränkung: Chrome-Screenshots laufen mit Forschungs-Seed/`?offlineMap`; sie dokumentieren Browser-Layout und Interaktion, **nicht** vollständig geladene Online-OSM-Kacheln oder einen echten iPhone-/Android-Hardwaretest.

## Offen

Mehr exakt zugeordnete und rechtlich nachnutzbare Bilder, unabhängige Einzelortkoordinaten, Anbieter-Endpreise und Bettensituation, bestätigt buchbare September-2027-Fahrten, manuelle visuelle Prüfung auf echten Geräten. Bis dahin darf der Planer keine angeblichen Echtzeitdaten oder belastbaren Checkout-Zusagen darstellen.