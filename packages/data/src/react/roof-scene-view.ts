'use client';
import {
  NO_ROOF_LIST,
  NO_ROOF_SCENE,
  type NumberAt,
  type RoofFacts,
  type RoofHeight,
  type RoofSheetView,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  heightPullOf,
  roofListOf,
  roofNumberSet,
  roofSceneOf,
  roofSheetRowsOf,
  roofsAreaM2,
  roofsWorked,
  roofTopMarksOf,
  sideSheetRowsOf,
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
  sheetRows: null,
  sideRows: null,
};

/** The open sheet's roof, the side whose sheet shows over it, and the height slider's ends. */
export interface SheetOpen {
  readonly roof: number;
  readonly side: number | null;
  readonly slide: { readonly min: number; readonly max: number };
}

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
  /** The sheet open over the model, and a number moving on its slider, not kept yet. */
  open: SheetOpen | null = null,
  numberInHand: { readonly at: NumberAt; readonly value: number } | null = null,
): RoofModelShown {
  if (document === null) return NOTHING;
  const roofs =
    inHand === null
      ? document.roofs
      : document.roofs.map((roof, index) =>
          index === inHand.roof ? { ...roof, height: inHand.height } : roof,
        );
  const held = { ...document, roofs };
  const shown =
    numberInHand === null ? held : roofNumberSet(held, numberInHand.at, numberInHand.value, facts);
  const latitude = pin?.latitude ?? 0;
  const worked = roofsWorked(shown, facts, latitude, memory.before);
  memory.before = { document: shown, worked };
  const roofList = roofListOf(shown, facts, worked);
  const row = open === null ? undefined : roofList.rows.find((each) => each.roof === open.roof);
  return {
    scene: roofSceneOf(shown, facts, worked),
    topMarks: roofTopMarksOf(shown, facts, worked),
    roofList,
    roofsAreaM2: roofsAreaM2(shown),
    sheetRows:
      open === null || row === undefined
        ? null
        : roofSheetRowsOf(shown, open.roof, facts, worked, row, latitude, open.slide),
    sideRows:
      open === null || open.side === null
        ? null
        : sideSheetRowsOf(shown, open.roof, open.side, facts, worked, latitude),
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
  /** The side whose sheet shows over the roof's, and the number in hand. */
  side: number | null = null,
  numberInHand: { readonly at: NumberAt; readonly value: number } | null = null,
): RoofModelShown {
  const memory = useRef<RoofMemory>({});
  const open = sheet?.roof ?? null;
  const held = sheet?.height.metres;
  const setBy = sheet?.height.setBy;
  const min = sheet?.slide.min;
  const max = sheet?.slide.max;
  return useMemo(() => {
    const inHand =
      open === null || held === undefined || setBy === undefined
        ? null
        : { roof: open, height: { metres: held, setBy } };
    const sheetOpen =
      open === null || min === undefined || max === undefined
        ? null
        : { roof: open, side, slide: { min, max } };
    return roofModelShown(shown, facts, inHand, pin, memory.current, sheetOpen, numberInHand);
  }, [shown, facts, open, held, setBy, pin, side, numberInHand, min, max]);
}
