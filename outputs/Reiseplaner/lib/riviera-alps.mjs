const checked = '2026-11-12';
const source = (id, publisher, url) => ({ id, publisher, url, accessed_on: checked });

export const rivieraAlpsSources = [
  source('nice-station', 'SNCF · Nice-Ville', 'https://www.garesetconnexions.sncf/fr/nice'),
  source('nice-station-tram', 'SNCF · Tram und Bus an Nice-Ville', 'https://www.garesetconnexions.sncf/fr/gares-services/nice/intermodalites'),
  source('nice-saleya', 'Nice Côte d’Azur Tourisme · Cours Saleya', 'https://www.explorenicecotedazur.com/culture/cours-saleya/'),
  source('nice-castle', 'Nice Côte d’Azur Tourisme · Parc de la Colline du Château', 'https://www.explorenicecotedazur.com/culture/parc-de-la-colline-du-chateau/'),
  source('nice-villefranche', 'Nice Côte d’Azur Tourisme · Villefranche-sur-Mer und Strände', 'https://www.explorenicecotedazur.com/explorer/villes-villages/littoral/villefranche-sur-mer/'),
  source('nice-eze', 'Nice Côte d’Azur Tourisme · Èze-Village', 'https://www.explorenicecotedazur.com/en/explore/towns-villages/coastal-area/eze/'),
  source('nice-antares-rooms', 'Antares · Zimmer und Adresse', 'https://antareshostel.com/hostel_room/'),
  source('nice-antares-geo', 'IGN / Base Adresse Nationale · 5 Avenue Thiers', 'https://data.geopf.fr/geocodage/search/?limit=1&q=5%20Avenue%20Thiers%20Nice'),
  source('ch-kandersteg', 'BLS · Bahnhof Kandersteg im Streckenverzeichnis', 'https://www.bls.ch/-/media/bls/pdf/uebrige-pdfs/trassen-netzzugang/infrastruktur-trassen-betriebspunkte.pdf'),
  source('ch-s23', 'Appenzeller Bahnen · Linie S23', 'https://appenzellerbahnen.ch/files/appenzellerbahnen.ch/03_Services/Barrierefrei/Linie%20Gossau-Appenzell-Wasserauen.pdf'),
  source('ch-oeschi-access', 'Oeschinensee · Anreise zur Talstation', 'https://www.oeschinensee.ch/anreise/'),
  source('ch-oeschi-hours', 'Oeschinensee · Tarife und Betriebszeiten 2027', 'https://www.oeschinensee.ch/tarife-fahrplan/'),
  source('ch-oeschi-walk', 'Oeschinensee · Wanderungen und Gehzeiten', 'https://www.oeschinensee.ch/wandern/'),
  source('ch-seealp-loop', 'Appenzellerland Tourismus · Rundtour Wasserauen und Seealpsee', 'https://www.appenzell.ch/en/summer/hiking.html?cHash=d5f7647bc4982e529b39fc70616dda05&tx_wstourismus_tourismus%5Baction%5D=show&tx_wstourismus_tourismus%5Bcontroller%5D=Tour&tx_wstourismus_tourismus%5Btour%5D=39'),
  source('ch-aescher', 'Appenzellerland Tourismus · Bergwanderung über den Äscher', 'https://www.appenzell.ch/de/service/touren.html?cHash=7c77c6b15a7331855e1aa9ad6d51274c&tx_wstourismus_tourismus%5Baction%5D=show&tx_wstourismus_tourismus%5Bcontroller%5D=Tour&tx_wstourismus_tourismus%5Btour%5D=571'),
  source('ch-first', 'Jungfrau Railways · Grindelwald-First', 'https://www.jungfrau.ch/de-ch/grindelwaldfirst/'),
  source('ch-first-station', 'Jungfrau Railways · Talstation Firstbahn', 'https://www.jungfrau.ch/de-ch/anreise-bahnhoefe-parking/talstationen/talstation-firstbahn/'),
  source('ch-bachalpsee', 'Jungfrau Railways · Wanderung First–Bachalpsee', 'https://www.jungfrau.ch/de-ch/grindelwaldfirst/bachalpsee/'),
  source('ch-kloental', 'Visit Glarnerland · Bergrundwanderweg Klöntalersee', 'https://glarnerland.ch/de/map/poi/bergrundwanderweg-klontalersee--id--tou_s9t_fhtsjret-vvqc-efvd-qhdg-sfghdjqqbfhv.html'),
  source('ch-glarus-bus', 'Visit Glarnerland · Bus 504 und Uferweg', 'https://glarnerland.ch/de/map/poi/am-klontaler-see--id--tou_4kq_cchfcjdf.html'),
  source('ch-metzg', 'Appenzellerland Tourismus · Alte Metzg', 'https://www.appenzell.ch/de/unterkunft/ferien-wohnungen/boutique-pension-hostel-alte-metzg.html'),
  source('ch-blattenheimat', 'Appenzellerland Tourismus · Blattenheimat 6OG3', 'https://www.appenzell.ch/de/unterkunft/ferien-wohnungen/ferienwohnung-blattenheimat-6og3.html'),
  source('ch-metzg-geo', 'swisstopo · Gaiserstrasse 6', 'https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.swisstopo.amtliches-gebaeudeadressverzeichnis/100982907'),
  source('ch-blattenheimat-geo', 'swisstopo · Blattenheimatstrasse 8', 'https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.swisstopo.amtliches-gebaeudeadressverzeichnis/100981591'),
];

export const rivieraAlpsStations = {
  nice: { match: /\bnice[- ]ville\b/, point: [43.704556, 7.261904], address: 'Avenue Thiers, Nice', sources: ['nice-station', 'nice-station-tram'] },
  kandersteg: { match: /kandersteg/, point: [46.49519, 7.67148], address: 'Bahnhof Kandersteg', sources: ['ch-kandersteg', 'ch-oeschi-access', 'it-osm'] },
  appenzell: { match: /appenzell/, point: [47.32853, 9.40953], address: 'Bahnhof Appenzell', sources: ['ch-s23', 'it-osm'] },
};

const oeschiValley = {
  point: [46.49757, 7.6825], address: 'Oeschistrasse 50, Kandersteg',
  tags: ['Gondel', 'Berg'], placeRole: 'oeschi-valley',
  serviceWindow: { from: '2027-04-24', to: '2027-09-19', open: '08:30', close: '18:00' },
  detail: '24.04.–19.09.2027: Gondelbetrieb laut Betreiber 08:30–18:00. Ab Bahnhof Kandersteg rund 10–15 Min. zu Fuß. Tarif für September 2027 offen.',
  addedSources: ['ch-oeschi-access', 'ch-oeschi-hours'],
};
const oeschiLake = {
  point: [46.49845, 7.72544], tags: ['See', 'Wandern'], placeRole: 'oeschi-lake',
  detail: 'Ab Bergstation rund 30 Min. zum See. Für die Anfahrt mit Gondel zusätzlich Zustieg, Fahrt und Wartezeit einplanen. Der Betreiber nennt für den Aufstieg ab Talstation zu Fuß rund 90 Min.',
  addedSources: ['ch-oeschi-hours', 'ch-oeschi-walk'],
};
const seealp = {
  tags: ['Wandern', 'T2'], detail: 'Die offizielle Rundtour ab und bis Wasserauen umfasst rund 7,34 km, 377 Höhenmeter und 2 Std. 30 Min. Die Angabe gilt für den gesamten Rundweg. S23 ab Appenzell, konkrete Abfahrt zum Reisetag prüfen.',
  addedSources: ['ch-seealp-loop', 'ch-s23'],
};
const beach = {
  name: 'Strandtag · Plage des Marinières',
  point: [43.7011, 7.3178], tags: ['Strand', 'Ausflug'], address: 'Plage des Marinières, Villefranche-sur-Mer',
  detail: 'Bucht östlich von Nizza. Für Hin- und Rückweg den TER ab Nice-Ville oder den Bus vergleichen. Abfahrten und Gültigkeit der Fahrkarte zum Reisetag prüfen.',
  addedSources: ['nice-villefranche'],
};
const oeschiPlaces = [
  [/gondelstation oeschinensee|talstation oeschinensee/, oeschiValley],
  [/oeschinensee/, oeschiLake],
];

export const rivieraAlpsPlaces = {
  nice: [
    [/cours saleya|vieux-nice/, { point: [43.6957, 7.2769], tags: ['Altstadt', 'Markt'], addedSources: ['nice-saleya'],
      detail: 'Platz und Marktstraße in der Altstadt. Für einen Abendbesuch eignen sich die Gassen und Gastronomie. Marktzeiten und Abendprogramm getrennt prüfen.' }],
    [/chateau/, { point: [43.6954, 7.2807], tags: ['Aussicht', 'Steigung'], addedSources: ['nice-castle'],
      detail: 'Aussicht auf die Baie des Anges und den Hafen. Aufstieg, Öffnungszeiten und den Rückweg für den Reisetag prüfen.' }],
    [/\beze\b/, { point: [43.7278, 7.3615], tags: ['Ausflug', 'Steigung'], addedSources: ['nice-eze'],
      detail: 'Mittelalterliches Dorf am Hang. Für diesen Ausflug Èze-Village als Ziel wählen. Der Bahnhof Èze-sur-Mer liegt unten an der Küste.' }],
    [/strandtag|marinieres/, beach],
  ],
  kandersteg: oeschiPlaces,
  oeschinensee: oeschiPlaces,
  appenzell: [
    [/wasserauen.*ruckfahrt/, { placeRole: 'seealp-start', tags: ['Bahn', 'Rückweg'],
      detail: 'Die S23 verbindet Wasserauen und Appenzell. Rückfahrt und Fahrkarten für den Reisetag im Fahrplan prüfen.',
      addedSources: ['ch-s23'] }],
    [/ascher|aescher/, { tags: ['Bergwanderung', 'Trittsicherheit'],
      detail: 'Der Abstieg über den Äscher erfordert laut Tourismusstelle Trittsicherheit. Zustand, Ausrüstung und Gruppenerfahrung prüfen.',
      addedSources: ['ch-aescher'] }],
    [/seealpsee.*ab wasserauen/, { ...seealp, point: [47.28561, 9.42829], placeRole: 'seealp-start' }],
    [/seealpsee/, { ...seealp, point: [47.26825, 9.40118], placeRole: 'seealp-lake' }],
  ],
  wasserauen: [[/wanderstart/, { ...seealp, placeRole: 'seealp-start' }]],
  seealpsee: [[/seealpsee/, { ...seealp, placeRole: 'seealp-lake' }]],
  grindelwald: [
    [/firstbahn/, { point: [46.624224, 8.041871], placeRole: 'first-lift',
      tags: ['Berg', 'Gondel'], detail: 'Die Firstbahn braucht laut Betreiber rund 25 Min. bis First. Ab Bahnhof Grindelwald rund 8 Min. zu Fuß zur Talstation. Die Preisreferenz beginnt bei CHF 38. Preis für Hin- und Rückfahrt und Betriebszeiten zum Reisetag prüfen.',
      addedSources: ['ch-first', 'ch-first-station'] }],
    [/cliff walk/, { tags: ['Berg', 'Aussicht'], detail: 'Aussichtsweg an der Bergstation First. Zugang und Betriebszeiten beim Betreiber prüfen.',
      addedSources: ['ch-first'] }],
  ],
  bachalpsee: [[/bachalpsee/, {
    tags: ['Wandern', 'Bergsee'], detail: 'Jungfrau Railways nennt rund zwei Stunden für Hin- und Rückweg ab First. Firstbahn oder einen eigenständigen Aufstieg vorab einplanen und die Rückkehr ins Tal prüfen.',
    needsAccess: 'First erreichen: Firstbahn oder eigenständigen Aufstieg samt Rückweg einplanen.',
    addedSources: ['ch-first', 'ch-bachalpsee'],
  }]],
  kloental: [
    [/wanderung|klontalersee/, { tags: ['Bergwanderung', 'See'],
      detail: 'Die ausgeschilderte Runde ab und bis Rhodannenberg umfasst rund 12,65 km, 145 Höhenmeter und gut 3,5 Std. Die Angabe beschreibt die ganze Runde. Wegzustand und saisonalen Busbetrieb prüfen.',
      addedSources: ['ch-kloental', 'ch-glarus-bus'] }],
    [/rhodannenberg/, { tags: ['Picknick', 'Bushalt'], detail: 'Am Staudamm liegt der Ausgangspunkt der Rundwanderung und die Haltestelle Rhodannenberg. Bus 504 ab Bahnhof Glarus, Abfahrten für den Reisetag prüfen.',
      addedSources: ['ch-kloental', 'ch-glarus-bus'] }],
  ],
};

export const rivieraAlpsLodgings = [
  [/antares/i, {
    address: '5 Avenue Thiers, Nice', point: [43.704986, 7.264144],
    room: 'Dreibettzimmer laut Anbieter. Verfügbarkeit für eure Daten offen.',
    detail: 'Hostel an der Avenue Thiers nahe Nice-Ville. Gesamtpreis, Gebühren, Storno und Ausstattung für eure Zimmerwahl prüfen.',
    addedSources: ['nice-antares-rooms', 'nice-antares-geo'],
  }],
  [/alte metzg/i, {
    address: 'Gaiserstrasse 6, Appenzell', point: [47.331581, 9.411795],
    detail: 'Pension und Hostel mit Mehrbettzimmern. Die Tourismusstelle nennt CHF 40–110 pro Person und Nacht ohne Frühstück als Referenz. Zusammenhängende Belegung und Gesamtpreis für eure Daten sind offen.',
    addedSources: ['ch-metzg', 'ch-metzg-geo'],
  }],
  [/blattenheimat 6og3/i, {
    address: 'Blattenheimatstrasse 8, Appenzell', point: [47.332348, 9.406453],
    kitchen: 'Küche in der Ferienwohnung', kitchenMode: 'private', room: 'Ferienwohnung für vier bis fünf Personen laut Tourismusstelle.',
    detail: 'Veröffentlichte Referenz: CHF 150 pro Nacht, CHF 260 für die Endreinigung plus Kurtaxe. Der Gesamtpreis und die Verfügbarkeit für eure Daten sind offen.',
    addedSources: ['ch-blattenheimat', 'ch-blattenheimat-geo'],
  }],
];
