import { createContext } from 'react';

/**
 * The height the phone's status bar takes over the door, in points. The bloom runs from the
 * screen's top edge under a transparent status bar (`SCR-M01-01`), so the frame pads its column by
 * this much instead of starting below the bar. The app measures it — this package holds no
 * safe-area adapter — and the web's page has no such band, so its half reads none.
 */
export const DoorTopInset = createContext(0);

/**
 * The shortest screen a `bounded` frame holds still, in points (CSS px on the web). Under it the
 * heading, the card's head and the act leave the rows no room, so the column scrolls whole as an
 * unbounded door's does, and nothing is cut off. `DoorPanes.css` writes the same value in its
 * `@media`, which cannot read a constant.
 */
export const DOOR_BOUNDED_MIN_HEIGHT = 560;
