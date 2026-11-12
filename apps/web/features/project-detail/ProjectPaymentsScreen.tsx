'use client';
import { useProjectPayments } from '@heliogrid/data/react';
import {
  destinationLabel,
  moneySheetWords,
  paymentFailureWords,
  paymentsPageWords,
  projectMoneyWords,
  projectTitleWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LargeTitle,
  MoneyQrFull,
  MoneySheet,
  moneyPageActsOf,
  moneySheetsOf,
  ProjectMoney,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { PaymentToast } from './components/PaymentToast';
import { ProjectTrail } from './components/ProjectTrail';
import { usePaymentMoves } from './hooks/use-payment-moves';

import './project-detail.css';

/**
 * A project's payments on the web (`SCR-M11-02`, design A): the owner or accountant at a desk —
 * they came to see what is due, send the pay message in the customer's chat or copy it, and record
 * the money that came in, without a figure typed twice. What is read and sent is
 * `useProjectPayments`'s, the phone's too; the web's own parts are the router, the tab a link
 * opens in, the clipboard and the photo chooser.
 */
export function ProjectPaymentsScreen({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectPayments(projectId);
  const moves = usePaymentMoves(projectId, screen);
  const room = useRef<HTMLDivElement>(null);
  const { read } = screen;
  const payments = read.kind === 'ready' ? read.value : null;
  const page = paymentsPageWords(t);
  const sheetWords = moneySheetWords(t, { pack: format.pack, language: locale }, 'copy');
  const title =
    payments === null
      ? null
      : projectTitleWords(t, { name: payments.name, number: payments.number, place: null }).title;
  const sheets =
    payments === null
      ? null
      : moneySheetsOf(screen, payments, moves.sheet, {
          words: sheetWords,
          failure: screen.failure === null ? null : paymentFailureWords(t, screen.failure),
          money: format.money,
        });
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-project-page">
      <ProjectTrail
        acts={null}
        board={destinationLabel(t, moves.wayBack)}
        project={title}
        documents={page.title}
        onBoard={moves.toWayBack}
        onProject={moves.toProject}
      />
      {payments === null || title === null ? null : (
        <LargeTitle
          title={page.title}
          summary={page.summary(payments.name, payments.number, payments.parts.length)}
        />
      )}
      <ProjectMoney
        read={read}
        words={projectMoneyWords(t)}
        {...moneyPageActsOf(screen, moves)}
        focusAfter={room}
      />
      {sheets === null ? null : (
        <>
          <MoneySheet {...sheets.sheet} />
          <MoneyQrFull {...sheets.qr} />
        </>
      )}
      <PaymentToast screen={screen} words={page} focusAfter={room} />
    </div>
  );
}
