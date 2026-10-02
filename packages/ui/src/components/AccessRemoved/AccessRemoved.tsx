import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import type { AccessRemovedProps } from './AccessRemoved.types';
import { useAccessRemoved } from './useAccessRemoved';

/** Frame 8 — what happened, the one way on, and the grievance contact, centred in the page. */
export function AccessRemoved({
  title,
  description,
  actionLabel,
  onAction,
  grievanceLabel,
  onGrievance,
}: AccessRemovedProps) {
  const { busy, act } = useAccessRemoved(onAction);
  return (
    <div className="hg-access-removed">
      <EmptyState
        icon={<ShellGlyph name="lock" size="xl" tone="primary" />}
        title={title}
        description={description}
        action={
          <div className="hg-access-removed-actions">
            <Button onClick={act} disabled={busy}>
              {actionLabel}
            </Button>
            <Button variant="ghost" onClick={onGrievance}>
              {grievanceLabel}
            </Button>
          </div>
        }
      />
    </div>
  );
}
