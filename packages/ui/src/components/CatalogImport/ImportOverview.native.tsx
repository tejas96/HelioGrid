import type { CatalogImportWire } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { SearchField } from '../SearchField/SearchField.native';
import { ShareFilter } from '../ShareFilter/ShareFilter.native';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf, overviewOf } from './CatalogImport.steps';
import { raisedCard } from './CatalogImport.surfaces.native';
import type { CatalogImportProps } from './CatalogImport.types';

interface ImportOverviewProps
  extends Pick<CatalogImportProps, 'words' | 'scope' | 'onScope' | 'query' | 'onQuery'> {
  job: CatalogImportWire;
  phase: 'preview' | 'report';
  formats: ImportFormats;
}

/**
 * The overview card that opens steps 3 and 4: the row count and what is ready (or, in the report,
 * when it was imported and what was written), three rings that filter onto each part, and the
 * search over the lists.
 */
export function ImportOverview(props: ImportOverviewProps) {
  const { job, phase, words } = props;
  const overview = overviewOf(job, phase, words);
  const stamp = phase === 'report' ? fileOf(job, words, props.formats, null).stamp : null;
  return (
    <View style={styles.card}>
      {stamp === null ? (
        <View style={styles.top}>
          <Text variant="body-sm" bold style={styles.heading}>
            {overview.heading}
          </Text>
          <View style={styles.ready}>
            <Text variant="caption" color="secondary" align="end">
              {overview.short}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.report}>
          <View style={styles.stamped}>
            <Text variant="body-sm" bold style={styles.heading}>
              {overview.heading}
            </Text>
            <Text variant="caption" color="secondary">
              {stamp}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            {overview.short}
          </Text>
        </View>
      )}
      <ShareFilter
        layout="rings"
        label={overview.label}
        items={overview.filters}
        pressed={props.scope}
        onPress={props.onScope}
      />
      <View style={styles.find}>
        <ImportFind words={words} query={props.query} onQuery={props.onQuery} />
      </View>
    </View>
  );
}

/** *Find in this list*: a search over every list on screen, cleared by its own control. */
export function ImportFind({
  words,
  query,
  onQuery,
}: Pick<CatalogImportProps, 'words' | 'query' | 'onQuery'>) {
  return (
    <SearchField
      placeholder={words.find}
      ariaLabel={words.find}
      value={query}
      onChange={onQuery}
      onClear={query === '' ? undefined : () => onQuery('')}
      density="functional"
    />
  );
}

/* The board's 375 overview: radius 22 at 14 by 12, 6 between its rows; the ready line takes at
   most 60% beside the count; the report's two lines sit 2 apart, 4 in from the card's edge. */
const styles = StyleSheet.create({
  card: {
    ...raisedCard,
    borderRadius: theme.radius['r-tile'],
    paddingVertical: 14,
    paddingHorizontal: theme.spacing['sp-3'],
    gap: 6,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minWidth: 0 },
  heading: { flex: 1 },
  ready: { maxWidth: '60%', minWidth: 0 },
  report: { gap: theme.spacing['sp-0-5'], paddingHorizontal: theme.spacing['sp-1'] },
  stamped: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: theme.spacing['sp-3'],
    minWidth: 0,
  },
  find: { paddingTop: 6 },
});
