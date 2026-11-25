# Phase 67 – 37 weitere vorhandene Orte vertieft, sieben objektbezogene Fotos

**Bearbeitet am 16.11.2026** auf `feature/v7-data-day-accommodation-rail`, Draft-PR #5. `main`, Buchungen, Preise im Reisebudget, individuelle Tagespläne und private Tripsy-Rohdaten sind nicht geändert.

## A. 37 bestehende Ortsprofile mit strukturierter Besuchsanleitung

**Keine neuen Dubletten:** Die ergänzten Angaben befinden sich in denselben Einträgen aus früheren offiziellen Recherchepaketen:

| Archiv | Neue vertiefte einzigartige Ortsprofile |
|---|---:|
| `research-v54/official-discoveries.json` | 13 |
| `research-v55/official-discoveries.json` | 8 |
| `research-v60/official-discoveries.json` | 16 |
| **Gesamt** | **37** |

Zu jedem Ort gibt es `visitorGuide` mit konkret benannten Sehenswert-Punkten, kurzer praktischer Besuchsplanung, passender optionaler Kombination, standortsicherem Anreisehinweis und besonderem Prüfpunkt für 2027.

### Schwerpunkt-Beispiele

- **Toulouse/Blagnac:** Halle de La Machine, Aeroscopia mit getrennten Ticketarten, zusätzlicher Anreise und Besuchsdauer.
- **Narbonne/Sète:** Horreum, Narbo Via, Les Halles, Musée Paul Valéry, Espace Georges Brassens mit Mittagspausen und differenzierten Zugangshinweisen.
- **Marseille/Nizza:** Mucem-Außenanlagen und Park Longchamp als kostenlose Flächen getrennt von Museumstickets; weitere Stadtmuseen als Regenalternativen.
- **Genua/Mailand/Venedig:** Kultur- und Technikmuseen, Ticketkombinationen, Museumszugang, Wochentage und ermäßigungsbedingte Nachweise.
- **Schweiz:** Äscher, Schieferbergwerk Engi, Pfingstegg, Blausee und Ostschweizer Museen; Wetter, Bergbahnbetrieb, Sicherheitsbedingungen und verifizierte Führungsdaten getrennt von nicht bestätigter September-2027-Buchbarkeit.

Dateien `lib/operator-discoveries-v54.mjs`, `-v55.mjs`, `-v60.mjs` prüfen und erhalten die neuen Guide-Felder in den vorhandenen Katalogdatensätzen. Die seit Phase 65 vorhandene `place-profile.mjs`-Ansicht zeigt die fünf Guide-Fakten für jeden passenden Ort. `discoveryV60.secondarySourceUrl` wird nun zusätzlich als offizieller Link gezeigt, sofern im Quellenarchiv vorhanden.

**Unverändert:** `booked:false`, `selected:false`, `price:null`, `start:null`, `end:null` und niemals als bestätigt markierte September-2027-Tickets/Öffnungen. Fehlende exakte Objektkoordinaten wurden nicht aus Foto-EXIF oder allgemeinen Kartenansichten konstruiert.

## B. Sieben zusätzliche konkrete Wikimedia-Commons-Fotos

Quellen sind **individuelle Commons-Dateiseiten** mit überprüfbaren Urhebern und Lizenzen. Bilder bleiben externe `Special:FilePath`-Referenzen mit sichtbarer Attribution. Die Fotoaufnahmen zeigen teilweise historische Ausstellungszustände bzw. ein Exponat statt des heutigen Eingangs – entsprechend im Credit gekennzeichnet.

| Vorhandener Ort | Exakte Commons-Dateiseite | Fotograf und Lizenz |
|---|---|---|
| Museo Fortuny, Venedig | [Interno, Museo Fortuny, Venezia.jpg](https://commons.wikimedia.org/wiki/File:Interno,_Museo_Fortuny,_Venezia.jpg) | Nicola Quirico, CC BY-SA 4.0, Museumsinnenraum 2025 |
| Musée de la Mer, Sète | [Maquette du Gabès, Musée de la Mer 2015](https://commons.wikimedia.org/wiki/File:Maquette_du_%22Gab%C3%A8s%22_-_Mus%C3%A9e_de_la_Mer_de_S%C3%A8te,_2015.JPG) | Anthony Levrot, CC BY-SA 4.0, Schiffsmodell 2015 |
| Kunsthalle Appenzell | [Appenzell-Kunsthalle.jpg](https://commons.wikimedia.org/wiki/File:Appenzell-Kunsthalle.jpg) | Roland Zumbuehl, CC BY 3.0, Gebäude 2009 |
| Halle de La Machine, Toulouse | [Minotaure.jpg](https://commons.wikimedia.org/wiki/File:Minotaure.jpg) | Frédéric Neupont, CC BY-SA 4.0, Minotaurus 2021 |
| Aeroscopia, Blagnac | [Aeroscopia Blagnac.jpg](https://commons.wikimedia.org/wiki/File:Aeroscopia_Blagnac.jpg) | Patrice Bon, CC0 1.0, Museum 2018 |
| Narbo Via, Narbonne | [Musée Narbonne (1).jpg](https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_Narbonne_(1).jpg) | Jcb-caz-11, CC BY-SA 4.0, Ausstellungsraum 2023 |
| Berggasthaus Äscher | [Äscher.jpg](https://commons.wikimedia.org/wiki/File:%C3%84scher.jpg) | Friedrich-Karl Mohr, CC BY-SA 3.0 DE, Blick von Chlihütten 2014 |

**Bildlizenzen:** Wo nötig wird die exakte regionale Lizenzurl zusätzlich im Fotoobjekt mitgeführt und über `curatedPlacePhoto` zurückgegeben; das betrifft hier CC BY-SA 3.0 DE. Der bestehende Fallback bleibt ein gesondert gekennzeichnetes Stadtmotiv statt eines falsch ausgegebenen Objektfotos. Keine Fotos privater Unterkünfte, keine Buchungsfotos und keine urheberrechtlich ungeprüften Maps- oder Suchmaschinenbilder übernommen.

## C. Qualitätssicherung

`test/entry-guides-v67.test.mjs` kontrolliert:
1. Genau 37 unterschiedliche vollständige Guides in V54/V55/V60 und korrekte Varianten-Übernahme.
2. Sichtbarkeit der neuen Besuchshinweise, der Kartenlinks und Betreiberlinks.
3. Keine als bestätigt ausgegebenen 2027er Preise oder Buchungen und keine Änderung von Tags/Koordinaten.
4. Ablehnung kaputter/missing Guide-Archive vor Mutation.
5. Sieben verlässliche Bildzuordnungen mit Urheber, Commons-Dateiseite, Lizenz und Schutz von Unterkunftsprofilen.

In `package.json` ist dieser Test in `test:portable` eingebunden.

**Grenzen:** Die 2027er Besuchstarife, aktuelle Bahnen/ÖPNV, regionale Wetter- und Sicherheitssituationen sowie externe Commons-Netzwerkverfügbarkeit sind nicht automatisch garantiert. Der Entwicklungsbranch muss für eine veröffentlichte Website erst bewusst übernommen/deployed werden. Lokale Tripsy-Rohdaten-Regression gesondert erforderlich.

**CI-Abnahme:** Ergebnisse nach Abschluss des betreffenden GitHub-Actions-Laufs dokumentieren; erfolgreiches Speichern eines Commits ersetzt keine Testabnahme.
