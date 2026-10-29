import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useEffect, useRef } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { bannerRank, isNeverDismissible } from './Banner.kinds';
import type {
  BannerForm,
  BannerGlyph,
  BannerKind,
  BannerProps,
  BannerStackProps,
} from './Banner.types';

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

/**
 * The dismiss act, offered only when `dismissible` asks, the kind allows it, and both its handler
 * and its spoken name are given — otherwise none.
 */
export function bannerDismissal({
  dismissible,
  kind = 'state',
  onDismiss,
  dismissLabel,
}: Pick<BannerProps, 'dismissible' | 'kind' | 'onDismiss' | 'dismissLabel'>): {
  onDismiss: () => void;
  label: TranslatedText;
} | null {
  if (!(dismissible ?? false) || isNeverDismissible(kind)) return null;
  if (onDismiss === undefined || dismissLabel === undefined) return null;
  return { onDismiss, label: dismissLabel };
}

function byRank(a: ReactElement<BannerProps>, b: ReactElement<BannerProps>): number {
  return bannerRank(a.props.kind) - bannerRank(b.props.kind);
}

/** The banners a stack shows, in precedence order, and how many it capped away. */
export interface StackedBanners {
  shown: ReactElement<BannerProps>[];
  hidden: number;
  /** A capped stack says how many it hid; `single` never does — the broadest fact speaks alone. */
  saysMore: boolean;
}

/**
 * Every never-dismissible banner renders, in precedence order, and the cap applies to the REST:
 * `single` lets one more speak only when no mandatory one does, `stack` fills up to `max`.
 */
export function stackedBanners(
  children: ReactNode,
  mode: NonNullable<BannerStackProps['mode']>,
  max: number,
): StackedBanners {
  const items = Children.toArray(children).filter((child): child is ReactElement<BannerProps> =>
    isValidElement<BannerProps>(child),
  );
  const ordered = [...items].sort(byRank);
  const mandatory = ordered.filter((el) => isNeverDismissible(el.props.kind));
  const rest = ordered.filter((el) => !isNeverDismissible(el.props.kind));
  const room =
    mode === 'single' ? (mandatory.length > 0 ? 0 : 1) : Math.max(0, max - mandatory.length);
  const shown = [...mandatory, ...rest.slice(0, room)].sort(byRank);
  const hidden = ordered.length - shown.length;
  return { shown, hidden, saysMore: mode === 'stack' && hidden > 0 };
}
