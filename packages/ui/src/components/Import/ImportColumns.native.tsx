import type { ImportColumnView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { Select } from '../Select/Select.native';
import { columnChoiceOf } from './Import.logic';
import { raisedCard } from './Import.surfaces.native';
import type { ImportColumnsProps, ImportColumnsWords } from './Import.types';
import { ImportGlyph } from './ImportGlyph.native';
import { useLeftOutColumns } from './use-left-out-columns';

/**
 * Step 2, Columns (m17-b): each column by the file's own header, an arrow and the field it fills —
 * the ones the guess could not place first, then *Matched automatically — check them* once over
 * the rest. The phone is always the narrow form.
 */
export function ImportColumns<Field extends string>(props: ImportColumnsProps<Field>) {
  const { words, fields, samples } = props;
  const { leftOut, waiting, place } = useLeftOutColumns(props);
  const { open, matched } = props.columns;
  const rows = (views: readonly ImportColumnView<Field>[]) => (
    <View style={styles.rows}>
      {views.map((view) => (
        <MappingRow
          key={view.column}
          view={view}
          words={words}
          fields={fields}
          samples={samples}
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

interface MappingRowProps<Field extends string>
  extends Pick<ImportColumnsProps<Field>, 'fields' | 'samples'> {
  view: ImportColumnView<Field>;
  words: ImportColumnsWords;
  leftOut: boolean;
  onPlace: (column: number, value: string) => void;
}

function MappingRow<Field extends string>(props: MappingRowProps<Field>) {
  const { view, words, leftOut } = props;
  const left = view.field === null && leftOut;
  // Beside the arrow the header takes the row's room; over its values it keeps its own height.
  const header = (
    <Text variant="mono" style={props.samples ? styles.caption : styles.header}>
      {view.header}
    </Text>
  );
  return (
    <View style={styles.map}>
      {props.samples ? (
        <View style={styles.words}>
          {header}
          {view.samples.map((sample, index) => (
            // A column may repeat a value, so each keeps its place.
            // biome-ignore lint/suspicious/noArrayIndexKey: the values are fixed for the header row shown
            <Text key={index} variant="mono" color="secondary" style={styles.caption}>
              {sample}
            </Text>
          ))}
        </View>
      ) : (
        header
      )}
      <ImportGlyph name="arrow-right-full" size="xs" stroke={1.7} color={colors['text-tertiary']} />
      <View style={styles.field}>
        <Select
          {...columnChoiceOf(view, words, props.fields, left)}
          onChange={(value) => props.onPlace(view.column, value)}
        />
      </View>
    </View>
  );
}

/* The board's 375 mapping row: 10 8 10 12 around, 6 between, radius 16, the field 216 wide; the
   rows 8 apart, the step 12. The header is the file's own text in the figures' face at the
   caption's size, and wraps rather than clips; its first values sit under it, quieter. */
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
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  caption: { fontSize: theme.type.roles.caption.fontSize },
  field: { flexGrow: 0, flexShrink: 0, flexBasis: FIELD_WIDTH },
});
