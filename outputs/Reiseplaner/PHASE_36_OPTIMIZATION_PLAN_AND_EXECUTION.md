# Phase 36 – priorisierter Optimierungsplan und Umsetzung

Stand: 14.11.2026. Arbeitsbranch `feature/v7-data-day-accommodation-rail`, Draft-PR #5. Keine Veröffentlichung oder Übernahme in `main`.

## Geprüfter Ausgangspunkt

Prüfung der tatsächlichen Implementierung in `public/app.mjs`, `public/views.mjs`, `public/browse-hub-v35.mjs`, `public/map-explorer.mjs`, `public/reference-map-scene.mjs`, `public/smart-filters.mjs`, den Daten-/Supermarktmodulen sowie der vorhandenen Node- und Browser-Tests. Visuelles Ziel bleiben die tatsächlich zuvor bereitgestellten Barcelona-/InterrailPlan-Referenzen: starke klare Hierarchie, ruhige große Karten, erkennbare Navigation und einfache, getrennte Reise-/Tagesansichten.

## Abgearbeiteter Plan

| Prio | Konkrete Schwachstelle | Änderung | Prüfung |
| --- | --- | --- | --- |
| P0 | Externe Supermärkte waren nur auf der Karte, nicht im Verpflegungsverzeichnis | `foodDirectory()` integriert explizit geladene Overpass-Punkte in normale Stadt-/Reiselisten; Datenquelle und Präzision werden gezeigt | Isolierte Funktionsprüfung sowie neuer Test `test/food-discovery-v36.test.mjs` |
| P0 | Zu externe Geodaten waren editierbare Aktivitätsaktionen denkbar | `readOnlyExternal` blockiert `edit`, `choose`, `clone-item`; externe Details zeigen nur Herkunft, Adresse und Kartengenauigkeit | Codeprüfung + Daten-/HTML-Regression |
| P0 | Bei Städtesprüngen konnten falsche Plantermine übernommen werden | Kartenfokus wählt zugehörigen Reisetag der tatsächlichen Zielstadt | Action-Handler geprüft; vollständige Browserabnahme steht aus |
| P1 | Zwei getrennte Merkspeicher (Planfavoriten/Kartenmerkliste) führten zu widersprüchlichen Anzeigen | Beide Quellen zu gemeinsamen `browseSavedIds` vereint, reversibles Speichern über `browse-save`/`explorer-save`, externe POIs nur lokal | Isolierte Tests inkl. Favoriten und OSM-POI |
| P1 | Hotels, Aktivitäten und Essen wurden erst nach expliziter Suche gefiltert | Debounce 320 ms, Fokus/Caret bleiben erhalten, Tastatur-Enter weiter nutzbar | Browserregression hinzugefügt; ausstehender Chromelauf |
| P1 | Bei leeren Filtern keine direkte Korrektur | Große Aktion „Suche und Filter zurücksetzen“ in allen drei Entdecker-Tabs | HTML und Ereignislogik geprüft |
| P1 | Über mehrere Städte gefundene Mahlzeiten und Aktivitäten konnten falsch kontextualisiert werden | Mahlzeiten den Menü-Städten zugeordnet; Restaurantkarten nutzen hinterlegte Mahlzeitenprogramme und zeigen bei eingeplanten Orten Bearbeiten | Action-/Modultests |
| P1 | Laden neuer Supermärkte war wegen bisheriger Kartensortierung nicht sichtbar | Geladene POIs im ausdrücklichen Supermarktfilter vorne sortiert, höchstens 24 Karten zunächst | Filterprüfung |
| P1 | Datums- und Buchungsbotschaften auf der Karte konnten unzutreffend sein | Booking-Status aus aktiv markierten Einträgen abgeleitet, Galerieüberschriften nach Kartenumfang, „im Reiseplan“ statt „heute“ | Kartenmodul-Regressionsprüfung und korrigierte Testfälle |
| P2 | Doppelter Tag/Stadt/Route-Umschalter überfrachtete Karte | Sichtbare Scope-Schalter im Kartenkopf, redundante drei Buttons im Overlay ausgeblendet; Merkliste dort weiterhin erreichbar | CSS-Syntax; Browser-Referenzvergleich ausstehend |
| P2 | Lange Supermarkt- und Quellenhinweise verdrängten Hauptaktionen | Nachweise sichtbar gekennzeichnet, aber in separate Details und kleine Statuszeile gelegt | UI-Markup/Styles kontrolliert |

## Konkrete Änderungen

- `public/food-discovery-v36.mjs`: zentrale Quelle für Restaurants, Cafés, Einkäufe, recherchierte Kochoptionen und ausdrücklich vom Benutzer nachgeladene Supermärkte. Bleibt unabhängig vom Reisetag.
- `public/app.mjs`: `browse-market-load`, `browse-save`, `browse-food-saved`, `browse-reset`, zeitabhängige Datenabfrage mit Fehlerhinweisen, Tastatureingabe-Suche mit Fokusbewahrung und Kontextschutz für andere Reisestädte.
- `public/views.mjs`/`public/browse-hub-v35.mjs`: Lebensmittelkategorien, Merkliste, Reset, Quellenlabel, präzisionskennzeichnende Shopkarten und passender Stadt-Ladebutton.
- `public/reference-map-scene.mjs`, `public/browse-hub-v35.css`: kurze sachliche Zustandsangaben und weniger redundante Kartensteuerung.
- `public/smart-filters.mjs`: Zusammenführung von bisher getrennten Favoritenständen im Filter.
- `test/food-discovery-v36.test.mjs`: 8 neue Katalog- und Pseudoshop-Regressionen. `test:portable` ruft diese zusätzlich auf. `test/portable-browser.mjs` enthält live getriggerte Suche, Supermarktfilter und neue Screenshotpunkte. `test/reference-map-scene.test.mjs` verifiziert die Änderung der Buchungsanzeige.

## Umfang und Prüfstand

- In der verbundenen Laufzeit wurden zehn repräsentative isolierte Modultests mit nachvollziehbaren Mock-Datensätzen ausgeführt: **10/10 erfolgreich**. Parserprüfungen für `app.mjs`, `views.mjs`, `browse-hub-v35.mjs`, `food-discovery-v36.mjs`, `smart-filters.mjs` und beide Testmodule sowie CSS-Klammerprüfung waren erfolgreich.
- Die kompletten Node-/Browser-Tests auf dem GitHub-Runner konnten bislang nicht durchgeführt werden: GitHub-Actions-Jobs scheitern in dieser Umgebung wiederholt bei **0 ausgeführten Schritten**. Ein grüner CI-Lauf bzw. eine neue reale Pixel-Screenshotabnahme wird ausdrücklich nicht behauptet.
- Live-Abfragen nach OSM/Overpass-Stores werden nur auf Nutzeraktion gestartet. Der begrenzte 6,5-km-Radius und die Obergrenze von 160 Antworten bleiben bestehen. Laden im Verpflegungs-Tab ist eine Recherche, keine Verfügbarkeits-/Öffnungszeitenbestätigung.

## Weitere Verbesserungen – bewusst nicht erfunden

| Nächster Schritt | Was zur Abnahme fehlt | Priorität |
| --- | --- | --- |
| Reale Screenshots der 2026-11-14-Version und Vergleich mit allen Referenzen | funktionierender Browserlauf des kompletten Repositories auf 1440 × 900 und 390 × 844 | hoch |
| Vollständige Node-/Chromium-Tests | laufbereiter CI-Runner bzw. echter Projektordner auf Rechner des Nutzers | hoch |
| Bildabdeckung bei Hotels und Restaurants | konkret lizenzierte Bilder der richtigen Objekte, keine fremden Anbieterfotos übernehmen | mittel |
| Alle Supermärkte im Stadtgebiet statt 6,5-km-Radius | stadtgebietsweise, nach OSM-Lastregeln begrenzte Abfrage und zusätzliche Quelldokumentation | mittel |
| Definitive 2027-Unterkunftspreise und Bahnverbindungen | individueller Betreiber-Checkout und reale 2027-Buchungsfenster | später, nur mit echten Quellen |

**Abnahmestatus:** Funktionsänderungen umgesetzt, Teil-/Parserprüfungen bestanden; vollständige Browser- und Screenshotprüfung noch offen. Keine pixelgenaue Designübereinstimmung behaupten.


## Abschließende Korrektur der Kartenfilter

Beim Wechsel zwischen **Mein Tag**, **Stadt entdecken** und **Alle Reiseorte** wurde bisher der versteckte Zustand „Nur gemerkte Orte“ weiter angewendet. Das konnte die neue Ansicht leer wirken lassen, obwohl Kartenpunkte vorhanden waren. Der Scope-Handler setzt `mapSavedOnly` jetzt zurück und lässt nur ausdrücklich erkennbare Kategorie-/Suchfilter bestehen. Eine passende Browser-Regression wurde zu `test/portable-browser.mjs` hinzugefügt. Vollständiger Chromelauf bleibt bis zur Verfügbarkeit eines Runners offen.
