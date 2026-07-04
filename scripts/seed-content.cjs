/* Seed SiteContent with the current hardcoded values so the admin starts with
   real content (nothing lost). Idempotent upsert on key.
   Run:  node scripts/seed-content.cjs                                        */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const content = {
  // ── Home ──
  'home.hero.title': 'Experts In Short-Term Lettings',
  'home.hero.subtitle': 'The first choice for property rentals & hosting in Manchester.',
  'home.hero.ctaLabel': 'Explore Properties',
  'home.hero.ctaHref': '/properties',
  'home.map.title': 'Discover Our Locations',
  'home.stats': [
    { value: '30+', label: 'Properties' },
    { value: '500+', label: 'Guest Reviews' },
    { value: '100%', label: '5-Star Stays' },
    { value: '7', label: 'Neighbourhoods' },
  ],
  'home.testimonials': [
    { text: 'An absolute masterclass in luxury hosting. Every detail of the apartment was thoughtfully curated, from the linens to the local guide provided.', name: 'Emma T.', property: 'Chambers Residence' },
    { text: 'The perfect urban sanctuary. I travel often for work and this felt more like a boutique hotel than a rental. Exceptionally clean and beautifully designed.', name: 'James H.', property: 'John Dalton Street' },
    { text: 'We loved our stay in Ancoats. The team at MCRh made checking in seamless, and the property exceeded all expectations. Highly recommended.', name: 'Sarah M.', property: 'Ancoats Retreat' },
  ],

  // ── Contact ──
  'contact.intro': 'Whether you are looking to book an extended stay or discuss the management of your property, our team is at your disposal.',
  'contact.email': 'contact@mcrh.co.uk',
  'contact.phone': '',
  'contact.address': 'Chambers Building\nDeansgate\nManchester, M3 3EW\nUnited Kingdom',

  // ── Footer (links currently point to '#') ──
  'footer.links': [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Sustainability', href: '#' },
    { label: 'Careers', href: '#' },
  ],
  'footer.social': [],

  // ── Service / About page headers ──
  'design.hero.eyebrow': 'MCRh Studio',
  'design.hero.title': 'Interior Architecture & Design',
  'design.hero.paragraph': 'Crafting spaces that elevate the short-term rental experience. We design for longevity, functional elegance, and unforgettable guest impressions.',
  'management.hero.eyebrow': 'Complete Operations',
  'management.hero.title': 'Effortless Yield Management',
  'management.hero.paragraph': 'We handle every operational detail, from dynamic pricing algorithms to white-glove guest service, maximizing your return while liberating your time.',
  'about.hero.eyebrow': 'Our Story',
  'about.hero.title': 'Redefining urban hospitality through design and discretion.',
};

async function main() {
  const now = new Date().toISOString();
  const rows = Object.entries(content).map(([key, value]) => ({ key, value, updatedAt: now }));
  const { error } = await supabase.from('SiteContent').upsert(rows, { onConflict: 'key' });
  if (error) { console.error('Seed failed:', error.message); process.exit(1); }
  const { count } = await supabase.from('SiteContent').select('*', { count: 'exact', head: true });
  console.log(`Seeded ${rows.length} content keys. SiteContent now has ${count} rows.`);
}
main();
