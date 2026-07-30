/**
 * Navigation — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */
import type { Density, SegmentedOption, TabItem } from './common.js';

/**
 * Tabs — 3 shared props. All three defects here were FIXED 2026-07-30 rather than excluded:
 * `onChange` was optional on web (a control with a required `value` that cannot report a
 * change is broken, not permissive), and `TabItem.label` was `ReactNode` on web / `string` on
 * RN. `TabItem` now has ONE definition, in common.ts.
 */
export interface TabsApi {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * SegmentedControl — 4 shared props. Same two defects as Tabs, fixed the same way: `onChange`
 * is required on both platforms and `SegmentedOption` has one definition in common.ts.
 */
export interface SegmentedControlApi {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  density?: Density;
}
