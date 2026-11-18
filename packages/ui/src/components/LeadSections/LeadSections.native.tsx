import type { TranslatedText } from '@heliogrid/contracts';
import { LEAD_DETAIL_SECTIONS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useChosenInView } from '../../primitives/use-chosen-in-view.native';
import { Card } from '../Card/Card.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { LeadDesignList } from './LeadDesignList.native';
import { LeadFileList } from './LeadFileList.native';
import { LeadProposalList } from './LeadProposalList.native';
import type { LeadSectionsProps } from './LeadSections.types';
import { LeadSitePanel } from './LeadSitePanel.native';
import { LeadTaskList } from './LeadTaskList.native';

/**
 * The lead's six sections as tabs on the phone (`M02-32`): the strip scrolls sideways, each tab
 * with its count where it has one, and the chosen section's panel under it — the caller's timeline,
 * the site, the designs' cards, the proposals, the tasks with their acts, the files with their add.
 */
export function LeadSections(props: LeadSectionsProps) {
  const { section, onSection, counts, words } = props;
  const { strip, placed } = useChosenInView(section);
  return (
    <View style={styles.sections}>
      <ScrollView
        ref={strip}
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
            <View key={each} onLayout={placed(each)}>
              <Pressable
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
            </View>
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
          <LeadSitePanel site={props.site} visit={props.visit} words={words} />
        </Tile>
      );
    case 'designs':
      return (
        <Tile>
          <LeadDesignList panel={props.designs} />
        </Tile>
      );
    case 'proposals':
      if (props.proposals !== undefined) {
        return (
          <Tile>
            <LeadProposalList panel={props.proposals} />
          </Tile>
        );
      }
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

/** A panel's card — the shared `Card`, as the web's panel is — its parts spaced inside it. */
function Tile({ children }: { children: ReactNode }) {
  return (
    <Card>
      <View style={styles.tile}>{children}</View>
    </Card>
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
  /* The strip's end keeps a gutter, so the last tab never sits flush against the screen's edge. */
  tabs: { gap: theme.spacing['sp-1'], paddingRight: theme.spacing['sp-6'] },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderBottomWidth: theme.spacing['sp-0-5'],
    borderBottomColor: 'transparent',
  },
  chosen: { borderBottomColor: colors['text-primary'] },
  tile: { gap: theme.spacing['sp-3'] },
});
