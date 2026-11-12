const checked = '2026-11-12';
const source = (id, publisher, url) => ({ id, publisher, url, accessed_on: checked });

export const italySources = [
  source('it-rfi-genoa', 'RFI · Genova Piazza Principe', 'https://www.rfi.it/it/stazioni/genova-piazza-principe.html'),
  source('it-rfi-venice', 'RFI · Venezia Santa Lucia', 'https://www.rfi.it/it/stazioni/venezia-s-lucia.html'),
  source('it-rfi-mestre', 'RFI · Venezia Mestre', 'https://www.rfi.it/it/stazioni/venezia-mestre.html'),
  source('it-genoa-walks', 'Visitgenoa · Spaziergänge und Stadtkarte', 'https://www.visitgenoa.it/en/node/21442'),
  source('it-genoa-map', 'Comune di Genova · Stadtkarte', 'https://www.visitgenoa.it/sites/default/files/2023-08/CARTINA_Genova%202022.pdf'),
  source('it-genoa-beach', 'Comune di Genova · Spiaggia di Boccadasse', 'https://www.comune.genova.it/sites/default/files/2025-06/6%20Genova%20Sea%20Inclusion_Boccadasse%202025_0.pdf'),
  source('it-amt', 'AMT · Metro, Betriebszeiten und Karte', 'https://www.amt.genova.it/amt/trasporto-multimodale/metropolitana/'),
  source('it-amt-gtfs', 'AMT / Comune di Genova · GTFS (CC BY 4.0)', 'https://www.dati.gov.it/node/view-dataset/dataset?id=9529fa6c-3534-431f-9cb0-41749286f2ee'),
  source('it-amt-fare', 'AMT · Einzelfahrschein 110 Minuten', 'https://www.amt.genova.it/amt/biglietti-e-abbonamenti-2/biglietti-e-carnet/biglietto-ordinario/'),
  source('it-san-marco', 'Venezia Unica · Piazza San Marco', 'https://www.veneziaunica.it/en/things-to-do-in-venice/public-spaces/piazza-san-marco'),
  source('it-cannaregio', 'Venezia Unica · Rundgang Cannaregio', 'https://www.veneziaunica.it/it/cosa-fare-a-venezia/itinerari/cannaregio-autenticita-e-tradizioni'),
  source('it-rialto', 'Venezia Unica · Anleger und Umgebung Rialto', 'https://tripplanner.veneziaunica.it/sites/default/files/mappa_approdi_Rialto_0.pdf'),
  source('it-dorsoduro', 'Venezia Unica · Rundgang Dorsoduro', 'https://www.veneziaunica.it/sites/default/files/Itinerario_Dorsoduro_Classica.pdf'),
  source('it-burano', 'Venezia Unica · Burano', 'https://www.veneziaunica.it/en/things-to-do-in-venice/venice-areas/isole/burano'),
  source('it-actv', 'ACTV · Fahrkarten und Gültigkeit', 'https://www.veneziaunica.it/it/acquista-i-biglietti/trasporto-pubblico-a-venezia'),
  source('it-actv-gtfs', 'ACTV / Comune di Venezia · GTFS (CC BY)', 'https://www.dati.venezia.it/?q=node%2F261'),
  source('it-genoa-hostel', 'Ostello Bello · Genova, Zimmer und Küche', 'https://ostellobello.com/it/hostel/genova/'),
  source('it-genoa-hostel-rooms', 'Hotel Britannia · Dreierzimmer im selben Haus', 'https://ostellobello.com/it/hostel/hotel-britannia-genova/'),
  source('it-generator', 'Generator Venice · Privatzimmer für drei', 'https://staygenerator.com/hostels/venice'),
  source('it-ao', 'a&o · Adresse und Familienzimmer in Mestre', 'https://cdn.aohostels.com/pdf/aohostels_Brochure.pdf'),
  source('it-osm', 'OpenStreetMap · Orientierungspunkte', 'https://www.openstreetmap.org/copyright'),
];

export const italyStations = {
  genoa: { match: /piazza principe|p\.\s*principe/, point: [44.41635, 8.92250], address: 'Piazza Acquaverde, Genova', sources: ['it-rfi-genoa', 'it-genoa-map', 'it-osm'] },
  venice: { match: /santa lucia|s\.\s*lucia/, point: [45.44090, 12.32220], address: 'Fondamenta Santa Lucia, Venezia', sources: ['it-rfi-venice', 'it-osm'] },
};

const place = (point, address, tags, detail, addedSources) => ({ point, address, tags, detail, addedSources });
export const italyPlaces = {
  genoa: [
    [/porto antico/, place([44.41080, 8.92690], 'Porto Antico, Genova', ['Hafen', 'Draußen', 'Abend'],
      'Runde am alten Hafen mit Blick auf den Kai und das Aquarium. Eintritt ins Aquarium wäre eine separate Entscheidung.', ['it-genoa-walks', 'it-osm'])],
    [/caruggi/, place([44.40783, 8.93163], 'Piazza San Lorenzo, Genova', ['Altstadt', 'Draußen'],
      'Die Piazza San Lorenzo ist der Startpunkt für den Spaziergang durch die Altstadtgassen.', ['it-genoa-map', 'it-osm'])],
    [/boccadasse/, place([44.39010, 8.97461], 'Spiaggia di Boccadasse, Genova', ['Küste', 'Draußen'],
      'Kieselbucht am Ende der Uferpromenade. Baderegeln und Saisonbetrieb für den Reisetag prüfen.', ['it-genoa-beach', 'it-genoa-walks'])],
    [/corso italia/, place([44.39132, 8.96738], 'Corso Italia, Genova', ['Ufer', 'Verpflegung', 'Draußen'],
      'Der Pin markiert einen Abschnitt der Uferpromenade. Die Bäckerei und der Preis für Focaccia sind offen.', ['it-genoa-walks', 'it-osm'])],
    [/spianata castelletto/, place([44.41363, 8.93450], 'Spianata di Castelletto, Genova', ['Aussicht', 'Draußen'],
      'Aussicht über Altstadt und Hafen. Steigungen oder Aufzug in den Weg einrechnen.', ['it-genoa-walks', 'it-osm'])],
  ],
  venice: [
    [/rialto/, place([45.43800, 12.33580], 'Ponte di Rialto, Venezia', ['Canal Grande', 'Draußen'],
      'Start an der Rialtobrücke für den Spaziergang am Canal Grande. Der Anleger liegt in der Nähe.', ['it-rialto', 'it-osm'])],
    [/cannaregio/, place([45.44583, 12.32632], 'Campo del Ghetto Novo, Venezia', ['Abend', 'Draußen'],
      'Der Platz ist ein Orientierungspunkt für den Abendspaziergang durch Cannaregio.', ['it-cannaregio', 'it-osm'])],
    [/san marco|markusplatz/, place([45.43405, 12.33864], 'Piazza San Marco, Venezia', ['Stadtplatz', 'Draußen'],
      'Außenrunde am Markusplatz. Basilika, Campanile und Dogenpalast brauchen bei Bedarf eigene Zeitfenster und Eintrittspositionen.', ['it-san-marco', 'it-osm'])],
    [/lido.*strand/, place([45.41768, 12.36822], 'Anleger Lido S.M.E., Venezia', ['Strand', 'Vaporetto'],
      'Der Pin markiert den Anleger für die Anfahrt zum Lido. Der Strandabschnitt und der weitere Weg sind offen.', ['it-actv-gtfs'])],
    [/dorsoduro/, place([45.43410, 12.32404], 'Campo Santa Margherita, Venezia', ['Abend', 'Draußen'],
      'Startpunkt für einen Spaziergang durch Dorsoduro. Abstecher zur Uferpromenade Zattere sind möglich.', ['it-dorsoduro', 'it-osm'])],
    [/burano/, place([45.48560, 12.41630], 'Burano, Venezia', ['Insel', 'Vaporetto'],
      'Inselrunde entlang der Kanäle. Hinfahrt und Rückfahrt am gewählten Reisetag separat prüfen und im Budget berücksichtigen.', ['it-burano', 'it-actv', 'it-osm'])],
  ],
};

export const italyLodgings = [
  { city: 'genoa', id: 'genoa-bello', name: 'Ostello Bello / Hotel Britannia', address: 'Via Balbi 38, Genova',
    point: [44.41586, 8.92358], kitchen: 'Gemeinschaftsküche', kitchenMode: 'shared',
    room: 'Britannia nennt Dreierzimmer. Küche im Haus laut Betreiber. Tarif und Zugang für den gewählten Zimmertyp prüfen.',
    detail: 'Option nahe Genova Piazza Principe. Die Kurtaxe ist laut Anbieter separat zu zahlen. Belegung, Gesamtpreis und Storno am Reisedatum prüfen.',
    source: ['it-genoa-hostel', 'it-genoa-hostel-rooms', 'it-osm'] },
  { city: 'venice', id: 'venice-generator', name: 'Generator Venice · Giudecca', address: 'Fondamenta della Croce 86, Venezia',
    point: [45.42513, 12.33524], room: 'Privates Dreibettzimmer mit Gemeinschaftsbad laut Anbieter.',
    detail: 'Anreise ab Santa Lucia mit Wasserbus einplanen. Preis, Zimmerverfügbarkeit und Gebühren für den Aufenthalt sind offen.',
    access: 'Vaporetto zum Anleger Zitelle. Gepäcktransfer und Rückfahrt am Reisedatum prüfen.', source: ['it-generator', 'it-actv-gtfs', 'it-osm'] },
  { city: 'venice', id: 'venice-ao-mestre', name: 'a&o Venezia Mestre · Via Ca’ Marcello 19', address: 'Via Ca’ Marcello 19, Venezia Mestre',
    point: [45.48144, 12.23900], localStation: { name: 'Venezia Mestre', point: [45.48210, 12.23210] },
    room: 'Familienzimmer laut Anbieter. Belegung mit drei Erwachsenen und Tarif prüfen.',
    detail: 'Option auf dem Festland. Für die Tage auf der Insel fallen Wege und gegebenenfalls zusätzliche Fahrkarten an.',
    access: 'Der Fußweg beginnt am Festlandsbahnhof Venezia Mestre. Transfer zur Insel zusätzlich einplanen.', source: ['it-ao', 'it-rfi-mestre', 'it-osm'] },
];
