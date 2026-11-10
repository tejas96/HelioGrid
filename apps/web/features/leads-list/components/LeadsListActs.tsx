'use client';
import type { LeadsListWords } from '@heliogrid/i18n';
import { Button, ShellGlyph } from '@heliogrid/ui';

/** The page's two ways in: *Import* a file, and *Add lead* — the page's one main verb. */
export function LeadsListActs({
  words,
  onAdd,
  onImport,
}: {
  words: LeadsListWords;
  onAdd: () => void;
  /** *Import*, offered only to who may import leads (`crm.import_leads`); null draws none. */
  onImport: (() => void) | null;
}) {
  return (
    <div className="hg-leads-list-acts">
      {onImport === null ? null : (
        <Button variant="ghost" icon={<ShellGlyph name="upload" size="sm" />} onClick={onImport}>
          {words.import}
        </Button>
      )}
      <Button variant="primary" icon={<ShellGlyph name="plus" size="sm" />} onClick={onAdd}>
        {words.addLead}
      </Button>
    </div>
  );
}
