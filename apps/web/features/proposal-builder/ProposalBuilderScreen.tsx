'use client';
import { useProposalBuilderScreen } from '@heliogrid/data/react';
import {
  builderSaidFormatOf,
  proposalBuilderLabels,
  proposalBuilderLeaveWords,
  proposalBuilderViewSaid,
  proposalStepWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type FocusHandle,
  LeaveConfirm,
  ProposalBuilderView,
  ProposalStep,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { useLeaveGuard } from '../../lib/leave-guard';
import { BuilderCatalogAdd } from './components/BuilderCatalogAdd';
import { BUILDER_WIDE_FROM } from './constants';
import { useBuilderMoves } from './hooks/use-builder-moves';
import '../../lib/focus-screen.css';

/**
 * The proposal builder on the web (`SCR-M06-02`…`SCR-M06-13`): a focus screen — no sidebar, no
 * bottom bar (`lib/focus-screen.tsx`). What it draws is `ProposalBuilderView`'s over
 * `useProposalBuilderScreen` and `proposalBuilderViewSaid`, the phone's too. The web's own parts
 * are the room it measures, the catalog's panels, and the address: a step rides `?step=`, so the
 * browser's Back and forward walk the steps.
 */
export function ProposalBuilderScreen({ proposalId }: { proposalId: string }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const moves = useBuilderMoves(proposalId);
  const screen = useProposalBuilderScreen(proposalId, {
    step: moves.step,
    formats: format.pack,
    reader: locale,
    intents: moves.intents,
    labels: proposalBuilderLabels(t),
  });
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= BUILDER_WIDE_FROM;
  const title = useRef<FocusHandle | null>(null);
  const said = proposalBuilderViewSaid(t, screen, builderSaidFormatOf(format));
  const { read, leave } = screen;
  /* Close and closing the tab ask first while a value is not stored (`T-M06-023`). */
  useLeaveGuard(leave.held, leave.ask);
  const leaveWords = proposalBuilderLeaveWords(t);
  return (
    <div ref={room} className="hg-focus-ground">
      {read.kind === 'ready' && said !== null ? (
        <ProposalBuilderView
          screen={screen}
          ready={read.value}
          said={said}
          wide={wide}
          room={width ?? 0}
          titleRef={title}
          catalogAdd={<BuilderCatalogAdd screen={screen} />}
          onPlans={moves.toPlans}
          onOpenFile={moves.openFile}
        />
      ) : (
        <ProposalStep
          wide={wide}
          words={proposalStepWords(t)}
          read={read.kind === 'ready' || read.kind === 'empty' ? { kind: 'loading' } : read}
          focusAfter={title}
        />
      )}
      <LeaveConfirm
        open={leave.asking}
        title={leaveWords.title}
        body={leaveWords.body}
        discard={leaveWords.discard}
        keep={leaveWords.keep}
        onLeave={leave.leave}
        onKeep={leave.stay}
      />
    </div>
  );
}
