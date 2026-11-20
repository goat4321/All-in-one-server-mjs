# V86/V87 · Supermarkt-Basiskörbe und bildgestützte Schweizer 14-Tage-Prüfung

Stand: **20.11.2026**. Zielbranch `feature/v7-data-day-accommodation-rail`, PR #5. Zugänglich war GitHub, nicht der lokale Windows-Checkout unter `C:\Users\nagog\Documents\Codex\2026-11-12\...`, nicht dessen private Tripsy-Rohdateien und nicht `outputs/Abnahme-V2` als lokale Quelle. Vier Reisen, originaler Tagesplan, Budget und fremde Varianten bleiben unverändert.

## 1. V86: Ketten vor Einzel-Filialen, 10 Produktgruppen

Das read-only Grundmodell liegt in `public/market-basket-v86.mjs`. Über `public/market-basket-ui-v86.mjs` ist die Kettenmatrix auf der Essensseite in **allen sechs Kernorten** sichtbar, ohne still eine Filiale, Anzahl Filialen, Google-Pin, Abholung oder 2027-Einkauf zu behaupten. Kettenwahl ist eine Recherchedefinition, **kein Filialnachweis**. Die bestehende optionale OSM-/Overpass-Filialsuche bleibt separat auf explizite Nutzeraktion begrenzt.

| Ort | Vergleichsketten | Preispositionen aus bisheriger/nachgeprüfter nationaler Quelle |
|---|---|---:|
| Paris | Carrefour, Monoprix, Franprix | 3/30 |
| Barcelona | Mercadona, Lidl, Aldi | 1/30 |
| Sète | Carrefour, Lidl | 1/20 |
| Nizza | Carrefour, Lidl | 1/20 |
| Kandersteg | Coop | 2/10 |
| Appenzell | Coop, Migros | 4/20 |
| **Summe** | 13 stadtbezogene Ketten-Zeilen | **12/130; 118 offen** |

Die 12 Zellen beruhen auf **8 verschiedenen datierten nationalen Produktbeobachtungen**; an mehreren Orten derselben Kette kann derselbe nationale Produktbeleg erscheinen. Kein echter lokaler Preisvergleich wird daraus abgeleitet. Eine komplette Zehnerliste umfasst Spaghetti 500 g, Reis 1 kg, Tomatensauce 500 ml, Eier 6 Stück, Gemüse frisch 1 kg, Fleisch 500 g, TK-Gemüse 1 kg, Brot 500 g, Käse 200 g und Obst 1 kg. Dies sind **Vergleichsmengen**, keine behaupteten handelsüblichen Packungsgrößen.

| Kette/Land | Konkrete belegte Produktreferenz | Menge | Historischer Online-Preis | Stand/Einordnung |
|---|---|---:|---:|---|
| Carrefour FR | Classic Langkornreis 10 Min. | 1 kg | 1,75 EUR | 19.11.2026, aus dem vorhandenen datierten Mahlzeitenarchiv |
| Monoprix FR | Spaghetti Qualité Supérieure | 500 g | 0,79 EUR | 20.11.2026, nationale Kategorieseite |
| Monoprix FR | Riz Long Grain Incollable | 1 kg | 2,39 EUR | 20.11.2026, nationale Kategorieseite |
| ALDI ES | Cucina Spaghetti schnelle Garzeit | 500 g | 0,75 EUR | 20.11.2026, aus veröffentlichten 1,50 EUR/kg abgeleitet |
| Coop CH | Prix Garantie Spaghetti | 1 kg | 1,20 CHF | 20.11.2026, nationale Onlinereferenz |
| Coop CH | Prix Garantie Parboiled Langkornreis | 1 kg | 1,35 CHF | 19.11.2026, aus vorhandenem Mahlzeitenarchiv |
| Migros CH | Spaghetti | 1 kg | 1,20 CHF | 20.11.2026, Migipedia |
| Migros CH | M-Budget Tomato Sauce | 500 ml | 1,25 CHF | 20.11.2026, Migipedia; Volumen, nicht Masse |

Die URLs sind als Produktbelege in `marketObservations` hinterlegt. `marketUnitPrice` rechnet g→kg, ml→l und Eier→Stück um; eine Dichteumrechnung von ml→g erfolgt bewusst nicht. Für den Vergleichsbedarf werden ganze Packungen aufgerundet. Unterschiede wie Reisart, Verarbeitungsgrad, Eigenmarke, Bio, Kühlung und Haltungsform bleiben offen oder als Qualitätsklasse markiert. Unterschiedliche Qualitätsklassen verbieten einen unkommentierten Gesamtrang; eine Gesamtsumme wird **nur** bei zehn ausgefüllten standardisierten Produktgruppen angezeigt. **Kein Sieger und kein künstlicher Nullpreis für fehlende Positionen**.

Manuelle Preisangaben sind über `marketQuoteForm` in `forms.mjs` anpassbar: Name, Packung, Betrag oder leerer Preis, Qualitätsklasse, Datum, HTTPS-Quelle. Sie sind per `state.marketQuotes` in **der ausgewählten Reisevariante** gespeichert, durch `lib/store.mjs` validiert, rücknehmbar und überschreiben keine Originalbelege. Sie sind ausdrücklich ungeprüfte Referenzen und verändern **weder Einkaufsliste noch Kosteneintrag**. Die bestehende bewusst bestätigte Mahlzeiten-/Budgeterfassung bleibt zuständig.

## 2. V87: Bilder, Quellen und echte Lücken

Das Repository hatte bereits eine große individuell belegte Commons-Fotosammlung. Für die zwei zuvor nur indirekt illustrierten optionalen Schweizer Wanderideen wurden zusätzlich genau zwei konkrete, datierte Commons-Motive ergänzt:

- `hiking:heuberg`: „View over Oeschinensee from Aussichtspunkt Heuberg, Switzerland.jpg“, Alltheswissthings, **10.09.2020, CC BY-SA 4.0**. Original: https://commons.wikimedia.org/wiki/File:View_over_Oeschinensee_from_Aussichtspunkt_Heuberg,_Switzerland.jpg
- `hiking:ebenalp`: „Aescher-Wildkirchli 20210528 01.jpg“, Daniel Kraft (Domob), **28.05.2021, CC BY-SA 3.0**. Original: https://commons.wikimedia.org/wiki/File:Aescher-Wildkirchli_20210528_01.jpg

Beide zeigen ein bestimmtes Motiv/Teilziel, **nicht den aktuellen Zustands- oder Freigabenachweis des Bergwegs**. Sie verwenden den vorhandenen Commons-Renderer in `public/place-profile.mjs` mit Urheber, Lizenz, Quellenlink, Fallback, CSS-Skalierung und Lazy Loading. Externe Commons-Dateipfade sind vorhanden; ein tatsächlicher Online-Bildabruf auf allen Geräten bzw. die gesonderte betriebliche Nutzung von Wikimedia-Hotlinks ist nicht bestätigt. **Keine neuen privaten Hotel-/Airbnb-Fotos, keine fiktiven Hausnummern**.

Neu: `public/swiss-14-quality-v87.mjs` bildet jeden der **14 bestehenden Tage** als quellengebundene, redaktionelle Vorschau ab: max. vier priorisierte Karten aus vorhandenen IDs mit Ortsfoto (oder gekennzeichnetem Fallback), realem Namens-/Detailtext, Preisstatus, Zeit-/Öffnungsstatus, Link zum bereits vorhandenen Detail, vorhandenem Webbeleg und klarer Google-Maps-Suche **nur für öffentliche Aktivitäten**. Bei Reise- und Ruhetagen ohne Tagesideen werden ausdrücklich keine erfundenen Attraktionen ergänzt. Unterkunft/Transfer/Mahlzeiten werden als separate offene Prüfschichten dargestellt, nicht als bestätigte Buchung.

Die neue `swiss14QualityInventory(ctx)` dedupliziert vorhandene Tages-IDs und zeigt für jeden offenen Eintrag Quelle, Motivstatus, fehlende Angaben und Gründe. Die aktuelle Datenlückenseite ergänzt `swiss14GapSummary(ctx)` aus der bisherigen `entryCompleteness`-Logik. Das ist eine **laufzeitberechnete** und reproduzierbare Inventur, keine behauptete vollständige manuelle Validierung jedes Originalorts. IDs, Tageszuordnung und bestehende Reihenfolge bleiben erhalten. Die Hauptansicht verwendet für 2027 nur vorhandene Preis-/Öffnungsreferenzen; externe Buchbarkeit wird nicht erfunden.

## 3. Abnahme und bewusst offen

- Testcode: `test/market-baskets-v86.test.mjs`, `test/swiss-14-quality-v87.test.mjs`; Browserintegration in `test/portable-browser.mjs` prüft Kettenanzeige, manuelle Preisänderung, Reload/Reset, echte Stadt-/Tageskarten für Barcelona, Sète, Kandersteg und Appenzell, Handybreite, Herkunftsnachweise und Varianten-Isolation.
- GitHub CI: siehe aktuellen Check zu PR #5 (dieser Bericht allein behauptet **keinen** bestandenen Lauf).
- **Offen**: Ortsgenaue belegbare Filialpreise für 118 von 130 Ketten×Produkt-Zellen; Einzel-Filialöffnung, Lagerbestand, konkrete Eingänge, echte Laden-Maps-Navigation; 2027-Angebote/Reservierungen; Vollständigkeit aller Medienlizenzen des historischen Altbestands; ursprüngliche lokale private Tripsy/SQLite-Regression; konkrete Bild-Download-Erreichbarkeit und Rechte für externe Hotlink-Infrastruktur; vollständige Hotel- und Transportpreise.
- Keine externen Buchungen/Bezahlungen, keine Änderung an `main`, kein Deployment. Kein Ersatz für die vollumfängliche 61-Punkte-Abnahme.
