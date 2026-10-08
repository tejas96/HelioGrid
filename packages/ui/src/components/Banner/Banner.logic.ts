import { useEffect, useRef } from 'react';
import type { BannerForm, BannerGlyph, BannerKind } from './Banner.types';

/** The design system's default: a phone-width banner (343 inside 375) stacks, a 600 strip does not. */
export const ACTION_BELOW = 400;

/**
 * Whether the action drops under the body. Decided by the banner's own width, never the viewport,
 * and only once that width is measured — an unmeasured banner keeps the action beside the copy.
 */
export function actionStacks(
  hasAction: boolean,
  width: number | null,
  actionBelow: number,
): boolean {
  return hasAction && width !== null && width < actionBelow;
}

/**
 * The banner glyphs, as geometry rather than markup. Each is a list of `d` strings plus whether
 * the outline is ringed, because the two halves draw with different elements — `<path>`/`<circle>`
 * on web, `react-native-svg`'s `<Path>`/`<Circle>` on RN — and only the SHAPE is shared.
 * The halves used to hold the same outlines in two encodings, which is how one platform keeps an
 * old glyph after the other is corrected.
 *
 * A `d` string is SVG path data on a 24x24 grid, never an identifier: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c` a curve. So `M12 9v4`
 * reads "pen to the middle, draw 4 down" — a coordinate, and never a ledger row id.
 */
export interface BannerGlyphShape {
  readonly paths: readonly string[];
  /** A ringed glyph draws a 9-radius circle about the centre, under the paths. */
  readonly ringed: boolean;
}

export const BANNER_GLYPH: Record<BannerGlyph, BannerGlyphShape> = {
  alert: { paths: ['M12 9v4M12 17h.01'], ringed: true },
  info: { paths: ['M12 11v5M12 8h.01'], ringed: true },
  rupee: { paths: ['M7 5h10M7 9h10M15 5c0 4-3.5 4-8 4l8 10'], ringed: false },
  review: { paths: ['M12 3 3 20h18z', 'M12 10v4M12 17h.01'], ringed: false },
  spark: {
    paths: [
      'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
    ],
    ringed: false,
  },
};

/** Reports the action's place once per change, so a reader never loops on its own answer. */
export function useFormReport(
  stacked: boolean,
  width: number | null,
  onFormChange: ((form: BannerForm) => void) | undefined,
): void {
  const reported = useRef<boolean | null>(null);
  useEffect(() => {
    if (onFormChange === undefined || width === null || reported.current === stacked) return;
    reported.current = stacked;
    onFormChange({ actionStacked: stacked, width });
  }, [stacked, width, onFormChange]);
}

/** `disclaimer` still renders, never dismissible, and says in the console where it belongs now. */
export function useDisclaimerWarning(kind: BannerKind): void {
  useEffect(() => {
    if (kind === 'disclaimer') {
      console.warn(
        'Banner kind="disclaimer" is superseded by <Disclosure>. M06-04 / SCR-M06-17 require the line in the reading flow at the weight of the figures it qualifies, on the customer\'s own surface — a banner is operator chrome (MS9-11), it can be capped by BannerStack, and its strip is the wrong weight. This banner is never dismissible, but move it.',
      );
    }
  }, [kind]);
}
