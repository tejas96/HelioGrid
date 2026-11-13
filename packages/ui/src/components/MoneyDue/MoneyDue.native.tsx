import type { MoneyDue as Due, MoneyDueRow } from '@heliogrid/contracts';
import type { MoneyDueGroupView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider';
import { dueRowOf, tileGroupsOf } from './MoneyDue.logic';
import type { MoneyDueProps } from './MoneyDue.types';

type DueProps = MoneyDueProps & { readonly due: Due };

/**
 * Money due on the phone (`SCR-M11-01`): the hero with the total to collect, the late and due-today
 * tiles and what came in this month — or, under a dashboard that holds the cash, a plain head —
 * then the groups, a card per row, each its first few until
 * *Show all*. The screen's scroll view holds it.
 */
export function MoneyDue(props: MoneyDueProps) {
  const { read, words } = props;
  const hero = props.figures !== 'none';
  if (read.kind === 'loading') {
    return (
      <LoadingBars
        bars={hero ? ['panel', 'row', 'row', 'row'] : ['row', 'row', 'row']}
        label={words.loading}
      />
    );
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  const due = read.value;
  return (
    <View style={styles.page}>
      {hero ? (
        <DueHero {...props} due={due} />
      ) : (
        <View accessible accessibilityRole="header">
          <Text variant="h3">{words.moneyDue}</Text>
        </View>
      )}
      {due.rows.totalCount === 0 ? (
        <EmptyState
          icon={<ShellGlyph name="check-check" size="lg" tone="secondary" />}
          title={words.emptyTitle}
          description={words.emptyBody}
        />
      ) : (
        <View
          style={styles.groups}
          accessibilityLabel={words.moneyDue}
          role="region"
          collapsable={false}
        >
          {props.groups.map((group) => (
            <DueGroup key={group.group} {...props} due={due} group={group} />
          ))}
        </View>
      )}
    </View>
  );
}

/** The total to collect, the late and due-today tiles, and what came in this month. */
function DueHero({ due, words }: DueProps) {
  const format = useFormat();
  return (
    <HeroPanel label={words.toCollect}>
      <View style={styles.block}>
        <View style={styles.figureRow}>
          <Text variant="hero" oneLine>
            {format.money(due.toCollect)}
          </Text>
        </View>
        <View style={styles.tiles}>
          {tileGroupsOf(due).map((group) => (
            <View key={group} style={[styles.tile, TILE[group].wash]}>
              <Text variant="caption" bold style={TILE[group].ink}>
                {words.tile(words.group(group), due.groups[group].count)}
              </Text>
              <Text variant="mono" oneLine style={TILE[group].ink}>
                {format.money(due.groups[group].amount)}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="body-sm" color="secondary">
          {words.collectedThisMonth(format.money(due.collectedThisMonth))}
        </Text>
      </View>
    </HeroPanel>
  );
}

/** One group: its name and count, a card per row, and *Show all* while more wait behind. */
function DueGroup(props: DueProps & { readonly group: MoneyDueGroupView<MoneyDueRow> }) {
  const { group, words } = props;
  return (
    <View style={styles.group}>
      <View style={styles.head}>
        <Text variant="overline" color="secondary">
          {words.group(group.group)}
        </Text>
        <Text variant="mono" color="secondary">
          {String(group.count)}
        </Text>
      </View>
      <CardRows form="separate">
        {group.rows.map((row, index) => (
          <DueRow key={row.partId} {...props} row={row} first={index === 0} />
        ))}
      </CardRows>
      {group.hidden > 0 ? (
        <View style={styles.more}>
          <Button variant="ghost" size="md" onClick={() => props.onShowAll(group.group)}>
            {words.showAll(group.count)}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function DueRow(props: DueProps & { readonly row: MoneyDueRow; readonly first: boolean }) {
  const format = useFormat();
  const shown = dueRowOf(props.row, props.due, props);
  const { remind } = shown;
  return (
    <CardRow
      first={props.first}
      open={shown.open}
      aside={
        remind === null ? undefined : (
          <Button
            variant="secondary"
            size="sm"
            spokenName={remind.spokenName}
            onClick={remind.onClick}
          >
            {remind.label}
          </Button>
        )
      }
    >
      <DueRowWords shown={shown} amount={format.money(props.row.outstanding)} />
    </CardRow>
  );
}

/**
 * The row's words on the phone: the name clear of *Remind* at the row's top end, and under it the
 * project and part, then the amount with its mark — so nothing sits under the act.
 */
function DueRowWords({ shown, amount }: { shown: ReturnType<typeof dueRowOf>; amount: string }) {
  const asideRoom = useCardRowAsideRoom();
  return (
    <View style={styles.row}>
      <Avatar name={shown.name} size={36} />
      <View style={styles.rowText}>
        <Text variant="body" bold style={asideRoom === 0 ? undefined : { paddingEnd: asideRoom }}>
          {shown.name}
        </Text>
        <Text variant="body-sm" color="secondary">
          {shown.line}
        </Text>
        <View style={styles.rowEnd}>
          <Text variant="mono" oneLine>
            {amount}
          </Text>
          <StatusMark tone={shown.mark.tone} label={shown.mark.label} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-3'] },
  block: { gap: theme.spacing['sp-2'] },
  figureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  // Two side by side; a third takes the next row.
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
    gap: theme.spacing['sp-0-5'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
  groups: { gap: theme.spacing['sp-4'] },
  group: { gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['sp-1'],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  rowText: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  rowEnd: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-1'],
  },
  more: { alignSelf: 'center' },
});

/**
 * A tile is a status wash with its words (`F7-12`): late on the danger pair, due on the accent's,
 * part received on the success pair.
 */
const TILE = {
  late: StyleSheet.create({
    wash: { backgroundColor: colors['danger-bg'] },
    ink: { color: colors['danger-text'] },
  }),
  due: StyleSheet.create({
    wash: { backgroundColor: colors['accent-subtle'] },
    ink: { color: colors['accent-text'] },
  }),
  part: StyleSheet.create({
    wash: { backgroundColor: colors['success-bg'] },
    ink: { color: colors['success-text'] },
  }),
};
