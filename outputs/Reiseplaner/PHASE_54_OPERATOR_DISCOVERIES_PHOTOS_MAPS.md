# Phase 54 – Neue Betreiber-Orte, 16 zusätzliche Fotos und Tagesplan-Maps (16.11.2026)

## Neue Rechercheeinträge
Die Datei `data/research-v54/official-discoveries.json` enthält **13 neue, einzeln belegte Ortsvorschläge** in acht Zielgebieten:
- Paris (2): Musée de la Vie Romantique; Jardin des Plantes.
- Barcelona (2): Recinte Modernista Sant Pau; CaixaForum Barcelona.
- Sète (1): Espace Georges Brassens.
- Nizza (2): Musée Matisse; Musée national Marc Chagall.
- Genua (2): Galata Museo del Mare; Castello d'Albertis.
- Venedig (2): Museo di Storia Naturale; Gallerie dell'Accademia.
- Grindelwald (1): Pfingsteggbahn/Sommerrodelbahn.
- Kandersteg (1): Blausee-Naturpark im Nachbarort Kandergrund.

Alle 13 werden über `lib/operator-discoveries-v54.mjs` nur in Reisevarianten mit passender Stadt eingebaut und durch Stadt+Name gegen vorhandene Einträge abgeglichen. Neue IDs beginnen mit `operator:v54:`. Alte Reiseziele, Zeitfenster, Buchungen und eigene Reisepläne werden nicht verändert.

## Zuverlässigkeit und Preise
- Jeder Eintrag enthält **Quellenlink, veröffentlichte Postadresse, objektbezogene Beschreibung, Öffnungs-/Saisonhinweis, ggf. Alters-/Ermäßigungshinweis und Preisreferenz**. Exakte Quelle und Prüfdatum sind am Eintrag und in der Quellenübersicht verfügbar.
- Nur bei Sant Pau wurde eine offizielle **veröffentlichte reguläre Ticketpreistabelle ab 2027** gefunden (19 € online vor 14 Uhr, 18 € danach, am Schalter jeweils 1 € mehr). Das **bestätigt keine Verfügbarkeit für euren Reisetag**. Bei den übrigen Orten handelt es sich um 2026- bzw. Saisonbeispiele.
- `price:null`, `booked:false`, `selected:false` und `point:null`: Keine Recherchepreise in die tatsächliche Budgetrechnung, keine erfundenen Hotel-/Museumsbuchungen oder Wegzeiten, keine mit Google Maps geratenen Koordinaten.
- 18-jährige mit EU-Staatsangehörigkeit können laut Betreiber bei den Gallerie dell'Accademia eine 2-€-Ermäßigung nutzen. Andere Jugend-/Studentenrabatte gelten teils unter zusätzlichen Voraussetzungen und müssen nachgewiesen werden.
- Blausee ist kein frei zugänglicher Badesee: Betreiber untersagt Baden/Schwimmen (regulär) und nennt kostenpflichtigen Parkeintritt. Bei allen öffentlichen Outdoor-Orten werden exakte Saison-/Wetterregeln für 2027 offen gelassen.

## Bilder
`public/curated-place-photos.mjs` ergänzt **16 weitere individuell zugeordnete Commons-Motive**: Bouillon Pigalle, Coulée Verte, Castell de Montjuïc, Mercato Orientale, Libreria Acqua Alta, Punta della Dogana, Musée de la Vie Romantique, Jardin des Plantes (Foto eines Gebäudes am Garten), Sant Pau, CaixaForum, Musée Matisse, Musée Chagall, Galata-Museum, Castello d'Albertis, Gallerie dell'Accademia und Blausee. Datei-Originalseite, Fotograf, genaue CC-Lizenz und Ausschnitt-Vermerk stehen jeweils im Datensatz. Keine ungeprüften Hotelzimmer- oder privaten Airbnb-Fotos.

Die externen Wikimedia-Bilder brauchen Internet; die URL-Referenzen sind keine lokale Offline-Datei. Markt-/Restaurantbilder sind nur bei explizitem `allowFood` zugeordnet, nicht über beliebige Teilwort-Treffer.

## Google Maps
Die bei der letzten Runde auf Restaurant-, Hotel- und Aktivitätskarten hinzugefügten Maps-Suchlinks bleiben sichtbar. Neu in `public/day-plans-ui.mjs`: ein Maps-Link für konkrete bereits geplante bzw. vorgeschlagene Tagespunkte. Flexible Aktivitäten ohne einen bestimmten Treffpunkt (beispielsweise „gemeinsam kochen“) bekommen bewusst keinen erfundenen Kartentreffer. Die Anbieteradresse wird als Suchtext verwendet, nicht als unabhängig belegter GPS-Pin. Zugverbindungen und Fahrzeiten September 2027 bleiben ungeprüft.

## Neue Tests
- `test/operator-discoveries-v54.test.mjs`: 13 Einträge, Varianten-Scope, Quellennachweis, Kartenlinks, Foto- und Lizenzzuordnung, Ungültig-URL-Abwehr, Preis-/Buchungsgrenzen.
- `test/day-plans-v32.test.mjs`: Google-Maps-Suchlinks für konkrete Tagespunkte ohne Fahrplanbehauptung.
- Die portable Node-24-Testliste wurde um die V54-Regression erweitert.

## Noch offen
Nicht jede der sehr vielen alten Ortsoptionen hat ein individuelles Foto. Hotel- und Airbnb-Checkoutpreise, tatsächliche 2027er Öffnung, private Adressen und Koordinaten aus nicht unabhängig gesicherten Anbietern werden nicht erfunden. Es erfolgt **kein Merge nach main, keine öffentliche Bereitstellung und keine externe Buchung**.

### Offizielle Betreiberlinks
Direkte Quellen sind in jedem Datensatz hinterlegt; u. a.
https://museevieromantique.paris.fr/votre-visite/informations-pratiques
https://www.jardindesplantesdeparis.fr/fr/tarifs-horaires-acces
https://santpaubarcelona.org/en/prepara-la-teva-visita/
https://www.museidigenova.it/it/castello-dalbertis-museo-delle-culture-del-mondo
https://www.blausee.ch/de/kontakt-anreise/
