import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button';
import { DataTable } from '../DataTable';
import { type LeadImportTableRow, rowColumnsOf } from './LeadImport.columns';
import { rowsTableOf } from './LeadImport.props';
import type { LeadImportProps, LeadImportRow } from './LeadImport.types';
import { LeadImportFate } from './LeadImportFate';

interface LeadImportRowsProps extends LeadImportProps {
  phase: 'preview' | 'report';
}

/**
 * The rows (`M02-19`…`M02-21`): in the preview, the file's rows as they will land — each with what
 * happens to it — narrowed by the hero's parts; in the report, every row not imported with its
 * reason, under the file's own headers so it is easy to find and fix. A table at the desktop's
 * room, a card a row on the phone; *Show more* pages on.
 */
export function LeadImportRows(props: LeadImportRowsProps) {
  const { rows, words, phase } = props;
  const columns = rowColumnsOf(props, (row: LeadImportRow) => (
    <LeadImportFate row={row} words={words} />
  ));
  const shown = rows.read.kind === 'ready' ? rows.read.value : [];
  const report = phase === 'report';
  return (
    <section
      className="hg-lead-import-rows"
      aria-label={report ? words.rejectedHeading(rows.total) : words.rowsHeading}
    >
      <div className="hg-lead-import-rows-head">
        <Text variant={report ? 'h3' : 'body-sm'} as="h2" color={report ? 'primary' : 'secondary'}>
          {report ? words.rejectedHeading(rows.total) : words.rowsHeading}
        </Text>
        {report ? (
          <Text variant="body-sm" color="secondary">
            {words.rejectedLine}
          </Text>
        ) : null}
      </div>
      <DataTable<LeadImportTableRow> columns={columns} {...rowsTableOf(props, phase)} />
      {shown.length === 0 ? null : (
        <div className="hg-lead-import-rows-foot">
          <Text variant="caption" color="secondary">
            {words.shown(shown.length, rows.total)}
          </Text>
          {rows.hasMore ? (
            <Button variant="ghost" size="sm" loading={rows.loadingMore} onClick={rows.showMore}>
              {words.showMore}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
