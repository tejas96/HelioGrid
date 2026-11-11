import { PROJECT_STAGE_CHAIN } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { StreamEntries } from '../ActivityStream/ActivityStreamEntries.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Card } from '../Card/Card.native';
import { leadActivityKinds } from '../LeadTimeline/LeadTimeline.logic';
import { useFormat } from '../MarketProvider';
import { Timeline } from '../Timeline/Timeline.native';
import { projectEventsOf } from './ProjectDetail.activity';
import { journeyItemsOf } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { CardHead } from './ProjectDetailParts.native';

/** Every stage of the deal's chain with its date and who or what moved it — never a % bar. */
export function ProjectJourney(props: ProjectDetailProps) {
  const format = useFormat();
  const { words } = props;
  const sun = <ShellGlyph name="sun" size="sm" tone="inverse" />;
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.journey} aside={words.journeyNote} />
      <View style={styles.pad}>
        <Timeline variant="page" density="functional" items={journeyItemsOf(props, format, sun)} />
      </View>
    </Card>
  );
}

/**
 * The deal behind the project on the phone too (`M08-16`: one screen holds the whole project): the
 * customer with their number, who manages it, and the design and proposal it will point at once
 * their modules land — none linked yet, said so.
 */
export function ProjectDeal({ project, words }: ProjectDetailProps) {
  const format = useFormat();
  const { customer, manager } = project;
  const facts = [
    {
      key: 'customer',
      term: words.customer,
      value: (
        <View style={styles.value}>
          <Text variant="body-sm">{customer.name ?? project.number}</Text>
          <Text variant="mono" color="secondary">
            {format.phone(customer.phoneE164)}
          </Text>
        </View>
      ),
    },
    {
      key: 'manager',
      term: words.managerLabel,
      value: (
        <View style={styles.person}>
          <Avatar name={manager.name} size={24} />
          <Text variant="body-sm">{manager.name}</Text>
        </View>
      ),
    },
    { key: 'design', term: words.design, value: <Quiet>{words.noneLinked}</Quiet> },
    { key: 'proposal', term: words.proposal, value: <Quiet>{words.noneLinked}</Quiet> },
  ];
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.deal} aside={null} />
      {facts.map((fact, index) => (
        <View key={fact.key} style={[styles.fact, index === 0 ? undefined : styles.rule]}>
          <Text variant="body-sm" color="secondary">
            {fact.term}
          </Text>
          {fact.value}
        </View>
      ))}
    </Card>
  );
}

function Quiet({ children }: { children: ProjectDetailProps['words']['noneLinked'] }) {
  return (
    <Text variant="body-sm" color="secondary">
      {children}
    </Text>
  );
}

/**
 * The latest of what happened on the project, newest first — the product's one timeline
 * (`M08-17`), each entry drawn as the lead's timeline draws it.
 */
export function ProjectActivity({ project, words }: ProjectDetailProps) {
  return (
    <Card density="functional" style={styles.card}>
      <CardHead title={words.activity} aside={words.activityNote} />
      <View style={styles.stream}>
        <StreamEntries
          entries={projectEventsOf(project, words, PROJECT_STAGE_CHAIN)}
          kinds={leadActivityKinds(words.activityKind)}
          words={words.stream}
          density="functional"
          {...words.streamFrame}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  pad: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  stream: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
    minHeight: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-3'],
  },
  value: { alignItems: 'flex-end', flexShrink: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
