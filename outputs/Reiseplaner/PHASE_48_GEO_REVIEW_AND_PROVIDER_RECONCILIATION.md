# Phase 48 · unabhängiger Restaurant-POI und Abgleich alter Anbieterkoordinaten

**Recherche:** 15.11.2026 · **Branch:** `feature/v7-data-day-accommodation-rail` · **PR:** #5 (Entwurf, kein Merge nach `main`).

## 1. Geografischer Quellenabgleich für Cavour modo21, Genua

Eine bisher nur postalisch eingetragene gastronomische Adresse erhielt einen unabhängig dokumentierten **öffentlichen Restaurant-POI-Referenzpunkt**:

- Reisekatalog: `local:food-v03-015`, **Cavour modo21**, Piazza Cavour **21r**, 16128 Genova.
- Der Betreiber veröffentlicht die Adresse **Piazza Cavour 21r** und seinen WhatsApp-Kontakt.
- Das Genueser Handelskammerverzeichnis führt **Cavour modo21, Piazza Cavour 21 Rosso** und dieselbe Telefonnummer **+39 393 851 1140**.
- Ein anderes Ortsverzeichnis, basierend auf OpenStreetMap, führt **„Molo Modo 21“**, Piazza Cavour **21 rosso**, und dieselbe öffentliche Telefonnummer; der verlinkte Google-Maps-POI-Kartenpunkt ist **44.406616, 8.927979** (Breite, Länge).
- Trotz der abweichenden Namensform wurden **Hausnummer einschließlich rotem gewerblichen Suffix und identische Telefonnummer** gegen eine unabhängige Primärquelle verglichen. Das macht die Zuordnung plausibel und prüfbar.
- Neue Genauigkeitsklasse: `reviewed_public_poi_position`. `geoEvidence.isCentroid=true`, `confidence=crosschecked_public_poi_reference_not_entrance`. **Das ist keine Eingangszertifizierung** – weder eine bestimmte Tür noch Barrierefreiheit oder eine Buchung 2027 wird bestätigt.
- Die Rohkohorte der alten Phase V06 wird **nicht** überschrieben. `data/research-v48/independent-public-poi-review.json` dokumentiert Namensvariante, Punkt, Identitätssignale, Links und Vorbehalt.

**Quellen zum erneuten Nachprüfen:**

- Betreiber und Reservierung: https://modo21.it/ristorazione/come-prenotare-da-cavour-modo21/
- Betreiber-FAQ mit Standort und Telefon: https://modo21.it/ristorazione/faq-domande-piu-frequenti/
- Handelskammer Genua (Eintrag Nummer 9): https://www.ge.camcom.gov.it/it/promuovi/ristoranti-e-bartender/ristoranti-genova-gourmet/elenco-promozionale-glg.pdf
- OSM-abgeleiteter konkret benannter Restaurant-POI: https://genova-notizie.it/luoghi/molo-modo-21-piazza-cavour/
- Vom Verzeichnis veröffentlichter Kartenlink: https://www.google.com/maps/search/?api=1&query=44.406616%2C8.927979

## 2. Abgleich und fehlertolerante Einbindung

- Die Datenquelle `verified-public-addresses.json` zählt nun **35 von 50** Adressen mit individuell belegtem Referenzpunkt und **15 von 50** nur postalisch belegte Adressen.
- Der Katalog übernimmt den neuen Restaurant-POI erst bei **explizit passender Hausnummer und Telefonnummer, der archivierten manuellen Prüfdokumentation und unabhängigen HTTPS-Quellen**. Die Übernahme ist keine allgemeine, automatische Suche.
- Die alte V09-Fehlerliste behält ihre Originaldaten als historische Auditquelle, blendet aber den nun zugeordneten Standort aus der aktuellen Liste „ohne Einzelpunkt“ aus. Ein früherer abgelehnter Straßenmittelpunkt wird nicht rückwirkend „richtig“ gemacht.
- Die Benutzerkarte kennzeichnet den neuen Punkt als **„Gebäude-/Gebietsreferenz“** und bietet in der kompakten Kartenauswahl direkt den öffentlich verlinkten **Koordinatennachweis**. Der fehlende gesicherte Eingang bleibt genannt.
- Die verbliebenen 15 öffentlichen Adressen und privaten Airbnb-Wunschlisten bleiben ohne fiktive Koordinaten.

## 3. Anbieter-V13: historische Flags mit aktuellem Quellenstand abgleichen

Die vorherige Anbieter-Prüfansicht zeigte alle **17 historischen Einzelprüffälle als offen**, auch wenn ein Objekt inzwischen aus unabhängigen Quellen lokalisiert wurde. Sie verwendet jetzt dynamisch `catalog.research.publicAddressesV09` und den tatsächlich geladenen Reisevarianteneintrag, statt die alten `independentGpsVerified:false`-Flags als aktuelle Tatsachen zu behandeln.

- **17** öffentliche Prüffälle, **13** historisch gespeicherte Anbieter-GPS-Hinweise.
- **2** neuerdings unabhängig belegte Referenzpunkte: **Le Pouffre** (amtliche BAN-Hausnummernreferenz in Sète) und **Cavour modo21** (öffentlicher Restaurant-POI, Genua).
- **15** von 17 Fällen bleiben ohne unabhängige Einzelkoordinaten; darunter **12** Anbieterpunkte, denen noch ein solcher Abgleich fehlt.
- **Le Pouffre:** gespeicherter Anbieterhinweis **43.398464, 3.694474** und unabhängig belegter amtlicher Adresspunkt **43.398442, 3.694451**. Die Haversine-Distanz beträgt gerundet **3 Meter**. Dies ist ein quantifizierter Lagevergleich, **kein Beweis für die Hauseingangstür**.
- Die bereits erkannte falsche Objektidentität bei „A due passi dalla Lanterna“ bleibt als Konflikt sichtbar. Die anderen vorerst ungeprüften Anbieterkoordinaten werden nicht automatisch in die Karte übernommen.
- Quellen und Kartenreferenzen werden einzeln verlinkt. Privatadressen aus Airbnb-Wunschlisten sind nicht enthalten.
- **Screenshot-basierte Korrektur:** In der Anbieterprüfliste erschien bei **Cittadella 3** zunächst noch die alte, fälschlich als Hausnummer interpretierte „2 piano“-Angabe. Der dynamische Abgleich verwendet jetzt die korrigierte öffentliche Referenz **Scalinata della Cittadella, 16126 Genova**; die historische Aussage ist nur noch hinter „Alte Adressfassung zeigen“ sichtbar und ausdrücklich nicht als Hausnummer bestätigt.
- Die Anbieterprüfliste markiert **vier** unterschiedliche bekannte Adress-/Identitätskonflikte: „A due passi dalla Lanterna“ (andere Objektanschrift), Cittadella 3 (Stockwerk statt Hausnummer möglich), „4 Venice rooms“ (abweichende Postleitzahl) und Bacarino (ähnlich benannter, falscher POI). Die alte Recherche bleibt archiviert, statt falsche Aussagen zu überschreiben.
- Die überarbeitete Konfliktansicht ist im zusätzlichen Chrome-Screenshot `48-provider-adresskonflikte-desktop.png` dokumentiert.


## 4. Implementierung und Testabnahme

- Geodaten: `data/research-v09/verified-public-addresses.json` und `data/research-v48/independent-public-poi-review.json`.
- Katalog/Provenienz: `lib/catalog.mjs`.
- Karten-Popup: `public/views.mjs`; mobile/desktop Darstellungsstil `public/map-unlocated-v39.css`.
- Dynamischer Alt/Neu-Abgleich: `public/provider-location-v13.mjs`.
- Neue Tests: `test/independent-public-poi-v48.test.mjs`; aktualisierte V09, V13, V45, V46 und V47 Tests, Kartenpopup- und Chrome-Browserprüfungen.
- Browser-Screenshot: `48-provider-bananbieter-positionen-vergleich.png`, sobald der CI-Lauf die visuelle Abnahme erfolgreich abgeschlossen hat.

**Methodische Grenze:** Unabhängige Kartendaten bestätigen das referenzierte Objekt bzw. seine veröffentlichte Adresse, jedoch weder aktuelle Lage jedes Eingangs noch Zugangsbedingungen, Reservierung, Öffnungszeiten im September 2027 oder exakte Wegdauer bis zu einer Tür.
