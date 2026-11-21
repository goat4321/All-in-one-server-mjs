# Phase 26 – Referenzabgleich, visuelle Reorganisation und Bild-/HUD-Integration

**Datum:** 14.11.2026. **GitHub:** `goat4321/All-in-one-server-mjs`, Branch `feature/v7-data-day-accommodation-rail`, Draft-PR #5.

## Tatsächlich erneut betrachtete Referenzbilder

Die folgenden **vorher vom Nutzer bereitgestellten** Dateien wurden in der Dateibibliothek erneut geöffnet und visuell inspiziert, nicht nur über frühere Zusammenfassungen interpretiert:

1. `Barcelona-Reise im grünen Reiseplaner.png`: fotobetonter Reisekopf, **Tagesplan links / große Karte rechts**, farbige aber sparsame Zeitblöcke, große Bilder mit kompakten Titel-/Preisinfos, darunter horizontale Bildkarten.
2. `image-gen-1(4).png` (`InterrailPlan`): strukturierte Zug-/Lauf-/Unterkunftschronologie direkt neben der Karte; Strecken und Warnungen sind im selben Sichtfeld statt auf separaten Vollseiten.
3. `image(20261113-212622).png` (Designyow): großzügige Weißräume, dezente Kopfzeile, Bilder und kleine gut lesbare Inhaltsabschnitte.
4. `image(20261113-212740).png` (Navica): gestufte Typografie, kompakte Funktionsleisten und wenige bewusst hervorgehobene Werte.
5. `reiseplaner_v18_designvergleich(1).png` und `08-atlas-oben-desktop(1).png`: tatsächlicher früherer Programmzustand und früherer Referenzvergleich; die Karte lag zu weit unter einer breiten Datumsleiste, und zu viele Steuerflächen konkurrierten miteinander.

**Stilentscheidung:** Das bestehende grüne Markenfarbsystem und ruhige Flächen werden beibehalten; die Referenzen werden als **Funktions-, Hierarchie- und Kompositionsvorlage** angewandt. Keine ungeprüften Ratings, Sonnenuntergangs- oder Wetterdaten, Fake-Zugzeiten, Echtzeit-Fahrzeiten oder fremde urheberrechtlich geschützte Vorlagenfotos übernehmen. Die unter anderen Projekten genannte Agenturästhetik **Naol Websites** fließt nur als Premium-Layoutstil (klare Typografie, großzügige Flächen, reduzierte Buttons) ein, nicht als behaupteter 1:1-Screenshot der Live-Agenturseite.

## Konkrete Veränderungen

### 1. Desktop: neuer Referenzaufbau

Die Karte verwendet einen echten zweispaltigen **Layout-Stage**:

- **Linke Spalte, oben:** Die bestehenden Reisetage (`explorerDayStrip`) stehen jetzt **innerhalb der Planungsspalte** statt über der gesamten Karte. Sie bleiben horizontal scrollbar und zeigen das ausgewählte Datum und die Stadt.
- **Linke Spalte, darunter:** `mapDayAgenda` zeigt bis zu acht **wirklich geplante** Tagesstopps mit Nummern, vorhandenen HH:MM-Zeiten oder „Flexibel“, vorhandenen Foto-/Symbolminiaturen, Ortstext, Kostenkategorie aus der bestehenden Preislogik und einer tatsächlichen `data-action=select`-Kartenaktion. Der vorhandene `entryKey` bleibt erhalten. Der vollständige Tagesplan ist direkt erreichbar. Weiter als acht reichende Stopps werden **nicht** gelöscht, sondern als `+N weitere` ausgewiesen.
- **Noch leerer Tag:** Statt einer riesigen leeren Karte bekommt die linke Spalte **bis zu vier belegte Aktivitäten aus der aktuellen Stadt** als „Unverbindliche Ideen · nicht in den Tagesplan aufgenommen“. Sie besitzen V22-Einzelguides und führen über eine echte Detailaktion zum Ortsinspektor; es wird **keine Auswahl, Buchung oder Änderung an der Reisevariante ausgelöst**.
- **Rechte Spalte:** eine größere, echte Leaflet-Karte mit den vorherigen Pins, Routen, Kartenebenen und Auswahlfunktionen. Die Datumsleiste verdrängt die Karte nicht aus dem ersten Bildschirm. Die Benutzeroberfläche und die Kartendaten bleiben über die bestehende `ctx`-Pipeline synchronisiert.
- **Orte-Suche und Filter** bleiben unter der linken Tagesgeschichte nutzbar und scrollbar, ohne Karten-Neustart oder Überschreiben des Budgets.

**Screenshot-Regression behoben:** Ein anfänglicher Versuch, die Kartenhöhe über mehrere automatische CSS-Grid-Zeilen zu verteilen, ließ den linken Explorer unter die Kartenhöhe rutschen. Es wurde ein fixes Desktop-Gridbudget von 180px für die Datumszeile und eine verbleibende zweite Zeile eingeführt. Der Browser prüft **explizit**, dass die linke Such-/Tagesliste unmittelbar unter der Datumsauswahl beginnt und die Karte gleichzeitig oben rechts erscheint. Kein toter vertikaler Weißraum.

### 2. Einheitliche, kompakte visuelle Führung

- Der bestehende Seitentitel wird zu einer schlanken Bannerfläche mit stärkerer Typografie, kleiner Marken-/Reisezeile und einer **quellenbelegten** Stadtbildreferenz, wo vorhanden.
- Bei Browser-Sperren für externe Commons-Fotos gibt es statt zerbrochener Bildsymbole eine **dezente grüne Farb-/Formillustration**, nicht die Behauptung, dass ein Foto geladen wurde. Fehler werden vom bestehenden delegierten Image-Handler verarbeitet.
- Kartensteuerung direkt im Kartenausschnitt: **Mein Tag / Gesamtroute / Merkliste**. Die vorhandenen Routen-/Layer-Buttons bleiben erreichbar; redundante Tag/Gesamt-Schaltflächen werden an dieser Stelle visuell reduziert.
- Das vorher dunkelgrüne große HUD wird für diesen Referenzmodus zu einem **leichten, weiß-transluzenten Quellen-HUD** mit kompakten Kartenpunktzahlen, Bilder-/Quellstatus und direkt wirkenden `Fotos prüfen` / `Punkte prüfen`-Buttons. Keine fiktive Genauigkeit für geschätzte Pins.
- Gruppen, Trennlinien und Flächen sind reduziert, mobile Schaltflächen bleiben gut bedienbar.
- **Bebilderte Entdeckungsleiste** unter dem Karten-/Tagesbereich: bis zu acht echte Ortseinträge mit vorhandenen Nutzungsrechten, Bild-Originalquelle und relativer `€`-Stufe. Jedes Bild führt auf einen tatsächlichen Eintrag; Bildnachweise sind direkt verlinkt. Wenn für den aktuellen Filter kein lizenziertes Bild vorhanden ist, wird das offen angezeigt und die bestehende Bildrecherche zugänglich gemacht.

### 3. Mobil und Bewegung

- Auf schmalen Geräten liegt die **Tagesauswahl zuerst**, die Karte darunter und die vollständige Tages-/Ortssuche danach. Die Quellenanzeige nimmt keine gesamte Kartenbreite in Anspruch; Kartentasten liegen vor der mobilen Ortsdetailkarte.
- Die Fotokarten lassen sich horizontal durchscrollen; kein globales horizontales Seitenüberlaufen.
- Hover/Bewegung dauern nur 150–300 ms und bleiben rein visuell. Alle bestehenden Optionen `prefers-reduced-motion` sowie `Animationen aus` bleiben erhalten.
- Keine neuen JavaScript-Animationstimer, kein Tracking, keine neue externe Abhängigkeit.

## Implementierte Dateien

- `public/reference-map-scene.mjs`: `mapImageIntro`, `mapDayAgenda`, `mapFloatingControls`, `mapPhotoDiscovery`; pure, quellengestützte HTML-Erzeugung.
- `public/views.mjs`: Neuer Layout-Stage mit Datumsauswahl, synchronisiertem Tagesplan, Leaflet-Karte, Suche und lizenzierter Foto-Galerie.
- `public/design-round2.css`: Desktop-/Tablet-/Mobile-Layout, leichteres Karten-HUD, Fotoquellen, Tagesauswahl, Agenda, Galerie, Bildfallback, Animationseinstellungen und feste CSS-Grid-Zeilen aus der echten Screenshot-Abnahme.
- `public/app.mjs`: Erweitertes Bildfehler-Fallback für neue Bildflächen, ohne Inline-`onerror`.
- `test/reference-map-scene.test.mjs`: Zusätzliche Regressionen für **alle vier** Reisevarianten, echte geplante Uhrzeiten, kostenlose vs. fehlende Referenzpreise, keine automatisch eingefügten Ideen, Bildrechte/fehlende Bilder und sichere HTML-Behandlung.
- `test/portable-browser.mjs`: echte Leaflet-/Tagesplan-/Foto-Funktion und **geometrische** Desktop-/390px-Assertions; neue Screenshots `18-reference-day-map-desktop-1440.png`, `19-reference-day-map-mobile-390.png`.

## Verifikationsstand und Grenzen

**132/132 Node-Regressionstests + Chrome Desktop-/Tablet-/Smartphone-Browserfluss erfolgreich.** 
- Daten- und Lizenzfakten bleiben nur so präzise, wie die zugrunde liegenden Individualquellen.
- Belegter Kartenpunkt ≠ verifizierter Eingang; schematische Reisetrassen ≠ bestätigte 2027-Bahnfahrten.
- `€?` bleibt sichtbar, wenn ein belastbarer vergleichbarer Gruppen-/Einzelpreis fehlt. Das Bildfeld übernimmt keine fremden Hotelzimmerbilder.
- Die Four-Variant-Basis und die 57 individuellen Aktivitätsguides bleiben unangetastet. Kein neues Booking, kein automatischer Gruppenentscheid, keine geänderten Reiseausgaben.
- Ein vollständiger visueller 1:1-Nachbau der Referenzfotos ist **nicht** möglich, ohne unverifizierte Wetter-/Hotel-/Routendaten oder die fremden UI-Bilder zu kopieren. Die **visuelle Hierarchie und Interaktion** wurden hingegen konkret übernommen.

## Lokal starten

Den Branch `feature/v7-data-day-accommodation-rail` auschecken, `outputs/Reiseplaner/Start.cmd` unter Node.js 24 öffnen, dann `http://127.0.0.1:4173` aufrufen. **Karte** öffnen, einen Tag auswählen, in der linken Spalte Tagesstationen oder unverbindliche Rechercheideen ansehen und rechts die Karte benutzen. Unterhalb durch die Bildkarten scrollen; `Daten & Fristen` für fehlende Nachweise.

Alle Änderungen liegen nur im offenen Draft-PR #5. Kein Merge, kein produktives Deployment. Die Screenshots aus dem erfolgreichen Chrome-Lauf sind im GitHub-Actions-Artefakt `reiseplaner-ui-review` enthalten und werden als separate aktuelle Vorschau bereitgestellt.
