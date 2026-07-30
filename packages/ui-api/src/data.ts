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
 * AvatarGroup — 3 shared props.
 *
 * `people` was excluded as a DRIFT with two causes; both are now closed (2026-07-30) and it
 * is IN the contract:
 *   (1) RN declared a `readonly` array, web a mutable one — a readonly array is not assignable
 *       to a mutable one, so `people={PEOPLE as const}` compiled on RN and failed on web. Web
 *       is now `readonly` too: the mirror held the stricter contract, and a component has no
 *       business mutating a prop array.
 *   (2) The element type differed because `AvatarProps.name` was optional on web and required
 *       on RN. That was fixed with the other six parity defects — `name` is required on both.
 *
 * Found by `pnpm check:ui-parity`, which compares AUTHORED props per platform against this
 * contract. The three hand-written lists could not see it: a prop absent from all of them is
 * invisible to an assertion that iterates `keyof ComponentApiSurface`.
 */
export interface AvatarGroupApi {
  people?: readonly Omit<AvatarApi, 'size'>[];
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
 * StatCard — label narrowed to `string` on web to match RN.
 */
export interface StatCardApi {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  deltaDir?: 'up' | 'down';
  children?: ReactNode;
}
