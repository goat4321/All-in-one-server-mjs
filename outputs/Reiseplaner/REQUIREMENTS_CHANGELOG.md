# Anforderungsänderungen

| Datum | Priorität | Anforderung | Module | Stand |
|---|---|---|---|---|
| 12.11.2026 | Kern | Master-Prompt V7 als Ausgangsspezifikation | Gesamtes Projekt | Abnahme in STATUS.md |
| 12.11.2026 | Kern | Nachgereichtes Rechercheverzeichnis als primäre Datenquelle bestätigen | Import und Herkunft | 22 Dateien per SHA-256 identisch mit dem bereits eingelesenen Archiv. Ein Quelldatensatz. |
| 12.11.2026 | Kritisch | GitHub-Checkout muss trotz bewusst fehlender privater Tripsy-Snapshots starten | Datenmodell, Backend, Herkunftsstatus | Implementiert und im Node-24-GitHub-Actions-Starttest bestanden; reduzierte Quellen explizit gekennzeichnet. |
| 12.11.2026 | Hoch | Koch-Mahlzeiten für mehrere Tage zu einem variantenbezogenen Gruppen-Warenkorb bündeln; keine doppelten Packungskosten | Verpflegung, Budget, Formulare, Persistenz | Implementiert; echte Chrome-Tests für zwei Tage, Preisänderung, Wiederladen und Mobile bestanden. |
| 12.11.2026 | Hoch | Bekannte/fehlende Kosten transparent nach Stadt und Datum gliedern, centgenaue Anteile und Pass-Tage je Variante vergleichen | Übersicht, Budget, Interrail | Implementiert; Unit- und Browserchecks bestanden. Keine 2027er Livepreise angenommen. |
| 12.11.2026 | Hoch | Reproduzierbare Regression im privaten GitHub-Branch | Qualität, CI | Implementiert: automatische Node-24-Syntax-, Modell-, Server- und Chromeprüfungen. Vollständige Original-Rohdaten-Abnahme weiterhin offen. |
