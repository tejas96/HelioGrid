import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { PendingAction } from '../PendingAction';
import type { MergeActProps } from './MergeCompare.types';

/** The merge's act, with what it waits on or why it came back said under it. */
export function MergeAct({
  label,
  onMerge,
  awake,
  merging,
  waiting,
  failure,
  line,
  warning,
}: MergeActProps) {
  return (
    <div className="hg-merge-act">
      {warning === null ? null : (
        <p className="hg-merge-fact" data-tone="warning">
          <ShellGlyph name="alert-triangle" size="md" tone="warning" />
          <strong>{warning}</strong>
        </p>
      )}
      <Button
        variant="primary"
        size="prominent"
        fullWidth
        icon={<ShellGlyph name="tick" size="md" tone="inverse" />}
        disabled={!awake}
        loading={merging}
        onClick={onMerge}
      >
        {label}
      </Button>
      {merging ? (
        <PendingAction state="waiting" label={waiting} />
      ) : failure !== null ? (
        <PendingAction state="returned" reason={failure} />
      ) : line === null ? null : (
        <p className="hg-merge-act-line">{line}</p>
      )}
    </div>
  );
}
