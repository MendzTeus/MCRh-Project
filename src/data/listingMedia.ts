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

function uniqueImages(images: (string | null | undefined)[]) {
  return [...new Set(images.filter(Boolean) as string[])];
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
  return media.gallery[index] || media.heroImage;
}

export function getUnitGallery(unitSlug?: string, propertySlug?: string) {
  const unitMedia = getListingMedia(unitSlug);
  const propertyMedia = getPropertyMedia(propertySlug);
  return uniqueImages([...(unitMedia?.gallery || []), ...propertyMedia.gallery]).slice(0, 8);
}
