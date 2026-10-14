'use client';
import type { FileErrorCode } from '@heliogrid/contracts';
import {
  type ChosenImage,
  COMPANY_LOGO_LIMITS,
  type CompanyLogoCaptureFacts,
  type CompanyLogoRefusal,
  companyLogoRefusal,
  companyLogoTypeRefusal,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';

/** An image as an app hands it over: what the device read of it, its bytes, and a picture to draw. */
export interface ChosenLogo extends ChosenImage {
  readonly bytes: Uint8Array;
  /** Something the device can draw before anything is stored; `null` where it has none. */
  readonly picture: string | null;
}

/** The api's answers that mean the bytes are not the type the device declared. */
const ANOTHER_TYPE: readonly string[] = [
  'FILE_CONTENT_MISMATCH',
  'FILE_TYPE_NOT_TAKEN',
] satisfies readonly FileErrorCode[];

export interface CompanyLogo {
  readonly facts: CompanyLogoCaptureFacts;
  readonly picture: string | null;
  /** The image the next save stores; `null` when none was chosen, or the last one was refused. */
  readonly chosen: ChosenLogo | null;
  choose(image: ChosenLogo): void;
  /**
   * Stores the image and answers its file's id, or `null` when the api read another type in its
   * bytes. An image stored once is never stored again: a save that failed after this step is sent
   * again with the same file.
   */
  store(image: ChosenLogo): Promise<string | null>;
  /** The api refused the image a save sent: it is dropped, with the type's refusal at its field. */
  refuse(image: ChosenLogo): void;
  /** The save that sent the image landed: the profile holds it now. */
  saved(image: ChosenLogo): void;
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
  const [chosen, setChosen] = useState<ChosenLogo | null>(null);
  const [refusal, setRefusal] = useState<CompanyLogoRefusal | null>(null);
  const storedNow = useRef<{ readonly image: ChosenLogo; readonly fileId: string } | null>(null);
  const link = useQuery({
    queryKey: queryKeys.files.downloadUrl(tenantId, storedFileId ?? ''),
    queryFn: ({ signal }) => repositories.file.downloadUrl(storedFileId ?? '', signal),
    enabled: storedFileId !== null && chosen === null,
    // A new link is another address for the same picture: asking again would only redraw it.
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  });
  // Only the image a save sent is let go: another may have been chosen while that save was out.
  const letGo = (sent: ChosenLogo) => setChosen((held) => (held === sent ? null : held));
  return {
    facts: {
      limits: COMPANY_LOGO_LIMITS,
      refusal,
      held: chosen !== null || storedFileId !== null,
    },
    picture: chosen === null ? (link.data?.url ?? null) : chosen.picture,
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
        if (error instanceof ApiError && ANOTHER_TYPE.includes(error.code)) return null;
        throw error;
      }
    },
    refuse: (image) => {
      setRefusal(companyLogoTypeRefusal(image));
      letGo(image);
    },
    saved: letGo,
  };
}
