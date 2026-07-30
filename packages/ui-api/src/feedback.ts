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
 * EmptyState — 3 shared props. `icon` was required on web and optional on RN: FIXED 2026-07-30
 * to required on both (RN rendered an empty bloom circle when omitted). `title` and
 * `description` remain outside the contract — ReactNode on web, string on RN, part of the
 * eleven copy props in the package header.
 */
export interface EmptyStateApi {
  icon: ReactNode;
  action?: ReactNode;
  glow?: boolean;
}

/**
 * OfflineBanner — 1 shared prop.
 *
 * NOT in the contract:
 *   - message — DRIFT: Type differs: web `message?: ReactNode`, RN `message?: string`.
 *   Optional on both.
 */
export interface OfflineBannerApi {
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
 * Toast — 3 shared props.
 *
 * NOT in the contract:
 *   - title — DRIFT: Type differs: web `title: ReactNode`, RN `title: string`. Required on
 *   both.
 *   - description — DRIFT: Type differs: web `description?: ReactNode`, RN `description?:
 *   string`. Optional on both.
 */
export interface ToastApi {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: ReactNode;
  action?: ReactNode;
}
