import {
  type History,
  kindLineOf,
  materialForSite,
  type RoofFacts,
  type RoofStepEvent,
  type RoofStepState,
  roofHeightOf,
  roofStartHeightM,
  SITE_ROOF_HINTS,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  edgesOf,
  handFaceClosed,
  meetingOf,
  meetingOfRoof,
  roofCutToEdge,
} from '@heliogrid/domain/studio-kernel';
import type { RefObject } from 'react';
import { aKey } from '../client/creation-key';
import type { ClosingWith, RoofPlaceMoves } from './roof-step-view';

/**
 * A roof's place among the others (`T-M05-002`, part e), asked of the studio's kernel: how a
 * closed roof meets the roofs already standing, and the chips that fix a wrong guess. The roof
 * step decides; this only hands it what the kernel worked out.
 */

/** The placing for a roof closed on a design as it stands. */
export function closingOf(
  facts: RoofFacts,
  /**
   * What the host knows of the site's roof: the first roof starts as it. A hint this studio does
   * not know — a later host's — is none.
   */
  siteRoof: string | null | undefined,
  /** The site's pin: its latitude says which side a face drawn by hand first slopes down to. */
  pin: { readonly latitude: number } | null,
): (document: StudioDocument, faces: number | undefined) => ClosingWith {
  const hint = SITE_ROOF_HINTS.find((known) => known === siteRoof);
  const latitude = pin?.latitude ?? 0;
  // A roof closed takes its place among the others; a face drawn by hand closes onto roof `faces`.
  return (document, faces) =>
    faces === undefined
      ? {
          placing: {
            meet: (corners) => meetingOf(document, corners, facts),
            facts,
            ...(hint === undefined ? {} : { siteMaterial: materialForSite(hint) }),
          },
        }
      : { face: (corners) => handFaceClosed(document, faces, corners, facts, latitude) };
}

type Act = (event: RoofStepEvent) => void;

/** Join: the new roof and the roof it meets at its own height, on the one outline they make. */
function join(design: StudioDocument, roof: number, facts: RoofFacts, act: Act) {
  const corners = design.roofs[roof]?.corners ?? [];
  const { joined, joinWith } = meetingOfRoof(design, roof, corners, facts);
  if (joined !== null && joinWith !== null) {
    act({ kind: 'join', roof, with: joinWith, outline: joined });
  }
}

/** Cut to edge: the new roof trimmed to the others' edge, and placed again by how it meets them now. */
function cut(design: StudioDocument, roof: number, facts: RoofFacts, act: Act) {
  const corners = roofCutToEdge(design, roof);
  if (corners === null) return;
  const meeting = meetingOfRoof(design, roof, corners, facts);
  act({ kind: 'cut_to_edge', roof, corners, placing: { meeting, facts } });
}

export function roofPlaceMoves({
  latest,
  step,
  act,
  facts,
}: {
  latest: RefObject<History<StudioDocument> | null>;
  step: RefObject<RoofStepState>;
  act: Act;
  facts: RoofFacts;
}): RoofPlaceMoves {
  return {
    chooseKind: (choice) => {
      const design = latest.current?.present;
      const line = design === undefined ? null : kindLineOf(step.current, design);
      if (design === undefined || line === null) return;
      if (choice !== 'join' && choice !== 'cut_to_edge') {
        act({ kind: 'make', roof: line.roof, into: choice, facts });
        return;
      }
      // Join and Cut to edge act on a roof that stands by itself: a joined one is parted first.
      if (line.joined !== null) return;
      if (choice === 'join') join(design, line.roof, facts, act);
      else cut(design, line.roof, facts, act);
    },
    toggleSideWall: (roof, side) => {
      const design = latest.current?.present;
      if (design === undefined) return;
      // A side has a wall where any stretch of it has one: a tap takes it off, else adds one.
      const walls = edgesOf(design, roof, facts).map((stretches) => stretches.some((s) => s.wall));
      const wall = walls[side] !== true;
      const walled = walls.filter((has, i) => (i === side ? wall : has)).length;
      act({ kind: 'side_wall', roof, side, wall, walled });
    },
    pickRoof: (index) => {
      const design = latest.current?.present;
      const roof = design?.roofs[index];
      if (design === undefined || roof === undefined) return;
      const metres = roofHeightOf(roof, roofStartHeightM(design, roof, facts)).metres;
      act({ kind: 'pick_roof', roof: index, metres });
    },
    copyRoof: (roof) => {
      const design = latest.current?.present;
      if (design === undefined) return;
      // One new name for the copy and for each roof that goes with it.
      act({ kind: 'copy_roof', roof, ids: design.roofs.map(() => aKey()) });
    },
    deleteRoofAt: (roof) => act({ kind: 'delete_roof', roof }),
  };
}
