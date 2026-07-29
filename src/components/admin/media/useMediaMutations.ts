import { useCallback } from 'react';
import { fileToBase64, useApi } from '../../../hooks/useAdminApi';
import type { MediaMetadataPatch, MediaOwner } from './types';

type AdminApi = ReturnType<typeof useApi>;

type OwnerInput = {
  owner: MediaOwner;
};

type UploadInput = OwnerInput & {
  file: File;
  alt?: string | null;
};

type ReorderInput = OwnerInput & {
  orderedIds: string[];
};

type PatchInput = OwnerInput & {
  mediaId: string;
  patch: MediaMetadataPatch;
};

type DeleteInput = OwnerInput & {
  mediaId: string;
};

export type UnitReferenceAssignment = {
  url: string;
  roomCategory: string | null;
  displayOrder: number;
  alt: string | null;
  hidden?: boolean;
};

type SaveUnitReferencesInput = OwnerInput & {
  assignments: UnitReferenceAssignment[];
};

function assertOwner(owner: MediaOwner): void {
  if (!owner.ownerSlug) throw new Error('Media ownerSlug is required');
  if (owner.ownerType !== 'unit' && owner.ownerType !== 'property') {
    throw new Error(`Unsupported media ownerType: ${String(owner.ownerType)}`);
  }
}

function uploadPath(owner: MediaOwner): string {
  assertOwner(owner);
  return owner.ownerType === 'unit'
    ? `/admin/units/${owner.ownerSlug}/photos`
    : `/admin/properties/${owner.ownerSlug}/photos`;
}

function reorderPath(owner: MediaOwner): string {
  assertOwner(owner);
  return owner.ownerType === 'unit'
    ? `/admin/units/${owner.ownerSlug}/photos/reorder`
    : `/admin/properties/${owner.ownerSlug}/photos/reorder`;
}

export function useMediaMutations(api: AdminApi) {
  const uploadMedia = useCallback(async ({ owner, file, alt }: UploadInput) => {
    const { base64, type } = await fileToBase64(file);
    return api(uploadPath(owner), {
      method: 'POST',
      body: JSON.stringify({ dataBase64: base64, contentType: type, alt: alt || null }),
    });
  }, [api]);

  const reorderMedia = useCallback(async ({ owner, orderedIds }: ReorderInput) => {
    assertOwner(owner);
    return api(reorderPath(owner), {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  }, [api]);

  const patchMedia = useCallback(async ({ owner, mediaId, patch }: PatchInput) => {
    assertOwner(owner);
    if (!mediaId) throw new Error('Media id is required');
    return api(`/admin/photos/${mediaId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }, [api]);

  const deleteMedia = useCallback(async ({ owner, mediaId }: DeleteInput) => {
    assertOwner(owner);
    if (!mediaId) throw new Error('Media id is required');
    return api(`/admin/photos/${mediaId}`, { method: 'DELETE' });
  }, [api]);

  const saveUnitReferences = useCallback(async ({ owner, assignments }: SaveUnitReferencesInput) => {
    assertOwner(owner);
    if (owner.ownerType !== 'unit') {
      throw new Error('Photo references are only supported for unit media');
    }
    return api(`/admin/units/${owner.ownerSlug}/photos/references`, {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  }, [api]);

  return {
    uploadMedia,
    reorderMedia,
    patchMedia,
    deleteMedia,
    saveUnitReferences,
  };
}
