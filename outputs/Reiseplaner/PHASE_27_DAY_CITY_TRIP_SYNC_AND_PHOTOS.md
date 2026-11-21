# Phase 27 – Echte Tageskarte, synchronisierte Agenda, Bildergalerie und Planungswarnungen

**Stand:** 14.11.2026 · GitHub-Branch `feature/v7-data-day-accommodation-rail` · Draft-PR #5. Kein Merge, keine Veröffentlichung und keine externen Buchungen.

## 1. Kartenansichten sind jetzt inhaltlich verschieden

Der vorherige Button `Mein Tag` änderte hauptsächlich `view.total` und den sichtbaren Kartenausschnitt, während `explorerData()` weiterhin die ursprüngliche Standortauswahl (`mapScope`) verwendete. Damit wurden mitunter trotz „Mein Tag“ hunderte noch gar nicht geplante Ortsvorschläge angezeigt.

Die überarbeiteten drei Schalter verwenden nun gemeinsam **eine** wirksame Filtervariable `mapScope`:

| Modus | Datenbasis | Karte und Liste | Wichtig |
| --- | --- | --- | --- |
| `day` – Mein Tag | `ctx.day`, d. h. reale `dayEntries(active, selectedDate)` | Nur mit diesem Tag verknüpfte Quell-IDs, inklusive zugehöriger Bahnhofs-Ankunftspunkte | Kein unbeabsichtigtes Einplanen bislang unverbindlicher Ortsideen |
| `city` – Stadt | `ctx.all` mit `city=ctx.city` | Aktuelle Stadt mit bereits recherchierten Aktivitäten, Restaurants und Unterkünften | Ist **nicht** identisch mit der Menge des bereits geplanten Tages |
| `trip` – Gesamtroute | `ctx.all` in allen tatsächlich zur Variante gehörenden Städten | Gesamte Reise, nur dokumentierte POI-Positionen | Schematische Verbindungslinien bleiben klar von echten Wegen getrennt |

Technische Umsetzung:
- `public/map-explorer.mjs`: neuer expliziter `dayItemIds`-Filter im reinen `explorerData`; synthetische Bahnhof-/Ankunftsobjekte erben nur die ID ihres echten Transport-Elterneintrags. Ein **leerer Tag produziert null geplante Ortsmarker** statt der bisherigen irreführenden Stadtauswahl.
- `public/app.mjs`: `map-mode` und `explorer-scope` setzen beide `mapScope` und `total` kohärent. Wechsel eines Kartenscopes entfernt nur veraltete in-memory-Suchzustände wie alten Umkreis, alten Sichtbereich oder das alte Favoriten-Only-Flag – **nicht** gespeicherte Favoriten oder Datenbankeinträge.
- `public/explorer-ui.mjs`: eine gemeinsame Toolbar mit „Mein Tag“, „Nur Stadt“, „Gesamte Reise“ und einer verständlichen Erläuterung, weshalb unplanmäßige Stadtideen unter „Mein Tag“ nicht angezeigt werden.
- `public/reference-map-scene.mjs`: vier benutzbare Kartensteuerungen direkt auf der Karte einschließlich Merkliste; ein leerer Tag hat den echten Aktionsknopf „Recherchierte Stadtorte anzeigen“.

## 2. Karten-Auswahl und Tagesliste sind synchron

Die Datenmodelle unterscheiden `item.id` vom Tages-`entryKey`, beispielsweise wenn eine Transportverbindung einen Ankunfts- und einen Abfahrtszeitpunkt besitzt. Bisher konnte eine Agenda-Auswahl das richtige Detail anzeigen, aber den Kartenmarker der Quell-ID nicht fokussieren. Die neue Auswahlsteuerung:

- ermittelt die echte Tagesinstanz (sofern vorhanden) und verwendet deren `entryKey` für Detailauswahl;
- fokussiert den bestehenden Leaflet-Marker der Quell-`id` (sofern präzise genug verortet);
- setzt `aria-pressed` sowie die visuelle aktive Markierung in der linken Tagesliste;
- hebt bei Kartenmarker-Klick dieselbe Tagesinstanz hervor;
- wechselt nicht automatisch Reisevariante, ändert keine Tagesreihenfolge und fügt keine Buchung hinzu.

Zusätzlich hat die linke Agenda direkt bedienbare **Vorheriger Tag / Nächster Tag**-Schaltflächen. Sie verwenden nur tatsächlich verfügbare Reisedaten der Variante, deaktivieren sich am Beginn/Ende und aktualisieren Karte und Tagesplan über die bisherige `day`-Aktion.

## 3. Bessere Fotoverteilung und echte Merken-Funktion

Die bisherige Galerie verwendete stumpf die ersten acht Bildkandidaten, sodass mehrere Fotos derselben Stadt die gesamte Galerie dominieren konnten. **`selectDiscoveryPhotos(ctx,8)`** stellt nun ein quellengestütztes Auswahlmodell bereit:

- derzeitige Stadt zuerst, im Anschluss ausgewogene Rundauswahl entlang der originalen `trip.route`;
- höchstens acht Bilder und maximal eine Verwendung derselben Commons-Dateiseite je Galerie;
- nur Einträge, die im originalen `ctx.all` existieren, mit dokumentierter HTTPS-Fotoquelle und Urheber-Credit;
- kein Wiederverwenden synthetischer Ankunftsmarker als imaginärer neuer POI;
- nur korrekt belegte bestehende Fotos aus den lokalen/kuratierten Bilddaten, keine geschützten Hotel-Listing-Bilder;
- echte **Details**, **Auf Karte** (nur mit tatsächlich hinterlegtem Kartenpunkt) und **Merken**-Aktionen.

Auf jedem Bild befindet sich jetzt ein über Tastatur zugänglicher **Merken-Button** mit `aria-pressed` und echtem Zustand aus der bereits bestehenden **variantenbezogenen Karten-Merkliste im LocalStorage**. Der Zustand wird nach dem Speichern wieder gerendert, ein zweiter Klick hebt ihn auf. Keine neue Backend-Datenhaltung und keine Buchungs-/Planänderung.

Die Bilddatei kann im Browser durch Commons-/Netzwerkprobleme ausfallen; hierfür bleiben die bereits vorhandenen Fallbacks erhalten. Ein Bildrechtshinweis und die direkte Original-Dateiseite stehen weiterhin bei der Karte.

## 4. Kontextbezogene Warnungen im Tages-HUD

`mapDayAgenda()` verwendet jetzt **exakt die bereits im vollständigen Tagesplan eingesetzte `conflicts(day,conflictRoutes,fullDay)`-Berechnung**. Nur wenn das echte Programm Planungsprobleme erkennt, erscheint ein ruhiges orangefarbenes Hinweisfeld mit:
- der Anzahl aktuell ermittelter Konflikte;
- maximal zwei belegten Warntexten im kompakten HUD, plus Anzahl weiterer Hinweise;
- direktem Button **„Im Tagesplan prüfen“**;
- ausdrücklicher Klarstellung, dass die Berechnung ein Plan-/Referenzcheck und **keine** bestätigte Verbindung oder Öffnung für September 2027 ist.

Beispiele aus dem bereits existierenden Algorithmus: vor Ankunft geplantes Hotel-Check-in, reale interne Terminüberschneidung, zu knappes Weg-/Pufferfenster, offene Küchenverfügbarkeit, historische oder unpassende reguläre Öffnungszeit. Die neue Oberfläche erzeugt **keine** neuen frei erfundenen Fahrpläne.

Warntexte werden HTML-escaped; Beispiel-Injection-Test enthält `<script>` im Namen und prüft, dass daraus kein ausführbarer HTML-Code wird.

## 5. Responsive- und Motion-Details

- Die Aktivierung einzelner Tagesstopps verändert nun auch den farbigen Timeline-Pin.
- Kleine dezente Farbakzente unterscheiden Morgen, Mittag, Nachmittag und Abend; keine dauerhaft pulsierenden UI-Effekte.
- Für Kartenfilter mit vier Tasten werden die Texte auf sehr kleinen Smartphones abgekürzt beziehungsweise bei weniger als 350px ausgeblendet; die Buttons bleiben über ihre Beschriftung/Titel zugänglich.
- Datumspfeile sind tastaturbedienbar und an den Reisegrenzen deaktiviert.
- Die bereits implementierten `prefers-reduced-motion`-Regeln und `Animationen aus` deaktivieren zusätzliche Übergänge.

## 6. Tests und Screenshots

**138/138 Node-Regressionsprüfungen bestanden, zusätzlich der vollständige echte Chrome-Browsertest erfolgreich**, GitHub Actions Workflow **43609056473**.

Neue Regressionen überprüfen unter anderem:
- individuelle Tag-IDs und echte zugehörige Ankunftspunkte, Unterscheidung von City-/Trip-Filter, leerer Tag ohne erfundene Marker;
- drei aktive Kartenscopes mit konsistenter `aria-pressed`-Markierung;
- vorheriges/nächstes Datum und deaktivierte Enden;
- Galerie mit Quellpflicht, Bilddatei-Deduplizierung, mehreren Städten, variantenbezogenem Merken;
- HTML-Escaping und echte Vorplanungswarnungen;
- tatsächliche Chrome-Auswahl von Tagesstopps, korrekt markierte Liste, City-/Trip-Wechsel, Merk-Button vor/nach dem Umschalten, mobile Karte und bestehende Datenerfassung.

Weitere Browser-Screenshots:
- `20-planned-day-only-map-1280.png`
- `21-licensed-photo-bookmark-1440.png`

Bereits vorhandene Bildschirmprüfungen für den 1440px-Desktop sowie 390px-Smartphone bleiben erhalten; die Tests prüfen ihre tatsächliche Lage und nicht nur die Existenz der DOM-Knoten.

## 7. Weiterhin ausdrücklich nicht vollständig

Aus dem verbesserten HUD dürfen weiterhin weder bestätigte 2027-Tickets noch echte Zug-/Hotel-Checkouts oder hundertprozentige Fotorechte für fehlende Orte abgeleitet werden. Die vier Reisevarianten mit den 828 variantenspezifischen Original-Katalogeinträgen bleiben unverändert, und auch der vollständige 57-Guide-Forschungsbestand wird nicht stillschweigend ergänzt oder abgeändert. Die Datenlücken lassen sich unter „Daten & Fristen“ anhand der echten fehlenden Nachweise filtern.

**Lokal starten:** `feature/v7-data-day-accommodation-rail` auschecken, `outputs/Reiseplaner/Start.cmd` mit Node.js 24 starten und `http://127.0.0.1:4173` öffnen. Unter Karte die drei Bereiche und die Merkliste testen; bei einem Tag mit geplanten Punkten die linke Chronologie auswählen; bei einem leeren Tag „Stadt“ öffnen. Nicht in `main` übernommen und nicht öffentlich deployed.
