export type AirbnbInventoryUnit = {
  propertySlug: string;
  propertyName: string;
  unitSlug: string;
  unitName: string;
  suppliedSpecs?: string;
  postcode: string;
  airbnbUrl?: string;
};

export const airbnbInventory: AirbnbInventoryUnit[] = [
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-1', unitName: 'Apartment 1', suppliedSpecs: '1BED 1BATH', postcode: 'M2 6LE', airbnbUrl: 'https://airbnb.com/h/jds-1' },
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-2', unitName: 'Apartment 2', suppliedSpecs: '2BED 2BATH', postcode: 'M2 6LE', airbnbUrl: 'https://www.airbnb.com/h/jds-2' },
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-3', unitName: 'Apartment 3', suppliedSpecs: '2BED 2BATH', postcode: 'M2 6LE', airbnbUrl: 'https://airbnb.com/h/jds-3' },
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-4', unitName: 'Apartment 4', suppliedSpecs: '2BED 1BATH', postcode: 'M2 6LE', airbnbUrl: 'https://www.airbnb.co.uk/h/jds-4' },
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-1-2', unitName: 'Apartments 1 & 2', suppliedSpecs: '3BED 3BATH', postcode: 'M2 6LE', airbnbUrl: 'https://airbnb.co.uk/h/jds-1-2' },
  { propertySlug: 'john-dalton-st', propertyName: '42 John Dalton St.', unitSlug: 'jds-3-4', unitName: 'Apartments 3 & 4', suppliedSpecs: '4BED 3BATH', postcode: 'M2 6LE', airbnbUrl: 'https://www.airbnb.co.uk/h/jds-3-4' },

  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-1', unitName: 'Apartment 9.1', suppliedSpecs: '2BED 2BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.com/h/chambers-9-1' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-2', unitName: 'Apartment 9.2', suppliedSpecs: '3BED 2BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.co.uk/h/chambers-9-2' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-7', unitName: 'Apartment 9.7', suppliedSpecs: '2BED 1BATH', postcode: 'M2 1HN', airbnbUrl: 'https://airbnb.co.uk/h/chambers-9-7' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-8', unitName: 'Apartment 9.8', suppliedSpecs: '2BED 1BATH', postcode: 'M2 1HN', airbnbUrl: 'https://airbnb.co.uk/h/chambers-9-8' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-9', unitName: 'Apartment 9.9', suppliedSpecs: '2BED 2BATH', postcode: 'M2 1HN' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-7-9', unitName: 'Apartments 7 & 9', suppliedSpecs: '4BED 3BATH', postcode: 'M2 1HN', airbnbUrl: 'https://airbnb.com/h/chambers-7-9' },
  { propertySlug: 'chambers-9', propertyName: '9 Chapel Walks', unitSlug: 'chambers-9-1-9-2', unitName: 'Apartment 9.1 & 9.2', suppliedSpecs: '5BED 4BATH', postcode: 'M2 1HN' },

  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-1', unitName: 'Apartment 11.1', suppliedSpecs: '1BED 1BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.com/h/chambers-11-1' },
  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-2', unitName: 'Apartment 11.2', suppliedSpecs: '2BED 2BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.com/h/chambers-11-2' },
  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-3', unitName: 'Apartment 11.3', suppliedSpecs: '1BED 1BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.co.uk/h/chambers-11-3' },
  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-4', unitName: 'Apartment 11.4', suppliedSpecs: '2BED 2BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.co.uk/h/chambers-11-4' },
  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-5', unitName: 'Apartment 11.5', suppliedSpecs: '3BED 2BATH', postcode: 'M2 1HN', airbnbUrl: 'https://www.airbnb.co.uk/h/chambers-11-5' },
  { propertySlug: 'chambers-11', propertyName: '11 Chapel Walks', unitSlug: 'chambers-11-1-11-2', unitName: 'Apartment 11.1 & 11.2', suppliedSpecs: '3BED 2BATH', postcode: 'M2 1HN' },

  { propertySlug: 'wood-street', propertyName: '18 Wood Street', unitSlug: 'wood-st-2', unitName: '2 Bedrooms', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/wood-st-2' },
  { propertySlug: 'wood-street', propertyName: '18 Wood Street', unitSlug: 'wood-st-3', unitName: '3 Bedrooms', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/wood-st-3' },

  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '20-1-wsc', unitName: 'Room 1', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/20-1-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '20-2-wsc', unitName: 'Room 2', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/20-2-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '20-3-wsc', unitName: 'Room 3', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/20-3-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '22-4-wsc', unitName: 'Room 4', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/22-4-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '22-5-wsc', unitName: 'Room 5', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/22-5-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: '22-6-wsc', unitName: 'Room 6', postcode: 'M3 3EF', airbnbUrl: 'https://airbnb.com/h/22-6-wsc' },
  { propertySlug: 'the-collective', propertyName: 'Wood Street Collective', unitSlug: 'wood-street-collective-full-house', unitName: 'Full House', postcode: 'M3 3EF' },

  { propertySlug: 'loom-street', propertyName: '8 Loom Street', unitSlug: 'mill-conversion-8', unitName: 'Apartment 8', postcode: 'M4 6AN', airbnbUrl: 'https://www.airbnb.com/h/mill-conversion-8' },
  { propertySlug: 'loom-street', propertyName: '8 Loom Street', unitSlug: 'mill-conversion-3', unitName: 'Apartment 3', postcode: 'M4 6AN', airbnbUrl: 'https://www.airbnb.com/h/mill-conversion-3' },
  { propertySlug: 'newton-street', propertyName: '113 Newton Street', unitSlug: '21-loft-conversion', unitName: 'Apartment 21', postcode: 'M1 1AE', airbnbUrl: 'https://www.airbnb.com/h/21-loft-conversion' },
  { propertySlug: 'lockgate-mews', propertyName: 'Lockgate Mews', unitSlug: 'lockgate-504', unitName: 'Apartment 504', postcode: 'M4 6GE' },
  { propertySlug: 'sezas', propertyName: "Seza's", unitSlug: 'sezas-conversion', unitName: 'Apartment 15', postcode: 'M4 5BR', airbnbUrl: 'https://airbnb.com/h/sezas-conversion' },
  { propertySlug: 'crusader', propertyName: 'Crusader', unitSlug: 'mill-conversion-6', unitName: 'Apartment 6', postcode: 'M1 2WQ', airbnbUrl: 'https://airbnb.com/h/mill-conversion-6' },
  { propertySlug: 'mm2', propertyName: 'MM2', unitSlug: 'ancoats-14', unitName: 'Apartment 14', postcode: 'M4 5BS', airbnbUrl: 'https://airbnb.com/h/ancoats-14' },
  { propertySlug: 'mm2', propertyName: 'MM2', unitSlug: 'ancoats-15', unitName: 'Apartment 15', postcode: 'M4 5BS', airbnbUrl: 'https://airbnb.com/h/ancoats-15' },
  { propertySlug: 'spinning-mills', propertyName: 'Spinning Mills', unitSlug: 'redbrick-mill-2', unitName: 'Apartment 212', postcode: 'M40 7LY', airbnbUrl: 'https://airbnb.com/h/redbrick-mill-2' },
  { propertySlug: 'spinning-mills', propertyName: 'Spinning Mills', unitSlug: 'redbrick-mill-4', unitName: 'Apartment 406', postcode: 'M40 7LY', airbnbUrl: 'https://airbnb.com/h/redbrick-mill-4' },
  { propertySlug: 'popworks', propertyName: 'PopWorks', unitSlug: 'ancoats-pop-5', unitName: 'Apartment 5', postcode: 'M4 6BQ', airbnbUrl: 'https://airbnb.com/h/ancoats-pop-5' },
  { propertySlug: 'old-trafford', propertyName: 'Insignia', unitSlug: 'oldtraford', unitName: 'Apartment 105', postcode: 'M16 0PG', airbnbUrl: 'https://airbnb.com/h/oldtraford' },
];

export function getInventoryForProperty(propertySlug: string) {
  const groupedProperties: Record<string, string[]> = {
    chambers: ['chambers-9', 'chambers-11'],
    ancoats: [
      'loom-street',
      'newton-street',
      'lockgate-mews',
      'sezas',
      'crusader',
      'mm2',
      'spinning-mills',
      'popworks',
    ],
  };
  const propertySlugs = groupedProperties[propertySlug] || [propertySlug];

  return airbnbInventory.filter((unit) => propertySlugs.includes(unit.propertySlug));
}

export function getInventoryUnit(propertySlug: string | undefined, unitSlug: string | undefined) {
  if (!propertySlug || !unitSlug) return undefined;
  return getInventoryForProperty(propertySlug).find((unit) => unit.unitSlug === unitSlug);
}
