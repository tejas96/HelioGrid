import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Badge } from '../Chip';
import { Explainer } from '../Explainer';
import { NamedGap } from '../NamedGap';
import { NumberField } from '../NumberField';
import { CatalogEditedHead } from './CatalogEditedHead';
import { CatalogPickerActs } from './CatalogPickerActs';
import type { CatalogPriceEditorProps } from './CatalogPriceEditor.types';
import './CatalogPriceEditor.css';

/** A typed decimal as the field's figure; `''` is unset, never `0`. */
const figureOf = (typed: string) => (typed === '' ? undefined : Number(typed));

/**
 * The price editor's body on the web (direction A): the item — its tile, name, marks and spec grid —
 * then the price as the one field that matters, a platform item's tax, and its two picker toggles.
 * The sheet or side panel and its *Save* foot are the app's.
 */
export function CatalogPriceEditor(props: CatalogPriceEditorProps) {
  const { words, item } = props;
  return (
    <div className="hg-cat-editor">
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
            pages={words.resolvesPages}
            nextLabel={words.explainer.nextLabel}
            backLabel={words.explainer.backLabel}
            positionLabel={words.explainer.positionLabel}
          />
        }
      />

      <section className="hg-cat-editor-section hg-cat-editor-price">
        {/* One label for the one field that matters (direction A): *Your price*. */}
        <NumberField
          label={words.yourPrice}
          words={words.numberField}
          value={figureOf(props.amount)}
          onCommit={(value) => props.onAmount(String(value))}
          commits="as-typed"
          onClear={() => props.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
          hint={props.amount === '' ? words.priceNeeded : words.priceHint}
        />
        {props.taxPct === null ? null : <TaxField {...props} taxPct={props.taxPct} />}
      </section>

      <CatalogPickerActs words={words} switches={props.switches} own={props.ownActs ?? null} />
    </div>
  );
}

/** A platform item's tax: the tenant's own when edited; while the pack has none, the gap is named. */
function TaxField(props: CatalogPriceEditorProps & { taxPct: string }) {
  const { words } = props;
  return (
    <>
      <NumberField
        label={words.taxRate}
        words={words.numberField}
        value={figureOf(props.taxPct)}
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
      {/* A quiet line under the field, as the phone draws it — a boxed card made a note look like
          a second form. */}
      {props.packRateMissing ? (
        <span className="hg-cat-editor-note">
          <ShellGlyph name="lock" size="sm" tone="secondary" />
          {words.taxStays === null ? (
            <NamedGap scale="field" gap={words.noMarketRate} />
          ) : (
            <Text as="span" variant="caption" color="secondary">
              {words.taxStays}
            </Text>
          )}
        </span>
      ) : null}
    </>
  );
}
