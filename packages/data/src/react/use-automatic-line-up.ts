'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import type { SiteLineUp, StudioDocument } from '@heliogrid/domain';
import { useEffect, useState } from 'react';
import type { SiteLineUpReader } from './site-readers';
import type { StudioPicture } from './studio-document-state';

/**
 * The studio's own line-up (`T-M05-002g`, step 1): asked once the straight-down picture and the
 * sky picture the roofs were drawn on are both in, again when the first true length stretches the
 * picture, and kept while another picture shows. None for a design drawn on the straight-down
 * picture (it lies on the map already) or on the company's own picture.
 */
export function useAutomaticLineUp(input: {
  readonly document: StudioDocument | null;
  readonly picture: StudioPicture;
  readonly straightDown: SiteDataWire['straightDown'];
  readonly reader: SiteLineUpReader;
}): SiteLineUp | null {
  const [automatic, setAutomatic] = useState<SiteLineUp | null>(null);
  const { picture, straightDown, reader } = input;
  const drawnOnSky = input.document?.drawnOn?.source !== 'google_solar';
  const ownPicture = input.document?.picture === 'own';
  const scale = input.document?.pictureScale ?? 1;
  const sky = picture.kind === 'sky' && picture.source === 'google' ? picture.pieces : null;
  useEffect(() => {
    if (!drawnOnSky || ownPicture || straightDown === null) {
      setAutomatic(null);
      return;
    }
    if (sky === null) return;
    let live = true;
    void reader({ pieces: sky, straightDown, scale }).then((found) => {
      if (live) setAutomatic(found);
    });
    return () => {
      live = false;
    };
  }, [drawnOnSky, ownPicture, straightDown, sky, scale, reader]);
  return automatic;
}
