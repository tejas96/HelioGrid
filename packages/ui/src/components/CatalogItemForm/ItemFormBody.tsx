import { Banner } from '../Banner/Banner';
import { CATALOG_KIND_LEADING } from '../CatalogItems/CatalogItems.rows';
import { Badge } from '../Chip/Chip';
import { FactRow } from '../FactRow/FactRow';
import { FactRows } from '../FactRow/FactRows';
import { Input } from '../Input/Input';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { NumberField } from '../NumberField/NumberField';
import { Select } from '../Select/Select';
import {
  bodyHeadOf,
  fieldFocusOf,
  itemFieldsOf,
  priceFieldOf,
  SPEC_LOADING_BARS,
  schemeRowsOf,
} from './CatalogItemForm.logic';
import type { CatalogItemFormProps } from './CatalogItemForm.types';
import { ItemCard } from './ItemCard';
import { SchemeSwitchRow } from './SchemeSwitchRow';
import { SheetAccelerator } from './SheetAccelerator';
import { SpecFields } from './SpecFields';

interface BodyProps {
  props: CatalogItemFormProps;
  /** The 1536 panel, or the 375 sheet. */
  wide: boolean;
}

/**
 * The add sheet's body, top to bottom (`SCR-M01-16`): the pre-fill's banner or the spreadsheet
 * tile, *What this form needs* while nothing is typed, then the item, its specification, its
 * certification and — for a person who may write one — its price; at 1536 the last two side by side.
 */
export function ItemFormBody({ props, wide }: BodyProps) {
  const head = bodyHeadOf(props);
  const { words } = props;
  return (
    <div className="hg-item-form" data-wide={wide}>
      {head.banner === null ? null : (
        <Banner kind="review-needed" title={head.banner} density="functional" />
      )}
      {head.spreadsheet === null ? null : (
        <SheetAccelerator
          title={words.spreadsheet}
          sub={words.spreadsheetSub}
          disabled={props.saving}
          wide={wide}
          onPress={head.spreadsheet}
        />
      )}
      {head.needs ? <FormNeeds words={words} /> : null}
      <TheItemCard props={props} wide={wide} />
      <SpecificationCard props={props} wide={wide} />
      <CertificationAndPrice props={props} wide={wide} />
    </div>
  );
}

function FormNeeds({ words }: { words: CatalogItemFormProps['words'] }) {
  const { needs } = words;
  return (
    <FactRows label={needs.label} density="functional">
      <FactRow label={needs.needed} values={[...needs.neededValues]} />
      <FactRow label={needs.optional} values={[...needs.optionalValues]} />
    </FactRows>
  );
}

function TheItemCard({ props, wide }: BodyProps) {
  const leading = CATALOG_KIND_LEADING[props.draft.kind];
  const fields = itemFieldsOf(props);
  return (
    <ItemCard glyph={leading.glyph} iris={leading.iris} title={props.words.theItem} wide={wide}>
      {wide ? (
        <div className="hg-item-grid" data-columns={3}>
          <Select {...fields.kind} />
          <Input {...fields.brand} />
          <Input {...fields.model} />
        </div>
      ) : (
        <>
          <Select {...fields.kind} />
          <div className="hg-item-grid" data-columns={2}>
            <Input {...fields.brand} />
            <Input {...fields.model} />
          </div>
        </>
      )}
    </ItemCard>
  );
}

function SpecificationCard({ props, wide }: BodyProps) {
  const { words } = props;
  const loading = props.read.kind === 'loading';
  return (
    <ItemCard
      glyph="bolt"
      iris="blue"
      title={words.specification}
      wide={wide}
      trailing={
        loading ? null : (
          <Badge tone="neutral" density="functional">
            {words.yourOwn}
          </Badge>
        )
      }
    >
      {loading ? (
        <LoadingBars
          className="hg-item-spec-loading"
          label={words.loading}
          bars={SPEC_LOADING_BARS}
        />
      ) : (
        <SpecFields
          draft={props.draft}
          words={words}
          failures={props.failures}
          focus={fieldFocusOf(props)}
          disabled={props.saving}
          wide={wide}
          onChange={props.onChange}
        />
      )}
    </ItemCard>
  );
}

/** Certification and Price: side by side at 1536 when both are drawn, else each full width. */
function CertificationAndPrice({ props, wide }: BodyProps) {
  const certification =
    props.schemes.length === 0 ? null : <CertificationCard props={props} wide={wide} />;
  const price = props.priced ? <PriceCard props={props} wide={wide} /> : null;
  if (wide && certification !== null && price !== null) {
    return (
      <div className="hg-item-form-pair">
        {certification}
        {price}
      </div>
    );
  }
  return (
    <>
      {certification}
      {price}
    </>
  );
}

function CertificationCard({ props, wide }: BodyProps) {
  return (
    <ItemCard glyph="shield-check" iris="magenta" title={props.words.certification} wide={wide}>
      {schemeRowsOf(props).map((row) => (
        <SchemeSwitchRow key={row.scheme} {...row} onChange={props.onChange} />
      ))}
      <p className="hg-item-card-note">{props.words.schemeNote}</p>
    </ItemCard>
  );
}

function PriceCard({ props, wide }: BodyProps) {
  const { priceNote } = props.words;
  return (
    <ItemCard glyph="rupee" iris="violet" title={props.words.price} wide={wide}>
      <NumberField {...priceFieldOf(props)} />
      {priceNote === null ? null : <p className="hg-item-card-note">{priceNote}</p>}
    </ItemCard>
  );
}
