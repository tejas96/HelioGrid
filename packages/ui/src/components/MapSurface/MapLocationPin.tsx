import type { PointerEvent as ReactPointerEvent } from 'react';
import { useState } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { MapPin, MapSurfaceWords } from './MapSurface.types';
import { MAP_PIN_COLOR, MAP_SURFACE } from './MapTokens';
import { pinReadingOf } from './map-placement';

interface MapLocationPinProps {
  pin: MapPin;
  pinState: 'pending' | 'confirmed';
  /** The pin rides the fixed centre until it has coordinates of its own. */
  fixed: boolean;
  draggable: boolean;
  onDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  words: Pick<MapSurfaceWords, 'pinPending' | 'pinConfirmed' | 'draggable'>;
}

/**
 * PENDING vs CONFIRMED, **in words first**. Pending is an accent pin with a hollow core, a soft
 * halo and the words "Pin pending"; confirmed is a filled success pin with a tick and "Location
 * confirmed". `MS1-18`'s Confirm button is disabled until a pin pends, so the two must be
 * tellable apart at a glance AND on a screen reader — neither reading rests on the colour.
 */
export function MapLocationPin({
  pin,
  pinState,
  fixed,
  draggable,
  onDrag,
  words,
}: MapLocationPinProps) {
  const { confirmed, name, spokenName, x, y } = pinReadingOf(
    pin,
    pinState,
    fixed,
    draggable,
    words,
  );
  const colour = MAP_PIN_COLOR[pinState];
  const [dragging, setDragging] = useState(false);

  const handlers = draggable
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        },
        onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
          if (dragging) {
            onDrag(e);
          }
        },
        onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
          if (dragging) {
            setDragging(false);
            onDrag(e);
          }
        },
        onPointerCancel: () => setDragging(false),
      }
    : {};

  return (
    <div className="hg-map-surface-pin" style={{ left: `${x}%`, top: `${y}%` }}>
      <StatusMark
        className="hg-map-surface-pin-label"
        tone={confirmed ? 'success' : 'accent'}
        label={name}
      />
      <span
        role="img"
        aria-label={spokenName}
        className="hg-map-surface-pin-hit"
        data-draggable={draggable ? 'true' : undefined}
        data-dragging={dragging ? 'true' : undefined}
        {...handlers}
      >
        {confirmed ? null : <span aria-hidden="true" className="hg-map-surface-pin-halo" />}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <g fill={confirmed ? colour : MAP_SURFACE} stroke={colour} strokeWidth="1.8">
            <ShellGlyphMarks name="pin" />
          </g>
          {confirmed ? (
            <g stroke={MAP_SURFACE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ShellGlyphMarks name="pin-tick" />
            </g>
          ) : (
            <g stroke={colour} strokeWidth="1.8">
              <ShellGlyphMarks name="pin-hole" />
            </g>
          )}
        </svg>
      </span>
    </div>
  );
}
