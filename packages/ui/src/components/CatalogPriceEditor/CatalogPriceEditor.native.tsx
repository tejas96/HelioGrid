import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Badge, Chip } from '../Chip/Chip.native';
import { Explainer } from '../Explainer/Explainer.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Switch } from '../Switch/Switch.native';
import { ValueSource } from '../ValueSource/ValueSource.native';
import type { ValueSourceSpec } from '../ValueSource/ValueSource.types';
import type { CatalogPriceEditorProps, CatalogPriceEditorWords } from './CatalogPriceEditor.types';

/** A decimal string as the field's figure; `''` is no figure. */
const figureOf = (typed: string): number | undefined => (typed === '' ? undefined : Number(typed));

/**
 * The price editor's body on the phone: the item, its price, a platform item's tax and its two
 * picker switches, each naming the tier it comes from. The app's sheet holds it and draws the foot.
 */
export function CatalogPriceEditor(props: CatalogPriceEditorProps) {
  const { words, item, amount, switches } = props;
  /* An own SKU's price is its own; a platform item's is the tenant's override. */
  const priceSource: ValueSourceSpec | undefined =
    amount === ''
      ? undefined
      : {
          level: 'own',
          layerName: switches === null ? item.overline : words.yourOverride,
          fieldName: words.price,
        };
  return (
    <View style={styles.body}>
      {/* First, where it is seen: the sheet's foot covers the body's end. */}
      {props.problem === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {props.problem}
        </Text>
      )}
      <View style={[tileSurface, styles.item]}>
        <GroundProvider ground="tile">
          <View style={styles.itemWords}>
            <Text variant="overline" color="secondary">
              {item.overline}
            </Text>
            <Text variant="body" bold>
              {item.name}
            </Text>
            <View style={styles.chips}>
              {item.chips.map((chip) => (
                <Chip key={chip} density="functional">
                  {chip}
                </Chip>
              ))}
              {item.held.map((scheme) => (
                <Badge key={scheme} tone="success" density="functional">
                  {scheme}
                </Badge>
              ))}
            </View>
          </View>
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
        </GroundProvider>
      </View>

      <View style={styles.section}>
        <Text variant="overline" color="secondary">
          {words.yourPrice}
        </Text>
        <NumberField
          label={words.price}
          words={words.numberField}
          value={figureOf(amount)}
          onCommit={(value) => props.onAmount(String(value))}
          commits="as-typed"
          onClear={() => props.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
          hint={words.priceHint}
          {...(priceSource === undefined ? {} : { attribution: priceSource })}
        />
        {props.taxPct === null ? null : <TaxField props={props} taxPct={props.taxPct} />}
      </View>

      {switches === null ? null : (
        <View style={styles.switchSection}>
          <Text variant="overline" color="secondary">
            {words.inPickers}
          </Text>
          <View style={styles.switchCard}>
            <SwitchRow
              label={words.hideFromPickers}
              checked={switches.hidden}
              onChange={switches.onHidden}
              fromOverride={switches.hiddenFromOverride}
              words={words}
            />
            <View style={styles.hairline} />
            <SwitchRow
              label={words.preferredInPickers}
              checked={switches.preferred}
              onChange={switches.onPreferred}
              fromOverride={switches.preferredFromOverride}
              words={words}
            />
          </View>
        </View>
      )}
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

/** One picker switch: its words and the tier that set it, the switch at the right. */
function SwitchRow({
  label,
  checked,
  onChange,
  fromOverride,
  words,
}: {
  label: TranslatedText;
  checked: boolean;
  onChange: (checked: boolean) => void;
  fromOverride: boolean;
  words: CatalogPriceEditorWords;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchWords}>
        <Text variant="body-sm" bold>
          {label}
        </Text>
        <ValueSource
          level={fromOverride ? 'own' : 'inherited'}
          layerName={fromOverride ? words.yourOverride : words.defaultSource}
          fieldName={label}
        />
      </View>
      <Switch checked={checked} onChange={onChange} ariaLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
  itemWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-1'],
  },
  section: { gap: theme.spacing['sp-3'] },
  tax: { gap: theme.spacing['sp-2'] },
  lockNote: {
    ...tileSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout['tile-gap'],
    paddingVertical: theme.layout['tile-gap'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-sm'],
  },
  lockWords: { flex: 1, minWidth: 0 },
  switchSection: { gap: theme.spacing['sp-2'] },
  /* The board's card on the sheet: the sheet's own ground inside a soft line, not a tile. */
  switchCard: {
    borderWidth: 1,
    borderColor: theme.colors['line-soft'],
    borderRadius: theme.radius['r-md'],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
  },
  switchWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  hairline: { height: 1, marginHorizontal: 14, backgroundColor: theme.colors['line-soft'] },
});
