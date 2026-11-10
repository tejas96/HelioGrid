import { SETTINGS_SEGMENT } from '../shell/settings-rows';
import type { SubjectKind } from '../subject/kinds';

/**
 * Where a notification's subject opens (`F6-02`: a notification points at a real record), as an
 * address both apps read — the web's `/more/billing` and the phone's `heliogrid://more/billing`
 * (`M01-61`). A kind with no screen of its own yet answers `null`, and its tap only marks it read.
 * A record's own screen needs its id: without one it answers `null` too.
 *
 * A lead opens its Lead Detail even when it has since left the reader's scope: that read answers
 * 404, and the screen lands on the honest landing. A customer has no page of its
 * own — its records open through their leads.
 */
const SUBJECT_ADDRESS: Partial<Record<SubjectKind, (ref: string | undefined) => string | null>> = {
  /** A dunning or trial notice opens Billing, its one way out (`T-M12-011`, `SCR-M12-02`). */
  dunning_event: () => `more/${SETTINGS_SEGMENT.billing}`,
  /** A lead notice opens that lead (`SCR-M02-04`). */
  lead: (ref) => (ref === undefined ? null : `leads/${ref}`),
  /**
   * An import's grouped notice opens that import where it stands — its report once run
   * (`SCR-M02-05`, `M02-21`); both apps read `job` off the address.
   */
  lead_import: (ref) => (ref === undefined ? null : `leads/import?job=${ref}`),
};

export function subjectAddressOf(kind: string | undefined, ref?: string): string | null {
  if (kind === undefined) return null;
  return SUBJECT_ADDRESS[kind as SubjectKind]?.(ref) ?? null;
}
