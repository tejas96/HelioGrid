'use client';
import {
  NO_ROOF_LIST,
  NO_ROOF_SCENE,
  type RoofFacts,
  type RoofHeight,
  type RoofSheetView,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  heightPullOf,
  roofListOf,
  roofSceneOf,
  roofsAreaM2,
  roofsWorked,
  roofTopMarksOf,
  type WorkedBefore,
} from '@heliogrid/domain/studio-kernel';
import { useMemo, useRef } from 'react';
import type { RoofModelShown } from './roof-model-shown';

/**
 * What the kernel worked out of the design last drawn: the next one reuses every roof's answers an
 * edit did not touch, so a corner dragged on a site of 200 roofs works out a handful of them.
 */
export interface RoofMemory {
  before?: WorkedBefore;
}

const NOTHING: RoofModelShown = {
  scene: NO_ROOF_SCENE,
  topMarks: [],
  roofList: NO_ROOF_LIST,
  roofsAreaM2: 0,
};

/**
 * The design as it stands, or the preview of what is in hand, with the open sheet's height where
 * it is in hand (`T-M05-002`, part e). The kernel splits each side and builds each sloped roof
 * once, and the 3D model and the top view's marks both read that.
 */
export function roofModelShown(
  document: StudioDocument | null,
  facts: RoofFacts,
  /** The open sheet's roof and the height it stands at now, the one in hand included. */
  inHand: { readonly roof: number; readonly height: RoofHeight } | null,
  /** The site's pin: its latitude says which way a one-way slope first faces. */
  pin: { readonly latitude: number } | null,
  memory: RoofMemory,
): RoofModelShown {
  if (document === null) return NOTHING;
  const roofs =
    inHand === null
      ? document.roofs
      : document.roofs.map((roof, index) =>
          index === inHand.roof ? { ...roof, height: inHand.height } : roof,
        );
  const shown = { ...document, roofs };
  const worked = roofsWorked(shown, facts, pin?.latitude ?? 0, memory.before);
  memory.before = { document: shown, worked };
  return {
    scene: roofSceneOf(shown, facts, worked),
    topMarks: roofTopMarksOf(shown, facts, worked),
    roofList: roofListOf(shown, facts, worked),
    roofsAreaM2: roofsAreaM2(shown),
  };
}

/** The magnet for a dragged height: the kernel's pull while the magnet is on, none while it is off. */
export function heightPullWith(facts: RoofFacts, magnetOn: () => boolean) {
  return (design: StudioDocument, roof: number, metres: number, reachM: number) =>
    magnetOn() ? heightPullOf(design, roof, facts, metres, reachM) : null;
}

/**
 * The model of the design drawn, built again only when the design drawn, the open sheet's roof or
 * its height changes. The sheet is a new object on each render: the model reads the roof and the
 * height it holds, never the object.
 */
export function useRoofModel(
  shown: StudioDocument | null,
  facts: RoofFacts,
  sheet: RoofSheetView | null,
  pin: { readonly latitude: number } | null,
): RoofModelShown {
  const memory = useRef<RoofMemory>({});
  const open = sheet?.roof ?? null;
  const held = sheet?.height.metres;
  const setBy = sheet?.height.setBy;
  return useMemo(() => {
    const inHand =
      open === null || held === undefined || setBy === undefined
        ? null
        : { roof: open, height: { metres: held, setBy } };
    return roofModelShown(shown, facts, inHand, pin, memory.current);
  }, [shown, facts, open, held, setBy, pin]);
}
