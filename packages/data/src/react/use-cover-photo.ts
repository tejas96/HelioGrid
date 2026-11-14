'use client';
import { COMPANY_LOGO_LIMITS, type CoverPicture, companyLogoRefusal } from '@heliogrid/domain';
import { useState } from 'react';
import { useAction } from './action';
import { useRepositories } from './context';
import type { ChosenPicture } from './use-company-logo';

/** The company's own cover photo on Proposal defaults (`T-M01-030`), as both screens consume it. */
export interface CoverPhoto {
  /** A picture to draw: the one just chosen, else the saved one's address; `null` while none is held. */
  readonly picture: string | null;
  /** The photo held, as the template names it; `null` while the company has none. */
  readonly held: CoverPicture | null;
  /** The chosen image is being stored. */
  readonly storing: boolean;
  /** The device or the api refused the last image, or it did not store. */
  readonly refused: boolean;
  /** Checks the image on the device, stores it as the company's file and hands back its picture. */
  choose(image: ChosenPicture): void;
}

/**
 * A photo is a company file like its logo (`tenant` subject: PNG or JPG, the logo's own size
 * limit), stored the moment it is chosen so the page beside it can draw it; `onStored` then names it
 * in the draft, which reaches the server only with *Save*.
 */
export function useCoverPhoto(
  tenantId: string,
  saved: { readonly picture: CoverPicture | undefined; readonly url: string | null },
  onStored: (picture: CoverPicture) => void,
): CoverPhoto {
  const repositories = useRepositories();
  const [chosen, setChosen] = useState<{ picture: string | null; held: CoverPicture } | null>(null);
  const [refusedOnDevice, setRefusedOnDevice] = useState(false);
  const store = useAction(
    async (image: ChosenPicture) => {
      const contentType = COMPANY_LOGO_LIMITS.contentTypes.find(
        (taken) => taken === image.contentType,
      );
      if (contentType === undefined) throw new Error('not an image this company may store');
      const file = await repositories.file.store({
        subjectKind: 'tenant',
        subjectRef: tenantId,
        contentType,
        bytes: image.bytes,
      });
      return { picture: image.picture, held: { kind: 'own', fileId: file.id } as const };
    },
    {
      onDone: (stored) => {
        setChosen(stored);
        onStored(stored.held);
      },
    },
  );
  const savedOwn = saved.picture?.kind === 'own' ? saved.picture : null;
  return {
    picture: chosen?.picture ?? (savedOwn === null ? null : saved.url),
    held: chosen?.held ?? savedOwn,
    storing: store.pending,
    refused: refusedOnDevice || store.failure !== null,
    choose: (image) => {
      const refused = companyLogoRefusal(image, COMPANY_LOGO_LIMITS) !== null;
      setRefusedOnDevice(refused);
      store.clear();
      if (!refused) void store.run(image);
    },
  };
}
