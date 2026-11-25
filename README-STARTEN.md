# Reiseplaner aus GitHub-ZIP starten (Windows)

Der Reiseplaner ist eine **lokale Node.js-Anwendung mit SQLite**. Eine `index.html` aus dem ZIP direkt zu öffnen, startet **keinen** Server und kann daher nicht funktionieren.

## In fünf Schritten

1. Auf GitHub im Branch-Auswahlmenü **`feature/v7-data-day-accommodation-rail`** wählen. Der Branch `main` enthält noch nicht die zusammengeführten V7-Änderungen.
2. **Code → Download ZIP**, anschließend im Windows-Explorer **Alle extrahieren**. Nicht direkt innerhalb der ZIP starten.
3. [Node.js 24 oder neuer](https://nodejs.org/en/download) installieren (anschließend ein neues Konsolen-/Explorerfenster öffnen).
4. Im **Hauptordner** der entpackten ZIP auf **`Start-Reiseplaner.cmd`** doppelklicken. Alternativ: `outputs\Reiseplaner\Start.cmd`.
5. Die Website öffnet sich auf Windows automatisch; sonst **http://127.0.0.1:4173** öffnen. Das Konsolenfenster muss offen bleiben.

Es ist **kein** `npm install` nötig: Die Anwendung verwendet eingebaute Node-Funktionen und lokal gespeicherte Frontend-Dateien.

## Falls es nicht funktioniert

- **`node` nicht gefunden / alte Version:** `node --version` in einem **neuen** Terminal prüfen. Es muss mindestens `v24.x` erscheinen.
- **Port 4173 belegt (`EADDRINUSE`):** Bereits gestartetes Reiseplaner-Fenster prüfen und die vorhandene Seite öffnen. Alternativ in einer Konsole im Ordner `outputs\Reiseplaner` mit `set REISEPLAN_PORT=4174` und anschließend `node server.mjs --open` starten. Dann **http://127.0.0.1:4174** verwenden.
- **Website nicht erreichbar:** Im geöffneten schwarzen Startfenster die tatsächliche Fehlermeldung lesen. Startfenster nicht schließen. Antivirus-/Windows-SmartScreen-Warnung nicht blind umgehen; bei Unsicherheit Inhalt der `.cmd`-Datei prüfen.
- **Alte Version im ZIP:** Prüfen, ob bei GitHub wirklich der V7-Branch ausgewählt wurde. Der Download des Branches `main` ist derzeit kein aktueller Gesamtstand.
- **Reisedaten fehlen:** Die vier privaten Tripsy-Rohkopien sind bewusst nicht in GitHub. Die Anwendung verwendet gekennzeichnete Seed-Daten. Frühere persönliche SQLite-Daten aus einem anderen Projektordner werden nicht automatisch importiert.
- **Nicht die falsche Datei starten:** Nur `Start-Reiseplaner.cmd` bzw. `Start.cmd`, keine HTML- oder JavaScript-Datei aus dem ZIP.

## Ohne GitHub-Actions-Kontingent prüfen

- `Pruefen-Reiseplaner.cmd` aus dem Hauptordner aufrufen.
- Der portable Teil führt Modelltests, einen Kartenbericht sowie einen **echten lokalen HTTP-Starttest ohne Internet und ohne private Tripsy-Rohdateien** aus.
- Die vollständige alte Testreihe benötigt zusätzlich die vier privaten `data/tripsy-*.json`. Fehlen sie, meldet das Skript ausdrücklich **Teilprüfung**, nicht grünes Gesamtergebnis.
- Die realen Browser-, Referenzbild-, 2027-Bahn- und Buchungsdatenprüfungen bleiben davon getrennt.

**Nicht automatisch ausgeführt:** Merges nach `main`, Deployments, externe Reservierungen und Änderungen an Tripsy.

## Daten bei einem neuen ZIP behalten

Die lokale SQLite-Datenbank liegt standardmäßig unter `outputs/Reiseplaner/private/reiseplan.sqlite` **im jeweils entpackten Ordner**. Ein neuer ZIP-Ordner übernimmt diesen Datenstand nicht automatisch. Deshalb vor einem Ordnerwechsel:

1. Den laufenden Server beenden und im **alten** entpackten ZIP-Hauptordner `Daten-sichern.cmd` doppelklicken.
2. Die Sicherung wird (nach erfolgreicher Prüfung) unter `%USERPROFILE%\\Documents\\Reiseplaner-Backups` mit Zeitstempel gespeichert. Sie kann persönliche Reiseinformationen enthalten und darf nicht veröffentlicht werden.
3. Für eine spätere manuelle Wiederherstellung den **neuen** Server vorher beenden, dessen eventuell vorhandene Datenbank gesondert sichern und die gewünschte `.sqlite` nach `outputs/Reiseplaner/private/reiseplan.sqlite` kopieren. **Nicht bei laufendem Server kopieren.**
4. Falls `reiseplan.sqlite-wal` oder `reiseplan.sqlite-shm` existiert, gibt das Sicherungsskript eine Warnung aus und kopiert nichts. Die Speicherung ist dann möglicherweise noch aktiv bzw. nicht sauber abgeschlossen.

Die Browser-Merkliste und bestimmte UI-Einstellungen liegen in `localStorage` und sind **nicht Teil dieses SQLite-Backups**. Bei demselben Browser und derselben lokalen Webadresse bleiben sie normalerweise getrennt vom ZIP-Verzeichnis gespeichert. Keine Synchronisierung zwischen Browsern oder Geräten wird behauptet.
