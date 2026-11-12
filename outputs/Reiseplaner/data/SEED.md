# Reiseplaner — Codex Seed-Daten v0.1 (09.11.2026)

**Ziel:** Bereinigter, nicht-destruktiver Start-Datensatz für die im Master-Prompt V5 beschriebene Reiseplanungswebsite. Keine Website und keine Buchung. Vier Tripsy-Testreisen gelesen; die importierten Originaldaten in Tripsy wurden **nicht verändert**.

## Inhalt

- `trips.json`: vier eigenständige Tripsy-Reisevarianten (inkl. Schweizreise, 4 Personen)
- `destinations.json`: Reiseorte mit Zeitzonen, Tags und ungefährer Kartenlage
- `transport.json`: vorläufige Reiseabschnitte (kein bestätigter 2027er Fahrplan)
- `accommodations.json`: alte Unterkunftsindikatoren + neu recherchierte, **nicht ausgewählte** Vergleichsobjekte. Kein aktueller 2027-Endpreis nach Buchungsschritten.
- `activities.json`: vorhandene Aktivitäten + zusätzliche Vorschläge mit Profil-Tags
- `fares.json`: veröffentlichte Tarife mit Quell- und Gültigkeitsstatus
- `budgets.json`: Tripsy-Budgets mit separatem Interrail-Pass-Szenario; Gesamtbeträge pro Reise, nicht pro Hotel multiplizieren
- `sources.json`: offizielle Quelllinks, Abrufdatum, Gültigkeitsfeld
- `data_quality.json`: Qualitätsbefunde, kritische Unbekannte, notwendige Folgeprüfungen
- `*.csv`: CSV-Abbilder für Tabellenimport; UTF-8 mit BOM und `;`-Delimiter
- `validate.py`: maschinelle Integritätsprüfung, Budgetprüfung, Duplicate-/referential checks

## Priorität für Codex

1. Originalvarianten als **separate** Reisen importieren, Tripsy nicht überschreiben.
2. Barcelona als erste Pilotstadt: Bird House / St Christopher als ungebuchte Optionen, Unter-30 Sagrada Família, Park Güell, Strände, Beachvolleyball, einmal Club als optionalen Tagespunkt.
3. Preise mit `reference_year`, `price_scope`, `verification_status` sichtbar kennzeichnen; bei nicht verifizierten 2027 Angeboten `live_quote_total=null`.
4. Nur explizit ausgewählte Optionen im aktiven Budget und Reiseablauf berücksichtigen.
5. Vor Zugbuchung 2027er Fahrpläne und Reservierungen neu abrufen; Übernachtungs-/Stornierungsbedingungen sowie exakte Schlafplatzkonfiguration ergänzen.

**Nicht enthalten:** 100+ live bestätigte Hotelangebote; tagesgenaue Verfügbarkeiten; vollständige Hotel-Vertragsbedingungen; echtzeitfähige Bahnangebote für September 2027; echte Geh-/ÖPNV-Routenminuten; Ticketkäufe. Diese Informationen sind weder recherchierbar für alle Angebote noch verifiziert. Die CSVs sind Ausschnitte strukturierter Quellinformationen, keine API.

Der in Tripsy hinterlegte CHF→EUR-Kurs 1.06 ist eine alte Budgetannahme, **kein aktueller Wechselkurs**.
