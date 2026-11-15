import type { BuilderIntents } from '@heliogrid/data/react';
import { PROPOSAL_STEPS, type ProposalStep, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';
import { openOutside } from '../../shared/open-outside';

/**
 * The builder's phone moves — the platform adapter. The step rides the route's params, so a link
 * can open any step and a jump redraws this one screen; the phone's Back (and iOS's swipe) leaves
 * the builder, the draft kept — a sheet that is open closes first, which is the sheet's own doing.
 * Close goes back to the lead it hangs on; *See it and share* puts the proposal's own screen in
 * the builder's place, so Back from there never returns to a finished build.
 */
export function useBuilderMoves(asked: string | undefined): {
  step: ProposalStep | null;
  intents: BuilderIntents;
  openFile: (url: string) => void;
  /** *See plans*, at the plan's limit (`T-M06-028`). */
  toPlans: () => void;
} {
  const navigation = useNavigation();
  return {
    step: PROPOSAL_STEPS.find((step) => step === asked) ?? null,
    intents: {
      toStep: (step) => navigation.dispatch(CommonActions.setParams({ step })),
      toLead: (leadId) => navigation.dispatch(StackActions.popTo('LeadDetail', { leadId })),
      toProposal: (proposalId) =>
        navigation.dispatch(StackActions.replace('ProposalTrack', { proposalId })),
    },
    openFile: openOutside,
    toPlans: () => navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.billing }),
  };
}

export type BuilderMoves = ReturnType<typeof useBuilderMoves>;
