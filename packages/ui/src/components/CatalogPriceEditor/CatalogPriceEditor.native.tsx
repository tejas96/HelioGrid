import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Badge } from '../Chip/Chip.native';
import { Explainer } from '../Explainer/Explainer.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { NumberField } from '../NumberField/NumberField.native';
import { CatalogEditedHead } from './CatalogEditedHead.native';
import { CatalogPickerActs } from './CatalogPickerActs.native';
import type { CatalogPriceEditorProps } from './CatalogPriceEditor.types';

/** A decimal string as the field's figure; `''` is no figure. */
const figureOf = (typed: string): number | undefined => (typed === '' ? undefined : Number(typed));

/**
 * The price editor's body on the phone (direction A): the item — its tile, name, marks and spec
 * grid — then its price, a platform item's tax and its two picker toggles. The app's sheet holds
 * it and draws the foot.
 */
export function CatalogPriceEditor(props: CatalogPriceEditorProps) {
  const { words, item, amount, switches } = props;
  return (
    <View style={styles.body}>
      {/* First, where it is seen: the sheet's foot covers the body's end. */}
      {props.problem === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {props.problem}
        </Text>
      )}
      <CatalogEditedHead
        item={item}
        ask={
          <Explainer
            label={words.howItResolves}
            title={words.howItResolves}
            density="functional"
            placement="bottom"
            inset
            pages={words.resolvesPages}
            nextLabel={words.explainer.nextLabel}
            backLabel={words.explainer.backLabel}
            positionLabel={words.explainer.positionLabel}
          />
        }
      />

      <View style={styles.section}>
        {/* One label for the one field that matters (direction A): *Your price*. */}
        <NumberField
          label={words.yourPrice}
          words={words.numberField}
          value={figureOf(amount)}
          onCommit={(value) => props.onAmount(String(value))}
          commits="as-typed"
          onClear={() => props.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
          hint={amount === '' ? words.priceNeeded : words.priceHint}
        />
        {props.taxPct === null ? null : <TaxField props={props} taxPct={props.taxPct} />}
      </View>

      <CatalogPickerActs words={words} switches={switches} own={props.ownActs ?? null} />
    </View>
  );
}

/** The tax rate: *Edited* when it is the tenant's, the pack's gap and the lock note when unauthored. */
function TaxField({ props, taxPct }: { props: CatalogPriceEditorProps; taxPct: string }) {
  const { words } = props;
  return (
    <View style={styles.tax}>
      <NumberField
        label={words.taxRate}
        words={words.numberField}
        value={figureOf(taxPct)}
        onCommit={(value) => props.onTaxPct(String(value))}
        commits="as-typed"
        onClear={() => props.onTaxPct('')}
        unit="%"
        step={0.5}
        min={0}
        density="functional"
        override={
          props.taxOverridden ? (
            <Badge tone="info" density="functional">
              {words.edited}
            </Badge>
          ) : undefined
        }
      />
      {props.packRateMissing && taxPct === '' ? (
        <NamedGap scale="field" gap={words.noMarketRate} />
      ) : null}
      {props.packRateMissing && words.taxStays !== null ? (
        <View style={styles.lockNote}>
          <ShellGlyph name="lock" size="sm" tone="secondary" />
          <Text variant="caption" color="secondary" style={styles.lockWords}>
            {words.taxStays}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-6'] },
  section: { gap: theme.spacing['sp-3'] },
  tax: { gap: theme.spacing['sp-2'] },
  /* A quiet line under the field, as the web's: a boxed note read as a second form. */
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  lockWords: { flex: 1, minWidth: 0 },
});
