# Phase 19 – Zweite Designrunde und neues Umfrage-/Recherchepaket

**Stand:** 14.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · **Draft PR:** #5

## 1. Zweiter Designabgleich (zuerst umgesetzt)

Erneute Orientierung an den früheren vom Nutzer übermittelten Reise-App-Mustern von Wanderlog, Tripsy, Designyow und Navica. Keine identischen Bildschirmkopien und keine unlizenzierte Bildübernahme.

- Neues ergänzendes `public/design-round2.css` als nichtdestruktive Schicht über dem alten Layout.
- Höherer Informationskontrast und mehr Weißraum: kein weiterer Statistik-Kachelteppich. Weniger Außenränder/Einzelrahmen auf der Timeline und in kompakten Explorer-Listen.
- Aufgeräumtes Tagesheader mit Stadt/Datum, Zahl der vorhandenen Stopps, bekannten Zeiten und getrennten offenen Kosten; keine erfundenen Termine.
- Karten-Explorer bleibt map-first. Auf Desktop ab 1180 px Karte links, Such-/Ortsliste rechts; auf schmalen Geräten untereinander. Größere, bereits lizenzierte Ortsfotos oder ausdrücklich symbolische Illustration.
- Direkter Wechsel vom Karten-Stadt/Datum-Kontext in den Tagesplan, klarere Tagesbuttons, sparsame Interaktionen, mobile Layouts und `prefers-reduced-motion`.
- Bestehende Leaflet-Karte, Route-Studio, Quellen, Buchungen und lokale Speicherung bleiben erhalten.

**QA:** Projekt-Workflow prüft Browser mit Chrome, JavaScript-Syntax, Modelltests, Kartenabdeckung und lokalen Server-Start. GitHub Actions archiviert Screenshots für Desktop, Tablet und Smartphone. Die isolierten Tests benutzen teilweise Offline-Kartenkacheln. Das ist keine visuelle Bestätigung auf echter Mobilhardware und kein exakter Nachbau der Vorlagen.

## 2. Import – 20 Dateien gesichert

Alle 20 Nutzer-Dateien sind unverändert dem Inhalt nach und unter ihren kanonischen Dateinamen in `data/research-v19-survey-first/` abgelegt. Das mitgelieferte `validate.py` wird in der CI ausgeführt: **56/56** Prüfungen bestanden.

**Grundsatz:** Dies ist ein zusätzlicher read-only Research-Snapshot und keine Überschreibung der Tripsy-Originale, lokalen SQLite-Zustände oder früheren Rechercheversionen. `lib/research-v19.mjs` überprüft IDs, Quellen, Provenienz und Reisedatumsgrenzen. IDs sind als `survey-v19:<id>` namespaced; ein erneuter Katalogaufbau führt nicht zu Duplikaten.

| Kategorie | Eindeutige Einträge | Behandlung |
| --- | ---: | --- |
| Aktivitäten | 57 | Als alternative, ungewählte Aktivitäten in 4 Reisevarianten; 140 Variantenreferenzen insgesamt |
| Unterkünfte | 35 | 24 Kandidaten nur klassische Interrail-Route (3 Erwachsene), 11 nur vierköpfige Schweizreise |
| Transportabschnitte | 29 | Date-only Recherchereferenz; keine ausgewählte oder buchbare Zugverbindung |
| Tarifreferenzen | 14 | Separater Tarif-/Passbereich, nicht als künftiger Betrag ins aktive Budget |
| Tagesplan-Vorschläge | 17 | 13 klassische Route, 4 Schweizreise; nicht aktiv, auf Wunsch einzelne Aktivitäten hinzufügen |
| Essens-/Abend-/Regen-Ideen | 40 | Reine Optionen in der Verpflegungsansicht ohne fingierte konkrete Restaurants |
| Budget-Szenarien | 4 | Drei klassische Route, eines Schweiz; Vergleich **ohne** aktive Budgetänderung |
| Quellenregister | 28 | Datierte Quellen inklusive noch zu prüfender Gültigkeit |
| Qualitätsbefunde | 24 | Einzeln in Daten & Fristen eingeblendet |

**Reisevarianten:** ursprüngliche Tripsy-IDs 1297194, 1312180, 1275516 und 1273324 werden getrennt und unverändert weiterverwendet. 3-Personen-Umfragewerte werden bei der unabhängigen 4-Personen-Schweizreise nicht zur Gruppenaussage umetikettiert. Zusätzlich zur Hauptroute wurden sechs validierte Ausflugsoptionen für Glarus/Grindelwald in der Interrail-Schweizvariante beibehalten.

## 3. Einträge, die nicht als aktive oder bestätigte Daten übernommen werden

**Echte abgewiesene Kandidatensätze:** 0 laut Zuordnung zum Quellpaket (sechs externe Ausflüge sind als Alternativen berücksichtigt). Das Importprotokoll im UI führt eventuelle zukünftige tatsächliche Ablehnungen mit Datensatz-ID und Grund auf. Die 20 Archivdateien wurden nicht entfernt.

**Bewusst *nicht* in Buchungs- und Fahrplan-Schema übertragen:**

1. Die 29 Transportabschnitte haben keine bestätigte Zugnummer, Abfahrts-/Ankunftszeit, Ticketpreis oder Sitzverfügbarkeit für August/September 2027. Sie werden als Prüfaufgaben gezeigt, nicht als Fahrt mit falschem Zeitpunkt oder fiktiven 0 €.
2. Die 35 Booking.com-Kandidaten besitzen historische datums- und belegungsabhängige Suchpreise. Zimmer-/Bettenaufteilung, Steuern, Stornobedingungen und finale Checkout-Verfügbarkeit sind nicht bestätigt. Deshalb sind alle zunächst **unselected, unbooked**. Buchbare Preise werden nur für die exakt passenden Reisetermine/Gruppen in den Unterkunftsvergleich übernommen; **keine** Übertragung auf August oder die Interrail-Schweizvariante mit anderen Datumsfenstern.
3. Für alle 57 neuen Aktivitäten sind genaue POI-Koordinaten null. Ohne eigenen Standortnachweis werden keine erfundenen Pins verwendet; Google Maps kann nach dem Ort suchen. 35 Unterkunftskoordinaten sind ausdrücklich **vom Anbieter gemeldet**, nicht unabhängig geprüfte Eingangspunkte. Sie werden in der Datenprüfung als solche ausgewiesen.
4. 40 Essen-/Abendideen haben überwiegend keine konkreten Anbieter und belastbaren Menüpreise. Sie bleiben recherchierbare Vorschläge.
5. Die 17 Tagesideen, vier Budgetvarianten und 14 Tarifreferenzen bleiben unselektiert; bei CHF- und einseitigen Gondeltarifen keine falsche EUR-Summierung. Die fünf externen Buchungen / Entscheidungen werden nicht erfunden (keine neuen Reservierungen).
6. Unbestätigte Reisedaten (Öffnungszeiten, Wetter, regionale Verbindungen) bleiben als unsicher gekennzeichnet; nur verifizierte Referenzen haben datierte Quellen.

## 4. Qualitätsabsicherung und nächste reale Prüfpunkte

- Automatisierte Verifikation umfasst 56 Archivchecks, Import-Zuordnung, Einzigartigkeit der IDs, variantenspezifische Belegungen, Nullzeiten, Source-Verlinkung, Nullbudget-Fälle und centgenaue Teilung (100,00 € → 33,34 / 33,33 / 33,33 €).
- Der Katalogimport läuft bei jedem Neustart deterministisch. Kein automatisches Schreiben in `state.manual`, `state.edits`, `state.expenses` oder Original-Tripsy.
- Fortsetzung erst mit echten Anbieternachweisen: Hotel-Zimmer und Endpreise im Checkout, konkrete Verkehrstage nach Fahrplanfreigabe, eindeutig belegte Veranstaltungsorte, richtige Bildrechte. Der Nutzer kann Kandidaten individuell prüfen und auswählen.
- GitHub Branch: [Entwicklungs-PR #5](https://github.com/goat4321/All-in-one-server-mjs/pull/5). Nicht nach `main` gemergt, keine Änderung am produktiven Deployment.
