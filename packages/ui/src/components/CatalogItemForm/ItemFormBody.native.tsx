import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Banner } from '../Banner/Banner.native';
import { CATALOG_KIND_LEADING } from '../CatalogItems/CatalogItems.rows';
import { Badge } from '../Chip/Chip.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Select } from '../Select/Select.native';
import {
  bodyHeadOf,
  fieldFocusOf,
  itemFieldsOf,
  priceFieldOf,
  SPEC_LOADING_BARS,
  schemeRowsOf,
} from './CatalogItemForm.logic';
import type { CatalogItemFormProps } from './CatalogItemForm.types';
import { ItemCard, ItemCardNote } from './ItemCard.native';
import { SchemeSwitchRow } from './SchemeSwitchRow.native';
import { SheetAccelerator } from './SheetAccelerator.native';
import { SpecFields } from './SpecFields.native';

interface BodyProps {
  props: CatalogItemFormProps;
}

/**
 * The add sheet's body (`SCR-M01-16`, the 375 frames), top to bottom: the pre-fill's banner or the
 * spreadsheet tile, *What this form needs* while nothing is typed, then the item, its
 * specification, its certification and — for a person who may write one — its price.
 */
export function ItemFormBody({ props }: BodyProps) {
  const head = bodyHeadOf(props);
  const { words } = props;
  return (
    <View style={styles.body}>
      {head.banner === null ? null : (
        <Banner kind="review-needed" title={head.banner} density="functional" />
      )}
      {head.spreadsheet === null ? null : (
        <SheetAccelerator
          title={words.spreadsheet}
          sub={words.spreadsheetSub}
          onPress={head.spreadsheet}
        />
      )}
      {head.needs ? (
        <FactRows label={words.needs.label} density="functional">
          <FactRow label={words.needs.needed} values={[...words.needs.neededValues]} />
          <FactRow label={words.needs.optional} values={[...words.needs.optionalValues]} />
        </FactRows>
      ) : null}
      <TheItemCard props={props} />
      <SpecificationCard props={props} />
      {props.schemes.length === 0 ? null : <CertificationCard props={props} />}
      {props.priced ? <PriceCard props={props} /> : null}
    </View>
  );
}

function TheItemCard({ props }: BodyProps) {
  const leading = CATALOG_KIND_LEADING[props.draft.kind];
  const fields = itemFieldsOf(props);
  return (
    <ItemCard glyph={leading.glyph} iris={leading.iris} title={props.words.theItem}>
      <Select {...fields.kind} />
      <View style={styles.pair}>
        <View style={styles.half}>
          <Input {...fields.brand} />
        </View>
        <View style={styles.half}>
          <Input {...fields.model} />
        </View>
      </View>
    </ItemCard>
  );
}

function SpecificationCard({ props }: BodyProps) {
  const { words } = props;
  const loading = props.read.kind === 'loading';
  return (
    <ItemCard
      glyph="bolt"
      iris="blue"
      title={words.specification}
      trailing={
        loading ? null : (
          <Badge tone="neutral" density="functional">
            {words.yourOwn}
          </Badge>
        )
      }
    >
      {loading ? (
        <SpecLoading label={words.loading} />
      ) : (
        <SpecFields
          draft={props.draft}
          words={words}
          failures={props.failures}
          focus={fieldFocusOf(props)}
          onChange={props.onChange}
        />
      )}
    </ItemCard>
  );
}

/**
 * The pre-fill's wait on the spec grid: its bars two to a row, the last across both. The region
 * is named once, here, and holds no control; each pair of bars sits inside it, hidden.
 */
function SpecLoading({ label }: { label: string }) {
  const pairs: (typeof SPEC_LOADING_BARS)[] = [];
  for (let at = 0; at < SPEC_LOADING_BARS.length; at += 2) {
    pairs.push(SPEC_LOADING_BARS.slice(at, at + 2));
  }
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      style={styles.loading}
    >
      {pairs.map((pair, row) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the rows of a wait are alike and never reorder
        <View key={row} style={styles.pair}>
          {pair.map((size, column) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the bars of a row are alike and never reorder
            <View key={column} style={styles.half}>
              <LoadingBars inBusyRegion bars={[size]} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function CertificationCard({ props }: BodyProps) {
  return (
    <ItemCard glyph="shield-check" iris="magenta" title={props.words.certification}>
      {schemeRowsOf(props).map((row) => (
        <SchemeSwitchRow key={row.scheme} {...row} onChange={props.onChange} />
      ))}
      <ItemCardNote>{props.words.schemeNote}</ItemCardNote>
    </ItemCard>
  );
}

function PriceCard({ props }: BodyProps) {
  const { priceNote } = props.words;
  return (
    <ItemCard glyph="rupee" iris="violet" title={props.words.price}>
      <NumberField {...priceFieldOf(props)} />
      {priceNote === null ? null : <ItemCardNote>{priceNote}</ItemCardNote>}
    </ItemCard>
  );
}

/* The board's 375 body: 16 between its parts; a pair of fields 12 apart, each half the row. */
const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  half: { flex: 1, minWidth: 0 },
  loading: { gap: theme.spacing['sp-4'] },
});
