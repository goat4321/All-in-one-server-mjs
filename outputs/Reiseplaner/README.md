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
