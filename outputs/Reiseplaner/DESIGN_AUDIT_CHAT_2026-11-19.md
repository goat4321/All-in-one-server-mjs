# Design-Ist-Soll-Audit · Chat-Runde 19.11.2026

## Sichere Arbeitsbasis
- Repository: `goat4321/All-in-one-server-mjs`, Draft PR #5, Entwicklungsbranch `feature/v7-data-day-accommodation-rail`.
- Verifizierter Ausgangs-HEAD: `44dbec1f5e95054b38c37505f77f194ca2d9bcff`. **Alle Änderungen nur im isolierten Branch** `chat/design-audit-2026-11-19-44dbec1`.
- Windows-Verzeichnis und dessen lokale Originaldateien/SQLite/ungesicherter HEAD waren nicht zugänglich. Dieser Branch ist eine additive Remote-Implementierung, kein Synchrontest. Kein Merge oder Deployment.
- Statusdateien **auf GitHub** unter `outputs/Reiseplaner/{STATUS,CHECKLIST_V2,DECISIONS}.md`; `outputs/Abnahme-V2/` existiert im abgefragten Remote nicht.
- `STATUS.md` nennt für den lokalen Stand 526/526 vollständige, 505/505 portable Tests; dies ist keine von diesem Chat erneut ausgeführte Originaldatenregression.

## Quellen und tatsächlich betrachtetes Bildmaterial
- `goat4321/apple-design-skill/SKILL.md` sowie `references/hig/{accessibility,layout,typography,color,designing-for-ios,buttons,sidebars,toolbars,motion,maps,images}.md` und `references/cross-platform.md` tatsächlich über GitHub gelesen.
- Referenz: Apple HIG `layout.md › Visual hierarchy` (Priorität, Ausrichtung, progressive Disclosure); `layout.md › Adaptability` (Breiten und Textgrößen); `typography.md › Ensuring legibility/Conveying hierarchy`; `accessibility.md › Vision/Mobility` (Kontrast, Fokus, Interaktion); `color.md › Best practices`; `buttons.md › Best practices`; `sidebars.md › Best practices`; `toolbars.md › Best practices`; `maps.md › Best practices`; `motion.md › Best practices`. Der Skill ist eine für Web übertragene Designgrundlage, keine Apple-Zertifizierung.
- Tatsächlich **geöffnete** CI-Screenshots aus dem erfolgreichen Workflow [44534237556](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/44534237556), Artefakt `reiseplaner-ui-review`. Kontaktbögen für Desktop und Mobile wurden aus unveränderten PNGs erstellt. Relevante Originaldateien im Artefakt: `01-uebersicht-desktop.png`, `02-atlas-desktop-map-list.png`, `04-atlas-smartphone-390.png`, `05-atlas-tablet-820.png`, `27-tagesprogramm-barcelona-1280.png`, `31-unterkuenfte-browse-desktop-1440.png`, `37-aktivitaeten-kategorien-desktop.png`, `30-verpflegung-browse-desktop-1440.png`, `85-warenkorb-vorraete-{desktop,mobil}.png`, `86-drei-mahlzeiten-{1440,820,390}.png`, `data/data-start-{1440,820,390}.png`, `map/karte-vollbild-{1440,820,390}.png`, `stays/unterkunft-filter-1440.png`.
- Nutzer-Originalreferenzen: grüner Barcelona-Entwurf (1672×941 gemäß v63-Kommentar), InterrailPlan, Designyow/Navica und mobile Originalmockups **nicht als zugängliche Bilddateien auffindbar**. Vorhandene Projektdokumentation `PHASE_18_DESIGN_REFERENCE_COMPARE.md`, `PHASE_33_REFERENCE_COMPARISON.md`, `PHASE_63_REFERENCE_ALIGNMENT_ALL_PAGES.md` dient als textlicher Ersatz, **kein** Pixelvergleich mit diesen Originalen.
- Die CI-Bilder sind ein **Vorher-Zustand**. Keine Behauptung, die Bilder seien nach diesem neuen Designpatch entstanden.

## Ist–Soll-Matrix: acht Seiten
| Sicht / Beleg | Code-/Selektorbezug | Ist anhand Code/Bilder | Soll | Entscheidung dieser Runde |
|---|---|---|---|---|
| **Start** · `01-uebersicht-desktop.png` | `public/views.mjs`, `.overview-start`, `.overview-quick-grid`, `.overview-quick-card`, `.cockpit-layout` | Reiseüberblick ist klar, aber zahlreiche eingerahmte CTA-Karten/Hero-Flächen konkurrieren; recht kleine Beschriftungen | Eine eindeutige Hauptaktion und gestufte Nebenaktionen, ruhigere Oberflächen und klare Typografie | Kartenoberflächen ohne permanente Elevation, Flächen-/Abstands- und Headline-Fundament |
| **Karte** · `02-atlas-desktop-map-list.png`, `04-atlas-smartphone-390.png`, `map/karte-vollbild-390.png` | `.reference-map-workspace`, `.map-panel`, `.map-fullscreen-ui`, `.map-local-actions`, `.explorer-right` | Informative Karte, aber parallele Aktionen/Leisten in enger Smartphonefläche; Panelkopf enthält redundant Vollbild | Karte vorrangig, Hauptaktionen auf Anhieb erreichbar, Filter bei Bedarf, keine duplizierten Aktionen | doppelten sichtbaren Vollbildeinstieg ausgeblendet, aber den testgeschützten mobilen Button erhalten; kompaktere Panel-/Vollbildsteuerung |
| **Tagesplan** · `27-tagesprogramm-barcelona-1280.png` | `.hero`, `.days`, `.day-plan-panel`, `.timeline`, `.page-head` | Gutes Stadtmotiv, viel Chronologie, viele kleine Status-/Tageschips | Fotomotiv führt, Tagesfolge gut lesbar, kleine Hilfen nachrangig, keine unlesbaren Touchziele | gemeinsame Typografie, Schattenreduktion, mobile Bedienziele; Timeline im nächsten Durchgang |
| **Unterkünfte** · `31-unterkuenfte-browse-desktop-1440.png`, `stays/unterkunft-filter-1440.png` | `.hub-hero`, `.hub-toolbar`, `.hub-option-card`, `.stay-facets`, `.stay-compare-board` | Gut sichtbare Suche und Foto-Kandidaten, jedoch Filter-/Infoflächen und Karten auf verschiedenen Elevationsebenen | Bild-/Name-/Preis-Hierarchie und vergleichbare Bedienelemente, Filter zurückhaltend | gemeinsame Bildhöhe, leichtere Schatten, bessere typografische Abstufung |
| **Entdecken / Aktivitäten** · `37-aktivitaeten-kategorien-desktop.png` | `.activity-directory`, `.activity-filter-panel`, `.hub-option-grid` | Filterbänder und große Textblöcke vor Ergebnisbildern; kompakte Chips | Schneller von Suche zu bildbasierten Ergebnissen, Filter nur so dominant wie nötig | Oberflächen und Chips beruhigt, Mobile in eine Spalte |
| **Verpflegung** · `30-verpflegung-browse-desktop-1440.png`, `86-drei-mahlzeiten-390.png` | `.hub-food-tabs`, `.hub-food-card`, `.meal-day-slot` | Mehrere parallel sichtbare Reiter/Karten; mobile Menüs/Schaltflächen teilweise dicht | Mahlzeit und Restaurant/Selbstkochen eindeutig unterscheidbar, leicht scannbare Karten | konsistente Abstände, Bildflächen und Mindestziele; spätere tiefere Umstrukturierung getrennt |
| **Warenkorb** · `85-warenkorb-vorraete-mobil.png` | `.grocery-section .table-wrap`, `views.mjs` `basketTable` | Mobile Sechs-Spalten-Tabelle wirkt rechts abgeschnitten, horizontales Scrollen nicht erklärt | Scrollbarkeit erkennbar, Tastaturzugang, alle Preise/Buttons bleiben erhalten | 780px Innentabelle in Scrollregion, `tabindex=0`, `role=region` und mobiler Hinweis |
| **Daten & Fristen** · `data/data-start-390.png` | `public/data-page.mjs`, `.page-head`, `.section.panel`, Details/Summary | Bereits sinnvoll auf Abruf, aber kleine Hilfstexte und vielerlei Status-/Kachelstile | Fristen zuerst, sekundäre Prüfungen lesbar und nachrangig, Fokus sichtbar | gemeinsame Headline-/Fokus-/Flächenregeln; bestehendes Lazy Rendering unverändert |

Tablet-Bilder sind für Karte, Mahlzeiten und Datenseite im Artefakt vorhanden; nicht jeder einzelne UI-Zustand aller acht Seiten wurde bei 820px visuell geprüft. Die Matrix ist eine **Code- und Stichproben-Screenshot-Analyse**, keine umfassende E2E-Abnahme.

## Drei umgesetzte Ursachen-Fixes

1. **Token-/Hierarchieschicht** in `public/design-foundations-v01.css`, als letztes Stylesheet in `public/index.html`. Semantic Light/Dark-Tokens, einheitlichere Page-Headings, geringere Elevation bei Panels/Karten, ruhigere Quick-Actions und textgerechtere Bildkartendarstellung. CSS bleibt unter `.reference-travel-shell` auf die Anwendung begrenzt.
2. **Interaktion und Zugänglichkeit**: Fokusindikatoren auch auf Summary/Input/Select, ruhige sekundäre Buttons, Touchziele ≥44px in ausgewählten mobilen Komponenten, Reduzierte-Bewegung-Unterstützung. Bewusst **kein** Anspruch auf global vollständige WCAG-Abnahme.
3. **Karten- und Warenkorb-Kompaktheit**: Der bestehende lokale Vollbild-Button bleibt für alle Breiten und die bestehende Chrome-Bedienung erhalten; der redundante Header-Zwilling `.map-fullscreen-launch` ist nur visuell ausgeblendet. Eine erste CI-Runde hat die Abhängigkeit des bestehenden Kartentests vom lokalen Button sichtbar gemacht; der Fehler wurde danach gezielt korrigiert. Vollbild-Werkzeugleiste und Kategorien gezielter gefasst. Sechs-Spalten-Einkaufstabelle ist nun als fokussierbare, horizontal scrollbar gekennzeichnete Region mit mobilem Nutzungshinweis erreichbar.

## Technische Sicherheitsgrenzen
- Alle vier Reisevarianten, Daten-, Preis-, Buchungs-, Budget-, Import- und Routinglogik **nicht bearbeitet**.
- Neue CSS-Datei folgt allen bisherigen CSS-Dateien, um deren relative Reihenfolge unverändert zu lassen. Keine globalen Komponenten entfernt; gezielte neue Regeln sind leichter zurückzurollen als ein großflächiger CSS-Refactor.
- Bestehende Render-Revisions-/Race-Sicherung für Map und Unterkunft wurde nicht verändert. Offene Risiken: viel historisches CSS, kleiner Text außerhalb der gezielt überarbeiteten Komponenten, nicht getestete Overlays und Originalreferenz-Vergleiche.

## Testplan für dieses Paket
- Drei neue Strukturtests in `test/design-foundations.test.mjs` und in `npm run test:portable` eingebunden; prüfen Stylesheet-Reihenfolge, Karteneinstieg/ausgeblendetes Doppel und Einkaufstabelle.
- GitHub-Diff gegen `44dbec1` prüfen; nur gezielte CSS/HTML/Markup und diesen Bericht zulassen.
- CI muss Syntax, portable Tests, Browser- und HTTP-Prüfung erfolgreich ausführen.
- Bei CI-Screenshotverfügbarkeit die Desktop-/Tablet-/Mobilansichten nach dem Patch vergleichen, besonders Vollbild, Tabellenfokus und Dark Mode.
- Vorerst **nicht selbst getestet:** vollständige Windows-526er-Suite mit vier privaten Tripsy-Dateien, echte laufende Vorschau auf Windows, Benutzerkonten, 2027-Buchbarkeit, sämtliche Keyboard-/Dark-/Kontrastfälle.

## Noch offene Referenzanforderungen
- Originale Barcelona-/InterrailPlan-/Navica/Designyow-Screenshots im eigentlichen Dateiformat bereitstellen, um pixel- und rhythmusgenau zu vergleichen.
- Alle 8 Hauptseiten/deren Zustände bei 1440/820/390 mit Vorher/Nachher-Bildern messen; auch Touch, 200%-Zoom, Kontrastwerte und Ladezeiten.
- Danach nur die größten visuellen Abweichungen selektiv korrigieren, nicht bestehende Daten-/Interaktionslogik neu schreiben.
