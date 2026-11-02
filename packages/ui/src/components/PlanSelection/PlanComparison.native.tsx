import type { Tier } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { CompareGrid } from '../CompareGrid/CompareGrid.native';
import { FilterChips } from '../FilterBar/FilterChips.native';
import { ListRow } from '../ListRow/ListRow.native';
import { COMPARE_COLUMNS } from './PlanSelection.measures';
import type { PlanCompareView, PlanSelectionProps, PlanSet } from './PlanSelection.types';

/**
 * The comparison on the phone (decision 4): a `Compare all plans` row opens it in place — my plan
 * against ONE other, chosen by a chip strip, then the set by a second — never a four-plan matrix.
 */
export function PlanComparison({ view, words, compareOpen, acts }: PlanSelectionProps) {
  const compare = view.compare;
  if (compare === null) return null;
  const setOf = (value: string): PlanSet | undefined =>
    compare.sets.find((choice) => choice.value === value)?.value;
  return (
    <View style={styles.region}>
      <ListRow
        density="expressive"
        style={styles.rest}
        title={words.compareAll}
        subtitle={compare.line}
        trailing={
          <ShellGlyph name={compareOpen ? 'caret-up' : 'caret-down'} size="md" tone="secondary" />
        }
        onClick={acts.onCompare}
      />
      {compareOpen ? (
        <View style={styles.region}>
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
          <View style={styles.chips}>
            <Text variant="body-sm" color="secondary" style={styles.chipsLabel}>
              {words.show}
            </Text>
            <FilterChips
              label={words.show}
              value={compare.set}
              onChange={(value) => {
                const set = setOf(value);
                if (set !== undefined) acts.onSet(set);
              }}
              options={compare.sets.map((choice) => ({ value: choice.value, label: choice.label }))}
            />
          </View>
          <CompareGrid
            caption={compare.pairCaption}
            density="functional"
            columnWidth={COMPARE_COLUMNS.pair.column}
            labelWidth={COMPARE_COLUMNS.pair.label}
            attributes={compare.attributes}
            options={compare.pair}
            {...(compare.source === null ? {} : { provenance: { source: compare.source } })}
            read={{ kind: 'ready' }}
            words={words.compareGrid}
            selectLabel={words.compareSelect}
            selectedLabel={words.compareSelected}
            currentLabel={words.compareCurrent}
            emptyTitle={words.compareEmpty}
            errorTitle={words.compareError}
            unavailableTitle={words.compareUnavailable}
          />
        </View>
      ) : null}
    </View>
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
    <View style={styles.chips}>
      <Text variant="body-sm" color="secondary" style={styles.chipsLabel}>
        {label}
      </Text>
      <FilterChips
        label={label}
        value={value}
        onChange={(next) => {
          const tier = choices.find((choice) => choice.value === next)?.value;
          if (tier !== undefined) onChoose(tier);
        }}
        options={choices.map((choice) => ({ value: choice.value, label: choice.label }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  region: { gap: theme.spacing['sp-4'] },
  rest: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
  chips: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  chipsLabel: { fontWeight: '500' },
});
