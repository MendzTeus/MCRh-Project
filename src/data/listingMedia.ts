import extractedListings from './airbnbListings.generated.json';
import { getInventoryForProperty } from './airbnbInventory';
import { getPropertyBySlug } from './properties';

type ExtractedListing = {
  unitSlug: string;
  airbnbName?: string | null;
  rating?: string | null;
  guests?: number | null;
  bedrooms?: number | null;
  beds?: number | null;
  baths?: number | null;
  reviewsCount?: number | null;
  primaryImage?: string | null;
  imageUrls?: string[];
  finalUrl?: string | null;
  likelyInvalid?: boolean;
};

export type UnitSpecs = {
  guests: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  rating: string | null;
  reviewsCount: number | null;
};

const listings = (extractedListings.results || []) as ExtractedListing[];

// Airbnb serves the same photo under several URLs that differ only by size/query
// params (e.g. `...c80.jpg?im_w=720` vs `...c80.jpg`). Keying on the origin+path
// collapses those to a single logical image so galleries don't repeat a photo.
function imageIdentity(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

function uniqueImages(images: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const image of images) {
    if (!image) continue;
    const key = imageIdentity(image);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(image);
  }
  return result;
}

/**
 * Tidies an Airbnb marketing title for display: drops "2BR"/"| 3BR |" bedroom
 * tags and turns pipe separators into em dashes. Used as the automatic fallback
 * when no custom display title has been set in the admin.
 * e.g. "Chambers Residence | 2BR | Urban Oasis Prime Spot" → "Chambers Residence — Urban Oasis Prime Spot"
 */
export function cleanListingTitle(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\|?\s*\d+\s*br\b\.?/gi, ' ')   // drop "2BR" / "| 3BR" tags
    .replace(/\s*\|\s*/g, ' — ')                // remaining pipes → em dash
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[—-]\s*|\s*[—-]\s*$/g, '')    // strip leading/trailing separators
    .trim();
}

/**
 * Whether a unit's Airbnb listing is bookable. Returns false only when the unit
 * was scraped and Airbnb served its "404/paused" page (likelyInvalid) — used to
 * hide the "Book on Airbnb" deep-link so we never send guests to a dead listing.
 * Units with no scrape entry get the benefit of the doubt (returns true).
 */
export function isListingActive(unitSlug?: string): boolean {
  if (!unitSlug) return true;
  const listing = listings.find((item) => item.unitSlug === unitSlug);
  return !listing?.likelyInvalid;
}

export function getListingMedia(unitSlug?: string) {
  if (!unitSlug) return undefined;
  const listing = listings.find((item) => item.unitSlug === unitSlug && !item.likelyInvalid);
  if (!listing) return undefined;
  const gallery = uniqueImages([listing.primaryImage, ...(listing.imageUrls || [])]);

  return {
    title: listing.airbnbName || undefined,
    rating: listing.rating || undefined,
    primaryImage: gallery[0],
    gallery,
    finalUrl: listing.finalUrl || undefined,
  };
}

/** Per-unit specs scraped from the Airbnb listing (guests/rooms/beds/baths/rating). */
export function getUnitSpecs(unitSlug?: string): UnitSpecs | undefined {
  if (!unitSlug) return undefined;
  const listing = listings.find((item) => item.unitSlug === unitSlug && !item.likelyInvalid);
  if (!listing) return undefined;
  return {
    guests: listing.guests ?? null,
    bedrooms: listing.bedrooms ?? null,
    beds: listing.beds ?? null,
    baths: listing.baths ?? null,
    rating: listing.rating ?? null,
    reviewsCount: listing.reviewsCount ?? null,
  };
}

export function getPropertyMedia(propertySlug?: string) {
  if (!propertySlug) return { heroImage: undefined, gallery: [] as string[] };
  const inventory = getInventoryForProperty(propertySlug);
  const gallery = uniqueImages(
    inventory.flatMap((unit) => {
      const media = getListingMedia(unit.unitSlug);
      return media?.gallery || [];
    }),
  );
  const property = getPropertyBySlug(propertySlug);

  return {
    heroImage: gallery[0] || property?.imageSrc,
    gallery,
  };
}

export function getPropertyImage(propertySlug?: string, index = 0) {
  const media = getPropertyMedia(propertySlug);
  const property = getPropertyBySlug(propertySlug);
  // Combine the scraped gallery with the property's static gallery so callers that
  // ask for distinct indices (e.g. the overlapping stack/grid feature cards) always
  // get different photos instead of the hero image repeated.
  const combined = uniqueImages([...media.gallery, ...(property?.gallery || []), property?.imageSrc]);
  return combined[index] || combined[combined.length - 1] || media.heroImage;
}

export function getUnitGallery(unitSlug?: string, propertySlug?: string) {
  const unitMedia = getListingMedia(unitSlug);
  const propertyMedia = getPropertyMedia(propertySlug);
  return uniqueImages([...(unitMedia?.gallery || []), ...propertyMedia.gallery]).slice(0, 8);
}
