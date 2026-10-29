import { optionalFolded } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { Explainer } from '../Explainer/Explainer';
import { NumberField } from '../NumberField/NumberField';
import { RangeField } from '../RangeField/RangeField';
import { Select } from '../Select/Select';
import type { SpecCell } from './CatalogItemForm.layout';
import { SPEC_LAYOUT } from './CatalogItemForm.layout';
import {
  choiceFieldOf,
  figureFieldOf,
  type SpecCellFacts,
  windowFieldOf,
} from './CatalogItemForm.logic';
import './SpecFields.css';
import type { SpecFieldsProps, WideProps } from './CatalogItemForm.parts.types';

type CellProps = SpecCellFacts & { cell: SpecCell };

/**
 * The kind's typed specification (`SCR-M01-16`), its rows and columns as the board lays them out
 * (`SPEC_LAYOUT`), then its optional values — folded behind *Add optional values* while every one
 * is blank, under *Optional* once one holds a figure or the fold was opened.
 */
export function SpecFields(props: SpecFieldsProps & WideProps) {
  const layout = SPEC_LAYOUT[props.draft.kind];
  const rows = props.wide ? layout.wide : layout.narrow;
  return (
    <div className="hg-item-spec">
      {rows.map((row) => (
        <div
          key={row.cells.map((cell) => cell.path).join('|')}
          className="hg-item-grid"
          data-columns={row.columns}
        >
          {row.cells.map((cell) => (
            <SpecCellField key={cell.path} {...props} cell={cell} />
          ))}
        </div>
      ))}
      <OptionalValues {...props} />
    </div>
  );
}

function OptionalValues(props: SpecFieldsProps & WideProps) {
  const { words, draft, disabled, onChange } = props;
  const ask = words.optionalAsk;
  const explainer =
    ask === null ? null : (
      <Explainer
        label={ask.label}
        title={ask.title}
        pages={ask.body}
        density="functional"
        placement="bottom"
      />
    );
  if (optionalFolded(draft)) {
    return (
      <div className="hg-item-optional-head">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
          onClick={() => onChange({ type: 'unfold' })}
        >
          {words.addOptional}
        </Button>
        {explainer}
      </div>
    );
  }
  const { optional } = SPEC_LAYOUT[draft.kind];
  return (
    <>
      <div className="hg-item-optional-head">
        <span className="hg-item-optional-title">{words.optional}</span>
        {explainer}
      </div>
      <div className="hg-item-grid" data-columns={props.wide ? optional.wide : optional.narrow}>
        {optional.cells.map((cell) => (
          <SpecCellField key={cell.path} {...props} cell={cell} />
        ))}
      </div>
    </>
  );
}

/** One field of the block: a figure, one of the three lists, or the inverter's MPPT window. */
function SpecCellField({ cell, ...facts }: CellProps) {
  if (cell.as === 'window') return <RangeField {...windowFieldOf(facts, cell)} />;
  if (cell.as === 'number') return <NumberField {...figureFieldOf(facts, cell)} />;
  return <Select {...choiceFieldOf(facts, cell)} />;
}
