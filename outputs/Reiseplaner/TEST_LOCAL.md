# Gesamtabnahme auf dem bisherigen Windows-Rechner

**Warum lokal?** Die 4 ursprünglichen Tripsy-Rohdateien bleiben absichtlich aus GitHub ausgeschlossen. Aus dem verbundenen Tripsy-Zugang wurden hier die **Bestandszahlen** und Originalzug-IDs lesend geprüft, aber es wurde keine private Rohkopie für GitHub erstellt. Die vollständige alte Core-/Browser-Suite greift auf diese Dateien zu.

## Ein-Klick-Prüfung

1. In VS Code oder GitHub Desktop den aktuellen Entwicklungsbranch `feature/v7-data-day-accommodation-rail` (vorher lokale Git-Änderungen sichern und HEAD abgleichen; siehe `../../PROJECT_HANDOFF_CHAT.md`) im Projektordner verwenden. Den alten Projektordner vorher sichern, damit lokale SQLite-Reisen nicht überschrieben werden.
2. Stelle sicher, dass **Node.js 24** sowie Chrome oder Edge installiert sind.
3. Die vier Originaldateien aus dem bisherigen lokalen Projekt nach `data/` kopieren:
   - `tripsy-1297194.json`
   - `tripsy-1312180.json`
   - `tripsy-1275516.json`
   - `tripsy-1273324.json`
4. **`Pruefen.cmd` doppelklicken**. Es prüft automatisch zuerst `npm run test:portable`, danach bei vorhandenen Rohkopien `npm test` und `npm run test:browser`. Fehlende Rohdateien sind ein **Teilabnahmestatus** (Exitcode 2), kein bestandenes Gesamtsystem. Ein defekter Test führt zu Exitcode 1. Alles bestanden ergibt Exitcode 0.
5. Prüfe Browser, mobile Ansicht, Karte, Variantenwechsel, budgetierte Optionen und das Anbieter-Checklistenformular. `Pruefen.cmd` nutzt keine automatische externe Buchung. Private Rohdateien niemals nach GitHub pushen.

## Manuelle externe Prüfungen bleiben erforderlich

- 2027er Zugfahrpläne, Interrail-Reservierungskontingente, Preis und echte Verkaufsverfügbarkeit bei SNCF/DB/Interrail.
- Der **vollständige Hotel-Checkout** mit Zimmerkategorie, drei Einzelbetten bzw. zugesagten Schlafplätzen, Steuern, Storno und letzter Verbindung zur Unterkunft.
- September-2027-Nahverkehrstarife und GTFS-Fahrten (Barcelona lokaler Datenstand endet 18.06.2027). App zeigt nur belegte Fußwege oder historische Netzebenen.
- Wetter, Wege, Gondelbetrieb und ggf. Mietwagenberechtigung bei Schweizer Wander-/Seenvarianten.

Wenn alle Tests erfolgreich sind, bedeutet das: **Die lokale Software funktioniert unter den getesteten Bedingungen.** Es bedeutet weder gebuchte Reise noch extern bestätigte 2027er Angebote.
