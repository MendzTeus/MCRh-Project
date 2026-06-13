export type PropertyUnit = {
  slug: string;
  title: string;
  label: string;
  specs: string;
  squareFeet?: string;
  description: string;
};

export type Property = {
  slug: string;
  name: string;
  area: string;
  eyebrow: string;
  headline: string;
  description: string;
  quote: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  imageSrc: string;
  imageAlt: string;
  gallery: string[];
  amenities: string[];
  units: PropertyUnit[];
  displayOrder: number;
};

const mediaPaths = {
  chambers: [
    "/media/properties/chambers/01.jpeg",
    "/media/properties/chambers/02.jpeg",
    "/media/properties/chambers/03.jpeg",
    "/media/properties/chambers/04.jpeg",
    "/media/properties/chambers/05.jpeg",
  ],
  johnDaltonSt: [
    "/media/properties/john-dalton-st/01.jpg",
    "/media/properties/john-dalton-st/02.jpg",
    "/media/properties/john-dalton-st/03.jpg",
    "/media/properties/john-dalton-st/04.jpg",
    "/media/properties/john-dalton-st/05.jpg",
  ],
  woodStreet: [
    "/media/properties/wood-street/01.jpeg",
    "/media/properties/wood-street/02.jpg",
    "/media/properties/wood-street/03.jpg",
  ],
  theCollective: [
    "/media/properties/the-collective/01.jpeg",
    "/media/properties/the-collective/02.jpeg",
    "/media/properties/the-collective/03.jpeg",
    "/media/properties/the-collective/04.jpeg",
    "/media/properties/the-collective/05.jpeg",
  ],
  ancoats: [
    "/media/properties/ancoats/01.jpeg",
    "/media/properties/ancoats/02.jpeg",
    "/media/properties/ancoats/03.jpeg",
    "/media/properties/ancoats/04.jpeg",
    "/media/properties/ancoats/05.jpeg",
  ],
  oldTrafford: [
    "/media/properties/old-trafford/01.jpeg",
    "/media/properties/old-trafford/02.jpeg",
    "/media/properties/old-trafford/03.jpeg",
  ],
} as const;

export const properties: Property[] = [
  {
    slug: "chambers",
    name: "Chambers Residence",
    area: "City Centre",
    eyebrow: "Featured Property",
    headline: "Character apartments in the centre of Manchester.",
    description:
      "Chapel Walks Chambers offers a collection of city-centre apartments with original character, lift access and fully equipped kitchens for short stays and longer visits.",
    quote: "Heritage architecture with a composed city-centre calm.",
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    imageSrc: mediaPaths.chambers[0],
    imageAlt: "Chapel Walks Chambers styled bedroom",
    gallery: [...mediaPaths.chambers],
    amenities: [
      "Central Manchester",
      "Fully equipped kitchen",
      "Smart TV",
      "Lift access",
      "Towels and bed linen",
      "Dishwasher",
      "Washing machine",
    ],
    units: [
      {
        slug: "chambers-apt-01",
        title: "Chambers Apt. 01",
        label: "Penthouse Suite",
        specs: "2 bedrooms / 2 bathrooms",
        squareFeet: "1,450 sq ft",
        description:
          "An elevated sanctuary blending quiet luxury with panoramic urban vistas, designed for the discerning few.",
      },
      {
        slug: "chambers-apt-02",
        title: "Chambers Apt. 02",
        label: "Executive Studio",
        specs: "1 bedroom / 1 bathroom",
        squareFeet: "720 sq ft",
        description:
          "A composed city studio with refined finishes, soft textures and a fully equipped kitchen for considered short stays.",
      },
      {
        slug: "chambers-apt-04",
        title: "Chambers Apt. 04",
        label: "Garden Terrace",
        specs: "2 bedrooms / terrace",
        squareFeet: "1,120 sq ft",
        description:
          "A calm residence with generous living space and a private terrace feel in the heart of Manchester.",
      },
      {
        slug: "chambers-apt-05",
        title: "Chambers Apt. 05",
        label: "Skyline View",
        specs: "2 bedrooms / 2 bathrooms",
        squareFeet: "1,180 sq ft",
        description:
          "A light-filled apartment with city outlooks, tactile furnishings and all the practical details required for longer stays.",
      },
      {
        slug: "chambers-apt-08",
        title: "Chambers Apt. 08",
        label: "Boutique Studio",
        specs: "1 bedroom / 1 bathroom",
        squareFeet: "690 sq ft",
        description:
          "A compact boutique apartment shaped around comfort, calm materials and an efficient city-centre footprint.",
      },
      {
        slug: "chambers-apt-10",
        title: "Chambers Apt. 10",
        label: "Grand Penthouse",
        specs: "3 bedrooms / 2 bathrooms",
        squareFeet: "1,680 sq ft",
        description:
          "A grand upper-floor residence with generous proportions, refined detailing and a strong sense of privacy.",
      },
    ],
    displayOrder: 1,
  },
  {
    slug: "john-dalton-st",
    name: "John Dalton Street",
    area: "Deansgate",
    eyebrow: "Heritage Collection",
    headline: "Unique city living a few doors from Manchester highlights.",
    description:
      "A central collection of John Dalton Street apartments with character, style and quick access to restaurants, bars and the city centre.",
    quote: "A masterclass in urban sanctuary.",
    maxGuests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 3,
    imageSrc: mediaPaths.johnDaltonSt[0],
    imageAlt: "John Dalton Street styled bedroom",
    gallery: [...mediaPaths.johnDaltonSt],
    amenities: [
      "Prime location",
      "Fully equipped kitchen",
      "Smart TV",
      "Luxury beds",
      "Egyptian cotton sheets",
      "Dishwasher",
      "Washing machine",
    ],
    units: [
      {
        slug: "john-dalton-st-loft",
        title: "Stylish Loft Conversion",
        label: "Central Loft",
        specs: "2 bedrooms / 1 bathroom",
        description:
          "A very central and unique living space just a few doors up from Panacea and The Restaurant Bar & Grill, close to everything Manchester has to offer.",
      },
      {
        slug: "john-dalton-st-deluxe",
        title: "Deluxe 5 Stars Bliss",
        label: "Victorian Conversion",
        specs: "2 bedrooms / 2 bathrooms",
        description:
          "A stunning Victorian conversion in the heart of the city, combining original features with luxury beds, Egyptian cotton sheets and a selection of pillows.",
      },
      {
        slug: "john-dalton-st-large-one-bed",
        title: "Large One Bed Conversion",
        label: "One Bedroom Residence",
        specs: "1 bedroom",
        description:
          "A characterful conversion with a fully equipped kitchen, Smart TV and city-centre convenience for guests who want the feel of home.",
      },
    ],
    displayOrder: 2,
  },
  {
    slug: "wood-street",
    name: "Wood Street",
    area: "City Centre",
    eyebrow: "Wood Street Collection",
    headline: "A stylish two-bedroom apartment close to Manchester life.",
    description:
      "Wood Street is a practical and polished two-bedroom apartment with a fully equipped kitchen, Smart TV and lift access for a convenient city stay.",
    quote: "Calm city-centre living with polished practical detail.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    imageSrc: mediaPaths.woodStreet[0],
    imageAlt: "Wood Street apartment bedroom",
    gallery: [...mediaPaths.woodStreet],
    amenities: [
      "Two bedrooms",
      "Two bathrooms",
      "Fully equipped kitchen",
      "Smart TV",
      "Lift access",
      "Towels and bed linen",
      "Dishwasher",
    ],
    units: [
      {
        slug: "wood-street-apt-01",
        title: "Wood Street Apt. 01",
        label: "Two Bedroom Residence",
        specs: "2 bedrooms / 2 bathrooms",
        squareFeet: "1,050 sq ft",
        description:
          "This apartment has two bedrooms, a wall mounted Smart TV and a fully equipped kitchen with dishwasher, microwave, washing machine, fridge and oven.",
      },
    ],
    displayOrder: 3,
  },
  {
    slug: "the-collective",
    name: "The Collective",
    area: "Manchester",
    eyebrow: "Curated Experiences",
    headline: "A connected city stay for professionals and creatives.",
    description:
      "The Collective offers a stylish, connected stay with access to workspaces and views of Manchester's historic skyline.",
    quote: "A sharper stay for work, city life and creative routine.",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    imageSrc: mediaPaths.theCollective[0],
    imageAlt: "The Collective apartment bedroom",
    gallery: [...mediaPaths.theCollective],
    amenities: [
      "Wi-Fi",
      "Private bathroom",
      "Full kitchen access",
      "Indoor coworking",
      "Outdoor coworking",
      "City views",
    ],
    units: [
      {
        slug: "the-collective-private-room",
        title: "Private room with city views",
        label: "City View Room",
        specs: "2 guests / 1 bedroom / 1 private bathroom",
        description:
          "Wi-Fi, access to a full kitchen, indoor and outdoor co-working spaces, and views of the city's historic skyline.",
      },
      {
        slug: "the-collective-bunkbed-room",
        title: "Bunkbed room",
        label: "Compact Stay",
        specs: "1 bunkbed / 1 private bathroom",
        description:
          "A compact option with private bathroom access for guests who want the location and shared workspace benefits of The Collective.",
      },
    ],
    displayOrder: 4,
  },
  {
    slug: "ancoats",
    name: "Ancoats",
    area: "Ancoats",
    eyebrow: "Ancoats District",
    headline: "Mill conversions and character apartments near Co-op Live.",
    description:
      "A selection of Ancoats apartments in red-brick mill conversions and city loft layouts, close to Co-op Live, Etihad Stadium and Manchester city centre.",
    quote: "Industrial roots, contemporary Manchester comfort.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    imageSrc: mediaPaths.ancoats[0],
    imageAlt: "Ancoats apartment living space",
    gallery: [...mediaPaths.ancoats],
    amenities: [
      "Ancoats location",
      "Near Co-op Live",
      "Near Etihad Stadium",
      "Canal-side walk",
      "Private parking options",
      "Fully equipped kitchen",
      "Smart TV",
    ],
    units: [
      {
        slug: "ancoats-red-brick-mill",
        title: "The Red Brick Mill",
        label: "Industrial Mill Conversion",
        specs: "4 guests / 1 bedroom / 2 beds / 1 bathroom",
        description:
          "Modern one-bedroom apartment in a red-brick industrial mill conversion with king-size bed, stylish design and private parking.",
      },
      {
        slug: "ancoats-luxury-loft",
        title: "Ancoats Luxury Loft",
        label: "Luxury Loft",
        specs: "4 guests / 2 bedrooms / 2 beds / 2 bathrooms",
        description:
          "Luxury two-bed apartment in a new mill conversion, around a 15-minute canal walk from Manchester city centre.",
      },
      {
        slug: "ancoats-city-loft-balcony",
        title: "City Loft 3 Bedrooms With Balcony",
        label: "Balcony Residence",
        specs: "2 bedrooms / balcony",
        description:
          "Large apartment with flat-screen TV, satellite channels and a fully equipped kitchen. The property offers access to a balcony with a view of Ancoats.",
      },
    ],
    displayOrder: 5,
  },
  {
    slug: "old-trafford",
    name: "Old Trafford",
    area: "Old Trafford",
    eyebrow: "Trafford Exclusives",
    headline: "A large two-bedroom stay with parking near Old Trafford.",
    description:
      "A delightful Old Trafford apartment with two bedrooms, two bathrooms, free parking and a fully equipped kitchen.",
    quote: "Space, parking and easy access to Manchester's sporting side.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    imageSrc: mediaPaths.oldTrafford[0],
    imageAlt: "Old Trafford apartment living space",
    gallery: [...mediaPaths.oldTrafford],
    amenities: [
      "Free parking",
      "Two bedrooms",
      "Two bathrooms",
      "Balcony",
      "Fully equipped kitchen",
      "Flat-screen TV",
      "Dishwasher",
    ],
    units: [
      {
        slug: "old-trafford-large-two-bed",
        title: "City Loft - Large Two Bed Two Bathroom & Free Parking",
        label: "Large Two Bedroom",
        specs: "2 bedrooms / 2 bathrooms / free parking",
        description:
          "Large apartment with flat-screen TV, satellite channels and a fully equipped kitchen with dishwasher, washing machine, fridge and oven.",
      },
    ],
    displayOrder: 6,
  },
];

export const orderedProperties = [...properties].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);

export function getPropertyBySlug(slug?: string) {
  if (!slug) return undefined;
  const normalized = slug === "5" ? "old-trafford" : slug;
  const numericIndex = Number(normalized);

  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return orderedProperties[numericIndex - 1];
  }

  return properties.find((property) => property.slug === normalized);
}

export function getUnitBySlug(slug?: string) {
  if (!slug) return undefined;
  const numericIndex = Number(slug);

  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    const chambers = getPropertyBySlug("chambers");
    const unit = chambers?.units[numericIndex - 1];
    return unit && chambers ? { property: chambers, unit } : undefined;
  }

  for (const property of properties) {
    const unit = property.units.find((item) => item.slug === slug);
    if (unit) return { property, unit };
  }

  return undefined;
}
