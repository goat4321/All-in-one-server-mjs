# Daten & Fristen · lokale Abnahme vom 19.11.2026

Umfang: CHECKLIST_V2 P1.2/P1.6/P1.7/P1.8/P2.1/P7.4 für die Datenseite. Ausgangsbasis dieses Pakets ist der saubere lokale Commit `13c0f9a`. Die vollständige 61-Punkte-Abnahme bleibt offen.

## Erhaltene Funktion und neue Bedienung

Buchungen und Fristen stehen zuerst, gefolgt vom selbst dokumentierten Vorbereitungsstand. Neun benannte Aufklappbereiche erschließen alle bisherigen Inhalte: Datenlücken, Qualitätsbefunde, Fotos, Anbieterstandorte, vollständige Datenmatrix, offene Orte/Menüpreise, Dateiimport, Recherchearchiv und gemeinsames Quellenverzeichnis.

Geschlossene Bereiche erzeugen ihre umfangreichen Inhalte nicht. Beim Schließen wird der erzeugte DOM freigegeben; erneutes Öffnen baut denselben aktuellen Bestand auf. Die einzelnen Gründe fehlender Felder werden ebenfalls auf Abruf erzeugt. Filtermetadaten aller Zeilen bleiben vorhanden, Exporte enthalten sämtliche offenen Felder. Ein vorhandener Quellenbezug wird nicht zur Betreiberbestätigung aufgewertet. Keine Recherche- oder Tripsy-Originaldaten werden verändert.

## Messung

Frische Vorher-/Nachher-Läufe verwenden dieselben vier privaten Tripsy-Rohkopien, getrennte SQLite-Dateien, dieselbe Hauptvariante und 1440/820/390 Pixel. Die Baseline erzeugt beim Öffnen der Datenseite jeweils **27.491 DOM-Knoten**, der neue Stand **387**. Das sind **98,6 Prozent weniger**. Beim gezielten Öffnen eines Bereichs wurden maximal 5.895 Knoten gemessen; Schließen stellt die 387 Knoten wieder her. Mehrere gleichzeitig offene Bereiche können entsprechend mehr Elemente erzeugen.

Die lokalen Umschaltzeiten und vollständigen 33-Seiten-Messungen stehen in den Rohdateien `daten/vorher/metrics.json` und `daten/nachher/metrics.json` unter `outputs/Abnahme-V2` im ursprünglichen Aufgabenordner. Sie sind einzelne lokale Beobachtungen, keine Benchmarkverteilung und keine allgemeine Ladezeitgarantie. Die neue Katalogdatei, Netzlatenzen, externe Karten/Bilder oder andere Seiten werden damit nicht als schneller nachgewiesen.

| Breite | DOM vorher | DOM nachher | Seitenwechsel vorher | Seitenwechsel nachher |
|---|---:|---:|---:|---:|
| 1440 px | 27.491 | 387 | 199,60 ms | 18,64 ms |
| 820 px | 27.491 | 387 | 204,83 ms | 8,48 ms |
| 390 px | 27.491 | 387 | 194,37 ms | 11,57 ms |

„Seitenwechsel“ misst über Chrome CDP vom ausgelösten Klick bis zur bestätigten aktiven Navigation und enthält Browserkommunikation. Es ist weder eine isolierte CPU-Renderzeit noch eine Messung bis zum Laden externer Inhalte. Beide endgültigen Vergleichsläufe fanden ohne parallel laufende Testlast statt.

## Prüfungen

- **502/502 vollständige Node-Tests**, **481/481 portable Node-Tests**, Kartenbericht und HTTP-Smoke-Test bestanden. Die portable Reihe ist eine Teilmenge, keine zusätzliche unabhängige Summe. Keine übersprungenen Node-Tests.
- Bestehender vollständiger Chrome-Flow und der separate verzögerte Mahlzeiten-PUT-Test bestanden. Frühere Datenprüfungen öffnen ihre Detailgruppen nun ausdrücklich, bevor sie deren Inhalt prüfen.
- Der neue `npm run test:data-browser` öffnet und schließt alle neun Gruppen. Anzahl der Quellen und Matrixzeilen wird mit dem vollständigen Katalog verglichen. Individuelle Feldgründe bleiben in voller Anzahl erreichbar. Lesen verändert den gespeicherten Reisestatus nicht.
- Der reale Browser lädt JSON- und CSV-Berichte herunter. Anzahl der Einträge und offenen Felder wird mit dem vollständigen Bericht verglichen; CSV wird als vollständige Datei geprüft. Eine zuvor leere Suche schränkt den Export nicht ein.
- Native Enter- und Space-Ereignisse öffnen/schließen den Datenbereich mit erhaltenem Summary-Fokus. Eine Frist mit Europe/Berlin wird gespeichert, in UTC geprüft und nach Neuladen wiedergefunden. Offene Gruppen bleiben nach derselben Speicherung offen und werden bei einer anderen Variante zurückgesetzt.
- Der Dateitest weist eine reale lokale JSON-Datei über das Browser-Dateifeld zu, importiert sie und wiederholt den Import. Genau eine ungewählte, ungeprüfte manuelle Testoption entsteht nur in der isolierten Hauptvariante. Das sichtbare Importprotokoll aktualisiert sich. Die Testoption und die Testfrist gehören nicht zur Nutzer-Vorschaudatenbank.
- Unabhängige lesende Hauptprüfung und Nachprüfung: keine verbleibenden konkreten Befunde; zehn gezielte Node-Prüfungen zusätzlich erfolgreich. Kein zusätzlicher Chrome-Lauf durch den Reviewer.
- Zusätzlicher Export des geprüften Git-Index in ein neues Verzeichnis ohne private `tripsy-*.json`: `npm run check:portable` mit 481/481 Tests, Kartenbericht, HTTP-Smoke-Test und anschließend `npm run test:data-browser` bestanden. Das prüft den tatsächlich eingeschränkten Recherche-Fallback getrennt von der Originaldatenregression. Die privaten Quelldateien wurden dafür weder verschoben noch geändert.

## Visueller Abgleich und begrenzter Kontrasttest

Vorher und Nachher liegen je drei neue Datenseitenbilder vor. Zusätzlich gibt es drei helle Startansichten, eine dunkle Desktopansicht und eine Ansicht geöffneter Feldgründe aus dem dedizierten Browserlauf. Desktop, Smartphone und Dunkelmodus wurden tatsächlich geöffnet. Die Vorbereitungsübersicht hat keine umschließende Schattenkarte mehr; die mobile Überschrift und Exportaktionen können ohne schmale Textspalte umbrechen.

Der Browser prüft in der anfänglich geschlossenen Ansicht **47 Textstellen je Ansicht** auf berechenbaren flächigen CSS-Hintergründen. Minimal gemessen: **5,738:1** hell bei 1440/820/390 Pixeln, **9,323:1** dunkel bei 1440 Pixeln. Der geprüfte helle Summary-Fokus hat **7,385:1** und drei Pixel Kontur. Zuvor wurde Hinweistext mit 4,454:1 sowie im Dunkelmodus dunkle Überschrift auf dunklem Grund mit 1,091:1 reproduziert und gezielt korrigiert.

Normale Texte werden gegen 4,5:1, große Texte gegen 3:1 und der geprüfte Fokus gegen 3:1 bewertet. Grundlage: [W3C Textkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C Nicht-Text-Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Die Messung verwendet berechnete Browserfarben und transparente Farbüberlagerung. Verläufe, abweichende Opazität und nicht berechenbare Farbmodelle werden als übersprungen ausgewiesen. Im aktuellen Startansichtsreport gibt es keine übersprungenen Textstellen.

Das ist **keine vollständige Barrierefreiheitsabnahme**: aufgeklappte Tabellen, Formulare, Dialoge, dunkle Fokuszustände, Screenreader und die anderen Hauptseiten sind nicht vollständig erfasst. Externe Bilder/Karten sind in den reproduzierbaren Läufen blockiert, keine echten Mobilgeräte verwendet. Der Originalreferenz-Abgleich und die übrigen offenen Checklistenpunkte bleiben bestehen.

## Artefakte

Im ursprünglichen Aufgabenordner: `outputs/Abnahme-V2/daten/vorher`, `daten/nachher`, `daten/ablaeufe` sowie die Logs `data-before.log`, `data-after.log`, `data-full.log`, `data-portable.log`, `data-regression-browser.log`, `data-flows.log`, `data-meal-race.log`, `data-clean-portable.log` und `data-clean-browser.log`. Die geänderte CI-Konfiguration liegt ausschließlich lokal vor; ein Remote-CI-Erfolg dieses Pakets wird nicht behauptet.

Die Nutzervorschau wurde ausschließlich lokal mit derselben privaten Datenbank auf Port 4175 neu gestartet. HTML und neues Datenmodul antworten mit HTTP 200; die Start-API enthält alle vier ursprünglichen Reisevarianten und die sechs Rezeptstädte des vorigen Pakets. Testfristen und Testimporte wurden nur in den inzwischen entfernten Browser-Testdatenbanken erstellt.
