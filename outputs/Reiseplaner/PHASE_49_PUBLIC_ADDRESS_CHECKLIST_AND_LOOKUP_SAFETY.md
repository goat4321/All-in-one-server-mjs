# Phase 49 · Neue unabhängige Sète-Hausnummernreferenz, priorisierte Prüfliste, abgesicherte Geokodierung

Stand: **15. November 2026**. Entwicklung in `feature/v7-data-day-accommodation-rail`, Draft PR #5. Kein Merge nach `main`.

## 1. Öffentliche Adressreferenz in Sète – ausdrücklich kein Ferienwohnungs-POI

**Eintrag:** `research:bcom_4231096`, L'Eternel Estivant, **26 Promenade Jean-Baptiste Marty, 34200 Sète, France**.

- Die unabhängige öffentliche Unternehmensliste **Annuaire Français** nennt unter **GUILLAUME RUGGIERO**, SIREN **751091828**, dieselbe vollständige Hausadresse und explizit **43.396048, 3.695277** als Latitude/Longitude:
  https://immobilier.annuairefrancais.fr/sete/
- Ein zweites öffentliches Firmenregister weist unter **CENTRAL BAR / LE MOLE** einen (anderen) aktiven Gewerbebetrieb unter **26 PROMENADE JEAN-BAPTISTE MARTY 34200 SETE** aus:
  https://www.pappers.fr/entreprise/central-bar-902013895
- Das Unterkunftslisting veröffentlicht die gleiche Anschrift, beweist aber weder die Wohnungsidentität noch den genauen Kundeneingang der beiden anders benannten Gewerbebetriebe:
  https://www.booking.com/hotel/fr/l-39-eternel-estivant.fr.html
- Der neue Punkt ist daher **ausschließlich die öffentlich nachvollziehbare Hausnummern-/Adressreferenz** und nicht ein nachgewiesener individueller Ferienwohnungs-POI. Kategorie `independent_third_party_house_number_reference`, `geoEvidence.isCentroid=true`, Genauigkeitslabel `independent_third_party_house_number_not_lodging_entrance`.
- Diese Einschränkungen sind sowohl im Datensatz als auch im Katalog, den Ortsdetails und dem Kartenquellenlink hinterlegt. Der frühere, unsichere Nominatim-/IGN-Status wird nicht nachträglich verändert.
- Dokumentierte manuelle Quellprüfung in `data/research-v49/independent-address-lookup.json`. Die ursprünglichen V06-OSM-/Photon-Daten bleiben unverändert.

**Resultat:** In 50 öffentlich dokumentierten Anschriften gibt es nun **36 öffentliche Koordinatenreferenzen**, gegenüber 35 nach Phase 48. **14** haben nur eine veröffentlichte Postanschrift, ohne passenden unabhängigen Objekt-/Hausnummern-GPS-Beleg. Diese 36 Referenzen sind *nicht* gleichbedeutend mit 36 bestätigten Eingängen oder Buchungen.

Die vier Varianten enthalten **829 variantenspezifische Einträge**, davon **560 mit Kartenpunkt** und **269 ohne individuellen Punkt** (Phase 48: 558 / 271). Diese Zahlen sind keine 829 verschiedenen Orte, keine Eingangsbestätigungsquote und kein 2027-Preis-/Reservierungsversprechen.

## 2. Alle 14 offenen öffentlichen Adressen als bearbeitbare Forschungs-Prioritäten

Neuer maschinenlesbarer Datensatz `data/research-v49/public-address-checklist.json`:

- **Sète:** 5; **Genua:** 3; **Venedig/Mestre:** 6.
- **11** der 14 Datensätze besitzen einen *historischen Anbieter-GPS-Hinweis*, aber noch keinen unabhängig belegten Einzelpunkt; diese Pins werden nicht automatisch importiert.
- **2 kritisch:** `A due passi dalla Lanterna` (Anbieterpunkt gehört nach bisheriger Recherche zu einer anderen Adresse) und `Cittadella 3` (zweites Stockwerk könnte fälschlich Hausnummer 2 sein).
- **2 hoch:** `4 Venice rooms` (abweichende Postleitzahl) und `Bacarino` (Verwechslung mit ähnlich benanntem POI).
- **9 mittel, 1 niedrig:** unverifizierte öffentliche Gebäudeadressen ohne konkreten widersprüchlichen Einzelpunkt.
- Jede Zeile enthält Objekt-ID, Stadt, veröffentlichte Anschrift, Quelle, ggf. alternative Quelle, historischen Anbieterpin als *nur Recherche*, Blocker, konkret benannten nächsten manuellen Check, Priorität sowie die expliziten Negativflags `entranceVerified:false`, `booked2027:false` und `automaticallyGeocoded:false`.

`lib/catalog.mjs` validiert die Anzahl, Eindeutigkeit, Quellenidentität, öffentliche/Private-Grenze und den Vergleich mit dem aktuellen Adressarchiv. Die kompakten Prioritätsinformationen gelangen als `addressCheckV49` in die passenden offenen Einträge, *ohne* den vorhandenen Kartenpunkt zu ändern.

`public/map-unlocated-v39.mjs` zeigt im Modus „Veröffentlichte Anschriften“ die kritischen Fälle **städteübergreifend vor hohen, mittleren und niedrigen Fällen**; andere Kartenfilter behalten die abwechselnde Städtedarstellung. Jede Karte erhält einen individuell aufklappbaren Quellenschritt. Für Konflikte reicht ein einziger Warnhinweis statt zwei identische Warnfelder.

## 3. Echte OSM-Rechercheschritte, Schutz gegen falsch verstandene Anbieterpins

`public/provider-location-v13.mjs` bietet im Prüfpanel bei öffentlichen Einträgen:
- „Öffentliche Adresse in OSM suchen“ – Suchlink zur belegten aktuellen Anschrift.
- „Historischen Anbieterpin in OSM vergleichen“ – Koordinaten aus einem alten Anbieterergebnis, **kein bestätigtes Ziel**.
- Abweichungsklassen: **0–25 m**: nahe beieinander, **26–150 m**: gesondert prüfen, **über 150 m**: großer Lageunterschied und vorrangiger Identitätsabgleich. Das sind *nur heuristische Prüfhinweise*, keine wissenschaftliche Eingangsklassifizierung.

Der bisherige Datenstand wird also sichtbarer, aber keine Geokoordinate ohne unabhängige Quelle automatisch übernommen. Airbnb-Wunschlisten werden in Links und Prüflisten nicht offengelegt; dies gilt auch für abweichende Groß-/Kleinschreibung des Provider-Namens.

**Neue gemeinsame Schutzlogik:** `public/public-geocode-eligibility.mjs` wird von `public/app.mjs`, `public/explorer-ui.mjs`, `public/map-unlocated-v39.mjs` **und `server.mjs`** genutzt. Damit werden sowohl die sichtbare automatische Geokodierungs-Schaltfläche als auch direkte `POST /api/geocode`-Anfragen für diese Fälle abgelehnt:

- Private Unterkunft, bereits verorteter/gebuchter Eintrag oder fehlende Adresse.
- Unsichere Hausnummer versus Stockwerksangabe.
- Widersprüchliche Postleitzahlen.
- Gleichnamiger, falscher Restaurant-POI.
- Sonstige noch offene hochkritische Objekt-/Adressidentitätskonflikte aus V49.

Die öffentliche Suche in Google Maps/OSM bleibt ohne API-Key verfügbar; sie überträgt keinerlei Koordinaten in den Reiseplaner. Für unstrittige öffentlich benannte Adressen ist der manuell gestartete Geocoding-Vorschlagsdialog verfügbar und darf weiterhin nur nach Prüfung angewandt werden. Der Server stoppt Konflikt-Anfragen, **bevor** ein externer Nominatim-Aufruf oder eine Datenmutation erfolgt.

## 4. Tests

- Neu: `test/independent-address-v49.test.mjs`, `test/public-address-queue-v49.test.mjs`, `test/public-geocode-eligibility-v49.test.mjs`.
- Erweitert: `test/provider-location-v13.test.mjs`, `test/map-public-source-v46.test.mjs`, `test/public-address-v09.test.mjs`, `test/address-consistency.test.mjs`, `test/ign-public-geocode-v45.test.mjs`, `test/geocode.test.mjs`, `test/portable-browser.mjs` u. a.
- Unabhängige Testfälle prüfen die neue Sète-Referenz, das Nichtgleichsetzen einer Drittunternehmensadresse mit einer Ferienwohnung, das Nichtimportieren der historischen Anbieterpunkte, risikobasierte städteübergreifende Reihenfolge und die direkte serverseitige Sperre bei widersprüchlichen Adressen.
- Echte Chrome-Desktop-/Mobilprüfung erstellt Screenshot `49-offene-hausadressen-priorisierte-quellenpruefung.png` zusätzlich zu den bisherigen 48er Screenshot-Belegen.
- Die aktuellen CI-Testläufe und Screenshots werden über den Draft PR dokumentiert.

## Weiterhin offen

**14** veröffentlichte Haus-/Objektanschriften ohne quellenbelegten individuellen GPS-Punkt, **11** historische Anbieterpins ohne individuellen unabhängigen Ortsbeleg, verbleibende originale Kartenobjekte ohne Einzelpunkt oder Foto, noch nicht buchbare September-2027-Tarife und echte Zugangspunkte. Diese Unsicherheiten werden weiterhin deutlich als *offen* gekennzeichnet.
