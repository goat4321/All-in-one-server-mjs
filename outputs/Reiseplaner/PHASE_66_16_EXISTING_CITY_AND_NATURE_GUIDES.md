# Phase 66 – Weitere 16 bestehende Reiseziele praktisch beschrieben

**16.11.2026**, fortgesetzt auf `feature/v7-data-day-accommodation-rail` (Draft PR #5). `main` unverändert; keine Buchung, kein Deployment und kein Eingriff in bestehende Tagesplanung.

## Umfang

Nach den zehn vertieften V62-Einträgen aus Phase 65 erhalten jetzt **alle 16 vorhandenen V61-Katalogorte** ein separat strukturiertes `visitorGuide`. Die zusammen **26 vertieften unterschiedlichen Orte** bleiben in ihren bestehenden Reisevarianten eingebunden; keine Dubletten wurden angelegt.

| Reisegebiet | Ergänzte V61-Orte |
|---|---|
| Paris | Musée Bourdelle, Musée de la Libération |
| Barcelona | El Born Centre de Cultura i Memòria, Museu Marítim, CosmoCaixa, Parc del Laberint d'Horta |
| Nizza | Villa Masséna, Musée Terra Amata |
| Genua | Palazzo Reale, Museo Chiossone |
| Venedig | Palazzo Grimani, Museo del Vetro Murano, Ca’ Pesaro |
| Ostschweiz | Seilbahn Alp Sigel, Anna Göldi Museum, Berglistüber-Wasserfall |

Die neuen Infos werden über `lib/operator-discoveries-v61.mjs` geprüft und als `discoveryV61.visitorGuide` weitergereicht. Das in Phase 65 aktualisierte `public/place-profile.mjs` zeigt nun auch für diese Einträge **Sehenswert, praktische Besuchsplanung, Kombinierbar mit, Anreise und Eingang, Vor Reisebeginn 2027 prüfen**.

In den Texten wird aktiv vor typischen Planungsfehlern gewarnt: kein automatisch inklusive Schiff beim Maritimmuseum, keine garantierte Museums-Livevorführung auf Murano, kein pauschaler Gratiszugang für 18-Jährige, Einschränkungen bei Museums- und Naturzugängen sowie fehlende 2027er Saison-/Wetterbestätigungen.

Die bereits vorhandenen offiziellen Betreiberdaten, objektbezogenen Commons-Fotos und Maps-Links werden wiederverwendet. **Keine** ungesicherten Foto-Urheberrechte, Objektkoordinaten, neuen 2027-Preise, Öffnungszeiten oder Reservierungen ergänzt.

## Tests

In `test/entry-guides-v65.test.mjs` prüft der zusätzliche V66-Test alle 16 V61-Archiveinträge gegen den importierten Katalog und die gerenderte Detailansicht sowie die unveränderten Sicherheitsdefaults (`price:null`, `booked:false`, `selected:false`, `point:null`, September-2027-Öffnung nicht bestätigt).

Automatisierte CI-Prüfungen nach dem letzten Commit und lokale Regression mit originalen privaten Tripsy-Daten sind getrennt zu beurteilen.
