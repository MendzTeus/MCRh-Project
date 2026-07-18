export type Review = {
  name: string;
  date: string;
  text: string;
  property?: string;
  avatarUrl?: string;
};

export const reviewsByProperty: Record<string, Review[]> = {
  chambers: [
    {
      name: 'Eleanor R.',
      date: 'March 2025',
      text: 'An absolute sanctuary in the middle of the city. The attention to detail in the design is remarkable, and the quietness of the space is exactly what we needed.',
      property: 'Chambers Residence',
    },
    {
      name: 'James T.',
      date: 'January 2025',
      text: 'Impeccable style and comfort. The location is perfect for exploring, yet retreating to this apartment felt like entering a private, luxury hotel.',
      property: 'Chambers Apt. 01',
    },
    {
      name: 'Sophia M.',
      date: 'November 2024',
      text: 'Every detail speaks of quality — from the linens to the lighting. A flawless stay. Highly recommended for design lovers.',
      property: 'Chambers Apt. 02',
    },
  ],
  'john-dalton-st': [
    {
      name: 'Oliver B.',
      date: 'February 2025',
      text: 'A stunning Victorian conversion right in the heart of Manchester. The original features combined with modern comforts made for a truly special stay.',
      property: 'John Dalton Street',
    },
    {
      name: 'Hannah L.',
      date: 'December 2024',
      text: 'Perfect location, beautifully designed. Checked in late and the process was seamless. Would absolutely return.',
      property: 'John Dalton Street',
    },
    {
      name: 'Marcus W.',
      date: 'October 2024',
      text: 'The loft conversion exceeded all expectations. Spacious, elegant and exceptionally clean. The best Airbnb I have stayed in across Europe.',
      property: 'Central Loft',
    },
  ],
  'wood-street': [
    {
      name: 'Priya S.',
      date: 'April 2025',
      text: 'Calm, well-equipped and brilliantly located. The two bedrooms were perfect for our group and the kitchen had everything we needed.',
      property: 'Wood Street',
    },
    {
      name: 'Tom H.',
      date: 'January 2025',
      text: 'A polished and practical apartment in a great spot. Lift access, fast Wi-Fi and a spotlessly clean space. Couldn\'t ask for more.',
      property: 'Wood Street',
    },
    {
      name: 'Rachel G.',
      date: 'November 2024',
      text: 'Stayed here for a work trip and was thoroughly impressed. Everything felt considered and high-quality. Definitely returning.',
      property: 'Wood Street',
    },
  ],
  ancoats: [
    {
      name: 'Liam C.',
      date: 'March 2025',
      text: 'Perfect spot for Co-op Live. The mill conversion is stunning — exposed brick, high ceilings and a beautifully designed interior.',
      property: 'Ancoats',
    },
    {
      name: 'Ava N.',
      date: 'February 2025',
      text: 'Loved the industrial character of the apartment. Ancoats is a brilliant neighbourhood and MCRh made the whole experience effortless.',
      property: 'Ancoats',
    },
    {
      name: 'Daniel F.',
      date: 'December 2024',
      text: 'Great apartment with private parking — a huge bonus in Manchester. Clean, stylish and the communication from the team was excellent.',
      property: 'Red Brick Mill',
    },
  ],
  'old-trafford': [
    {
      name: 'Sarah K.',
      date: 'April 2025',
      text: 'Spacious, clean and free parking — exactly what we needed for our trip to Old Trafford. The apartment is much nicer in person than the photos suggest.',
      property: 'Old Trafford',
    },
    {
      name: 'Ben A.',
      date: 'February 2025',
      text: 'Brilliant value for a large two-bed with parking. Easy check-in, well stocked kitchen and very comfortable beds. Highly recommended.',
      property: 'Old Trafford',
    },
    {
      name: 'Claire M.',
      date: 'January 2025',
      text: 'Exactly as described and more. The flat is generous in size, well equipped, and the location is convenient for the stadium and the tram.',
      property: 'Old Trafford',
    },
  ],
  'the-collective': [
    {
      name: 'Yuki T.',
      date: 'March 2025',
      text: 'The co-working space and city views made this the ideal spot for my remote working week. Private en-suite, great Wi-Fi and a friendly atmosphere.',
      property: 'The Collective',
    },
    {
      name: 'Finn O.',
      date: 'January 2025',
      text: 'A smart concept and a great execution. The private room was spotless and the shared outdoor workspace was a real highlight.',
      property: 'The Collective',
    },
    {
      name: 'Isabelle R.',
      date: 'November 2024',
      text: 'Stayed for ten days while on a contract. The kitchen access, fast internet and calm environment made working easy. Would book again without hesitation.',
      property: 'The Collective',
    },
  ],
};

export function getReviewsForProperty(propertySlug: string): Review[] {
  return reviewsByProperty[propertySlug] || reviewsByProperty['chambers'];
}
