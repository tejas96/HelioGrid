'use client';
import type { MergeUnavailable } from '@heliogrid/domain';
import { customerMergeUnavailableWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Card, ListRow, ScopeNote, ShellGlyph, StatusChip } from '@heliogrid/ui';

/**
 * Why the two cannot merge here, with no merge act anywhere (`M02-63`): a record outside the list
 * shows who holds it and never its name; then the way back.
 */
export function MergeUnavailablePart({
  unavailable,
  onBack,
}: {
  unavailable: MergeUnavailable;
  onBack: () => void;
}) {
  const t = useTranslate();
  const words = customerMergeUnavailableWords(t, unavailable);
  return (
    <section className="hg-customer-merge-unavailable" aria-label={words.badge}>
      {words.locked === null ? null : (
        <Card>
          <ListRow
            icon={<ShellGlyph name="lock" size="md" />}
            title={words.locked.title}
            subtitle={words.locked.holder}
          />
        </Card>
      )}
      <div>
        <StatusChip tone="neutral" label={words.badge} />
      </div>
      <ScopeNote variant="panel" title={words.title} message={words.line} />
      <div>
        <Button
          variant="secondary"
          icon={<ShellGlyph name="chevron-left" size="sm" />}
          onClick={onBack}
        >
          {words.back}
        </Button>
      </div>
    </section>
  );
}
