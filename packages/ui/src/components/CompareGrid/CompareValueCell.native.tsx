import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { MarketFormat } from '../../utils/format';
import { useFormat } from '../MarketProvider/market-context';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { formatNumber, gapOf, isAbsent, rawValue } from './CompareGrid.logic';
import type { CompareAttribute, CompareOption } from './CompareGrid.types';
import {
  cellGround,
  compareStyles,
  figureStyle,
  strongFigureStyle,
} from './CompareGridStyles.native';

/** The best value in a row is marked with a WORD — a mark never relies on colour alone. */
function Best() {
  return (
    <Text variant="overline" color="success">
      {'  Best'}
    </Text>
  );
}

/** The words of a cell that HAS a value: the pack's formatting of a figure, or the caller's node. */
function valueWords<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  raw: ReactNode | number | undefined,
  format: MarketFormat,
): ReactNode {
  if (typeof raw === 'number') return formatNumber(attribute, raw, format);
  return raw;
}

interface ValueCellProps<Opt extends CompareOption> {
  attribute: CompareAttribute<Opt>;
  option: Opt;
  selected: boolean;
  zebra: boolean;
  best: boolean;
  box: StyleProp<ViewStyle>;
}

/**
 * **One attribute × one option.** It resolves the cell's raw value once, says it in words, decides
 * the typeface and emphasis that value earns, and carries the row's Best mark when this column
 * won — the four jobs a comparison cell has, in the one place that has them all.
 */
export function CompareValueCell<Opt extends CompareOption>({
  attribute,
  option,
  selected,
  zebra,
  best,
  box,
}: ValueCellProps<Opt>) {
  /* The market's own words for a figure — a money row's currency comes from here, never from a
     symbol this component invented. */
  const format = useFormat();
  const raw = rawValue(attribute, option);
  /* AN UNFLAGGED NUMBER IS STILL A FIGURE. The third clause is what keeps this half agreeing with
     the web half: a value that arrives as a number is monospaced whether or not the row said so. */
  const mono = attribute.mono === true || attribute.numeric === true || typeof raw === 'number';
  const gap = gapOf(attribute);
  return (
    <View style={[box, compareStyles.cell, cellGround(selected, zebra)]}>
      <View style={compareStyles.valueRow}>
        {/* AN ABSENT VALUE IS A NAMED GAP, NOT AN EM-DASH — `NamedGap` is the system's one
            renderer of that sentence, and it is a View, so it stands beside the words rather
            than inside them. */}
        {isAbsent(raw) ? (
          <NamedGap scale="cell" gap={gap.gap} align={gap.align} />
        ) : (
          <Text
            variant={mono ? 'mono' : 'body-sm'}
            style={attribute.strong === true ? strongFigureStyle : figureStyle}
          >
            {valueWords(attribute, raw, format)}
          </Text>
        )}
        {best ? <Best /> : null}
      </View>
    </View>
  );
}
