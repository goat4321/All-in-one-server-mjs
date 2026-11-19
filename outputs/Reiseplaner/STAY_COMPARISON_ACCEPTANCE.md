# Unterkunftsfilter und Direktvergleich · Abnahme 19.11.2026

Arbeitsbasis ist Commit `634ffde` auf dem lokalen Branch `codex/checklist-v2-audit`. Dieses Paket bearbeitet P3.3/P3.4 sowie Teile von P1.2/P1.6/P1.7/P2.6/P3.1/P3.6. Der vollständige Master-V7-/61-Punkte-Auftrag bleibt aktiv.

## Bedienung und Datenbezug

Die Unterkunftsseite beginnt mit Reiseort, Suche und den gewöhnlichen Optionen. Die lange Schweizer Preis-/Ausstattungsrecherche ist weiterhin vollständig in einem benannten nativen Aufklappbereich erreichbar; sie schiebt die Hauptbedienung nicht mehr unter mehrere Bildschirmhöhen. Keine ihrer 20 datierten Suchanzeigen oder acht recherchierten Zimmerkategorien wurde gelöscht. Der bestehende vollständige Chrome-Ablauf öffnet diesen Bereich jetzt ausdrücklich, bevor er dessen Inhalte prüft.

Küche, für die aktuelle Gruppe selbst geprüfte Betten, Stornobedingungen, Quellenart, berechneter Bahnhof-Fußweg und eine EUR-Grenze pro Person/Nacht lassen sich gemeinsam anwenden. Alle Kriterien gelten als UND-Verknüpfung, zusätzlich zur vorhandenen Suche und den bisherigen Schnellfiltern. Unbekannter Preis, unpassende Belegung, fehlende Nächte oder CHF ohne EUR-Umrechnung erfüllen die EUR-Grenze nicht. Quellenfilter lesen tatsächliche URL-Hostnamen, keine enthaltenen Wörter in beliebigen Links. Eine separate Betreiberquelle bleibt von einem datierten Zimmerangebot unterscheidbar.

Der importierte Boolean `cancellation` stammt aus `free_cancellation`. `false` bedeutet deshalb „keine kostenlose Stornierung laut Quelle“, nicht „überhaupt nicht stornierbar“. Beschriebene Tarifbedingungen bleiben wörtlich erhalten; unbekannte Bedingungen bleiben offen. Eigenprüfung ist keine Anbieterbestätigung.

Zwei bis vier Unterkünfte zeigen Gruppengesamtsumme und ungefähren Personenanteil für den Aufenthalt, EUR pro Person/Nacht soweit berechenbar, Zeitraum, Status, Zimmeraufteilung, Küche, Betten, Bad, Gebühren, Storno, Bahnhofweg und Quellenstand. Die fünfte Auswahl wird abgewiesen. Entfernen und Leeren funktionieren. Suche, Filter und Sortierung erhalten die gewählten Vergleichskandidaten; Stadt-/Umfangs- und Variantenwechsel räumen die Vergleichsauswahl wie vorgesehen auf. Der Variantenwechsel setzt auch die neuen Ansichtsfilter zurück.

Der reale Barcelona-Browserfall verwendet vorhandene, nicht neu erfundene Angebote für **03.–06.09.2027, drei Personen, drei Nächte**:

| Unterkunft | Historischer Gruppensuchpreis | Ungefähr p. P./Aufenthalt | P. P./Nacht |
|---|---:|---:|---:|
| HeyLola! Hostel | 285,90 € | 95,30 € | 31,77 € |
| Generator Barcelona | 448,80 € | 149,60 € | 49,87 € |
| The Central House Barcelona Gracia | 388,59 € | 129,53 € | 43,18 € |
| AMISTAT City Hostel Barcelona | 430,92 € | 143,64 € | 47,88 € |

Diese Suchbeobachtungen stammen vom **12.11.2026**. Zimmer, Steuern, zusätzliche Gebühren, Checkout und tatsächliche Buchbarkeit bleiben unbestätigt. Preise sind keine neuen Liveangebote und keine gebuchten Ausgaben. Der Filter „Booking + höchstens 32 € p. P./Nacht“ liefert in diesem vorhandenen Barcelona-Katalog HeyLola. Eine zusätzliche belegte Kochküche liefert keine Treffer, weil dazu für diesen Kandidaten keine ausreichende Angabe vorliegt.

CHF-Gruppensummen bleiben CHF und werden nicht als EUR-Nachtpreise behandelt. Auch importierte Pro-Personen-Preise mit festgelegter abweichender Belegung dürfen weder Bewertung noch Vergleich umgehen. Die alte allgemeine Unterkunftssortierung „Preis“ nutzt jetzt dieselbe EUR-Bewertung und heißt „Preisreferenz (EUR)“; unbekannte/nicht vergleichbare Beträge stehen hinter den vergleichbaren EUR-Werten. Es wird kein Wechselkurs erfunden.

## Asynchrone Bedienung und Darstellung

Ein bestätigter Filter behält bei verspäteten echten Bahnhof-Wegeantworten seinen Fokus. Auch ein noch nicht bestätigter numerischer Preisentwurf bleibt erhalten: Nur bei gleicher Variante/Seite und unverändertem bestätigtem Preiswert wird das tatsächlich fokussierte native Eingabefeld wieder eingesetzt. Der Browserfall hält die tatsächlichen Cache-Anfragen an, beobachtet nach Freigabe eine neue DOM-Sektion und prüft Wert und Fokus. Ein echter Mausklick auf „Unterkunftsfilter zurücksetzen“ verwirft einen unbestätigten Entwurf ebenfalls.

Die nativen Aufklappzustände werden vor derselben Neudarstellung direkt gelesen. Damit schließt eine noch nicht abgearbeitete `toggle`-Benachrichtigung nicht versehentlich den gerade geöffneten Filter. Native Enter- und Tab-Eingaben sind geprüft.

Die beiden kontrollierten Anfragengruppen liegen in **Nizza und Appenzell**, weil sowohl Originaldaten als auch Recherche-Fallback dort tatsächliche Ankunftskoordinaten und passende gespeicherte Fußwege besitzen. Im Fallback fehlen solche Ankunftspunkte in Paris/Barcelona; Kandersteg besitzt keinen passenden gespeicherten Bahnhofweg. Diese Lücken wurden nicht mit Testkoordinaten oder erfundenen Providerantworten aufgefüllt. Anschließend kehrt der Fall zum eigentlichen Barcelona-Vergleich zurück.

Vier Desktop-Spalten richten ihre Faktenzeilen per CSS-Subgrid aus, bei 820 Pixeln stehen zwei und bei 390 Pixeln eine Spalte. Die Darstellung benötigt keinen horizontalen Seitenüberlauf. Bei fehlendem lizenziertem Objektfoto steht im Direktvergleich „Objektfoto nicht belegt“; ein fremdes Stadtmotiv tritt dort nicht als Hausfoto auf. Vorhandene echte Objektfotos behalten den vorhandenen Bildrenderer mit Quellen-/Lizenzangaben. Für die vier geprüften Barcelona-Angebote fehlen weiterhin belegte Objektfotos; die Fotoanforderung P3.2 ist deshalb nicht vollständig erledigt.

## Tatsächliche Prüfungen und Grenzen

- Elf gezielte neue Modellfälle plus bestehende Unterkunftsregressionen prüfen Datums-/Gruppen-/Währungsbezug, Stornosemantik, gültige eindeutige Kandidaten, kombinierte Filter, manipulierte Provider-URLs und fehlende Werte. Die unabhängige letzte Modellnachprüfung besteht mit 19/19 Fällen.
- Echter Chrome: zwei, drei und vier vorhandene Angebote, fünfte Auswahl, Entfernen/Leeren, kombinierte Filter, leere Ergebnisse/Reset, Quellenlinks, Datum/Status, Suche-/Sortierretention, native Enter/Tab-Eingaben, zwei kontrollierte Gehweg-Antwortgruppen, unbestätigter Zahlenentwurf und tatsächlicher Maus-Reset. Gespeicherte Zustände aller vier Varianten bleiben bytegleich; Vergleichen und Filtern ändern weder Tagesplan noch Budget. Nachladen ist enthalten.
- 142 tatsächlich gemessene Textstellen je heller Vergleichsansicht bei 1440/820/390 Pixeln: Mindestkontrast **5,95:1**. Dunkler Desktopvergleich: **6,61:1**. Keine Fehler in dieser flächigen Textstichprobe. Sie umfasst Vergleich sowie Hinweis/Überschrift des Filters, keine vollständige Prüfung sämtlicher Formulare, Fokuszustände, Bilder oder anderer Seiten.
- Frische Baseline aus unverändertem Git-Index `634ffde`, lokale private Rohkopien per SHA-256 identisch kopiert; keine Quelle verschoben oder verändert. Je 33 Vorher-/Nachheransichten umfassen elf Hauptseiten bei drei Größen. Beide automatisierten Berichte enthalten keine JavaScript-Ausnahme und keinen positiven horizontalen Seitenüberlauf. Das ist keine vollständige visuelle Abnahme aller Seitenzustände und kein allgemeiner Leistungsnachweis.

Der finale Originaldatenlauf besteht mit **526/526 vollständigen Tests**, die portable Teilmenge mit **505/505**; keine übersprungenen Fälle. Die Teilmenge wird nicht hinzuaddiert. Kartenbericht und HTTP-Smoke bestehen. Der bestehende vollständige Chrome-Ablauf einschließlich lokaler Unterkunftsauswahl, Prüfung und Budget besteht ebenfalls.

Der getrennte Export des vorbereiteten Git-Index enthält **keine privaten Tripsy-Rohdateien** und besteht ebenfalls mit **505/505 portablen Tests**, Karten-/HTTP-Prüfung und dem endgültigen Chrome-Unterkunftsablauf einschließlich beider kontrollierter Anfragegruppen, Eingabeentwurf und nativem Maus-Reset. Es wurden dafür keine privaten Daten hineinkopiert und keine Teststationen erfunden.

Der unabhängige lesende Review hat Stornobedeutung, Belegungsschutz und Eingabeentwurf korrigiert und meldet in der letzten Nachprüfung keine verbleibenden konkreten Befunde. Keine externe Quelle, Buchung oder Zahlung wurde geändert. Kein Merge oder Deployment; grüne lokale Prüfungen sind keine Behauptung eines Remote-CI-Laufs.

## Artefakte

Im Aufgabenordner unter `outputs/Abnahme-V2/unterkuenfte`: unveränderte Vorheransichten, aktuelle Nachheransichten, offene Filter und Vergleich bei drei Breiten, dunkler Desktopvergleich, Original-/Fallback-Berichte und finale Testlogs. Externe Medien sind in reproduzierbaren Browserläufen blockiert; die Bilder belegen deshalb Layout, gespeicherte Daten und korrekte Fehlbildzustände, keine erfolgreiche Live-Bildlieferung. Produktfotos, Endpreise und konkrete 2027-Verfügbarkeit bleiben getrennte Recherche-/Bestätigungsaufgaben.
