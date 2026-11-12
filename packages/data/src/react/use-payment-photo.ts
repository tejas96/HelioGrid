'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { PickedFile } from './picked-file';
import { useTenantId } from './use-tenant-id';

/** The receipt photo picked for a payment, with where the device can show it from. */
export interface PaymentPhoto {
  readonly file: PickedFile;
  readonly preview: string;
}

/** How storing a payment's photo ended, for the screen's one line. */
export type PhotoOutcome = 'added' | 'failed';

export interface PaymentPhotoStore {
  /** The payments whose photo is being stored: each row says its photo is on its way. */
  readonly attaching: readonly string[];
  /**
   * Stores the photo against the payment (`M11-37`). `quiet`: a photo stored right after its
   * payment says nothing more on success — the payment's own line already spoke.
   */
  attach(entryId: string, photo: PaymentPhoto, quiet: boolean): void;
  /** Stores again the photo whose store failed; nothing when none did. */
  retry(): void;
}

/**
 * A payment's receipt photo, stored against the payment once the payment is saved, so a slow or
 * failed upload never holds the money back (`M11-37`). A photo that failed is held until it is
 * tried again or the screen closes; the payment itself already stands.
 */
export function usePaymentPhoto(
  projectId: string,
  said: (outcome: PhotoOutcome) => void,
): PaymentPhotoStore {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [attaching, setAttaching] = useState<readonly string[]>([]);
  const failed = useRef<{ readonly entryId: string; readonly photo: PaymentPhoto } | null>(null);
  // Read before any redraw: a second press for the same payment while one is out stores nothing.
  const out = useRef(new Set<string>());
  const attach = (entryId: string, photo: PaymentPhoto, quiet: boolean) => {
    if (out.current.has(entryId)) return;
    out.current.add(entryId);
    setAttaching((was) => [...was, entryId]);
    void repositories.file
      .store({
        subjectKind: 'project_payment',
        subjectRef: entryId,
        contentType: photo.file.contentType,
        bytes: photo.file.bytes,
      })
      .then(
        async () => {
          failed.current = null;
          await queryClient.invalidateQueries({
            queryKey: queryKeys.projects.payments(tenantId, projectId),
          });
          if (!quiet) said('added');
        },
        () => {
          failed.current = { entryId, photo };
          said('failed');
        },
      )
      .finally(() => {
        out.current.delete(entryId);
        setAttaching((was) => was.filter((one) => one !== entryId));
      });
  };
  return {
    attaching,
    attach,
    retry: () => {
      const held = failed.current;
      if (held !== null) attach(held.entryId, held.photo, false);
    },
  };
}
