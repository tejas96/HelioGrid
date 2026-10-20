import { useEffect, useRef } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
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

/** The shape each banner glyph draws. */
export const BANNER_GLYPH: Record<BannerGlyph, ShellGlyphName> = {
  alert: 'alert-circle',
  info: 'info-circle',
  rupee: 'rupee-wide',
  review: 'warning-triangle',
  spark: 'spark',
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
