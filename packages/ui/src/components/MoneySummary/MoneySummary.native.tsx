import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import type { TextVariant } from '../../primitives/Text/Text.types';
import { resolveMoneySummary } from '../../utils/money-lines';
import type { MoneySummaryProps } from './MoneySummary.types';
import { MoneySummaryRow } from './MoneySummaryRow.native';
import { MoneySummaryTotal } from './MoneySummaryTotal.native';

interface NativeMoneySummaryProps extends MoneySummaryProps {
  style?: StyleProp<ViewStyle>;
}

/* THE DOCUMENT STEPS ARE PRINT TOKENS. `--doc-fs` (16px) and `--doc-fs-small` (14px) are emitted to
   CSS only — packages/theme's RN object carries no `doc` family — so the document surface maps to
   the NEAREST theme type role rather than hand-transcribing a px value the generator owns. Same
   answer Disclosure's native half gives. */
const LINE: Record<'screen' | 'document', TextVariant> = { screen: 'body', document: 'body-lg' };
const SMALL: Record<'screen' | 'document', TextVariant> = {
  screen: 'body-sm',
  document: 'body-sm',
};

/**
 * **What the forty lines add up to** — the itemised equation, floored at zero, with a failed
 * reconciliation printing no price at all. Same arithmetic as the web half: both call
 * `resolveMoneySummary`, so the block and `DataTable.totalRow` can never disagree.
 *
 * Print has no native equivalent, so the web half's `data-keep-together` attributes are absent
 * here; everything else — the words, the order and the rules — is identical. Same decomposition
 * too: one member of the equation is `MoneySummaryRow`, the total is `MoneySummaryTotal`.
 */
export function MoneySummary({
  lines = [],
  reconcile,
  payableLabel = 'Payable',
  overline = 'Money summary',
  surface = 'screen',
  provenance,
  note,
  density = 'expressive',
  style,
}: NativeMoneySummaryProps) {
  const m = resolveMoneySummary({ lines, reconcile });
  const line = LINE[surface];
  const small = SMALL[surface];

  return (
    /* THE WEB HALF'S `aria-label` NAMES A REGION; RN HAS NO REGIONS. On the web the name is on
       `<section aria-label={overline || payableLabel}>`, where it exists to name a landmark a
       reader can jump to — not to be read out as content. RN has no landmark to name, and the
       same words are already on screen and already reached: `overline` is the first Text in this
       block, and when there is no overline the fallback words are `payableLabel`, which
       `MoneySummaryTotal` renders. Carrying the name on this View announced nothing (a plain View
       is not an accessibility element); making it announce would say "Money summary" twice, and
       `accessible` here would fold the rows and the total into one utterance. So the name is
       dropped and the block is walked line by line, which is what an equation wants. */
    <View style={style}>
      {overline ? (
        <Text variant="overline" color="tertiary" style={styles.overline}>
          {overline}
        </Text>
      ) : null}
      <View>
        {m.lines.map((l) => (
          <MoneySummaryRow
            key={l.key || l.label}
            line={l}
            variant={line}
            smallVariant={small}
            density={density}
          />
        ))}
      </View>

      <MoneySummaryTotal
        money={m}
        payableLabel={payableLabel}
        provenance={provenance}
        note={note}
        variant={line}
        smallVariant={small}
      />
    </View>
  );
}

/** The same test as a boolean, for a send path: may this document state a price? */
MoneySummary.stands = (spec: Parameters<typeof resolveMoneySummary>[0] = {}) =>
  resolveMoneySummary(spec).payableStandsUp;
/** The resolved arithmetic, for a caller that needs the numbers as well as the rendering. */
MoneySummary.resolve = resolveMoneySummary;

const styles = StyleSheet.create({
  overline: { marginBottom: 6 },
});
