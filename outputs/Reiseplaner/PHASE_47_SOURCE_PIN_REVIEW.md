# Phase 47: Kartenpunkte unabhängig prüfen, historische Adresskorrekturen abgleichen

**Datum:** 15. November 2026. **Entwicklungs-PR:** #5 (Draft); `main` bleibt unverändert.

## Ausgangslage

- Vier getrennte Reisevarianten, gemeinsam **829 variantenspezifische Kartenobjekte**. **556** enthalten eine Koordinate, **273** nicht. Das sind keine eindeutigen Objektzahlen und keine Quote bereits verifizierter Eingänge.
- **16 von 50 veröffentlichten Haus-/Objektanschriften** im eigenständigen Adressarchiv haben weiterhin keinen belastbaren Einzel-GPS-Punkt (6 Sète, 4 Genua, 6 Venedig/Mestre).
- Ein vorhandener Anbieterpunkt darf nicht mit einer unabhängigen POI-Quelle, einer verifizierten Adresse oder einem Hauseingang gleichgesetzt werden.

## V47-Verbesserungen

1. **Neue Modulgrenze `public/map-location-review.mjs`:** `existingPinReviewUrl` verlinkt den tatsächlichen gespeicherten Kartenpunkt mit sechs Dezimalstellen auf OpenStreetMap; `publicPlaceReviewSearchUrl` sucht unabhängig nach öffentlichem Namen, Adresse und Stadt. Beides sind bewusst getrennte Recherchewege, **keine Geokodierung und keine automatische Freigabe**.
2. `publicPinReviewLinks` liefert zusätzlich belegte öffentliche Adressquellen und vorhandene Koordinatenquellen getrennt, jeweils nur für gültige `https://`-URLs.
3. **Datenschutz:** Bei Airbnb-Wunschlisten werden weder private Koordinaten noch Objekt-/Adresssuchlinks erzeugt. Auch abweichende Schreibweisen von „AIRBNB“ werden ausgeschlossen.
4. **Bestehende ungeprüfte Pins:** Die Karten-Prüfliste zeigt Koordinaten als „Gespeicherter Pin“ statt „verifizierter Eingang“. Ein direkter Link öffnet die gespeicherte Position, ein zweiter aufklappbarer Bereich vergleicht Namen und Primärquellen. „Pin auf Karte“ fokussiert den vorhandenen Eintrag. Kein automatischer Datenimport.
5. **UI:** Kompaktere Desktop-Anordnung mit zweispaltiger Darstellung; auf schmalen Displays nur eine Spalte. Die Links haben klare Bezeichnungen, sind auch ohne Hover nutzbar und entsprechen der bestehenden Theme-/Farbwelt.
6. **Externe Kartenbeschriftungen:** `googleMapsLocationStatus` und `googleMapsSearchLabel` unterscheiden echte Quellenpunkte, Gebäude-/Gebietsreferenzen, ungeprüfte Anbieterkoordinaten und rohe historische Punkte. Ein Google-Maps-Link ist keine Bestätigung des gespeicherten Ortes.
7. **Reiseadressenkonsistenz:** Beim Angebot **Cittadella 3** bleibt nach dem öffentlichen Listing „Scalinata della Cittadella 2 piano“ die Hausnummer ungeklärt: früherer V09-Ursprungseintrag und voreingestellte Google-Maps-/Transit-Suche nennen jetzt ausschließlich die belegte Straße. Die alte `2` wird nicht länger als Gebäudehausnummer interpretiert. Der Verifikationstext verlangt einen Abgleich bei Vermieter und Gebäude.
8. **Zwei neue Betreiberkontext-Einträge** im öffentlichen Adressevidenzdatensatz:
   - *Cavour modo21*, Genua, Piazza Cavour 21r. Betreiber-FAQ nennt Nähe zur Metro **San Giorgio** (laut Betreiber rund 100 m Fußweg), veröffentlichte Telefonnummer und Reservierungsweg via WhatsApp nur mit ausdrücklicher Bestätigung. Tourismusportal Italia.it publiziert Zeitfenster **12:00–14:30, 19:00–22:30** für den überprüften Referenzstand. **Keine bestätigte September-2027-Verfügbarkeit, kein genauer Eingangs-GPS-Punkt**.
   - *Bacarino*, Venedig, Salizada San Giovanni Grisostomo **5755** in veröffentlichtem Profil. Ein anderes OSM-basiertes Verzeichnis zeigt Bacarino bei **Cannaregio 5756**. Der Unterschied wird als Quellenkonflikt geführt und nicht durch einen erfundenen Punkt aufgelöst. Öffnungszeiten zwischen Datenanbietern sind widersprüchlich.
   - Diese Informationen erscheinen nur in der aufklappbaren Quellen-/Genauigkeitsbeschreibung, damit die normale Kartensuche nicht textüberfrachtet wird.

## Quellen (öffentliche Betreiber- und Adressangaben)

- Cavour FAQ: https://modo21.it/ristorazione/faq-domande-piu-frequenti/
- Cavour Tourismusportal: https://www.italia.it/it/liguria/genova/dove-mangiare/cavour-modo21
- Cavour Bestätigung zu Tischreservierungen: https://modo21.it/ristorazione/come-prenotare-da-cavour-modo21/
- Bacarino veröffentlichtes Profil: https://www.tripadvisor.it/Restaurant_Review-g187870-d33473744-Reviews-Bacarino_Venezia-Venice_Veneto.html
- Bacarino zusätzliches lokales Verzeichnis: https://www.localshop24.com/it/venezia-ve-it/attivita/bar/bacarino/
- Cittadella 3 Anbieterlisting: https://www.booking.com/hotel/it/cittadella-3.html

## Qualitätssicherung

- `test/map-location-review-v47.test.mjs`: öffentliche Links, zulässige Koordinaten, HTML-Oberfläche, Privacy, Provider-GPS.
- `test/public-location-evidence-v47.test.mjs`: Adressdatenkonsistenz, historische Unsicherheitsreferenz und 2027-Vorbehalt.
- Erweiterte `test/google-maps.test.mjs` zur Quellenstatus-Verwechslung.
- Erweiterte `test/portable-browser.mjs`: tatsächlich gerenderter Source-Vergleich, externe OSM-Links, eigenes Screenshot-Artefakt `47-ungepruefte-pins-quellenvergleich-desktop.png`.
- Keine privaten Tripsy-Quelldateien überschrieben, keine falschen GPS-Pins oder Preise erstellt.

**Offen:** 273 variantenspezifische Einträge ohne Punkt, weitere individuelle Adress-/Hausnummernnachweise, manuelle Quellennachweise für viele der 556 gespeicherten Positionen, Online-Abnahme von echten Kartenkacheln und September-2027-Tarife.
