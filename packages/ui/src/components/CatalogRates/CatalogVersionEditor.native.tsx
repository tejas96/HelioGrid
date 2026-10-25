import { basisPointsToPercent, MAX_MARGIN } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Textarea } from '../Textarea/Textarea.native';
import { figureOf, ratesByBasis } from './CatalogRates.logic';
import type {
  CatalogVersionEdit,
  CatalogVersionRow,
  CatalogVersionWords,
} from './CatalogRates.types';

/**
 * The new price-book version on the phone, as s-version-new draws it: its margin, what changed,
 * *Add a rate*, then the rates under how each is charged — a name that opens the rate sheet and one
 * small money box. The rows sit on the sheet: a tile never holds a field (`F7-49`).
 */
export function VersionEdit(props: CatalogVersionEdit) {
  const { words } = props;
  return (
    <View style={styles.body}>
      <NumberField
        label={words.defaultMargin}
        value={figureOf(props.margin)}
        onCommit={(value) => props.onMargin(String(value))}
        commits="as-typed"
        onClear={() => props.onMargin('')}
        unit="%"
        step={0.5}
        precision={1}
        min={0}
        max={Number(basisPointsToPercent(MAX_MARGIN))}
        density="functional"
      />
      <Textarea
        label={words.whatChanged}
        value={props.note}
        onChange={props.onNote}
        rows={2}
        density="functional"
        {...(props.noteHint === null ? {} : { helper: props.noteHint })}
      />
      <View style={styles.add}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ShellGlyph name="plus" size="md" tone="primary" />}
          onClick={props.onAddRate}
        >
          {words.addRate}
        </Button>
      </View>
      {ratesByBasis(props.rows).map((group) => (
        <View key={group.basis} style={styles.group}>
          <View style={styles.groupHead}>
            <Text variant="overline" color="secondary">
              {words.bases[group.basis]}
            </Text>
            <Text variant="caption" color="secondary">
              {String(group.rates.length)}
            </Text>
          </View>
          {group.rates.map((row) => (
            <EditRow key={row.key} row={row} words={words} />
          ))}
        </View>
      ))}
      {props.problem === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {props.problem}
        </Text>
      )}
    </View>
  );
}

/** One rate: its name opens the rate sheet; a moved amount shows the old one struck, *Changed*. */
function EditRow({ row, words }: { row: CatalogVersionRow; words: CatalogVersionWords }) {
  return (
    <View style={styles.row}>
      <View style={styles.words}>
        <Pressable onPress={row.onOpen} style={styles.name}>
          <Text variant="body-sm">{row.name}</Text>
        </Pressable>
        {row.was === null ? null : (
          <View style={styles.was} accessible accessibilityLabel={words.was(row.was)}>
            <Text variant="mono" color="secondary" style={styles.struck}>
              {row.was}
            </Text>
            <Text variant="caption" color="info" bold>
              {words.changed}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.amount}>
        <NumberField
          labelSpokenOnly
          label={row.labels.amount}
          value={figureOf(row.amount)}
          onCommit={(value) => row.onAmount(String(value))}
          commits="as-typed"
          onClear={() => row.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  add: { alignItems: 'flex-start' },
  group: { gap: theme.spacing['sp-1'] },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-2'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.layout['tile-gap'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  name: { alignItems: 'flex-start', justifyContent: 'center' },
  was: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  struck: { textDecorationLine: 'line-through' },
  /* Room for *₹18,000* at the field's own size; the board's 92 is drawn at the caption size. */
  amount: { width: theme.spacing['sp-24'] + theme.spacing['sp-8'] },
});
