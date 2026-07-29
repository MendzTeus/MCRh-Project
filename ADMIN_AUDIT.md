# MCRh Admin UX and Code-Structure Audit

**Scope:** React admin routes under `/admin`, their shared components/hooks, and the authenticated Express endpoints they call.
**Method:** Static, read-only review of the current workspace. No application code was changed.
**Primary user:** A small operations team managing roughly 40 short-let apartments.
**Design constraint:** Retain the dark navy sidebar, serif display headings, gold accents, and quiet-luxury visual character.

## Executive summary

The admin is already part-way through the right redesign, but currently exposes both the old and new systems at once:

- `/admin` is a 2,244-line monolith containing ten state-driven sections, including an apartments table whose rows can expand into the original full `UnitCard`.
- `/admin/apartments` is a second, compact apartments list.
- `/admin/apartments/:unitSlug` is a dedicated, tabbed apartment editor.
- Dashboard, apartments, reviews, and leads also have newer standalone pages, while their older equivalents remain inside `/admin`.

This creates two information architectures and several sources of truth. A sidebar click from a standalone page often navigates to `/admin` but cannot specify the intended internal tab, so it lands on the old dashboard instead. The newer apartment list is visually much closer to the desired browse/scan experience, but several controls are currently decorative or broken: selected rows have no bulk action, the occupancy filter does not filter, header sorting is not interactive, “Add Apartment” has no creation flow, and delete calls an endpoint the server does not implement.

The recommended model is:

1. Make `/admin/apartments` the single scan-and-operate view.
2. Keep quick visibility and featured controls in compact rows.
3. Send content, specifications, links, booking feeds, SEO, notes, and photo management to `/admin/apartments/:unitSlug`.
4. Give every first-level sidebar destination a real route.
5. Retire the stateful `/admin` monolith after its remaining sections are extracted.

For this team and dataset, a full-page detail editor is preferable to a modal or drawer. The editor already has eight meaningful tabs, photo workflows, and long text fields; a drawer would be cramped and a modal would obscure context. Compact rows plus a routed detail page give fast scanning, browser history/deep links, safe long-form editing, and room for photo reordering.

## 1. Current structure

### 1.1 Route inventory

Routes are declared in `src/App.tsx`.

| Route | Page | Purpose and current behaviour | Main components | API reads | Mutations |
|---|---|---|---|---|---|
| `/admin` | `src/pages/Admin.tsx` | Legacy/stateful admin shell. Defaults to **Painel** and internally switches among Dashboard, Apartments, Photos, Images, Content, Properties, Reviews, Availability, Leads, and Collector without changing the URL. Its apartments section is now a compact table, but expanding a row renders the complete legacy `UnitCard`. | `AdminShell`, local `Login`, `DashboardTab`, `UnitCard`, `PhotoTile`, `PhotosTab`, `ImagesTab`, `ContentTab`, `PropertiesTab`, `ReviewsTab`, `LeadsTab`, `AvailabilityTab`, `CollectorTab`, `ConfirmDialog` | `GET /api/admin/units`, `GET /api/admin/site`; section-specific reads listed below | Most admin mutations; section-specific calls listed below |
| `/admin/dashboard` | `src/pages/AdminDashboard.tsx` | New standalone dashboard with counts, recent reviews/leads and an occupancy chart. The chart uses hard-coded `CHART_POINTS`, so it is presentation rather than live occupancy reporting. | `AdminShell`, local `Login`, `StatCard`, `OccupancyChart`, `Stars` | `GET /api/admin/units`, `GET /api/admin/reviews`, `GET /api/admin/leads` | None |
| `/admin/apartments` | `src/pages/AdminApartmentsList.tsx` | New compact apartment table with search, building and visibility filters, pagination, row selection, visibility toggle, status badge, public/edit/delete actions. Occupancy filter, bulk selection, header sorting, add, and delete are incomplete or non-functional. | `AdminShell`, local `Login`, `VisiBadge`, `VisiToggle`, `Pagination` | `GET /api/admin/units` | `PATCH /api/admin/units/:unitSlug`; attempts `DELETE /api/admin/units/:unitSlug` (server route absent) |
| `/admin/apartments/:unitSlug` | `src/pages/AdminApartment.tsx` | New routed editor with tabs for Summary, Content, Rooms, Photos, Photo Tour, Reviews, Booking, and Settings. Most text/number fields save on blur; toggles save immediately; photo order has explicit saves in relevant workflows. | `AdminShell`, `useAutosave`, `useUnsavedChangesGuard`, local `SaveStatus`, `DragTile`, eight local tab components | `GET /api/admin/units/:unitSlug`; `GET /api/admin/reviews?property=:unitSlug` | `PATCH /api/admin/units/:unitSlug`; photo upload/edit/reorder/reference mutations; review create/edit/delete |
| `/admin/reviews` | `src/pages/AdminReviews.tsx` | New global reviews table with search and property/rating/source/visibility filters, publish/hide, delete, and link to an apartment editor. | `AdminShell`, local `Login`, `Stars`, `SourceBadge`, `Avatar` | `GET /api/admin/reviews` | `PATCH /api/admin/reviews/:id`, `DELETE /api/admin/reviews/:id` |
| `/admin/leads` | `src/pages/AdminLeads.tsx` | New leads list with search/status filters, summary counts, and a detail drawer. Status is updated optimistically. | `AdminShell`, local `Login`, `StatusBadge`, `StatCard`, `DetailPanel` | `GET /api/admin/leads` | `PATCH /api/admin/leads/:id` |

There is no admin wildcard route. An unknown `/admin/...` URL therefore renders no admin page instead of a not-found or redirect.

### 1.2 Internal sections still hosted by `/admin`

These are pages from the user’s point of view, but they are not routes and cannot be deep-linked, bookmarked, restored on refresh, or reliably targeted from another route.

| Internal section | What it does | Components/state | API calls |
|---|---|---|---|
| Painel | Legacy operational summary and quality warnings | `DashboardTab` | Uses the already-loaded units/site data |
| Apartamentos | Search/filter/sort/paginate compact rows; visibility quick toggle; expandable full legacy editor; featured summary | `UnitCard`, `PhotoTile` | `GET /admin/units`, `GET /admin/site`; `PATCH /admin/units/:slug`; `PUT /admin/content/home.featured`; `PUT /admin/content/unit.displayTitles`; unit photo CRUD/reorder |
| Fotos | Cross-apartment unit-photo manager with apartment selection, upload, ordering, categorisation and bulk category changes | `PhotosTab`, `PhotoTile` | Unit photo upload, reorder, `PATCH /admin/photos/:id`, `DELETE /admin/photos/:id` |
| Imagens | Fixed site-image slots such as home hero and service-page heroes | `ImagesTab`, `IMAGE_SLOTS` | `POST /admin/images/:slot`, `DELETE /admin/images/:slot` |
| Conteúdo | Site-wide copy and structured content fields | `ContentTab` and local field editors | `PUT /admin/content/:key` |
| Propriedades | Building/collection copy, metrics, lists, unit order, gallery and building-level reviews | `PropertiesTab`, `UnitOrderEditor`, `PropertyGalleryEditor`, `ReviewsEditor`, `ImportBox` | `GET /admin/units`; `POST /admin/units/reorder`; property photo read/upload/reorder; photo edit/delete; review read/create/edit/delete/import; content writes |
| Reviews | Legacy global review manager with bulk selection/delete and editing | `ReviewsTab`, `StarRow` | `GET /admin/reviews`, `PATCH/DELETE /admin/reviews/:id` |
| Disponibilidade | iCal configuration/sync status and per-unit/all-unit sync controls | `AvailabilityTab` | `GET /admin/availability`, `POST /admin/sync`, `POST /admin/sync/:unitSlug` |
| Leads | Legacy lead list with status changes and delete | `LeadsTab` | `GET /admin/leads`, `PATCH/DELETE /admin/leads/:id` |
| Coletor | Embeds/links the static review collector | `CollectorTab` | No React API call; uses `public/admin-review-collector.html` |

### 1.3 Apartment detail tabs

| Tab | Fields/workflow | Save model |
|---|---|---|
| Resumo | Completeness warnings, photo/review/rating/spec statistics, publication/Airbnb state, public and Airbnb links | Read-only |
| Conteúdo | Internal name, public title, description, postcode, square feet | Per-field `PATCH` on blur |
| Divisões | Guests, bedrooms, beds, bathrooms, ensuites, WCs, floor, lift | Numbers save on blur; lift saves immediately |
| Fotos | Upload, primary image, source/reference images, ordering, category, hide/show and selection workflows | Immediate mutations for discrete actions; ordering has an explicit save action |
| Photo Tour | Preview of the categorized tour | Read-only preview |
| Reviews | Apartment-scoped review list and CRUD | Explicit create; field/action-level patch/delete |
| Reservas | Airbnb and iCal URLs | Per-field `PATCH` on blur |
| Configurações | Visibility, display order, SEO title, meta description, latitude/longitude, internal notes | Visibility immediate; other fields save on blur |

### 1.4 Auth and data layer

- Every page owns its own login gate and local-storage token lifecycle. `Login` is independently implemented in `Admin.tsx`, `AdminDashboard.tsx`, `AdminApartmentsList.tsx`, `AdminReviews.tsx`, and `AdminLeads.tsx`.
- `src/hooks/useAdminApi.ts` correctly centralises authenticated requests, JSON errors, 401 logout, base64 conversion, and a browser-close dirty guard.
- There is no shared query/cache layer. Each page owns `loading`, `error`, `load`, filtering, optimistic changes, and refresh behaviour.
- `GET /api/admin/units` returns every unit and every unit photo, including many fields the compact list does not use. This is acceptable at ~40 units but couples list performance to the complete photo library.
- Sidebar definitions are copied into every standalone page rather than owned by `AdminShell` or a route configuration.

### 1.5 Server endpoint inventory

All endpoints below are mounted under `/api/admin` in `server/index.js`. Except for login, they require an admin bearer token.

| Endpoint | Purpose | Current admin consumers |
|---|---|---|
| `POST /login` | Shared-password login; returns signed token | Every admin page’s duplicated `Login` |
| `GET /units` | All units plus all unit media | Legacy admin, dashboard, new apartment list, property unit-order editor |
| `GET /units/:unitSlug` | Full unit, photos and review summary | Apartment detail |
| `PATCH /units/:unitSlug` | Allowlisted unit fields | Both apartment lists/cards and detail editor |
| `POST /units/:unitSlug/photos` | Upload unit photo | Legacy card/photos and detail editor |
| `PATCH /photos/:id` | Alt text, room category, primary image (and currently not `hidden`; see findings) | All photo editors |
| `POST /units/reorder` | Persist unit display order | Property editor |
| `POST /units/:unitSlug/photos/reorder` | Persist unit photo order | Legacy card/photos and detail editor |
| `POST /units/:unitSlug/photos/references` | Import/update reference-photo metadata | Apartment detail |
| `DELETE /photos/:id` | Delete storage object and media row | Legacy and detail photo editors |
| `GET /properties/:slug/photos` | Building gallery | Property editor |
| `POST /properties/:slug/photos` | Upload building photo | Property editor |
| `POST /properties/:slug/photos/reorder` | Reorder building gallery | Property editor |
| `GET /site` | All site copy and image-slot overrides | Legacy admin |
| `PUT /content/:key` | Upsert one site-content value | Legacy content/properties and featured/display-title storage |
| `POST /images/:slot` | Upload/replace site image slot | Legacy Images section |
| `DELETE /images/:slot` | Revert image slot | Legacy Images section |
| `GET /reviews` | Global or property-filtered reviews | Dashboard, both review managers, apartment detail |
| `POST /reviews` | Create review | Legacy property editor and apartment detail |
| `PATCH /reviews/:id` | Edit/publish review | Three review surfaces |
| `DELETE /reviews/:id` | Delete review | Three review surfaces |
| `POST /reviews/import` | Import/deduplicate parsed Airbnb reviews | Legacy property editor |
| `GET /availability` | iCal setup, last sync and future blocked-count status | Legacy Availability |
| `POST /sync` | Sync all units | Legacy Availability |
| `POST /sync/:unitSlug` | Sync one unit | Legacy Availability |
| `GET /leads` | List/filter enquiries | Dashboard and both leads surfaces |
| `PATCH /leads/:id` | Change enquiry status | Both leads surfaces |
| `DELETE /leads/:id` | Delete enquiry | Legacy leads only |

## 2. Redundancy, gaps, and dead paths

### 2.1 High-impact duplication

1. **Two apartment list experiences**
   - `Admin.tsx` has a mature compact table plus expandable legacy `UnitCard`.
   - `AdminApartmentsList.tsx` has a second compact table with a different visual language and different incomplete features.
   - Neither is a complete superset: the legacy list supports featured indicators and updated-date sorting; the new list has cleaner pagination/status presentation but no featured or updated-date column.

2. **Two apartment editors**
   - `UnitCard` edits all core fields, photos, photo categories, reviews, booking URLs, visibility and featured order inside an expanded list row.
   - `AdminApartment.tsx` edits the same domain through a dedicated eight-tab page.
   - Keeping both doubles form state, mutation handling, error presentation and regression surface.

3. **Three unit-photo surfaces**
   - Expanded `UnitCard`, global `PhotosTab`, and apartment detail `PhotosTabUnit`.
   - All implement some combination of tile controls, upload, primary image, reorder, alt/category and deletion.
   - Building galleries add a fourth similar implementation through `PropertyGalleryEditor`.

4. **Three review managers**
   - Legacy global `ReviewsTab`.
   - Standalone `/admin/reviews`.
   - Apartment `ReviewsTabUnit`, plus building-scoped `ReviewsEditor` in Properties.
   - They differ in supported editing/import/bulk capabilities, so users cannot predict which surface is authoritative.

5. **Two leads managers**
   - Legacy `LeadsTab` supports status and delete.
   - Standalone `/admin/leads` supports better scanning and a detail drawer but no delete.

6. **Repeated shell configuration and authentication**
   - Sidebar arrays are copied across every standalone page and already disagree: some “Reviews” links go to `/admin/reviews`, others to `/admin`.
   - Five near-identical login components repeat fetch, busy/error state, token storage and styling.
   - Constants such as `GOLD`, `NAVY`, common status badges, switches, buttons, labels and form styles are repeatedly local.

7. **A shared UI library exists but is barely adopted**
   - `src/components/admin/AdminUI.tsx` provides `AdminButton`, `AdminCard`, loading/empty/error states, accessible `SaveStatus`, and `ConfirmDialog`.
   - Its own comment says the older screens are not wired to it.
   - Only `ConfirmDialog` is imported, and only by `Admin.tsx`; the other primitives are effectively unused.

### 2.2 Repeated fetch/state logic

- Every page repeats token retrieval, login/logout, initial loading, `useCallback(load)`, `useEffect(load)`, error treatment, and local optimistic update policy.
- Some failures are surfaced, some are silently swallowed, and some trigger a full reload.
- Featured state is stored in `SiteContent['home.featured']`, while most unit fields live on `Unit`; the new list loads only units, so it cannot show or edit featured state.
- The legacy “public display title” is stored in `SiteContent['unit.displayTitles']`, while the newer detail editor uses `Unit.displayTitle`. These are competing data models for the same concept.
- Photo operations repeatedly refetch the complete unit/site payload rather than invalidating a focused unit or photo query.

Recommended shared layer:

- `AdminAuthProvider` + `ProtectedAdminRoute`.
- One declarative `adminNavItems` route configuration.
- Domain hooks such as `useAdminUnits`, `useAdminUnit(slug)`, `useUpdateUnit`, `useUnitPhotos`, `useReviews`, `useLeads`, and `useSiteContent`.
- A small query library is optional; at this scale, typed hooks with a shared request client and explicit invalidation are sufficient.

### 2.3 Fields that do not belong in list/scan mode

The legacy expanded `UnitCard` exposes all of the following in list context: internal name, separate display title, specs, Airbnb URL, postcode, square feet, full description, two iCal URLs, every photo, alt text, room categories, photo order, reviews, visibility, featured state and featured order.

Only these should be visible/actionable while scanning:

- Primary thumbnail.
- Public/internal name, with slug as secondary text only when useful.
- Building/property.
- Visibility toggle.
- Featured toggle or star.
- Airbnb listing health warning.
- Last updated date/time.
- A concise completeness warning count (optional).
- “Edit” and “View public” actions.

Everything else belongs in the routed detail editor. Featured **ordering** should live in a focused “Homepage featured order” view or compact reorder panel, not as a number input repeated in every row.

### 2.4 Photos versus Images

They represent genuinely different ownership scopes, but the labels are ambiguous:

- **Fotos** manages apartment-owned media (`MediaAsset`, `ownerType='unit'`): galleries, cover, ordering and Photo Tour categories.
- **Imagens** manages fixed website design slots (`SiteImage`): home hero, property blocks, service/about heroes.
- **PropertyGalleryEditor** separately manages building-owned media (`MediaAsset`, `ownerType='property'`).

Do not blindly merge the data models. Merge their navigation under a clearer **Media** section:

- Apartment photos → primarily inside each apartment detail.
- Building galleries → inside each building detail.
- Website images → `/admin/site/media`.

A cross-apartment media library is a useful secondary workflow only if the team regularly performs photo QA across all units. Rename it **Media library** and make ownership filters explicit; otherwise remove it from first-level navigation.

### 2.5 Incomplete, misleading, unused, or dead behaviour

| Finding | Evidence / impact | Recommendation |
|---|---|---|
| New apartment delete is broken | `AdminApartmentsList.tsx` calls `DELETE /admin/units/:slug`, but `server/admin.js` defines no such route. The UI promises irreversible deletion, then silently ignores errors. | Remove the action until a deliberately designed archive/delete flow exists. Prefer archive over hard delete because units have photos, reviews and availability data. |
| “Add Apartment” is a dead path | Button navigates to `/admin`; there is no create route or `POST /admin/units`. | Hide it now. Later add `/admin/apartments/new` only with a complete creation contract. |
| Bulk selection has no bulk operation | Checkboxes update `selected`, but no action bar consumes it. | Add publish/hide and featured/unfeatured bulk actions with confirmation and partial-failure reporting. |
| Occupancy filter is cosmetic | `occupancyFilter` resets pagination and displays choices but is never used in `filtered`; unit list data has no occupancy status. | Remove it until a real occupancy definition/API exists, or derive a clearly named “available today” state from availability data. |
| Header sorting is cosmetic | “Name ▲” and “Group ▲” look interactive but have no click handler or sort state. | Implement accessible sort buttons or remove arrows/cursor styling. |
| Featured missing from new list | New list loads units only; featured slugs are stored in site content. | Move featured to a proper unit/homepage placement model or return placement state in the list DTO. |
| Updated date missing from new list | The endpoint supplies `updatedAt`, the type includes it, but the table does not render it. | Add a compact “Updated” column and sortable control. |
| Cross-route sidebar links lose intent | Standalone pages send Photos, Content, Properties, Availability and Collector to `/admin`, which always initialises the `dashboard` tab. | Give each destination a route; do not navigate to opaque component state. |
| Sidebar definitions disagree | Apartment detail sends Reviews and Leads to `/admin`; other pages use the standalone routes. | Centralise one route-based navigation config. |
| Top-bar search is decorative | `AdminShell` renders “Search Console…” without state, submit behaviour or results. Bell/settings buttons also have no actions. | Remove them until functional; use that space for contextual actions/save state. |
| No admin 404 | Unknown admin routes match no route. | Add an admin-scoped redirect/not-found route. |
| `hidden` photo edit contract appears mismatched | Detail photo UI exposes hide/show, and detail reads `hidden`, but `PATCH /photos/:id` allowlists only `alt`, `roomCategory`, and `isPrimary`. | Add/verify `hidden` in the endpoint contract before relying on this control. |
| `VisiBadge` duplicates the toggle state | New list shows a visibility toggle and a “Status” badge that appears to repeat visibility rather than operational status. | Use Status for Airbnb health/completeness, or remove the redundant column. |
| Dashboard occupancy chart is static | `CHART_POINTS` is hard-coded. | Label it as sample data or remove it until backed by bookings. |
| Stale API fallback text | Leads page says the leads endpoint “has not been implemented,” but the endpoint exists. | Replace with a normal actionable error state. |
| Shared primitives are unused | Most exports in `AdminUI.tsx` have no consumers. | Adopt them during consolidation or delete them after confirming no future use. |
| Selected state in legacy apartments is unused | `selectedSlugs` is populated but never powers an action. | Remove or complete it as part of the canonical list. |

No `DELETE /units/:slug` or `POST /units` endpoint exists; these are not merely unused routes but client/server contract defects.

## 3. Main apartments page usability audit

### 3.1 Information density

For roughly 40 apartments, the default view should fit 10–15 rows on a laptop without losing legibility. A row should answer:

1. Which apartment is this?
2. Which building is it in?
3. Is it visible on the public site?
4. Is it featured on the homepage?
5. Is there an operational/problem state?
6. When was it last changed?
7. How do I edit or preview it?

Recommended desktop columns:

| Column | Content |
|---|---|
| Select | Checkbox, shown with a bulk-action toolbar |
| Apartment | 56×42 thumbnail, display title/name, small internal slug |
| Building | Property name |
| Visibility | Immediate switch with pending/success/error feedback |
| Featured | Immediate star/switch; show order only in a dedicated reorder mode |
| Health | Airbnb inactive and/or compact completeness warnings |
| Updated | Relative date with full timestamp in tooltip |
| Actions | Edit, public preview, overflow menu |

On mobile, retain thumbnail/name/building, both quick toggles and an overflow menu. Updated/health can collapse under the title.

Postcode, area, specs, description, Airbnb URL, iCal URLs, SEO, notes, coordinates, room counts and photo tiles should not expand inline in this list.

### 3.2 Editing model recommendation

Use **compact list + routed full-page detail editor**.

Why:

- Long descriptions, SEO, booking feeds and 20+ photos need width and focus.
- Eight existing edit domains already justify tabs.
- A route supports deep links, refresh, browser back/forward and opening multiple apartments in tabs.
- A drawer is excellent for a short lead record but too narrow for photo reordering and long-form property content.
- A modal makes accidental dismissal and context loss more likely.
- Inline editing should be reserved for high-frequency, low-risk booleans: visibility and featured.

The current `/admin/apartments/:unitSlug` is the correct foundation. Remove the expanded `UnitCard` instead of maintaining it as a second editor.

### 3.3 Search, filtering, sorting, and bulk actions

Minimum viable list controls:

- Debounced free-text search across name, display title, slug, and building.
- Building filter.
- Visibility filter.
- Featured filter.
- Health filter: Airbnb inactive, missing cover, incomplete content.
- Sort by building/name, recently updated, visibility, and featured order.
- Preserve filters, sort, page and selection in URL query parameters where practical.

Bulk toolbar, visible only when rows are selected:

- Publish.
- Hide.
- Feature on home.
- Remove from home.
- Clear selection.

Use a single bulk endpoint or bounded concurrent updates with:

- A confirmation for hiding/publishing many units.
- Per-row pending state.
- A summary such as “8 updated, 1 failed.”
- No optimistic success that cannot be rolled back.

Do not add bulk deletion. For a small hospitality inventory, accidental removal is much more expensive than the seconds saved.

### 3.4 Save behaviour and data-loss risk

The detail page is labelled by behaviour as autosave, but technically uses several save modes:

- Text and number fields save on `blur`.
- Visibility/lift and discrete media actions save immediately.
- Some photo ordering actions use an explicit save.
- The UI shows a short “Saving/Saved/Error” status local to each tab.

Risks:

1. **Blur is not a durable transaction boundary.** Clicking another tab often triggers blur and starts a request, but navigation can proceed before it finishes.
2. **Dirty comparison uses stale props.** Several tabs do not refresh the unit after every successful field patch, so local values can remain “different” from the originally loaded `unit`; the unload warning may remain active after a successful save.
3. **The guard covers browser unload only.** `useUnsavedChangesGuard` does not block React Router navigation or apartment-tab changes.
4. **Concurrent field saves have no queue/versioning.** Rapid blurs can overlap; status timers from an earlier save can clear a later status, and responses are not reconciled into a canonical cache.
5. **Some errors are silent.** List toggles and legacy handlers frequently use empty catches or reload without a message.
6. **Legacy full cards also save on blur**, but do not consistently use the unsaved-change guard.

Recommended policy:

- Keep immediate save for visibility, featured, cover image, photo visibility/category and reorder confirmation.
- For Content, Rooms, Booking and Settings, use an explicit sticky **Save changes** action per tab (or one editor-level action) with dirty state.
- Disable navigation or show an in-app confirmation while save is pending/dirty.
- On success, update the local canonical unit with the returned API value and clear dirty state.
- On error, retain the user’s input, show a persistent field/form error and provide Retry.
- If autosave is retained, use a debounced mutation queue, save-state machine and route blocker; do not rely solely on blur.

## 4. Information architecture and flows

### 4.1 Current architecture (as-is)

```mermaid
flowchart TD
    U[Admin user] --> A{Entry route}

    A -->|/admin| L[Legacy Admin monolith<br/>state defaults to Painel]
    L --> LD[Painel]
    L --> LA[Apartamentos compact table]
    LA --> EXP[Expand row]
    EXP --> UC[Full inline UnitCard<br/>all fields + photos + reviews]
    LA --> DET[/admin/apartments/:unitSlug]
    L --> LF[Fotos<br/>unit media across apartments]
    L --> LI[Imagens<br/>fixed website image slots]
    L --> LC[Conteúdo<br/>site-wide copy]
    L --> LP[Propriedades<br/>building copy, gallery, order, reviews]
    L --> LR[Legacy Reviews]
    L --> LV[Disponibilidade]
    L --> LL[Legacy Leads]
    L --> COL[Coletor]

    A -->|/admin/dashboard| ND[New Dashboard]
    A -->|/admin/apartments| NL[New Apartments list]
    NL --> DET
    NL -. broken create/delete .-> L
    A -->|/admin/reviews| NR[New Reviews]
    A -->|/admin/leads| NLE[New Leads]

    DET --> T1[Resumo]
    DET --> T2[Conteúdo]
    DET --> T3[Divisões]
    DET --> T4[Fotos]
    DET --> T5[Photo Tour]
    DET --> T6[Reviews]
    DET --> T7[Reservas]
    DET --> T8[Configurações]

    ND -. Photos, Content, Properties,<br/>Availability, Collector .-> L
    NL -. same sidebar fallback .-> L
    NR -. same sidebar fallback .-> L
    NLE -. same sidebar fallback .-> L
```

Key flow problem: sidebar items that point to `/admin` cannot select an internal tab, so the target section is lost.

### 4.2 Proposed architecture (to-be)

```mermaid
flowchart TD
    AUTH[Protected Admin Layout<br/>shared auth + shared sidebar] --> DASH[/admin/dashboard]
    AUTH --> APTS[/admin/apartments<br/>canonical compact list]
    AUTH --> BLD[/admin/buildings]
    AUTH --> REV[/admin/reviews]
    AUTH --> LEADS[/admin/leads]
    AUTH --> AVAIL[/admin/availability]
    AUTH --> SITE[/admin/site]

    APTS -->|quick action| Q1[Visibility toggle]
    APTS -->|quick action| Q2[Featured toggle]
    APTS -->|selected rows| BULK[Bulk publish/hide/feature]
    APTS -->|Edit| EDIT[/admin/apartments/:unitSlug]

    EDIT --> O[Overview]
    EDIT --> C[Content<br/>title, description, postcode, area]
    EDIT --> R[Rooms & capacity]
    EDIT --> M[Photos & Photo Tour<br/>one media workspace + preview]
    EDIT --> BK[Booking links & availability]
    EDIT --> S[Settings<br/>visibility, SEO, location, notes]
    EDIT -. related shortcut .-> REV

    BLD --> BD[/admin/buildings/:propertySlug]
    BD --> BC[Building content]
    BD --> BG[Building gallery]
    BD --> BO[Apartment display order]

    SITE --> SC[/admin/site/content]
    SITE --> SM[/admin/site/media<br/>fixed hero/design slots]
    SITE --> FH[/admin/site/homepage<br/>featured order]

    REV --> RI[Review detail/edit/import]
    LEADS --> LD[Lead detail drawer]
    AVAIL --> SYNC[iCal status and sync]

    AUTH -. optional secondary tool .-> LIB[/admin/media<br/>cross-owner media QA]
```

Recommended first-level sidebar:

- Dashboard
- Apartments
- Buildings
- Reviews
- Leads
- Availability
- Website

“Collector” belongs under Reviews as an import tool. “Photos” should normally be contextual to Apartments/Buildings; only keep a global Media item if cross-property media QA is a frequent task.

## 5. Prioritised refactor plan

Effort assumes one engineer familiar with the codebase: **S** = up to about 1 day, **M** = roughly 2–5 days, **L** = roughly 1–2 weeks including migration and regression testing.

### 5.1 Quick wins: low effort, high impact

| Priority | Change | Files affected | Effort | Risk |
|---|---|---|---|---|
| P0 | Choose `/admin/apartments` as the canonical list; remove/hide the expanded legacy `UnitCard` entry point from normal navigation. Add featured and updated columns from the legacy list. | `src/pages/AdminApartmentsList.tsx`, `src/pages/Admin.tsx`, `src/App.tsx` | M | Medium: ensure featured writes keep homepage order valid |
| P0 | Remove misleading controls until implemented: Add Apartment, delete unit, occupancy filter, fake sort affordances, unused selection, top-bar search/bell/settings. | `AdminApartmentsList.tsx`, `AdminShell.tsx` | S | Low |
| P0 | Fix sidebar destinations by giving current sections real links/routes or, as a short-lived bridge, query-driven `/admin?tab=...` with validated state. | `src/App.tsx`, all `src/pages/Admin*.tsx`, `AdminShell.tsx` | M | Medium: navigation regression |
| P0 | Show the exact scan fields: thumbnail, name/slug, building, visibility, featured, Airbnb health, updated date and actions. | `AdminApartmentsList.tsx`; possibly `server/admin.js` list DTO | S | Low |
| P0 | Add visible pending/success/failure feedback and rollback to list toggles. Never silently catch failed writes. | `AdminApartmentsList.tsx`, `useAdminApi.ts`, `AdminUI.tsx` | S | Low |
| P0 | Verify/fix photo `hidden` mutation contract; do not show a control that the endpoint discards. | `AdminApartment.tsx`, `server/admin.js`, server tests | S | Medium: affects public photo visibility |
| P1 | Replace all duplicated login screens with one protected admin layout; add admin not-found/redirect. | `src/App.tsx`, all admin pages, new `AdminAuthProvider`/layout | M | Medium: auth/navigation |
| P1 | Centralise sidebar configuration and standardise one language. | `AdminShell.tsx`, all admin pages, new admin route config | S | Low |

### 5.2 Structural changes

| Priority | Change | Files affected | Effort | Risk |
|---|---|---|---|---|
| P1 | Extract every `/admin` state tab into a route; make `/admin` redirect to `/admin/dashboard`. | `Admin.tsx`, `App.tsx`, new routed page files | L | High: broad migration; stage section by section |
| P1 | Delete `UnitCard` after the detail editor reaches feature parity. Resolve public title storage by migrating from `SiteContent['unit.displayTitles']` to `Unit.displayTitle`. | `Admin.tsx`, `AdminApartment.tsx`, `server/admin.js`, migration/seed/public content consumers | L | High: public title compatibility/data migration |
| P1 | Consolidate photo code into reusable `MediaGrid`, `MediaTile`, upload, reorder and metadata hooks. Keep owner type/slug explicit. | `Admin.tsx`, `AdminApartment.tsx`, new `components/admin/media/*`, hooks | L | High: destructive media actions and ordering |
| P1 | Consolidate reviews around `/admin/reviews`; use URL filters for apartment/building scope and a shared edit panel. Move Collector/import under Reviews. | `Admin.tsx`, `AdminReviews.tsx`, `AdminApartment.tsx`, collector asset/page | M/L | Medium |
| P1 | Consolidate leads around `/admin/leads`; carry over any required delete capability behind an accessible confirmation. | `Admin.tsx`, `AdminLeads.tsx` | M | Medium |
| P1 | Introduce typed domain hooks and focused endpoint DTOs. The list endpoint should return cover only, not all photos; the detail endpoint remains full. | `useAdminApi.ts`, new hooks/types, all admin pages, `server/admin.js` | L | Medium: API contract migration |
| P1 | Standardise form/save semantics. Use explicit save for multi-field tabs, immediate save for toggles/media, a route blocker, persistent errors and returned-data reconciliation. | `AdminApartment.tsx`, `useAdminApi.ts`, new form/mutation hooks, `AdminUI.tsx` | M/L | High: data-loss prevention requires testing |
| P2 | Add a real bulk update endpoint with allowlisted actions and partial-result reporting; connect selected-row toolbar. | `AdminApartmentsList.tsx`, `server/admin.js`, server tests | M | Medium: bulk publication changes |
| P2 | Split Buildings and Website into routed editors: building copy/gallery/order versus global content/fixed media slots/homepage featured order. | `Admin.tsx`, `App.tsx`, new pages/components | L | Medium |

### 5.3 Nice-to-haves

| Priority | Change | Files affected | Effort | Risk |
|---|---|---|---|---|
| P2 | Save list filters/sort/page in URL query parameters; support browser back and shareable operational views. | `AdminApartmentsList.tsx` | S/M | Low |
| P2 | Add completeness/health badges and saved views such as “Airbnb inactive” or “Missing cover.” | List DTO, `AdminApartmentsList.tsx` | M | Low |
| P2 | Add keyboard-friendly row navigation and an overflow action menu; maintain 44px targets and accessible switch labels. | `AdminApartmentsList.tsx`, `AdminUI.tsx` | S | Low |
| P2 | Replace photo prompt dialogs with an accessible metadata panel for alt text/category. | Shared media components | M | Low |
| P3 | Build real occupancy reporting only after agreeing on the definition and source of truth; replace the hard-coded dashboard chart. | `AdminDashboard.tsx`, server reporting endpoint/data model | L | Medium/High: booking semantics |
| P3 | Add audit history (“who changed visibility/title and when”) if the team grows or mistakes become costly. | Database migration, server endpoints, admin UI | L | Medium |
| P3 | Add optimistic prefetch when hovering Edit and lightweight skeleton rows. | Data hooks, list/detail pages | S | Low |

## 6. Suggested delivery sequence

1. **Stabilise the visible experience:** remove broken/decorative controls, fix errors and photo-hidden contract.
2. **Declare the canonical path:** `/admin/apartments` → `/admin/apartments/:unitSlug`; add featured and updated information to the list.
3. **Unify shell/auth/navigation:** one protected layout, one sidebar config, real URLs.
4. **Resolve data-model duplication:** one `displayTitle`, one featured-placement source, focused list/detail DTOs.
5. **Extract and retire the monolith:** Buildings, Website, Availability, Reviews/Collector, and Leads become routes; delete superseded local tabs/components.
6. **Consolidate media and forms:** reusable media workspace, consistent save state and navigation protection.
7. **Add true bulk operations and optional reporting enhancements.**

## 7. Acceptance criteria for the refactor

- Only one apartment list and one apartment editor are reachable.
- A user can scan all units by thumbnail, name, building, visibility, featured, health and update date without opening forms.
- Visibility and featured changes have clear pending, success and failure states.
- Bulk publish/hide/feature actions work and report partial failures.
- Every sidebar destination has a stable URL and refreshes to the same page.
- No sidebar item, filter, sort icon or action is decorative.
- Long-form edits cannot be lost through tab/route navigation.
- Apartment, building and website media have unambiguous scopes.
- Shared auth, navigation, request handling, form status, confirmation and media primitives replace local duplicates.
- The navy/serif/gold MCRh identity remains intact while spacing and density are optimised for operations.

## 8. Validation notes

- The current workspace already contains modified/untracked admin implementation files. This audit treats them as the current source of truth and does not assume the branch represents a released production state.
- TypeScript validation (`npx tsc --noEmit`) completed successfully during the review.
- Findings about broken create/delete, occupancy filtering, sorting, and navigation are based on direct client/server contract and event-handler inspection, not visual inference.
