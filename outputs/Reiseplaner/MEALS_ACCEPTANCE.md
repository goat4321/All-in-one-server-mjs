# Mahlzeitenpaket · lokale Abnahme vom 19.11.2026

Umfang: CHECKLIST_V2.md P5.3–P5.9, Master V7 Verpflegung und Gruppenbudget. Die Gesamtanforderungen bleiben offen, soweit in der Checkliste angegeben. Umsetzung im lokalen Branch `codex/checklist-v2-audit`, ohne externe Schreibaktionen.

## Fachlicher Umfang

Frühstück, Mittagessen und Abendessen sind getrennt planbar. Vier einfache Rezeptfamilien werden für sechs Hauptorte angeboten. Zusammen mit dem erhaltenen Barcelona-Restaurant sind es 25 stadtspezifische Optionen. Zubereitungszeiten von 10 bis 35 Minuten, Mengen pro Person und für drei Personen sowie Ausrüstung sind Planungsannahmen. Ein kalter Salat benötigt keinen Herd, seine Zutaten werden dennoch eingekauft. Haferflocken mit Milch haben einen separaten Kühlhinweis.

Unterkunftsbezug, Ankunft und Check-out bestimmen den Küchenhinweis. Eine nicht gewählte Unterkunft begründet keinen Zugang. Frühstück verwendet die vorherige Nacht. Fehlende Check-out-Zeit oder eine Mahlzeit mit Dauer über den Check-out hinaus bleibt ungeklärt. Die tatsächliche gespeicherte Essenszeit ist maßgeblich.

Portionsverbrauch, ganze Packungen und tatsächlich erfasste Ausgaben sind getrennte Werte. Mehrere Rezepte teilen Produkte vor der Packungsrundung. Vorräte werden abgezogen. Ein Beleg ersetzt die zugehörige Planposition, und geschützte Mahlzeiten werden nicht automatisch ausgetauscht. EUR und CHF bleiben getrennt; fehlende Preise werden nicht zu null.

## Preis- und Quellenstand

Die vollständigen neun offiziellen Produktlinks stehen in `lib/meal-catalog.mjs` und in der Oberfläche. Beobachtet am 19.11.2026:

| Land | Haferflocken | Milch | Reis | Referenzsumme |
|---|---|---|---|---|
| Frankreich, Carrefour | 500 g / 0,79 EUR | 1 l / 1,05 EUR | 1 kg / 1,75 EUR | 3,59 EUR |
| Spanien, Carrefour | 500 g / 0,84 EUR | 1 l / 0,83 EUR | 1 kg / 1,20 EUR | 2,87 EUR |
| Schweiz, Coop Prix Garantie | 500 g / 0,70 CHF | 1 l / 1,40 CHF | 1 kg / 1,35 CHF | 3,45 CHF |

Das sind nationale Online-Referenzen. Weder städtische Filialpreise noch Verfügbarkeit oder Preise für September 2027 sind belegt. Die Schweizer Milch ist gekühlt, 2,5 Prozent; die übrigen Varianten sind anders beschrieben. Reisvarianten unterscheiden sich ebenfalls. Der Vergleich benennt diese Unterschiede und ermittelt keine billigste Kette oder Währungsrangliste. Neun weitere Zutaten bleiben ohne belegten Preis; die Packungsgrößen sind dort ausdrücklich Annahmen. Generische Produkt-Suchlinks dienen als nächster Rechercheschritt.

## Reproduzierbare Nachweise

Abschließender lokaler Lauf: **499/499 vollständige Node-Tests**, **478/478 portable Node-Tests**, Kartenbericht für vier Varianten und HTTP-Smoke-Test bestanden. Der vollständige echte Chrome-Flow mit drei Mahlzeiten und der separate verzögerte PUT-Rennfall bestehen. Die portable Reihe ist eine Teilmenge der vollständigen Reihe und wird nicht zu ihr addiert. Keine übersprungenen oder fehlgeschlagenen Node-Fälle. Reproduzierbar mit `npm test`, `npm run check:portable`, `node test/portable-browser.mjs` und `npm run test:meal-race` unter Node 24 mit Chrome/Edge.

Die unabhängige lesende Hauptprüfung und die kleine Nachprüfung nach Such-/Währungskorrektur melden keine verbleibenden Befunde in diesem Umfang. Die Nachprüfung führte zusätzlich 20 gezielte Tests erfolgreich aus. Das ist keine Vollabnahme sämtlicher Websiteanforderungen. Zu den neuen Fällen gehören:

- Kalte und warme Zutaten gemeinsam, unterschiedliche Einheiten und Währungen, offene Preise, gespeicherte Vorräte und manuell bestätigte Preise.
- Alle drei Slots, Ersatz nur im gewählten Slot, flexible Uhrzeiten, vorherige Übernachtung, Anreise/Check-out, Beleg-/Buchungs-/Sperrschutz.
- Ladenstopp aus bekanntem Ort, keine doppelten Lebensmittelkosten, Wiederladen, Undo, Datum und Variantenbindung.
- Selbstversorgung statt Restaurantklassifikation für kalte und warme Rezepte, einschließlich tatsächlich gerenderter Suchkarten.
- Gezielte Verzögerung einer echten PUT-Antwort in Chrome: Ein aus altem Zustand geöffnetes Mittagsformular darf ein gerade gespeichertes Frühstück nicht entfernen.
- Native Enter-Taste und Fokus der Mahlzeitenauswahl; Darstellung bei 1440, 820 und 390 Pixeln. Zusätzlich CHF-Auswahl in Kandersteg.

Die bestehende lokale Vorschau wurde mit derselben privaten SQLite-Datei auf Port 4175 neu gestartet. Ihre reale Start-API liefert HTTP 200, sechs Rezeptstädte, 25 Optionen, neun Produktreferenzen und alle vier ursprünglichen Varianten. `interrail_swiss` bleibt 01.–14.09.2027 mit drei Reisenden; `swiss_lakes` bleibt 05.–11.09.2027 mit vier Reisenden. Der Vorschauprozess ist lokal, ohne Veröffentlichung.

Sechs ergänzende Ansichten liegen unter `outputs/Abnahme-V2/mahlzeiten` im ursprünglichen Aufgabenordner: `86-drei-mahlzeiten-{1440,820,390}.png` und `87-basiskorb-{1440,820,390}.png`. Die Smartphone-Mahlzeitenübersicht und der Vergleich wurden zusätzlich visuell geöffnet. Der breite Vergleich ist auf dem Smartphone innerhalb der Tabelle horizontal scrollbar; die ganze Seite läuft nicht über. Die vier neuen Konsolenlogs heißen `meals-full.log`, `meals-portable.log`, `meals-browser.log` und `meals-race.log` unter `outputs/Abnahme-V2/logs`.

Externe Medien/Karten sind im reproduzierbaren Browserlauf blockiert; die Aufnahmen belegen lokale Oberfläche und Datenfluss, keine aktuellen externen Abrufe oder echte Mobilgeräte. Die vorhandenen 66 Hauptseitenbilder stammen vom vorherigen Paket.

## Verbleibende Grenzen

P5.1/P5.2 sind nicht abgeschlossen: vollständige Ketten-/Filialbelege und belastbare stadtweite Häufigkeiten fehlen. P5.3/P5.7 bleiben teilweise: der dreiteilige nationale Referenzkorb ist kein vollständiger lokaler Reiseeinkauf; neun Zutaten haben offene Preise. Bei Bedarf werden Preise bewusst lokal eingegeben. Rezepte sind einfache Planungsoptionen ohne Ernährungs- oder Allergiefreigabe. Die übrigen offenen Anforderungen stehen unverändert in CHECKLIST_V2.md.
