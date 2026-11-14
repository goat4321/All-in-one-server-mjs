# Phase 24 – 57/57 Aktivitätsguides, 37 lizenzierte Bildregeln und filterbare Datenlücken

**Stand:** 14.11.2026. GitHub `goat4321/All-in-one-server-mjs`, Branch `feature/v7-data-day-accommodation-rail`, Draft-PR #5. Keine Buchung, keine Veröffentlichung, kein Merge. Alle Nutzereingaben, aktiven Reisepläne und Budgets bleiben unverändert.

## I. Alle 57 V19-Aktivitätskandidaten mit eigenen Quellenhinweisen

**Archivabgleich und ehrliche Routenzuordnung:** 57 Quellenprofile decken alle 57 `research-v19-survey-first/activities.json`-IDs ab. **56 davon** sind wenigstens einer der vier bestehenden Reisevarianten zugewiesen. Die Montpellier-Option `act-056` hat im Originalarchiv `trip_applicability: []` und wird deshalb **nicht** in irgendeine Route importiert. Sie erscheint neu unter **Daten & Fristen → Zusätzliche recherchierte Alternativen außerhalb der aktuellen vier Routen**, inklusive Beschreibung und Originalquelle, aber ohne falschen Plan-/Buchungsstatus. `lib/research-v22.mjs` prüft die Unzuordenbarkeit ausdrücklich anhand der Original-Umfragedaten statt eine Programm-Ausnahme oder automatische Aufnahme auszulösen.

Der Forschungsbestand `data/research-v22/operator-guides.json` enthält nun **57 einzeln zugeordnete Guide-Datensätze mit HTTPS-Quellen**. Die vorherigen 37 wurden um **20** ergänzt. In der Datenpipeline erzwingt `lib/research-v22.mjs` eine exakte und eindeutige ID-Zuordnung (z. B. `survey-v19:act-010`), passende Stadt, Text, praktische Hinweise, Quelle und verifizierten *Nichtbuchungsstatus*.

**Wichtig:** „57 von 57“ heißt **57 V19-Aktivitätsideen besitzen jeweils einen individuellen Recherchetext und eine zugeordnete externe Quelle**. Es heißt NICHT, dass für alle Ideen ein einzelner verifizierter Anbieter, Eintritt, Gebäude-POI, Foto, Ende-2027-Preis oder konkretes Zeitfenster vorliegt. Konzeptionelle Ideen (Clubabend, Picknick, Paddeltour, Abendrundgang) bleiben konsequent Konzept und ausgewiesene Betreiberbeispiele. Die übrigen **828 variantebezogenen Gesamt-Katalogeinträge** sind damit nicht alle vollständig recherchiert.

### Neu ergänzte 20 Aktivitätsguides

| ID | Ort / Begriff | Quelle / präzise Umsetzung |
| --- | --- | --- |
| act-001 | Paris: Trocadéro | [Paris Tourismus](https://parisjetaime.com/ger/transportmittel/le-trocadero-et-son-esplanade-p1900): Esplanade, Palais de Chaillot, Gärten, Warschauer Brunnen. Kein Eiffelturm-Ticket notwendig. |
| act-009 | Barcelona: Barceloneta | [Städtischer Tourismus](https://bid.barcelonaturisme.com/wv3/en/page/3495/barceloneta-beach.html): Strandservices, separat zu mietende Ausstattung, keine angenommene Strandwache 2027. |
| act-010 | Barcelona: Ciutadella-Park | [Stadt Barcelona](https://guia.barcelona.cat/en/detall/-parc-de-la-ciutadella_92086011921.html): täglich 07:00 bis Abenddämmerung, Kaskade und See; Zoo, Boot und Sportanlage sind eigenständige Leistungen. |
| act-014 | Barcelona: Montjuïc | [Stadt-Tourismus](https://bid.barcelonaturisme.com/wv3/en/page/3473/parc-de-montjuic.html): Park-/Olympiagelände, unterschiedliche Museen; große Fläche, kein falscher Einzel-Eingang. |
| act-015 | Barcelona: Poblenou | [Stadt-Tourismus](https://bid.barcelonaturisme.com/wv3/en/page/432/poblenou.html): Rambla del Poblenou und Industriegeschichte, Café noch nicht gewählt. |
| act-016 | Barcelona: optionaler Clubabend | [Barcelona-Stadtguide (Moog im November 2026)](https://guia.barcelona.cat/en/detall/sessions-al-moog-mes-de-novembre_99400788905.html): Club ist nur ein Beispiel mit 2026er Referenzangeboten von 5–20 €; keine Buchung, September-2027-Preis offen. |
| act-017 | Sète: Plage de la Corniche | [Archipel de Thau](https://www.archipel-thau.com/mon-sejour/que-faire/toutes-les-activites/plage-de-la-corniche-sete-fr-6264662/): öffentlicher Gratiszugang, zwei Buchten, Sportbereich; Beachbar und Kursanbieter separat. |
| act-018 | Sète: Mont Saint-Clair | [Archipel de Thau](https://www.archipel-thau.com/de/ein-archipel-aus-gemeinden/sete/was-gibt-es-in-sete-zu-sehen/tafel-13-der-mont-saint-clair-vom-hafen-aus-gesehen/): 175 m Berg und Panoramabereiche, kein exakt bestätigter Aufstiegspfad. |
| act-021 | Sète: SUP/Kajak | [Kayakmed-Tourismuslisting](https://www.archipel-thau.com/de/mein-aufenthalt/was-man-im-thau-archipel-unternehmen-kann/alle-aktivitaten/kayakmed-base-mer-sete-de-6264914/): Beispielanbieter, veröffentlichte Saison 2026, 2027-Betrieb und Preise noch offen. |
| act-022 | Sète: Picknick | [Halles de Sète](https://www.archipel-thau.com/nos-communes/larchipel-de-thau/blog/la-route-des-halles/): Markt täglich 07:00–14:00 laut Tourismusseite, Einkaufsangebot ist kein fertiges Picknick-Menü. |
| act-023 | Nizza: Promenade des Anglais | [Nice-Tourismus](https://www.explorenicecotedazur.com/culture/promenade-des-anglais/): ungefähr 7 km Gesamtpromenade, ursprünglich geplante Kurzrunde noch ohne exakte Strecke. |
| act-029 | Nizza: Regen-Sportoption | [Jean-Bouin-Hallenbad](https://www.explorenicecotedazur.com/structure/piscine-couverte-jean-bouin/): 50-m-Becken; Badekappe erforderlich, Badeshorts untersagt; **Betreiber nur als Beispiel**, nicht gebucht. |
| act-038 | Venedig: Cannaregio | [Venezia Unica](https://www.veneziaunica.it/en/things-to-do-in-venice/itineraries/cannaregio-authenticity-and-traditions): Ghetto, Ormesini, Misericordia; Museum/Synagoge haben separate Besuchsregeln. |
| act-039 | Venedig: Zattere | [Venezia Unica](https://www.veneziaunica.it/it/cosa-fare-a-venezia/itinerari/dorsoduro-sestiere-d-arte): San Basilio bis Punta della Dogana, Blick auf Giudecca-Kanal. |
| act-043 | Venedig: Abendrunde | [Visit Venezia](https://www.visitvenezia.eu/en/venetianity/walk-venice/venice-at-sunset-7-panoramic-viewpoints-): Punta della Dogana / Zattere als Optionen; tatsächliche Sonnenuntergangszeit, Route und Wetter noch offen. |
| act-051 | Grindelwald: Eigerblick | [Jungfrau](https://www.jungfrau.ch/de-ch/grindelwald/): Bergdorf unter der Eigernordwand und Zugang zu verschiedenen Startorten, kein einheitlicher Bergbahn-Eintritt. |
| act-054 | Oeschinensee: Seeufer | [Oeschinensee-Betreiber](https://www.oeschinensee.ch/wandern/): breiter Direktweg C ca. 20 min **ab Bergstation**, anspruchsvolle Heuberg-Tour nicht mit dem Seeufer-Spaziergang gleichsetzen. |
| act-055 | Kandersteg: Dorfrunde | [Tourismus Adelboden-Lenk-Kandersteg](https://adelboden-lenk-kandersteg.ch/aktivitaeten/tour/detail/bahnhof-kandersteg-talstation-gondelbahn-oeschinen): Bahnhof–Oeschinen-Talstation 1,1 km; keine komplette Dorfrundtour. |
| act-056 | Montpellier: alternative Altstadt | [Montpellier Tourismus](https://www.montpellier-tourisme.fr/decouvrir/millenaire/quartiers-emblematiques-de-montpellier/l-ecusson-centre-historique/): L’Écusson und Comédie/Peyrou; **nur bei Routenwechsel** relevant. |
| act-057 | Toulouse: optionaler Innenstadt-Stopp | [Toulouse Tourismus](https://www.toulouse-tourisme.com/de/activite/le-capitole/): Place du Capitole mit Rathaus/Theater; keine fiktiven 2027-Nachtzugzeiten. |

## II. Von 30 auf 37 separat quellen- und lizenzgeprüfte Bildregeln

Die Kuratierung `public/curated-place-photos.mjs` erhielt weitere **7** Einzelzuordnungen, jeweils eigene Wikimedia-Commons-Datei, geprüfter Lizenzvermerk, fotografierter Ort und sichtbarer Urheber-/Bildausschnitt-Hinweis. Sie ergänzen die vorhandene freie Commons-Suchfunktion; sie *sind nicht* pauschale Hotelbilder.

| Abgebildeter Ort | Commons-Seite | Urheber und Lizenz |
| --- | --- | --- |
| Sète: Plage de la Corniche | [Sète plage Corniche.JPG](https://commons.wikimedia.org/wiki/File:S%C3%A8te_plage_Corniche.JPG) | Fagairolles 34, CC BY-SA 4.0 |
| Sète: Canal Royal | [Sète IMG 9402.jpg](https://commons.wikimedia.org/wiki/File:S%C3%A8te_IMG_9402.jpg) | Roehrensee, CC BY-SA 4.0 |
| Sète: Pointe Courte | [Sète Pointe-Courte.jpg](https://commons.wikimedia.org/wiki/File:S%C3%A8te_Pointe-Courte.jpg) | Fagairolles 34, CC BY-SA 4.0 |
| Montpellier: Place de la Comédie | [Place de la Comédie Montpellier.jpg](https://commons.wikimedia.org/wiki/File:Place_de_la_Com%C3%A9die_Montpellier.jpg) | Choinowski, CC BY-SA 4.0 |
| Toulouse: Place du Capitole | [Place du Capitole, Toulouse.jpg](https://commons.wikimedia.org/wiki/File:Place_du_Capitole,_Toulouse.jpg) | kallerna, CC BY-SA 4.0 |
| Venedig: Cannaregio-Ufer | [Venice, Cannaregio, Fond. Cannaregio.jpg](https://commons.wikimedia.org/wiki/File:Venice,_Cannaregio,_Fond._Cannaregio.jpg) | Armin Kleiner, CC BY-SA 4.0 |
| Venedig: Zattere | [Venezia Fondamenta delle Zattere R01.jpg](https://commons.wikimedia.org/wiki/File:Venezia_Fondamenta_delle_Zattere_R01.jpg) | Marc Ryckaert, CC BY-SA 4.0 |

Die Bildregelzahl ist **keine** Zahl einzelner vollständig bebilderter Orte: gleiche Orte tauchen in mehreren Reisevarianten auf, und Fotos werden nur konkreten passenden Motiv-/Stadtregeln zugewiesen. Ein durch ein CDN unterbrochenes Foto bleibt als solches erkennbar, keine erfundene Verfügbarkeit.

## III. Interaktive Lückenliste: Suche und Filter statt hunderter unübersichtlicher Zeilen

Unter **Daten & Fristen** hat die bislang vollständige, aber sehr große Aufstellung **aller unfertigen Katalogeinträge** nun eine schlanke eigene Filterzeile:

- Ort/Name suchen (Ä/É/È mit normalisierter Akzentsuche);
- auf einzelne Städte filtern;
- Kategorie wählen: Aktivität, Unterkunft, Transport, Essen, Shop;
- konkrete Lücke wählen: **Foto**, Beschreibung, EUR-Preis, Öffnungszeit, geografischer Punkt, Geodaten-Beleg, Quelle, Checkout/Bettaufteilung, Fahrplan oder **ohne zusätzlichen Ortsguide**;
- sichtbare Übereinstimmung `N von M offenen Einträgen passend` aktualisiert sich sofort;
- nur Städte mit Treffern bleiben im Ergebnis sichtbar; die Treffergruppe klappt bei aktivem Filter automatisch auf;
- **Filter zurücksetzen** macht alle unvollständigen Einträge sichtbar;
- alle Detail-, Commons-Bildsuche- und Source-Link-Aktionen stehen weiterhin an den einzelnen Zeilen.

Module: `public/coverage-filter.mjs`, `public/entry-coverage-ui.mjs`, `public/app.mjs`, `public/design-round2.css`. Diese Suche filtert **nur clientseitig die vorhandenen DOM-Einträge**, sie führt weder 2027-Ticket-Käufe noch Backend-Datenänderungen aus und löst bei jeder Eingabe keinen teuren Karten-Rerender aus. Handlungsfähige Buttons und ARIA-Live-Ergebniszahl bleiben erhalten.

Tests: `test/coverage-filter.test.mjs` prüft Normalisierung, echte Lückendaten aus allen Varianten, den vollständigen Zeilen- und HTML-Bestand. `test/portable-browser.mjs` wechselt in einem echten Chrome-Test von kompletter Quelle zu **nur Foto-Lücken**, dann Suchtext **SÈTE**, macht ein Bildschirmfoto `15-data-gaps-filtered.png`, setzt den Filter zurück und prüft, dass nichts verloren ging.

## IV. Weiterhin offen / Annahmen sauber begrenzen

- **57/57** bezieht sich auf eigens dokumentierte Quellenkontexte für **V19-Aktivitätsideen**, nicht auf 828 automatisch vollständig belegte Einträge aus allen Reisevarianten.
- Manche Guides sind Stadtteilbeschreibungen oder ein **Beispielbetrieb** für eine noch nicht ausgewählte Idee. Daher verbleibt der Quellstatus „optional“/„Beispiel“ und **kein** 2027-Preis oder gebuchter Kurs.
- Im vollständigen Katalog fehlen noch individuelle Bild- und Koordinatennachweise, konkrete Restaurant-Menü-Endpreise, Zimmer-/Betten-Konfigurationen, tatsächliche 2027-Hotel-Checkouts und reservierbare Züge.
- Noch nicht verifizierte Preise bleiben `€?`, Bedingungen/CHF werden nicht gefälscht. Der Preisvergleich bleibt getrennt von der Reisekasse.
- **Keine automatische externe Commons-Galerie ohne Prüfung**: Suche ist auswählbar, Autor und Lizenz werden angezeigt, Motivzuordnung bleibt bewusst kontrolliert.
- **Kein Deployment oder Merge** vorgenommen.

## V. Lokal und auf GitHub öffnen

In Branch `feature/v7-data-day-accommodation-rail` `outputs/Reiseplaner/Start.cmd` starten (Node 24), unter `http://127.0.0.1:4173` öffnen. **Daten & Fristen** → nach `Fehlt: Foto` oder `Ohne zusätzlichen Ortsguide` filtern → Ort öffnen und Einträge bzw. lizenzierte Bilder ergänzen. Unter Karte/Entdecken die individuellen Reiseführer in den fünf Ortsinspektor-Tabs lesen.

Die Screenshots der echten Browserläufe werden als GitHub-Actions-Artefakt `reiseplaner-ui-review` erzeugt; die neuen Filterbilder heißen `15-data-gaps-filtered.png`. Die finale CI-Verifikation ist getrennt vom bloßen Commit zu bewerten.
