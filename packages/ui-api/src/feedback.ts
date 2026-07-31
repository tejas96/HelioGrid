/**
 * Feedback — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */
import type { ReactNode } from 'react';

/**
 * EmptyState — 5 shared props. `icon` was required on web and optional on RN: fixed to
 * required on both (RN rendered an empty bloom circle when omitted). `title` and
 * `description` were ReactNode on web and string on RN: narrowed to `string`. They carried
 * Lingui `<Trans>` elements, which is why web needed a node type at all; the call site now
 * uses `i18n._()` with the identical msgid, so the catalogue is unchanged.
 */
export interface EmptyStateApi {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  glow?: boolean;
}

/**
 * OfflineBanner — message narrowed to `string` on web — it carried a `<Trans>`, now `i18n._()`.
 */
export interface OfflineBannerApi {
  message?: string;
  count?: number;
}

/**
 * ProgressBar — 2 shared props.
 */
export interface ProgressBarApi {
  value?: number;
  gradient?: boolean;
}

/**
 * Toast — title/description narrowed to `string` on web to match RN.
 */
/** Toast tones. Narrower than `ChipTone` — a toast is never `accent`. */
export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ToastApi {
  title: string;
  description?: string;
  tone?: ToastTone;
  icon?: ReactNode;
  action?: ReactNode;
}
