import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { StatusMark } from '../StatusMark/StatusMark.native';
import type { LeadSectionsProps } from './LeadSections.types';

type LeadSitePanelProps = Pick<LeadSectionsProps, 'site' | 'visit' | 'words'>;

/**
 * The Site section (`M02-46`): the address — confirmed once a visit is booked — and the supply the
 * proposal typed, or its named gap while nothing is known; with a visit, when and who, its no-show
 * reschedule (`M02-48`) and the confirmation to copy (`M02-47`).
 */
export function LeadSitePanel({ site, visit, words }: LeadSitePanelProps) {
  return (
    <View style={styles.site}>
      <View style={styles.head}>
        <Text variant="overline" color="secondary" style={styles.title}>
          {words.site}
        </Text>
        {site.confirmed ? <StatusMark tone="success" label={words.confirmed} /> : null}
      </View>
      {site.address === null && site.facts.length === 0 ? <NamedGap gap={words.siteGap} /> : null}
      {site.address === null ? null : <Text variant="body">{site.address}</Text>}
      {site.facts.map((fact) => (
        <View key={fact.key} style={styles.fact}>
          <Text variant="body-sm" color="secondary">
            {fact.label}
          </Text>
          <Text variant="body-sm">{fact.value}</Text>
        </View>
      ))}
      {visit === null ? null : (
        <View style={styles.visit}>
          <Text variant="body-sm" color="secondary">
            {visit.line}
          </Text>
          <View style={styles.acts}>
            <Button variant="secondary" size="sm" onClick={visit.onConfirmation}>
              {words.confirmation}
            </Button>
            <Button variant="ghost" size="sm" onClick={visit.onReschedule}>
              {words.reschedule}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  site: { gap: theme.spacing['sp-2'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  title: { flex: 1 },
  visit: { gap: theme.spacing['sp-2'] },
  fact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: theme.spacing['sp-3'],
  },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
