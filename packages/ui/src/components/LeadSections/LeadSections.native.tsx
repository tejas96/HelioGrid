import type { TranslatedText } from '@heliogrid/contracts';
import { LEAD_DETAIL_SECTIONS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { LeadFileList } from './LeadFileList.native';
import type { LeadSectionsProps } from './LeadSections.types';
import { LeadSitePanel } from './LeadSitePanel.native';
import { LeadTaskList } from './LeadTaskList.native';

/**
 * The lead's six sections as tabs on the phone (`M02-32`): the strip scrolls sideways, each tab
 * with its count where it has one, and the chosen section's panel under it — the caller's timeline,
 * the site, designs and proposals none yet, the tasks with their acts, the files with their add.
 */
export function LeadSections(props: LeadSectionsProps) {
  const { section, onSection, counts, words } = props;
  return (
    <View style={styles.sections}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={words.tabsLabel}
        contentContainerStyle={styles.tabs}
      >
        {LEAD_DETAIL_SECTIONS.map((each) => {
          const count = counts[each];
          const chosen = each === section;
          return (
            <Pressable
              key={each}
              accessibilityRole="tab"
              accessibilityState={{ selected: chosen }}
              onPress={() => onSection(each)}
              style={[styles.tab, chosen ? styles.chosen : undefined]}
            >
              <Text variant="body-sm" color={chosen ? 'primary' : 'secondary'} bold={chosen}>
                {words.tabs[each]}
              </Text>
              {count === null ? null : (
                <Text variant="mono" color="secondary">
                  {String(count)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <Panel {...props} />
    </View>
  );
}

/** The chosen section's panel. */
function Panel(props: LeadSectionsProps) {
  const { section, counts, words } = props;
  switch (section) {
    case 'timeline':
      return <Tile>{props.timeline}</Tile>;
    case 'site':
      return (
        <Tile>
          <LeadSitePanel siteAddress={props.siteAddress} visit={props.visit} words={words} />
        </Tile>
      );
    case 'designs':
      return (
        <CountPanel
          count={counts.designs}
          some={words.designs}
          none={words.noDesign}
          line={words.designsLine}
        />
      );
    case 'proposals':
      return (
        <CountPanel
          count={counts.proposals}
          some={words.proposals}
          none={words.noProposal}
          line={words.proposalsLine}
        />
      );
    case 'tasks':
      return (
        <Tile>
          <LeadTaskList tasks={props.tasks} acts={props.taskActs} words={words} />
        </Tile>
      );
    case 'files':
      return (
        <Tile>
          <LeadFileList files={props.files} words={words} />
        </Tile>
      );
  }
}

/** A panel's white card, holding its controls on the tile's ground. */
function Tile({ children }: { children: ReactNode }) {
  return (
    <View style={[tileSurface, styles.tile]}>
      <GroundProvider ground="tile">{children}</GroundProvider>
    </View>
  );
}

/** A section counted here and filled by a later module: its count, or its named gap, and why. */
function CountPanel({
  count,
  some,
  none,
  line,
}: {
  count: number | null;
  some: (count: number) => TranslatedText;
  none: TranslatedText;
  line: TranslatedText;
}) {
  return (
    <Tile>
      {count === null || count === 0 ? (
        <NamedGap gap={none} scale="headline" />
      ) : (
        <Text variant="body" bold>
          {some(count)}
        </Text>
      )}
      <Text variant="body-sm" color="secondary">
        {line}
      </Text>
    </Tile>
  );
}

const styles = StyleSheet.create({
  sections: { gap: theme.spacing['sp-3'] },
  tabs: { gap: theme.spacing['sp-1'] },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderBottomWidth: theme.spacing['sp-0-5'],
    borderBottomColor: 'transparent',
  },
  chosen: { borderBottomColor: colors['text-primary'] },
  tile: {
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
});
