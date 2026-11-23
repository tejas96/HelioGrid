'use client';
import type { DesignPictureWire } from '@heliogrid/contracts';
import {
  type GroundBox,
  type GroundPoint,
  type History,
  historyAfter,
  METRES_PER_PLAN_UNIT,
  type OwnPictureSay,
  ownPictureRemoved,
  ownPictureTurned,
  type PlanSnap,
  type PlanUnit,
  planHidden,
  planLocked,
  planMoved,
  planPaged,
  planRemoved,
  planSeenThrough,
  planSnapAt,
  planTapAt,
  planTurned,
  planUnitPicked,
  roofFromPlanOutline,
  SNAP_M,
  type StudioDocument,
} from '@heliogrid/domain';
import { type MutableRefObject, useEffect, useState } from 'react';
import { aKey } from '../client/creation-key';
import {
  landedBoxOf,
  ownSayOf,
  type PlanShown,
  planDragged,
  planShownOf,
  type UnitCard,
  unitCardOf,
} from './own-picture-view';
import { type StudioPicture, stampOf, tracedOnOf } from './studio-document-state';
import { useDesignPicture, usePlanLines } from './use-design-picture';
import { type OwnPictureJob, type PictureFile, useOwnPictureFlow } from './use-own-picture';

/**
 * Your picture and the plan, as the studio draws them and acts on them (`T-M05-002d`): the reading
 * pill, the North card, the plan with its card and handles, the unit card, and every act — each one
 * change of the document, so one Undo takes it back.
 */

export interface OwnPictureView {
  readonly job: OwnPictureJob;
  /** The North card: the ground's own picture's turn, open after a photo or a placeless map lands. */
  readonly north: { readonly turnDeg: number } | null;
  readonly plan: PlanShown | null;
  readonly unitCard: UnitCard | null;
  /**
   * What just landed, for the camera to frame once: the plan or your picture's ground, a new object
   * each landing; `null` until one lands.
   */
  readonly landed: { readonly box: GroundBox } | null;
  /** A card of your picture's is open: the studio's job is it (focus). */
  readonly cardOpen: boolean;
  /** What the bar says about your picture now; `null` leaves the bar its own line. */
  readonly say: OwnPictureSay | null;
  /** The last drawn spot lies on the plan: where, and on its corner or its line, for its tag. */
  readonly planSnap: PlanSnap | null;
}

export interface OwnPictureMoves {
  pickFile(file: PictureFile): void;
  stopReading(): void;
  dismissRefusal(): void;
  turnPicture(deg: number): void;
  closeNorth(): void;
  removePicture(): void;
  pickPlan(picked: boolean): void;
  /**
   * A handle dragged from one spot of the ground to another: the move handle carries the plan, the
   * turn handle turns it about its middle in 5° steps. Drawn there while in hand, kept when `done`;
   * `null` puts it back as it was.
   */
  dragPlan(handle: 'move' | 'turn', from: GroundPoint, to: GroundPoint | null, done: boolean): void;
  turnPlan(deg: number): void;
  seePlanThrough(percent: number): void;
  lockPlan(locked: boolean): void;
  hidePlan(hidden: boolean): void;
  removePlan(): void;
  pagePlan(by: -1 | 1): void;
  pickUnit(unit: PlanUnit): void;
  closeUnit(): void;
  /** A later frame took the camera: the landing is over, and Home frames the roofs again. */
  landingDone(): void;
  /** A tapped closed outline made into a roof; `false` when it is no roof's shape or meets one. */
  roofFromOutline(line: number): boolean;
  /**
   * A tap on the ground in the top view, for the plan (board 4.3): an outline makes its roof, a tap
   * on the plan picks it, one off a picked plan puts it down. `false`: the plan let the tap through.
   */
  tapPlan(spot: GroundPoint): boolean;
  /**
   * A spot drawn with the magnet on, onto the plan's nearest corner or line within the magnet's
   * reach (board 4.6); as it was with none near. Its tag names what it lies on.
   */
  snapSpot(spot: GroundPoint | null, magnet: boolean): GroundPoint | null;
}

export function useOwnPictureScreen(input: {
  readonly designId: string;
  readonly document: StudioDocument | null;
  readonly picture: StudioPicture;
  readonly latest: MutableRefObject<History<StudioDocument> | null>;
  readonly change: (next: History<StudioDocument>) => void;
  readonly editable: boolean;
}): { readonly view: OwnPictureView; readonly moves: OwnPictureMoves } {
  const [northOpen, setNorthOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [planPicked, setPlanPicked] = useState(false);
  // An act's line holds until the design changes again.
  const [said, setSaid] = useState<{ say: OwnPictureSay; on: StudioDocument } | null>(null);
  const [planSnap, setPlanSnap] = useState<PlanSnap | null>(null);
  const [landing, setLanding] = useState<'plan' | 'picture' | null>(null);
  const [inHand, setInHand] = useState<{ at: GroundPoint; turnDeg: number } | null>(null);
  const flow = useOwnPictureFlow({
    designId: input.designId,
    latest: input.latest,
    change: input.change,
    editable: input.editable,
    laid: (what) => {
      setLanding(what === 'plan' || what === 'plan-unitless' ? 'plan' : 'picture');
      setNorthOpen(what === 'photo' || what === 'placeless');
      setPlanPicked(what === 'plan' || what === 'plan-unitless');
      setUnitOpen(what === 'plan-unitless');
    },
  });

  const laidPlan = input.document?.plan ?? null;
  const planRead = useDesignPicture(input.designId, laidPlan?.pictureId ?? null);
  const planPicture: DesignPictureWire | null = planRead.kind === 'ready' ? planRead.value : null;
  const linesRead = usePlanLines(planPicture, laidPlan?.page ?? 1);

  const commit = (next: (present: StudioDocument) => StudioDocument | null) => {
    const at = input.latest.current;
    if (!input.editable || at === null) return;
    const changed = next(at.present);
    if (changed !== null && changed !== at.present) input.change(historyAfter(at, changed));
  };

  const shownPlan = laidPlan === null || inHand === null ? laidPlan : { ...laidPlan, ...inHand };
  const plan = planShownOf(shownPlan, planPicture, linesRead, planPicked && input.editable);
  const unitCard = unitOpen ? unitCardOf(plan) : null;
  const own = input.document?.ownPicture ?? null;
  const landedBox = landedBoxOf(landing, plan, input.picture);
  // One object per landing, made as soon as its ground is known: the camera frames it once, and a
  // drag of the plan or a later act never makes a new one.
  const [landed, setLanded] = useState<{ readonly box: GroundBox } | null>(null);
  useEffect(() => {
    if (landing === null || landedBox === null) return;
    setLanded({ box: landedBox });
    setLanding(null);
  }, [landing, landedBox]);

  /** The bar says what an act did, on the design the act left. */
  const sayAfter = (say: OwnPictureSay) => {
    const now = input.latest.current?.present;
    if (now !== undefined) setSaid({ say, on: now });
  };

  const roofFromOutline = (line: number): boolean => {
    const outline = plan?.lines.lines[line];
    const at = input.latest.current;
    if (outline === undefined || !outline.closed || at === null || !input.editable) return false;
    const made = roofFromPlanOutline(at.present, outline.points, {
      id: aKey(),
      tracedOn: tracedOnOf(input.picture),
      stamp: stampOf(input.picture),
    });
    if (made.kind !== 'made') return false;
    setPlanPicked(false);
    input.change(historyAfter(at, made.document));
    // A plan at our guess asks for one length; one at its true scale says its lengths are its own.
    const guessed = made.document.plan?.scaleFrom === 'guess';
    setSaid({ say: guessed ? 'plan_to_size' : 'made_from_plan', on: made.document });
    return true;
  };

  return {
    view: {
      job: flow.job,
      north: northOpen && own != null && input.editable ? { turnDeg: own.turnDeg } : null,
      plan,
      unitCard,
      landed,
      planSnap,
      cardOpen: unitCard !== null || plan?.picked === true || (northOpen && own != null),
      say: ownSayOf(
        said !== null && said.on === input.document ? said.say : null,
        input.document,
        input.picture,
        plan,
      ),
    },
    moves: {
      pickFile: flow.pick,
      stopReading: flow.stop,
      dismissRefusal: flow.dismiss,
      turnPicture: (deg) => commit((present) => ownPictureTurned(present, deg)),
      closeNorth: () => setNorthOpen(false),
      removePicture: () => {
        setNorthOpen(false);
        commit(ownPictureRemoved);
      },
      pickPlan: (picked) => setPlanPicked(picked && laidPlan !== null && !laidPlan.locked),
      dragPlan: (handle, from, to, done) => {
        if (laidPlan === null || laidPlan.locked || plan === null) return;
        if (to === null) {
          setInHand(null);
          return;
        }
        const { at, turnDeg } = planDragged(laidPlan, plan.middle, handle, from, to);
        if (!done) {
          setInHand({ at, turnDeg });
          return;
        }
        setInHand(null);
        commit((present) => planTurned(planMoved(present, at), turnDeg));
      },
      turnPlan: (deg) => commit((present) => planTurned(present, deg)),
      seePlanThrough: (percent) => commit((present) => planSeenThrough(present, percent)),
      lockPlan: (locked) => {
        if (locked) setPlanPicked(false);
        commit((present) => planLocked(present, locked));
        if (locked) sayAfter('plan_locked');
      },
      hidePlan: (hidden) => {
        // A hidden plan is put down: no card, no handles, nothing to drag.
        if (hidden) setPlanPicked(false);
        commit((present) => planHidden(present, hidden));
      },
      removePlan: () => {
        setPlanPicked(false);
        setUnitOpen(false);
        commit(planRemoved);
        sayAfter('plan_removed');
      },
      pagePlan: (by) => {
        const pages = planPicture?.facts?.pages ?? 1;
        const page = laidPlan === null ? 1 : ((laidPlan.page - 1 + by + pages) % pages) + 1;
        commit((present) => planPaged(present, page));
      },
      pickUnit: (unit) => {
        if (plan === null) return;
        const { extent } = plan.lines;
        commit((present) => planUnitPicked(present, METRES_PER_PLAN_UNIT[unit], extent));
      },
      closeUnit: () => setUnitOpen(false),
      landingDone: () => setLanded(null),
      snapSpot: (spot, magnet) => {
        const snapped =
          spot === null || !magnet || plan === null
            ? null
            : planSnapAt(plan.laid, plan.lines.lines, spot, SNAP_M);
        setPlanSnap(snapped);
        return snapped?.point ?? spot;
      },
      tapPlan: (spot) => {
        if (plan === null || !input.editable) return false;
        const tap = planTapAt(plan.laid, plan.lines, plan.picked, spot);
        if (tap.kind === 'pick') setPlanPicked(true);
        if (tap.kind === 'put_down') setPlanPicked(false);
        if (tap.kind === 'outline') return roofFromOutline(tap.line);
        return tap.kind !== 'none';
      },
      roofFromOutline,
    },
  };
}
