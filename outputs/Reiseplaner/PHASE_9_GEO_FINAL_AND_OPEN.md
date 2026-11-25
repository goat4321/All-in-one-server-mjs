# Phase 9 – Alle früheren 306 Karteneinträge durchgesehen: Quellenkoordinaten, individuelle Ausnahmen und Öffnen der Website

**Recherche-Stichtag:** 13.11.2026 · **GitHub-Branch:** `feature/v7-data-day-accommodation-rail` · **PR:** #5 (Draft, kein Merge nach `main`).

## Ergebnis nach vollständigem erneuten Quellenabgleich

Die Zahl **306** bezog sich auf variantenspezifische **fehlende** Kartenpunkte im vorherigen Bericht, nicht auf 306 völlig verschiedene Gebäude. Die früher v06 recherchierten **290 unterschiedlichen fehlenden Quellenobjekte** umfassen sowohl inzwischen belegte Orte als auch einige noch nicht genau identifizierbare Einträge. Viele Objekte erscheinen in zwei oder mehr der vier Reisevarianten.

| Katalog / Kartenreport | Vor dieser Nutzeranfrage | Jetzt |
| --- | ---: | ---: |
| Reise-Einträge über vier Varianten | 642 | 642 |
| Einträge mit Quellen- oder ausdrücklich gekennzeichneten Gebiets-/Adresspunkten | 336 | **413** |
| Einträge ohne nachgewiesenen individuellen Kartenpunkt | 306 | **229** |
| Unterschiedliche ursprünglich in v06 untersuchte Objekte mit Koordinaten | 121 | **175** |
| Unterschiedliche noch nicht genau positionierbare Objekte | 169 | **115** |

**Es wurden damit 77 weitere variantenspezifische Pins ergänzt**. Der Wert 413 umfasst auch sauber beschriftete Gebietspunkte von Seen, Vierteln und Wanderzielen, **nicht 413 vermessene Geschäftseingänge**. Weder Kartenmarker noch ÖPNV-Links begründen echte September-2027-Verfügbarkeiten.

## Recherchierte und einzeln kontrollierte Quellen

1. **50 exakte öffentliche Unterkunfts-/Geschäftsadressen:** `data/research-v09/verified-public-addresses.json` speichert jeweils ID, Ort, Originalanschrift, Quelle, eventuelle Koordinate, Genauigkeitsstufe und Vorbehalt. **33** Adressen haben eine geografische Quelle (Gebäude-/Adresspunkt); **17** besitzen derzeit nur eine veröffentlichte Anschrift.
2. **Geografische Grundrecherche:** `data/research-v06/geocoded-points.json` enthält **175 verschiedene neue Quellenpunkte** sowie **32 weitere mehrdeutige Treffer, 39 ohne passende Treffer und 44 für einen Einzelpin ungeeignete Einträge**. Die nachgewiesenen Koordinaten sind nach OSM-Hausnummern, öffentlich publizierten Hotel-GPS, französischen Tourismusseiten, Schweizer Anbieterquellen und Behördenkarten unterschieden.
3. **Strenge Postanschriften-Geokodierung:** `data/research-v09/address-candidates.json` protokolliert **41** tatsächlich bei Photon angefragte Quellenanschriften: **18** mit genau einem Straßen-/Hausnummernkandidaten, **sechs** mit mehreren Kandidaten und **17** ohne ausreichenden exakten Hausnummerntreffer. Für die 24 mit passendem Gebäude konnten durch gesonderten Vergleich von Hotel-/Objektnamen, Hausnummern (einschließlich italienischer `rosso`-Adressen), Quell-URL und Geometrie **24 zusätzliche Adress-/Gebäude-Pins** übernommen werden. Gleiche Straße ohne korrekte Hausnummer reichte nicht aus.
4. **Öffentlich belegte Orientierungspunkte:** Weitere Referenzen für u.a. Strand Barceloneta, Bunkers del Carmel, El Born, Gràcia, Bachalpsee, Seealpsee, Klöntalersee, Nervi, Appenzell, Oberkampf und Canal Royal Sète. Diese tragen ausdrücklich `isCentroid` und einen verständlichen Hinweis, welcher Teil der Aktivität durch die Lage abgedeckt wird. Wanderroute, Eventtreffpunkt und Gebäudeeingang sind damit nicht verifiziert.
5. **Gastronomie:** `food-menu-audit.json` aus Phase 8 deckt weiterhin alle 39 kuratierten Lokale ab, 19 mit verlinkten historischen Menü-/Produkt-Preisbeispielen. Exakt belegte zusätzliche Restaurantlage u.a. Picto Toulouse Matabiau und French Burger 28 Rue Coutellerie Marseille. Historische Preise werden nicht automatisch als 2027er Ausgaben gebucht.
6. **Hotelnamen und Ausnahmen:** In Genua ist das früher als `Hotel Britannia` recherchierte Gebäude heute `Ostello Bello`; es wurde lediglich die historische Adresse/Geometrie belegt, **keine aktuelle Buchbarkeit als Hotel Britannia**. Campanile Paris Bercy Village: Betreiber nennt **17**, Stadt-Tourismusportal **19 Rue Baron Le Roy**; Hausnummer 17 wurde mit strenger Quellprüfung kartiert, abweichende Eingangs-/Tourismusangabe bleibt dokumentiert.

## Warum die übrigen 229 variantenspezifischen Einträge nicht einfach eine erfundene Koordinate erhalten

Die **115 unterschiedlichen verbliebenen Objekte** haben jeweils eine konkrete deutsche Einzelfallbegründung, letzten Recherche- und Quellenstand, nächste sinnvolle Prüfung, ggf. veröffentlichte Postanschrift und Links in `data/research-v09/individual-unresolved-reasons.json`. In der laufenden Website werden bereits erfolgreich verortete Datensätze aus dieser historischen Prüfliste **automatisch herausgefiltert** (`catalog.research.unresolvedReasonsV09`).

| Individuelle Hindernis-Kategorie | Unterschiedliche offene Objekte | Begründung |
| --- | ---: | --- |
| Privates Airbnb-Objekt ohne veröffentlichte Hausadresse | **42** | Aus Stadtteil, Suchkreis oder Wunschlistentitel lässt sich keine einzelne Gebäudeadresse ableiten. |
| Öffentliche Postanschrift vorhanden, aber ohne unabhängig bestätigten GPS-Punkt | **17** | Google Maps sucht bereits korrekt nach vollständiger Hausadresse; Geometrie/Eingang separat prüfen. |
| Flexible Aktivität/Wanderung/mehrere Stopps | **18** | Der Nutzer hat keine einzelne Treffpunkt-, Eingangs- oder Routenposition festgelegt. |
| Fahrscheinprodukt oder Verbindung ohne festen individuellen Ort | **6** | Zugroute/ÖPNV-Ticket ist kein einzelner POI; einzelne Start-/Zielbahnhöfe gesondert festlegen. |
| Booking-Unterkunft ohne eindeutig veröffentlichte Hausadresse | **9** | Name/angezeigter Kartenkreis ordnet nicht nachweisbar ein bestimmtes Gebäude zu. |
| Alte Unterkunftsoption ohne verifizierte Anschrift | **8** | Noch keine nachgewiesene Objektidentität und präziser Anbieterstandort. |
| Öffentlich beschriebene Gastronomie, exakte Geometrie ungeklärt | **4** | Restaurantadresse/Betreiber teils bekannt, Gebäude-Pin dennoch nicht unabhängig belegt. |
| Noch gar nicht ausgewählte Unterkunft | **6** | Platzhalter wie „Unterkunft offen“ haben keine individuelle Anschrift. |
| Veranstaltung/Aktivität ohne Anbieter-/Treffpunktbestätigung | **5** | Eine geführte Aktion ist erst nach Anbieter-/Ort-/Datumsauswahl ein konkreter Pin. |
| **Gesamt** | **115** | 229 offene mehrfach vorkommende variantenspezifische Einträge. |

**Keine vollständige Abdeckung künstlich erzwingen:** Ein Platzhalter oder privates Airbnb kann nicht seriös auf einen einzigen Standort reduziert werden. Die Website zeigt solche Einträge als graue gestrichelte Stadt-Sammelmarker (keine einzelne Grundstückskoordinate) und bietet konkrete Google-Maps-Suchen, soweit eine veröffentlichte Adresse existiert.

## Wo die Ergebnisse in der Website erscheinen

- **Karte → Alle Kategorien / Stadt-Sammelmarker:** echte Quellenpunkte und transparente theoretische Ortscluster, beide klar getrennt. Bei jedem Datensatz stehen Karten-/ÖPNV-Links bereit.
- **Karte → Detail des Orts:** Quellen, veröffentlichtes Hotel-/Geschäftsgebäude, geografische Genauigkeit und bei fehlender Koordinate die individuelle Begründung.
- **Daten & Fristen:** vollständige Datensatzmatrix aller 642 variantenbezogenen Einträge, für alle noch offenen der gewählten Reisevariante die **deutsche Einzelbegründung**, exakte öffentliche Postanschrift (wo veröffentlicht), Quellenlink, Google Maps und nächster Prüfschritt.
- **Unterkünfte:** bestehender Vergleich nach Gruppenkosten, Bettenlage und Bahnhofweg, Buchungen weiterhin unbestätigt.
- **Verpflegung:** 39 Lokale und nachrecherchierte datierte Preise, gesondert ohne automatische Budgetauswirkung.

## Website auf einem Windows-PC öffnen

1. [Pull Request #5](https://github.com/goat4321/All-in-one-server-mjs/pull/5) öffnen (bei privatem Repository Anmeldung erforderlich).
2. Das Repository öffnen, den **Branch `feature/v7-data-day-accommodation-rail`** im Branch-Auswahlfeld einstellen (nicht `main`).
3. **Code → Download ZIP** herunterladen, in einen lokalen Ordner entpacken.
4. Ordner `outputs\Reiseplaner` öffnen und die im Repository enthaltene **`Start.cmd`** doppelklicken.
5. Browser öffnet sich normalerweise automatisch; sonst **http://127.0.0.1:4173** in Chrome/Edge auf demselben Computer aufrufen.
6. Node.js **24** ist notwendig. Bei einer Fehlermeldung `node is not recognized` Node.js 24 von [nodejs.org](https://nodejs.org/en/download) installieren; erneut starten. Alternative im Reiseplaner-Ordner: `node server.mjs --open`.
7. Für Nutzung das Terminalfenster geöffnet lassen; zum Beenden `Strg+C`.
8. Ein bereits vorhandenes `private/reiseplan.sqlite` bei gestopptem Server sichern und gegebenenfalls in die neue Projektkopie übernehmen, um ältere persönliche Einstellungen/Planungen nicht zu verlieren. Nicht in GitHub hochladen.

**Verwechslungsgefahr:** Der PR-Link ist eine Quellcodeansicht, **keine laufende Internet-Website**. Die Adresse `127.0.0.1:4173` funktioniert nur auf dem PC, auf dem der Server gestartet wurde. Die neuen Änderungen sind **nicht nach `main` gemergt und nicht auf Netlify deployed**.

## Prüfnachweis

GitHub CI [Run #43429832835](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/43429832835) für den Code unmittelbar vor dieser Dokumentationsänderung: **62/62 Node-Modelltests**, Chrome-Browsertest, Forschungsdatenvalidierung, Karten-Datenreport und lokaler HTTP-Server-Smoke-Test **bestanden**. Kartenreport: `{"items":642,"pins":413,"withoutExactPoint":229}`.

Recherchequellen: jede neue öffentliche Hausadresse in `verified-public-addresses.json`; jeder Geopunkt samt ursprünglicher OSM-/Hotel-/Tourismusquelle in `geocoded-points.json`; alle Hausnummernkandidaten samt Ablehnungslogik in `address-candidates.json`. Vor einer Reise im September 2027 sind Anreise, Zugfahrt, Unterkunfts-Checkout, Öffnungszeiten und Endpreise neu zu prüfen.
