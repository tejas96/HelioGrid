import { useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import type { CoachMarkAnchor } from './CoachMark.types';
import type { CoachMarkRect } from './coach-mark-place';

/** Anything RN can measure in window coordinates — a View instance, or a ref holding one. */
interface Measurable {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

function isMeasurable(value: unknown): value is Measurable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'measureInWindow' in value &&
    typeof (value as Measurable).measureInWindow === 'function'
  );
}

/**
 * A ref or a view instance, resolved to something measurable.
 *
 * A CSS SELECTOR HAS NO NATIVE MEANING, so a string anchor resolves to nothing and the mark draws
 * nothing — which is the same honesty rule as an anchor that is not on this screen, not a silent
 * fallback to the wrong control.
 */
export function resolveNode(anchor?: CoachMarkAnchor): Measurable | null {
  if (anchor === undefined || typeof anchor === 'string') {
    return null;
  }
  if ('current' in anchor) {
    const current: unknown = anchor.current;
    return isMeasurable(current) ? current : null;
  }
  return isMeasurable(anchor) ? anchor : null;
}

/**
 * The anchor's live geometry in window coordinates. Same contract as the web half: anchors mount
 * late and screens scroll, so it polls; an anchor that never resolves reports missing and the mark
 * draws nothing rather than pointing at nothing.
 *
 * `within` is web-only — RN has no scroll-container coordinate space to resolve against without a
 * measured host, so a native mark is always placed against the window.
 */
export function useAnchorRect(
  anchor: CoachMarkAnchor | undefined,
  active: boolean,
  onMissing?: () => void,
): CoachMarkRect | null {
  const [rect, setRect] = useState<CoachMarkRect | null>(null);
  const tries = useRef(0);
  const missingRef = useRef(onMissing);

  useEffect(() => {
    missingRef.current = onMissing;
  }, [onMissing]);

  useEffect(() => {
    if (!active || anchor === undefined) {
      setRect(null);
      return;
    }
    tries.current = 0;
    let missed = false;
    let live = true;
    const read = () => {
      const node = resolveNode(anchor);
      if (node === null) {
        tries.current += 1;
        setRect(null);
        if (tries.current > 2 && !missed) {
          missed = true;
          missingRef.current?.();
        }
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        if (!live) {
          return;
        }
        if (width === 0 && height === 0) {
          setRect(null);
          return;
        }
        const window = Dimensions.get('window');
        setRect({
          top: y,
          left: x,
          width,
          height,
          vTop: y,
          bw: window.width,
          bh: window.height,
          box: false,
        });
      });
    };
    read();
    const timer = setInterval(read, 250);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [anchor, active]);

  return rect;
}
