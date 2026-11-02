import type { Tier } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell';
import { Block } from '../Block';
import { CompareGrid, type CompareOption } from '../CompareGrid';
import { FilterChips } from '../FilterBar';
import { ListRow } from '../ListRow';
import { COMPARE_COLUMNS } from './PlanSelection.measures';
import type { PlanCompareView, PlanSelectionProps, PlanSet } from './PlanSelection.types';

/**
 * The comparison, ONE region (decision 4): at 375 a `Compare all plans` row opens it in place —
 * my plan against ONE other, then the set; at 1536 it is present, all four plans as columns.
 */
export function PlanComparison({ view, words, layout, compareOpen, acts }: PlanSelectionProps) {
  const compare = view.compare;
  if (compare === null) return null;
  if (layout === 'columns') {
    return (
      <Block title={words.compareAll} density="functional" flat>
        <div className="hg-plans-region" data-gap="4">
          <SetChips compare={compare} words={words} onSet={acts.onSet} />
          <Grid
            compare={compare}
            words={words}
            options={compare.all}
            caption={compare.allCaption}
            wide
          />
        </div>
      </Block>
    );
  }
  return (
    <div className="hg-plans-region" data-gap="4">
      <ListRow
        className="hg-plans-rest"
        density="expressive"
        title={words.compareAll}
        subtitle={compare.line}
        trailing={<ShellGlyph name={compareOpen ? 'caret-up' : 'caret-down'} tone="secondary" />}
        onClick={acts.onCompare}
      />
      {compareOpen ? (
        <>
          {compare.planValue === null ? null : (
            <TierChips
              label={words.comparePlanLabel}
              value={compare.planValue}
              choices={compare.plans}
              onChoose={acts.onComparePlan}
            />
          )}
          {compare.againstValue === null ? null : (
            <TierChips
              label={compare.planValue === null ? words.compareWith : words.compareAgainstLabel}
              value={compare.againstValue}
              choices={compare.against}
              onChoose={acts.onAgainst}
            />
          )}
          <SetChips compare={compare} words={words} onSet={acts.onSet} />
          <Grid
            compare={compare}
            words={words}
            options={compare.pair}
            caption={compare.pairCaption}
            wide={false}
          />
        </>
      ) : null}
    </div>
  );
}

/** One plan chosen from a chip strip, its name above it (decision 3). */
function TierChips({
  label,
  value,
  choices,
  onChoose,
}: {
  label: PlanCompareView['pairCaption'];
  value: Tier;
  choices: PlanCompareView['against'];
  onChoose: (tier: Tier) => void;
}) {
  return (
    <div className="hg-plans-chips">
      <span className="hg-plans-chips-label">{label}</span>
      <FilterChips
        label={label}
        value={value}
        onChange={(next) => {
          const tier = choices.find((choice) => choice.value === next)?.value;
          if (tier !== undefined) onChoose(tier);
        }}
        options={choices.map((choice) => ({ value: choice.value, label: choice.label }))}
      />
    </div>
  );
}

function SetChips({
  compare,
  words,
  onSet,
}: {
  compare: PlanCompareView;
  words: PlanSelectionProps['words'];
  onSet: (set: PlanSet) => void;
}) {
  return (
    <div className="hg-plans-chips">
      <span className="hg-plans-chips-label">{words.show}</span>
      <FilterChips
        label={words.show}
        value={compare.set}
        onChange={(value) => {
          const set = compare.sets.find((choice) => choice.value === value)?.value;
          if (set !== undefined) onSet(set);
        }}
        options={compare.sets.map((choice) => ({ value: choice.value, label: choice.label }))}
      />
    </div>
  );
}

function Grid({
  compare,
  words,
  options,
  caption,
  wide,
}: {
  compare: PlanCompareView;
  words: PlanSelectionProps['words'];
  options: CompareOption[];
  caption: PlanCompareView['pairCaption'];
  wide: boolean;
}) {
  const measures = wide ? COMPARE_COLUMNS.all : COMPARE_COLUMNS.pair;
  return (
    <CompareGrid
      caption={caption}
      density="functional"
      columnWidth={measures.column}
      labelWidth={measures.label}
      attributes={compare.attributes}
      options={options}
      provenance={compare.source === null ? undefined : { source: compare.source }}
      read={{ kind: 'ready' }}
      words={words.compareGrid}
      selectLabel={words.compareSelect}
      selectedLabel={words.compareSelected}
      currentLabel={words.compareCurrent}
      emptyTitle={words.compareEmpty}
      errorTitle={words.compareError}
      unavailableTitle={words.compareUnavailable}
    />
  );
}
