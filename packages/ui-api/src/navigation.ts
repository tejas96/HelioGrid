/**
 * Navigation — shared component API (ADR-0021 era, Task 32).
 *
 * Only props BOTH platforms already agree on are declared here: same name, equivalent type,
 * same optionality. Anything a platform owns alone (web DOM attributes, RN
 * ViewStyle/hitSlop) is absent by design — this is the shared surface, not the union.
 * Divergences found during extraction are recorded per interface so the omission is a
 * decision on the record, not an oversight.
 */
import type { Density } from './common.js';

/**
 * Tabs — 1 shared prop.
 *
 * NOT in the contract:
 *   - items — DRIFT: Type text is identical (`TabItem[]`) and both are required, but the
 *   referenced TabItem differs structurally: web `TabItem.label: ReactNode`, RN
 *   `TabItem.label: string`. `TabItem.value: string` on both.
 *   - onChange — DRIFT: Optionality differs: `onChange?` is optional on web, required on
 *   RN. Signatures are identical.
 */
export interface TabsApi {
  value: string;
}

/**
 * SegmentedControl — 2 shared props.
 *
 * NOT in the contract:
 *   - options — DRIFT: Type text is identical (`SegmentedOption[]`) and both required, but
 *   the referenced SegmentedOption differs: web `label: ReactNode`, RN `label: string`.
 *   `value: string` on both.
 *   - onChange — DRIFT: Optionality differs: `onChange?` is optional on web, required on
 *   RN. Signatures are identical.
 */
export interface SegmentedControlApi {
  value: string;
  density?: Density;
}
