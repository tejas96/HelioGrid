'use client';
import {
  type PhotoReader,
  type RoofDresses,
  type RoofScene,
  type RoofSwatch,
  roofDressesOf,
} from '@heliogrid/domain';
import { useMemo } from 'react';

/**
 * What each roof of a 3D model wears (`T-M05-002`, part e, roof looks), worked out again only when
 * the model, the picture or the colours change. The screen hands in the picture as it reads it and
 * the theme's colours; the rule is domain's (`roof-dress.ts`).
 */
export function useRoofDresses(
  scene: RoofScene,
  picture: PhotoReader | null,
  pictureComing: boolean,
  colours: Readonly<Record<RoofSwatch, string>>,
): RoofDresses {
  return useMemo(
    () => roofDressesOf(scene, picture, pictureComing, colours),
    [scene, picture, pictureComing, colours],
  );
}
