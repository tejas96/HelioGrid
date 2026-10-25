import { useEffect, useRef, useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { cardOf, fixedLineOf, type ImportFormats, productOf } from './CatalogImport.logic';
import type { CatalogImportProps, ImportRowList } from './CatalogImport.types';
import { groupsInScope } from './CatalogImport.view';
import { ImportFixCard, ImportFixedCard } from './ImportFixCard';
import { ImportOutcomeGroup, ImportOutcomeList, MoreRows } from './ImportOutcomeGroup';
import { ImportOverview } from './ImportOverview';
import './ImportFixCard.css';

interface ImportRowsProps extends CatalogImportProps {
  wide: boolean;
  formats: ImportFormats;
  readyNow: number;
}

type Phase = 'preview' | 'report';

/** The report's groups that are always open, each under its own head: the rows not written. */
const OPEN_GROUPS: readonly string[] = ['failed', 'leftOut'];

/**
 * Steps 3 and 4 (m17-c to m17-r, m17-o; m17-h, m17-p, m17-q): the overview, then the rows that
 * need the person and the outcomes folded by group — or, while a search is typed, what it found.
 * A pressed filter shows only its part.
 */
export function ImportRows(props: ImportRowsProps) {
  const { job, words, query } = props;
  if (job === null) return null;
  const phase: Phase = props.frame === 'report' ? 'report' : 'preview';
  return (
    <div className="hg-import-step" data-step="rows">
      <ImportOverview {...props} job={job} phase={phase} />
      {phase === 'preview' ? (
        <Text variant="caption" color="secondary" className="hg-import-note">
          {words.overrideLine}
        </Text>
      ) : null}
      {query !== '' && props.lists.found !== null ? (
        <Found
          {...props}
          found={props.lists.found}
          fileRows={job.counts?.rows ?? 0}
          phase={phase}
        />
      ) : (
        <Lists {...props} phase={phase} />
      )}
    </div>
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
          <section key={group.id} className="hg-import-section">
            <SectionHead label={words.groups[group.id]} aside={words.countRows(group.total)} />
            <ImportOutcomeList {...props} rows={group.rows} />
            <MoreRows list={group} words={words} />
          </section>
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
 * asking — two to a line at 1536. *K of N fixed* counts both.
 */
function NeedYou(props: ImportRowsProps & { attention: ImportRowList }) {
  const { attention, fixed, words, formats } = props;
  const asking = attention.rows.filter((row) => !fixed.has(row.rowNumber));
  // The card an *Undo* brings back takes the focus the *Undo* had.
  const [returning, setReturning] = useState<number | null>(null);
  // The card a fix just settled takes the focus the fix had; cards settled before keep still.
  const seen = useRef<ReadonlySet<number>>(new Set(fixed.keys()));
  const settled = [...fixed.keys()].find((row) => !seen.current.has(row)) ?? null;
  useEffect(() => {
    seen.current = new Set(fixed.keys());
  });
  if (asking.length === 0 && fixed.size === 0 && attention.failed !== true) return null;
  return (
    <section className="hg-import-section">
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
      <Cards {...props} list={{ ...attention, rows: asking }} returning={returning} />
    </section>
  );
}

/** The cards of the rows still asking, and the next page of them. */
function Cards(props: ImportRowsProps & { list: ImportRowList; returning?: number | null }) {
  const { list, words } = props;
  // A list whose first page failed offers *Try again*, never an empty step.
  if (list.rows.length === 0)
    return list.failed === true ? <MoreRows list={list} words={words} /> : null;
  return (
    <>
      <div className="hg-import-cards" data-wide={props.wide ? 'true' : 'false'}>
        {list.rows.map((row) => (
          <ImportFixCard
            key={row.rowNumber}
            card={cardOf(row, props, props.formats)}
            words={words}
            focus={row.rowNumber === props.returning}
          />
        ))}
      </div>
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
    fileRows: number;
    phase: Phase;
  },
) {
  const { found, words, phase } = props;
  const total = found.attention.total + found.ready.total;
  // A search that failed to read says nothing matched only once it has read: it offers *Try again*.
  const failedList = [found.attention, found.ready].find((list) => list.failed === true);
  if (failedList !== undefined) return <MoreRows list={failedList} words={words} />;
  const line = (
    <Text variant="caption" color="secondary" className="hg-import-note">
      {words.matchLine(total, props.fileRows, props.query)}
    </Text>
  );
  if (total === 0) return line;
  if (phase === 'report') {
    return (
      <>
        {line}
        <ImportOutcomeList {...props} rows={[...found.attention.rows, ...found.ready.rows]} />
      </>
    );
  }
  return (
    <>
      {line}
      {found.attention.total === 0 ? null : (
        <section className="hg-import-section">
          <SectionHead label={words.needYou} aside={words.countRows(found.attention.total)} />
          <Cards {...props} list={found.attention} />
        </section>
      )}
      {found.ready.total === 0 ? null : (
        <section className="hg-import-section">
          <SectionHead label={words.readyToImport} aside={words.countRows(found.ready.total)} />
          <ImportOutcomeList {...props} rows={found.ready.rows} />
          <MoreRows list={found.ready} words={words} />
        </section>
      )}
    </>
  );
}

/** A section's head on the page: its name in bold, and its count or progress beside it. */
function SectionHead({ label, aside }: { label: string; aside: string }) {
  return (
    <div className="hg-import-section-head">
      <span className="hg-import-section-title">{label}</span>
      <Text as="span" variant="caption" color="secondary">
        {aside}
      </Text>
    </div>
  );
}
