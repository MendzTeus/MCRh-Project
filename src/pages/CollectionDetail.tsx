import { BedDouble, Bath, PersonStanding } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AvailabilityWidget from '../components/AvailabilityWidget';

export default function CollectionDetail() {
  const { id } = useParams();
  
  // In a real app, we'd fetch the collection details using the id.
  // For now, we'll hardcode the Chambers Residences layout requested by the user.

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <section 
        className="w-full h-[80vh] min-h-[600px] relative flex flex-col justify-end pb-margin-desktop px-margin-mobile md:px-margin-desktop bg-surface-dim border-b border-outline-variant/30"
      >
        <div className="absolute inset-0 z-0">
           <div className="w-full h-full bg-surface-variant"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto w-full">
          <span className="font-body text-label-caps text-secondary-container mb-4 block tracking-widest uppercase">Central Manchester</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 max-w-3xl leading-tight">Chambers Residence</h1>
          <p className="font-body text-body-lg text-white/80 max-w-2xl text-lg">A masterful blend of heritage architecture and contemporary restraint, offering unparalleled discretion in the city centre.</p>
        </div>
      </section>

      <AvailabilityWidget propertyName="Chambers Residence" />

      {/* Specs Row */}
      <section className="border-b border-outline-variant/30 py-6 mt-12 md:mt-16">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap gap-8 md:gap-16 justify-center md:justify-start">
          <div className="flex items-center gap-3">
            <PersonStanding className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">4 GUESTS</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">2 BEDROOMS</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">2 BEDS</span>
          </div>
          <div className="flex items-center gap-3">
            <Bath className="w-5 h-5 text-on-surface-variant" />
            <span className="font-body text-label-caps text-on-surface-variant tracking-widest uppercase">2 BATHROOMS</span>
          </div>
        </div>
      </section>

      {/* Long Description & collection grid */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
        <div className="mb-12">
          <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">The Collection</span>
          <h2 className="font-display text-headline-md md:text-display-lg text-primary">Chambers Residences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mt-12">
          {[
            { id: 1, title: 'Chambers Apt. 01', type: 'Penthouse Suite', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC6u3L8cK4i_3sD7g0zF1rI_7K-3t3K6o8Z3o7i1L3M7yP6U6r3N9T2pT8M5oK6k1N1p4F0H6u8C3zT5aK_1W6rD7W3A6H2n1bX4sK2U7gP4l8pC1oA2N8w6X5Z7T1p3P3aK_2M6qT2aC6S8W3N7xM5F9L7Z1N1N9R3xU5yA7P2L3mF8V6gT9H8mE6qX3' },
            { id: 2, title: 'Chambers Apt. 02', type: 'Executive Studio', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiS8hqmN56GtavRk261u6bb6biWbO6z0P7EpxertBBtmKcTIBaFBYbE2OHwiwiX-2IZpV8tVQu8iKf9nvliT3PuDWVDzoLxV0Wzzn_T9hY44dP3zXQGoIhmiMD2GVwjF_cGLQnW6_CL6z_1jUdynbqj6z3-2JIBD4i638yoNtA4jx60FzC9nnR1VUXz5VZC00aT2-L7qqJ84ej8-w8u8MTzSmkLEEah040wQqHLK_czcwx3nhZ4lDkzpTqsW62OmpMEkQq2xc_BEcH' },
            { id: 3, title: 'Chambers Apt. 04', type: 'Garden Terrace', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHr9p7U1b7iS32hO705Y7Y6K30uD_28J7kS5Z6U4X4hS3Y_N5A4Q5G0qX9B8Q54B3pE4C3K0Z2P0A9aL5B0jJ8T4I7Z0sK7Z9Q3oP6J4vL2sI7I3L9P9iS4sJ1M6H0oN1Z8mQ0Z4E7pP3A0_I3C5L8M9vN7G9K5L1A1I7oB5eA2F9N0pW2V9bA7T_8vX' },
            { id: 4, title: 'Chambers Apt. 05', type: 'Skyline View', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgbZ43WfT8e8z429X_Pj5c6Qd_4rG7T_gV3QJqL82_630lWz6z9y7Z32bO5i2Z2J6KvxrG0_7l7Hn3_2i7c77N1bU8W4ZlVx6UaZb5yU6_tU9b9w1T8S1XWbYc5m5G4sP046Zz2hXp03n1lM6X9z0YVz6l72a1M_m2w14xXwTb4zVp26eA0T8L7w0L0Bq1R40Q5sR27bU' },
            { id: 5, title: 'Chambers Apt. 08', type: 'Boutique Studio', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxlLEg8lk4BgzX4cCA1Oq5S9XZZXft4hXvnujwjyDD_V6d6g2lTpR3N1D0Os-4_ZqA-13GD7KtrKTbIpPD9Ozq19czYFwr-uFcn-Rr-CwErErucF8Tr2NYJ60XDle_dKEKz5amA52nj_EiSe_OfZ-tS_CICFNs_W_y8INg4PApSF9ehd6bWgaz-OzeZjQI6TsW4bNyBDyvq2hkwVqcGQcKSl-58COrglU6CysErcx7NVha_de8KjIdfXFL_vgTYHBWZ81v7-Xff-e3' },
            { id: 6, title: 'Chambers Apt. 10', type: 'Grand Penthouse', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC6u3L8cK4i_3sD7g0zF1rI_7K-3t3K6o8Z3o7i1L3M7yP6U6r3N9T2pT8M5oK6k1N1p4F0H6u8C3zT5aK_1W6rD7W3A6H2n1bX4sK2U7gP4l8pC1oA2N8w6X5Z7T1p3P3aK_2M6qT2aC6S8W3N7xM5F9L7Z1N1N9R3xU5yA7P2L3mF8V6gT9H8mE6qX3' },
          ].map((apt) => (
            <Link to={`/property/${apt.id}`} key={apt.id} className="group cursor-pointer block">
              <div className="aspect-[16/9] overflow-hidden rounded mb-4 bg-surface-dim">
                <div className="w-full h-full bg-surface-variant"></div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-display text-headline-sm text-primary">{apt.title}</h3>
                  <p className="font-body text-[10px] text-on-surface-variant tracking-widest uppercase">{apt.type}</p>
                </div>
                <span className="font-body text-label-caps text-primary border-b border-primary pb-1 group-hover:text-secondary group-hover:border-secondary transition-colors uppercase tracking-widest">
                  View Residence
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editor's Map Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto border-t border-outline-variant/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-7">
            <div className="aspect-[16/9] bg-surface-dim rounded-lg flex items-center justify-center overflow-hidden border border-outline-variant/30 relative">
               <div className="absolute inset-0 w-full h-full bg-surface-variant"></div>
               <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none"></div>
               <span className="font-body text-label-caps text-on-surface-variant/50 relative z-10 bg-surface/80 px-4 py-2 rounded">EDITORIAL MAP PLACEHOLDER</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <span className="font-body text-label-caps text-secondary mb-2 block tracking-widest uppercase">The Neighborhood</span>
            <h2 className="font-display text-headline-md md:text-display-lg text-primary mb-8">Prime Manchester</h2>
            
            <div className="space-y-6">
              {[
                { location: 'City Centre', time: '5 min walk' },
                { location: 'Deansgate Station', time: '8 min walk' },
                { location: 'Etihad Stadium', time: '12 min drive' },
                { location: 'Manchester Piccadilly', time: '15 min walk' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-outline-variant/30 pb-2">
                  <span className="font-body text-body-lg text-primary">{item.location}</span>
                  <span className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
