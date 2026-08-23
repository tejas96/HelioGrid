import type { PointerEvent as ReactPointerEvent } from 'react';
import { useState } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import type { MapPin } from './MapSurface.types';
import { MAP_PIN_COLOR, MAP_SURFACE } from './MapTokens';

interface MapLocationPinProps {
  pin: MapPin;
  pinState: 'pending' | 'confirmed';
  /** The pin rides the fixed centre until it has coordinates of its own. */
  fixed: boolean;
  draggable: boolean;
  onDrag: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * PENDING vs CONFIRMED, **in words first**. Pending is an accent pin with a hollow core, a soft
 * halo and the words "Pin pending"; confirmed is a filled success pin with a tick and "Location
 * confirmed". `MS1-18`'s Confirm button is disabled until a pin pends, so the two must be
 * tellable apart at a glance AND on a screen reader — neither reading rests on the colour.
 */
export function MapLocationPin({ pin, pinState, fixed, draggable, onDrag }: MapLocationPinProps) {
  const confirmed = pinState === 'confirmed';
  const colour = MAP_PIN_COLOR[pinState];
  const words = pin.label ?? (confirmed ? 'Location confirmed' : 'Pin pending');
  const [dragging, setDragging] = useState(false);
  const x = fixed ? 50 : (pin.x ?? 50);
  const y = fixed ? 50 : (pin.y ?? 50);

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
        label={words}
      />
      <span
        role="img"
        aria-label={draggable ? `${words}, draggable` : words}
        className="hg-map-surface-pin-hit"
        data-draggable={draggable ? 'true' : undefined}
        data-dragging={dragging ? 'true' : undefined}
        {...handlers}
      >
        {confirmed ? null : <span aria-hidden="true" className="hg-map-surface-pin-halo" />}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"
            fill={confirmed ? colour : MAP_SURFACE}
            stroke={colour}
            strokeWidth="1.8"
          />
          {confirmed ? (
            <path
              d="M8.6 10.9l2.4 2.3 4-4.3"
              stroke={MAP_SURFACE}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <circle cx="12" cy="11" r="2.6" stroke={colour} strokeWidth="1.8" />
          )}
        </svg>
      </span>
    </div>
  );
}
