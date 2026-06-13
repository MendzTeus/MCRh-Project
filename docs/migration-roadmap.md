# MCRh React Migration Roadmap

This tracks what the new React/Vite design repo still needs to recover from
`MendzTeus/MCRh---Website` and `/root/.openclaw/MCRh Website/Fase de preparacao`.

## What the old repo had that the new repo was missing

- Data model for 6 properties: Chambers, John Dalton Street, Wood Street, The Collective, Ancoats, Old Trafford.
- Real media paths under `/media/properties/...`, served from `/var/www/mcrh/media`.
- Portuguese compatibility routes: `/propriedades`, `/propriedades/[slug]`, `/servicos/gestao`, `/servicos/design`, `/sobre`, `/contacto`.
- Dynamic property and unit pages instead of a hardcoded Chambers-only layout.
- iCal availability concept and the existing calendar sync roadmap.
- Contact/enquiry backend plan: validation, Turnstile, Resend, persistence.
- SEO plan: per-page metadata, structured data, sitemap, robots, OG images.
- Admin plan: auth, CRUD properties, media library, enquiries, iCal feeds.

## Completed in this React migration pass

- Scroll resets to top on every React Router page change.
- React routes now support both English and old Portuguese URL shapes.
- Property data was restored into `src/data/properties.ts`.
- Home and property index now render the 6-property portfolio from data.
- Collection pages now work for every property, not only Chambers.
- Unit detail pages now work from the property dataset.
- Production Nginx can serve `/media/...` from the existing VPS media volume.
- Docker deployment files are part of the repo.

## Next implementation phases

### Phase 1 - Finish public content parity

- Replace remaining AI Studio copy in About, Design Services, Management Services and Contact with text from `mcrh_content.json`.
- Align labels and route naming with the old site where needed.
- Add missing unit records from the scraped JSON where the old data is still more granular than this first React dataset.
- Fix contact details to match the source content and final business email.

### Phase 2 - Booking and enquiry flow

- Build real contact forms for lettings, property management and general enquiries.
- Add property pre-selection from "Book With MCRh" CTAs.
- Add validation with `zod`.
- Add Turnstile before production form submission.
- Add API/server layer for Resend email and enquiry persistence.

### Phase 3 - Availability

- Reintroduce the availability calendar from the old Next implementation.
- Decide whether React should call a backend API or whether availability remains in a separate service.
- Wire the existing iCal sync feeds for Chambers, Ancoats, Old Trafford and other properties.
- Add states for available, blocked, loading and feed error.

### Phase 4 - SEO and production polish

- Replace the generic Vite title with MCRh metadata.
- Add per-route title/description handling.
- Add `sitemap.xml`, `robots.txt`, OG images and structured data.
- Audit all image alt text and page headings.
- Add analytics and Sentry.

### Phase 5 - Admin

- Decide whether the admin should remain Next/Prisma or be rebuilt behind this React frontend.
- Add auth, property CRUD, media management, content editing and enquiry listing.
- Add preview/publish workflow before editing live content.

## Known risks

- The new app is a static SPA today; backend features from the old roadmap need a backend before they can be restored.
- `/media/...` depends on the Docker service keeping the `/var/www/mcrh/media` bind mount.
- The old roadmap expected Next.js, Prisma and Neon. The new repo changed stack direction, so database/admin work needs an explicit architecture decision before implementation.
