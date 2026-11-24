'use client';
import {
  type GroundPoint,
  NO_ROOF_LIST,
  NO_ROOF_SCENE,
  type NumberAt,
  type RoofFacts,
  type RoofHeight,
  type RoofHit,
  type RoofSheetView,
  type RoofsEdges,
  type SceneDrawn,
  type SightAt,
  type StairsDrop,
  type StairsPlace,
  type StudioDocument,
  stairsAsk,
  stairsDropOf,
  stairsOf,
  stairsPlaced,
} from '@heliogrid/domain';
import {
  heightPullOf,
  roofHitOf,
  roofListOf,
  roofNumberSet,
  roofSceneOf,
  roofSheetRowsOf,
  roofsAreaM2,
  roofsWorked,
  roofTopMarksOf,
  sceneMotionOf,
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
  /** The model last drawn, which the next one moves on from, and how many motions it has played. */
  drawn?: SceneDrawn;
  motions?: number;
}

/** The model's move into the design now, numbered so the screen plays each once; `null` with none. */
function motionOf(memory: RoofMemory, now: SceneDrawn): RoofModelShown['motion'] {
  const before = memory.drawn;
  memory.drawn = now;
  if (before === undefined || before.document === now.document) return null;
  const motion = sceneMotionOf(before, now);
  if (motion === null) return null;
  memory.motions = (memory.motions ?? 0) + 1;
  return { ...motion, id: memory.motions };
}

const NOTHING: RoofModelShown = {
  scene: NO_ROOF_SCENE,
  topMarks: [],
  roofList: NO_ROOF_LIST,
  roofsAreaM2: 0,
  sheetRows: null,
  sideRows: null,
  stairs: null,
  stairsAsk: false,
  motion: null,
};

/** The stairs where a drag holds them, else where they stand; and whether the bar asks for them. */
function stairsSeen(
  document: StudioDocument,
  edges: RoofsEdges,
  clearPathM: number,
  inHand: StairsPlace | null,
): Pick<RoofModelShown, 'stairs' | 'stairsAsk'> {
  const stairs = stairsOf(
    inHand === null ? document : stairsPlaced(document, inHand),
    edges,
    clearPathM,
  );
  return { stairs, stairsAsk: stairsAsk(document, stairs) };
}

/** The model drawn, and what a tap on it lands on: the screen hook's, never shown. */
export interface RoofModelSeen extends RoofModelShown {
  /**
   * `beside`: the tap's line of sight a finger's half-width to the side. `open`: the roof whose
   * sheet is open — a second tap on its top picks the roof under it.
   */
  hitAt(at: SightAt, beside: SightAt, open: number | null): RoofHit | null;
  /** Where the stairs land, dropped or tapped at a point of the plan. */
  stairsDropAt(at: GroundPoint, reachM: number, magnet: boolean): StairsDrop | null;
}

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
  /** The stairs held by a drag, not kept yet: they show there. */
  stairsInHand: StairsPlace | null = null,
): RoofModelSeen {
  if (document === null) return { ...NOTHING, hitAt: () => null, stairsDropAt: () => null };
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
  const scene = roofSceneOf(shown, facts, worked);
  const row = open === null ? undefined : roofList.rows.find((each) => each.roof === open.roof);
  return {
    scene,
    hitAt: (at, beside, open) => roofHitOf(shown, scene, worked, facts, at, beside, open),
    topMarks: roofTopMarksOf(shown, facts, worked, latitude),
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
    ...stairsSeen(shown, worked.edges, facts.clearPathM, stairsInHand),
    motion: motionOf(memory, { document: shown, scene }),
    stairsDropAt: (at, reachM, magnet) => stairsDropOf(shown, worked.edges, at, reachM, magnet),
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
  stairsInHand: StairsPlace | null = null,
): RoofModelSeen {
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
    return roofModelShown(
      shown,
      facts,
      inHand,
      pin,
      memory.current,
      sheetOpen,
      numberInHand,
      stairsInHand,
    );
  }, [shown, facts, open, held, setBy, pin, side, numberInHand, min, max, stairsInHand]);
}
