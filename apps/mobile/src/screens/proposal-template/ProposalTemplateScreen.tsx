import { useProposalTemplateScreen } from '@heliogrid/data/react';
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
  templateFieldRefusals,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  defaultsPartsOf,
  type FocusHandle,
  ProposalTemplateOverlays,
  ProposalTemplateSettings,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedToast } from '../settings/components/SavedToast';
import { PlanEditing } from './components/PlanEditing';
import { useDefaultsSample } from './hooks/use-defaults-sample';
import { useTemplateActs } from './hooks/use-template-acts';
import { styles } from './styles';

/**
 * Proposal defaults behind `More` on the phone (`SCR-M01-19`, `T-M01-030`): a focus screen — back,
 * the page's name and the eye in its own bar, the seven parts as one row, the part's title with
 * what is in force, a peek of the page it feeds, the builder step's own controls, and the dock.
 * What it draws is `useProposalTemplateScreen`'s, the web's too; the phone's own parts are the
 * safe areas, the keyboard, the photo picker and the way back.
 */
export function ProposalTemplateScreen() {
  const { t } = useI18n();
  const format = useFormat();
  const insets = useSafeAreaInsets();
  const defaults = documentDefaults(t);
  const screen = useProposalTemplateScreen(defaults, defaults.trancheTemplates[0], {
    formats: format.pack,
    customer: proposalDefaultsSampleCustomer(t),
    newPart: proposalBuilderLabels(t).newPart,
  });
  const acts = useTemplateActs(screen);
  const sample = useDefaultsSample(screen);
  const title = useRef<FocusHandle>(null);
  const { page, overlays, held, plans, coverPhoto } = screen;
  const words = proposalDefaultsWords(t);
  const refusal = templateFieldRefusals(t, page.refusals).termsError;
  return (
    <View style={styles.screen}>
      <ProposalTemplateSettings
        wide={false}
        words={words}
        shared={proposalStepWords(t)}
        read={page.read}
        part={screen.part}
        onPart={screen.choosePart}
        trail={null}
        standing={proposalDefaultsStanding(
          t,
          { standing: page.standing, held },
          { date: (epochMs) => format.date(new Date(epochMs)) },
        )}
        sample={sample}
        {...defaultsPartsOf(screen.view, {
          words: proposalDefaultsPartWords(t, {
            owner: '',
            routingLabel: format.pack.bankRoutingLabel,
            printsBank: screen.view.pages.rows.some((row) => row.page === 'bank' && row.on),
          }),
          covers: proposalDefaultsCovers(t),
          edit: page.edit,
          photo: {
            picture: coverPhoto.picture,
            held: coverPhoto.held?.kind === 'own' ? coverPhoto.held : null,
            storing: coverPhoto.storing,
            refused: coverPhoto.refused,
            onChoose: acts.pickPhoto,
          },
          onOpenBranding: acts.openBranding,
          platformPhases: defaults.phases,
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
          ? { act: { saving: page.saving, onSave: acts.save, onDiscard: page.discard } }
          : {})}
        onDone={acts.done}
        previewOpen={overlays.previewOpen}
        onPreview={overlays.setPreview}
        safe={{ top: insets.top, bottom: insets.bottom }}
        titleRef={title}
        focusAfter={title}
      />
      <PlanEditing plans={plans} />
      <ProposalTemplateOverlays
        overlays={overlays}
        phaseWords={proposalPhaseSheetWords(t, { number: overlays.phaseNumber })}
        words={proposalTemplateWords(t)}
        leaveBody={words.leaveBody}
        closeLabel={t(SHELL.close)}
        leave={screen.leave}
      />
      <SavedToast saving={page.saving} failed={page.saveFailure !== null} focusAfter={title} />
    </View>
  );
}
