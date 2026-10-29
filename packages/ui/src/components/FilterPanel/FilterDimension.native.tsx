import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import { Accordion } from '../Accordion/Accordion.native';
import { FilterDimensionControl } from './FilterDimensionControl.native';
import { dimensionSummary, foldSummary } from './FilterPanel.logic';
import type { FilterDimensionBlockProps, FilterSectionProps } from './FilterPanel.types';

/**
 * ONE LABELLED DIMENSION: its name with what is on at its right, the control its kind maps to
 * (`FilterDimensionControl`) and the hint no control of its own already carries.
 */
export function FilterDimensionBlock({ dim, value, onChange, words }: FilterDimensionBlockProps) {
  const summary = dimensionSummary(dim, value[dim.key], words);
  return (
    <View style={styles.dimension}>
      <View style={styles.head}>
        <Text variant="overline" color="tertiary">
          {dim.label}
        </Text>
        {summary === null ? null : (
          <Text variant="caption" color="secondary" style={styles.summary}>
            {summary}
          </Text>
        )}
      </View>
      <FilterDimensionControl dim={dim} value={value[dim.key]} onChange={onChange} words={words} />
      {dim.kind !== 'range' && dim.hint ? (
        <Text variant="caption" color="tertiary">
          {dim.hint}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * ONE SECTION: a dimension, then each fold whose value is chosen as one `Accordion` line — the
 * dimensions that belong to that value, folded until opened.
 */
export function FilterSection({ dim, folds, value, onChange, words }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <FilterDimensionBlock dim={dim} value={value} onChange={onChange} words={words} />
      {folds.length === 0 ? null : (
        <Accordion
          density="functional"
          multiple
          items={folds.map((fold) => ({
            key: fold.key,
            title: fold.title,
            meta: foldSummary(fold, value, words),
            content: (
              <View style={styles.fold}>
                {fold.dimensions.map((d) => (
                  <FilterDimensionBlock
                    key={d.key}
                    dim={d}
                    value={value}
                    onChange={onChange}
                    words={words}
                  />
                ))}
              </View>
            ),
          }))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'column', gap: theme.spacing['sp-3'], minWidth: 0 },
  /* The 10dp gap has no step on the 4dp scale — it is the DS's own filter-body rhythm. */
  dimension: { flexDirection: 'column', gap: 10, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  summary: { flexShrink: 1, textAlign: 'right' },
  fold: { flexDirection: 'column', gap: theme.spacing['sp-5'] },
});
