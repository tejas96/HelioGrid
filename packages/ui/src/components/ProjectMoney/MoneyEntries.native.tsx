import type { ProjectPaymentEntry, ProjectPayments } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { Card } from '../Card/Card.native';
import { HueTile } from '../HueTile/HueTile.native';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu/Menu.native';
import { CardHead } from '../ProjectDetail/ProjectDetailParts.native';
import { entriesNewestFirst, entryActsOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';

type EntriesProps = ProjectMoneyProps & { readonly payments: ProjectPayments };

/**
 * The money received on the phone (`M11-41`, `M11-42`, `M11-47`), newest first: each payment with
 * its mode, reference, day and who recorded it; a reversal beside the payment it takes back.
 */
export function MoneyEntries(props: EntriesProps) {
  const { payments, words } = props;
  const entries = entriesNewestFirst(payments.entries);
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.received} aside={null} />
      {entries.length === 0 ? (
        <View style={styles.none}>
          <Text variant="body-sm" color="secondary">
            {words.nothingReceived}
          </Text>
        </View>
      ) : (
        entries.map((entry, index) => (
          <View key={entry.id} style={[styles.row, index === 0 ? undefined : styles.rule]}>
            <EntryLine {...props} entry={entry} />
            <EntryMenu {...props} entry={entry} />
          </View>
        ))
      )}
    </Card>
  );
}

function EntryLine({
  entry,
  words,
  attaching,
}: EntriesProps & { readonly entry: ProjectPaymentEntry }) {
  const format = useFormat();
  const isReversal = entry.kind === 'reversal';
  const mode = entry.mode === null ? null : format.word('mode', entry.mode);
  return (
    <View style={styles.entry}>
      <HueTile
        glyph={isReversal ? 'undo' : 'rupee'}
        hue={isReversal || entry.reversed ? 'neutral' : 'success'}
        size={40}
        stroke={1.8}
      />
      <View style={styles.text}>
        <View style={styles.title}>
          <Text variant="mono" bold>
            {format.money(entry.amount)}
          </Text>
          {mode === null ? null : (
            <Text variant="body-sm">
              {entry.reference === null ? mode : words.entryReference(mode, entry.reference)}
            </Text>
          )}
        </View>
        <Text variant="body-sm" color="secondary">
          {isReversal && entry.reason !== null
            ? words.reversal(entry.reason)
            : words.entryLine(
                format.date(entry.receivedOn ?? entry.recordedAt),
                entry.recordedBy.name,
              )}
        </Text>
        {entry.reversed ? <StatusMark tone="neutral" label={words.reversedMark} /> : null}
        {attaching.includes(entry.id) ? (
          <StatusMark tone="neutral" label={words.photoAttaching} />
        ) : null}
      </View>
    </View>
  );
}

/** A payment's acts: share its receipt, reverse it — never on a reversal or a reversed payment. */
function EntryMenu(props: EntriesProps & { readonly entry: ProjectPaymentEntry }) {
  const { entry, words } = props;
  if (entry.kind !== 'payment' || entry.receiptNumber === null) return null;
  const items = entryActsOf(props, entry);
  // A reversed payment with no photo has nothing to offer: no empty menu is drawn.
  if (items.length === 0) return null;
  return <Menu label={words.entryMenu(entry.receiptNumber)} items={items} align="end" />;
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  none: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-3'] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
  },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  entry: { flex: 1, minWidth: 0, flexDirection: 'row', gap: theme.spacing['sp-3'] },
  text: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: theme.spacing['sp-0-5'] },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    rowGap: theme.spacing['sp-1'],
    columnGap: theme.spacing['sp-2'],
  },
});
