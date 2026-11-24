'use client';
import {
  type DeviceHints,
  SCENE_DETAIL_LOOK,
  type SceneDetail,
  type SceneDetailLook,
  sceneDetailHeard,
  sceneDetailStart,
} from '@heliogrid/domain';
import { useRef, useState } from 'react';

/** How much detail the 3D view draws now, and how it hears each frame it draws. */
export interface SceneDetailView {
  readonly detail: SceneDetail;
  readonly look: SceneDetailLook;
  /** A frame drawn, this many milliseconds after the one before. */
  frameDrawn(gapMs: number): void;
}

/**
 * The 3D view's detail (`T-M05-002`, G034): it opens as the device's hints say, and each run of
 * slow frames while it moves takes it a step lower, for as long as the view is open. The rule is
 * the domain's; the platform hands in its hints and its frames. Only a new detail draws again.
 */
export function useSceneDetail(hints: DeviceHints): SceneDetailView {
  const heard = useRef(sceneDetailStart(hints));
  const [detail, setDetail] = useState<SceneDetail>(heard.current.detail);
  return {
    detail,
    look: SCENE_DETAIL_LOOK[detail],
    frameDrawn: (gapMs) => {
      const next = sceneDetailHeard(heard.current, gapMs);
      heard.current = next;
      if (next.detail !== detail) setDetail(next.detail);
    },
  };
}
