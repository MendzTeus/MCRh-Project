import extractedListings from './airbnbListings.generated.json';
import { getInventoryForProperty } from './airbnbInventory';
import { getPropertyBySlug } from './properties';

type ExtractedListing = {
  unitSlug: string;
  airbnbName?: string | null;
  rating?: string | null;
  primaryImage?: string | null;
  imageUrls?: string[];
  finalUrl?: string | null;
  likelyInvalid?: boolean;
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
