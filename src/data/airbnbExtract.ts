import extractedListings from './airbnbListings.generated.json';

export type ExtractedAirbnbListing = {
  unitSlug: string;
  airbnbName?: string | null;
  rating?: string | null;
  specsFromAirbnb?: string[];
  primaryImage?: string | null;
  finalUrl?: string | null;
  likelyInvalid?: boolean;
};

const listings = (extractedListings.results || []) as ExtractedAirbnbListing[];

export function getExtractedAirbnbListing(unitSlug: string) {
  return listings.find((listing) => listing.unitSlug === unitSlug && !listing.likelyInvalid);
}
