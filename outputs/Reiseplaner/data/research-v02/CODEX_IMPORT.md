# Codex-Importvertrag – Top-20-Paket (Version v0.2, 12.11.2026)

Diese Dateien **als Referenzdaten in die bestehende Webanwendung importieren**, nicht als fertige App und nicht als Anweisung, Tripsy zu überschreiben. Zuerst `python validate_subset.py` ausführen und `data_quality.json` berücksichtigen. Keine stillschweigenden Änderungen an den vier originalen Reisevarianten.

## Datenintegration

1. Idempotent importieren (`source_system`, `external_trip_id`, `trip_id`, stabile Datensatz-IDs); Tripsy-Routen, Daten und vorhandene Auswahlpositionen erhalten.
2. `trips.json`, `destinations.json`, `transport.json`, `activities_comparison_catalog.json`, `accommodation_comparison_catalog.json` und `budgets.json` als Kernmodell verwenden. Die `comparison_catalog`-Dateien enthalten **auch die bisherigen Originaleinträge** – die kleineren Legacy-Dateien `activities.json` und `accommodations.json` sind deshalb bewusst nicht dabei. Keine Doppelimporte!
3. Das Umfrageprofil aus `group_preferences.json` gehört zur Drei-Personen-Interrailgruppe (Naol, K, C), **nicht automatisch** zur vierköpfigen Schweizreise. `group_activity_ranking.json` gehört über `activity_id` zu `activities_comparison_catalog.json`; Bewertungen 0 bedeuten geringe Präferenz, kein Verbot.
4. `accommodation_market_quotes.json` sind datums- und gruppengrößenspezifische, noch nicht final verifizierte Preis-Snapshots. Sie werden mit `accommodation_comparison_catalog.json` verknüpft, nicht als gebucht behandelt. Bei erneuter Suche neue Preisversion speichern, alten Suchpreis nicht überschreiben. Drei Betten, Netto-Checkout-Gesamtkosten, Steuern, Küche und Rückweg separat verifizieren.
5. `transport_research_queue.json` nur als Aufgabenliste zur künftigen Fahrplan-API-/Buchungssuche verwenden; `transport_comparison_candidates.json` beschreibt unbestätigte Alternativen, **keine** 2027er Live-Abfahrten. Die Originalstrecke `transport.json` darf nicht automatisch ersetzt werden.
6. `fares.json`, `sources.json` und `data_quality.json` werden referenziert, um **Preisquelle, Stand, Gültigkeit, Buchungsstatus und offene Punkte** in der UI zu zeigen.
7. `budget_scenarios.json` sind **Was-wäre-wenn-Rechnungen**. Kein Szenario oder nicht ausgewähltes Hotel als aktive Ausgabe verbuchen. Gemeinsame Rechnungen einmalig als Gesamtbetrag speichern, Split in ganzzahligen Eurocent; Interrail-Pass und Reservierungskosten separat. Fremdwährung mit dokumentiertem Kurs/Bezugsdatum.

## Produktverhalten für die Website

- Originalroute und benutzerseitig aktiv ausgewählte Aktivitäten/Hotels visuell trennen von ungeprüften Recherchealternativen.
- Priorisieren: Natur, Strände, Seen, Schwimmen, Aussichten, Wandern, aktive Erlebnisse; danach ausgewogene Einzelinteressen. In der Unterkunftssuche 30/50/60 EUR je Person/Nacht als unterschiedliche **persönliche** Zielwerte vergleichen, keine starre Gruppenobergrenze.
- Barcelona (03.–06.09.2027) eignet sich als Pilotstadt. Aktivitäten, Unterkunftssuche, Kartenansicht, Tagestimeline und Budget mit echten Tests verbinden.
- Voraussichtliche, geschätzte und noch nicht buchbare Einträge sichtbar markieren. `null` darf nicht zu 0 EUR / kostenlos / 0 Minuten werden.
- Beim Variantenswitch niemals Aktivitäten, Budget oder Hotels einer anderen Reisevariante ungewollt übernehmen.

## Tests

- `python validate_subset.py` muss ohne Fehler laufen.
- Appseitig testen: Variantentrennung, 3- versus 4-Personen-Gruppe, Auswahl/Abwahl von Alternativen ohne Doppeleintrag, gemeinsame Rechnung 100 EUR / 3 = 33,34 + 33,33 + 33,33, Nachtzug-Reisetag bei Umstieg nach Mitternacht, nicht bestätigte Fahrpläne, Status der Quellen und mobile UI.
- Dieses 20-Dateien-Archiv enthält bewusst **nicht** `validate_v2.py`, das auf den gesamten 78-Dateien-Satz zugeschnitten war, und auch keine einzelnen City-Package-Dateien. Der beigefügte `validate_subset.py` ist für genau diesen Teilbestand gedacht.