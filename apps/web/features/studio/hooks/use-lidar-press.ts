'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { GroundPoint, SiteLineUp } from '@heliogrid/domain';
import { type PointerEvent, type RefObject, useRef } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';

/** On a touch screen a picked roof is taken only after this hold, so a swipe always turns the view. */
const HOLD_MS = 300;
/** A finger that moves this far before the hold ends is a swipe. */
const SWIPE_PX = 8;
/** The finger's half-width: a roof this near a press is the one pressed. */
const FINGER_PX = 22;

type Grab =
  | { readonly kind: 'roofs'; readonly topM: number; readonly from: GroundPoint }
  | { readonly kind: 'map'; readonly from: GroundPoint; readonly was: SiteLineUp };

/**
 * LiDAR's presses on the 3D (`T-M05-002g`, board frames 11, 12, 15): in Move's Roofs tab a drag
 * that starts on a picked roof moves every picked roof — at once with a mouse, after a short hold
 * on a phone, where a plain swipe always turns the view; in the Map tab a drag moves the scan
 * under the roofs, which stay. The map's move shows while the finger moves and is kept once it
 * lifts; a press anywhere else is the view's. The first press also puts the opening tip away.
 */
export function useLidarPress(studio: StudioScreen, drive: RefObject<StudioDrive | null>) {
  const grab = useRef<Grab | null>(null);
  const hold = useRef<{ timer: number; x: number; y: number } | null>(null);
  const { lidar } = studio;
  const live = lidar.view.on && studio.view !== 'top' && lidar.scan === 'in' && lidar.canEdit;
  const tab = lidar.view.move?.tab ?? null;

  const at = (event: PointerEvent, heightM: number) =>
    drive.current?.groundAt(event.clientX, event.clientY, heightM) ?? null;
  const release = () => {
    if (hold.current !== null) window.clearTimeout(hold.current.timer);
    hold.current = null;
    grab.current = null;
    drive.current?.hold(false);
  };

  const startRoofs = (event: PointerEvent): boolean => {
    const sight = (h: number) => at(event, h);
    const beside = (h: number) =>
      drive.current?.groundAt(event.clientX + FINGER_PX, event.clientY, h) ?? null;
    const index = lidar.moves.pickedAt(sight, beside);
    const topM = index === null ? undefined : studio.scene.levels[index]?.topM;
    const from = topM === undefined ? null : at(event, topM);
    if (topM === undefined || from === null) return false;
    const take = () => {
      grab.current = { kind: 'roofs', topM, from };
      drive.current?.hold(true);
      lidar.moves.holding(true);
    };
    if (event.pointerType !== 'touch') {
      take();
      return true;
    }
    hold.current = {
      timer: window.setTimeout(() => {
        hold.current = null;
        take();
      }, HOLD_MS),
      x: event.clientX,
      y: event.clientY,
    };
    return false;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): boolean => {
    if (!lidar.view.on) return false;
    lidar.moves.pressed();
    if (!live || tab === null) return false;
    if (tab === 'map') {
      const from = at(event, 0);
      if (from === null) return false;
      grab.current = { kind: 'map', from, was: studio.site.lineUp };
      drive.current?.hold(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return true;
    }
    if (lidar.picked.length === 0) return false;
    const taken = startRoofs(event);
    if (taken) event.currentTarget.setPointerCapture(event.pointerId);
    return taken;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): boolean => {
    const waiting = hold.current;
    if (waiting !== null) {
      const away = Math.hypot(event.clientX - waiting.x, event.clientY - waiting.y);
      if (away > SWIPE_PX) release();
      return false;
    }
    const held = grab.current;
    if (held === null) return false;
    const now = at(event, held.kind === 'roofs' ? held.topM : 0);
    if (now === null) return true;
    const by = { east: now.east - held.from.east, north: now.north - held.from.north };
    if (held.kind === 'roofs') lidar.moves.drag(by, false);
    else
      lidar.moves.dragMap(
        { east: held.was.east + by.east, north: held.was.north + by.north },
        false,
      );
    return true;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>): boolean => {
    const held = grab.current;
    release();
    if (held === null) return false;
    const now = at(event, held.kind === 'roofs' ? held.topM : 0);
    if (held.kind === 'roofs') {
      lidar.moves.holding(false);
      const by =
        now === null
          ? { east: 0, north: 0 }
          : { east: now.east - held.from.east, north: now.north - held.from.north };
      lidar.moves.drag(by, true);
    } else {
      const to =
        now === null
          ? held.was
          : {
              east: held.was.east + now.east - held.from.east,
              north: held.was.north + now.north - held.from.north,
            };
      lidar.moves.dragMap(to, true);
    }
    return true;
  };

  return {
    /** Each handler answers whether LiDAR took the press: the studio's own then leaves it. */
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    cancel: () => {
      const held = grab.current;
      // A drag cancelled moves nothing: it ends where it began.
      if (held?.kind === 'roofs') {
        lidar.moves.holding(false);
        lidar.moves.drag({ east: 0, north: 0 }, true);
      }
      if (held?.kind === 'map') lidar.moves.dragMap(held.was, true);
      release();
    },
  };
}

/**
 * The scene's press handlers with LiDAR's first: a press LiDAR takes (a picked roof's drag, the
 * map's) is not the studio's; one it takes after the studio's began (a phone's hold) ends the
 * studio's.
 */
export function withLidarPress(
  lidar: ReturnType<typeof useLidarPress>,
  studio: {
    readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    readonly onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    readonly onPointerCancel: () => void;
    readonly onPointerLeave: (event: PointerEvent<HTMLDivElement>) => void;
  },
) {
  return {
    ...studio,
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!lidar.handlers.onPointerDown(event)) studio.onPointerDown(event);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (!lidar.handlers.onPointerMove(event)) studio.onPointerMove(event);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (lidar.handlers.onPointerUp(event)) studio.onPointerCancel();
      else studio.onPointerUp(event);
    },
    onPointerCancel: () => {
      lidar.cancel();
      studio.onPointerCancel();
    },
  };
}
