export type MediaOwnerType = 'unit' | 'property';

export type MediaOwner = {
  ownerType: MediaOwnerType;
  ownerSlug: string;
};

export type MediaItem = {
  id?: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
  roomCategory: string | null;
  hidden: boolean;
};

export type MediaGroup = {
  key: string;
  label: string;
  items: MediaItem[];
};

export type MediaMetadataPatch = Partial<Pick<MediaItem, 'alt' | 'roomCategory' | 'hidden' | 'isPrimary'>>;

export function getMediaKey(item: Pick<MediaItem, 'id' | 'url'>): string {
  return item.id || item.url;
}
