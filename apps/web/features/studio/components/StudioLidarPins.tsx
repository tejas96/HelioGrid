'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { type SceneScreen, screenOfFrame } from './scene-screen';

/** One pin's place in the scene: the roof's middle at its top. */
export interface PinAnchor {
  readonly index: number;
  readonly east: number;
  readonly north: number;
  readonly topM: number;
}

const PER_CENT = 100;
/** A pin stands this far above its roof's top, so its tip meets the top. */
const LIFT_M = 0.6;
/** Pins keep this far from the frame's edge, and this far apart. */
const EDGE_PX = 8;
const APART_PX = 4;

/**
 * LiDAR's pins (`T-M05-002g`, board frames 5 and 7): one on each drawn roof — its height in
 * Heights, its share of the year's sun with Sunlight — none in Photo. The page draws them; the
 * scene places them each frame (`LidarPinFollower`).
 */
export function StudioLidarPins({
  studio,
  words,
  holder,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  holder: RefObject<HTMLDivElement | null>;
}) {
  const format = useFormat();
  const { lidar } = studio;
  const { view } = lidar;
  const shown = view.on && studio.view !== 'top' && lidar.scan === 'in';
  if (!shown || (!view.sunlight && view.look !== 'heights')) return null;
  const levels = studio.scene.levels;
  return (
    <div ref={holder} className="hg-lidar-pins" aria-hidden="true">
      {lidar.pins.flatMap((pin) => {
        const topM = levels[pin.index]?.topM;
        if (topM === undefined) return [];
        const text = view.sunlight
          ? pin.share === null
            ? null
            : words.sitePercent(format.number(Math.round(pin.share * PER_CENT)))
          : format.roofHeight(topM, studio.units);
        if (text === null) return [];
        return [
          <span
            key={pin.index}
            className="hg-lidar-pin"
            data-index={pin.index}
            data-picked={pin.picked}
            data-hidden="true"
          >
            {text}
          </span>,
        ];
      })}
    </div>
  );
}

/** The pins' anchors: each pinned roof's middle at its top. */
export function pinAnchorsOf(studio: StudioScreen): PinAnchor[] {
  const levels = studio.scene.levels;
  return studio.lidar.pins.flatMap((pin) => {
    const topM = levels[pin.index]?.topM;
    return topM === undefined ? [] : [{ index: pin.index, ...pin.middle, topM }];
  });
}

/**
 * Places LiDAR's pins with the camera of the frame being drawn: on each roof, never past the
 * frame's edge, and a pin that would cover another stands a row higher.
 */
export function LidarPinFollower({
  holder,
  anchors,
  screen,
}: {
  holder: RefObject<HTMLDivElement | null>;
  anchors: readonly PinAnchor[];
  screen: SceneScreen;
}) {
  useFrame(({ camera, size }) => {
    const box = holder.current;
    if (box === null) return;
    const project = screenOfFrame(screen, camera, size);
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const pins = anchors
      .map((anchor) => ({
        anchor,
        node: box.querySelector<HTMLElement>(`[data-index="${anchor.index}"]`),
        at: project(anchor.east, anchor.topM + LIFT_M, -anchor.north),
      }))
      // The nearest to the foot first, so the far ones move up out of their way.
      .sort((a, b) => (b.at?.y ?? 0) - (a.at?.y ?? 0));
    for (const { node, at } of pins) {
      if (node === null) continue;
      node.dataset.hidden = String(at === null);
      if (at === null) continue;
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const x = Math.min(size.width - w / 2 - EDGE_PX, Math.max(w / 2 + EDGE_PX, at.x));
      let y = at.y;
      while (
        placed.some(
          (o) => Math.abs(o.x - x) < (o.w + w) / 2 + APART_PX && Math.abs(o.y - y) < h + APART_PX,
        )
      ) {
        y -= h + APART_PX;
      }
      placed.push({ x, y, w, h });
      node.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
    }
  });
  return null;
}
