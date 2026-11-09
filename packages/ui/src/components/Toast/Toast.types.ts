import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { LottieMomentName } from '../LottieMoment/LottieMoment.types';

/** The five toast tones. Each resolves to a semantic `-text` on `-bg` pair for the leading mark. */
export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * The ink pill (e5) with a leading semantic icon in a circular tint — or a Lottie moment that plays
 * once, where the act that raised it is a moment that matters (a release published).
 *
 * **A Toast is never placed by a caller.** `ToastHost` owns the queue, the stacking, the
 * auto-dismiss AND the position — including the clearance over the bottom nav, which it derives
 * from the nav's own height. A hand-positioned Toast is a second answer to that measurement.
 */
export interface ToastProps {
  tone?: ToastTone;
  title: TranslatedText;
  // biome-ignore lint/plugin/copy-prop-type: words, or the record a toast names (an item's brand and model)
  description?: string;
  /** override the default semantic icon */
  icon?: ReactNode;
  /** An original Lottie moment in place of the mark, played once — the words still say what happened. */
  moment?: LottieMomentName;
  /** trailing action node */
  action?: ReactNode;
}
