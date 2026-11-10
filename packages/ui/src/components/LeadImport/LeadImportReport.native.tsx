import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { useFocusOnMount } from '../CatalogImport/use-focus-on-mount.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { rowDivider } from '../Import/Import.surfaces.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { useFormat } from '../MarketProvider/market-context';
import { columnsUsedOf } from './LeadImport.logic';
import type { LeadImportProps } from './LeadImport.types';
import { LeadImportRows } from './LeadImportRows.native';

/**
 * The report on the phone (`M02-21`): the leads that landed in the one hero, its acts under them,
 * what became of the duplicates and how many rows were turned away — then every one of those rows
 * with its reason, and the columns the import read. The screen reader starts at its heading.
 */
export function LeadImportReport(props: LeadImportProps & { wide: boolean }) {
  const { outcome, words } = props;
  const format = useFormat();
  const heading = useFocusOnMount(true);
  if (outcome === null) return null;
  const duplicates = words.duplicatesDone[props.choice];
  const tally = (
    count: number,
    title: TranslatedText,
    sub: TranslatedText | null,
    first = false,
  ) => (
    <View style={[styles.tally, first ? undefined : rowDivider]}>
      <Text variant="h2" style={[styles.ink, styles.count]}>
        {format.number(count)}
      </Text>
      <View style={styles.tallyWords}>
        <Text variant="body" bold style={styles.ink}>
          {title}
        </Text>
        {sub === null ? null : (
          <Text variant="body-sm" style={styles.muted}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
  return (
    <View style={styles.report}>
      <HeroPanel label={words.doneRead(outcome.read)}>
        <View style={styles.hero}>
          <View ref={heading} accessible accessibilityRole="header">
            <Text variant="display" style={styles.ink}>
              {words.landed(outcome.landed)}
            </Text>
          </View>
          <View style={styles.line}>
            <LeadSourceMark source="import" label={words.sourceImport} />
            <View style={styles.lineWords}>
              <Text variant="body-sm" style={styles.muted}>
                {words.inInbox}
              </Text>
            </View>
          </View>
          <View style={styles.acts}>
            <Button variant="primary" size="lg" fullWidth onClick={props.onOpenInbox}>
              {words.openInbox}
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={props.onStartOver}>
              {words.importAnother}
            </Button>
          </View>
          <View>
            {tally(outcome.landed, words.created, null, true)}
            {tally(outcome.duplicates, duplicates.title, duplicates.line)}
            {tally(outcome.rejected, words.rejectedRows.title, words.rejectedRows.line)}
          </View>
          <View style={styles.line}>
            <ShellGlyph name="tick" size="sm" tone="success" />
            <View style={styles.lineWords}>
              <Text variant="body-sm" style={styles.muted}>
                {words.notRolledBack}
              </Text>
            </View>
          </View>
        </View>
      </HeroPanel>
      <LeadImportRows {...props} phase="report" />
      <LeadImportColumnsRead {...props} />
    </View>
  );
}

/** The columns the import read, each header to its field — or *Not imported*, never dropped quietly. */
function LeadImportColumnsRead(props: LeadImportProps) {
  const { words, columns } = props;
  const used = columnsUsedOf(props);
  const all = [...columns.open, ...columns.matched].sort((a, b) => a.column - b.column);
  return (
    <Card density="functional" label={words.columnsHeading}>
      <View style={styles.columns}>
        <View style={styles.columnsHead}>
          <View accessible accessibilityRole="header">
            <Text variant="overline" color="secondary">
              {words.columnsHeading}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            {words.columnsUsed(used.used, used.of)}
          </Text>
        </View>
        <View>
          {all.map((column, index) => (
            <View key={column.column} style={[styles.column, index === 0 ? undefined : rowDivider]}>
              <View style={styles.columnHeader}>
                <Text variant="mono">{column.header}</Text>
              </View>
              <Text variant="body-sm" color={column.field === null ? 'secondary' : 'primary'}>
                {column.field === null ? words.notImported : words.fields[column.field]}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="caption" color="secondary">
          {words.columnsNamed}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  report: { gap: theme.spacing['sp-5'], minWidth: 0 },
  hero: { gap: theme.spacing['sp-4'] },
  ink: { color: colors['on-panel'] },
  muted: { color: colors['on-panel-muted'] },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  lineWords: { flexShrink: 1, minWidth: 0 },
  acts: { gap: theme.spacing['sp-2'] },
  tally: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
  },
  count: { minWidth: theme.spacing['sp-16'], textAlign: 'right', fontVariant: ['tabular-nums'] },
  tallyWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  columns: { gap: theme.spacing['sp-3'] },
  columnsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  column: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
  },
  columnHeader: { flexShrink: 1, minWidth: 0 },
});
