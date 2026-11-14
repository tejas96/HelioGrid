'use client';
import {
  type ProposalTemplateScreen as ProposalDefaults,
  useProposalTemplateScreen,
} from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import {
  documentDefaults,
  proposalBuilderLabels,
  proposalDefaultsCovers,
  proposalDefaultsPartWords,
  proposalDefaultsSampleCustomer,
  proposalDefaultsStanding,
  proposalDefaultsWords,
  proposalPhaseSheetWords,
  proposalStepWords,
  proposalTemplateWords,
  SHELL,
  settingsSavedToast,
  templateFieldRefusals,
  toastHostWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  defaultsPartsOf,
  type FocusHandle,
  PageTrail,
  ProposalTemplateOverlays,
  ProposalTemplateSettings,
  ToastHost,
  useFormat,
  useOwnWidth,
  useSavedMoment,
  useToasts,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { openImagePicker, useImageFile } from '../../lib/use-image-file';
import { PaymentPlanEditor } from '../payment-terms';
import { settingsRowPath } from '../settings';
import { DOOR_PATH } from '../shell';
import { useDefaultsSample } from './hooks/use-defaults-sample';
import '../../lib/focus-screen.css';
import './proposal-template.css';

/**
 * Proposal defaults behind `More` on the web (`SCR-M01-19`, `M01-51`, `M01-52`, `T-M01-030`): what
 * every new proposal starts with, set on the builder's own parts beside the real page. A focus
 * screen — it has the whole window, with its breadcrumb back to Settings. What it draws is
 * `useProposalTemplateScreen`'s, the phone's too; the page body is `ProposalTemplateSettings`. The
 * web's own parts are the phase editor's panel, the plan editor, the image chooser, the confirms
 * and the leave guard. Only a person whose presets open the row reaches it (`F7-48`).
 */
export function ProposalTemplateScreen() {
  const { t } = useI18n();
  const { pack } = useFormat();
  const defaults = documentDefaults(t);
  const screen = useProposalTemplateScreen(defaults, defaults.trancheTemplates[0], {
    formats: pack,
    customer: proposalDefaultsSampleCustomer(t),
    newPart: proposalBuilderLabels(t).newPart,
  });
  if (!screen.allowed) notFound();
  return <DefaultsPage screen={screen} />;
}

function DefaultsPage({ screen }: { screen: ProposalDefaults }) {
  const { t } = useI18n();
  const { pack, date } = useFormat();
  const router = useRouter();
  const guarded = useGuardedMove();
  const { page, overlays, held, plans, coverPhoto } = screen;
  /* A change held on the page, or in the plan editor opened over it: the ask that owns it answers. */
  const planChanged = plans.page.editor?.changed ?? false;
  useLeaveGuard(held || planChanged, planChanged ? plans.askLeave : screen.leave.ask);
  const toasts = useToasts();
  useSavedMoment(toasts.push, page.saving, page.saveFailure !== null, settingsSavedToast(t));
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const title = useRef<FocusHandle>(null);
  const sample = useDefaultsSample(screen);
  const chooseFile = useImageFile(coverPhoto.choose);

  const words = proposalDefaultsWords(t);
  const shell = proposalTemplateWords(t);
  const toSettings = () => guarded(() => router.push(DOOR_PATH.more));
  const toBranding = () => guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT.branding)));
  const refusal = templateFieldRefusals(t, page.refusals).termsError;

  return (
    <div ref={room} tabIndex={-1} className="hg-defaults-screen hg-focus-ground hg-focus-target">
      <ProposalTemplateSettings
        wide={width !== null && width >= theme.layout['bp-desktop']}
        words={words}
        shared={proposalStepWords(t)}
        read={page.read}
        part={screen.part}
        onPart={screen.choosePart}
        trail={
          <PageTrail
            trail={[{ label: words.settings, onOpen: toSettings }]}
            here={words.title}
            label={words.trail}
          />
        }
        standing={proposalDefaultsStanding(
          t,
          { standing: page.standing, held },
          { date: (epochMs) => date(new Date(epochMs)) },
        )}
        sample={sample}
        {...defaultsPartsOf(screen.view, {
          words: proposalDefaultsPartWords(t, {
            owner: '',
            routingLabel: pack.bankRoutingLabel,
            printsBank: screen.view.pages.rows.some((row) => row.page === 'bank' && row.on),
          }),
          covers: proposalDefaultsCovers(t),
          edit: page.edit,
          photo: {
            picture: coverPhoto.picture,
            held: coverPhoto.held?.kind === 'own' ? coverPhoto.held : null,
            storing: coverPhoto.storing,
            refused: coverPhoto.refused,
            onChoose: () => openImagePicker(chooseFile),
          },
          onOpenBranding: toBranding,
          platformPhases: documentDefaults(t).phases,
          onEditPhase: overlays.editPhase,
          onDeletePhase: overlays.askDeletePhase,
          onAddPhase: overlays.addPhase,
          plans: plans.page.cards.inUse,
          changingPlan: plans.page.acting !== null,
          onPlan: (id) => plans.page.act(id, 'make-default'),
          onNewPlan: plans.add,
          plan: screen.plan,
          bank: page.bank,
          sample,
        })}
        saveFailed={page.saveFailure !== null}
        {...(refusal === undefined || !held ? {} : { refusal })}
        {...(held
          ? { act: { saving: page.saving, onSave: screen.save, onDiscard: page.discard } }
          : {})}
        onDone={toSettings}
        previewOpen={overlays.previewOpen}
        onPreview={overlays.setPreview}
        titleRef={title}
        focusAfter={title}
      />
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        focusAfter={room}
        {...toastHostWords(t)}
      />
      <PaymentPlanEditor screen={plans} />
      <ProposalTemplateOverlays
        overlays={overlays}
        phaseWords={proposalPhaseSheetWords(t, { number: overlays.phaseNumber })}
        words={shell}
        leaveBody={words.leaveBody}
        closeLabel={t(SHELL.close)}
        leave={screen.leave}
      />
    </div>
  );
}
