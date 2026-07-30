/**
 * Data — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */

import type { WorkflowStatus } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ChipTone, Density } from './common.js';

/**
 * Avatar — 3 shared props. `name` was optional on web (defaulting to '') and required on RN:
 * FIXED 2026-07-30 to required on both. It is the accessible name — web fed it to `alt` and RN
 * to `accessibilityLabel`, so the web default rendered `alt=""` and hid a person's avatar from
 * screen readers. packages/ui/CLAUDE.md already banned optional-with-fallback for anything
 * user-visible; this was that rule being broken.
 */
export interface AvatarApi {
  name: string;
  src?: string;
  size?: number;
}

/**
 * AvatarGroup — 2 shared props.
 *
 * NOT in the contract:
 *   - people — DRIFT: Two differences. (1) RN is `readonly` array, web is mutable array.
 *   (2) The referenced element type differs because AvatarProps.name is required on RN and
 *   optional on web — so RN's element type demands `name`, web's does not.
 */
export interface AvatarGroupApi {
  size?: number;
  max?: number;
}

/**
 * Card — 4 shared props.
 *
 * NOT in the contract:
 *   - onClick — DRIFT: Same prop name, present on both (web via the inherited DOM attribute
 *   surface — the component destructures and uses it), but the TYPE differs: web is a DOM
 *   MouseEventHandler receiving a MouseEvent<HTMLDivElement>, RN is a zero-argument `() =>
 *   void`. An RN-typed `() => void` handler is assignable to web, but a web handler that
 *   reads the event argument is not portable to RN. Optionality matches (optional on both).
 */
export interface CardApi {
  children: ReactNode;
  density?: Density;
  interactive?: boolean;
  selected?: boolean;
}

/**
 * IconCircle — 4 shared props.
 */
export interface IconCircleApi {
  icon: ReactNode;
  color?: string;
  size?: number;
  density?: Density;
}

/**
 * Chip — 5 shared props.
 *
 * NOT in the contract:
 *   - onClick — DRIFT: Present on both (web via inherited DOM attributes, RN declared
 *   explicitly) and optional on both, but the type differs: web is React's
 *   MouseEventHandler<HTMLButtonElement> (handler receives a MouseEvent argument) while RN
 *   is a zero-argument () => void.
 */
export interface ChipApi {
  children: ReactNode;
  active?: boolean;
  dot?: boolean;
  tone?: ChipTone;
  density?: Density;
}

/**
 * Badge — 3 shared props.
 */
export interface BadgeApi {
  children: ReactNode;
  tone?: ChipTone;
  density?: Density;
}

/**
 * StatusChip — 3 shared props.
 */
export interface StatusChipApi {
  status: WorkflowStatus;
  label: string;
  density?: Density;
}

/**
 * ListRow — 7 shared props.
 *
 * NOT in the contract:
 *   - onClick — DRIFT: Same name, same optionality (optional on both), but the type
 *   differs: web declares MouseEventHandler<HTMLDivElement> (handler receives a React
 *   MouseEvent) while RN declares () => void (no argument). A shared contract typed () =>
 *   void would silently drop the event argument web callers can use.
 */
export interface ListRowApi {
  icon?: ReactNode;
  iconColor?: string;
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  density?: Density;
}

/**
 * StatCard — 5 shared props.
 *
 * NOT in the contract:
 *   - label — DRIFT: Same name, required on both, but the type differs: web accepts
 *   ReactNode (any renderable node, e.g. a <Trans> element or a span) while RN accepts only
 *   string. A web call site passing an element would not compile against the RN type.
 */
export interface StatCardApi {
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  deltaDir?: 'up' | 'down';
  children?: ReactNode;
}
