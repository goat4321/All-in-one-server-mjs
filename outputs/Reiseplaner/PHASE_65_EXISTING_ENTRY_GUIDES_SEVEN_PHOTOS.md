# Phase 65 – Bestehende Reisekatalog-Einträge vertieft, sieben Objektfotos

Stand: **16.11.2026**. Weiterentwicklung im Draft-PR #5 auf `feature/v7-data-day-accommodation-rail`.
`main`, private Tripsy-Daten, Buchungen, Preise im Reisebudget und Tagespläne bleiben unverändert.

## 1. Zehn vorhandene V62-Einträge konkretisiert

In `data/research-v62/official-discoveries.json` hat **jeder der zehn bereits importierten Orte** nun ein gesondertes `visitorGuide` mit:
- mindestens zwei sachlich zutreffenden Sehenswürdigkeiten/Schwerpunkten;
- Besuchsplanung einschließlich Einschränkungen;
- passenden Kombinationen, **ohne** sie automatisch in Tagespläne einzutragen;
- adressbasiertem Anreise-/Eingangshinweis, **ohne** fehlende GPS-Pins zu erfinden;
- einer konkreten Prüfliste für September 2027.

Betroffene Orte: Musée Curie, Parc des Buttes-Chaumont, CCCB, Musée de la Mer de Sète, Palais Lascaris, Musée de la Photographie Charles Nègre, Parco Villa Durazzo Pallavicini, Parchi di Nervi, Museo Fortuny und Kunsthalle Appenzell.

Der `lib/operator-discoveries-v62.mjs`-Import validiert die neuen Felder und erhält sie in `discoveryV62.visitorGuide`.
`public/place-profile.mjs` zeigt die fünf neuen Informationsblöcke im ausführlichen Eintragsprofil und verlinkt ergänzende offizielle Besucherinformationen, wenn ein verifizierter zweiter Link bereits vorhanden ist. Google-Maps-Such- und ÖPNV-Links werden unverändert pro Eintrag erzeugt.

## 2. Sieben konkret zugeordnete, lizenzierte Objektbilder

Quelle sind jeweils die **individuellen Wikimedia-Commons-Dateiseiten**, nicht Google-Bildsuche oder Anbieterfotos. Der echte Dateiname wird von der bestehenden Bildpipeline über `Special:FilePath` als externes Bild geladen; Quellenlink, Name, Lizenz und historisches Aufnahmedatum sind im sichtbaren Credit hinterlegt. Kein Bild wird als aktueller Zustand oder exakter Eingangsnachweis ausgegeben.

| Bereits vorhandener Eintrag | Dateiname auf Commons | Credit/Lizenz |
|---|---|---|
| Musée Curie Paris | [Musée Curie, Paris.JPG](https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_Curie%2C_Paris.JPG) | Guilhem wilko · CC BY-SA 3.0 · Eingang 2013 |
| Parc des Buttes-Chaumont | [Parc des Buttes-Chaumont.jpg](https://commons.wikimedia.org/wiki/File:Parc_des_Buttes-Chaumont.jpg) | FreCha · CC BY-SA 4.0 · Parkaufnahme 2020/2024 |
| CCCB Barcelona | [Barcelona – CCCB](https://commons.wikimedia.org/wiki/File:Barcelona_-_Centre_de_Cultura_Contempor%C3%A0nia_de_Barcelona_(CCCB).jpg) | Zarateman · CC0 1.0 · Bau 2016 |
| Palais Lascaris Nizza | [Palais Lascaris – Escalier.jpg](https://commons.wikimedia.org/wiki/File:Palais_Lascaris_-_Escalier.jpg) | Jean-Pierre Dalbéra · CC BY 2.0 · Treppe 2011 |
| Musée de la Photographie Nizza | [Musee de la Photographie de Nice.jpg](https://commons.wikimedia.org/wiki/File:Musee_de_la_Photographie_de_Nice.jpg) | Sprsarcastique · CC BY-SA 4.0 · Fassade 2019 |
| Villa Durazzo Pallavicini Pegli | [Castello del Capitano](https://commons.wikimedia.org/wiki/File:Villa_Durazzo-_Pallavicini,_Il_Castello_del_Capitano_a_Genova_Pegli,_Italia.jpg) | Faber1893 · CC BY-SA 4.0 · 2017 |
| Parchi di Nervi Genua | [Parchi di Nervi.jpg](https://commons.wikimedia.org/wiki/File:Parchi_di_Nervi.jpg) | Stefano Soresina · CC BY-SA 3.0 · 2014 |

Das passende Ortsbild erscheint im Katalog, in Ortsdetails und der zugehörigen Bilddarstellung. Die Commons-Dateien bleiben externer Inhalt, daher kann eine Netzwerk- oder Quellenausfall zu einem Fallback führen. Bei einer Wiederveröffentlichung sind Lizenzhinweise und ggf. Share-Alike-Bedingungen zu beachten.

## 3. Bestehende Sicherungen bleiben erhalten

- Kein neu angelegter Reisetag und keine Änderung an favorisierten oder gebuchten Einträgen.
- Keine als bestätigt ausgegebenen September-2027-Preise, -Stunden oder -Reservierungen.
- Keine automatisierte Massen-Geokodierung, keine Koordinaten von Privatunterkünften.
- Einträge werden in den vier passenden Reisevarianten wie bisher durch die V62-Importlogik verteilt.
- Neue Datei `test/entry-guides-v65.test.mjs` kontrolliert Guide-Pflichtfelder, Varianten, die Detail-UI, alle sieben Bildlizenzen und die unveränderten Preis-/Buchungsdefaults.
- `test:portable` im `package.json` um diese Regression erweitert.

CI-Ergebnis ist erst nach erfolgreichem GitHub-Actions-Durchlauf zu bestätigen. Eine lokale Regression mit privaten Original-Tripsy-Dateien ist weiterhin separat nötig.
