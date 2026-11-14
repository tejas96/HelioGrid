import type { createTranslator } from '@heliogrid/i18n';
import {
  proposalBuilderWords,
  proposalCheckWords,
  proposalCompanyStepWords,
  proposalLinksPageWords,
  proposalListPageWords,
  proposalListWords,
  proposalPageHeadWords,
  proposalQuickAddWords,
  proposalStepListWords,
  proposalStepNames,
  proposalTrackWords,
  proposalVersionsWords,
} from '@heliogrid/i18n';

/**
 * The words the phone's proposal flows read (`SCR-M06-16`…`SCR-M06-20`), each from the catalog the
 * screens read. The flows run on a draft the api started, so no amount and no moment is asserted:
 * the formats here only fill the builders' slots.
 */
export function proposalFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const plain = { money: String, number: String, when: String, ago: String };
  const head = proposalPageHeadWords(t.t, plain);
  const page = proposalListPageWords(t.t, plain, { waiting: 0, waitingValue: '0' });
  return {
    PROPOSALS_TITLE: page.title,
    NEW_PROPOSAL: page.newProposal,
    DRAFT_CHIP: proposalListWords(t.t, plain).filter('draft'),
    WHO_IS_IT_FOR: proposalQuickAddWords(t.t, null).title,
    PROPOSAL_DRAFT: head.name(null),
    NEVER_DELIVERED: proposalTrackWords(t.t, plain).neverDelivered,
    BACK_TO_PROPOSALS: head.backToProposals,
    BACK_TO_PROPOSAL: head.backToProposal,
    VERSIONS_TITLE: head.versions,
    VERSIONS_NONE: proposalVersionsWords(t.t, plain).none,
    LINKS_TITLE: head.links,
    LINKS_SUMMARY: proposalLinksPageWords(t.t).summary,
    DOCUMENT_DRAFT: head.documentTitle(null, null),
    ...builderFlowWords(t),
  };
}

/** Stands for a slot a flow cannot know — the step's place and count — as Maestro's any-text. */
const ANY = '.*';
const PLACE = 7777;
const TOTAL = 8888;

/**
 * The builder's words (`SCR-M06-02`): the draft's mode and its place among the steps are the api's,
 * so the capsule is matched with its count left open.
 */
function builderFlowWords(t: Awaited<ReturnType<typeof createTranslator>>): Record<string, string> {
  const frame = proposalBuilderWords(t.t, { name: '', fullName: '' });
  const capsule = frame
    .openSteps(PLACE, TOTAL, 'TITLE' as never)
    .replace(String(PLACE), ANY)
    .replace(String(TOTAL), ANY)
    .replace('TITLE', ANY);
  const check = proposalCheckWords(t.t, {
    check: { kind: 'blocked', blocks: 1, warnings: 0, firstStep: '' },
    quick: false,
  });
  return {
    BUILD_CLIENT_HEADING: proposalStepNames(t.t).client.heading,
    BUILD_ALL_STEPS: capsule,
    BUILD_STEPS_GENERATE: proposalStepListWords(t.t, { quick: false }).generate,
    BUILD_CHECK_BLOCKED: check.note,
    BUILD_CHECK_CLOSE: check.closeLabel,
    BUILD_CLOSE: frame.close,
    /* Step 1's cover peek and the page it opens, there before any price is typed (`M06-51`). */
    BUILD_OPEN_PEEK: proposalCompanyStepWords(t.t, { name: '' }).openPeek,
    BUILD_PREVIEW_TITLE: proposalBuilderWords(t.t, { name: 'NAME', fullName: '' }).whatSees.replace(
      'NAME',
      ANY,
    ),
  };
}
