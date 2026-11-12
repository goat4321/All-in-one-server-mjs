# Prüflücken 2027 – aktuelle Evidenz statt erfundener Verfügbarkeiten

Stand der öffentlichen Anbieterrecherche: **12. November 2026**. Diese Liste unterscheidet Funktionalität, veröffentlichte Regel und den tatsächlich noch fehlenden Buchungsnachweis.

## Bahn: 2027-Fahrpläne und Reservierungen

- **SNCF (offiziell):** Am 12.11.2026 wurde der Vorverkauf für TGV-Fahrten vom 07.01. bis **02.07.2027** eröffnet. Die Interrail-Pläne für August/September 2027 liegen **außerhalb** dieser bestätigten Angebotsperiode. Quelle: https://www.sncf-connect.com/en-en/help/ticket-sales-opening und https://www.sncf-connect.com/en-en/article/the-opening-of-ticket-sales-for-winter-and-spring-summer-2027
- **DB (offiziell):** Für internationale Sitzplatzreservierungen gilt grundsätzlich ein Zeitraum bis **6 Monate** voraus (einzelne Ausnahmen). Das ist keine Zusage, dass die ursprünglich notierte Uhrzeit oder drei Passplätze für die Reise vorhanden sind. Quelle: https://www.bahn.de/faq/sitzplatzreservierung-vorverkauf
- **Interrail (offiziell):** Viele Schnell- und Nachtzüge können ungefähr **3 Monate** voraus reserviert werden; Betreiber und Zugtypen unterscheiden sich. Ohne tatsächliche Zugnummer/Passkontingente ist kein endgültiger Sitzpreis oder Passstatus bestätigt. Quelle: https://www.interrail.com/en-int/support/reservations/when-should-i-start-making-reservations
- **In der App umgesetzt:** 35 Originalabschnitte, 13 unbestätigte Hypothesen und individuell abgeleitete **Orientierungsdaten** zum Nachschauen. Ein Button schreibt eine lokale Wiedervorlage für die Reisevariante, keinen externen Kalendertermin und keine Reservierung. Über "Eigene Prüfung" können Nutzer ihre Anbieterprüfung mit Quelle dokumentieren.
- **Noch nicht belegbar:** Exakte, veröffentlichte August-/September-2027-Abfahrten/Umstiege, echte Preise und Passkontingente für drei Personen.

## Nahverkehr, Karten und Wege

- **Barcelona:** Das vorhandene lokale TMB-GTFS-Paket reicht von **22.10.2026 bis 18.06.2027**; der Barcelona-Aufenthalt ist **03.–06.09.2027**. Deshalb darf die App diese Fahrten nicht als Fahrplan 2027 für den Aufenthalt verkaufen. Die Karte zeigt einen sichtbaren Gültigkeitshinweis, Linien als Orientierung und einen Link zum offiziellen TMB-Planer.
- **Nizza, Genua, Venedig:** Statische GTFS-/Netzdaten stammen aus November/Dezember 2026. Ihre Streckenkarte ist ein Netzüberblick, nicht ein live bestätigter 2027er Fahrplan. Ticketpreise bleiben Referenzen für 2026.
- **Fußwege:** Die Anwendung besitzt OSRM/OSM-Fußwegrouting mit Verlauf, Länge und Dauer nur bei tatsächlich erfolgreicher Berechnung und Anbieterquelle. Ansonsten externe OSM-Wegbeschreibung; keine Gerade als reale Straße und keine geschätzte ÖPNV-Minutenangabe aus einem Stadtmittelpunkt.
- **Fehlend:** Verifizierte 2027-Abfahrten, Preis-/Zonenregeln am Reisedatum, Baustellen und exakte Fußwege zu Anbieter-Unterkünften ohne eindeutige Standortgeometrie.

## Hotelangebote für drei und vier Reisende

- **Forschungsbestand:** 92 Booking-Suchpreis-Snapshots vom 12.11.2026, mit strikter Daten-/Personenzahlzuordnung; nicht der Checkout eines gebuchten Zimmers.
- **Ergänzende aktuelle Barcelona-Anbietersuche am 12.11.2026 (3 Erwachsene, 1 Zimmer, 03.–06.09.2027):** Hostal Portugal **474,30 €** für die Gruppe; Roma Reial **519,30 €**; Hostal Fina **534,30 €**. Dies sind Anbieter-*Suchergebnisse*, keine bestätigten Endpreise oder erzwungenen Vorschläge. Allgemeine Objektinformationen: Hostal Portugal bietet grundsätzlich Dreibett-Optionen, Roma Reial Dreibettzimmer und Hostal Fina private Zimmer bis drei Personen. Der konkrete Preis wurde nicht einem vollständig bestätigten Zimmer-Tarif zugeordnet.
- **In der App umgesetzt:** Diese drei datierten Versionen erscheinen zusätzlich unter Barcelona im Filter "2027-Suchpreise", nicht für August oder die Schweizer Viererreise. Aus den Anbieterlinks können die noch fehlenden Zimmer-/Betten-/Steuer-/Storno-/Checkout-Prüfungen lokal erfasst werden. Nur per expliziter Nutzerhandlung darf ein vollständig selbst dokumentierter Checkoutbetrag einen bisherigen **Planpreis** ersetzen; im Plan bleibt "nicht bezahlt/nicht gebucht".
- **Weiter offen:** Zimmerkategorie mit garantiert drei Betten, aktueller Steuerendpreis im Checkout, Frühstück/Küche tatsächlich eingeschlossen, Stornozeit und Rückweg zum Bahnhof. Für alle anderen Städte/Varianten gilt die gleiche Anforderung; die 92 Snapshots bleiben vorläufig.

## Quelle Tripsy und Regressionstests

- Der authentifizierte Tripsy-Zugang lieferte vier Reisen und **103 Aktivitäten, 21 Unterkünfte, 36 Transporte, 29 Ausgaben** (nur gezählt, nicht nach GitHub übertragen); vollständige Quell-IDs für alle 35 bereinigten Transportabschnitte, plus bekannte Dublette **3890058**. Details: \`data/provider-checks/LIVE_TRIPSY_AUDIT_20261112.md\`.
- Private lokale \`data/tripsy-*.json\` sind absichtlich **nicht im GitHub-Repository**; vollständige Originaltests auf dem ursprünglichen Windows-Rechner bleiben erforderlich. Die neue GitHub-CI testet außerdem Node 24, Datenqualität, Anbieterzustände, Browser-Interaktionen und den Start ohne private Rohkopien.
- Über \`data/research-v02/data_quality.json\` bleiben weitere offene Befunde in der Website sichtbar. Besonders **Mietwagen-Mindestalter in der Schweizer Viererreise**, DiscoverEU-Passstatus, Tourenzugänge, 2027-Öffnungszeiten und Preisfenster wurden nicht ohne Quelle als geklärt markiert.

## Grundregeln

1. **Keine automatisch behaupteten Buchungen, Zahlungen oder bestätigten 2027er Zugfahrten.**
2. Null für fehlenden Preis, niemals 0 € ohne Gratisbeleg; datierte Suchpreise sind getrennte Versionen.
3. Keine Änderung an den vier Tripsy-Rohreisen, ursprünglichen Zügen, Nutzerpräferenzen oder Git-ignorierten privaten Quelldateien.
4. Ein Nutzerhäkchen bedeutet **selbst dokumentiert**, nicht unabhängig technisch bestätigt. Ohne verifizierte Raumkonfiguration/Endpreis gilt eine Hotelpreisbeobachtung weiterhin als vorläufig.
5. Aktive Gruppenkosten bleiben centgenau. Bei geänderter Personenzahl wird eine ältere Anbieterprüfung sichtbar **veraltet**, jedoch aus Dokumentationsgründen nicht gelöscht.
