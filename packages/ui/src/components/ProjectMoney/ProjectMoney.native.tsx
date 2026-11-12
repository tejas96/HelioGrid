import type { ProjectPayments } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Card } from '../Card/Card.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu/Menu.native';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { CardHead } from '../ProjectDetail/ProjectDetailParts.native';
import { Timeline } from '../Timeline/Timeline.native';
import { MoneyEntries } from './MoneyEntries.native';
import { MoneyHero } from './MoneyHero.native';
import { partRowsOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';

/**
 * A project's payments on the phone (`SCR-M11-02`, design A), one column: the hero, the parts as a
 * timeline, the money received. The screen's scroll view holds it.
 */
export function ProjectMoney(props: ProjectMoneyProps) {
  const { read, words } = props;
  return (
    <View style={styles.page}>
      {read.kind === 'loading' ? (
        <LoadingBars {...projectLoadingOf(words)} />
      ) : read.kind === 'failed' ? (
        <FailedRead {...projectFailedOf(words, read.retry, props.focusAfter)} />
      ) : read.value.parts.length === 0 ? (
        <EmptyState
          icon={<ShellGlyph name="rupee" size="lg" tone="secondary" />}
          title={words.noScheduleTitle}
          description={words.noScheduleBody}
        />
      ) : (
        <>
          <MoneyHero {...props} payments={read.value} />
          <MoneyParts {...props} payments={read.value} />
          <MoneyEntries {...props} payments={read.value} />
        </>
      )}
    </View>
  );
}

/** Every part, its share, amount and state, in order — the schedule the terms made (`M11-52`). */
function MoneyParts(props: ProjectMoneyProps & { readonly payments: ProjectPayments }) {
  const { words } = props;
  const format = useFormat();
  const items = partRowsOf(props, format).map(({ item, more }) =>
    more === null
      ? item
      : {
          ...item,
          content: (
            <View style={styles.more}>
              <View style={styles.notes}>
                {more.notes.map((note) => (
                  <Text key={note} variant="body-sm" color="secondary">
                    {note}
                  </Text>
                ))}
              </View>
              {more.acts.length === 0 ? null : (
                <Menu label={more.label} items={more.acts} align="end" />
              )}
            </View>
          ),
        },
  );
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.parts} aside={words.fromTerms} />
      <View style={styles.pad}>
        <Timeline variant="page" density="functional" items={items} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  pad: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  more: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  notes: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
});
