# Entscheidungen

## 12.11.2026 – UX-Referenzen vor dem Entwurf

| Beobachtung | Nutzen | Umsetzung |
|---|---|---|
| Wanderlog zeigt Reisegliederung, Tagesliste und Karte nebeneinander. Die Kartensicht filtert nach Tag und Kategorie, Verbindungen erscheinen zwischen Stopps. | Ortswechsel lassen sich direkt im Tagesablauf beurteilen. | Liste und Karte teilen eine Auswahl. Fernstrecke und Tag sind eigene Ansichten. Abschnittsdetails zeigen Herkunft, Dauer und Tarifstatus. |
| Tripsy gruppiert Unterkunft, Transport und Aktivitäten unter einer Reise. Im iPhone-Itinerary folgen auf eine kompakte Datumsleiste zeitlich sortierte Einträge. Smart Routes zeigt den Weg vor dem Speichern und prüft den Zeitpuffer. | Reisetag und Umstiege bleiben auf schmalen Geräten auffindbar. | Datumsleiste mit Ortswechsel, mobile Listen-/Kartenansicht, Wegdetails, Warnungen und lokale Änderungsvorschau. |
| Wanderlog hält Orte und Empfehlungen getrennt vom Tagesprogramm auffindbar. Tripsy bietet Kategorien, Nähefilter und Vorschau beim Import. In den gesichteten Flows war kein vollständiger Vergleich mehrerer Alternativen mit Gruppenpreis zu sehen. | Eine Idee kann erhalten bleiben, bis die Gruppe entschieden hat. | Eigene Vergleichskarten und Tabellen, Merkliste, sichtbarer Auswahlstatus und Budgetdelta vor der Übernahme. |

Gesichtet wurden die offiziellen Produktdarstellungen, Wanderlogs öffentliche Tagesstruktur und Hilfe, die mobilen Produktabbildungen sowie Tripsys aktuelle Versionsnotizen und die öffentlich sichtbare iPhone-Ansicht. Anmeldung in Wanderlog und native Tripsy-Bedienung waren nicht Teil der Prüfung. Tripsy war auf Datenebene lesend verbunden. Die referenzierten Reiseplaner-Mockups lagen im bereitgestellten Prompt-Paket und im gefundenen Seed nicht vor.

[Wanderlog Karten](https://wanderlog.com/travel-maps) · [Wanderlog Tagesplan-Hilfe](https://help.wanderlog.com/hc/en-us/sections/5154228681883--Daily-itinerary) · [Wanderlog Mobile](https://wanderlog.com/lp/mobileLandingPage) · [Tripsy Produktdarstellung](https://tripsy.app/) · [Tripsy Versionsnotizen](https://tripsy.app/updates)

## 12.11.2026 – Pilot, Datenschutz und Datenmodell

- Barcelona kommt in allen drei Interrail-Varianten vor. Die Recherche enthält konkurrierende Unterkünfte, Eintrittstarife, Beachvolleyball und ein optionales Clubprogramm. Die August-Variante enthält den Nachtzug davor. Der Seed empfiehlt ebenfalls Barcelona.
- Lokaler Node-Server und SQLite-Datei mit Browser-Oberfläche. Das erleichtert den Start auf diesem Windows-Rechner, hält private Kopien lokal und benötigt weder Cloudkonto noch Build-System. Das Laufzeit-API bindet ausschließlich an Loopback.
- Importierte Datensätze sind unveränderliche Quellschnappschüsse. Bearbeitung und Auswahl gehören in variantenspezifische, versionierte Arbeitsstände. Stabile externe IDs bleiben nachvollziehbar. Eindeutig identische Kopien innerhalb einer Variante werden markiert. Die separat erfasste Schweizer Reise behält vier Reisende.
- Das Budget der Quelle ist ein Referenzszenario. Die aktive Summe rechnet ausschließlich mit konkreten ausgewählten Positionen und separat erfassten Ausgaben. Eurocent, feste Restcent-Reihenfolge und dokumentierte Fremdwährungskurse bilden die Rechengrundlage.
- Basiskarte, Liniennetz, Fußroute, Fahrplan und Tarif haben getrennte Quellen. Die Gesamtroute verwendet die unveränderte Reihenfolge und kennzeichnet fehlende Trassengeometrie als Schema. Widersprüchliche importierte Koordinaten werden von der Karte ferngehalten und in den Details offengelegt.

[Offizielle Nachtzugregel](https://help.interrail.com/hc/de/articles/38312789999261-Wie-funktionieren-Reisetage-bei-Nachtz%C3%BCgen) · [TMB-Entwicklerdaten](https://www.tmb.cat/en/tmb-app-and-other-apps/tools-for-developers)

## 12.11.2026 – Datenabgleich und Kartenanbieter

- Die 22 Dateien im vom Nutzer nachgereichten Verzeichnis wurden per SHA-256 mit dem entpackten ZIP verglichen. Alle 22 sind bytegleich. Die JSON-Dateien sind die laufende Datenbasis, die CSV-Abbilder bleiben als Originalkopien verfügbar.
- Leaflet 1.9.4, OpenStreetMap-Kacheln nur im sichtbaren Bereich und FOSSGIS-Fußrouting mit lokaler Speicherung. Neue Abfragen werden durch die Nutzeraktion ausgelöst und serverseitig auf höchstens eine Anfrage pro Sekunde begrenzt. Für Barcelona, Paris und Sète liegen ausgesuchte berechnete Verbindungen lokal vor.
- TMB-GTFS antwortete mit HTTP 401. Für Barcelonas statische Metro-, Tram-, Bus-, Rodalies- und FGC-Geometrie wird der öffentliche AMB-Datendienst verwendet. Die geprüfte Bus-Haltestellenebene gab keine Geometrie zurück. Fahrten, Tarife und Netzverläufe sind getrennt. Für geprüfte ÖPNV-Wege gibt es manuelle Felder und Betreiberlinks. Die Straßenkarte braucht Netzverbindung, die lokal gespeicherten Routen und Pins bleiben bei Kachelfehlern bedienbar.
- Für Sagrada Família und Eiffelturm wird der offizielle Standardtarif verwendet, wenn das Alter fehlt. Individuelle Altersgruppen werden anhand der hinterlegten Profile gerechnet. Beim Louvre ist die Berechtigung zusätzlich vom Status im EWR abhängig. Die Quellenpreise sind sichtbar, der aktive Betrag bleibt ohne bestätigte Einstufung offen.
- Georges Hostel ist eine Sète-Alternative aus der Recherche. Der Anbieter belegt Gemeinschaftsküche und eine mögliche Zimmergröße für drei. Gruppenpreise bleiben varianten- und datumsbezogen. Die Stationswege werden aus den tatsächlich gespeicherten Fußwegen abgeleitet.

[AMB-Datendienst](https://ide.amb.cat/geoserveispi/rest/services/SIGMIT/CapesAuxiliars/MapServer) · [FOSSGIS-Routing](https://routing.openstreetmap.de/about.html) · [Georges Hostel](https://georgeshostel.com/) · [Louvre-Tarife](https://www.louvre.fr/en/visit/tickets-and-prices)

## 12.11.2026 – Genua und Venedig

- Falsche Schweizer Adressen und Umsteigehinweise in drei Italien-Fahrten wurden über eine lokale Korrekturschicht behandelt. Bereits plausible Koordinaten importierter Aktivitäten werden weiterverwendet. Bei einem klar benannten Ort wird ein belegter Orientierungspunkt angezeigt. Der unbestimmte letzte Abend am Kanal bleibt geografisch offen.
- AMT und ACTV werden als datierte Netzreferenzen angezeigt. Der Konverter `lib/gtfs-map.mjs` verbindet Haltestellen mit Linien über Fahrt- und Haltestellenzeit-IDs und übernimmt veröffentlichte Shapes. Er rundet Koordinaten auf sechs Nachkommastellen. Fehlen Shapes, erscheinen Haltestellen ohne interpolierten Linienverlauf. Die ODbL-Metrotrasse in Genua ist eine separate Kartebene über den Haltestellen aus dem AMT-Feed.
- Der Fußrouter prüft ab jetzt die Wegschritte. Ein Vorschlag mit Fähre oder anderem Verkehrsmittel bekommt keinen Preis von 0 €. Ältere interaktiv abgefragte Cache-Einträge ohne diesen Nachweis bleiben in SQLite erhalten und werden bei Bedarf neu berechnet. Die mitgelieferten Fußwege verbinden die ausgewiesenen Stopps auf dem Festland oder derselben Insel.
- Der Unterkunftsvergleich kennzeichnet die Stationsbezüge in Mestre und auf der Insel. Ein Fußweg ab Mestre beschreibt nur den Teil bis zur Unterkunft. Für den Inseltransfer gelten eigener Fahrplan und eigener Tarif.
- Die AMT- und ACTV-Tarifvergleiche zählen Einzeltickets innerhalb eines gemeinsamen Gültigkeitsfensters. Sie sind eine Rechnung je Variante, ohne daraus automatisch Ausgaben abzuleiten.

[RFI Genova Piazza Principe](https://www.rfi.it/it/stazioni/genova-piazza-principe.html) · [RFI Venezia Santa Lucia](https://www.rfi.it/it/stazioni/venezia-s-lucia.html) · [AMT-Feed (CC BY 4.0)](https://www.dati.gov.it/node/view-dataset/dataset?id=9529fa6c-3534-431f-9cb0-41749286f2ee) · [ACTV-Feed (CC BY)](https://www.dati.venezia.it/?q=node%2F261) · [OpenStreetMap-Metro (ODbL)](https://www.openstreetmap.org/relation/2177189)

## 12.11.2026 – Nizza und Schweizer Tagesorte

- Lignes d’Azur wird aus dem offiziellen GTFS unter Licence Ouverte 2.0 gelesen. Der angezeigte Gültigkeitszeitraum kommt aus `feed_info.txt`. Geometrie und Tarife sind getrennt. Die Einzelfahrkarte wird nach 74-Minuten-Fenstern gezählt, der Vergleichspass umfasst 24 Stunden. Kartenmedium, Flughafen-Sondertarif und TER haben eigene Bedingungen.
- Ganzer Tag führt planbare Einträge aus allen betroffenen Orten chronologisch zusammen. Eine Fahrt kann zwei Kartenereignisse mit eigener Auswahl haben. Beide verwenden dieselbe persistente ID. Die Budgetrechnung zählt die Fahrt einmal. Zwischen verschiedenen Orten entstehen standardmäßig keine automatischen Fußwege.
- Für einen manuell belegten lokalen Weg werden Datum, Linie und Preisbezug gemeinsam mit Dauer und Quelle gespeichert. Der Preis wird im Wegdetail für die Reisegruppe dargestellt. Ausgaben werden separat erfasst, damit ein Preis für die Zeitkarte und eine einzelne Fahrt keinen gemeinsamen Posten voraussetzen.
- Die Schweizer Rundreise bleibt ein eigener Roadtrip. Die Bahnvariante erhält fehlende Bahnhofspunkte als lokale Ergänzung. Swisstopo-Kacheln zeigen das signalisierte Wegenetz beim Einschalten der Ebene. Die Karte beansprucht damit keine bestätigte Wegöffnung. Für Zugänge mit Gondel oder Bergweg werden belegte Richtwerte und Betreiberlinks verwendet. Die Oeschinensee-Warnung nutzt das veröffentlichte Betriebsfenster und die Fußzeit ab Bergstation. Ein „ab“-Preis für die Firstbahn bleibt außerhalb der aktiven Summe, bis der benötigte Tarif feststeht.
- Die amtlichen Adressen für Antares, Alte Metzg und Blattenheimat 6OG3 erlauben Fußwege zum jeweiligen Bahnhof. Es liegen keine bestätigten Angebote oder Stornofristen für die konkreten Daten vor. Die Bezeichnung „Blattenheimat6“ allein reicht für eine Zusammenführung mit 6OG3 nicht aus.

[Lignes d’Azur GTFS](https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur?locale=fr) · [Oeschinensee Betriebszeiten](https://www.oeschinensee.ch/tarife-fahrplan/) · [Oeschinensee Gehzeiten](https://www.oeschinensee.ch/wandern/) · [swisstopo-Wanderwegenetz](https://api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swisstlm3d-wanderwege/legend)

## 12.11.2026 – Datensparsame GitHub-Fortsetzung ohne Tripsy-Rohdaten

- Die lokale App enthält private Tripsy-Snapshots, die ausdrücklich per `.gitignore` aus dem GitHub-Upload ausgeschlossen sind. Dieser Schutz bleibt bestehen, obwohl das Repository privat ist.
- Statt Quellkopien hochzuladen, verwendet ein frischer Checkout bei fehlenden Rohdateien eine klar als eingeschränkt bezeichnete Projektion aus dem vorhandenen Forschungs-Seed. Dies ist **kein** vollständiger Tripsy-Import und kein Ersatz für die Originaldaten. Vorhandene Originaldateien haben immer Vorrang.
- Fehlende Buchungsdetails, Positionen oder Aktivitätsdaten werden nicht erfunden. Zeilen mit Uhrzeit tragen weiterhin den Status *vorläufig / 2027 nicht bestätigt*. Das explizite `(+1)` einer Nachtzugankunft wird für die lokale Datumsrechnung berücksichtigt. Es findet keine Buchung statt.
- Die UI zeigt im Ersatzmodus einen unübersehbaren Hinweis und benennt den Datensatz im Quellenbereich als **Recherchearchiv** statt als vollständigen Tripsy-Import. Alle Zustandsänderungen werden weiterhin ausschließlich lokal pro Variante in SQLite gespeichert.
- Für die UX orientieren wir uns weiter an Wanderlogs tagweise organisierter Karten-/Listenansicht und Tripsys Smart-Routes-Vorschau und horizontaler Datumsnavigation, statt die Oberfläche neu zu kopieren. <https://wanderlog.com/home> · <https://tripsy.app/updates>.
- Der vollständige Testlauf mit originalen Tripsy-Daten und Browser-Abnahme bleibt Voraussetzung vor der Freigabe dieses Branches für den Hauptstand.
