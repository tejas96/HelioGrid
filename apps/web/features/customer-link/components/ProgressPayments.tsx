'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import type { CustomerProgressWords } from '@heliogrid/i18n';
import { AfterSummary, Button, ShellGlyph, StatusChip, useFormat } from '@heliogrid/ui';
import { usePageMoves } from '../hooks/use-page-moves';
import { PageCard } from './CustomerFrame';

type Payments = NonNullable<CustomerPage['progress']>['payments'];
type Part = Payments['parts'][number];

const TONE: Readonly<Record<string, 'success' | 'warning' | 'neutral' | undefined>> = {
  received: 'success',
  due: 'warning',
  part_received: 'warning',
  waived: 'neutral',
};

/**
 * The money as the customer reads it (`F5-57`…`F5-59`): a paid part with its receipt, said as
 * recorded by the company and never as confirmed by a bank; the part now due with the company's own
 * UPI and bank and the exact amount, only where the company saved them; the parts ahead. A cancelled
 * project keeps its receipts and shows nothing else.
 */
export function ProgressPayments({
  payments,
  receiptsOnly,
  screen,
  words,
  onNotOpened,
}: {
  payments: Payments;
  receiptsOnly: boolean;
  screen: CustomerPageScreen;
  words: CustomerProgressWords;
  /** A receipt's file did not open: said where the person acted. */
  onNotOpened: () => void;
}) {
  const parts = receiptsOnly
    ? payments.parts.filter((part) => part.receipts.length > 0)
    : payments.parts;
  if (parts.length === 0) return null;
  return (
    <PageCard title={words.payments.title}>
      {parts.map((part) => (
        <PaymentPart
          key={part.label}
          part={part}
          column={parts.map((each) => each.amount)}
          due={!receiptsOnly && payments.due?.label === part.label ? payments.due : null}
          screen={screen}
          words={words}
          onNotOpened={onNotOpened}
        />
      ))}
    </PageCard>
  );
}

function PaymentPart({
  part,
  column,
  due,
  screen,
  words,
  onNotOpened,
}: {
  part: Part;
  /** Every amount of the column this part's sits in: they share one form (`moneyPlain`). */
  column: readonly string[];
  due: Payments['due'];
  screen: CustomerPageScreen;
  words: CustomerProgressWords;
  onNotOpened: () => void;
}) {
  const format = useFormat();
  const moves = usePageMoves(screen.fileLink);
  const state = words.payments.state[part.state];
  const { payments } = words;
  return (
    <div className="hg-cust-pay" data-due={due !== null || undefined}>
      <span className="hg-cust-pay-words">
        <b>{part.label}</b>
        {part.receipts.map((receipt) => (
          <span key={receipt.number} className="hg-cust-receipt">
            <WholeNumber
              sentence={payments.paidLine(
                receipt.receivedOn === null ? null : format.date(receipt.receivedOn),
                receipt.number,
              )}
              number={receipt.number}
            />
            {receipt.reversedOn === null ? null : (
              <span>{payments.reversedLine(format.date(receipt.reversedOn))}</span>
            )}
            {receipt.fileId === null ? null : (
              <Button
                variant="ghost"
                size="sm"
                icon={<ShellGlyph name="download" size="sm" />}
                onClick={() =>
                  void moves.openFile(receipt.fileId ?? '').then((opened) => {
                    if (!opened) onNotOpened();
                  })
                }
              >
                {payments.receipt(receipt.number)}
              </Button>
            )}
          </span>
        ))}
        {part.state === 'part_received' ? (
          <span>
            {payments.partLine(
              format.moneyPlain(part.received),
              format.moneyPlain(part.outstanding),
            )}
          </span>
        ) : null}
        {due === null ? null : <span>{payments.dueLine}</span>}
      </span>
      <span className="hg-cust-pay-amount">
        <b className="hg-cust-mono">{format.moneyPlain(part.amount, column)}</b>
        {state === undefined ? null : (
          <StatusChip tone={TONE[part.state] ?? 'neutral'} label={state} density="functional" />
        )}
      </span>
      {due === null ? null : <PayTo due={due} words={words} />}
    </div>
  );
}

/**
 * A sentence that carries a receipt number: the number is one token, read in the mono face and never
 * broken across two lines (`RCPT-` / `0002`).
 */
function WholeNumber({ sentence, number }: { sentence: string; number: string }) {
  const at = sentence.indexOf(number);
  if (at < 0) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, at)}
      <span className="hg-cust-mono hg-cust-whole">{number}</span>
      {sentence.slice(at + number.length)}
    </>
  );
}

/** How to pay the part now due (`F5-58`): what the company saved, and nothing made up beside it. */
function PayTo({
  due,
  words,
}: {
  due: NonNullable<Payments['due']>;
  words: CustomerProgressWords;
}) {
  const format = useFormat();
  const { payTo } = due;
  const { payments } = words;
  if (payTo.upiId === null && payTo.bank === null) return null;
  return (
    <div className="hg-cust-payto">
      <AfterSummary
        rows={[
          { label: payments.payee, value: payTo.payee },
          ...(payTo.upiId === null
            ? []
            : [{ label: payments.upi, value: payTo.upiId, mono: true }]),
          ...(payTo.bank === null
            ? []
            : [
                {
                  label: payments.bank,
                  value: payments.bankValue(
                    payTo.bank.bankName,
                    payTo.bank.accountNumber,
                    payTo.bank.routing,
                  ),
                  mono: true,
                },
              ]),
          { label: payments.payExactly, value: format.moneyPlain(due.amount), mono: true },
        ]}
      />
    </div>
  );
}
