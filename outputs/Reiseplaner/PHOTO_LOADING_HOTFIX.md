# Foto-Ladefehler: Wikimedia-Domainwechsel
Ausgang: fdf9c5d21c90d4c22d4a343a340fa65677858637. Nutzer meldet, dass Fotos nicht laden.
Ursachen im Quellcode: img-src erlaubte thumb.wikimedia.org nicht; connect-src erlaubte keine Wikimedia-Commons-API; Lizenzfilter akzeptierte nur upload.wikimedia.org. Thumbnail-Größen wurden teilweise auf nicht standardisierte Werte umgeschrieben.
Fix: beide offiziellen Bildhosts und nur die benötigte API erlauben, Lizenzfilter für beide Hosts bei unveränderten Quellen-/Lizenzprüfungen, standardisierte Breiten 250/500/960/1280. Keine neuen Bilder, kein Drittanbieterproxy, kein Abschalten der CSP.
Referenzen: https://phabricator.wikimedia.org/T427465 und https://www.mediawiki.org/wiki/Common_thumbnail_sizes .
Tests: CSP-Header-Smoke und simulierte API-Antworten beider Hosts sowie Größenprüfung ergänzt. Live-Bildabruf auf Nutzergerät noch nicht verifiziert; CI separat prüfen. Bestehende Fotoreferenzen und Urheberangaben bleiben erhalten.
