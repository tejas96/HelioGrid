import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { EmptyScene } from '../EmptyScene';
import { HueTile } from '../HueTile';
import { ProgressRing } from '../ProgressRing';
import { ProposalStatus } from '../ProposalStatus';
import {
  draftShare,
  isUnfinishedDraft,
  leadProposalsState,
  liveProposals,
} from './LeadSections.proposals';
import type { LeadProposal, LeadProposalsPanel } from './LeadSections.types';
import './LeadProposalList.css';

function Words({
  proposal,
  words,
}: {
  proposal: LeadProposal;
  words: LeadProposalsPanel['words'];
}) {
  return (
    <span className="hg-lead-proposal-words">
      <b>
        {proposal.number === null
          ? words.draftTitle
          : words.numbered(proposal.number, proposal.version)}
      </b>
      <span>{words.line(proposal)}</span>
    </span>
  );
}

function Row({ proposal, panel }: { proposal: LeadProposal; panel: LeadProposalsPanel }) {
  const { words } = panel;
  if (isUnfinishedDraft(proposal)) {
    const { complete, of } = proposal.progress;
    return (
      <Pressable className="hg-lead-proposal" onPress={() => panel.onContinue(proposal.id)}>
        <ProgressRing
          size="sm"
          share={draftShare(proposal)}
          value={words.ringValue(complete, of)}
          caption={words.ringName(complete, of)}
          spokenName={words.ringName(complete, of)}
        />
        <Words proposal={proposal} words={words} />
        <span className="hg-lead-proposal-go">
          {words.continue}
          <ShellGlyph name="arrow-right" size="sm" tone="inverse" />
        </span>
      </Pressable>
    );
  }
  return (
    <Pressable className="hg-lead-proposal" onPress={() => panel.onOpen(proposal.id)}>
      <HueTile glyph="file-text" hue="ocean" size={44} stroke={1.6} />
      <Words proposal={proposal} words={words} />
      <ProposalStatus
        standing={proposal.standing}
        label={words.standing(proposal.standing)}
        density="functional"
      />
    </Pressable>
  );
}

/** One of two live proposals: its facts, and Withdraw for a reader who may. */
function CollisionRow({ proposal, panel }: { proposal: LeadProposal; panel: LeadProposalsPanel }) {
  const { words } = panel;
  return (
    <div className="hg-lead-proposal" data-still="">
      <HueTile glyph="file-text" hue="ocean" size={44} stroke={1.6} />
      <span className="hg-lead-proposal-words">
        <b>
          {proposal.number === null
            ? words.draftTitle
            : words.numbered(proposal.number, proposal.version)}
          <ProposalStatus
            standing={proposal.standing}
            label={words.standing(proposal.standing)}
            density="functional"
          />
        </b>
        <span>{words.line(proposal)}</span>
      </span>
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
    </div>
  );
}

/** The lead's Proposals section, on the web: one of its five states (`T-M06-001`). */
export function LeadProposalList({ panel }: { panel: LeadProposalsPanel }) {
  const { section, words } = panel;
  const state = leadProposalsState(section, panel.closed);
  if (state === 'closed') {
    return (
      <div className="hg-lead-proposals-empty">
        <HueTile glyph="lock" hue="neutral" size={48} stroke={1.6} />
        <span className="hg-lead-proposal-words">
          <b>{words.closedTitle}</b>
          <span>{words.closedLine}</span>
        </span>
        {panel.onReopenLead === null ? null : (
          <Button
            variant="secondary"
            size="md"
            icon={<ShellGlyph name="undo" size="md" tone="primary" />}
            onClick={panel.onReopenLead}
          >
            {words.reopenLead}
          </Button>
        )}
      </div>
    );
  }
  if (state === 'none') {
    return (
      <div className="hg-lead-proposals-empty">
        <EmptyScene name="settle" size="compact" />
        <span className="hg-lead-proposal-words">
          <b>{words.noneTitle}</b>
          <span>{words.noneLine}</span>
        </span>
        {section.canStart ? (
          <Button
            variant="primary"
            size="md"
            icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
            onClick={panel.onCreate}
          >
            {words.create}
          </Button>
        ) : null}
      </div>
    );
  }
  const live = liveProposals(section);
  return (
    <div className="hg-lead-proposals">
      {state === 'collision' ? (
        <Banner tone="warning" title={words.twoTitle}>
          {words.twoLine}
        </Banner>
      ) : null}
      {section.sibling === null ? null : (
        <div className="hg-lead-proposal" data-still="">
          <HueTile glyph="people" hue="warning" size={44} stroke={1.6} />
          <span className="hg-lead-proposal-words">
            <span>{words.siblingLine(section.sibling.number)}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={panel.onOpenSibling}>
            {words.openSibling}
          </Button>
        </div>
      )}
      {section.items.map((proposal) =>
        state === 'collision' && live.includes(proposal) ? (
          <CollisionRow key={proposal.id} proposal={proposal} panel={panel} />
        ) : (
          <Row key={proposal.id} proposal={proposal} panel={panel} />
        ),
      )}
      {state === 'list' && live.length === 0 && section.canStart ? (
        <span className="hg-lead-proposals-more">
          <Button
            variant="secondary"
            size="md"
            icon={<ShellGlyph name="plus" size="md" tone="primary" />}
            onClick={panel.onCreate}
          >
            {words.create}
          </Button>
        </span>
      ) : null}
    </div>
  );
}
