# Phase 28 – Weitere Betreiberrecherche und visuelle Verfeinerung

Stand: 14.11.2026, Branch `feature/v7-data-day-accommodation-rail`, PR #5 (Draft). 13 zusätzliche konkrete, einzeln an bestehende V19-Aktivitäten gebundene Betreiber-Besuchshinweise. Direktquellen und Prüftag: `data/research-v28/field-notes.json`.

Neue Inhalte: Louvre, Eiffelturm, Sagrada Família, Park Güell, Halles de Sète, Porto-Antico-Aquarium als separate Option, venezianischer ACTV-Inselverkehr, Rolling Venice, geplante 2027er Zugangsgebühr Venedig, Grindelwald First/First Flyer, Seealpsee-T2-Rundweg und veröffentlichter Oeschinensee-Gondelzeitraum September 2027. Sondertermine, Wetter und konkrete Plätze sind nicht bestätigt.

Das neue Datenmodul `lib/research-v28.mjs` validiert Quellen/IDs und verknüpft die Hinweise, ohne Preise, Buchungsstatus, Pins, Planzeiten oder Originaldaten zu verändern. Der Ortsinspektor zeigt die drei Phasen Anreise / Einlass / Vor Ort und die nächste Prüfung. Die Kartenansicht zeigt schmale ausklappbare Ortschecks mit aktiven Details-Links. `reference-refresh.css` reduziert Kacheloptik und verstärkt die Referenzhierarchie von Karte, Tagesliste und Fotos. Keine externen Fotos oder fremdes UI kopiert.

Neue Regression `test/research-v28.test.mjs`: Zuordnung, Buchungs-/Preis-Unverändertheit, HTML-Sicherheit und UI-Ausgabe. CI nach Commit separat kontrollieren. Kein Merge, Deployment oder Buchung.
