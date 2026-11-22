# V98 – Scrollen, Hover und Inhaltsbewegung im Reiseplaner

**UI-Code-HEAD:** `43a36b00aafff6dfb2d08d625d00bdd2a489b51b` · **GitHub Actions:** [#45076798228](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45076798228) **success**, **558/558 Node-Tests**, **63 echte Chrome-Labormessungen**, **0 JS-Ausnahmen**, **0 px horizontaler Überlauf**. Branch `feature/v7-data-day-accommodation-rail`, PR #5 (Draft); kein Merge und kein Deployment.

## Auftrag und Designziel

Nutzerwunsch: Noch mehr Animationen beim Scrollen, Aufrufen der Seiten, Darüberfahren und Öffnen von Elementen. Umsetzung orientiert an der Eigentümer-Skill `goat4321/apple-design-skill/references/hig/motion.md` (kurz, sachbezogen, abschaltbar, nicht als einziges Zustandsfeedback).

## Implementierung

1. **Echter Scroll-Effekt für Karten:** `public/motion-ux.mjs` enthält `SCROLL_TARGETS` für Quick-Tasks, echte Reiseziele, Fortschrittskarten, Unterkunfts-/Essensangebote, Timeline, Discovery, Schweizer Tageskapitel, Marktvergleiche. Ein einziger `IntersectionObserver` reagiert, sobald Karten sichtbar werden; `motion-scroll-revealed` bewirkt ein einmaliges 440-ms-Einblenden mit 17 px Aufwärtsbewegung und minimaler Skalierung. Je Szene höchstens 42 Elemente, nicht der vollständige Atlas. Das HTML bleibt auch ohne Observer sichtbar.
2. **Keine Wiederholung bei Filtern:** Bereits gesehene Karten werden innerhalb derselben Reise-/Seiten-/Orts-Szene über stabile IDs wiedererkannt; Filter-Rerenders starten nicht den Seitenübergang erneut. Neu auftauchende Karten können ihr erstes Scroll-Reveal erhalten. Bei wirklichem Seiten-/Ortswechsel wird die Erfassung zurückgesetzt.
3. **Hover am Desktop:** Präzise Zeiger heben nur visuelle Angebots-/Reisekarten um 4 px an und erzeugen eine kurze Schattenänderung. Passende vorhandene Fotos zoomen 5,5 % innerhalb ihres Bildausschnitts. Interaktive Icons bewegen sich 2 px; Primärbuttons heben sich 2 px. Keine automatische Mausbewegung, keine Veränderung der Leaflet-Kartenmarker oder Draggable-Timeline-Positionen.
4. **Aufruf und Aufklappen:** Beim tatsächlichen Seitenwechsel erscheinen Headline und Hauptaktionen zeitversetzt (400/450 ms), zusätzlich zur vorhandenen 285-ms-Szene. Relevante Disclosures öffnen ihren Inhalt mit 280 ms, Chevron-Icons drehen 90°. Fortschrittsbalken werden während des Karten-Reveals in 530 ms aufgebaut.
5. **Barrierefreiheit:** Sowohl `prefers-reduced-motion:reduce` als auch `data-motion=off` deaktivieren Scroll-Animationen, Hover-Transformations- und Bildzoombewegungen, Open-Animationen sowie Verzögerungen. Fokusringe, Inhalt, Navigation, selektierte Zustände und alles Semantische funktionieren ohne Bewegung.

## Nachgewiesene Tests

- [Actions #45076798228](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45076798228): **558/558 Tests**, alle Browserphasen grün.
- Chrome überprüfte **63** Kombinationen aus sieben Seiten, 390/768/1440 px, Light/Dark/Reduced Motion; **0** Runtime-Exceptions; **0px** horizontaler Überlauf.
- Eigenständiger Browser-Scrollversuch auf einer zunächst unsichtbaren Fortschrittskarte: vor Scroll `motion-scroll-revealed=false`, danach `true`; tatsächliche Animation `v98-card-arrive`, Dauer **0,44 s**, gemessener vertikaler Zwischenversatz **+10,1689 px** während des Einfliegens. Damit ist echte sichtbare Bewegung im Browser statt nur eine vorhandene CSS-Deklaration bestätigt.
- Unit-Tests prüfen nicht sichtbare/offscreen und visible IntersectionObserver-Karten, keine Replays nach Filter-Rerender, Animationsreset beim Szenenwechsel und deaktivierte Bewegung auf Wunsch.
- Im Debugging wurde ein zu spezifischer Default-`transform`-Override auf Desktop entfernt; erst danach wurde die tatsächliche vertikale Bewegung per Browser nachgemessen.

## Einschränkungen

Keine vollständige native iPhone-/Android-Hover-/Touchprüfung, kein Real User Monitoring von FPS/Web Vitals, keine online verifizierte Verfügbarkeit von Commons-Fotos, keine vollständige HIG-/WCAG-Zertifizierung. PR #5 bleibt im Entwicklungsbranch, `main`, Deployments, private Tripsy-Dateien, Reisevarianten, Routen, Preise und Bildrechte wurden nicht verändert. Statische Screenshots können Animationen nicht wiedergeben; für das Verhalten die Website lokal starten.
