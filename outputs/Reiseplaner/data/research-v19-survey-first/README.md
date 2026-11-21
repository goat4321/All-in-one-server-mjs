# Reiseplaner – komplett neu recherchiertes Top-20-Datenpaket (13.11.2026)

**Stand:** 2026-11-13  | **Version:** 2026-11-13-survey-first-v1  | **Dateien im ZIP:** genau 20  
**Zweck:** Ein Survey-first-Seed für Codex, kein Ersatz für die bereits programmierte Datenbank und kein neuer Tripsy-Originalexport.

## Inhalt

- Originalfragebogen erneut direkt aus der Excel-Datei ausgewertet: **3 Teilnehmende, 36 Wertungskategorien**, plus Mehrfachantworten und Freitext. 18 Jahre.
- **4 getrennte Tripsy-Reisen**, davon drei Interrail-Varianten für 3 Reisende und eine separate Schweizreise für 4 Reisende (Mitreisenden-Identitäten außer Eigentümer unbekannt).
- **57 neu kuratierte, unselektierte Aktivitäten** nach Gruppenpräferenzen, zugeordneten Prüfquellen und Preis-/Öffnungsstatus.
- **35 datums- und belegungsspezifische Unterkunfts-Kandidaten** aus der Booking.com-Suche vom 13.11.2026, weder gebucht noch finale Checkout-Preise.
- **29 date-only-Transportabschnitte**, nicht als 2027-Fahrplan behauptet.
- **14 Tarif-/Passreferenzen**, **28 Quellen**, **24 dokumentierte Qualitätsprobleme**.
- 17 optionale Tagesplan-Ideen, 40 Essen/Abend/Regentag-Ideen, 4 Kostenszenarien, CSV-Tabellen, Prüfskript.

## Ergebnis eurer Umfrage

Die dominierenden gemeinsamen Interessen sind Meer/Strand, Natur, Aussicht, Wandern, Schwimmen und längere Spaziergänge. Die Antworten zu Regentagen lauten **bei allen drei: aktive Indoor-Attraktion/Sport**. Bei Unterkünften wählten alle **„je nach Stadt und Gesamtkosten“**. Die 60/50/ungefähr-30-EUR-Angaben sind persönliche Richtwerte, keine gemeinsamen absoluten Limits. Ein Wert 0/5 ist keine ausdrückliche Verbotsregel.

**Scoring-Grenze:** Die Umfrage gilt für Naol/K/C. Bei der separaten vierköpfigen Schweizreise sind die anderen drei Mitreisenden nicht bestätigt; deren Gruppen-Score bleibt deshalb `null`.

## Achtung – was NICHT bestätigt ist

- Keine Buchungen, keine bestätigten 2027-Zugzeiten/-Ticketpreise, keine gesicherte 3er-/4er-Bettenkonfiguration, keine vollständige Endpreisprüfung.
- Die neue Unterkunftssuche deckt **September-Klassikroute (3 Personen)** und **separate Schweizreise (4 Personen)** ab. Für **August** und die **Interrail-Schweizvariante** sind eigene Datums-/Belegungssuchen erforderlich.
- Aktivitätskoordinaten sind bewusst `null`, solange kein exakter, verifizierter POI-Pin vorliegt. Ortsmittelpunkte dienen nur als ungefähre Übersicht.
- Kosten verschiedener Währungen dürfen nicht ohne datierten Wechselkurs addiert werden. Die Schweizer Gondel-Starts sind **keine** bestätigten Return-Tickets.
- Essens- und Regenoptionen sind Ideen, keine erfundenen konkreten Restaurants/Preise.

## Neue nützliche offizielle Regeln

- Interrail Global Pass 7 Tage/Monat Youth 2. Klasse aktuell **286 €**, Reservierungen extra (Quelle `interrail_pass`).
- Referenz-Reservierung München–Paris **19 €**, Paris–Barcelona **35 €** (Quelle `interrail_res`), nicht für 2027 garantierte Verfügbarkeit.
- Oeschinensee-Gondel 24.04.–19.09.2027 laut Betreiber 08:30–18:00 (Quelle `oeschi`).
- Nizza Colline du Château 01.04.–30.09.2027 08:30–20:00 und Eintritt kostenlos (Quelle `nice_castle`).
- Rolling Venice plus ACTV 72h Jugendpaket derzeit **33 €** (Quelle `venice_rolling`).

## Nutzung

1. ZIP vollständig in das lokale Projekt herunterladen und entpacken.
2. Zuerst `CODEX_IMPORT.md`, `SCHEMA.json` und `sources.json` lesen.
3. `python validate.py` aus dem entpackten Ordner ausführen.
4. Daten **in einen Staging-/Options-Namespace** importieren und zuerst die vier Trip-IDs abgleichen. Keine Tripsy-Daten überschreiben.
5. Zuerst die klassische Interrail-Route, Barcelona und die Unterkunftsvergleiche ans UI anbinden; anschließend andere Städte. Nie ungewählte Optionen als Buchung zählen.

### Benachrichtigungen/Neurecherche

Angebots-/Buchungspreise sind Snapshots. Beim künftigen Zug-Verkaufsstart konkrete Zeiten und Tarife neu abfragen; Quellen und Prüfzeit speichern. Die beschriebenen Daten sind kein Live-Feed.