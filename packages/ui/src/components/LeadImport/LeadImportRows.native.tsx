import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DataTable } from '../DataTable/DataTable.native';
import { type LeadImportTableRow, rowColumnsOf } from './LeadImport.columns';
import { rowsTableOf } from './LeadImport.props';
import type { LeadImportProps, LeadImportRow } from './LeadImport.types';
import { LeadImportFate } from './LeadImportFate.native';

interface LeadImportRowsProps extends LeadImportProps {
  phase: 'preview' | 'report';
}

/**
 * The rows on the phone (`M02-19`…`M02-21`): in the preview, the file's rows as they will land,
 * each with what happens to it, narrowed by the hero's rings; in the report, every row not
 * imported with its reason under the file's own headers. The table stacks into a card a row at
 * this room; *Show more* pages on.
 */
export function LeadImportRows(props: LeadImportRowsProps) {
  const { rows, words, phase } = props;
  const columns = rowColumnsOf(props, (row: LeadImportRow) => (
    <LeadImportFate row={row} words={words} />
  ));
  const shown = rows.read.kind === 'ready' ? rows.read.value : [];
  const report = phase === 'report';
  return (
    <View style={styles.rows}>
      <View style={styles.head}>
        <View accessible accessibilityRole="header">
          <Text variant={report ? 'h3' : 'body-sm'} color={report ? 'primary' : 'secondary'}>
            {report ? words.rejectedHeading(rows.total) : words.rowsHeading}
          </Text>
        </View>
        {report ? (
          <Text variant="body-sm" color="secondary">
            {words.rejectedLine}
          </Text>
        ) : null}
      </View>
      <DataTable<LeadImportTableRow> columns={columns} {...rowsTableOf(props, phase)} />
      {shown.length === 0 ? null : (
        <View style={styles.foot}>
          <Text variant="caption" color="secondary">
            {words.shown(shown.length, rows.total)}
          </Text>
          {rows.hasMore ? (
            <Button variant="ghost" size="sm" loading={rows.loadingMore} onClick={rows.showMore}>
              {words.showMore}
            </Button>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-3'], minWidth: 0 },
  head: { gap: theme.spacing['sp-1'], paddingHorizontal: theme.spacing['sp-1'] },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
});
