import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import type { LeadSectionsProps } from './LeadSections.types';

type LeadSitePanelProps = Pick<LeadSectionsProps, 'siteAddress' | 'visit' | 'words'>;

/**
 * The Site section (`M02-46`): the address the customer confirmed at booking, or its named gap
 * until a visit is booked; with a visit, when and who, its no-show reschedule (`M02-48`) and the
 * confirmation to copy (`M02-47`).
 */
export function LeadSitePanel({ siteAddress, visit, words }: LeadSitePanelProps) {
  return (
    <View style={styles.site}>
      <View style={styles.head}>
        <Text variant="overline" color="secondary" style={styles.title}>
          {words.site}
        </Text>
        {siteAddress === null ? null : <StatusMark tone="success" label={words.confirmed} />}
      </View>
      {siteAddress === null ? (
        <NamedGap gap={words.siteGap} />
      ) : (
        <Text variant="body">{siteAddress}</Text>
      )}
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
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
