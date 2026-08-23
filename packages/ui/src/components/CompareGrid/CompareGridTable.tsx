import { renderProvenance } from '../Provenance';
import { bestPerAttribute } from './CompareGrid.logic';
import type { CompareGridProps, CompareOption, CompareProvenanceSpec } from './CompareGrid.types';
import { CompareOptionHead } from './CompareOptionHead';
import { CompareValueCell } from './CompareValueCell';

/**
 * **The row's tier, under its label.** A `provenance` prop is a SPEC, not a node — `Provenance`
 * owns the tier's word, its mark and the standing that outranks it — so it goes through
 * `renderProvenance`, and the slot disappears when the spec would render nothing.
 */
function AttributeProvenance({ spec }: { spec: CompareProvenanceSpec }) {
  const node = renderProvenance(spec, { size: 12 });
  if (node === null) return null;
  return <span className="hg-compare-provenance">{node}</span>;
}

type TableProps<Opt extends CompareOption> = Required<
  Pick<
    CompareGridProps<Opt>,
    'attributes' | 'options' | 'selectLabel' | 'selectedLabel' | 'currentLabel'
  >
> &
  Pick<CompareGridProps<Opt>, 'selectedKey' | 'onSelect'> & { captionId?: string };

/**
 * One table, not N cards. **Alignment is structural** — a row *is* a row, so payback cannot drift
 * between variants however long a name is, and `th scope="row"` / `th scope="col"` mean a screen
 * reader announces "Payback · Variant B · 5.8 years" for any cell.
 *
 * This file owns only that structure: the heading of each column, the words inside each cell and
 * the choice at the foot are components of their own.
 */
export function CompareGridTable<Opt extends CompareOption>({
  attributes,
  options,
  selectedKey,
  onSelect,
  selectLabel,
  selectedLabel,
  currentLabel,
  captionId,
}: TableProps<Opt>) {
  const best = bestPerAttribute(attributes, options);
  const isSelected = (option: Opt) => selectedKey !== undefined && option.key === selectedKey;

  return (
    <table className="hg-compare-table" aria-labelledby={captionId}>
      <thead>
        <tr>
          <th scope="col" className="hg-compare-pin hg-compare-pin--head">
            <span className="hg-compare-sr">Attribute</span>
          </th>
          {options.map((option) => (
            <CompareOptionHead
              key={option.key}
              option={option}
              selected={isSelected(option)}
              selectedLabel={selectedLabel}
              currentLabel={currentLabel}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {attributes.map((attribute, index) => (
          <tr key={attribute.key} data-zebra={index % 2 === 1 ? 'true' : undefined}>
            {/* THE FIXED THING. Pinned at the left edge, so the reader holds "payback" still and
                slides the variants past it. */}
            <th scope="row" className="hg-compare-pin">
              <span className="hg-compare-label">{attribute.label}</span>
              {attribute.unit === undefined ? null : (
                <span className="hg-compare-unit">{attribute.unit}</span>
              )}
              <AttributeProvenance spec={attribute.provenance} />
            </th>
            {options.map((option) => (
              <CompareValueCell
                key={option.key}
                attribute={attribute}
                option={option}
                selected={isSelected(option)}
                best={best[attribute.key] === option.key}
              />
            ))}
          </tr>
        ))}
      </tbody>
      {onSelect === undefined ? null : (
        <tfoot>
          <tr>
            <th scope="row" className="hg-compare-pin hg-compare-pin--foot">
              <span className="hg-compare-sr">Choose an option</span>
            </th>
            {options.map((option) => (
              <td
                key={option.key}
                className="hg-compare-cell hg-compare-cell--choose"
                data-selected={isSelected(option) ? 'true' : undefined}
              >
                <button
                  type="button"
                  className="hg-compare-choose"
                  aria-pressed={isSelected(option)}
                  data-selected={isSelected(option) ? 'true' : undefined}
                  onClick={() => onSelect(option.key)}
                >
                  {isSelected(option) ? selectedLabel : selectLabel}
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
