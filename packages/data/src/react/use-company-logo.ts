'use client';
import {
  type ChosenImage,
  COMPANY_LOGO_LIMITS,
  type CompanyLogoCaptureFacts,
  type CompanyLogoRefusal,
  companyLogoRefusal,
  companyLogoTypeRefusal,
} from '@heliogrid/domain';
import { useRef, useState } from 'react';
import { ApiError } from '../errors/errors';
import { REFUSED_AS_ANOTHER_TYPE } from '../file/repository';
import { useRepositories } from './context';
import { useFileLink } from './use-file-link';

/** An image as an app hands it over: what the device read of it, its bytes, and a picture to draw. */
export interface ChosenPicture extends ChosenImage {
  readonly bytes: Uint8Array;
  /** Something the device can draw before anything is stored; `null` where it has none. */
  readonly picture: string | null;
  /** The file's own name, which a refusal names it by; absent where the device gives none. */
  readonly name?: string;
}

export interface CompanyLogo {
  readonly facts: CompanyLogoCaptureFacts;
  readonly picture: string | null;
  /** The image the next save stores; `null` when none was chosen, or the last one was refused. */
  readonly chosen: ChosenPicture | null;
  choose(image: ChosenPicture): void;
  /**
   * Stores the image and answers its file's id, or `null` when the api read another type in its
   * bytes. An image stored once is never stored again: a save that failed after this step is sent
   * again with the same file.
   */
  store(image: ChosenPicture): Promise<string | null>;
  /** The api refused the image a save sent: it is dropped, with the type's refusal at its field. */
  refuse(image: ChosenPicture): void;
  /** The save that sent the image landed: the profile holds it now. */
  saved(image: ChosenPicture): void;
  /** The last refusal is no longer the page's news: the logo was removed, saved or discarded. */
  dismiss(): void;
}

/**
 * The company's logo on its profile (`SCR-M01-05`, `logo-invalid-limits-stated`). An image is
 * checked on the device the moment it is chosen and held there: nothing is stored before the act,
 * so an image chosen and then abandoned leaves no file behind.
 */
export function useCompanyLogo(
  tenantId: string,
  /** The profile's pointer; absent until the profile is read, or from an api built before it. */
  profileLogoFileId: string | null | undefined,
): CompanyLogo {
  const storedFileId = profileLogoFileId ?? null;
  const repositories = useRepositories();
  const [chosen, setChosen] = useState<ChosenPicture | null>(null);
  const [refusal, setRefusal] = useState<CompanyLogoRefusal | null>(null);
  const storedNow = useRef<{ readonly image: ChosenPicture; readonly fileId: string } | null>(null);
  const link = useFileLink(tenantId, storedFileId, chosen === null);
  // Only the image a save sent is let go: another may have been chosen while that save was out.
  const letGo = (sent: ChosenPicture) => setChosen((held) => (held === sent ? null : held));
  return {
    facts: {
      limits: COMPANY_LOGO_LIMITS,
      refusal,
      held: chosen !== null || storedFileId !== null,
    },
    picture: chosen === null ? link : chosen.picture,
    chosen,
    choose: (image) => {
      const refused = companyLogoRefusal(image, COMPANY_LOGO_LIMITS);
      setRefusal(refused);
      if (refused === null) setChosen(image);
    },
    store: async (image) => {
      if (storedNow.current?.image === image) return storedNow.current.fileId;
      const contentType = COMPANY_LOGO_LIMITS.contentTypes.find(
        (taken) => taken === image.contentType,
      );
      if (contentType === undefined) return null;
      try {
        const subject = { subjectKind: 'tenant', subjectRef: tenantId } as const;
        const file = await repositories.file.store({ ...subject, contentType, bytes: image.bytes });
        storedNow.current = { image, fileId: file.id };
        return file.id;
      } catch (error) {
        if (error instanceof ApiError && REFUSED_AS_ANOTHER_TYPE.includes(error.code)) return null;
        throw error;
      }
    },
    refuse: (image) => {
      setRefusal(companyLogoTypeRefusal(image));
      letGo(image);
    },
    saved: letGo,
    dismiss: () => setRefusal(null),
  };
}
