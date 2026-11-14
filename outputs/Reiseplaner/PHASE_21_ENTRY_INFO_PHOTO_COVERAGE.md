# Phase 21 – Für jeden Eintrag sichtbar: Datenabdeckung, Fotolücken und lizenzierte Bildsuche

**Stand: 14. November 2026.** Entwicklungsbranch `feature/v7-data-day-accommodation-rail`, Draft-PR #5. Kein Merge, keine Buchung, keine automatische Änderung der Reisegruppendaten.

## Was ist tatsächlich vollständig?

**Nicht jeder Katalogeintrag hat vollständige Informationen und ein eigenes Bild.** Der letzte Report erfasst **829 variantebezogene Einträge** in vier Reisevarianten, mit **510 Kartenpunkten** und **319 Einträgen ohne individuell nachgewiesenen Kartenpunkt**. Mehrfach genutzte Orte können in mehreren Varianten enthalten sein, daher sind das **keine 829 verschiedenen physischen Sehenswürdigkeiten**.

Die vorhandenen manuell zugeordneten Wikimedia-Commons-Fotoregeln sind von **21 auf 25** erweitert. Diese 25 Regeln können mehr als 25 verschiedene Einträge mit demselben **zutreffenden Motiv** abdecken. Sie sind *keine* Foto-Abdeckungszahl, weil je Variante private manuelle Fotos existieren können. Die exakten pro-Reise-Zahlen berechnet nun `entryCompletenessReport` beim Öffnen.

Vorheriges V20-Forschungsarchiv bleibt unberührt: 57 einzeln geprüfte Zusatzaktivitäten (24 zuordenbare Quellenpositionen), 35 Anbieter-Unterkünfte (22 erneut gefunden), 29 date-only-Verbindungen, 40 Essens-/Abendideen, 8 separat verlinkte Indoor-Sportangebote. Neu in diesem Durchgang sind das Datenlücken-UI, drei neue individuell geprüfte Commons-Fotos, die quellenkonforme Wiederverwendung eines älteren Klöntalersee-Fotos in der Region Glarus und einige Anbieter-Detailnachträge. **Keine** Zahl darf als „alle Bilder geladen“, „alle Anbieter bestätigt“ oder „alle Einträge erledigt“ ausgelegt werden.

## Datenabdeckungsseite

In **Daten & Fristen** wird der Bericht aus dem aktuellen Katalog und dem für diese Reisevariante gespeicherten Zustand **dynamisch neu erstellt**. Zählt alle Einträge der Reisevariante (Duplikat-IDs nur einmal) und berichtet:

- Einträge, lizenzierte Fotozuordnungen, ausreichend lange Objektbeschreibung, EUR-Vergleichspreis, externe Quelle, geografische Position und Einträge ohne offensichtliche Lücken;
- präzise offene Bereiche je Eintrag: **Foto**, **Beschreibung**, **Preis**, **Öffnungszeiten**, **Position / Koordinatenherkunft**, **Quellenlink**, **Bettaufteilung/Steuern/Checkout** bei Hotel und **2027-Fahrplan** bei Transport;
- alle unvollständigen Einträge, nach Ort gruppiert, mit **Details & offene Quellen** und **Bild suchen** direkt in der Liste;
- eine Erklärung pro fehlendem Feld und den nächsten Prüfschritt.

**Wichtig:** Ein vorhandener Link bedeutet nicht, dass seine Inhalte noch aktuell oder sein Preis final sind. Ein Foto kann trotz gültiger Lizenz falsch zugeordnet sein; der Benutzer wählt das Motiv daher kontrolliert. Bei Konzepten ohne konkreten Treffpunkt ist ein einzelner Kartenpin bewusst nicht sinnvoll.

Betroffene Module:
- `public/entry-completeness.mjs` – zentrale Qualitätslogik für echte Einträge;
- `public/entry-coverage-ui.mjs` – filterarme, kompakte und aufklappbare vollständige City-/Eintragsliste;
- `public/place-profile.mjs` – Abschnitt „Was fehlt noch?“ bei **jedem** Objekt;
- `public/views.mjs` und `public/design-round2.css` – Einbindung und responsive Darstellung;
- `test/entry-photos-and-coverage.test.mjs` – vollständiger Katalog, Datenschutz, Lizenzfilter.

## Wikimedia Commons: Bilder direkt im Reiseplaner hinzufügen

1. Ein Objekt öffnen (alternativ **Daten & Fristen** → Stadt → **Bild suchen**).
2. **„Lizenzfotos suchen“** öffnet den Dialog `commons-photo-search`.
3. Der Browser fragt die öffentliche **MediaWiki Commons API** nach dem Ortsnamen und der Stadt, nur Namespace 6 (Dateien), mit `imageinfo` (Autor, Lizenz, Lizenzlink, Thumbnail).
4. Nur JPEG/PNG/WEBP, sichere HTTPS-Bildlinks, Commons-Quellseite, **vollständige Urheberangabe** und erkannte freie Lizenzen **CC BY**, **CC BY-SA**, **CC0** oder **Public Domain** kommen zur Auswahl. NC/ND bzw. fehlende Urheber-/Lizenzdaten werden ausgeschieden. Freies Motiv != automatisch geographisch richtig.
5. Ein Vorschaubild auswählen, dessen **Identität** sorgfältig prüfen und **„Dieses Motiv übernehmen“** anklicken. Das ordnet die Bild-URL mit Urheber/Lizenz und Commons-Dateiseite **nur dieser Reisevariante** und dem ausgewählten Eintrag zu; max. fünf eigene Fotos pro Ort. Die private JSON-/SQLite-Datenlogik validiert und speichert lokal.
6. In der Kartenliste und in den Profil-/Popup-Karten erscheint das Bild, inklusive Herkunftslink in den Details. Bestehende Fallback-Symbole bleiben, wenn ein Bild fehlt, offline ist oder vom Host blockiert wird.
7. Bei Commons-API-Timeout/Netzwerksperre: **„Suche direkt auf Wikimedia Commons öffnen“** und danach **„Bildlink manuell ergänzen“** (HTTPS-Direktlink, Urheber und Lizenz, Datei-/Lizenzseite).

**Technische Einschränkung:** Die JavaScript-/API-Integration ist implementiert und der Lizenzfilter lässt sich anhand kontrollierter Antworten testen. Ein echter Live-API-Aufruf kann in dieser Entwicklungsumgebung derzeit nicht sicher durchführt werden; dies ist keine bestätigte hundertprozentige externe Bildabdeckung. Die Anzeige ist ein Opt-in-Verfahren, keine automatische Lizenzgarantie. Bildurheberrecht und motivische Richtigkeit bleiben zu prüfen. Wikimedia Commons weist darauf hin, dass CC-Lizenzen unterschiedliche Auflagen haben und vom Uploader angegebene Rechte ohne Gewähr sein können.

**Quellendokumentation:**
- https://www.mediawiki.org/wiki/API:Imageinfo
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en
- https://www.mediawiki.org/wiki/Extension:CommonsMetadata

## Drei neue individuell lizenzierte Motive

| Darstellung | Fotodatei | Zuordnung | Urheber / Lizenz |
|---|---|---|---|
| Sète: Mont Saint-Clair | [Sète depuis Mont Saint Clair.jpg](https://commons.wikimedia.org/wiki/File:S%C3%A8te_depuis_Mont_Saint_Clair.jpg) | `sete` und `mont saint-clair` | Einaz80, CC BY-SA 4.0, Blick **vom** Hügel |
| Genua: Nervi-Promenade | [Passeggiata Anita Garibaldi.jpg](https://commons.wikimedia.org/wiki/File:Passeggiata_Anita_Garibaldi.jpg) | `genoa` und Nervi-Promenade/Parchi di Nervi | Tiia Monto, CC BY-SA 3.0 |
| Appenzell: Altstadt | [Hauptgasse Appenzell.jpg](https://commons.wikimedia.org/wiki/File:Hauptgasse_Appenzell.jpg) | `appenzell`, Altstadt-/Hauptgasse-Objekte | Tobyc75, CC BY-SA 3.0 |

Das bereits lizenzierte Klöntalersee-Bild wird nun zusätzlich verwendet, wenn eine Klöntalersee-Aktivität als `glarus` statt `kloental` abgelegt ist. Ebenso erfasst das bestehende Seealpsee-Bild auch die in `appenzell` erfasste Wasserauen–Seealpsee-Wanderung. Das Bild zeigt ein **Ziel bzw. einen Teil des Gebietes**, nicht die gesamte Wanderroute.

## Bestätigte Detailergänzungen zu bisherigen Aktivitäten

- **Èze, optionaler Jardin Exotique:** Offizielle Garten-Website nennt September täglich 09:00–19:30 und Erwachseneneintritt 10 €, Studententarif 6 € mit Nachweis. Das ist ein **separates, freiwilliges Ticket**, nicht Eintritt für das Dorf und nicht als obligatorischer Reisebetrag zu rechnen. Der veröffentlichte Tarif ist keine 2027er Checkout-Garantie. Quelle: https://jardinexotique-eze.fr/en/informations/
- **Venedig, Lido und Murano/Burano:** ACTV veröffentlicht Rolling Venice Card 6 € plus 72h Jugendticket 27 € (6–29 Jahre) als **33 € Transportpaket**; nicht doppelt als Aktivitäts- und Fahrkosten addieren. Einzelne Ausstellungen und Strandeinrichtungen können extra kosten. Quelle: https://actv.avmspa.it/en/content/venice-urban-services
- **Grindelwald First:** Die Betreiberseite nennt 2166 m Höhe und dynamische Gondeltickets („ab CHF 38“ in englischer und „ab CHF 36“ in deutscher Ansicht). Ohne konkreten Kaufumfang und Datum keine zuverlässige 2027er Rundfahrt-Summe. Quelle: https://www.jungfrau.ch/en-gb/grindelwaldfirst/

## Was sich nicht seriös vollständig automatisieren lässt

**Unterkünfte:** Eine Booking.com-/Airbnb-Suchtrefferliste erlaubt nicht automatisch das Kopieren und Veröffentlichen aller Hotel- und Zimmerbilder. Neben den Rechten muss jedes Motiv wirklich das ausgewählte Hotel und im Idealfall **dieselbe Zimmerkategorie** zeigen. Die externe Originalangebotsseite kann geöffnet werden; für eigene Galerien werden eigene, ausdrücklich freigegebene oder individuell lizenzierte Motive benötigt.

**Restaurants:** Menüs, Speisenpreise und Öffnungszeiten wechseln. Nur ein konkreter Betreiber-/Menübeleg darf den 2027er endgültigen Preis ersetzen, wenn Datum/Leistung tatsächlich übereinstimmen. Allgemeine Food-Ideen bleiben bis zur Auswahl eines Anbieters allgemeine Ideen; kein Restaurantfoto für ein generisches Picknick behaupten.

**Verkehr:** Auch ein Foto eines Bahnhofs beweist weder eine fahrplanmäßig bestehende 2027er Verbindung noch reservierbare Passplätze. Eine symbolische Bahnillustration ist dafür die bessere Wahl.

**Natur und längere Wege:** Ein See-, Park-, Strand- oder Wanderweg kann einen repräsentativen Ortsbereich als Foto haben, aber nicht notwendig einen exakten Eingang/Einzelpin. Bestehende geografische Qualitätskennzeichnung bleibt erhalten.

## Ausbauplan bei Wunsch nach nahezu vollständiger Bildabdeckung

1. Für exakte benannte POIs in der datengetriebenen Eintragsliste zusätzlich Wikidata-ID oder OSM-ID nach Herkunft belegen.
2. Automatischer Batch-Prozess zu Commons-Dateien über **Wikidata P18** oder Commons-Suche. Nur lizenzierte Treffer mit URL, Autor, CC-Lizenz, Licence-URL, Abbildungsmotiv und Identitätsreferenz übernehmen; fragliche Treffer vor Sortierung manuell ansehen.
3. Eine `photo-evidence.json` mit genauem Eintrags-ID, Bild-URL, Commons-Seite, Autor/Lizenz, Datum, Zugehörigkeit, Crop-Hinweis und Prüfstatus führen; idealerweise Thumbnails kontrolliert lokal cachen bzw. nur mit erlaubtem Abruf nutzen.
4. Bei Hotels alternativ eine vom Anbieter erteilte Bildfreigabe, eigene Bilder oder ein autorisiertes offizielles Embedding; für einzelne Zimmer niemals ein Bild einer anderen Zimmerart übernehmen.
5. Nach Bildlauf die neue dynamische Abdeckung `Daten & Fristen` prüfen und jeden Eintrag ohne Quelle/Foto gezielt abarbeiten. Für nicht lokalisierbare Konzepte bewusst generische Icon-/Kategorie-Fallbacks, ausdrücklich **keine falschen Fotos**.

## Lokal öffnen

Im Entwicklungsbranch `outputs/Reiseplaner/Start.cmd` starten (Node.js 24) und `http://127.0.0.1:4173` im Browser öffnen. **Daten & Fristen** enthält das Audit, **Entdecken**, **Unterkünfte**, **Karte** und **Tagesplan** nutzen dieselben Bild- und Quellenmodelle. Änderungen bleiben im Entwicklungsbranch bis Merge; das Projekt wurde nicht öffentlich veröffentlicht.
