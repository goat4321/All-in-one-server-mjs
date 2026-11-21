# Phase 16 – Interaktiver Kartenatlas und echte Screenshot-Regression

**Datum:** 13.11.2026 · **GitHub:** Branch `feature/v7-data-day-accommodation-rail`, offener Draft-PR #5, nicht deployed.

## Beobachtungen und Umsetzung

1. **Karte + Ergebnisliste:** Ab einer ausreichend breiten Desktop-CSS-Ansicht steht Leaflet links und die separat scrollbar gefilterte Liste rechts. Bei Tablet-/Mobilbreite folgt die Liste wieder unter der Karte. Das Kartenrendering wird durch Listenscrollen nicht neu erzeugt.
2. **Auswahlabgleich:** Ein echter Klick auf einen farbigen Marker setzt `view.selected`, aktualisiert die kompakte Vorschau und hebt dieselbe Ortskarte hervor. Aus der Liste führt `Auf Karte` zum Marker; aus der Vorschau führt `In Liste` zum Eintrag und lädt notfalls weitere Ergebnisse. Alle vorhandenen Detail-/Quellenaktionen bleiben erhalten.
3. **Weniger Überlagerung:** Der redundant große Leaflet-Popup wurde aus dem Explorer entfernt. Die vollständigen Daten sind über `Details` verfügbar, nicht als riesiges Karten-Overlay. Die frühere zweite Detailansicht unter der Explorer-Karte entfällt, jedoch **nicht** in der Tagesplan-Karte.
4. **Merkliste:** Browserlokales, je Varianten-ID getrenntes Set (bis 120 IDs), `Merken`/`Merken entfernen`, `Merkliste (N)`-Filter und Stern-Hervorhebung. Kein serverseitiger Speicherzugriff, kein Budget-/Checkout-/Voting-Eingriff. Der Nutzer muss zum Gerätewechsel seine localStorage-Einträge separat übernehmen; es existiert hierfür noch keine Synchronisierung.
5. **Markupsicherheit:** Durch Screenshotvergleich erkannt: die äußere `map-wrap` war nicht vor der Legende geschlossen. Diese Struktur wurde korrigiert. Desktop-Overlay wird geometrisch vollständig im Leaflet-Container geprüft; auf Mobilgeräten erscheint der Karteikasten unter der Karte im Dokumentfluss, statt vom fixen Navigationselement verdeckt zu werden.

## Prüfinstrumente

- **Daten-/Node-Tests:** `test/map-shortlist.test.mjs`, `test/map-explorer.test.mjs` und alle übrigen `npm run test:portable`-Module; Browserlokalspeicher-Korruption, Mengenbegrenzung, Reisedaten-Isolation, geografische Einschränkungen und unveränderte Buchungsdaten.
- **Chrome-Ablauf:** `test/portable-browser.mjs`: Klick auf einen real gerenderten Leaflet-Marker, Karte↔Liste-Synchronisierung, sichtbare Preview, keine Doppel-Popups und korrekt geschlossene Kartenstruktur, Merkliste mit Filter, responsive Karten und mobile Dock-Interaktion.
- **Screenshots:** `.github/workflows/reiseplaner-ci.yml` speichert über `REISEPLAN_SCREENSHOT_DIR` sechs PNGs als GitHub Actions-Artifakt `reiseplaner-ui-review` für 14 Tage. Nach Abschluss eines Branch-Laufs: Actions → Reiseplaner · Branch-Qualitätsprüfung → erfolgreicher Lauf → Artifacts.

### Screenshot-Dateien

1. `01-uebersicht-desktop.png` – Startseite und Aufgaben-Schnellzugriffe, 1280 px
2. `02-atlas-desktop-map-list.png` – geteilter Atlas und geclusterte Marker, 1440 px
3. `03-atlas-ausgewaehlter-ort.png` – ausgewählter Ortsmarker mit kompakter Karte und markierter Listenzeile, 1440 px
4. `04-atlas-smartphone-390.png` – Mobilnavigation und globale Karte, 390 px
5. `05-atlas-tablet-820.png` – einspaltiger Atlas bei 820 px
6. `06-atlas-smartphone-auswahl-390.png` – mobile Ortsauswahl im Dokumentfluss, 390 px

## Grenzen

Die Screenshots basieren auf einem **isolierten Test-Seed** und einer **Offline-Kartenansicht ohne echte OSM-Kacheln**. Sie belegen HTML/CSS-Rendering unter Chrome-Emulation, **keinen** mehrstündigen Lasttest, Browserkompatibilität auf realen iOS-/Android-Geräten, reale Internetkarten-Performance oder fertige 2027-Buchungsdaten. Offene unabhängige Gebäude-/Adressprüfungen, Unterkunfts-Checkouts, lizenzierte Bilder für alle Datensätze und verbindliche Zugkontingente bleiben unverändert.
