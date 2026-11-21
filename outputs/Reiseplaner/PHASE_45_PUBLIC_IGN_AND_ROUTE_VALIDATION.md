# Phase 45 · Amtliche Hausadressen, zuverlässige Fußweg-Endpunkte und klare Kartenlabels

**Datum:** 15.11.2026  
**Branch:** `feature/v7-data-day-accommodation-rail` · PR #5 bleibt Draft · `main` nicht ändern.

## 1. Tatsächliche Kartenfortschritte

- Gesamtumfang bleibt **829 variantenspezifische Kartenobjekte** über vier Reisemodelle. Durch die gesonderte BAN-Hausnummernrecherche jetzt **556 mit Kartenpunkt**, **273 ohne individuellen Kartenpunkt** (vorher 554 / 275). Gemeinsame Orte werden in verschiedenen Varianten mehrfach gezählt.
- Im Archiv der veröffentlichten Adressen sind **34 von 50** mit unabhängigem Positionsnachweis statt zuvor 33; **16** bleiben trotz bekannter Hausanschrift ohne genügend genaue Koordinate. Diese 16 Adressen sind **nicht** gleichbedeutend mit 16 anonymen Airbnb-Unterkünften.
- Die ursprünglichen **175 V06-OSM-Koordinaten** und ihre historische Prüfsumme bleiben vollständig unverändert. Die nachträgliche französische BAN-Quelle wird in V09 als eigenständiger Nachweis übernommen.

## 2. Sieben öffentliche Adressen in Sète einzeln gegen staatlichen Geokodierungsdienst geprüft

Offizielle API: https://data.geopf.fr/geocodage/search  
Dokumentation: https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/

**Treffer:** `research:bcom_4032998` – Le Pouffre, 85 Grande Rue Haute, 34200 Sète. Der Betreiber belegt die Hausadresse unter https://www.lepouffre.com/contact/ . Die Geoplateforme/BAN antwortete mit:
- Adresse **85 Grande rue Haute 34200 Sète**, Hausnummer `85`, Typ `housenumber`, PLZ `34200`
- BAN-ID `34301_0850_00085`
- GPS **[43.398442, 3.694451]** (Latitude, Longitude)
- Quellenabfrage: https://data.geopf.fr/geocodage/search?q=85+Grande+Rue+Haute%2C+34200+S%C3%A8te%2C+France&index=address&limit=6

Dies ist ein **amtlicher Hausnummernreferenzpunkt**, kein garantierter Ferienwohnungseingang, kein spezifisches Zimmer und keine Überprüfung der Unterkunftsverfügbarkeit für September 2027. Er wird in allen zugehörigen Varianten ausschließlich über `geoEvidence.isCentroid:true` mit Quellenangabe eingebunden.

**Sechs bewusst nicht übernommene Kandidaten:**
1. Rue de la Liberté 21 – nur Straße
2. Promenade Jean-Baptiste Marty 26 – nur Straße
3. Rue Pierre Semard 42 bis – keine exakt passende Hausnummer einschließlich Zusatz
4. Rue du Grand Large 8 – nur Straße
5. Rue de la Pétanque 11 – nur Straße
6. Traverse des Rameurs 19 – nur Straße

Alle sieben Statusentscheidungen mit Quellenabfrage stehen dauerhaft in `data/research-v45/ign-source-review.json`. Der reproduzierbare, auf sieben öffentliche Adressen begrenzte Einzelprüfer ist `scripts/geo-ign-v45.mjs`. Das vollständige API-Response-Prüfartefakt wurde in GitHub Actions erzeugt; aus Rücksicht auf öffentliche Dienste läuft der Live-Abgleich **nicht** bei jedem späteren CI-Durchlauf erneut. Private Airbnb-Wunschlisten wurden nie geokodiert.

## 3. Weggeometrie und Karten-UX

- `footpathMatchesStops` verlangt jetzt höchstens **75 m** Router-Snap zu **beiden** gewählten Koordinaten (zuvor 250 m). Das ist eine konservative Plausibilitätsschwelle, keine garantierte Türlage.
- Auch der **einfache A→B-Routenplaner** verwirft nun Fußwegantworten, die die Endpunktprüfung nicht bestehen. Vorher galt dieser Check nur zuverlässig in Route Studio und Tagesplan-Übernahme.
- Bei erfolgreichen A→B-Routen weist die UI ausdrücklich darauf hin, wenn 1 oder 2 Zielkoordinaten nur aus einem Gebiet, einer Anbieterposition oder einer ungeprüften Quelle stammen. Ein realer Fußweg bestätigt nicht automatisch den tatsächlichen Eingang.
- Die kompakte Auswahlkarte unterscheidet jetzt **Quellenpunkt / Gebäude- oder Gebietsreferenz / Anbieterposition prüfen / Position prüfen / Standort offen**.
- Bei ungeklärten Preisen im Karten-Explorer ist der sichtbare Status **„Offen“** statt `€?`; historische Preistier-Daten und bedingte Ermäßigungen bleiben in den Details und internen Berechnungen unverändert. Es wird dadurch kein Preis erfunden.

## 4. Prüfungen und weiterhin offene Arbeit

- Node-Modelltests einschließlich gesonderter IGN-Quelle, Datenherkunft, Routensnap, A→B-Warnhinweis und Karten-Auswahlstatus.
- Portable GitHub-CI: bestehende Modell-, Syntax-, Python- und Serverprüfungen sowie echter Chrome-Browserlauf und mobile Screenshots.
- **Nicht erledigt:** 273 variantenspezifische Orte ohne Einzelkoordinaten, **16** öffentliche Adressen ohne unabhängigen GPS-Beleg, weitere Quellennachweise zu bereits vorhandenen Anbieter-Pins, Bildlizenzen und Online-Abnahme mit geladenen Kartenkacheln.
- Keine automatischen öffentlichen Hausnummern-Schätzungen, privaten Airbnb-Pins, September-2027-Ticket-/Hotelpreiszusagen oder Buchungen.
- Regression gegen die vier tatsächlich privaten Tripsy-Ursprungsdateien ist weiterhin separat erforderlich; `main` und externe Reservierungen unverändert.

**Einordnung:** 556/829 bedeutet 67,1 % technisch vorhandene Kartenpositionen, **nicht** 67,1 % nachgewiesene Gebäudezugänge oder unabhängig überprüfte POIs.
