import { PRICE_BOOK_RATE_BASES } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import type { CatalogRateEditProps } from './CatalogRates.types';

/** The rate sheet's body: the rate's one name, how it is charged, and *Remove*. */
export function CatalogRateEdit(props: CatalogRateEditProps) {
  return (
    <div className="hg-cat-rate-edit">
      <Input
        label={props.nameLabel}
        value={props.name}
        onChange={props.onName}
        density="functional"
      />
      <Select
        {...props.select}
        label={props.basisLabel}
        value={props.basis}
        onChange={(value) => {
          const next = PRICE_BOOK_RATE_BASES.find((each) => each === value);
          if (next !== undefined) props.onBasis(next);
        }}
        options={PRICE_BOOK_RATE_BASES.map((basis) => ({
          value: basis,
          label: props.bases[basis],
        }))}
        density="functional"
      />
      {props.remove === null ? null : (
        <span className="hg-cat-rate-edit-remove">
          <Button
            variant="ghost"
            size="sm"
            tone="danger"
            icon={<ShellGlyph name="trash" size="sm" />}
            onClick={props.remove.onRemove}
          >
            {props.remove.label}
          </Button>
        </span>
      )}
    </div>
  );
}
