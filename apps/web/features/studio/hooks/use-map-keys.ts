'use client';
import type { KeyboardEvent, RefObject } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';

/** Each arrow key's move, east and north. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * The map's keys while it has the focus, as a map's: the arrows move it, plus and minus zoom, and 0
 * goes back to the pin. A key held with Ctrl, Cmd or Alt is the browser's, never the map's.
 */
export function useMapKeys(drive: RefObject<StudioDrive | null>) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const controls = drive.current;
    if (controls === null || event.ctrlKey || event.metaKey || event.altKey) return;
    const arrow = ARROWS[event.key];
    if (arrow !== undefined) controls.nudge(arrow[0], arrow[1]);
    else if (event.key === '+' || event.key === '=') controls.zoomIn();
    else if (event.key === '-' || event.key === '_') controls.zoomOut();
    else if (event.key === '0') controls.home();
    else return;
    event.preventDefault();
  };
}
