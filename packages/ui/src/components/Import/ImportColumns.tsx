import type { ImportColumnView } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text';
import { Select } from '../Select';
import { columnChoiceOf } from './Import.logic';
import type { ImportColumnsProps, ImportColumnsWords } from './Import.types';
import { ImportGlyph } from './ImportGlyph';
import { useLeftOutColumns } from './use-left-out-columns';
import './Import.css';
import './ImportColumns.css';

/**
 * Step 2, Columns (m17-b, m17-g): each column by the file's own header, an arrow and the field it
 * fills — the ones the guess could not place first, then *Matched automatically — check them*
 * once over the rest. At 1536 every row is on screen, two to a line.
 */
export function ImportColumns<Field extends string>(props: ImportColumnsProps<Field>) {
  const { words, wide, fields, samples } = props;
  const { leftOut, waiting, place } = useLeftOutColumns(props);
  const { open, matched } = props.columns;
  const rows = (views: readonly ImportColumnView<Field>[]) => (
    <div className="hg-import-maps" data-wide={wide ? 'true' : 'false'}>
      {views.map((view) => (
        <MappingRow
          key={view.column}
          view={view}
          words={words}
          fields={fields}
          samples={samples}
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

interface MappingRowProps<Field extends string>
  extends Pick<ImportColumnsProps<Field>, 'fields' | 'samples' | 'wide'> {
  view: ImportColumnView<Field>;
  words: ImportColumnsWords;
  leftOut: boolean;
  onPlace: (column: number, value: string) => void;
}

function MappingRow<Field extends string>(props: MappingRowProps<Field>) {
  const { view, words, wide, leftOut } = props;
  const left = view.field === null && leftOut;
  const header = <span className="hg-import-map-header">{view.header}</span>;
  return (
    <div className="hg-import-map">
      {props.samples ? (
        <span className="hg-import-map-words">
          {header}
          <ColumnSamples samples={view.samples} />
        </span>
      ) : (
        header
      )}
      <ImportGlyph
        name="arrow-right"
        size={wide ? 'sm' : 'xs'}
        stroke={1.7}
        className="hg-import-map-arrow"
      />
      <div className="hg-import-map-field">
        <Select
          {...columnChoiceOf(view, words, props.fields, left)}
          onChange={(value) => props.onPlace(view.column, value)}
        />
      </div>
    </div>
  );
}

/** The first values under the header, as the file wrote them: data, never translated. */
function ColumnSamples({ samples }: { samples: readonly string[] }) {
  if (samples.length === 0) return null;
  return (
    <ul className="hg-import-map-samples">
      {samples.map((sample, index) => (
        // A column may repeat a value, so each keeps its place.
        // biome-ignore lint/suspicious/noArrayIndexKey: the values are fixed for the header row shown
        <li key={index} className="hg-import-map-sample">
          {sample}
        </li>
      ))}
    </ul>
  );
}
