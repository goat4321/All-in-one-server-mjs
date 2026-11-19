# Einzelprüfung und Integration aller 20 Research-v0.2-Dateien

Stand: 12.11.2026. **Quelle:** neu hochgeladenes kuratiertes 20-Dateien-Paket. Dieses Verzeichnis ist ein separates Referenzarchiv; vorhandene Tripsy-Daten, lokale Varianten und frühere Recherchen bleiben bestehen.

## Datei-für-Datei-Abgleich

| Nr. | Datei | Dokumentierter Inhalt | Umsetzung in der laufenden Website |
|---:|---|---|---|
| 1 | `README.md` | Geltungsbereich und 20-Dateien-Liste | Zusammen mit dem unveränderten Quellenpaket archiviert; dieser Audit verlinkt die Integration. |
| 2 | `CODEX_IMPORT.md` | Importvertrag, Scoping, Benutzer- und Sicherheitsregeln | Stabile IDs, neue Alternativen unselektiert, 2027-Fahrplanstatus, Drei-/Vier-Personen-Isolation und Preissnapshots im Node-Modul durchgesetzt. |
| 3 | `DATA_DICTIONARY.md` | Entitäten, Join-Keys, Statusachsen, Geldfelder | `lib/research-v02.mjs` validiert IDs, 2027er Suchpreise, Referenzen und Trennungen. |
| 4 | `trips.json` | 4 Originalreisen (3/3/3/4 Personen) | Mit bestehenden `data/trips.json` IDs, externe IDs, Routen, Daten und Gruppengrößen geprüft; **niemals überschrieben**. |
| 5 | `destinations.json` | 21 Orte/Zeitzonen, ungefähre Anker | Bestehende Städtenamen/Zeitzonen genutzt; Stadt-Anker werden nicht als genaue Unterkunfts-Pins ausgegeben. |
| 6 | `group_preferences.json` | Drei Personen, individuelle Interessen und 60/50/30-€-Zielwerte | **Reisegruppe** zeigt die echte Umfrage für 3er-Interrailreisen; Vierer-Schweizreise bleibt ausdrücklich unabhängig. |
| 7 | `activities_comparison_catalog.json` | 115 Aktivitäten, darunter 73 Legacy-Zeilen und 42 neue Ideen | 73 Bestands-IDs einmalig angereichert; 42 neue, **nicht aktivierte** Quellenalternativen in die zugelassenen Reiseorte eingebunden. |
| 8 | `group_activity_ranking.json` | 115 heuristische Scores, individuelle 0–5-Bewertungen | **Entdecken** zeigt die Interessenswerte und Sortierung nach Gruppenscore für die drei Reisenden; 0 ist keine Ausschlussregel. |
| 9 | `accommodation_comparison_catalog.json` | 118 Bestands-/Suchkandidaten (26 Alt + 92 neue) | Neue Kandidaten mit dem Snapshot nach stabiler Unterkunfts-ID verknüpft; bestehende Unterkunftsauswahl nicht verändert. |
| 10 | `accommodation_market_quotes.json` | 92 Unterkunftssuchpreis-Snapshots, 12.11.2026 | **Unterkünfte** zeigt nur passende Reisedaten und Gruppenstärken: Klassik 60, Schweiz-Interrail 40, August 0, Schweizer Seenreise 32; keine Verfügbarkeitsgarantie. |
| 11 | `transport.json` | 35 Originalabschnitte, Zeiten 2027 unbestätigt | Identische Altbestand-Abschnitte geprüft; bestehende Zugfolge wird nicht durch Alternativen ersetzt. |
| 12 | `transport_research_queue.json` | 35 abschnittsbezogene Rechercheaufgaben | **Bahn & Interrail** zeigt pro Reise offenen Fahrplanstatus, Ticketpreis-Lücken, erforderliche Prüfungen und Anbieterlinks. |
| 13 | `transport_comparison_candidates.json` | 13 alternative, noch nicht geprüfte Routing-Hypothesen | **Bahn & Interrail** zeigt sie getrennt vom aktiven Tagesplan und kennzeichnet nicht verfügbare Zeiten/Preise. |
| 14 | `fares.json` | 35 Tarife/Eintrittspreise und 2026-Referenzen | Tarifreferenzen im aktiven Katalog aktualisiert; 2026er Beträge bleiben ausdrücklich ohne 2027-Garantie. |
| 15 | `budgets.json` | 4 ursprüngliche, ungebuchte Budgetmodelle | Mit alten Referenzmodellen identisch; nicht als bezahlte Positionen importiert. |
| 16 | `budget_scenarios.json` | 3 reine Vergleichsrechnungen | **Budget** zeigt zwei gesamte Klassik-Varianten und ein vierköpfiges **Schweiz-Unterkunftsszenario ohne Gesamtpreis**. Kein Szenario wird aktiv. |
| 17 | `sources.json` | 65 Herkunftsdatensätze und Links | Neueste Quellen mit vorhandenem Quellensystem zusammengeführt; Anbieterlinks nur bei echten URLs, nicht aus Namen generiert. |
| 18 | `data_quality.json` | 32 Dokumentationen, darunter 3 kritische Befunde | **Daten & Fristen** listet die offenen, zur jeweiligen Reise gehörenden Befunde mit Schwere, Handlung und Beleglink. |
| 19 | `import_rules.json` | Version, Verifikations-, Buchungs-/Zahlungs- und Altersregeln | Mit Node validiert und als Version `0.2.0` gekennzeichnet; Suchpreis, Planannahme, Buchung und Zahlung strikt getrennt. |
| 20 | `validate_subset.py` | Reproduzierbarer Import- und Fremdschlüsseltest | Automatisch mit Python 3 in GitHub Actions ausgeführt; 16 JSON-Quellen konsistent. |

## Datenkonflikte und bewusst nicht vorgenommene Annahmen

1. **Vier unabhängig gespeicherte Routen**: Die ursprüngliche Septemberklassik, September-Schweiz-Alternative, August-Testreise und vierköpfige Schweizer Seenreise werden weder umsortiert noch zusammengeführt. Die lokale SQLite-Datenbank behält bereits gewählte Einträge und Budgets.
2. **2027er Reisekosten:** `accommodation_market_quotes` sind Suchpreis-Snapshots für konkrete Anreise-/Abreisetage und bekannte Gruppengröße. Ein Ergebnis ohne bestätigte Zimmeraufteilung, Steuern, Betten, Stornobedingungen und finalen Checkout wird nie als „gebucht“ angezeigt. Bei der Augustreise werden Septemberpreise **nicht** automatisch angezeigt.
3. **Originale Tripsy-Rohkopien:** Die separaten Dateien `data/tripsy-*.json` bleiben privat und git-ignoriert. Bei fehlenden Rohdateien zeigt die App weiterhin einen deutlich gekennzeichneten reduzierten Forschungs-Fallback.
4. **Bahn:** Die 35 Recherchetickets sind keine bestätigten Fahrplanabfragen. Die 13 Alternativen sind keine 2027er Liveabfahrten, können nicht direkt als verifizierte Route übernommen werden und erzeugen keine Ausgaben.
5. **Aktivitätenscores:** Der Gruppen-Score ist ein heurstisches Interessenmaß, kein Qualitätsurteil und keine Echtzeit-Veranstaltungsverfügbarkeit. Fehlende Koordinaten bleiben offen; vorhandene separat belegte Stadt-/Standortpunkte dürfen erhalten bleiben.
6. **Szenario-Budget:** Nur vollständig bezifferte Szenarien tragen einen Gesamtpreis. Bei Schweizer Seen ist allein die Unterkunftssumme bekannt; Automiete, Tickets und weitere Reiseausgaben bleiben offen.
7. **Cent-Verteilung:** Aktive Kosten verwenden weiterhin ganzzahlige EUR-Cent und die persönliche Budgetaufteilung. Das ungebuchte Forschungsarchiv fügt ohne Benutzerentscheidung keinen Posten hinzu.

## Testnachweise und offene Abnahme

- `python3 data/research-v02/validate_subset.py`: **bestanden** (16 JSON, 4 Reisen, 115 Aktivitäten, 92 Suchpreisdatensätze, 35 Transportabschnitte).
- `npm run test:portable`: **18/18** automatisierte Modelltests bestanden (inklusive 6 Integrations-/Scopeszenarien für v0.2, Centverteilung, Varianten- und Quellenabgleich).
- `node test/portable-browser.mjs`: echter Chrome-Browser testet Interesse, Hotel-Suchpreise, Filter/Sortierung, Bahnaufgaben, Szenarien, kritische Datenhinweise, optionales Hotel-Planen, Budget, variantenspezifisches Speichern, vierköpfiges Schweizprofil, Mobilkarte.
- `/api/bootstrap`: Start mit **vier** unabhängigen Reisen und eingeschränktem Fallback im CI geprüft.
- **Noch offen:** Vollständige historische Codex-Kern-/Browser-Suiten mit den lokal vorhandenen privaten Tripsy-Snapshots und aktuelle, tatsächlich buchbare ÖPNV-, Bahn- und Unterkunftsangebote 2027.

Die Veröffentlichung der Recherche oder die Buchung von Transport/Hotels erfolgt nicht automatisch.
