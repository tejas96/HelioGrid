import {
  type ProposalBuilderScreen as Builder,
  useProposalBuilderScreen,
} from '@heliogrid/data/react';
import {
  builderSaidFormatOf,
  proposalBuilderLabels,
  proposalBuilderLeaveWords,
  proposalBuilderViewSaid,
  proposalStepWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  BrandBloom,
  type FocusHandle,
  LeaveConfirm,
  ProposalBuilderView,
  ProposalStep,
  useFormat,
} from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { type RefObject, useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuilderCatalogAdd } from './components/BuilderCatalogAdd';
import { useBuilderLeave } from './hooks/use-builder-leave';
import { useBuilderMoves } from './hooks/use-builder-moves';
import { useSheetsCloseOnLeave } from './hooks/use-sheets-close-on-leave';
import { styles } from './styles';

/**
 * The builder opens at `heliogrid://proposals/<id>/build`; `?step=<key>` names the step, else the
 * first one presented opens.
 */
type Props = StaticScreenProps<{ proposalId: string; step?: string }>;

/**
 * The proposal builder on the phone (`SCR-M06-02`…`SCR-M06-13`): a focus screen — it stands alone,
 * with no shell and no pill, as search does. What it draws is `ProposalBuilderView`'s over
 * `useProposalBuilderScreen` and `proposalBuilderViewSaid`, the web's too. The phone's own parts
 * are the safe areas, the width a page is drawn at, the catalog's sheets and the moves.
 */
export function ProposalBuilderScreen({ route }: Props) {
  const { proposalId, step } = route.params;
  const { t, locale } = useI18n();
  const format = useFormat();
  const moves = useBuilderMoves(step);
  const screen = useProposalBuilderScreen(proposalId, {
    step: moves.step,
    formats: format.pack,
    reader: locale,
    intents: moves.intents,
    labels: proposalBuilderLabels(t),
  });
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const title = useRef<FocusHandle | null>(null);
  const said = proposalBuilderViewSaid(t, screen, builderSaidFormatOf(format));
  const { read, leave } = screen;
  useBuilderLeave(leave);
  useSheetsCloseOnLeave(screen);
  const leaveWords = proposalBuilderLeaveWords(t);
  return (
    <View style={styles.page}>
      <BrandBloom placement="page" />
      {read.kind === 'ready' && said !== null ? (
        <ProposalBuilderView
          screen={screen}
          ready={read.value}
          said={said}
          wide={false}
          room={window.width - 2 * theme.spacing['sp-5']}
          safe={{ top: insets.top, bottom: insets.bottom }}
          titleRef={title}
          catalogAdd={<BuilderCatalogAdd screen={screen} />}
          onPlans={moves.toPlans}
          onOpenFile={moves.openFile}
        />
      ) : (
        <LoadingStep read={read} title={title} />
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
    </View>
  );
}

/** The draft still being read, or not read: the step's own loading and retry, inside the safe areas. */
function LoadingStep({
  read,
  title,
}: {
  read: Builder['read'];
  title: RefObject<FocusHandle | null>;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.loading, { paddingTop: insets.top + theme.spacing['sp-5'] }]}>
      <ProposalStep
        wide={false}
        words={proposalStepWords(t)}
        read={read.kind === 'ready' || read.kind === 'empty' ? { kind: 'loading' } : read}
        focusAfter={title}
      />
    </View>
  );
}
