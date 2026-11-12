# Reiseplaner – TOP 20 Dateien für Codex (12.11.2026)

Dieses kuratierte 20-Dateien-Paket ist die **kompakte Codex-Grundlage** aus dem größeren 78-Dateien-Forschungspaket. Es enthält die wesentlichen JSON-Datensätze für vier unveränderte Tripsy-Varianten, das Gruppenprofil mit drei Umfrageteilnehmern, Aktivitäten, Unterkunftsoptionen und datumsbezogene 2027-Suchergebnisse, Zug-Planungsabschnitte, Preise, Budgets, Quellen und Datenqualitätsbefunde.

**So starten:** `CODEX_IMPORT.md` lesen, danach `python validate_subset.py` ausführen. `DATA_DICTIONARY.md` ist die Feldhilfe. Die vorhandenen Daten als zusätzliche, nicht destruktive Datenquelle importieren. `trips.json` enthält vier Reisen; `swiss_lakes` ist eine separate Reise mit vier Personen und darf nicht als Drei-Personen-Umfragegruppe modelliert werden.

## Die 20 Dateien

| Datei | Zweck |
|---|---|
| `README.md` | Anleitung, Geltungsbereich |
| `CODEX_IMPORT.md` | Import-, UI- und Integrationsvorgaben |
| `DATA_DICTIONARY.md` | Datenfelder und Begriffe |
| `trips.json` | Identitäten, Reisevarianten, Reisedaten |
| `destinations.json` | Orte, Koordinaten, Zeitzonen |
| `group_preferences.json` | Vollständiges Gruppenprofil und Budgetpräferenzen |
| `activities_comparison_catalog.json` | Alle 115 Aktivitäten, inklusive vorhandener und neuer Optionen |
| `group_activity_ranking.json` | Bewertungslogik aller Aktivitäten je Person und Gruppe |
| `accommodation_comparison_catalog.json` | 118 alte und neue Unterkunftskandidaten zum Vergleichen |
| `accommodation_market_quotes.json` | 92 Preis-Snapshots, Daten, Links, Belegungs-/Gebührenlücken |
| `transport.json` | 35 ursprüngliche Transportabschnitte |
| `transport_research_queue.json` | Offene Verbindungs- und Tarifabfragen je Abschnitt |
| `transport_comparison_candidates.json` | Unbestätigte Bahn-Alternativen |
| `fares.json` | 35 Tarif-/Eintrittsreferenzen mit Preisen und Gültigkeit |
| `budgets.json` | Ursprüngliche Budgetmodelle, nach Gruppen getrennt |
| `budget_scenarios.json` | Nur hypothetische Rechenszenarien |
| `sources.json` | 65 Herkunfts-/Quellennachweise |
| `data_quality.json` | 32 dokumentierte offene Datenprobleme |
| `import_rules.json` | Statusachsen, Regeln, Geldlogik, Idempotenz |
| `validate_subset.py` | Offline-Datenprüfskript für diese 20 Dateien |

## Wichtige Grenzen

- Alle 2027er Tripsy-Zugfahrpläne sind **Planwerte**, keine bestätigten buchbaren Verbindungen.
- Booking.com-Daten sind **Suchpreis-Snapshots vom 12.11.2026**, keine bestätigten Zimmerkonfigurationen, Checkoutpreise oder Buchungen.
- 2026er Tarifreferenzen nicht als 2027er Preisgarantie behandeln.
- Neue Unterkünfte/Aktivitäten bleiben **ungebuchte, nicht ausgewählte Optionen**; nur explizite Benutzerentscheidungen ändern die aktive Reise.
- Budget-Szenarien und ursprüngliche Gesamtbudgetposten nicht addieren: sie sind Alternativrechnungen.
- Die größeren, weggelassenen Stadtpakete, CSV-Doppeldateien und Generatorskripte sind für den ersten Codex-Import nicht erforderlich.