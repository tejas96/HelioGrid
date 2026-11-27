'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import {
  type GroundPoint,
  type History,
  type LidarEvent,
  type LidarView,
  lidarFootOf,
  lidarHintOf,
  lidarTopFixOf,
  type Read,
  type RoofFacts,
  type RoofName,
  type RoofSunlight,
  roofNameOf,
  type SightAt,
  type SiteLineUp,
  type SiteReads,
  type StudioDocument,
  topTagSpotsOf,
} from '@heliogrid/domain';
import { buildingsOf, roofMovedSinceOpening, roofsMoved } from '@heliogrid/domain/studio-kernel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { lidarMovesOf } from './lidar-moves';
import { lidarPicksOf } from './lidar-picks';
import type { LidarScreen } from './lidar-view';
import type { HeightLayer } from './site-layer';
import { useLidarScan } from './use-lidar-scan';

/**
 * LiDAR in the studio's 3D view (`T-M05-002g`): the view's state (`lidarViewAfter`), the scan, and
 * Move — the roofs moved, matched to the scan or put back as drawn, each one change of the design's
 * history. While picked roofs are dragged, `preview` is the design with them where the drag holds
 * them, for the model to show; the history takes the move once the drag ends.
 */

/** A roof's sunlight as one share: the mean of its cells; `null` with none. */
function shareOf(sunlight: RoofSunlight | undefined): number | null {
  if (sunlight === undefined || sunlight.cells.length === 0) return null;
  return sunlight.cells.reduce((sum, cell) => sum + cell.share, 0) / sunlight.cells.length;
}

interface LidarInput {
  readonly designId: string;
  readonly view: LidarView;
  readonly dispatch: (event: LidarEvent) => void;
  readonly history: History<StudioDocument> | null;
  readonly latest: { current: History<StudioDocument> | null };
  readonly change: (next: History<StudioDocument>) => void;
  readonly editable: boolean;
  readonly facts: RoofFacts;
  readonly site: {
    readonly read: Read<SiteDataWire>;
    readonly reads: SiteReads | null;
    readonly lineUp: SiteLineUp;
    readonly sunlight: Readonly<Record<string, RoofSunlight>> | null;
    readonly layers: readonly HeightLayer[];
    readonly dragMap: (to: GroundPoint) => void;
    /** Google's straight-down picture shows in the top view. */
    readonly straightDown: boolean;
  };
  /** Each roof's own height, as it stands now. */
  readonly heights: readonly { readonly metres: number }[];
  readonly undo: () => void;
  /** The camera is in the top view: LiDAR, which is 3D only, turns the view to 3D first. */
  readonly topView: boolean;
  readonly see: (view: '3d') => void;
  /** LiDAR turning on: what is open over the studio (Roofs, a roof's sheet) closes first. */
  readonly closeOpen: () => boolean;
  /** The roof a line of sight meets on the model, read when the tap comes. */
  readonly hitAt: (at: SightAt, beside: SightAt) => number | null;
  /** The studio's magnet is on, as its switch and Alt have it now. */
  readonly magnet: () => boolean;
}

export function useLidar(input: LidarInput): {
  readonly screen: LidarScreen;
  readonly preview: StudioDocument | null;
  /** Esc or the phone's back while LiDAR is on: `false` with LiDAR off. */
  readonly back: () => boolean;
} {
  const { view, history, editable, facts, site } = input;
  const heightOf = (index: number) => input.heights[index]?.metres ?? 0;
  const nameOf = (index: number): RoofName =>
    (document === null ? null : roofNameOf(document, index)) ?? { kind: 'roof', number: index + 1 };
  const document = history?.present ?? null;
  const buildings = useMemo(() => (document === null ? [] : buildingsOf(document)), [document]);
  const { scan, photo, fits, lastFits, mesh, retry } = useLidarScan({
    designId: input.designId,
    on: view.on,
    fitsWanted: input.topView && site.straightDown && editable && !view.footShut,
    read: site.read,
    document,
    buildings,
    lineUp: site.lineUp,
    layers: site.layers,
  });

  const [heightPick, setHeightPick] = useState(0);
  const [holding, setHolding] = useState(false);
  const [drag, setDrag] = useState<GroundPoint | null>(null);
  const [onScan, setOnScan] = useState(false);
  const [movedM, setMovedM] = useState<number | null>(null);
  const [mapDrag, setMapDrag] = useState<SiteLineUp | null>(null);
  const dragBase = useRef<History<StudioDocument> | null>(null);
  // A new pick, or Move closed, ends the last move's message and the slider's choice.
  const pickKey = `${view.move === null}:${(view.move?.picked ?? []).join()}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new pick is what clears them
  useEffect(() => {
    setMovedM(null);
    setHeightPick(0);
  }, [pickKey]);

  const roofs = document?.roofs ?? [];
  const ids = (indices: readonly number[]) =>
    indices.flatMap((i) => (roofs[i] === undefined ? [] : [roofs[i].id]));
  const picks = lidarPicksOf({
    ...{ document, view, buildings, fits, lastFits },
    ...{ facts, heightPick, heightOf },
  });
  const { picked, pickedBuildings, heightIndex, offBuildings } = picks;
  const opening = history?.past[0] ?? history?.present ?? null;
  const moment = {
    view,
    scanIn: scan === 'in',
    canEdit: editable,
    picked: picked.length,
    draggedM: drag === null ? null : Math.hypot(drag.east, drag.north),
    holding,
    onScan,
    movedM,
    offSpot: offBuildings.length > 0,
  };

  const reads = site.reads?.roofs ?? {};
  const scanHere = (index: number) => {
    const read = reads[roofs[index]?.id ?? ''];
    return read?.kind === 'roof' ? read.heightM : null;
  };
  const sunOf = (index: number) => shareOf(site.sunlight?.[roofs[index]?.id ?? '']);
  const cardIndex = !editable && view.move !== null ? (picked[0] ?? null) : null;
  const base = dragBase.current;
  const roots = pickedBuildings.flatMap((b) => b.roofs);

  const moves = lidarMovesOf({
    ...input,
    ...picks,
    buildings,
    heightIndex,
    opening,
    ids,
    setHeightPick,
    setHolding,
    setDrag,
    setOnScan,
    dragBase,
    setMovedM,
    setMapDrag,
  });
  return {
    preview: drag === null || base === null ? null : roofsMoved(base.present, roots, drag).document,
    back: () => {
      if (!view.on || input.topView) return false;
      input.dispatch({ kind: 'back' });
      return true;
    },
    screen: {
      view,
      scan,
      mesh,
      lineUp: mapDrag ?? site.lineUp,
      photo,
      canEdit: editable,
      buildings: buildings.map((b) => ({
        roofs: b.roofs,
        names: b.roofs.map(nameOf),
        picked: b.members.every((i) => picked.includes(i)),
      })),
      picked,
      heightRoof: picks.heightRoof,
      status: picks.status,
      canMatch: picks.canMatch,
      changed: picked.some((i) => {
        const roof = roofs[i];
        return roof !== undefined && opening !== null && roofMovedSinceOpening(roof, opening);
      }),
      hint: lidarHintOf(moment),
      topFix: lidarTopFixOf({
        topView: input.topView,
        straightDown: site.straightDown,
        offSpot: offBuildings.length > 0,
        canEdit: editable,
        footShut: view.footShut,
      }),
      foot: lidarFootOf(moment),
      // Each pin on its roof's own open top: a stair room standing on a roof carries its own.
      pins: buildings.flatMap((b) => {
        const spots = topTagSpotsOf(b.members.map((index) => roofs[index]?.corners ?? []));
        return b.members.map((index, at) => ({
          index,
          spot: spots[at] ?? { east: 0, north: 0 },
          share: sunOf(index),
          picked: picked.includes(index),
        }));
      }),
      card:
        cardIndex === null
          ? null
          : {
              index: cardIndex,
              name: nameOf(cardIndex),
              heightM: heightOf(cardIndex),
              scanM: scanHere(cardIndex),
              share: sunOf(cardIndex),
            },
      moves: {
        ...moves,
        retryScan: retry,
        // From the top view's bar: LiDAR on, Move open with the buildings off their spot picked.
        fixInLidar: () => {
          if (!input.closeOpen()) return;
          input.see('3d');
          input.dispatch({ kind: 'toggle' });
          moves.fix();
        },
        // From the top view LiDAR opens on the 3D of the roofs.
        toggle: () => {
          if (!view.on) {
            // A sheet whose height in hand is refused stays open, and LiDAR waits for it.
            if (!input.closeOpen()) return;
            if (input.topView) input.see('3d');
          }
          moves.toggle();
        },
      },
    },
  };
}
