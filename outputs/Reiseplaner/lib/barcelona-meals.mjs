const checked = '2026-11-12';
const source = (id, publisher, url) => ({ id, publisher, url, accessed_on: checked });

export const mealSources = [
  source('bcn-food-menu', 'Bormuth · veröffentlichte Speisekarte', 'https://www.bormuthbarcelona.com/_files/ugd/a7d6d4_e9bd97df719847af981b41ccc257181f.pdf'),
  source('bcn-food-store', 'Carrefour Express Gran Via · Filiale und Regelzeiten', 'https://www.carrefour.es/tiendas-carrefour/supermercados/carrefour-express/calle_gran_via_de_las_cortes_catalanas-s.aspx'),
  source('bcn-food-geo', 'Institut Cartogràfic i Geològic de Catalunya · Adresskoordinaten', 'https://www.icgc.cat/es/Herramientas-y-visores/Herramientas/Geocodificador-ICGC'),
  source('bcn-food-pasta', 'Carrefour Online · Macarrones 500 g', 'https://www.carrefour.es/supermercado/macarrones-carrefour-500-g/R-544101816/p'),
  source('bcn-food-tomato', 'Carrefour Online · Tomate frito 400 g', 'https://www.carrefour.es/supermercado/tomate-frito-carrefour-lata-400-g/R-prod730716/p'),
  source('bcn-food-chickpeas', 'Carrefour Online · Kichererbsen 400 g Abtropfgewicht', 'https://www.carrefour.es/supermercado/garbanzos-cocidos-categoria-extra-classic-carrefour-400-g/R-521005495/p'),
];

export const barcelonaFoodPlaces = [
  { id: 'bormuth', name: 'Bormuth · Tapas in El Born', point: [41.385873, 2.182637], address: 'Plaça Comercial 1, Barcelona',
    detail: 'Tapas zum Teilen, darunter Tortilla, Patatas bravas und Albóndigas. Die verlinkte Speisekarte nennt 10 % Terrassenzuschlag. Aktuelle Karte und Küchenzeiten für den Reiseabend prüfen.',
    source: ['pilot-bormuth', 'bcn-food-menu', 'bcn-food-geo'], tags: ['Tapas', 'El Born'] },
  { id: 'nardi', name: 'Taberna Nardi · Fisch und Meeresfrüchte', point: [41.385619, 2.179640], address: 'Carrer dels Corders 11, Barcelona',
    detail: 'Fisch, Meeresfrüchte und wechselnde Tagesgerichte zum Teilen. Der Betreiber nennt täglich 13:00–00:00 Uhr. Küchenschluss und Gruppenpreis sind offen.',
    source: ['pilot-nardi', 'bcn-food-geo'], tags: ['Meeresfrüchte', 'El Born'], hours: ['13:00', '00:00'] },
  { id: 'carrefour-gran-via', name: 'Carrefour Express · Gran Via', point: [41.385080, 2.162053],
    address: 'Gran Via de les Corts Catalanes 573, Local 2, Barcelona',
    detail: 'Einkauf nahe Urgell. Die Filiale nennt Montag bis Samstag 09:00–23:00 Uhr. Feiertage, Sortiment und Regalpreise vor Ort prüfen.',
    source: ['bcn-food-store', 'bcn-food-geo'], tags: ['Supermarkt', 'Eixample'], duration: 15,
    weekly: { days: [1, 2, 3, 4, 5, 6], hours: ['09:00', '23:00'] } },
];

export const mealPlans = {
  barcelona: [
    { id: 'pasta', name: 'Pasta mit Tomate und Kichererbsen', type: 'cook', slot: 'dinner', prep: 35, shopMinutes: 15, shop: 'local:carrefour-gran-via',
      note: 'Für eine Mahlzeit. Pro Person 100 g trockene Pasta, 120 g Tomatensoße und 120 g abgetropfte Kichererbsen. Grundgewürze und Trinkwasser werden vorausgesetzt.',
      priceNote: 'Online-Preisreferenz für ganze Packungen · Filialpreis und Bestand offen',
      source: ['bcn-food-pasta', 'bcn-food-tomato', 'bcn-food-chickpeas', 'bcn-food-store'],
      products: [
        { name: 'Macarrones', pack: 500, need: 100, cents: 80, source: 'bcn-food-pasta' },
        { name: 'Tomatensoße', pack: 400, need: 120, cents: 120, source: 'bcn-food-tomato' },
        { name: 'Kichererbsen, abgetropft', pack: 400, need: 120, cents: 80, source: 'bcn-food-chickpeas' },
      ] },
    { id: 'bormuth', name: 'Tapas bei Bormuth', type: 'restaurant', slot: 'dinner', prep: 65, venue: 'local:bormuth', terracePercent: 10,
      note: 'Beispielbestellung zum Teilen mit einem Wasser je Person. Für andere Gruppengrößen werden die Portionszahlen aufgerundet.',
      priceNote: 'Referenz aus der veröffentlichten Speisekarte · Reisejahr 2027 offen',
      source: ['bcn-food-menu', 'pilot-bormuth'],
      products: [
        { name: 'Tortilla', forThree: 2, cents: 650 },
        { name: 'Patatas bravas', forThree: 1, cents: 600 },
        { name: 'Hummus mit Gemüse', forThree: 1, cents: 750 },
        { name: 'Albóndigas', forThree: 1, cents: 1000 },
        { name: 'Tomatenbrot', forThree: 2, cents: 250 },
        { name: 'Stilles Wasser', forThree: 3, cents: 250 },
      ] },
  ],
};
