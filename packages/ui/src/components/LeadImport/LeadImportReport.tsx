import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { useFocusOnMount } from '../CatalogImport/use-focus-on-mount';
import { HeroPanel } from '../HeroPanel';
import { LeadSourceMark } from '../LeadSourceMark';
import { useFormat } from '../MarketProvider/market-context';
import { columnsUsedOf } from './LeadImport.logic';
import type { LeadImportProps } from './LeadImport.types';
import { LeadImportRows } from './LeadImportRows';

/**
 * The report (`M02-21`): the leads that landed in the one hero, with what became of the duplicates
 * and how many rows were turned away — then every one of those rows with its reason, beside the
 * columns the import read. Focus lands on its heading as it opens. What landed is never rolled back.
 */
export function LeadImportReport(props: LeadImportProps & { wide: boolean }) {
  const { outcome, words, wide } = props;
  const format = useFormat();
  const heading = useFocusOnMount<HTMLHeadingElement>(true);
  if (outcome === null) return null;
  const duplicates = words.duplicatesDone[props.choice];
  const line = (count: number, title: string, sub: string | null) => (
    <li className="hg-lead-import-tally">
      <span className="hg-lead-import-tally-count">{format.number(count)}</span>
      <span className="hg-lead-import-tally-words">
        <span className="hg-lead-import-tally-title">{title}</span>
        {sub === null ? null : <span className="hg-lead-import-tally-sub">{sub}</span>}
      </span>
    </li>
  );
  return (
    <>
      <HeroPanel label={words.doneRead(outcome.read)}>
        <div className="hg-lead-import-report" data-wide={wide ? 'true' : 'false'}>
          <div className="hg-lead-import-landed">
            <h2 ref={heading} tabIndex={-1} className="hg-lead-import-figure hg-focus-target">
              {words.landed(outcome.landed)}
            </h2>
            <p className="hg-lead-import-land">
              <LeadSourceMark source="import" label={words.sourceImport} />
              <span>{words.inInbox}</span>
            </p>
            <div className="hg-lead-import-acts">
              <Button variant="primary" size="lg" onClick={props.onOpenInbox}>
                {words.openInbox}
              </Button>
              <Button variant="secondary" size="lg" onClick={props.onStartOver}>
                {words.importAnother}
              </Button>
            </div>
          </div>
          <div className="hg-lead-import-tallies">
            <ul className="hg-lead-import-tally-list">
              {line(outcome.landed, words.created, null)}
              {line(outcome.duplicates, duplicates.title, duplicates.line)}
              {line(outcome.rejected, words.rejectedRows.title, words.rejectedRows.line)}
            </ul>
            <p className="hg-lead-import-stays">
              <ShellGlyph name="tick" size="sm" tone="success" />
              <span>{words.notRolledBack}</span>
            </p>
          </div>
        </div>
      </HeroPanel>
      <div className="hg-lead-import-report-grid" data-wide={wide ? 'true' : 'false'}>
        <LeadImportRows {...props} phase="report" />
        <LeadImportColumnsRead {...props} />
      </div>
    </>
  );
}

/** The columns the import read, each header to its field — or *Not imported*, never dropped quietly. */
function LeadImportColumnsRead(props: LeadImportProps) {
  const { words, columns } = props;
  const used = columnsUsedOf(props);
  const all = [...columns.open, ...columns.matched].sort((a, b) => a.column - b.column);
  return (
    <Card density="functional" label={words.columnsHeading}>
      <div className="hg-lead-import-columns">
        <div className="hg-lead-import-columns-head">
          <Text variant="overline" as="h3" color="secondary">
            {words.columnsHeading}
          </Text>
          <Text variant="caption" color="secondary">
            {words.columnsUsed(used.used, used.of)}
          </Text>
        </div>
        <ul className="hg-lead-import-column-list">
          {all.map((column) => (
            <li key={column.column} className="hg-lead-import-column">
              <span className="hg-lead-import-column-header">{column.header}</span>
              <span className="hg-lead-import-column-field" data-left={column.field === null}>
                {column.field === null ? words.notImported : words.fields[column.field]}
              </span>
            </li>
          ))}
        </ul>
        <Text variant="caption" color="secondary">
          {words.columnsNamed}
        </Text>
      </div>
    </Card>
  );
}
