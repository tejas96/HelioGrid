import {
  type History,
  kindLineOf,
  materialForSite,
  type RoofFacts,
  type RoofStepEvent,
  type RoofStepState,
  type SiteRoofHint,
  type StudioDocument,
} from '@heliogrid/domain';
import { meetingOf, meetingOfRoof, roofCutToEdge } from '@heliogrid/domain/studio-kernel';
import type { RefObject } from 'react';
import { aKey } from '../client/creation-key';
import type { ClosePlacing, RoofPlaceMoves } from './roof-step-view';

/**
 * A roof's place among the others (`T-M05-002`, part e), asked of the studio's kernel: how a
 * closed roof meets the roofs already standing, and the chips that fix a wrong guess. The roof
 * step decides; this only hands it what the kernel worked out.
 */

/** The placing for a roof closed on a design as it stands. */
export function closePlacingOf(
  facts: RoofFacts,
  /** What the host knows of the site's roof: the first roof starts as it. */
  siteRoof: SiteRoofHint | null | undefined,
): (document: StudioDocument) => ClosePlacing {
  return (document) => ({
    meet: (corners) => meetingOf(document, corners, facts),
    facts,
    ...(siteRoof == null ? {} : { siteMaterial: materialForSite(siteRoof) }),
  });
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
      const line = kindLineOf(step.current);
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
    copyRoof: (roof) => {
      const design = latest.current?.present;
      if (design === undefined) return;
      // One new name for the copy and for each roof that goes with it.
      act({ kind: 'copy_roof', roof, ids: design.roofs.map(() => aKey()) });
    },
    deleteRoofAt: (roof) => act({ kind: 'delete_roof', roof }),
  };
}
