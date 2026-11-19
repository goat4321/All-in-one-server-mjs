# Phase 53 – Ortsfotos, Google Maps und aktuelle Zugangsbedingungen (16.11.2026)

## Umfang (ausschließlich Entwicklungsbranch)
- Zehn zusätzliche objektbezogene, quellenverlinkte Wikimedia-Commons-Fotomotive (Arènes de Lutèce; Musée Carnavalet; Petit Palais; Tibidabo; Mercat de Santa Caterina; Cimetière Marin Sète; Promenade du Paillon Nizza; Kathedrale San Lorenzo Genua; Scala Contarini del Bovolo Venedig; Wildkirchli). Die Darstellung enthält Urheber und CC-/Gemeinfreiheitsangabe. Die Quellen sind keine Unterkunftsfotos.
- Öffentliche Lebensmittelmarkt-Fotos nur für explizit als `allowFood` freigegebene Motive. Dadurch wird nicht das Foto des Park Güell auf ein nach ihm benanntes Café übertragen.
- Vorhandene Google-Maps-Suchlinks werden in **allen normalen Aktivitäts-, Unterkunfts- und Verpflegungskarten** bereits neben den direkten Aktionen sichtbar (zuvor teils nur in ausklappbaren Quellen bzw. im Ortsdetail). Auch ohne bestätigten GPS-Pin wird ausschließlich eine Orts-/Adresssuche geöffnet. Airbnb-Wunschlisten zeigen weiterhin nur grobe Umgebung.
- Sechs aktualisierte Zugangsprüfungen aus offiziellen Betreiberseiten, mit einer ausdrücklich als Drittanbieter gekennzeichneten Quelle für Fondaco: Musée Carnavalet, Petit Palais, Tour Montparnasse, Tibidabo, MAMAC Nizza, Fondaco dei Tedeschi. Der Bericht enthält **keine** erfundenen Eintrittstickets oder Buchbarkeit 2027.
- Zugangshinweise erscheinen in der Vorschau und im vollständigen Ortsprofil, einschließlich hervorstechender Warnungen bei aktuell geschlossenen Attraktionen. Die originalen Preise, nicht validierten Koordinaten und 105 übermittelten Kandidaten bleiben unberührt.

## Quellen der neuen Fotomotive
Einzeln in `public/curated-place-photos.mjs` unter `sourceUrl` mit `credit` und Originalseite dokumentiert. Externe Bilder werden nur über Wikimedia Commons `Special:FilePath` referenziert und können ohne Internet nicht angezeigt werden. Kein Recht, private Hotel- oder Airbnb-Fotos zu übernehmen, wird behauptet.

## Betreiber- und Zugangsquellen
Die vollständigen URLs und die Einschränkung `forTravelYearConfirmed:false` stehen in `lib/verified-place-updates-v53.mjs`.
- Musée Carnavalet: https://www.carnavalet.paris.fr/visiter/informations-pratiques
- Petit Palais: https://www.petitpalais.paris.fr/visiter/preparer-votre-visite
- Tour Montparnasse (Panoramaplattform seit 31.03.2026 geschlossen): https://www.tourmontparnasse56.com/
- Tibidabo (Panoramazone und normale Parktickets getrennt): https://tibidabo.cat/en/panoramic-area ; https://tibidabo.cat/en/plan-the-visit/rates
- MAMAC Nizza (Museumsgebäude seit 2024 wegen Umbau geschlossen): https://www.mamac-nice.org/evenement/2024-2028/
- Fondaco dei Tedeschi (Drittanbieter, Zugang 2027 unklar): https://europeforvisitors.com/venice/articles/fondaco-dei-tedeschi-roof-terrace.htm

## Tests
`test/verified-place-v53.test.mjs` prüft Einzelbilder und Bildrechte, Zugangsstatus, gleichbleibende Preise/Geo-Evidenz, prominente Schließungshinweise und direkte Google-Maps-Aktionen. Es ist Teil von `npm run test:portable`. Die vorhandenen Regressionstests stellen sicher, dass ähnliche Namen wie „Park Güell Café“ nicht mit Fotos des Parks verwechselt werden.

## Noch offen
Die neue Quellenrunde ersetzt keine systematische 2027-Nachprüfung für alle Orte. Nicht alle Einträge besitzen ein Motivfoto oder gesicherte Öffnungszeiten; Hotel-Checkouts, Unterbringungskosten und September-2027-Veranstaltungen bleiben offen. Kartenlinks sind Suchanfragen, keine unabhängig belegten POI-Eingänge. Es erfolgten weder Merge nach main noch Deployment oder Buchung.
