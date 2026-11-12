# Anforderungsänderungen

| Datum | Priorität | Anforderung | Module | Stand |
|---|---|---|---|---|
| 12.11.2026 | Kern | Master-Prompt V7 als Ausgangsspezifikation | Gesamtes Projekt | Abnahme in STATUS.md |
| 12.11.2026 | Kern | Nachgereichtes Rechercheverzeichnis als primäre Datenquelle bestätigen | Import und Herkunft | 22 Dateien per SHA-256 identisch mit dem bereits eingelesenen Archiv. Ein Quelldatensatz. |
| 12.11.2026 | Kritisch | GitHub-Checkout muss trotz bewusst fehlender privater Tripsy-Snapshots starten | Datenmodell, Backend, Herkunftsstatus | Implementiert und im Node-24-GitHub-Actions-Starttest bestanden; reduzierte Quellen explizit gekennzeichnet. |
| 12.11.2026 | Hoch | Koch-Mahlzeiten für mehrere Tage zu einem variantenbezogenen Gruppen-Warenkorb bündeln; keine doppelten Packungskosten | Verpflegung, Budget, Formulare, Persistenz | Implementiert; echte Chrome-Tests für zwei Tage, Preisänderung, Wiederladen und Mobile bestanden. |
| 12.11.2026 | Hoch | Bekannte/fehlende Kosten transparent nach Stadt und Datum gliedern, centgenaue Anteile und Pass-Tage je Variante vergleichen | Übersicht, Budget, Interrail | Implementiert; Unit- und Browserchecks bestanden. Keine 2027er Livepreise angenommen. |
| 12.11.2026 | Hoch | Reproduzierbare Regression im privaten GitHub-Branch | Qualität, CI | Implementiert: automatische Node-24-Syntax-, Modell-, Server- und Chromeprüfungen. Vollständige Original-Rohdaten-Abnahme weiterhin offen. |

| 12.11.2026 | Kern | 20 kuratierte aktuelle Research-v0.2-Quellen einzeln aufnehmen und bestehende Reisen bewahren | Datenarchiv, Katalog, Testqualität | Implementiert: 16 JSON + 4 Dokumente archiviert, Referenzvalidator und Scope-Tests bestanden; `data/research-v02/INTEGRATION_AUDIT.md` ist der Datei-Audit. |
| 12.11.2026 | Hoch | 42 neue Aktivitäten, 115 Umfrage-Rankings und individuelle Interessen sichtbar machen | Entdecken, Reisegruppe | Implementiert und im Chrome-Test geprüft; Scores nur für Drei-Personen-Interrailgruppen, nicht die Schweizer Vierergruppe. |
| 12.11.2026 | Hoch | 92 Markt-Suchpreise mit Datums-, Varianten- und Bettbelegungswarnungen vergleichen | Unterkünfte, Planung, Budget | Implementiert: 60/40/0/32 scopes; Auswahl bleibt optional und ungebucht, Datum auf Budgetebene geprüft. |
| 12.11.2026 | Hoch | Alle offenen 2027er Bahn-Recherchetickets/Alternativen getrennt anzeigen | Bahn & Interrail | Implementiert: 35 Prüfaufgaben, 13 nicht bestätigte Alternativen; keine erfundenen Fahrpläne. |
| 12.11.2026 | Hoch | Was-wäre-wenn-Budgets und 32 Datenqualitätsbefunde mit Belegstatus in die Oberfläche bringen | Budget, Daten & Fristen | Implementiert: drei Szenarien separat, Schweizer Viererreise nur Unterkunftssumme, 32 Qualitätsbefunde sichtbar. |

| 12.11.2026 | Hoch | Fehlende 2027er Bahn-Verkaufsfenster plausibel kennzeichnen und Nachprüfung ermöglichen | Bahn, Fristen | Offizielle SNCF/DB/Interrail-Regeln und unverbindliche Prüfzeiträume eingebunden; optionale lokale Wiedervorlage, keine festen 2027-Zugbestätigungen. |
| 12.11.2026 | Hoch | Zimmerbelegung/Checkout/Steuern/Preis je Unterkunft prüfbar dokumentieren | Unterkünfte, lokale Datenbank, Budget | Manuelle 5-Felder-Checkliste mit Quellenlink; nur bei ausdrücklicher Auswahl kann ein selbst dokumentierter Checkoutpreis ein Planbudget aktualisieren. Keine Buchungsbehauptung. |
| 12.11.2026 | Hoch | Aktuelle Barcelona-2027-Suchpreise zusätzlich prüfen, historische Angebote erhalten | Unterkunftsvergleich | 3 weitere datierte, ungebuchte Provider-Beobachtungen für 3 Erwachsene/03.–06.09.2027 separat angelegt; genaue Tarif-/Zimmerzuordnung noch offen. |
| 12.11.2026 | Kritisch | GTFS-Nutzungsgrenze für 2027 auf Karten/Tageswegen anzeigen | Karten, ÖPNV | Barcelona nur bis 18.06.2027: Warnung im Kartenpanel und alte Abfahrten ausdrücklich als Referenz bezeichnet. |
| 12.11.2026 | Hoch | Privaten Tripsy-Livebestand gegen Research-Transportbestand abgleichen | Quellenintegrität, Regression | Vier Reisen rein lesend abgeglichen; 35 Referenzzug-IDs + eine bereits dokumentierte Dublette; vollständiger privater Original-End-to-End-Test lokal noch offen. |

| 12.11.2026 | Hoch | Veröffentlichte 2027er Venedig-/Alpen-/Mietwagen-Regeln aufgreifen, ohne unsichere Preise zu erfinden | Übersicht, offizielle Quellen | Implementiert: Venedig-Gebührenkalender, Oeschinensee-Sommerzeiten, SIXT-CH-Alter/Führerschein, Eiffelturm-2027-Tarifwarnung; Node- und Chrome-Tests. |
