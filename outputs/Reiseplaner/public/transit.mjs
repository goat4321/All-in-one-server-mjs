export const transitNetworks = {
  barcelona: {
    provider: 'AMB', attribution: 'https://www.amb.cat/en/web/area-metropolitana/dades-obertes/condicions-d-us', quick: 'metro',
    groups: {
      metro: { title: 'Metro', color: '#9e3659', files: ['metro', 'metro-stops'] },
      tram: { title: 'Tram', color: '#087e74', files: ['tram', 'tram-stops'] },
      rail: { title: 'Rodalies & FGC', color: '#be701d', files: ['rail', 'rail-stops', 'fgc', 'fgc-stops'] },
      bus: { title: 'Bus', color: '#4766a4', files: ['bus', 'tmb-bus-stops'],
        supplement: { file: 'tmb-bus-stops', provider: 'TMB · 22.10.2026–18.06.2027', source: 'https://mobilitydatabase.org/feeds/gtfs/mdb-2359' } },
    },
  },
  genoa: {
    provider: 'AMT / Comune di Genova (CC BY 4.0)', attribution: 'https://www.dati.gov.it/node/view-dataset/dataset?id=9529fa6c-3534-431f-9cb0-41749286f2ee',
    dateLabel: 'AMT-Daten · 09.–16.11.2026', quick: 'metro',
    groups: {
      metro: { title: 'Metro', color: '#9e3659', files: ['genoa-metro-stops', 'genoa-metro-osm'] },
      bus: { title: 'Bushaltestellen', color: '#4766a4', files: ['genoa-bus-stops'] },
      funicular: { title: 'Stand- und Zahnradbahn · Stationen', color: '#087e74', files: ['genoa-funicular-stops'] },
      rail: { title: 'Genova–Casella · Stationen', color: '#be701d', files: ['genoa-rail-stops'] },
    },
  },
  venice: {
    provider: 'ACTV / Comune di Venezia (CC BY)', attribution: 'https://www.dati.venezia.it/?q=node%2F261',
    dateLabel: 'ACTV-Daten · 02.–20.11.2026', quick: 'ferry',
    groups: {
      ferry: { title: 'Vaporetto', color: '#086d9c', files: ['venice-ferry', 'venice-ferry-stops'] },
    },
  },
  nice: {
    provider: 'Lignes d’Azur / Métropole Nice Côte d’Azur (Licence Ouverte 2.0)',
    attribution: 'https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur?locale=fr',
    dateLabel: 'Lignes d’Azur · 12.11.–22.12.2026', quick: 'tram',
    groups: {
      tram: { title: 'Tram', color: '#9e3659', files: ['nice-tram', 'nice-tram-stops'] },
      bus: { title: 'Bus', color: '#4766a4', files: ['nice-bus', 'nice-bus-stops'] },
    },
  },
};

export const transitFares = {
  nice: {
    ticket: 'Solo · 74 Minuten', single: 170, pass: 700, passName: 'Pass 24 heures',
    details: 'Ticketfenster pro Person innerhalb von 24 Stunden zählen. Umstiege innerhalb von 74 Minuten entsprechend den Tarifregeln. Aufladbare Karte, Flughafen-Sonderticket und TER separat prüfen.',
    source: 'https://www.lignesdazur.com/fr/tickets-la-journee',
    singleSource: 'https://www.lignesdazur.com/titres-et-tarifs/quel-titre-pour-mon-deplacement/titres-au-voyage/',
  },
  genoa: {
    ticket: 'AMT 110 Minuten', single: 200, pass: 1000, passName: 'MetDaily · 24 Stunden',
    details: 'Vergleich für Fahrten, die beide Tarife abdecken. Volabus, Navebus, Züge und Sonderlinien separat prüfen.',
    source: 'https://www.amt.genova.it/amt/biglietti-e-abbonamenti-2/biglietti-e-carnet/',
  },
  venice: {
    ticket: 'ACTV 75 Minuten', single: 950, pass: 3500, passName: 'ACTV · 48 Stunden',
    details: 'Vergleich für Vaporetto-Fahrten im selben 48-Stunden-Fenster. Fahrten innerhalb eines gültigen 75-Minuten-Tickets einmal zählen. Flughafenverkehr und Regionalzüge separat prüfen.',
    source: 'https://muoversi.venezia.it/it/content/vaporetto',
  },
};
