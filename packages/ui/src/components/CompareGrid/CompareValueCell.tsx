import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap';
import { gapOf, isAbsent, isMonoCell, rawValue, valueWordsOf } from './CompareGrid.logic';
import type { CompareAttribute, CompareGridWords, CompareOption } from './CompareGrid.types';

/** The best value in a row is marked with a WORD — a mark never relies on colour alone. */
function Best({ word }: { word: TranslatedText }) {
  return <span className="hg-compare-best">{word}</span>;
}

/** The cell's words: the row's NAMED GAP, the pack's formatting of a figure, or the caller's node. */
function valueWords<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  raw: ReactNode | number | undefined,
  format: MarketFormat,
  notStated: TranslatedText,
): ReactNode {
  /* AN ABSENT VALUE IS A NAMED GAP, NOT AN EM-DASH: "—" says "nothing here" and leaves the reader
     to guess whether the option lacks the feature, the figure is uncomputed, or the data is
     missing. `NamedGap` is the system's ONE renderer of that sentence — it carries the ring, the
     scale and the alignment, none of which a bare tertiary span has. `cell` is its table scale. */
  if (isAbsent(raw)) {
    const gap = gapOf(attribute, notStated);
    return <NamedGap scale="cell" gap={gap.gap} align={gap.align} />;
  }
  return valueWordsOf(attribute, raw, format);
}

interface ValueCellProps<Opt extends CompareOption> {
  attribute: CompareAttribute<Opt>;
  option: Opt;
  selected: boolean;
  best: boolean;
  words: CompareGridWords;
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
  best,
  words,
}: ValueCellProps<Opt>) {
  /* The market's own words for a figure — a money row's currency comes from here, never from a
     symbol this component invented. */
  const format = useFormat();
  const raw = rawValue(attribute, option);
  const mono = isMonoCell(attribute, raw);
  return (
    <td
      className="hg-compare-cell"
      data-selected={selected ? 'true' : undefined}
      data-numeric={attribute.numeric === true ? 'true' : undefined}
      data-mono={mono ? 'true' : undefined}
      data-strong={attribute.strong === true ? 'true' : undefined}
    >
      {valueWords(attribute, raw, format, words.notStated)}
      {best ? <Best word={words.best} /> : null}
    </td>
  );
}
