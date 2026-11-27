'use client';
import type CameraControlsImpl from 'camera-controls';
import { type Box3, Spherical, type Vector3 } from 'three';
import { type ClearGround, lookRoom, reachOf, seenPerMetre } from './camera-limits';

/** A tilt changed by less than this, in radians, keeps the camera's limits as they are. */
const TILT_STEP = 0.005;

/** What the camera's limits are worked from, as the rig last rendered. */
export interface FramingInputs {
  /** The picture's sharp ground: the camera never shows past it. `null`: the grid. */
  readonly clear: ClearGround | null;
  readonly metresPerPixel: number | null;
  readonly size: { readonly width: number; readonly height: number };
  readonly free: { readonly top: number; readonly bottom: number };
  readonly still: boolean;
  /**
   * LiDAR's dark stage: its edge may show, so the camera goes out until the whole ground fits and
   * looks anywhere on it; else the ground fills the view and its edge never shows.
   */
  readonly whole: boolean;
}

/** Where a frame flies the camera to. */
export interface FrameTo {
  /** The limits never pull the camera nearer than this: it frames what it was flown to see. */
  readonly distance: number;
  /** How far off it flies to, inside its limits. */
  readonly going: number;
  readonly at: Vector3;
  readonly tilt: number;
  /** The compass turn it flies to; `null` keeps the person's. */
  readonly turn: number | null;
  readonly move: boolean;
}

/**
 * How far the studio's camera may come and go, and where it may look (`T-M05-002a`): the picture
 * holds it — out no farther than the picture fills the room the view shows at its tilt, looking
 * only where it stays on the picture; in no nearer than it stays sharp — and a frame it was flown
 * to is never pulled in or pushed off by them.
 */
export class CameraFraming {
  inputs: FramingInputs;
  /** The height the camera last framed at: closing a sheet keeps the view where it is. */
  readonly lookUp = { current: 0 };
  private room: Box3 | null = null;
  /** The tilt the limits were last set for; `null` asks for them again. */
  private limitedAt: number | null = null;
  private framed = 0;
  private posedAt: Vector3 | null = null;
  /** Where the camera is going, read again for each limit and frame. */
  private readonly heading = new Spherical();

  constructor(inputs: FramingInputs) {
    this.inputs = inputs;
  }

  /** The tilt from straight down the camera is going to. */
  tiltOf(rig: CameraControlsImpl): number {
    return rig.getSpherical(this.heading, true).phi;
  }

  /** The camera's limits for this tilt: a new limit eases it in or out, never a snap of the view. */
  limitFor(rig: CameraControlsImpl, tilt: number): void {
    const { clear, metresPerPixel, size, free, still, whole } = this.inputs;
    this.limitedAt = tilt;
    const reach = reachOf(clear, metresPerPixel, size, free, tilt, whole);
    rig.maxDistance = Math.max(reach.farthest, this.framed);
    rig.minDistance = Math.min(reach.nearest, rig.maxDistance);
    const going = rig.getSpherical(this.heading, true).radius;
    if (going > rig.maxDistance) void rig.dollyTo(rig.maxDistance, !still);
    if (going < rig.minDistance) void rig.dollyTo(rig.minDistance, !still);
  }

  /** The picture, the window or the bars changed: the limits and the room are worked afresh. */
  reset(rig: CameraControlsImpl): void {
    this.room = null;
    if (this.inputs.clear === null) rig.setBoundary();
    this.limitFor(rig, this.tiltOf(rig));
  }

  /** The room the camera may look in from `going` off at `tilt`, round the point it was flown to. */
  private roomFor(going: number, tilt: number): Box3 | null {
    const { clear, size, free, whole } = this.inputs;
    if (clear === null) return null;
    const at = { ...clear, upM: this.lookUp.current };
    const next = lookRoom(at, seenPerMetre(size, free), going, tilt, whole);
    return this.posedAt === null ? next : next.expandByPoint(this.posedAt);
  }

  /**
   * The limits and the room for where the camera is going: while it flies in, the point it flies
   * to stays inside, though the room it leaves was too small to hold it.
   */
  keepIn(rig: CameraControlsImpl): void {
    const tilt = this.tiltOf(rig);
    if (this.limitedAt === null || Math.abs(this.limitedAt - tilt) > TILT_STEP)
      this.limitFor(rig, tilt);
    const next = this.roomFor(rig.getSpherical(this.heading, true).radius, tilt);
    if (next === null || this.room?.equals(next)) return;
    this.room = next;
    rig.setBoundary(next);
  }

  /** Flies the camera to a frame, its limits and room set first, or the point is cut off. */
  flyTo(rig: CameraControlsImpl, to: FrameTo): void {
    this.framed = to.distance;
    this.posedAt = to.at;
    this.lookUp.current = to.at.y;
    this.limitFor(rig, to.tilt);
    const going = Math.min(Math.max(to.going, rig.minDistance), rig.maxDistance);
    this.room = this.roomFor(going, to.tilt);
    if (this.room !== null) rig.setBoundary(this.room);
    void rig.dollyTo(going, to.move);
    void rig.moveTo(to.at.x, to.at.y, to.at.z, to.move);
    if (to.turn !== null || to.tilt !== this.tiltOf(rig))
      void rig.rotateTo(to.turn ?? rig.azimuthAngle, to.tilt, to.move);
  }
}
