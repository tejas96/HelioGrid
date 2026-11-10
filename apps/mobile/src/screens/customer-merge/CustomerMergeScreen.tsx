import {
  type CustomerMergeScreen as CustomerMergeView,
  useCustomerMergeScreen,
} from '@heliogrid/data/react';
import { customerMergeDoneWords, customerMergeWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Card, MergeDone, useFormat } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { View } from 'react-native';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { MergeChooseStep, MergeReviewAct } from './components/MergeChooseStep';
import { MergeConfirmAct, MergeConfirmStep } from './components/MergeConfirmStep';
import { MergeFindStep } from './components/MergeFindStep';
import { MergeFoot } from './components/MergeFoot';
import { MergeUnavailableStep } from './components/MergeUnavailableStep';
import {
  type CustomerMergeMoves,
  useCustomerMergeMoves,
  useMergeBack,
} from './hooks/use-customer-merge-moves';
import { styles } from './styles';

/**
 * Lead Detail opens it at `heliogrid://customers/merge?survivorId=<this lead's customer>`; a
 * kept-both link adds `loserId`.
 */
type Props = StaticScreenProps<{ survivorId: string; loserId?: string }>;

/**
 * Customer Merge on the phone (`SCR-M02-06`, the 375 frames): an owner or a sales manager who found
 * one family twice. Find the other record, then step 1 — which record stays and a pick for each
 * field that differs, the act asleep until all are picked — and step 2, the confirm read once
 * before the one explicit press. What is read, picked and sent is `useCustomerMergeScreen`'s, the
 * web's too; the phone's own parts are the ways back and the route table.
 */
export function CustomerMergeScreen({ route }: Props) {
  const moves = useCustomerMergeMoves();
  const screen = useCustomerMergeScreen({
    survivorId: route.params.survivorId,
    loserId: route.params.loserId ?? null,
    onOpenLead: moves.openLead,
  });
  useMergeBack(screen);
  if (!screen.allowed) {
    return (
      <ShellPage inView="leads">
        <ShellNotFoundState />
      </ShellPage>
    );
  }
  return <CustomerMergeIn screen={screen} moves={moves} />;
}

function CustomerMergeIn({
  screen,
  moves,
}: {
  screen: CustomerMergeView;
  moves: CustomerMergeMoves;
}) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerMergeWords(t);
  const { read, done } = screen;
  if (done !== null) {
    return (
      <ShellPage
        inView="leads"
        drillDown={{ title: words.title, back: words.done.backToLeads, onBack: moves.toLeads }}
      >
        <View style={styles.stack}>
          <MergeDone
            words={customerMergeDoneWords(t, done, format)}
            onOpenCustomer={screen.openCustomer}
            onBackToLeads={moves.toLeads}
          />
        </View>
      </ShellPage>
    );
  }
  if (screen.step === 'confirm' && read.kind === 'ready') {
    return (
      <ShellPage
        inView="leads"
        drillDown={{
          title: words.confirmTitle,
          summary: words.confirmSummary,
          back: words.backToChoices,
          onBack: screen.backToChoices,
        }}
        foot={
          <MergeFoot>
            <MergeConfirmAct screen={screen} view={read.value} />
          </MergeFoot>
        }
      >
        <MergeConfirmStep view={read.value} />
      </ShellPage>
    );
  }
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        title: words.title,
        summary: screen.step === 'find' ? words.find.line : words.chooseSummary,
        back: words.cancelSpoken,
        onBack: moves.cancel,
      }}
      foot={
        screen.step === 'choose' && read.kind === 'ready' ? (
          <MergeFoot>
            <MergeReviewAct screen={screen} view={read.value} />
          </MergeFoot>
        ) : undefined
      }
    >
      <View style={styles.page}>
        <CustomerMergeBody screen={screen} moves={moves} />
      </View>
    </ShellPage>
  );
}

function CustomerMergeBody({
  screen,
  moves,
}: {
  screen: CustomerMergeView;
  moves: CustomerMergeMoves;
}) {
  const t = useTranslate();
  const words = customerMergeWords(t);
  const { read } = screen;
  if (screen.step === 'find') return <MergeFindStep find={screen.find} />;
  if (read.kind === 'unavailable') {
    return <MergeUnavailableStep unavailable={read.unavailable} onBack={moves.cancel} />;
  }
  if (read.kind === 'ready') return <MergeChooseStep screen={screen} view={read.value} />;
  return (
    <Card
      read={read.kind === 'failed' ? read : { kind: 'loading' }}
      loadingLabel={words.loading}
      errorTitle={words.readFailed}
      retryLabel={words.tryAgain}
    />
  );
}
