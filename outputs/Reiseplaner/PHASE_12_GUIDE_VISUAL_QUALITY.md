# Phase 12 – Geführte Bedienung, visuelle Datenqualität und nachweisbare Funktionstests
**Stand: 13. November 2026 · Entwicklungsbranch, nicht deployed**

## Ausgangspunkt
Die v1.1-Implementierung hatte bereits Detailprofile, Karten-Popups, ein einzelnes quellengebundenes Bildfeld, Nachtbudget und Vierer-Unterkunftsvergleich sowie lokale Stimmen je Reisevariante. Diese Funktionen wurden nicht dupliziert. V1.2 konzentriert sich auf Bedienbarkeit, Szenarien, explizite Unsicherheitskennzeichnung, Bildgalerien und Regressionstests.

## Erledigte Arbeit in Reihenfolge
1. **Tour (Commit cb4dd9ee):** 7 Module, Schrittwechsel, Fortschritt, Esc/Tab-Fokus und mobile Darstellung. Kein Speichern außer optischer lokaler Kennzeichnung des absolvierten Tutorials; keine Planänderung. Modeltests plus Chrome-End-to-End.
2. **Kosten & Korrekturen (54420865, Testkorrektur f278ca32):** Tagesbudget-Simulator mit getrennten Zusatzannahmen und centgenauer Kostenaufteilung auf Hotelnächte; sichere Küchen-Textfilterung; Budgetsättigungsanzeige mit Prozenttext; Vergleich leeren; mehr als 15 Gruppenoptionen. Ausdrücklich kein automatischer Kauf oder Eintrag in Gruppenkasse.
3. **Galerie (325fd2ad):** Bis fünf selbst hinterlegte Bilder, je Bild individualisierte Lizenz-/Urheber-/Quellenpflicht, historische Einzelfoto-Kompatibilität, Entfernen einzelner Bilder. Zwei weitere klar benannte Commons-Fotos: Rialtobrücke Venedig und Oeschinensee Kandersteg, jeweils CC BY-SA 4.0 und Namensnennung. Keine Providerbilder, kein Ableiten von Privatadressen aus Bildern.
4. **Smart Filter (89fae7df):** streng datenbasierte Hostel-/Hotel-Filter (eingetragene Küche, berechnete Gehzeit, eigene gruppengrößengleiche Bettenprüfung, Preisreferenzen) sowie Aktivitäten nach Wasser-/Schwimmhinweisen, 0-€-Referenz und mindestens zwei Gruppenvoten ab 4/5. "Erwähnt" bedeutet keine Garantie.
5. **Readiness (41730270):** fünf separat verständliche Fortschrittszahlen (Aufenthalte, selbst dokumentierte Unterkunfts- und Zugprüfung, bezifferte Plankosten, eigene Fristen) auf Daten & Fristen, ohne Schein-Gesamtzertifizierung.

## Testnachweise
- **cb4dd9ee:** [GitHub Actions #43470916824](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43470916824) – vollständiger offizieller Reiseplaner-Workflow erfolgreich.
- **f278ca32:** [GitHub Actions #43471855236](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43471855236) – erfolgreich, inkl. präzisem Centtest.
- **325fd2ad:** [GitHub Actions #43473363934](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43473363934) – erfolgreich, Galerie-/Lizenzvalidierung.
- **89fae7df:** [GitHub Actions #43473755863](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43473755863) – erfolgreich, Smart Filter.
- **41730270:** [GitHub Actions #43474139218](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43474139218) – erfolgreich, inklusive Reise-Fortschritt.

Die Kern-Workflow-Jobs prüfen `node --check`, die 16 Research-v0.2-Datensätze, portable Tests (einschließlich neuer v1.2-Testdateien), Karten-Coverage, realen Chrome-Funktionsablauf und serverseitigen HTTP-Smoke. Andere ältere Georecherche-Workflows zeigen teils unabhängig davon erfolglose Starts und sind gesondert zu prüfen, nicht als bestanden zu melden.

## Was bleibt offen?
- Pro Objekt vollständige, urheberrechtlich verwendbare Fotos und Detailpreise. Das Foto-Eingabefeld validiert HTTPS, Urheber/Lizenztext und Quelle; es kann **nicht** durch Code feststellen, ob eine fremde Rechtekette inhaltlich korrekt ist. Auch Bild-URLs können später ausfallen.
- Bestätigter Checkout für alle Reiseteilnehmer inkl. Steuern, Gebühren, Stornokonditionen und Zimmerauswahl fehlt bei vielen Angeboten; die 42 Airbnb-Wunschlisten-Suchwerte sind keine Checkoutpreise.
- Private Airbnb-Adressen werden nicht recherchiert oder geraten. 642 variantengebundene Kartenobjekte, davon 413 mit Quellen-/Gebietsposition und 229 ohne eindeutigen individuellen Pin.
- Echte Zugverfügbarkeit, Reservierungen, Fahrscheine, ÖPNV-Verbindungen 2027 und Öffnungszeiten können erst in den relevanten Betreiberfenstern bestätigt werden. Historische 2026er Daten bleiben als Beispiele markiert.
- Gruppenwertung ist nur lokal und variantenspezifisch; kein Live-Sync für drei Smartphones. Ein Hosting verlangt zusätzliche Authentifizierung, Datenschutz-, Backup- und Sicherheitsprüfung.
- Die neuen Funktionen wurden automatisiert getestet; eine vollständige manuelle Abnahme sämtlicher Hunderten Ortsdatensätze sowie reale Bedienung auf mehreren physischen Geräten ist dadurch nicht ersetzt.

## Öffnen
**GitHub:** PR [#5](https://github.com/goat4321/All-in-one-server-mjs/pull/5) → Branch `feature/v7-data-day-accommodation-rail` → Code → Download ZIP → entpacken → `outputs/Reiseplaner/Start.cmd` (Windows, Node.js 24) → `http://127.0.0.1:4173` im Browser. Alternativ im Ordner `node server.mjs`. Private Datenbank `private/reiseplan.sqlite` vor Versionswechsel sichern. Nicht nach main gemergt und nicht öffentlich bereitgestellt.
