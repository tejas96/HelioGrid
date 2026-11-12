import { useProjectPayments } from '@heliogrid/data/react';
import {
  destinationLabel,
  moneySheetWords,
  paymentFailureWords,
  paymentsPageWords,
  projectDetailWords,
  projectMoneyWords,
  projectPackWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  MoneyQrFull,
  MoneySheet,
  moneyPageActsOf,
  moneySheetsOf,
  ProjectMoney,
  useFormat,
} from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { PaymentToast } from './components/PaymentToast';
import { usePaymentMoves } from './hooks/use-payment-moves';
import { styles } from './styles';

/**
 * A project's payments at `heliogrid://projects/<id>/payments`; `collect` opens that part's
 * collect sheet on arrival.
 */
type Props = StaticScreenProps<{ projectId: string; collect?: string }>;

/**
 * A project's payments on the phone (`SCR-M11-02`, design A): the owner or project manager at the
 * customer's door — they came to show the QR, share the pay message from their own apps, and record
 * the money that came in with one hand. What is read and sent is `useProjectPayments`'s, the web's
 * too; the phone's own parts are the share sheet and the camera.
 */
export function ProjectPaymentsScreen({ route }: Props) {
  const { projectId, collect } = route.params;
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectPayments(projectId);
  const moves = usePaymentMoves(projectId, screen, collect);
  const page = useRef<View>(null);
  const { read } = screen;
  const payments = read.kind === 'ready' ? read.value : null;
  const words = paymentsPageWords(t);
  const sheetWords = moneySheetWords(t, { pack: format.pack, language: locale }, 'share');
  const back = projectDetailWords(t, projectPackWords(format.pack, locale), format.date).back;
  const sheets =
    payments === null
      ? null
      : moneySheetsOf(screen, payments, moves.sheet, {
          words: sheetWords,
          failure: screen.failure === null ? null : paymentFailureWords(t, screen.failure),
          money: format.money,
        });
  return (
    <ShellPage
      inView="projects"
      drillDown={{
        title: payments === null ? destinationLabel(t, 'projects') : words.title,
        summary:
          payments === null
            ? undefined
            : words.summary(payments.name, payments.number, payments.parts.length),
        back,
        onBack: moves.back,
      }}
    >
      <View ref={page} style={styles.page}>
        <ProjectMoney
          read={read}
          words={projectMoneyWords(t)}
          {...moneyPageActsOf(screen, moves)}
          focusAfter={page}
        />
      </View>
      {sheets === null ? null : (
        <>
          <MoneySheet {...sheets.sheet} />
          <MoneyQrFull {...sheets.qr} />
        </>
      )}
      <PaymentToast screen={screen} words={words} focusAfter={page} />
    </ShellPage>
  );
}
