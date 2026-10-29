import { optionalFolded } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Explainer } from '../Explainer/Explainer.native';
import { NumberField } from '../NumberField/NumberField.native';
import { RangeField } from '../RangeField/RangeField.native';
import { Select } from '../Select/Select.native';
import type { SpecCell, SpecRow } from './CatalogItemForm.layout';
import { SPEC_LAYOUT } from './CatalogItemForm.layout';
import {
  choiceFieldOf,
  figureFieldOf,
  type SpecCellFacts,
  windowFieldOf,
} from './CatalogItemForm.logic';
import type { SpecFieldsProps } from './CatalogItemForm.parts.types';

type CellProps = SpecCellFacts & { cell: SpecCell };

/**
 * The kind's typed specification (`SCR-M01-16`, the 375 frames): its pairs as the board lays them
 * out (`SPEC_LAYOUT`), a lone field full width, then its optional values — folded behind *Add
 * optional values* while every one is blank, under *Optional* once one holds a figure.
 */
export function SpecFields(props: SpecFieldsProps) {
  const layout = SPEC_LAYOUT[props.draft.kind];
  return (
    <View style={styles.spec}>
      {layout.narrow.map((row) => (
        <SpecGridRow key={row.cells.map((cell) => cell.path).join('|')} row={row} props={props} />
      ))}
      <OptionalValues {...props} />
    </View>
  );
}

/** One row of equal columns, 12 apart; a column the row leaves empty keeps its room. */
function SpecGridRow({ row, props }: { row: SpecRow; props: SpecFieldsProps }) {
  const left = row.columns - row.cells.length;
  return (
    <View style={styles.row}>
      {row.cells.map((cell) => (
        <View key={cell.path} style={styles.cell}>
          <SpecCellField {...props} cell={cell} />
        </View>
      ))}
      {left > 0 ? <View style={{ flex: left }} /> : null}
    </View>
  );
}

function OptionalValues(props: SpecFieldsProps) {
  const { words, draft, disabled, onChange } = props;
  const ask = words.optionalAsk;
  const explainer =
    ask === null ? null : (
      <Explainer
        label={ask.label}
        title={ask.title}
        pages={ask.body}
        density="functional"
        placement="bottom"
      />
    );
  if (optionalFolded(draft)) {
    return (
      <View style={styles.optionalHead}>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
          onClick={() => onChange({ type: 'unfold' })}
        >
          {words.addOptional}
        </Button>
        {explainer}
      </View>
    );
  }
  const { optional } = SPEC_LAYOUT[draft.kind];
  const rows = rowsOf(optional.cells, optional.narrow);
  return (
    <>
      <View style={styles.optionalHead}>
        <Text variant="caption" color="secondary" bold>
          {words.optional}
        </Text>
        {explainer}
      </View>
      {rows.map((row) => (
        <SpecGridRow key={row.cells.map((cell) => cell.path).join('|')} row={row} props={props} />
      ))}
    </>
  );
}

/** The optional cells in rows of the narrow column count, as the web grid wraps them. */
function rowsOf(cells: readonly SpecCell[], columns: number): SpecRow[] {
  const rows: SpecRow[] = [];
  for (let at = 0; at < cells.length; at += columns) {
    rows.push({ columns, cells: cells.slice(at, at + columns) });
  }
  return rows;
}

/** One field of the block: a figure, one of the three lists, or the inverter's MPPT window. */
function SpecCellField({ cell, ...facts }: CellProps) {
  if (cell.as === 'window') return <RangeField {...windowFieldOf(facts, cell)} />;
  if (cell.as === 'number') return <NumberField {...figureFieldOf(facts, cell)} />;
  return <Select {...choiceFieldOf(facts, cell)} />;
}

const styles = StyleSheet.create({
  spec: { gap: theme.spacing['sp-4'] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  cell: { flex: 1, minWidth: 0 },
  optionalHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
