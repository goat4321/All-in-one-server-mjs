# Codex – sicherer Import und Anpassung an bestehende Website

Dieses Paket enthält genau 20 brandneu erstellte Dateien. Nicht die früheren v0.1/v0.2-Dateien übernehmen oder blind addieren.

## Verbindliche Schritte

1. Projekt-Repo/DB erst analysieren (`STATUS.md`, `DECISIONS.md`, aktuelles Schema). Keine vorhandenen Migrations-/Nutzerdaten überschreiben.
2. `python validate.py` ausführen. `SCHEMA.json` und `sources.json` als Vertrag lesen.
3. Vier Reisevarianten über `trips[].tripsy_id` referenzieren. Variante `ir-classic` und `ir-swiss` teilen nicht automatisch dieselben Änderungen. Die drei weiteren Personen in `swiss-week` sind nicht als K/C identifiziert; ihre Umfragewerte sind unbekannt.
4. Tabellen in separates `import_run`/`research_dataset` übernehmen. Dedupliziere nach externer ID, Datum/Belegung und `quote_date`; verwende `upsert`, nicht `append` bei erneutem Import. Originale Tripsy-Aktivitäts- und Transportdatensätze nicht überschreiben.
5. Datenstatus getrennt abbilden: `origin`, `verification_status`, `selected`, `booking_status`, `payment_status`, `price_kind`, `price_checked_at`. Null bleibt null. Keine fiktiven 0-Euro-Zugtickets.
6. Survey-Prioritäten zuerst in Vorschlagsranking übernehmen. Score fair gewichten (`70% Gruppenmittel + 30% schwächster Einzelwert`); ausdrückliche No-Gos nur nach echten Eingaben. Bei fehlenden Werten neutral/unsicher, NICHT Null.
7. Unterkunftsvergleich in Gesamtkosten für exakte Personen/Nächte, pro Person/Nacht, Küche privat/geteilt/unbekannt, Bahnhofs-/Tagesziel-Lage, Zimmerkonfiguration, Gebühren, Stornierung, Verfügbarkeit. Unbestätigte Felder sichtbar lassen. Kein automatisches „günstigste Unterkunft buchen“.
8. Karte: georeferenzierte Unterkunfts-Koordinaten vom Anbieter erlaubt (Präzisionskennzeichen beachten). Aktivitätskoordinaten `null` -> POI erst geocodieren, vor pin-Darstellung plausibilisieren. Reiseziele nur ungefähre Übersichtspunkte.
9. Transport: erst date-only anzeigen. 2027-Zugnummer, Zeiten, Anschluss-/Reservierungsdaten erst nach offizieller Veröffentlichung eintragen. Pass-, Reservierungs- und Einzelticket-Kosten getrennt. Nachtzugwechsel nach Mitternacht berücksichtigt.
10. Kostenszenarien werden nur angezeigt, NICHT in active budget eingefügt. Gemeinsame Gesamtausgabe einmal speichern, dann centgenau auf drei bzw. vier verteilen; keine CHF->EUR Umrechnung ohne Datumskurs.
11. Tagespläne sind Vorschläge (`proposal_not_active=true`), müssen im UI aktiv ausgewählt werden. Nicht bestehende Tripsy-Termine oder Buchungen verschieben.
12. Alle referenzierten IDs und die öffentlich sichtbaren Quellentexte bei Import testen; eindeutige Source-Links und UI-Prüfdatum anzeigen.

## Akzeptanztests

- Im wiederholten Import bleiben Objektzahlen stabil; keine doppelten Buchungen.
- Vier Varianten bleiben getrennt; drei Umfrageteilnehmer nur der Interrailgruppe zuordnen, Schweiz-Mitreisende außer Naol unbekannt.
- 100,00 EUR geteilt durch drei ist 33,34/33,33/33,33 und exakt 100,00 EUR.
- Unselektierte Aktivitäten/Hotels tauchen nicht im aktiven Budget auf.
- 2027-Fahrplan `null` bleibt leer, nicht zu einem beliebigen Beispielwert umgewandelt.
- Alte vs neue Angebotsstände ersetzen sich nicht stillschweigend; es bleibt ein Snapshot-Verlauf.
- Es werden keine Buchungen, Käufe oder Änderungen an originalen Tripsy-Reisen vorgenommen.