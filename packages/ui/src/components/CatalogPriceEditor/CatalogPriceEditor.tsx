import type { TranslatedText } from '@heliogrid/contracts';
import { useId } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Card } from '../Card';
import { Badge, Chip } from '../Chip';
import { Explainer } from '../Explainer';
import { NamedGap } from '../NamedGap';
import { NumberField } from '../NumberField';
import { Switch } from '../Switch';
import { ValueSource } from '../ValueSource';
import type {
  CatalogEditorSwitches,
  CatalogPriceEditorProps,
  CatalogPriceEditorWords,
} from './CatalogPriceEditor.types';
import './CatalogPriceEditor.css';

/** A typed decimal as the field's figure; `''` is unset, never `0`. */
const figureOf = (typed: string) => (typed === '' ? undefined : Number(typed));

/**
 * The price editor's body on the web: the item card with its ask, the price, a platform item's tax
 * and its two picker switches — each naming the tier it comes from. The sheet or side panel and
 * its *Cancel* / *Save* foot are the app's.
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
      <Card density="functional">
        <div className="hg-cat-editor-item">
          <div className="hg-cat-editor-item-words">
            <Text variant="overline" color="secondary">
              {item.overline}
            </Text>
            <Text as="h2" variant="body" bold>
              {item.name}
            </Text>
            <span className="hg-cat-editor-chips">
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
            </span>
          </div>
          <Explainer
            label={words.howItResolves}
            title={words.howItResolves}
            density="functional"
            pages={words.resolvesPages}
            nextLabel={words.explainer.nextLabel}
            backLabel={words.explainer.backLabel}
            positionLabel={words.explainer.positionLabel}
          />
        </div>
      </Card>

      <section className="hg-cat-editor-section">
        <Text variant="overline" color="secondary">
          {words.yourPrice}
        </Text>
        <NumberField
          label={words.price}
          words={words.numberField}
          value={figureOf(props.amount)}
          onCommit={(value) => props.onAmount(String(value))}
          commits="as-typed"
          onClear={() => props.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
          hint={words.priceHint}
          attribution={{ level: 'own', layerName: words.yourOverride }}
        />
        {props.taxPct === null ? null : <TaxField {...props} taxPct={props.taxPct} />}
      </section>

      {props.switches === null ? null : <PickerSwitches switches={props.switches} words={words} />}
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
      {props.packRateMissing ? (
        <Card density="functional">
          <span className="hg-cat-editor-note">
            <ShellGlyph name="lock" size="sm" />
            {words.taxStays === null ? (
              <NamedGap scale="field" gap={words.noMarketRate} />
            ) : (
              <Text as="span" variant="caption" color="secondary">
                {words.taxStays}
              </Text>
            )}
          </span>
        </Card>
      ) : null}
    </>
  );
}

/** The two picker switches, each with the tier its value comes from. */
function PickerSwitches({
  switches,
  words,
}: {
  switches: CatalogEditorSwitches;
  words: CatalogPriceEditorWords;
}) {
  const hideId = useId();
  const preferId = useId();
  const source = (fromOverride: boolean, fieldName: TranslatedText) => (
    <ValueSource
      level={fromOverride ? 'own' : 'inherited'}
      layerName={fromOverride ? words.yourOverride : words.defaultSource}
      fieldName={fieldName}
    />
  );
  return (
    <section className="hg-cat-editor-section">
      <Text variant="overline" color="secondary">
        {words.inPickers}
      </Text>
      <div className="hg-cat-editor-switches">
        <div className="hg-cat-editor-switch">
          <span className="hg-cat-editor-switch-words">
            <label htmlFor={hideId} className="hg-cat-editor-switch-label">
              {words.hideFromPickers}
            </label>
            {source(switches.hiddenFromOverride, words.hideFromPickers)}
          </span>
          <Switch
            id={hideId}
            checked={switches.hidden}
            onChange={switches.onHidden}
            ariaLabel={words.hideFromPickers}
          />
        </div>
        <div className="hg-cat-editor-switch">
          <span className="hg-cat-editor-switch-words">
            <label htmlFor={preferId} className="hg-cat-editor-switch-label">
              {words.preferredInPickers}
            </label>
            {source(switches.preferredFromOverride, words.preferredInPickers)}
          </span>
          <Switch
            id={preferId}
            checked={switches.preferred}
            onChange={switches.onPreferred}
            ariaLabel={words.preferredInPickers}
          />
        </div>
      </div>
    </section>
  );
}
