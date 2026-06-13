import { Star, ChevronDown, BedDouble, Wifi, ChefHat, Coffee, Snowflake, Bath, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PropertyDetail() {
  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative w-full h-[819px] md:h-[921px] flex items-end pb-section-gap">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <div className="w-full h-full bg-surface-variant"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-end gap-gutter">
          <div className="text-white w-full md:w-2/3">
            <p className="font-body text-label-caps tracking-widest mb-4 opacity-80 uppercase">Penthouse Collection</p>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">Chambers Apt. 01</h1>
            <p className="font-body text-body-lg opacity-90 max-w-2xl">A sanctuary of quiet luxury high above the city. Impeccable design meets ultimate comfort in this exclusive residence.</p>
          </div>
          
          <div className="w-full md:w-1/3 bg-surface p-8 rounded-xl shadow-2xl translate-y-1/2 md:translate-y-1/4 backdrop-blur-md bg-opacity-95 border border-outline-variant/20">
            <div className="flex justify-end items-center mb-6 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <Star className="w-4 h-4 fill-current text-secondary" />
                <span className="font-body text-body-md font-semibold">4.98</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-px bg-outline-variant/30 border border-outline-variant/30 rounded-lg mb-6 overflow-hidden">
              <div className="bg-surface p-3 cursor-pointer hover:bg-surface-container transition-colors">
                <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Check-in</div>
                <div className="font-body text-body-md text-primary">Add date</div>
              </div>
              <div className="bg-surface p-3 cursor-pointer hover:bg-surface-container transition-colors">
                <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Check-out</div>
                <div className="font-body text-body-md text-primary">Add date</div>
              </div>
              <div className="bg-surface p-3 col-span-2 cursor-pointer hover:bg-surface-container transition-colors flex justify-between items-center">
                <div>
                  <div className="font-body text-[10px] font-semibold text-on-surface-variant mb-1 uppercase">Guests</div>
                  <div className="font-body text-body-md text-primary">2 guests</div>
                </div>
                <ChevronDown className="w-5 h-5 text-on-surface-variant" />
              </div>
            </div>
            
            <button className="w-full py-4 bg-primary text-on-primary font-body text-label-caps tracking-widest hover:opacity-90 transition-opacity uppercase rounded">
              Reserve Now
            </button>
            <p className="text-center font-body text-sm text-on-surface-variant mt-4">You won't be charged yet</p>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter mt-16 md:mt-24">
        <div className="md:col-span-7 space-y-12">
          <div>
            <h2 className="font-display text-headline-md text-primary mb-6">The Space</h2>
            <div className="font-body text-on-surface-variant text-body-lg space-y-6">
              <p>Designed for the discerning traveler, Chambers Apt. 01 offers an unparalleled experience in the heart of Manchester. Every detail has been meticulously curated, from the bespoke Italian furnishings to the subtle ambient lighting that creates a calming atmosphere the moment you step inside.</p>
              <p>The open-plan living area is framed by expansive windows, offering dramatic city views while maintaining a sense of profound privacy and quiet luxury. It's a space designed not just for staying, but for dwelling deeply.</p>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/30 pt-12">
            <h3 className="font-display text-headline-sm text-primary mb-8">Curated Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              {[
                { icon: BedDouble, label: "Premium King Bed" },
                { icon: Wifi, label: "High-Speed Wi-Fi" },
                { icon: ChefHat, label: "Chef's Kitchen" },
                { icon: Coffee, label: "Nespresso Machine" },
                { icon: Snowflake, label: "Climate Control" },
                { icon: Bath, label: "Freestanding Tub" }
              ].map((amenity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <amenity.icon className="w-8 h-8 text-on-surface-variant font-light" strokeWidth={1} />
                  <span className="font-body text-body-lg text-on-surface">{amenity.label}</span>
                </div>
              ))}
            </div>
            
            <button className="mt-10 px-6 py-3 border border-outline-variant text-on-surface font-body text-label-caps tracking-widest hover:border-primary transition-colors duration-300 uppercase">
              Show All Amenities
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-display text-headline-md text-primary mb-12">Visual Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 h-[614px] md:h-[819px]">
          <div className="md:col-span-2 h-full rounded-xl overflow-hidden relative group">
            <div className="w-full h-full bg-surface-variant"></div>
          </div>
          <div className="hidden md:grid grid-rows-3 gap-4 h-full">
            <div className="rounded-xl overflow-hidden relative group h-full">
              <div className="w-full h-full bg-surface-variant"></div>
            </div>
            <div className="rounded-xl overflow-hidden relative group h-full">
              <div className="w-full h-full bg-surface-variant"></div>
            </div>
            <div className="rounded-xl overflow-hidden relative group h-full">
              <div className="w-full h-full bg-surface-variant"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="flex items-center gap-2 text-primary font-body text-label-caps tracking-widest hover:opacity-70 transition-opacity uppercase">
            View Gallery <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
      
      {/* Reviews Slider */}
      <section className="bg-surface-container-low py-section-gap">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-headline-md text-primary mb-2">Guest Reflections</h2>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Star className="w-4 h-4 fill-current text-secondary" />
                <span className="font-body text-body-lg">4.98 • 124 reviews</span>
              </div>
            </div>
            <div className="hidden md:flex gap-4">
              <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:bg-surface-container transition-all">
                <ArrowLeft className="w-6 h-6 text-primary" />
              </button>
              <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:bg-surface-container transition-all">
                <ArrowRight className="w-6 h-6 text-primary" />
              </button>
            </div>
          </div>
          
          <div className="flex overflow-x-auto gap-gutter pb-8 snap-x snap-mandatory hide-scrollbar">
            {[
              {
                name: "Eleanor R.",
                date: "October 2023",
                text: "An absolute sanctuary in the middle of the city. The attention to detail in the design is remarkable, and the quietness of the space is exactly what we needed.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4bDrGxI5f-RRIx9UWtoX4F5q9R_gHCluoswVEgqHS49MGlAgzihW5WJoe53JyeUAgSwApBiIlo4ZInNq-n0ncE_xEKiDB8Iia36b-W_3OXEs4L9a3BJSP83MQgCzCODIoyqbkE_kBJLKbqK2UmY8qGsA8-puYIjcUYIdEJpbzY4dd3O-aG1YAF9zqJoB7NQ4SOOkfYzYIc3H_3-YlPFQA-4tbiwDf5bq8VbC_VP7ARxngbV8FTh5fPKo0GD7jXsmUS_Pp9Lsp1mWb"
              },
              {
                name: "James T.",
                date: "September 2023",
                text: "Impeccable style and comfort. The location is perfect for exploring, yet retreating to this apartment felt like entering a private, luxury hotel.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBxq-w_tIL4dLo4nVLVwlD0zsDBlkzaTHnONMMs-WvKRsh2XVw2ZWkyOtBKELXkzXuG1Y2ck9xJ4Vjx2khaI0csXbb237X89wHbzEw-bMf4TfrYhk6CPv3RR0-gueHcG1IjIYJveT_dWbrg1D1DpGfgUcJC4CQMHuEGcwOEf5EbUGWb7qsnFbvmHTOhMRgaUTvgRoIkaI6_R83bLu2T_IlJ9ylufVIRS9GRCHV8Z2ahPO5WEJGWvEuW_V65Bpf-Yu-7lj9Ch7wuqFI"
              },
              {
                name: "Sophia M.",
                date: "August 2023",
                text: "Every element of Chambers 01 speaks of quality. From the linens to the lighting, it was a flawless stay. Highly recommended for design lovers.",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuByC1kjB0y4mdVhqrkp4s0eQeE4LgA_aeEGm30bKW_xKhigDWhomo2XjGIR_-Ou_bYCF5lIMRLf8QOUVLqF6Redd5kPoe3EuJnxFAZn5Wz54Rq6ph_Ci805798SyFws43Q1a0Lki8P3cKt_9tghrV4-abx-lsq1KuqQITcattZGD1t_seVeQCFfggA0FZLcf07NVFCmetcCUOvF5iqyCe_XyxjyHyNAHXwpdozcUZUOnUpMB69P_Vv-4GIxEq7N13HhiyojrJnT57zD"
              }
            ].map((review, i) => (
              <div key={i} className="min-w-[300px] md:min-w-[400px] bg-surface p-8 rounded-xl border border-outline-variant/20 snap-start">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-surface-variant overflow-hidden">
                    <div className="w-full h-full bg-surface-variant"></div>
                  </div>
                  <div>
                    <h4 className="font-body text-body-lg font-semibold text-primary">{review.name}</h4>
                    <p className="font-body text-sm text-on-surface-variant">{review.date}</p>
                  </div>
                </div>
                <p className="font-display text-quote text-on-surface italic opacity-90">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Location Map */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-display text-headline-md text-primary mb-12">The Neighborhood</h2>
        <div className="rounded-xl overflow-hidden h-[500px] relative border border-outline-variant/20">
          <div className="w-full h-full bg-surface-variant"></div>
          {/* Stylized Map Markers */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
            <div className="mt-2 bg-surface px-4 py-2 rounded-lg shadow-lg border border-outline-variant/20">
              <span className="font-body text-label-caps text-primary tracking-widest uppercase font-semibold">Chambers Apt. 01</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div>
            <h4 className="font-display text-headline-sm text-primary mb-2">Deansgate</h4>
            <p className="font-body text-body-md text-on-surface-variant">5 minute walk</p>
          </div>
          <div>
            <h4 className="font-display text-headline-sm text-primary mb-2">Spinningfields</h4>
            <p className="font-body text-body-md text-on-surface-variant">8 minute walk</p>
          </div>
          <div>
            <h4 className="font-display text-headline-sm text-primary mb-2">Victoria Station</h4>
            <p className="font-body text-body-md text-on-surface-variant">12 minute walk</p>
          </div>
        </div>
      </section>
    </div>
  );
}
