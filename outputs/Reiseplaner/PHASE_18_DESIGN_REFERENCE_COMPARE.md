# Phase 18 – Referenzvergleich / iteratives Desktop-, Tablet- und Karten-Redesign

**Datum:** 14.11.2026 · **Entwicklungsbranch:** `feature/v7-data-day-accommodation-rail` · Draft PR #5.

## Beobachtungen aus den Nutzerbildern und GitHub-Chrome-Screenshots

| Nutzerreferenz | Abweichung vorher | Implementierte Anpassung | Noch offen |
| --- | --- | --- | --- |
| Wanderlog: Reiseplan neben Karte, große Karte direkt sichtbar | Der Karten-Explorer startete mit langen Tagesideen und einer Vollbreiten-Filterleiste; die eigentliche Karte stand außerhalb des ersten Viewports | Tagesleiste vorangestellt; eigentliche Leaflet-Karte links und Recherche/Filter/Ortsliste rechts; weitere Tagesideen und Zusatzfilter in `<details>`; Controls, Stadtabfolge nach der Karte; DOM-Viewport-Geometrietest für 1440×900 | Online-Kartenkacheln werden im isolierten Test nicht geladen |
| Designyow: weiße Flächen, Bildstreifen, wenige direkte Interaktionen | Einheitliche Panels und große Leerflächen bei nicht geladenen Fotos | Leichteres zweispaltiges Cockpit, weiche Typografie und Abstände, Reisezielbilder bzw. **ausdrücklich illustrative** Stadt-/Wasser-/Berg-Vektorgrafiken, direkt anklickbare Reiseziele und schematische Routenkarte | Der Großteil der Orte benötigt weitere individuell zugeordnete lizenzierte Fotos |
| Navica: datenbasierte Fortschrittsanzeigen und kompaktes Dashboard | Umfangreiche Tabellen dominierten die Übersicht | Vier dokumentierte Fortschrittsleisten, übrige Fach-/Quellenvergleiche als aufklappbare Panels; keine dekorativ erfundenen 2027-Zahlen | Nicht verifizierte Checkouts/Verbindungen bleiben offen |
| Mobile Trip Plan App: scanbare Orts-/Zeitkarten | Sehr viele Aktionen pro Eintrag und starke Boxgrenzen | Flache Kartenlisten mit Miniatur/Icons, Gruppierung nur echter Uhrzeiten, planwertbasierte EUR-Kennzeichen, Buttons nach Priorität und abrufbare Zusatzaktionen, responsive Ansicht | Kein echter iOS-/Android-Hardwaretest |

## Wichtige Architekturentscheidungen

### Schematische Route

`public/route-mini-map.mjs` projiziert die bereits erfassten `city.point`-Anker robust in einen eigenständigen SVG-Bereich. Nur gültige, geografisch im Zahlenbereich liegende Koordinaten zählen; fehlen mindestens zwei gültige Stopps, wird keine Linie gezeichnet. Die Darstellung zeigt **keine** echten Straßen oder Eisenbahnschienen; sie enthält interaktive, zugängliche `button`-Stops und eine dezent animierte Linie. Bei mehrfachen Besuchen desselben Ortes werden nur unterschiedliche Zielanker in der Illustration gezählt.

### Orts- und Bilddarstellung

`public/destination-illustration.mjs` liefert selbst gezeichnete, lokale SVG-Fallbacks nach generischer Stadt-/Küsten-/Alpenkategorie. Die Illustrationen sind **keine** vom Anbieter/Benutzer bestätigten Ortsbilder; der Bildnachweis steht daher ausdrücklich 'Symbolische Illustration · kein Ortsfoto'. Bei echten, bereits kuratierten Fotos bleibt der Wikimedia-Commons-Quellenlink erhalten. Die Frontend-Fallback-Behandlung schützt gegen defekte Bildsymbole. Die Leaflet-Marker-Klick- und Hoverbindung ändert ausschließlich den UI-Auswahlzustand, weder Buchungen noch persönlichen Plan.

### Karte und Suche

`public/views.mjs` rendert im Kartenmodus `explorerDayStrip` gefolgt von einem direkten zweispaltigen `map-explorer-split`. Neben `mapPanel` steht nun `explorer-right` mit `explorerToolbar` und `explorerList` gemeinsam in einer scrollbareren rechten Fläche. Bereits vorhandene Layer, Marker, Geo-Unsicherheiten, Quellen-Detaildialoge, Tagesroute, Budget und Google-Maps-Links sind erhalten. Die Inhalte sind auf Mobilgeräten gestapelt, mit Karte zuerst. Kartendesign, zusätzliche Stadtfolge und ältere Tagesideen sind nachrangig angeordnet.

### Map-/Liste-Hover

Vorhandene Einzelmarker lösen ein `mouseover`/`mouseout`-Ereignis über die `TripMap`-Callback-Bindung aus, wodurch die korrespondierende Ortszeile markiert wird. Umgekehrt hebt das Überschweben eines tatsächlichen Ortslisteneintrags einen sichtbaren Einzelmarker hervor. Durch Zoom-Cluster zusammengefasste oder nicht belegte Punkte werden nicht in fiktive Einzelmarker umgewandelt. Kein Map-Neurendering und keine Selektionsänderung nur durch Hover.

## Technische und visuelle QA

- Browser-Chrome mit Seed-Daten und `offlineMap`: 1280px Desktop-Startseite, 1440px Gesamtkarte samt Liste/Auswahl/oben sichtbarer Map, 390px Smartphone samt Auswahl und 820px Tablet.
- Screenshot-Funktion wartet 460 ms auf abgeschlossene UI-Eingangsanimationen und entfernt einen transienten Toast vor der Bildaufnahme. So werden reale Endansichten statt Übergangseffekte bewertet.
- `test/portable-browser.mjs` prüft Geometrie: `#map` erscheint bei 1440×900 im ersten sichtbaren Bereich; die rechte Suche hat einen nebeneinander liegenden Icon-Button; die Kategorienzeile scrollt horizontal; Zusatzelemente sind anfänglich gefaltet, aber zugänglich. Auch der dauerhafte Zustand geöffneter Listenoptionen bei einem Ansichtwechsel wurde geprüft.
- `test/route-mini-map.test.mjs`: projektiert gültige Punkte, validiert Reihenfolge, Grenzen, wiederholte Punkte, leere oder fehlende Strecken.
- Acht PNG-Artefakte sind im erfolgreichen GitHub-Actions-Lauf unter `reiseplaner-ui-review` 14 Tage herunterladbar.

**Wichtige Grenze:** `offlineMap` ersetzt Online-Rasterkacheln durch neutralen Hintergrund. Eine Prüfung real geladener Kartentiles, der Netzwerk-Latenz und der Darstellung auf echter Smartphone-Hardware muss separat erfolgen. Dies wurde nicht als abgeschlossen gekennzeichnet.

## Daten- und Datenschutzschutz

Es wurden ausschließlich UI-/Source-/Test- und Dokumentationsdateien im GitHub-Branch modifiziert, kein SQLite-Backup, keine privaten Airbnb-Standorte, keine Reisekosten oder Buchungen. Die vorhandenen Rechts-/Quellengrenzen bleiben bestehen.