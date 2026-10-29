import { CATALOG_IMPORT_FIELDS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Select } from '../Select/Select.native';
import { raisedCard } from './CatalogImport.surfaces.native';
import type { CatalogImportProps, CatalogImportWords } from './CatalogImport.types';
import { columnsOf, type ImportColumnView } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph.native';

/** The option that leaves a column out; never a field id. */
const LEAVE_OUT = 'leave-out';

/**
 * Step 2, Columns (m17-b): each column by the file's own header, an arrow and the field it fills —
 * the ones the guess could not place first, then *Matched automatically — check them* once over
 * the rest.
 */
export function ImportColumns(props: CatalogImportProps) {
  const { words } = props;
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
    <View style={styles.rows}>
      {views.map((view) => (
        <MappingRow
          key={view.column}
          view={view}
          words={words}
          leftOut={leftOut.has(view.column)}
          onPlace={place}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.step}>
      <Text variant="body-sm" color="secondary" style={styles.inset}>
        {words.matchedIntro(matched.length, open.length + matched.length, waiting)}
      </Text>
      {open.length === 0 ? null : rows(open)}
      {matched.length === 0 ? null : (
        <>
          <Text variant="caption" color="secondary" style={styles.matchedHead}>
            {words.matchedAutomatically}
          </Text>
          {rows(matched)}
        </>
      )}
    </View>
  );
}

function MappingRow({
  view,
  words,
  leftOut,
  onPlace,
}: {
  view: ImportColumnView;
  words: CatalogImportWords;
  leftOut: boolean;
  onPlace: (column: number, value: string) => void;
}) {
  const left = view.field === null && leftOut;
  return (
    <View style={styles.map}>
      <Text variant="mono" style={styles.header}>
        {view.header}
      </Text>
      <ImportGlyph
        name="arrow-right-full"
        size="xs"
        stroke={1.7}
        color={theme.colors['text-tertiary']}
      />
      <View style={styles.field}>
        <Select
          value={view.field ?? (left ? LEAVE_OUT : undefined)}
          placeholder={words.chooseField}
          closeLabel={words.closeList}
          ariaLabel={words.importColumnAs(view.header)}
          options={[
            { value: LEAVE_OUT, label: words.leaveColumnOut },
            ...CATALOG_IMPORT_FIELDS.map((field) => ({ value: field, label: words.fields[field] })),
          ]}
          helper={left ? words.leftOutHelper : undefined}
          density="functional"
          onChange={(value) => onPlace(view.column, value)}
        />
      </View>
    </View>
  );
}

/* The board's 375 mapping row: 10 8 10 12 around, 6 between, radius 16, the field 216 wide; the
   rows 8 apart, the step 12. The header is the file's own text in the figures' face at the
   caption's size, and wraps rather than clips. */
const FIELD_WIDTH = 216;

const styles = StyleSheet.create({
  step: { gap: theme.spacing['sp-3'], minWidth: 0 },
  inset: { paddingHorizontal: theme.spacing['sp-1'] },
  matchedHead: { paddingTop: 6, paddingHorizontal: theme.spacing['sp-1'] },
  rows: { gap: theme.spacing['sp-2'] },
  map: {
    ...raisedCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingRight: theme.spacing['sp-2'],
    paddingBottom: 10,
    paddingLeft: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  header: { flex: 1, minWidth: 0, fontSize: theme.type.roles.caption.fontSize },
  field: { flexGrow: 0, flexShrink: 0, flexBasis: FIELD_WIDTH },
});
