import { CATALOG_IMPORT_FIELDS } from '@heliogrid/domain';
import { useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Select } from '../Select';
import type { CatalogImportProps, CatalogImportWords } from './CatalogImport.types';
import { columnsOf, type ImportColumnView } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph';
import './ImportColumns.css';

/** The option that leaves a column out; never a field id. */
const LEAVE_OUT = 'leave-out';

/**
 * Step 2, Columns (m17-b, m17-g): each column by the file's own header, an arrow and the field it
 * fills — the ones the guess could not place first, then *Matched automatically — check them*
 * once over the rest. At 1536 every row is on screen, two to a line.
 */
export function ImportColumns(props: CatalogImportProps & { wide: boolean }) {
  const { words, wide } = props;
  /* A column left out and one not yet placed both send no field; only this visit knows which the
     person chose, so the left-out ones read *Leave this column out* rather than *Choose a field*. */
  const [leftOut, setLeftOut] = useState<ReadonlySet<number>>(new Set());
  const { open, matched } = columnsOf(props.job, props.mapping);
  const waiting = open.filter((view) => view.field === null && !leftOut.has(view.column)).length;

  const place = (column: number, value: string) => {
    const field = CATALOG_IMPORT_FIELDS.find((known) => known === value) ?? null;
    setLeftOut((held) => {
      const next = new Set(held);
      if (field === null) next.add(column);
      else next.delete(column);
      return next;
    });
    props.onPlace(column, field);
  };
  const rows = (views: readonly ImportColumnView[]) => (
    <div className="hg-import-maps" data-wide={wide ? 'true' : 'false'}>
      {views.map((view) => (
        <MappingRow
          key={view.column}
          view={view}
          words={words}
          wide={wide}
          leftOut={leftOut.has(view.column)}
          onPlace={place}
        />
      ))}
    </div>
  );

  return (
    <div className="hg-import-step" data-step="columns">
      <Text variant="body-sm" color="secondary" className="hg-import-intro">
        {words.matchedIntro(matched.length, open.length + matched.length, waiting)}
      </Text>
      {open.length === 0 ? null : rows(open)}
      {matched.length === 0 ? null : (
        <div className="hg-import-matched">
          <Text variant="caption" color="secondary" className="hg-import-matched-head">
            {words.matchedAutomatically}
          </Text>
          {rows(matched)}
        </div>
      )}
    </div>
  );
}

function MappingRow({
  view,
  words,
  wide,
  leftOut,
  onPlace,
}: {
  view: ImportColumnView;
  words: CatalogImportWords;
  wide: boolean;
  leftOut: boolean;
  onPlace: (column: number, value: string) => void;
}) {
  const left = view.field === null && leftOut;
  return (
    <div className="hg-import-map">
      <span className="hg-import-map-header">{view.header}</span>
      <ImportGlyph
        name="arrow-right"
        size={wide ? 'sm' : 'xs'}
        stroke={1.7}
        className="hg-import-map-arrow"
      />
      <div className="hg-import-map-field">
        <Select
          value={view.field ?? (left ? LEAVE_OUT : undefined)}
          placeholder={words.chooseField}
          ariaLabel={words.importColumnAs(view.header)}
          options={[
            { value: LEAVE_OUT, label: words.leaveColumnOut },
            ...CATALOG_IMPORT_FIELDS.map((field) => ({ value: field, label: words.fields[field] })),
          ]}
          helper={left ? words.leftOutHelper : undefined}
          density="functional"
          onChange={(value) => onPlace(view.column, value)}
        />
      </div>
    </div>
  );
}
