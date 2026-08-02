import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/** Envelope detail shape — structurally matches @heliogrid/data's ApiErrorDetail. */
interface ServerErrorDetail {
  path: string;
  issue: string;
}

/**
 * A server VALIDATION_FAILED lands on the exact fields it names — never a dead-end toast
 * (spec §2.1). Rare in practice: the client pre-validates with the same schema.
 *
 * `path` MUST be the schema field path (`phone`, never `body.phone`): react-hook-form
 * stores an error for whatever key it is given, so a path matching no field renders
 * NOTHING and the rejection is silent. The contract is what keeps both sides in step —
 * see the `details[]` rule in apps/api/CLAUDE.md.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  details: readonly ServerErrorDetail[],
): void {
  for (const detail of details) {
    setError(detail.path as Path<T>, { type: 'server', message: detail.issue });
  }
}
