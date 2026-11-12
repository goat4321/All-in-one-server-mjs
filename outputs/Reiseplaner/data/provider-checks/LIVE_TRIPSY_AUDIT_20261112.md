# Read-only Tripsy Bestandsabgleich · 12.11.2026

**Art:** Einzelabfragen über die verbundene Tripsy-API. Keine Schreibzugriffe, keine Reservierungen. Das folgende Protokoll enthält nur Gesamtzahlen und technische IDs; keine privaten Buchungs- oder Kontaktdaten.

| Reise-ID (interne Referenz) | Aktivitäten | Unterkünfte | Transporte, live | Alte Budgetpositionen | Vergleich mit den bereinigten 35 Forschungs-Transporten |
|---|---:|---:|---:|---:|---|
| interrail_classic | 31 | 6 | 7 | 5 | 7/7 vorhandene Quell-IDs |
| interrail_swiss | 34 | 6 | 8 | 6 | 7/7 Quell-IDs; zusätzlicher Tripsy-Doppel-Eintrag `3890058` |
| interrail_august | 26 | 5 | 13 | 6 | 13/13 Quell-IDs |
| swiss_lakes | 12 | 4 | 8 | 12 | 8/8 Quell-IDs |
| **Summe** | **103** | **21** | **36** | **29** | **35 einzigartige bereinigte Transportreferenzen + 1 bereits dokumentierte Dublette** |

## Nachweise und Grenzen

- Die vier Tripsy-Originalreisen sind **lesend erreichbar**; Trip-IDs, Datumshorizont und Bestandszählung wurden geprüft.
- Die 35 Forschungs-Transportreferenzen sind in der aktuellen Tripsy-Transportliste vorhanden. `3890058` ist das bereits in `data/research-v02/data_quality.json` dokumentierte Duplicate der September-Schweiz-Alternative. Dieser Rohdatensatz wurde **nicht entfernt**, im bereinigten Reiseplan bleibt er nicht zusätzlich aktiv.
- Eine aktuelle Bestandszählung **ersetzt nicht** den vollständigen lokalen Snapshot-Vergleich und beweist weder die Richtigkeit jedes Quelltextes noch die 2027er Fahrplangültigkeit.
- Originale private `data/tripsy-*.json`-Dateien wurden nicht nach GitHub übertragen. Die bestehenden vollständigen Tests benötigen sie weiterhin auf dem ursprünglichen Rechner.
- Quelle: Tripsy-App-Connector, vier `list`-Operationen pro Reise (Aktivitäten, Unterkünfte, Transporte, Ausgaben), ausschließlich lesend; Erhebung 12.11.2026.
