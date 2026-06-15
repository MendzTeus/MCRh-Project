export type PropertyUnit = {
  slug: string;
  title: string;
  label: string;
  specs: string;
  squareFeet?: string;
  description: string;
};

export type NearbyPlace = {
  location: string;
  time: string;
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
  distances: NearbyPlace[];
  neighborhoodTitle: string;
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
    neighborhoodTitle: 'Chapel Walks, City Centre',
    distances: [
      { location: 'Deansgate Station', time: '4 min walk' },
      { location: 'Exchange Square', time: '6 min walk' },
      { location: 'Manchester Piccadilly', time: '18 min walk' },
      { location: 'Manchester Airport', time: '25 min by tram' },
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
    neighborhoodTitle: 'Deansgate & Spinningfields',
    distances: [
      { location: 'Deansgate Station', time: '3 min walk' },
      { location: 'Spinningfields', time: '5 min walk' },
      { location: 'Manchester Arndale', time: '10 min walk' },
      { location: 'Manchester Piccadilly', time: '20 min walk' },
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
    neighborhoodTitle: 'Wood Street, City Centre',
    distances: [
      { location: 'Deansgate Station', time: '5 min walk' },
      { location: 'St Peter\'s Square', time: '7 min walk' },
      { location: 'Northern Quarter', time: '12 min walk' },
      { location: 'Manchester Piccadilly', time: '16 min walk' },
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
    neighborhoodTitle: 'Wood Street & Northern Quarter',
    distances: [
      { location: 'Deansgate Station', time: '5 min walk' },
      { location: 'Manchester Arndale', time: '10 min walk' },
      { location: 'Northern Quarter', time: '10 min walk' },
      { location: 'Manchester Piccadilly', time: '15 min walk' },
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
    neighborhoodTitle: 'Ancoats & New Islington',
    distances: [
      { location: 'Co-op Live', time: '10 min walk' },
      { location: 'Northern Quarter', time: '12 min walk' },
      { location: 'Manchester Piccadilly', time: '15 min walk' },
      { location: 'Etihad Stadium', time: '15 min walk' },
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
    neighborhoodTitle: 'Old Trafford, Trafford',
    distances: [
      { location: 'Old Trafford Stadium', time: '10 min walk' },
      { location: 'Old Trafford Tram Stop', time: '8 min walk' },
      { location: 'Manchester City Centre', time: '20 min by tram' },
      { location: 'Manchester Airport', time: '30 min by tram' },
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
  {
    slug: "loom-street",
    name: "Loom Street",
    area: "Ancoats",
    eyebrow: "Ancoats District",
    headline: "Red-brick mill conversion apartments in creative Ancoats.",
    description:
      "Loom Street offers stylish apartments inside a restored red-brick mill conversion, combining exposed brick, high ceilings and modern interiors in one of Manchester's most sought-after creative neighbourhoods.",
    quote: "Industrial roots, considered contemporary living.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/01.jpeg",
    imageAlt: "Loom Street Ancoats apartment interior",
    gallery: [
      "/media/properties/ancoats/01.jpeg",
      "/media/properties/ancoats/02.jpeg",
      "/media/properties/ancoats/03.jpeg",
    ],
    amenities: [
      "Ancoats location",
      "Mill conversion character",
      "Fully equipped kitchen",
      "Smart TV",
      "Near Co-op Live",
      "Fast Wi-Fi",
    ],
    neighborhoodTitle: "Loom Street, Ancoats",
    distances: [
      { location: "Northern Quarter", time: "8 min walk" },
      { location: "Manchester Piccadilly", time: "12 min walk" },
      { location: "Co-op Live", time: "15 min walk" },
      { location: "City Centre", time: "18 min walk" },
    ],
    units: [
      {
        slug: "mill-conversion-8",
        title: "Apartment 8",
        label: "Mill Conversion",
        specs: "2 bedrooms / 1 bathroom",
        description: "A modern apartment inside a red-brick Ancoats mill conversion with stylish interiors and fast Wi-Fi.",
      },
      {
        slug: "mill-conversion-3",
        title: "Apartment 3",
        label: "Mill Conversion",
        specs: "2 bedrooms / 1 bathroom",
        description: "A light-filled apartment in a converted Ancoats mill with a fully equipped kitchen and easy city access.",
      },
    ],
    displayOrder: 7,
  },
  {
    slug: "newton-street",
    name: "Newton Street",
    area: "Northern Quarter",
    eyebrow: "Northern Quarter",
    headline: "Loft living in the heart of Manchester's Northern Quarter.",
    description:
      "Newton Street puts you steps from the Northern Quarter's independent bars, coffee shops and creative studios, in a characterful loft conversion apartment with a spacious open-plan layout.",
    quote: "The city's creative pulse, right outside your door.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/02.jpeg",
    imageAlt: "Newton Street loft apartment Manchester",
    gallery: [
      "/media/properties/ancoats/02.jpeg",
      "/media/properties/ancoats/03.jpeg",
      "/media/properties/ancoats/04.jpeg",
    ],
    amenities: [
      "Northern Quarter location",
      "Loft conversion character",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Piccadilly station",
    ],
    neighborhoodTitle: "Northern Quarter",
    distances: [
      { location: "Northern Quarter", time: "3 min walk" },
      { location: "Manchester Arndale", time: "5 min walk" },
      { location: "Manchester Piccadilly", time: "8 min walk" },
      { location: "Deansgate", time: "15 min walk" },
    ],
    units: [
      {
        slug: "21-loft-conversion",
        title: "Apartment 21",
        label: "Loft Conversion",
        specs: "2 bedrooms / 1 bathroom",
        description: "A generous loft conversion apartment in the Northern Quarter with open-plan living and a prime location for exploring Manchester.",
      },
    ],
    displayOrder: 8,
  },
  {
    slug: "lockgate-mews",
    name: "Lockgate Mews",
    area: "New Islington",
    eyebrow: "New Islington",
    headline: "Contemporary canal-side living in New Islington.",
    description:
      "Lockgate Mews sits within New Islington's regenerated marina district, offering modern apartment living alongside Manchester's historic canal network with easy access to both Ancoats and the city centre.",
    quote: "Calm water views, vibrant neighbourhood.",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/03.jpeg",
    imageAlt: "Lockgate Mews New Islington apartment",
    gallery: [
      "/media/properties/ancoats/03.jpeg",
      "/media/properties/ancoats/04.jpeg",
      "/media/properties/ancoats/05.jpeg",
    ],
    amenities: [
      "New Islington location",
      "Canal-side setting",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Ancoats",
    ],
    neighborhoodTitle: "New Islington, Ancoats",
    distances: [
      { location: "Ancoats", time: "5 min walk" },
      { location: "Co-op Live", time: "12 min walk" },
      { location: "Manchester Piccadilly", time: "18 min walk" },
      { location: "Northern Quarter", time: "15 min walk" },
    ],
    units: [
      {
        slug: "lockgate-504",
        title: "Apartment 504",
        label: "Canal View",
        specs: "1 bedroom / 1 bathroom",
        description: "A contemporary one-bedroom apartment in New Islington's marina development, with easy access to Ancoats restaurants and city centre transport.",
      },
    ],
    displayOrder: 9,
  },
  {
    slug: "sezas",
    name: "Seza's",
    area: "Ancoats",
    eyebrow: "Ancoats District",
    headline: "Characterful Ancoats apartment with a personal touch.",
    description:
      "Seza's is a distinctive Ancoats apartment blending industrial heritage with warm, considered interiors — a home-away-from-home in one of Manchester's most vibrant neighbourhoods.",
    quote: "Warm character in the heart of Ancoats.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/04.jpeg",
    imageAlt: "Seza's Ancoats apartment interior",
    gallery: [
      "/media/properties/ancoats/04.jpeg",
      "/media/properties/ancoats/05.jpeg",
      "/media/properties/ancoats/01.jpeg",
    ],
    amenities: [
      "Ancoats location",
      "Characterful interiors",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Co-op Live",
    ],
    neighborhoodTitle: "Ancoats",
    distances: [
      { location: "Northern Quarter", time: "10 min walk" },
      { location: "Co-op Live", time: "12 min walk" },
      { location: "Manchester Piccadilly", time: "14 min walk" },
      { location: "City Centre", time: "16 min walk" },
    ],
    units: [
      {
        slug: "sezas-conversion",
        title: "Apartment 15",
        label: "Conversion Apartment",
        specs: "2 bedrooms / 1 bathroom",
        description: "A warm and characterful apartment in Ancoats with a fully equipped kitchen, comfortable living space and easy access to Manchester's best dining.",
      },
    ],
    displayOrder: 10,
  },
  {
    slug: "crusader",
    name: "Crusader",
    area: "Northern Quarter",
    eyebrow: "Northern Quarter",
    headline: "Historic mill conversion minutes from Manchester Piccadilly.",
    description:
      "Crusader is a characterful mill conversion apartment in the Northern Quarter, offering a strong sense of history alongside modern comforts and an unbeatable central location.",
    quote: "Manchester history, modern comfort.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/05.jpeg",
    imageAlt: "Crusader mill conversion apartment Manchester",
    gallery: [
      "/media/properties/ancoats/05.jpeg",
      "/media/properties/ancoats/01.jpeg",
      "/media/properties/ancoats/02.jpeg",
    ],
    amenities: [
      "Northern Quarter location",
      "Mill conversion character",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Piccadilly",
    ],
    neighborhoodTitle: "Northern Quarter & Piccadilly",
    distances: [
      { location: "Northern Quarter", time: "4 min walk" },
      { location: "Manchester Piccadilly", time: "7 min walk" },
      { location: "Manchester Arndale", time: "8 min walk" },
      { location: "Deansgate", time: "15 min walk" },
    ],
    units: [
      {
        slug: "mill-conversion-6",
        title: "Apartment 6",
        label: "Mill Conversion",
        specs: "2 bedrooms / 1 bathroom",
        description: "A characterful mill conversion apartment in the Northern Quarter with exposed brick details, modern kitchen and a prime city-centre location.",
      },
    ],
    displayOrder: 11,
  },
  {
    slug: "mm2",
    name: "MM2",
    area: "Ancoats",
    eyebrow: "Ancoats District",
    headline: "Modern Ancoats apartments with direct canal access.",
    description:
      "MM2 offers two bright, modern apartments in a contemporary Ancoats development — ideal for professionals and couples seeking a well-connected Manchester base with access to the city's best independent food and drink scene.",
    quote: "Modern living, Ancoats spirit.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    imageSrc: "/media/properties/ancoats/01.jpeg",
    imageAlt: "MM2 Ancoats apartment interior",
    gallery: [
      "/media/properties/ancoats/01.jpeg",
      "/media/properties/ancoats/02.jpeg",
      "/media/properties/ancoats/03.jpeg",
    ],
    amenities: [
      "Ancoats location",
      "Contemporary design",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Northern Quarter",
    ],
    neighborhoodTitle: "Ancoats & New Islington",
    distances: [
      { location: "Northern Quarter", time: "10 min walk" },
      { location: "Co-op Live", time: "12 min walk" },
      { location: "Manchester Piccadilly", time: "15 min walk" },
      { location: "City Centre", time: "18 min walk" },
    ],
    units: [
      {
        slug: "ancoats-14",
        title: "Apartment 14",
        label: "Contemporary Apartment",
        specs: "2 bedrooms / 2 bathrooms",
        description: "A bright modern apartment in MM2 Ancoats with open-plan kitchen-living, two bedrooms and fast Wi-Fi.",
      },
      {
        slug: "ancoats-15",
        title: "Apartment 15",
        label: "Contemporary Apartment",
        specs: "2 bedrooms / 2 bathrooms",
        description: "A well-appointed Ancoats apartment with contemporary finishes, fully equipped kitchen and easy access to the Northern Quarter.",
      },
    ],
    displayOrder: 12,
  },
  {
    slug: "spinning-mills",
    name: "Spinning Mills",
    area: "Miles Platting",
    eyebrow: "East Manchester",
    headline: "Authentic red-brick mill conversion near Co-op Live.",
    description:
      "Spinning Mills occupies a striking Victorian red-brick mill in East Manchester, offering two distinctive apartments with exposed timber, original brickwork and straightforward access to Co-op Live and Etihad Stadium.",
    quote: "Manchester's mill heritage, authentically preserved.",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/02.jpeg",
    imageAlt: "Spinning Mills red-brick mill apartment Manchester",
    gallery: [
      "/media/properties/ancoats/02.jpeg",
      "/media/properties/ancoats/03.jpeg",
      "/media/properties/ancoats/04.jpeg",
    ],
    amenities: [
      "Red-brick mill conversion",
      "Near Co-op Live",
      "Near Etihad Stadium",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
    ],
    neighborhoodTitle: "Miles Platting, East Manchester",
    distances: [
      { location: "Co-op Live", time: "8 min walk" },
      { location: "Etihad Stadium", time: "10 min walk" },
      { location: "Manchester Piccadilly", time: "20 min walk" },
      { location: "City Centre", time: "25 min walk" },
    ],
    units: [
      {
        slug: "redbrick-mill-2",
        title: "Apartment 212",
        label: "Red-Brick Mill",
        specs: "2 bedrooms / 1 bathroom",
        description: "A characterful apartment inside a Victorian spinning mill with exposed brick walls, high ceilings and easy access to Co-op Live and the Etihad.",
      },
      {
        slug: "redbrick-mill-4",
        title: "Apartment 406",
        label: "Red-Brick Mill",
        specs: "2 bedrooms / 1 bathroom",
        description: "A generous upper-floor apartment in a converted red-brick mill, offering a quiet residential feel close to Manchester's major live music venue.",
      },
    ],
    displayOrder: 13,
  },
  {
    slug: "popworks",
    name: "PopWorks",
    area: "Ancoats",
    eyebrow: "Ancoats District",
    headline: "Design-led apartment in contemporary Ancoats.",
    description:
      "PopWorks is a design-conscious apartment in a new Ancoats development, combining clean modern lines with proximity to the area's galleries, independent coffee shops and acclaimed restaurants.",
    quote: "Considered design, creative neighbourhood.",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    imageSrc: "/media/properties/ancoats/03.jpeg",
    imageAlt: "PopWorks Ancoats apartment interior",
    gallery: [
      "/media/properties/ancoats/03.jpeg",
      "/media/properties/ancoats/04.jpeg",
      "/media/properties/ancoats/05.jpeg",
    ],
    amenities: [
      "Ancoats location",
      "Design-led interiors",
      "Fully equipped kitchen",
      "Smart TV",
      "Fast Wi-Fi",
      "Near Northern Quarter",
    ],
    neighborhoodTitle: "Ancoats",
    distances: [
      { location: "Ancoats", time: "5 min walk" },
      { location: "Northern Quarter", time: "10 min walk" },
      { location: "Co-op Live", time: "12 min walk" },
      { location: "Manchester Piccadilly", time: "15 min walk" },
    ],
    units: [
      {
        slug: "ancoats-pop-5",
        title: "Apartment 5",
        label: "Design Apartment",
        specs: "1 bedroom / 1 bathroom",
        description: "A design-led one-bedroom apartment in PopWorks Ancoats with clean modern interiors, fully equipped kitchen and a prime location for exploring the neighbourhood.",
      },
    ],
    displayOrder: 14,
  },
];

export const orderedProperties = [...properties].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);

export function getPropertyBySlug(slug?: string) {
  if (!slug) return undefined;
  const legacyCollectionIds: Record<string, string> = {
    "1": "chambers",
    "2": "john-dalton-st",
    "3": "wood-street",
    "4": "ancoats",
    "5": "old-trafford",
    "6": "the-collective",
  };
  const normalized = legacyCollectionIds[slug] || slug;
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
