# Datenwörterbuch und Fremdschlüssel

## Entitäten (JSON-Dateien)

`trips`: `id` stabil intern, `external_trip_id` Tripsy-ID, `travellers` 3 oder 4, `ordered_destination_ids`, `start_date`, `end_date`.

`destinations`: `id` als Join-Schlüssel; Geokoordinaten sind aus Tripsy/Hauptbahnhof **ungefähre Anker**, nicht genaue Hotel- oder Wegeverläufe.

`activities_comparison_catalog`: `id`, `trip_id`, `destination_id`, `name`, `tags`, `source_ids`, `is_selected`; neue Optionen unselektiert. Das Feld `opening_hours_on_trip_date` ist nicht automatisch bestätigt.

`group_activity_ranking`: `activity_id`, `group_score_0_100`, `individual_scores_0_5`, `matched_topics`, `interest_match_confidence`. Ein Score ist eine **heuristische Präferenz** und keine objektive Qualitätsnote.

`accommodation_market_quotes`: `id`, `source_record_id`, `source_id`, `destination_id`, `trip_ids_applicable`, `guests_adults`, `search_rooms`, `nights`, `check_in_date`, `check_out_date`, `group_stay_total_cents`, `booking_url`, `observed_on`, `is_selected=false`; andere Eigenschaften null/false, wenn nicht geprüft.

`budget_scenarios`: für vollständiges Szenario `lodging_group_cents + sum(other_costs_group_cents) = grand_total_group_cents_without_pass`; pro Kopf auf Anzeige runden, für die **Bezahlung** Rest-Cents idempotent verteilen.

`transport_research_queue`: `original_segment_id` auf `transport.id`, `reference_time_from_tripsy` ist **nur Planzeit**, `timetable_2027_confirmed=false`.

`transport_comparison_candidates`: unbestätigte Routing-**Hypothese**, Fahrplan-/Ticketpreisfelder bewusst null.

`sources`: `id` Fremdschlüssel für `source_ids` und `source_id`, `url` kann für nutzereigene Quellen null sein, `accessed_on`, `validity`, `check_method`.

`data_quality`: `severity`, `domain`, `source_ids`, `action` als Ticket-/Prüfaufgabe; `resolved` separat.

`group_preferences`: `travellers[].alias`, `scores`, `answers`, `free_text` (null = unbeantwortet), `group_priorities`.

## CSV

Delimiter ist `;`, Textencoding UTF-8-BOM, Kommazahlen als Punkt gemäß JSON, Arrays/Objekte JSON-kodiert; CSV ist für Analyse/Import, JSON ist **kanonisch**.

## Datenschutz

Drei Alias-Namen; keine E-Mail, keine Reservierungsnummer oder andere Zugangsdaten im Paket. Nicht öffentlich deployen ohne Authentifizierung.