import { SETTINGS_SEGMENT } from '../shell/settings-rows';
import type { SubjectKind } from '../subject/kinds';

/**
 * Where a notification's subject opens (`F6-02`: a notification points at a real record), as an
 * address both apps read — the web's `/more/billing` and the phone's `heliogrid://more/billing`
 * (`M01-61`). A kind with no screen of its own yet answers `null`, and its tap only marks it read.
 */
const SUBJECT_ADDRESS: Partial<Record<SubjectKind, string>> = {
  /** A dunning or trial notice opens Billing, its one way out (`T-M12-011`, `SCR-M12-02`). */
  dunning_event: `more/${SETTINGS_SEGMENT.billing}`,
};

export function subjectAddressOf(kind: string | undefined): string | null {
  if (kind === undefined) return null;
  return SUBJECT_ADDRESS[kind as SubjectKind] ?? null;
}
