import type { SearchLeadRow, SearchNumber, SearchRow } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { type FocusAfter, type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { CardRow, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { Badge } from '../Chip/Chip.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { LeadStateBadge } from '../LeadStateBadge/LeadStateBadge.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { CATALOG_GLYPH, numberRuns, rowNameOf, rowOpenOf } from './SearchResults.logic';
import type { SearchResultsProps } from './SearchResults.types';

type RowProps<Failure> = SearchResultsProps<Failure> & {
  row: SearchRow<Failure>;
  first: boolean;
};

/**
 * One result on the phone: the row is the one target that opens its record. A junk lead's Reopen
 * sits at its end, outside that target, and its line under it.
 */
export function SearchResultRow<Failure>(props: RowProps<Failure>) {
  const { row, first, cursor, onOpen, onReopen, words } = props;
  const target = useRef<FocusHandle>(null);
  const open = rowOpenOf(row, words, onOpen);
  const reopen = row.kind === 'lead' ? row.reopen : null;
  return (
    <CardRow
      first={first}
      open={open === undefined ? undefined : { ...open, current: cursor === row.key }}
      targetRef={target}
      highlighted={cursor === row.key}
      busy={reopen?.kind === 'waiting'}
      aside={
        row.kind === 'lead' && reopen !== null ? (
          <ReopenAct
            row={row}
            waiting={reopen.kind === 'waiting'}
            onReopen={() => onReopen(row.id)}
            focusAfter={target}
            words={words}
          />
        ) : undefined
      }
      after={
        reopen === null || reopen.kind === 'offered' ? undefined : (
          <PendingAction
            label={words.reopening}
            state={reopen.kind === 'waiting' ? 'waiting' : 'returned'}
            reason={reopen.kind === 'returned' ? words.reopenReturned(reopen.failure) : undefined}
          />
        )
      }
    >
      <RowBody {...props} opens={open !== undefined} />
    </CardRow>
  );
}

/** The row's face and words; the first line keeps clear of Reopen at its end. */
function RowBody<Failure>(props: RowProps<Failure> & { opens: boolean }) {
  const { row, opens } = props;
  const room = useCardRowAsideRoom();
  const junk = row.kind === 'lead' && row.state === 'junk';
  return (
    <View style={[styles.row, { paddingEnd: room }]}>
      {row.kind === 'catalog_item' ? (
        <View style={styles.tile}>
          <ShellGlyph name={CATALOG_GLYPH[row.componentKind]} size="md" tone="secondary" />
        </View>
      ) : (
        <View style={junk ? styles.sunk : undefined}>
          <Avatar name={rowNameOf(row) ?? undefined} size={40} />
        </View>
      )}
      <View style={styles.main}>
        <RowWords {...props} />
      </View>
      {opens && room === 0 ? <ShellGlyph name="chevron-right" size="sm" tone="secondary" /> : null}
    </View>
  );
}

function RowWords<Failure>({ row, words }: RowProps<Failure>) {
  const name = rowNameOf(row);
  const title =
    name === null ? (
      <NamedGap gap={words.noName} scale="field" />
    ) : (
      <Text variant="body" bold>
        {name}
      </Text>
    );
  if (row.kind === 'person') {
    return (
      <View style={styles.line}>
        {title}
        {row.you ? <Badge tone="neutral">{words.you}</Badge> : null}
      </View>
    );
  }
  if (row.kind === 'catalog_item') {
    return (
      <>
        {title}
        <Text variant="body-sm" color="secondary">
          {words.componentKind(row.componentKind)}
        </Text>
      </>
    );
  }
  return (
    <>
      <View style={styles.line}>
        {title}
        {row.exact ? <Badge tone="accent">{words.numberMatch}</Badge> : null}
      </View>
      <View style={styles.line}>
        <SearchNumberText number={row.number} />
        {row.city === null ? (
          <NamedGap gap={words.noCity} scale="cell" />
        ) : (
          <Text variant="body-sm" color="secondary">
            {row.city}
          </Text>
        )}
      </View>
      {row.kind === 'lead' ? <LeadMarks row={row} words={words} /> : null}
    </>
  );
}

function LeadMarks<Failure>({
  row,
  words,
}: {
  row: SearchLeadRow<Failure>;
  words: SearchResultsProps<Failure>['words'];
}) {
  if (row.state !== null) {
    return (
      <View style={styles.line}>
        <LeadStateBadge state={row.state} label={words.state(row.state)} />
      </View>
    );
  }
  return (
    <View style={styles.line}>
      <LeadSourceMark source={row.source} label={words.source(row.source)} form="glyph" />
      <Text variant="body-sm" color="secondary">
        {words.stage(row.stage)}
      </Text>
    </View>
  );
}

/** The number in the market's form, the digits typed marked across its spaces. */
function SearchNumberText({ number }: { number: SearchNumber }) {
  const runs = numberRuns(number);
  return (
    <Text variant="mono" style={styles.number}>
      {runs.before}
      {runs.typed === '' ? null : (
        <Text variant="mono" style={styles.typed}>
          {runs.typed}
        </Text>
      )}
      {runs.after}
    </Text>
  );
}

/** Reopen: one press, busy while out; once it lands it leaves, and the reader goes to the row. */
function ReopenAct<Failure>({
  row,
  waiting,
  onReopen,
  focusAfter,
  words,
}: {
  row: SearchLeadRow<Failure>;
  waiting: boolean;
  onReopen: () => void;
  focusAfter: FocusAfter;
  words: SearchResultsProps<Failure>['words'];
}) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="undo" size="sm" tone="primary" />}
      spokenName={words.reopenNamed(row.name)}
      loading={waiting}
      onClick={leaving(onReopen)}
    >
      {words.reopen}
    </Button>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  sunk: { opacity: 0.6 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: colors.fill,
  },
  number: { color: colors['text-primary'] },
  typed: { backgroundColor: colors['accent-subtle'], color: colors['text-primary'] },
});
