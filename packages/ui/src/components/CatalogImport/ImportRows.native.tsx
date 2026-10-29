import { mapRead } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { cardOf, fixedLineOf, type ImportFormats, productOf } from './CatalogImport.logic';
import type { CatalogImportProps, ImportRowList } from './CatalogImport.types';
import { groupsInScope, listFailed, rowsOf } from './CatalogImport.view';
import { ImportFixCard, ImportFixedCard } from './ImportFixCard.native';
import { ImportOutcomeGroup, ImportOutcomeList, MoreRows } from './ImportOutcomeGroup.native';
import { ImportOverview } from './ImportOverview.native';

interface ImportRowsProps extends CatalogImportProps {
  formats: ImportFormats;
}

type Phase = 'preview' | 'report';

/** The report's groups that are always open, each under its own head: the rows not written. */
const OPEN_GROUPS: readonly string[] = ['failed', 'leftOut'];

/**
 * Steps 3 and 4 (m17-c to m17-r, m17-o): the overview, then the rows that need the person and the
 * outcomes folded by group — or, while a search is typed, what it found. A pressed ring shows
 * only its part.
 */
export function ImportRows(props: ImportRowsProps) {
  const { job, words, query } = props;
  if (job === null) return null;
  const phase: Phase = props.frame === 'report' ? 'report' : 'preview';
  return (
    <View style={styles.step}>
      <ImportOverview {...props} job={job} phase={phase} />
      {phase === 'preview' ? (
        <Text variant="caption" color="secondary" style={styles.note}>
          {words.overrideLine}
        </Text>
      ) : null}
      {query !== '' && props.lists.found !== null ? (
        <Found {...props} found={props.lists.found} rows={job.counts?.rows ?? 0} phase={phase} />
      ) : (
        <Lists {...props} phase={phase} />
      )}
    </View>
  );
}

/** The lists with no search: *Need you* first in the preview, then each group in scope. */
function Lists(props: ImportRowsProps & { phase: Phase }) {
  const { lists, scope, words, phase } = props;
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((held) => {
      const next = new Set(held);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const showsAttention = scope === null || scope === 'attention';
  const groups = scope === 'attention' ? [] : groupsInScope(lists.groups, scope);
  return (
    <>
      {showsAttention && lists.attention !== null ? (
        <NeedYou {...props} attention={lists.attention} />
      ) : null}
      {groups.map((group) =>
        phase === 'report' && OPEN_GROUPS.includes(group.id) ? (
          <View key={group.id} style={styles.section}>
            <SectionHead label={words.groups[group.id]} aside={words.countRows(group.total)} />
            <ImportOutcomeList {...props} rows={rowsOf(group)} />
            <MoreRows list={group} words={words} />
          </View>
        ) : (
          <ImportOutcomeGroup
            key={group.id}
            {...props}
            group={group}
            open={open.has(group.id)}
            onToggle={() => toggle(group.id)}
          />
        ),
      )}
    </>
  );
}

/**
 * *Need you*: the rows this visit settled, green with *Undo*, then a card for each row still
 * asking. *K of N fixed* counts both.
 */
function NeedYou(props: ImportRowsProps & { attention: ImportRowList }) {
  const { attention, fixed, words, formats } = props;
  const asking = rowsOf(attention).filter((row) => !fixed.has(row.rowNumber));
  // The card an *Undo* brings back takes the focus the *Undo* had.
  const [returning, setReturning] = useState<number | null>(null);
  // The card a fix just settled takes the focus the fix had; cards settled before keep still.
  const seen = useRef<ReadonlySet<number>>(new Set(fixed.keys()));
  const settled = [...fixed.keys()].find((row) => !seen.current.has(row)) ?? null;
  useEffect(() => {
    seen.current = new Set(fixed.keys());
  });
  if (asking.length === 0 && fixed.size === 0 && !listFailed(attention)) return null;
  return (
    <View style={styles.section}>
      <SectionHead
        label={words.needYou}
        aside={words.fixedProgress(fixed.size, attention.total + fixed.size)}
      />
      {[...fixed].map(([cardRow, { row }]) => (
        <ImportFixedCard
          key={cardRow}
          title={productOf(row)}
          line={fixedLineOf(row, words, formats)}
          words={words}
          focus={cardRow === settled}
          onUndo={() => {
            setReturning(cardRow);
            props.onUndo(cardRow);
          }}
        />
      ))}
      <Cards
        {...props}
        list={{ ...attention, read: mapRead(attention.read, () => asking) }}
        returning={returning}
      />
    </View>
  );
}

/** The cards of the rows still asking, and the next page of them. */
function Cards(props: ImportRowsProps & { list: ImportRowList; returning?: number | null }) {
  const { list, words } = props;
  // A list whose first page failed offers *Try again*, never an empty step.
  const rows = rowsOf(list);
  if (rows.length === 0) return listFailed(list) ? <MoreRows list={list} words={words} /> : null;
  return (
    <>
      {rows.map((row) => (
        <ImportFixCard
          key={row.rowNumber}
          card={cardOf(row, props, props.formats)}
          words={words}
          focus={row.rowNumber === props.returning}
        />
      ))}
      <MoreRows list={list} words={words} />
    </>
  );
}

/**
 * A search (m17-r): how many rows match, then in the preview the matches that need the person as
 * cards and the matches ready to import as rows; in the report every match as a row.
 */
function Found(
  props: ImportRowsProps & {
    found: NonNullable<ImportRowsProps['lists']['found']>;
    rows: number;
    phase: Phase;
  },
) {
  const { found, words, phase } = props;
  const total = found.attention.total + found.ready.total;
  // A search that failed to read says nothing matched only once it has read: it offers *Try again*.
  const failedList = [found.attention, found.ready].find(listFailed);
  if (failedList !== undefined) return <MoreRows list={failedList} words={words} />;
  const line = (
    <Text variant="caption" color="secondary" style={styles.note}>
      {words.matchLine(total, props.rows, props.query)}
    </Text>
  );
  if (total === 0) return line;
  if (phase === 'report') {
    return (
      <>
        {line}
        <ImportOutcomeList {...props} rows={[...rowsOf(found.attention), ...rowsOf(found.ready)]} />
      </>
    );
  }
  return (
    <>
      {line}
      {found.attention.total === 0 ? null : (
        <View style={styles.section}>
          <SectionHead label={words.needYou} aside={words.countRows(found.attention.total)} />
          <Cards {...props} list={found.attention} />
        </View>
      )}
      {found.ready.total === 0 ? null : (
        <View style={styles.section}>
          <SectionHead label={words.readyToImport} aside={words.countRows(found.ready.total)} />
          <ImportOutcomeList {...props} rows={rowsOf(found.ready)} />
          <MoreRows list={found.ready} words={words} />
        </View>
      )}
    </>
  );
}

/** A section's head on the page: its name in bold, and its count or progress beside it. */
function SectionHead({ label, aside }: { label: string; aside: string }) {
  return (
    <View style={styles.head}>
      <Text variant="body-sm" bold style={styles.headLabel}>
        {label}
      </Text>
      <Text variant="caption" color="secondary">
        {aside}
      </Text>
    </View>
  );
}

/* The board's steps 3 and 4: 12 between every part; a section's head 4 in from the cards' edge
   and 4 above them, its aside beside it. */
const styles = StyleSheet.create({
  step: { gap: theme.spacing['sp-3'], minWidth: 0 },
  section: { gap: theme.spacing['sp-3'] },
  note: { paddingHorizontal: theme.spacing['sp-1'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  headLabel: { flex: 1 },
});
