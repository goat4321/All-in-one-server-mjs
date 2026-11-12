# Reiseplaner

Im Kartenpanel lassen sich je nach Stadt **Metro**, **Vaporetto**, **Tram**, **Bus** oder das amtliche Schweizer **Wanderwegenetz** einblenden. In **Unterkünfte** werden Wege ab den ausgewiesenen Bahnhöfen verglichen. **Budget → Nahverkehr** vergleicht die Referenztarife für das gewählte Gültigkeitsfenster.

[AMT Genova](https://www.amt.genova.it/amt/societa_trasparente/altri-contenuti/open-data/) · [ACTV Venezia](https://www.dati.venezia.it/?q=node%2F261)

## Start unter Windows

1. **Start.cmd** im Explorer doppelklicken. Node.js 24 ist auf dem verwendeten Rechner vorhanden.
2. Im Browser **http://127.0.0.1:4173** öffnen, falls Windows den Tab nicht selbst öffnet.
3. Das Konsolenfenster geöffnet lassen. Mit **Strg+C** beenden.

Alternativ im Projektordner `node server.mjs` starten. Leaflet ist lokal enthalten. Die App benötigt keinen Installations- oder Buildschritt. Bei belegtem Port den laufenden Reiseplaner öffnen oder `REISEPLAN_PORT` auf einen freien Port setzen.

## Reise planen

- Oben links die Reisevariante wechseln. **Tagesplan** öffnet bei den September-Interrail-Varianten den Barcelona-Pilottag am 4. September. Über die Datumsleiste und die Ortsliste sind die übrigen Stationen erreichbar.
- Bei einem Reisetag mit mehreren Orten zeigt **Ganzer Tag** alle Einträge und ihre Kartenpunkte. Über die Ortsfilter kannst du in einen einzelnen Abschnitt wechseln.
- Unter **Unterkünfte** oder **Entdecken** bis zu vier Karten für die Vergleichstabelle auswählen. **Auswahl prüfen** bzw. **Einplanen** öffnet die Vorschau vor dem Speichern. **Budget** zeigt bekannte aktive Posten und offene Preise. Recherchewerte erscheinen zusätzlich als eigenes Szenario.
- Im **Tagesplan** Stopps für Kartendetails auswählen. Zwischen den Stopps führen Wegzeilen zu Quelle, Zeit und Strecke. Für städtische Verbindungen steht der Fußrouter zur Verfügung. Einen geprüften Weg kannst du für das ausgewählte Datum mit Linie, Dauer, Preis und Quelle hinterlegen.
- **Bahn & Interrail** zeigt importierte Fahrten mit Ortszeiten. In den Pass-Einstellungen zwischen Einzeltickets und Pass mit Reservierungen für das aktive Budget wählen.
- **Daten & Fristen** unterstützt CSV-/JSON-Rechercheoptionen, Kalenderexport, JSON-Auszug und manuelle Fristen. Die Importspalten stehen in der Oberfläche. Das mitgelieferte gesamte Recherchearchiv wird bereits beim Start verarbeitet.

## Persistenz und Datenschutz

Änderungen landen in `private/reiseplan.sqlite`. Für eine vollständige Sicherung den Server beenden und die SQLite-Datei kopieren. Zur Wiederherstellung bei beendetem Server die gesicherte Datei an dieselbe Stelle legen. Der JSON-Auszug ist zur Einsicht und Weiterverarbeitung gedacht. Die Sicherungsdateien und die Tripsy-Schnappschüsse enthalten private Planung und gehören nicht in einen öffentlichen Upload.

Der Server bindet an `127.0.0.1`. Er weist fremde Host- und Web-Ursprünge zurück. Bei der Straßenkarte ruft der Browser den sichtbaren Kartenausschnitt von OpenStreetMap ab. Ein aktiv angeforderter neuer Fußweg überträgt zwei Koordinaten an FOSSGIS. Gespeicherte Fußwege und die AMB-Linienebenen sind lokal verfügbar. `REISEPLAN_OFFLINE=1` schaltet neue Routingabfragen ab. Der URL-Zusatz `?offlineMap` lässt Straßenkacheln weg.

Beim Einschalten des Schweizer Wanderwegenetzes lädt der Browser nur die sichtbaren Kacheln von swisstopo. Die öffentlichen Netzebenen aus Genua, Venedig und Nizza liegen lokal vor.

## Daten und Karten

- Tripsy und das Recherchearchiv sind lesend übernommene Quellen. Lokale Auswahlen, Termine und Preise gelten je Variante. Importierte Verbindungen für 2027 und historische Unterkunftsbeträge sind Planwerte. Der Kurzstatus jeder Quelle ist im jeweiligen Detail sichtbar.
- Straßenkarte und Fußwegedaten © OpenStreetMap-Mitwirkende. Der FOSSGIS-Router liefert berechnete Geometrien und Schätzzeiten. Gesamtverbindungen zwischen Städten sind schematisch.
- Barcelona-Netzgeometrien von Àrea Metropolitana de Barcelona, Abruf am 12.11.2026. Die Netzebenen enthalten Linien und, soweit verfügbar, Haltestellen. Sie liefern keine Fahrplanbestätigung. Bus-Haltestellengeometrien waren im geprüften Datensatz nicht nutzbar.
- Barcelona-Foto von Zarateman, CC0. Leaflet 1.9.4 steht unter BSD-2-Clause. Die Lizenz liegt bei der Bibliothek.

[OpenStreetMap](https://www.openstreetmap.org/copyright) · [FOSSGIS-Routing](https://routing.openstreetmap.de/about.html) · [AMB-Datendienst](https://ide.amb.cat/geoserveispi/rest/services/SIGMIT/CapesAuxiliars/MapServer) · [AMB-Nutzungsbedingungen](https://www.amb.cat/en/web/area-metropolitana/dades-obertes/condicions-d-us) · [CC0-Foto](https://commons.wikimedia.org/wiki/File:Barcelona_-_panor%C3%A1mica.jpg)

## Tests

- `npm test` oder `node --test --test-isolation=none test/*.test.mjs` prüft Datenmodell, Budget, Zeiten, Imports, Persistenz und HTTP-API.
- `npm run test:browser` nutzt installiertes Chrome bzw. Edge mit separatem Profil und separater SQLite-Datei. `REISEPLAN_BROWSER` kann eine andere Chromium-Programmdatei angeben.
- Optional `REISEPLAN_CHECK_TILES=1` für den einzelnen Straßenkartentest und `REISEPLAN_SCREENSHOTS` für einen Screenshot-Ordner setzen.

Den konkreten Funktions- und Teststand enthält **STATUS.md**. Architektur, Herkunft der Daten und UX-Entscheidungen stehen in **DECISIONS.md**.

## GitHub-Checkout ohne private Tripsy-Quelldateien

Auf GitHub werden die vier ursprünglichen `data/tripsy-*.json`-Dateien **absichtlich nicht** gespeichert. Sie enthalten private Reiseinformationen und sind in `.gitignore` ausgeschlossen. Beim Start prüft die App automatisch, ob diese Dateien im lokalen Projektordner liegen. Wenn sie fehlen, kann ein **reduzierter, sichtbarer Forschungsdaten-Fallback** aus den mitgelieferten JSON-Dateien geladen werden. Er ersetzt keinen echten Tripsy-Import. In den August- und September-Schweiz-Varianten fehlen dadurch beispielsweise ursprüngliche Aktivitätsdetails. Keinesfalls die GitHub-Kopie als identisch mit dem letzten lokalen Originalstand behandeln.

Zum Wiederherstellen des vollständigen lokalen Stands die vier Dateien aus dem bisherigen ursprünglichen Projektordner unter `data/` in den neuen Projektordner kopieren, **nicht auf GitHub pushen**. Die Bezeichner sind `tripsy-1297194.json`, `tripsy-1312180.json`, `tripsy-1275516.json` und `tripsy-1273324.json`. Nach dem Neustart werden sie automatisch vorrangig verwendet.

`npm run test:portable` prüft den reduzierten Seed-Fallback ohne private Dateien. `npm test` prüft die umfassenden Integrationsszenarien aus dem ursprünglichen Codex-Lauf und benötigt für einzelne Tests die Original-Snapshots. Für die vollständige Browser-Abnahme auf Windows mit Node 24 zusätzlich `npm run test:browser` ausführen. Ein bestandener Fallback-Test ist **keine** gleichwertige Browser-/Kartenprüfung. Neue Funktionen werden zunächst im separaten Branch `feature/v7-resilient-seed-fallback` erprobt.

## Gemeinsamer Einkaufswarenkorb für Barcelona

Unter **Verpflegung → Selbst kochen** können Koch-Mahlzeiten für einzelne Reisetage gewählt werden. Nach der Auswahl erscheint ein **gemeinsamer Warenkorb** mit den zusammengefassten benötigten Gramm und ganzen Packungen für alle aktuell geplanten Koch-Mahlzeiten **dieser Stadt und dieser Reisevariante**. Die Schaltfläche **Anpassen** ändert Packungszahl und angenommenen Packungspreis. **Zurücksetzen** verwendet wieder die gespeicherte Preisreferenz.

Der Gruppenbetrag wird im Budget **einmal je Stadt** als geplanter Einkauf erfasst und in der Tagesansicht dem ersten geplanten Kochtag zugeordnet. Wenn weitere Koch-Mahlzeiten mehr Packungen erfordern, wird eine bisherige Mengenannahme automatisch angepasst. Die Preise aus dem Recherchearchiv sind weder aktuelle Supermarkt-Verfügbarkeiten noch Rechnungen. Beim Erfassen eines bereits bezahlten Postens für eine Mahlzeit ersetzt die Zahlung deren geschätzten Planwert; weitere Koch-Mahlzeiten behalten ihren eigenen offenen Warenkorbanteil. Kosten für Einkäufe, die tatsächlich mehrere Mahlzeiten decken, bitte so erfassen, dass sie nicht nochmals unter einer anderen Mahlzeit verbucht werden.

Der neue **portabel laufende Chrome-Test** ist `node test/portable-browser.mjs`. Er nutzt auf einem Rechner mit Chrome/Edge ein isoliertes Profil und eine Testdatenbank, benötigt jedoch keine privaten Tripsy-Rohkopien. Die CI-Automation ist unter `.github/workflows/reiseplaner-ci.yml` hinterlegt. `npm run test:portable` prüft zusätzlich Mengenrechnung, Kostenaufteilung, gespeicherte Preisänderungen und Quellendaten.

## Variantenvergleich und nach Reiseziel aufgeschlüsseltes Budget

Unter **Übersicht → Varianten im Vergleich** werden vier getrennte, niemals automatisch zusammengeführte Reisen nach Originalstrecke, bekannten Plankosten, exakten Kostenanteilen der Personen, offenen Preispositionen und voraussichtlichen Pass-Tagen dargestellt. Noch unbekannte Bahn-/Unterkunftskosten verhindern eine endgültige Rangfolge nach Gesamtkosten.

**Budget → Nach Reiseziel und Buchungstag** gliedert die tatsächlich ausgewählten bekannten Beträge nach Stadt und Datum. Der Zustand wird nach jeder Speicherung neu berechnet. Der gesamte Aufenthaltspreis einer Unterkunft wird nur auf den hinterlegten Referenztag gebucht, nicht rechnerisch ohne Grundlage auf Übernachtungen verteilt. Die Tabellen enthalten offene Beträge als gesonderte Zähler, niemals als angenommene 0 €.

## Neues Forschungs- und Umfragepaket vom 12.11.2026

Alle 20 gelieferten Dateien liegen unter `data/research-v02/`. Zur fachlichen Nachvollziehbarkeit zuerst `data/research-v02/INTEGRATION_AUDIT.md` lesen. Das enthält **für jede Datei** ihren Verwendungsort, die bereits implementierte Logik und die offenen Prüfungen. Es wurden 16 JSON-Datensätze plus README, Importvertrag, Datenwörterbuch und Python-Validator archiviert. Das Importmodul `lib/research-v02.mjs` liest die JSON-Dateien getrennt von den alten Reise- und Tripsy-Rohdaten.

**Neue Bedienung:** Unter `Entdecken` können 42 zusätzliche Vorschläge mit den heuristischen Gruppenscores verglichen und nach Interesse sortiert werden. `Unterkünfte → 2027-Suchpreise` zeigt datumsgleiche Unterkunftsreferenzen mit flexiblen persönlichen Zielwerten und offenem Verfügbarkeits-/Checkoutstatus. Unter `Bahn & Interrail` sind Betreiber-Prüfaufgaben und Routingalternativen sichtbar, ohne die ursprüngliche Route zu überschreiben. `Budget` trennt 3 Was-wäre-wenn-Rechnungen von tatsächlich gewählten Kosten; `Reisegruppe` zeigt das dreiköpfige Umfrageprofil, und `Daten & Fristen` zeigt 32 offene Datenbefunde mit Quellen.

**Quellenstatus:** Kein Suchpreis ist automatisch eine bestätigte Buchung. Keine Zugzeit ist automatisch für 2027 buchbar. Kostenlose/Null-Euro-Angaben werden nicht aus fehlenden Preisen abgeleitet. Die vierköpfige `swiss_lakes`-Reise verwendet bewusst nicht die Interessen- und Unterkunftsziele der Interrail-Dreiergruppe.

**Validierung:** `python3 data/research-v02/validate_subset.py` prüft den gelieferten Datensatz. `npm run test:portable` umfasst die neuen Recherche-/Scope-Tests; `node test/portable-browser.mjs` überprüft die Nutzung im Browser. Beide laufen automatisiert über GitHub Actions auf dem separaten Forschungs-Branch. Für die vollständige bestehende Tripsy-/Kartenabnahme die originalen lokalen `data/tripsy-*.json`-Dateien auf dem Rechner bereithalten und die alten `npm test`/`npm run test:browser`-Suiten zusätzlich ausführen.

## Provider-Prüfungen, 2027-Verkaufsfenster und neue Preis-Snapshots

Der Branch `feature/v7-verification-sources-2027` ergänzt die im Research-v0.2-Paket enthaltenen Referenzen um **nachprüfbare Schritte**. `NEXT_CHECKS_2027.md` erklärt, welche Anbieterinformationen zum 12.11.2026 tatsächlich vorliegen und was für August/September 2027 noch nicht veröffentlicht bzw. nicht unabhängig geprüft ist.

Unter **Bahn & Interrail** stehen neben jeder ursprünglichen Verbindung die offiziellen SNCF-/DB-/Interrail-Verkaufsregelungen und ein datumsbezogenes **Orientierungsdatum** (kein zugesagter Ticketstart). Unter `Prüfung vormerken` kannst du bewusst eine lokale Wiedervorlage erzeugen und später unter `Daten & Fristen` bearbeiten.

Unter **Unterkünfte → Anbieter prüfen** beziehungsweise **Bahn → Eigene Prüfung** kannst du Checkliste, Datum, Beleglink, eigene Notizen und einen beobachteten EUR-Preis lokal und variantenbezogen speichern. Das Dokumentieren ist **keine externe Buchung**. Nur bei aktiver gewählter Unterkunft, Beleglink und vollständiger selbst dokumentierter Prüfung kann ein neuer Preis ausdrücklich als **Planbetrag** übernommen werden; der alte Such-Snapshot bleibt erhalten. Bei Änderung der Personenanzahl wird eine zuvor für andere Gruppengröße dokumentierte Eigenprüfung als veraltet angezeigt.

Drei zusätzliche Barcelona-Suchbeobachtungen (03.–06.09.2027, drei Erwachsene) liegen in `data/provider-checks/booking-barcelona-20261112.json`. Sie werden nur für exakt passende September-Dreiergruppen als alternative Unterkünfte angezeigt und sind nicht automatisch aktiv. Die genaue Tarif-/Zimmerzuordnung, Steuern und Endpreise wurden **nicht** als bestätigter Checkout ausgegeben.

Im **Planungs-Check** und der **Karte** wird sichtbar, dass Barcelonas lokale Fahrplanpakete am 18.06.2027 enden und somit keine minutengenauen September-2027-Verbindungen liefern. Externe Fußweg- und ÖPNV-Planer bleiben über ihre vorhandenen Links nutzbar.

Testbefehle: `npm run test:portable` für Modell/Sicherheit, `node test/portable-browser.mjs` für echte Chrome-Bedienung, `npm test` und `npm run test:browser` für die vollständige Originalabnahme auf dem lokalen Windows-Rechner mit privaten `data/tripsy-*.json`.

Unter **Übersicht → Offizielle Reiseregeln für 2027** findest du jetzt für die jeweilige Reisevariante den Venedig-Zugangsentgelt-Kalender, die veröffentlichten Oeschinensee-Gondelbetriebszeiten, die Mindestalter-/Führerscheinanforderung für SIXT Schweiz (bei der vierköpfigen Seenreise) sowie die Eiffelturm-2027-Tarifwarnung. Jeder Eintrag hat einen konkreten Link zur offiziellen Quelle. Termine sind publizierte Regel-/Saisonangaben, **keine** garantierte Ticket- oder Fahrzeugverfügbarkeit. Preisunbekannt bleibt Preisunbekannt und wird nicht auf 0 € gesetzt.

## Vollständige lokale Tests mit privaten Tripsy-Dateien

Für die frühere vollständige Core-/Browser-Abnahme gibt es jetzt `Pruefen.cmd` (Windows) und `TEST_LOCAL.md`. Das Skript erkennt fehlende private Originaldateien ausdrücklich als **Teilprüfung**, führt sie nur lokal aus und meldet ein fehlgeschlagenes Ergebnis ohne falsche Erfolgsmeldung. Keine Originaldateien werden automatisch nach GitHub übertragen.

## Vollständiger Karten-Explorer und Tagesplan aus allen bisherigen Daten

Im Menü **Karte** gibt es jetzt einen gemeinsamen Karten-Explorer für **alle vier Reisevarianten und ihre jeweiligen Städte**. Hotels/Hostels sind **blau**, Restaurants/Cafés **orange**, Supermärkte/Einkauf **gelb**, Aktivitäten **grün** und Verkehrspunkte **lila**. Suche, Stadt-/Gesamtfilter und eine scrollbare Liste zeigen alle bereits recherchierten Kandidaten, auch wenn präzise Standortkoordinaten noch fehlen. Die Details enthalten die *tatsächlich vorhandenen* Tätigkeits-/Restaurantbeschreibungen, Speisen, Preise, Öffnungszeiten, Unterkünfte, Betten/Küche/Bad/Storno, Quellstatus und anklickbare Anbieterbelege; Unbekanntes bleibt ausdrücklich offen.

**A nach B:** „Als Start“ und „Als Ziel“ an zwei Punkten wählen. **Zu Fuß** nutzt den bereits bestehenden OSRM-/OSM-Router mit echter Geometrie oder gibt einen offenen Wegstatus zurück. **ÖPNV** nutzt vorhandene GTFS-Fahrpläne nur im echten Gültigkeitszeitraum, ansonsten wird auf externe Betreiber-/Navigationslinks verwiesen. Abfahrten/Preise für September 2027 werden nicht aus alten Referenzen erfunden.

**Tagesplan:** Reisetag oben auswählen, Vorschläge ansehen, gewünschte Aktivitäten bewusst in den vorhandenen Tagesplan übernehmen. Das frühere vollständige Forschungs-ZIP wurde nochmals abgeglichen: 21 Ortspakete und 14 optionale klassische September-Tagesideen sind als `data/research-v02/city-coverage-v02.json` und `day-suggestions-v02.json` neu berücksichtigt. Sie enthalten keine eigenständigen Buchungen und verändern keine Tripsy-Originalroute.

Ausführliche Anleitung: `MAP_EXPLORER.md`. Ehrliche Einzelabdeckung pro Reise und Ort: `MAP_DATA_COVERAGE.md`. Aktuelle Auswertung: `npm run report:map` oder `node test/map-coverage.mjs --json`. Die Tests bleiben im Node-24-GitHub-Workflow; private vollständige Tripsy-Dateien müssen weiterhin auf dem Originalrechner separat mit `Pruefen.cmd` geprüft werden.
