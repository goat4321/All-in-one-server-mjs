# Phase 35 – Freie Reisestadt-Suche, Verpflegung und Unterkünfte

Stand: 14. November 2026. Projekt: `outputs/Reiseplaner/`; Entwurf auf `feature/v7-data-day-accommodation-rail` (Pull Request #5).

## Direkt tatsächlich geöffnete Referenzen

1. `Barcelona-Reise im grünen Reiseplaner.png` (1672 × 941): verbindliches Ziel mit sehr großem rechten Karten-/Fotobereich, schmalem linken Tagesstreifen, weißgrünen Karten, großen weichen Rundungen, horizontalen bebilderten Ortskarten und einer reduzierten Kopfzeilennavigation. Das Bild ist eine Designerstellung, keine Preis- oder Bewertungsquelle.
2. `image-gen-1(4).png` (1672 × 941): InterrailPlan-Referenz mit sehr gut lesbarem Tagesplan, klaren Datumsauswahlen, getrenntem Kartenbereich, nachvollziehbaren Transportabschnitten und einklappbaren Informationen. Diese Referenz ist ebenfalls keine Datenquelle für Reisezeiten oder Anbieter.
3. Das neueste nutzerseitig übermittelte mobile Kartenbild mit großen runden Foto-Bubbles, weißem Rand, softem Schatten, Kategorien und Namen dient speziell der V34-Kartenansicht.

## Zielkonzept: Ortserkundung ist nicht mehr an den Reisetag gebunden

Die Kartenoberfläche zeigt jetzt sichtbar drei Bereiche: **Mein Tag** (Tagesplan und Tagesentwurf), **Stadt entdecken** (alle vorhandenen Orte der gewählten Stadt unabhängig vom Tagesdatum) und **Alle Reiseorte** (sämtliche vorhandenen Orte entlang der ausgewählten Reisevariante). In den beiden allgemeinen Modi ersetzt ein großes, eindeutiges Kategoriepanel die chronologische Tagesliste. Die fünffache Auswahl umfasst Unterkünfte, Restaurants und Cafés, Lebensmittelgeschäfte, Aktivitäten und Sehenswürdigkeiten sowie Bahnhöfe und Verkehr. Der ursprüngliche Tagesplan bleibt vollständig erreichbar, wurde aber aus den allgemeinen Modi herausgenommen.

Die Quellenzuordnung und Ortsgenauigkeit bleiben unverändert: Einträge ohne nachgewiesenen POI-Pin stehen in der Liste beziehungsweise als ausdrücklich ungenaue Referenz und erhalten keine erfundene Gebäude-Koordinate. Bereits beim Kartenumbau V34 war ein begrenzter, auf Nutzeraktion aktivierter Overpass-Supermarktfilter ergänzt worden. Dieser bleibt erhalten.

## Unterkünfte – neue visuelle Hierarchie

- Großer Reisekopf mit einem ausdrücklich als **Ortsmotiv**, nicht als Unterkunftsfoto, bezeichneten lizenzierten Bild aus dem Bestand oder einer dekorativen Ortsillustration.
- **Stadt / Alle Reiseorte**, Ortswechsel über Select, Suchfeld für Hotel, Hostel, Küche und Lage.
- Primäre Filter: Alle, Merkliste, Preisreferenz. Weitere spezielle Hotelprüfungen in einem separaten aufklappbaren Filterbereich.
- Bebilderte Hotelkarten, wenn ein belegtes/zugelassenes Objektfoto tatsächlich vorhanden ist. Ansonsten eine ruhige einheitliche Illustration statt eines falsch zugeordneten Hotelbildes.
- Im Vordergrund Name, Stadt, Zimmer-/Kücheninformationen, Kostenorientierung, nicht gebucht, Karte, Details und Auswahl. Weitere Nachweise öffnen sich gezielt.
- Vergleich, Bahnhofwege, Bettenprüfung, eigene Gruppenstimmen, historische Suchpreise, Budgetvergleich und Anbieterprüfung bleiben vorhanden, werden aber ohne dauerhafte technische Kachelwände dargestellt.

## Verpflegung – Restaurants, Supermärkte und Mahlzeiten unabhängig vom Datum

- Derselbe ruhige Reisekopf, Stadt- und Reiseroutenumschalter sowie Suchfunktion.
- Vier große Kategorien: **Alle Orte**, **Restaurants & Cafés**, **Supermärkte**, **Selbst kochen**.
- Restaurants/Cafés und bekannte Lebensmittelgeschäfte erscheinen auf Fotokarten, mit vorhandener Preisorientierung, dokumentierten Adressen und Details.
- Für zusätzliche Supermärkte gibt es die eigene Aktion **Supermärkte auf Karte suchen**, die den vorhandenen V34-Overpass-Filter aktiviert. Es wird nicht behauptet, dass alle Geschäfte einer Großstadt bereits erfasst sind.
- Die bisherigen Planmenüs, Einkaufslisten, Mengenberechnung und historischen Menüpreisbelege sind weiter verfügbar, aber in aufklappbare Abschnitte verlegt, um den allgemeinen Überblick nicht zu überfrachten.

## Korrekturen der Datenlogik

- Im Modus Alle Reiseorte wählen Hotel- und Aktivitätskarten **die tatsächlich im Datensatz hinterlegte Stadt**. Das Dialogformular startet dann in dieser Stadt und verwendet ein passendes Reisedatum, statt den Ort fälschlich dem zuletzt geöffneten Barcelona-Tag zuzuordnen.
- Die Funktion `meal-choose` löst Menüideen in der **richtigen Stadt** auf, auch wenn die Idee aus einer reiseweiten Übersicht gewählt wurde.
- Die Kartenkategorien zählen unabhängig vom gerade aktiven Gruppenfilter die tatsächlich zugänglichen Einträge in der ausgewählten Stadt bzw. der ganzen Reise.
- Die Karte zeigt geplante oder unverbindliche Tagesideen ausschließlich bei Mein Tag; alle anderen Modi nutzen normale POI-Marker.
- Große Kartenbuttons und eine mobile fünffache Schnellnavigation führen zu Tagesplan, Karte, Unterkünften und Verpflegung. Suche und Listenpagination ändern nur die Ansicht, nicht die gespeicherten Buchungen.

## Tests und Abnahme

- Acht synthetische Funktionsprüfungen für Stadt-/Reise-Scope, Suche, Kartenkategorien, Hotelkarten, Verpflegungskarten und Navigation wurden im verbundenen Entwicklungswerkzeug durchgeführt, **8/8 bestanden**. Die Testdatei `test/browse-v35.test.mjs` enthält zusätzlich konkrete Katalogtests für den vollen Node-Testlauf.
- Die Dateien `app.mjs`, `views.mjs`, `browse-hub-v35.mjs`, Browser-Regressionssuite und neue CSS-Regeln wurden statisch auf JavaScript-/CSS-Syntax geprüft.
- Der Chrome-End-to-End-Lauf wurde mit zusätzlichen Screenshotpunkten für Stadtkarte, Unterkunft und Verpflegung erweitert. **Ohne tatsächliche Ausführung dürfen keine neuen Browser-Screenshots oder pixelgenaue visuelle Übereinstimmung behauptet werden.** Der bisherige GitHub-Actions-Runner bricht vor Schritt 1 ab; das ist ein externes Infrastrukturproblem, kein grünes Testresultat.
- Datenlücken bleiben: Manche Objekte haben keine individuell lizenzierbaren Hotel-/Restaurantfotos, 2027-Endpreise und -Öffnungszeiten sind nur teilweise nachgewiesen, und die Overpass-Supermarktquelle deckt maximal 160 Läden im 6,5-km-Radius ab.

## Implementierte Dateien

Neu: `public/browse-hub-v35.mjs`, `public/browse-hub-v35.css`, `test/browse-v35.test.mjs`.
Geändert: `public/app.mjs`, `public/views.mjs`, `public/index.html`, `test/portable-browser.mjs`, `package.json`, `README.md`.

## Noch zu prüfen

1. Vollständiger Node- und Chrome-Durchlauf der neuen Branch-Version.
2. Echter Bildschirmvergleich auf 1440 × 900 und 390 × 844, insbesondere tatsächliche Bildhöhe, Button-Wrapping, Kopfbereich und Kartenspalten.
3. Qualität und Einzellizenz verfügbarer Unterkunfts- und Restaurantbilder: keine synthetischen Objektbilder aus Stadtsymbolen als Anbieterfotos ausgeben.

