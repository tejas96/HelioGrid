import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import { HueTile } from '../HueTile/HueTile.native';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { ProposalStatus } from '../ProposalStatus/ProposalStatus.native';
import {
  draftShare,
  isUnfinishedDraft,
  leadProposalsState,
  liveProposals,
} from './LeadSections.proposals';
import type { LeadProposal, LeadProposalsPanel } from './LeadSections.types';

type Words = LeadProposalsPanel['words'];

function RowWords({ proposal, words }: { proposal: LeadProposal; words: Words }) {
  return (
    <View style={styles.grow}>
      {/* A proposal's number is an identifier, in the mono face; a draft's title is words. */}
      <Text variant={proposal.number === null ? 'body' : 'mono'} bold>
        {proposal.number === null
          ? words.draftTitle
          : words.numbered(proposal.number, proposal.version)}
      </Text>
      <Text variant="body-sm" color="secondary">
        {words.line(proposal)}
      </Text>
    </View>
  );
}

function Row({ proposal, panel }: { proposal: LeadProposal; panel: LeadProposalsPanel }) {
  const { words } = panel;
  const fill = useGround().controlFill;
  if (isUnfinishedDraft(proposal)) {
    const { complete, of } = proposal.progress;
    return (
      <Pressable onPress={() => panel.onContinue(proposal.id)} style={styles.press}>
        <View style={[styles.row, { backgroundColor: fill }]}>
          <ProgressRing
            size="sm"
            share={draftShare(proposal)}
            value={words.ringValue(complete, of)}
            caption={words.ringName(complete, of)}
            spokenName={words.ringName(complete, of)}
          />
          <RowWords proposal={proposal} words={words} />
          <View style={styles.go}>
            <Text variant="body-sm" color="inverse" bold>
              {words.continue}
            </Text>
            <ShellGlyph name="arrow-right" size="sm" tone="inverse" />
          </View>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => panel.onOpen(proposal.id)} style={styles.press}>
      <View style={[styles.row, styles.wrap, { backgroundColor: fill }]}>
        <HueTile glyph="document" hue="ocean" size={44} />
        <RowWords proposal={proposal} words={words} />
        <ProposalStatus
          standing={proposal.standing}
          label={words.standing(proposal.standing)}
          density="functional"
        />
      </View>
    </Pressable>
  );
}

function CollisionRow({ proposal, panel }: { proposal: LeadProposal; panel: LeadProposalsPanel }) {
  const { words } = panel;
  const fill = useGround().controlFill;
  return (
    <View style={[styles.row, styles.wrap, { backgroundColor: fill }]}>
      <HueTile glyph="document" hue="ocean" size={44} />
      <View style={styles.grow}>
        <View style={styles.titleRow}>
          <Text variant={proposal.number === null ? 'body' : 'mono'} bold>
            {proposal.number === null
              ? words.draftTitle
              : words.numbered(proposal.number, proposal.version)}
          </Text>
          <ProposalStatus
            standing={proposal.standing}
            label={words.standing(proposal.standing)}
            density="functional"
          />
        </View>
        <Text variant="body-sm" color="secondary">
          {words.line(proposal)}
        </Text>
      </View>
      {panel.section.canWithdraw ? (
        <Button
          variant="secondary"
          size="sm"
          tone="danger"
          spokenName={words.withdrawNamed(proposal.number)}
          onClick={() => panel.onWithdraw(proposal.id)}
        >
          {words.withdraw}
        </Button>
      ) : null}
    </View>
  );
}

/** No proposal yet, or a closed lead: what the section says, and the one act it offers. */
function Empty({ panel, closed }: { panel: LeadProposalsPanel; closed: boolean }) {
  const { section, words } = panel;
  return (
    <View style={styles.empty}>
      {closed ? (
        <HueTile glyph="lock" hue="neutral" size={48} />
      ) : (
        <EmptyScene name="settle" size="compact" />
      )}
      <Text variant="body" bold align="center">
        {closed ? words.closedTitle : words.noneTitle}
      </Text>
      <Text variant="body-sm" color="secondary" align="center">
        {closed ? words.closedLine : words.noneLine}
      </Text>
      {closed ? (
        panel.onReopenLead === null ? null : (
          <Button
            variant="secondary"
            size="md"
            icon={<ShellGlyph name="undo" size="md" tone="primary" />}
            onClick={panel.onReopenLead}
          >
            {words.reopenLead}
          </Button>
        )
      ) : section.canStart ? (
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          onClick={panel.onCreate}
        >
          {words.create}
        </Button>
      ) : null}
    </View>
  );
}

/** The lead's Proposals section, on the phone: one of its five states (`T-M06-001`). */
export function LeadProposalList({ panel }: { panel: LeadProposalsPanel }) {
  const { section, words } = panel;
  const state = leadProposalsState(section, panel.closed);
  if (state === 'closed' || state === 'none')
    return <Empty panel={panel} closed={state === 'closed'} />;
  const live = liveProposals(section);
  return (
    <View style={styles.list}>
      {state === 'collision' ? (
        <Banner tone="warning" title={words.twoTitle}>
          <Text variant="body-sm">{words.twoLine}</Text>
        </Banner>
      ) : null}
      {section.sibling === null ? null : (
        <View style={[styles.row, styles.wrap, styles.sibling]}>
          <HueTile glyph="people" hue="warning" size={44} />
          <Text variant="body-sm" color="secondary" style={styles.grow}>
            {words.siblingLine(section.sibling.number)}
          </Text>
          <Button variant="ghost" size="sm" onClick={panel.onOpenSibling}>
            {words.openSibling}
          </Button>
        </View>
      )}
      {section.items.map((proposal) =>
        state === 'collision' && live.includes(proposal) ? (
          <CollisionRow key={proposal.id} proposal={proposal} panel={panel} />
        ) : (
          <Row key={proposal.id} proposal={proposal} panel={panel} />
        ),
      )}
      {state === 'list' && live.length === 0 && section.canStart ? (
        <View style={styles.more}>
          <Button
            variant="secondary"
            size="md"
            icon={<ShellGlyph name="plus" size="md" tone="primary" />}
            onClick={panel.onCreate}
          >
            {words.create}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `Pressable` centres its content; a row fills the section's width whatever its words. */
  press: { alignItems: 'stretch' },
  list: { gap: theme.spacing['sp-3'] },
  empty: { alignItems: 'center', gap: theme.spacing['sp-3'], padding: theme.spacing['sp-4'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  wrap: { flexWrap: 'wrap' },
  sibling: { borderStyle: 'dashed' },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    height: 36,
    paddingStart: theme.spacing['sp-4'],
    paddingEnd: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['action-primary'],
  },
  more: { alignSelf: 'flex-start' },
});
