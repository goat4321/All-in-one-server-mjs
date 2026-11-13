## v1.3 – September-2027-Anbieterpreise, Standortabgleich und Prüfung (13.11.2026)

**Entwicklungsbranch `feature/v7-data-day-accommodation-rail`, PR #5, noch nicht gemergt oder öffentlich deployed.**

Unter **Unterkünfte** zeigt der neue Quellenvergleich 60 Booking.com-Suchergebnisse, je zehn für Paris, Barcelona, Sète, Nizza, Genua und Venedig. Die Daten wurden am 13.11.2026 für **drei Erwachsene und ein Zimmer** zu exakt diesen Aufenthalten abgefragt:

| Stadt | Zeitraum |
|---|---|
| Paris | 01.–03.09.2027 |
| Barcelona | 03.–06.09.2027 |
| Sète | 06.–08.09.2027 |
| Nizza | 08.–10.09.2027 |
| Genua | 10.–12.09.2027 |
| Venedig | 12.–14.09.2027 |

Sortierbar nach Preis, Anbieterbewertung (/10) und Name; eigener Budgetfilter, Anbieterlink, Gruppensuchwert sowie rechnerischer Preis pro Person/Nacht. Keine automatische Auswahl oder Budgetanrechnung. **Suchwerte sind keine bestätigten Checkouts**: Steuer-/Pflichtgebühren, drei Betten im konkreten Zimmer, Storno, Buchbarkeit und finaler Tarif sind noch ungeprüft. Bei anderen Reisezeiträumen oder Gruppengrößen werden diese Snapshots nicht angezeigt.

Unter **Daten & Fristen → Standortprüfung** bleiben 17 öffentliche Gebäude ohne unabhängige Einzelverortung offen. 13 erhielten Anbieter-Koordinaten als separate Recherchehinweise, vier keinen Treffernachweis und kein Punkt wurde automatisch auf die Karte übernommen. Der Widerspruch bei **A due passi dalla Lanterna** in Genua (bisher Via Giuseppe Ratti 4; jetzt Anbieter Via Venezia 50a/6 mit unterschiedlichem Listing-Link) ist dokumentiert und wird nicht stillschweigend überschrieben.

**Datenpaket:** `data/research-v13/` enthält JSON und CSV für 60 Anbieter-Suchergebnisse sowie JSON und CSV für 17 Standortprüfungen. Siehe [PHASE_13_PROVIDER_RESEARCH.md](PHASE_13_PROVIDER_RESEARCH.md).

---
## v1.2 – Bedienqualität, Tutorial, Bilder, Smart Filter und Reisevorbereitung (13.11.2026)

**Status: Im GitHub-Entwicklungsbranch `feature/v7-data-day-accommodation-rail`, Pull Request #5; noch nicht gemergt oder öffentlich deployed.** Der bisherige v1.1-Abschnitt ist ein historischer Zwischenstand. Die folgenden Änderungen ergänzen seine bestehenden Detailprofile, Quellenansichten, Karten-Popups und die lokale Gruppenbewertung.

### So verwendest du die neuen Funktionen
1. Branch `feature/v7-data-day-accommodation-rail` auf GitHub auswählen, **Code → Download ZIP**, ZIP entpacken.
2. Unter `outputs/Reiseplaner` **Start.cmd** starten (benötigt Node.js 24) und lokal `http://127.0.0.1:4173` öffnen. Eine laufende alte Instanz vorher beenden. Die private SQLite-Datei `private/reiseplan.sqlite` vor dem Ordnerwechsel sichern, nicht zu GitHub hochladen.
3. **Tour** rechts oben startet jederzeit eine **siebenteilige geführte Einführung** in Planung, Karten, Unterkunftsvergleich, Zugrecherche, Budget, Gruppenabstimmung und Quellenprüfung. Mit Zurück/Weiter bzw. den Schrittpunkten navigieren, mit Esc oder Beenden abbrechen. Die Tour ändert keine Reisebuchung und kein Budget.
4. **Budget → Tagesbudget-Simulator**: Tag und frei wählbare Zusatzannahmen für Essen, Nahverkehr, Aktivitäten sowie das Tagesziel pro Person einstellen. Vorhandene Hotelbeträge werden ausschließlich für diese Szenarioansicht centgenau auf Nächte verteilt. Die normale Budget- und Zahlungslogik wird nicht verändert; unbekannte Preise bleiben ausdrücklich offen.
5. **Unterkünfte**: Nachtbudgetfilter, Entfernung bis 15 Minuten *bei tatsächlich berechnetem Bahnhof-Fußweg*, Bettenprüfung für die Gruppengröße und Preis-/Quellenstatus auswählen. Bis zu vier Unterkünfte nebeneinander vergleichen und die Auswahl vollständig leeren.
6. **Entdecken**: Filter für 0-€-Referenzen, Wasser/Strand, erwähnte Schwimmmöglichkeiten und Gruppenfavoriten mit mindestens zwei Stimmen. Diese Text-/Referenzfilter sind keine Öffnungs-, Sicherheits- oder Verfügbarkeitsbestätigung.
7. **Alle Details & Quellen → Foto zur Galerie hinzufügen**: bis zu fünf eigene, individuell mit HTTPS-Fotolink, Lizenz/Urheber und Quellenlink hinterlegte Bilder pro Eintrag. Bereits gespeicherte Einzelfotos bleiben verwendbar. Die Detailansicht zeigt eine Mehrbildgalerie, Quellen und Möglichkeit zum Entfernen einzelner eigener Fotos. Hinzugefügt sind zwei kuratierte Wikimedia-Commons-Referenzen zu Rialtobrücke und Oeschinensee (insgesamt fünf kuratierte Sehenswürdigkeiten). Keine automatisch übernommenen Hotel-/Airbnb-Anbieterbilder oder privaten Adressen.
8. **Daten & Fristen → Fortschritt der Reisevorbereitung** zeigt getrennt die abgedeckten Unterkunftszeiträume, vollständig selbst dokumentierte Hotel- und Zugprüfungen, Planposten mit bekannten Preisen und erledigte lokale Fristen. Eine Eigenprüfung stellt keine Bestätigung durch einen Anbieter dar.

### Qualität und Grenzen
- Vollständiger CI-Lauf für die Funktionsentwicklung (Commit `41730270`): [#43474139218](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43474139218) bestanden. Enthält JavaScript-Syntaxchecks, Forschungsdatenvalidierung, portable Node-Tests, Kartenbericht, echten Headless-Chrome-Browsertest und HTTP-Starttest. Die neue Galerie, der Simulator, die Filter und die Fortschrittsanzeigen besitzen Regressionstests.
- Datenqualität bleibt getrennt von Bedienqualität: 642 variantenbezogene Karteneinträge; 413 mit Quellen-/Gebietsposition, 229 ohne belegten individuellen Pin. 42 private Airbnb-Wunschlisteneinträge haben keine frei verwendbare genaue Privatadresse. Historische Preisbeispiele sind keine datierten September-2027-Checkouts.
- Fehlende 2027-Bahnbuchbarkeit, Endpreise, Steuern, Stornoregeln, konkrete Hotelzimmer, Menükosten und Bildrechte pro Objekt werden **nicht** erfunden. Bisher fehlen für die meisten Einträge individuell geprüfte Ortsfotos und aktuelle Anbieterinformationen.
- Lokale Gruppenstimmen, Bildquellen und Reiseänderungen liegen in der jeweiligen privaten SQLite-Reisevariante. Kein Live-Mehrgeräteabgleich, kein automatisches Booking und kein Hosting im Internet.

[Implementierungs- und Prüfprotokoll](PHASE_12_GUIDE_VISUAL_QUALITY.md)

---

## v1.1 – Fünf Ausbauschritte: Detailprofile, Bilder, Budget, Unterkunftsvergleich, Gruppenwertung

**Stand 13.11.2026 · Entwicklungsbranch (nicht deployed)**

1. **Einheitliche Ortsprofile:** Jeder Eintrag (Unterkunft, Airbnb, Aktivität, Restaurant und Verkehr) verwendet ein identisches, belegorientiertes Detailprofil. Preise, Bewertungen, Küchen-/Zimmerausstattung, Standortgenauigkeit, Öffnungszeiten und Quellen erscheinen getrennt. Fehlende Angaben heißen ausdrücklich *offen*.
2. **Fotos und Karten-Popups:** Das Karten-Popup zeigt Namen, Quelle, Preis, Bewertung und Google-Maps-Link. Für **drei** namentlich verifizierte Sehenswürdigkeiten (Sagrada Família, Park Güell, Eiffelturm) sind Wikimedia-Commons-Bilder mit Urheber und CC-BY-SA-4.0-Lizenzreferenz hinterlegt. Für andere Einträge bleibt der gestaltete Platzhalter, bis ein Foto bewusst im Detaildialog mit HTTPS-Bildlink, Urheber-/Lizenztext und Quellenlink hinterlegt wird. Bilder werden **nicht** ungeprüft von Booking.com/Airbnb kopiert. Selbst hinterlegte Bildlinks sind je Reisevariante gespeichert und überschreibbar. Der Browser lädt externe Bilder direkt vom Bildanbieter.
3. **Preis-Einordnung:** Im Tab **Unterkünfte** ist das **Nachtbudget pro Person** standardmäßig mit einem frei veränderbaren Beispielwert von 35 € voreingestellt und im lokalen Browser gespeichert. Karten zeigen Preis/Person/Nacht nur bei bekannten Daten, passenden Personen und Nächten. Sortieren nach Betrag bzw. Filtern nach Budget ist möglich. *Im Budget* bedeutet ausschließlich unter der selbst gewählten Grenze – **kein** angebliches Stadtmarkt-Preisranking. Airbnb-Wunschlistenpreise sind datierte Stichproben, keine bestätigten Checkoutpreise und gehen nicht in die Reiseausgaben ein.
4. **Vierer-Vergleich:** Neben der bisherigen Vergleichstabelle erscheinen nebeneinander bis zu **vier** Unterkunftskarten. Bewertungen, Betten, Küche, Badezimmer, Gebühren, Stornierung, tatsächliche Bahnhof-Fußwege und offene Prüfpunkte werden getrennt ausgewiesen. Nur passende, gleich datierte EUR-Referenzen ohne Airbnb-Suchwert sind untereinander eingeschränkt vergleichbar. Keine automatische *beste Unterkunft* und keine fiktive Ersparnis.
5. **Gruppenbewertung:** Bei Unterkünften/Aktivitäten und auf **Reisegruppe → Gemeinsam entscheiden** kann für jedes vorhandene Profil von jeder Person (p1 usw.) ein Wert von 1 bis 5 gespeichert bzw. gelöscht werden (0 = keine Stimme). Durchschnitt und Anzahl stimmenbezogener Personen werden angezeigt. Stimmen werden **nur innerhalb der jeweiligen Reisevariante in der lokalen SQLite-Datenbank** gespeichert; es gibt **keine Accounts, kein Live-Voting und keine gemeinsame Fernsynchronisierung**.

**Kurzer Funktionstest:** `Start.cmd` starten → **Karte** → Ort antippen → Orts-Popup und „Alle Quellen & Details“; in den Details ein optionales Quellenfoto hinterlegen. **Unterkünfte** → Nachtbudget ändern → zwei Angebote mit **Vergleichen** auswählen. **Reisegruppe** → **Gemeinsam entscheiden**, eine Option mit **Stimmen bearbeiten** bewerten. Alle Aktionen verändern weder Fremdanbieterpreise noch Reservierungen. Die bisherigen Datenqualitätsgrenzen (413/642 örtliche Kartenpunkte und 229 nicht genau lokalisierte variantengebundene Einträge) bleiben bestehen.


# Reiseplaner

Im Kartenpanel lassen sich je nach Stadt **Metro**, **Vaporetto**, **Tram**, **Bus** oder das amtliche Schweizer **Wanderwegenetz** einblenden. In **Unterkünfte** werden Wege ab den ausgewiesenen Bahnhöfen verglichen. **Budget → Nahverkehr** vergleicht die Referenztarife für das gewählte Gültigkeitsfenster.

[AMT Genova](https://www.amt.genova.it/amt/societa_trasparente/altri-contenuti/open-data/) · [ACTV Venezia](https://www.dati.venezia.it/?q=node%2F261)

## Start unter Windows

1. **Start.cmd** im Explorer doppelklicken. Node.js 24 ist auf dem verwendeten Rechner vorhanden.
2. Im Browser **http://127.0.0.1:4173** öffnen, falls Windows den Tab nicht selbst öffnet.
3. Das Konsolenfenster geöffnet lassen. Mit **Strg+C** beenden.

Alternativ im Projektordner `node server.mjs` starten. Leaflet ist lokal enthalten. Die App benötigt keinen Installations- oder Buildschritt. Bei belegtem Port den laufenden Reiseplaner öffnen oder `REISEPLAN_PORT` auf einen freien Port setzen.

## Neueste Entwicklungsfassung öffnen und Datenqualität prüfen (13.11.2026)

**Achtung:** Diese v0.9-Version liegt im Branch
`feature/v7-data-day-accommodation-rail`, im Draft-PR #5, und ist noch nicht
unter einer eigenen Internetadresse bereitgestellt.

1. In GitHub [PR #5](https://github.com/goat4321/All-in-one-server-mjs/pull/5)
   öffnen, zum Repository wechseln und den Branch `feature/v7-data-day-accommodation-rail` wählen.
2. **Code → Download ZIP** wählen, heruntergeladenes Archiv entpacken.
3. Ordner `outputs/Reiseplaner` öffnen und unter Windows **Start.cmd** doppelklicken.
4. Falls sich nicht automatisch ein Tab öffnet:
   **http://127.0.0.1:4173** in einem Browser auf demselben PC öffnen.
5. `Start.cmd` benötigt **Node.js 24**. Mit `node --version` im Terminal prüfen.
   Alternativ im Reiseplaner-Ordner `node server.mjs --open` ausführen.

**Wichtig bei einer älteren Installation:** Den Server vorher beenden und
`private/reiseplan.sqlite` sichern; beim Wechsel in einen neuen ZIP-Ordner
wird die alte lokale Datenbank nicht automatisch mitgenommen. Die Datei nicht
öffentlich auf GitHub hochladen.

**Kartendaten, Stand 13.11.2026:** 642 variantenspezifische Einträge,
413 mit nachvollziehbaren Standort-/Gebietspunkten, 229 ohne präzise eigene
Koordinaten. 175 verschiedene Objekte wurden im Rechercheverlauf neu verortet,
115 verbleiben noch ungeklärt. **Daten & Fristen** zeigt für jeden offenen
Eintrag eine konkrete deutsche Begründung, nächste Prüfschritte, bekannte
veröffentlichte Adressen, den Originalquellenlink und Google Maps. Die
50 öffentlich recherchierten Hotel-/Geschäftsadressen umfassen 33 mit
Geometrie und 17 mit lediglich belegter Postanschrift; **42 private Airbnb-Adressen**
werden nicht geraten.

Geprüfter GitHub-CI-Lauf: [Run #43429832835](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43429832835),
62/62 Node-Modelltests, Browser- und Server-Smoke-Test erfolgreich.

Weitere Details: [PHASE_9_GEO_FINAL_AND_OPEN.md](PHASE_9_GEO_FINAL_AND_OPEN.md).

## Neues Design: Interaktives Route Studio und Kartenstile (13.11.2026)

Im **Karten-Explorer** ist die oberste Gesamtstrecke jetzt als anklickbare
**Städteleiste** verfügbar. Ein Klick auf eine Station öffnet direkt den
entsprechenden Kartenabschnitt. Die Verbindungslinie zwischen Städten bleibt
ausdrücklich schematisch – sie ist kein berechneter Zugfahrplan oder Fußweg.

Im **Route Studio**:

1. In **Karte** nach Ort/Restaurant/Aktivität filtern und für zwei bis acht
   geokodierte Aktivitäten in derselben Stadt auf **Zur Mehrstopp-Route** klicken.
2. Die grafische Stopp-Leiste zeigt Nummern, Namen und bereits belegte
   Fußwege. Ein Stopp ist anklickbar; **Zurück/Weiter** springt durch die Tour.
3. **Alle Etappen** zeigt alle Strecken, **Etappe hervorheben** blendet
   nicht gewählte Etappen visuell zurück. **Ganze Tour zeigen** zoomt auf die
   geplanten Stopps. Stopps sind auch direkt auf der Karte anklickbar.
4. **Grün durchgezogen und dezent animiert** ist nur eine tatsächlich über
   den Fußrouter berechnete Straßen-/Weggeometrie. **Braun gestrichelt** ist
   ausdrücklich nur die Luftlinie zwischen zwei belegten Orten; eine noch
   ungeprüfte Etappe bekommt **keine** erfundene Gehzeit, Distanz oder Kosten.
5. **Fußwege und Zeiten berechnen** lädt bestätigte Fußwege. Erst die
   separate bewusste Übernahme verändert den Tagesplan. Externe Google-Maps-
   ÖPNV-Links sind keine automatisch geprüften September-2027-Fahrpläne.

Das **Kartenlook**-Menü bietet **Klassisch, Midnight und Sand**. Alle drei
nutzen dieselben lizenzierten Straßenkacheln mit einer lokalen CSS-Farbgebung;
keine Satellitenbilder oder neuen Kartendatenanbieter werden vorgetäuscht.
Die Einstellung wird nur lokal im Browser gespeichert. **Großansicht**
vergrößert die Karte, ohne Daten zu verändern. Für Menschen mit aktivierter
Systemeinstellung *Bewegung reduzieren* ist die Routenanimation deaktiviert.

Unter **Route von A nach B** gibt es zusätzlich **Start & Ziel tauschen**,
**Route vergrößern** und einen hervorgehobenen Quell-/Ergebnisstatus.
Fehlende Fahrpläne, Routen oder genaue Positionen bleiben ausdrücklich
als unbestätigt gekennzeichnet.

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

## Prioritäten 1–4 · Ergänzungen vom 13.11.2026

Details und offene Datenlücken: `PHASE_1_TO_4.md`. Die Karte/Entdecken-Ansicht enthält nun 39 weitere (als 2026er Recherche gekennzeichnete) Restaurants, Cafés und Einkaufsmöglichkeiten aus 12 Städten sowie sechs offizielle Eintritts-/Öffnungsinformationen zu beliebten Sehenswürdigkeiten. Nicht verfügbare Preise und genaue Koordinaten werden weiterhin als unbekannt ausgewiesen. Unter `Kartenstandort prüfen` können vorhandene Adressen mit einer **einzelnen nutzerinitiierten** OpenStreetMap/Nominatim-Suche abgeglichen und ein Treffer lokal übernommen werden – nie automatisch.

Unter **Karte → Mehrstopp-Tagesroute** lassen sich 2–8 bestehende Punkte in einer Stadt sammeln, sortieren, die tatsächlichen Fußwege berechnen und nach Konfliktprüfung in den Tagesplan übertragen. Ohne echte Wege bleibt die Zeitplanung unvollständig. **Unterkünfte** bieten jetzt prüfbare EUR-Gesamtpreise, Person/Nacht-Werte, Bahnhof-Wege, Betten-/Steuer-/Storno-/Checkoutstatus und entsprechende Sortieroptionen. **Bahn & Interrail** zeigt eine eigene Pass-Tage-Prüfung, Nachtzugkonstellationen, knappe Anschlüsse sowie ausdrücklich unbestätigte 2027er Fahrpläne und Reservierungen.

Vor Änderungen an echten Buchungen oder Daten der Anbieter muss der Nutzer die Aktion separat beim Anbieter bestätigen. Die Website tätigt keine Käufe und ist weiterhin eine lokale Node.js-Anwendung; `main` wurde nicht geändert.
