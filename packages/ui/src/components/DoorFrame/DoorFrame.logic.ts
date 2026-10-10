import { createContext } from 'react';

/**
 * The height the phone's status bar takes over the door, in points. The bloom runs from the
 * screen's top edge under a transparent status bar (`SCR-M01-01`), so the frame pads its column by
 * this much instead of starting below the bar. The app measures it — this package holds no
 * safe-area adapter — and the web's page has no such band, so its half reads none.
 */
export const DoorTopInset = createContext(0);
