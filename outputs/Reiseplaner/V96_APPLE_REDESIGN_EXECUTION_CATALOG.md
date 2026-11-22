# V96 – Apple-Webdesign: Arbeits- und Promptkatalog

**Stand:** 22.11.2026 · **Repository:** `goat4321/All-in-one-server-mjs` · **Branch:** `feature/v7-data-day-accommodation-rail` · **PR #5:** offen, Draft.  
**Letzter vollständig geprüfter UI-HEAD:** `ea69aaf2f95eb7a3fb0c89ea535a1263ff19702e`.  
**CI:** [#45030591429](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45030591429) **success**, 547/547 portable Tests, 63 Chrome-Messungen; 0 px horizontaler Überlauf und 0 protokollierte JavaScript-Ausnahmen. **Keine native iPhone-/VoiceOver-Abnahme.**

## Zielbild, das NICHT verloren gehen darf

Eine fotografisch starke, ruhige und professionelle Reise-Website, nicht eine Sammlung technischer Verwaltungskarten. Primäre Inhalte zuerst: Orte, Reisegefühl, nächste Aktion. Detailquellen, Preise, Verifizierungen und technische Hinweise müssen zugänglich bleiben, aber dürfen den Einstieg nicht dominieren. Die Apple-Website ist eine **Kompositionsreferenz** (große klare Headlines, neutrale großzügige Flächen, Bild-/Textkapitel, reduzierte Navigation, jeweils wenige priorisierte CTAs). Keine Apple-Markenlogos, proprietären Schriften oder kopierten Apple-Medien.

**Eigene Skill:** [goat4321/apple-design-skill/SKILL.md](https://github.com/goat4321/apple-design-skill/blob/main/SKILL.md), im Besonderen `references/hig/design-principles.md` (Fokus, Einfachheit, Rückmeldung), `layout.md` (Hierarchie, progressive disclosure), `typography.md`, `color.md`, `dark-mode.md`, `motion.md` und `references/cross-platform.md` (CSS-/Web-Übersetzung). Kein blindes Liquid Glass über Karten und Fotos.

### Allgemeiner Ausführungsprompt – gilt für alle Teilaufträge

```text
Arbeite DIREKT am bestehenden Reiseplaner in GitHub:
Repository goat4321/All-in-one-server-mjs
Branch feature/v7-data-day-accommodation-rail
PR #5, Projektordner outputs/Reiseplaner/.
Ermittle zuerst den tatsächlichen Remote-HEAD und lies die betroffenen Dateien,
V96_APPLE_REDESIGN_EXECUTION_CATALOG.md, STATUS.md und DECISIONS.md.
Prüfe die eigene Skill goat4321/apple-design-skill.
Arbeite nicht in anderen Rootprojekten. Kein Merge nach main, kein Deployment,
kein Überschreiben von lokalen nicht synchronisierten Windows-Dateien.
Nutze die bestehenden HTML-/CSS-/JS-Module und Datenquellen; erfinde keine
Reiseziele, Buchungen, Preise, Ortsfotos oder Lizenzangaben.
Sichere alle vier Reisevarianten, Routen, Originalquellen, Zeitangaben,
Persistenz, Multi-Stopp-Karte und Unterkunftsvergleich gegen Regressionen.
Setze die begrenzte Teilaufgabe vollständig um. Prüfe Syntax, 547+ portable
Tests und Browser-/Responsive-Abnahme soweit verfügbar. Führe nach Änderungen
die CI aus, analysiere fehlgeschlagene Stufen und korrigiere reale Fehler.
Dokumentiere in STATUS/DECISIONS: geändert, ausgeführt, nur statisch geprüft,
nicht geprüft, nächster Schritt, exakter Commit-SHA, CI-Link.
Verwechsle grünen Code-Test nicht mit optischer Abnahme.
```

## Nummerierter Arbeitskatalog

### 01 · Ausgangslage sichern und echte Screenshots bewerten
**Status: ERLEDIGT.**
- PR #5, HEAD, bestehende V95 CSS-Schicht und die auf GitHub erzeugten Chrome-Artefakte geprüft.
- Desktop- und Mobil-Bilder bei 390/768/1440px, Hell und Dunkel, verglichen.
- Befunde: großer illustrativer Offline-Bildersatz statt Fotos; auffällige weiße Überlagerungsfläche durch ungünstig positionierten Quellenlink; austauschbare Startseitenwerbung; Dark-Mode-Button weiß auf weiß; übermäßig grüne Filter.

**Abnahme:** Kein Bauchgefühl ohne Screenshot; jeder spätere optische Eingriff muss an einer betroffenen Seite geprüft werden.

### 02 · Designrichtung aus eigener Apple-Skill ableiten
**Status: ERLEDIGT (Richtungsentscheidungen), technische Konsolidierung OFFEN.**
- Realistische Reisebild-/Text-Hierarchie statt werblicher Nachahmung oder Glasflächen überall.
- Semantische Farben: fast weiße / neutrale Oberflächen, dunkle Schrift, Blau für primäre Aktionen; Grün nur dort, wo Karte, Status oder Markenidentität es sinnvoll erfordern.
- Ruhige Bildebenen, keine bounce-/lift-Hoveranimation; Systemschrift, Focus Visible, Reduced Motion.
- **Offen:** Mehrere historische CSS-Generationen sind weiterhin hintereinander geladen; später gezielte Konsolidierung mit visueller Regression statt neue Parallel-Sheets.

### 03 · Bildwirkung und Bildausfälle sauber lösen
**Status: UMGESETZT, optisch geprüft im Offline-Chrome; echte Online-Fotoauslieferung OFFEN.**
- Fehlerhafte Z-Ebenen der V95-Fotoheros behoben.
- Bei nicht ladenden Wikimedia-Bildern keine großformatige scheinbare Orts-SVG-Bildwelt mehr: neutraler typografischer Fallback.
- Quellenlinks bleiben vollständig erhalten. White-slab-Problem war konkret ein überhöhter, von `top` bis `bottom` gestreckter Attributionslink. Der Link wird jetzt kompakt unten platziert. Browsermetrik prüft Fotoquellen-Überlagerung.
- **Nächster Prompt:** Prüfe auf echter Online-Umgebung, wie häufig `Special:FilePath`-Fotolinks laden. Wenn sie blockiert sind, entwickle einen sicheren Caching-/Proxy-Ansatz mit Lizenz-/Quellenbewahrung und ohne willkürliche Ersatzbilder. Kein automatisches externes Foto ohne Quellenprüfung.

### 04 · Startseite: echte Reiseroute und Hauptaktion
**Status: UMGESETZT, CI bestanden.**
- Das generische „Mehr sehen. Mehr erleben.“ ist durch tatsächliche geografische Route-Anfangs-/Endpunkte ersetzt.
- Primäre Aktion Tagesplan, zweite Aktion Route; Quick-Tasks und Recherche folgen.
- Bekannte Varianten, Buchungs-/Preishinweise und Belegabschnitte bleiben vorhanden.
- **Nächster Prompt:** Prüfe jede der vier Varianten und Sonderfälle (1 Ort, Rundreise, langer Ortsname), damit der Headline-Umbruch bei 320/390/768/1440px natürlich bleibt. Eventuell semantisch kürzere geografische Titel pro Variante aus echten Daten ableiten.

### 05 · Entdecken, Unterkünfte, Essen
**Status: UMGESETZTE BASIS, weiterer redaktioneller Feinschliff OFFEN.**
- Übersichtliche große Kapitel, Suchfilter unter Hero; Essen: Suche und Auswahl vor tiefer Preisrecherche.
- Sourced Commons-Fotos mit Lizenzlink; wenn kein Foto verfügbar, neutrale Fallbacks.
- Primäre Buttons blau und konsistent; kontrastarme weiße Dark-Mode-Sekundärbuttons korrigiert.
- Chrome-Prüfung: sekundäre Dark-Mode-Heroaktionen 11,43:1, aktive Filter ebenfalls über 4,5:1.
- **Nächster Prompt:** Result-Grid bei 390/768/1440px prüfen: Bildverhältnis, Anzahl sichtbarer Treffer, Filter-Reihenfolge, Scrolltiefe und ablenkende Metadaten. Nur progressive Details, niemals Inhalte oder Bildnachweise löschen.

### 06 · Tagesplan und Karte
**Status: CSS-KONSISTENZ UMGESETZT, gestalterische Tiefenabnahme OFFEN.**
- Tageskopf mit ruhigem Foto-/Textmodus, Quelle außerhalb der Metadaten. Zusätzlicher Browser-Overlap-Test.
- Karten- und Tagesfilter neutralere Auswahlzustände, gleichmäßiger Abstand, weniger überflüssige Schatten.
- Marker, Kartengestik, Wegführungslogik und eigene Pins unverändert.
- **Nächster Prompt:** Teste an einem repräsentativen Strand-/Stadttag, einem Schweizer Naturtag und im Fullscreen-Atlas. Die Karte muss visuell Hauptinhalt sein; Zeitplanung/Quellen dürfen nicht davon ablenken. Pro Layout echte Screenshotnachweise bei 390/768/1440px.

### 07 · Budget, Bahn, Gruppe, Daten und Formulare
**Status: GRUNDLEGENDE VISUELLE ANGLEICHUNG UMGESETZT; nicht alle Unteransichten einzeln geprüft.**
- Typografische Hierarchie, neutrale Karten/Tabellen/Details, gleiche Eingabefelder/Fokusregeln, geringere Schatten.
- Bestehende Daten- und Exportfunktionen bleiben unverändert.
- **Nächster Prompt:** Jede nicht primär bildgetriebene Ansicht einzeln visuell prüfen. Insbesondere lange Quellentabellen und Nachtbudgets auf Smartphones: kein versteckter Informationsverlust oder nicht erreichbare Exportfunktion.

### 08 · Dark Mode, Mobile, Motion und Accessibility
**Status: DEUTLICH VERBESSERT; native Abnahme OFFEN.**
- Farben für sekundäre Heroaktionen, Reiseort-Umschalter, aktive Essenskategorien und Suchfilter korrigiert.
- Browsertest berechnet echte WCAG-ähnliche Text-/Flächenkontraste (statt nur CSS-Regeln zu suchen): Mindestwert 4,5:1 für die genannten Kontrollen in allen gemessenen Varianten.
- Neutrales dunkles Navigationselement, blau gekennzeichneter aktiver Bereich; Reduced Motion bleibt.
- **Nächster Prompt:** Reale iOS Safari / Android Chrome bei 320, 375, 390, 430px, 200% Zoom, Safe Area, eingeblendeter Tastatur, VoiceOver/NVDA, Dark-Mode-Wechsel und `prefers-reduced-transparency` testen. Nicht als bereits abgeschlossen ausgeben.

### 09 · Browser und Regression
**Status: LETZTER CODELAUF GRÜN; Wiederholung nach weiteren Änderungen nötig.**
- [GitHub Actions #45030591429](https://github.com/goat4321/All-in-one-server-mjs/actions/runs/45030591429): **547/547** portable Node-Tests, **63** echte Headless-Chrome-Messungen, **0** JS-Ausnahmen, **0px** horizontaler Überlauf.
- Karten-, Routen-, Unterkunfts-, Persistenz- und HTTP-Prüfungen durch den CI-Lauf abgedeckt.
- Bilder sind im CI teils offline. Kein erfolgreicher Screenshot beweist, dass externe Foto-URLs online funktionieren.
- **Nächster Prompt:** Erzeuge neue Vorher-/Nachher-Kontaktbögen für alle 7 Seiten, Hell/Dunkel bei 390/768/1440px. Prüfe lesbare Actions, Überlagerungen, Hero-Höhen, sinnvolle ersten 2 Bildschirme und nicht abgeschnittene Karten. Korrigiere nur konkret belegte Probleme.

### 10 · Abschluss, Versionierung und lokale Übernahme
**Status: DIESER KATALOG ERSTELLT; finale Produkt-Abnahme OFFEN.**
- Änderungen bleiben im Entwicklungsbranch und PR #5. Kein Merge, kein Deployment.
- **Nächster Prompt:** Aktualisiere Status, Entscheidungen und Designhandbuch nach finalem CI-Lauf, mit eindeutigem verifiziertem Code-HEAD und anschließendem Dokumentations-HEAD. Gib sichere Windows-Synchronisationsbefehle an (vorher `git status`, `git fetch`, `git log --left-right HEAD...origin/feature/v7-data-day-accommodation-rail`; niemals blind `reset --hard`), und fasse den Teststatus samt noch nicht geprüften Bereichen ehrlich zusammen.

## Empfohlene Fortsetzungsreihenfolge

**Nächste eigentliche Arbeit:** 03 (Foto-Auslieferung online) → 05 (Trefferkarten) → 06 (Karte/Tagesplan) → 07 (Nebenansichten) → 08 (reale Geräte) → 09 (visueller Regressionstest) → 10 (Abschluss). 04 nur erneut, wenn bei den vier Varianten ein konkreter Umbruch- oder Inhaltsfehler auftritt.

## Dokumentationsstandard für jede Etappe

`Nr. | GitHub-HEAD vorher → nachher | Dateien | Sichtänderung | Tests tatsächlich ausgeführt | Screenshotvergleich | offene Risiken | nächster Auftrag`

**Keine Erfolgsmeldung ohne Code-/Screenshotbefund.**
