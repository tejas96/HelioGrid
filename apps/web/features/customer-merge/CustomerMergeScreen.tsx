'use client';
import {
  type CustomerMergeScreen as CustomerMergeView,
  useCustomerMergeScreen,
} from '@heliogrid/data/react';
import { customerMergeDoneWords, customerMergeWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  Card,
  LargeTitle,
  MergeDone,
  ShellGlyph,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { MergeFindPart } from './components/MergeFindPart';
import { MergePairPart } from './components/MergePairPart';
import { MergeUnavailablePart } from './components/MergeUnavailablePart';
import { MERGE_COLUMNS_FROM } from './constants';
import {
  type CustomerMergeMoves,
  useCustomerMergeMoves,
  useMergeEscape,
} from './hooks/use-customer-merge-moves';

import './customer-merge.css';

/**
 * Customer Merge on the web (`SCR-M02-06`): for an owner or a sales manager who found one family
 * twice. Find the other record, pick the one that stays and a value for each field the two disagree
 * on, then read what moves — and merge, from the one hero beside the compare. What is read, picked
 * and sent is `useCustomerMergeScreen`'s, the phone's too; the web's own parts are the router and
 * the page's Esc. Only a person holding `crm.merge_customers` reaches it.
 */
export function CustomerMergeScreen({
  survivorId,
  loserId,
}: {
  survivorId: string;
  loserId: string | null;
}) {
  const moves = useCustomerMergeMoves();
  const screen = useCustomerMergeScreen({ survivorId, loserId, onOpenLead: moves.openLead });
  if (!screen.allowed) notFound();
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
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const columns = width !== null && width >= MERGE_COLUMNS_FROM ? 'true' : undefined;
  useMergeEscape(screen.done === null, screen.isMerging, moves.cancel);
  if (screen.done !== null) {
    return (
      <div ref={room} className="hg-shell-page hg-customer-merge" data-columns={columns}>
        <div className="hg-customer-merge-done">
          <MergeDone
            words={customerMergeDoneWords(t, screen.done, format)}
            onOpenCustomer={screen.openCustomer}
            onBackToLeads={moves.toLeads}
          />
        </div>
      </div>
    );
  }
  return (
    <div ref={room} className="hg-shell-page hg-customer-merge" data-columns={columns}>
      <div className="hg-customer-merge-back">
        <Button
          variant="ghost"
          size="sm"
          icon={<ShellGlyph name="close" size="sm" />}
          spokenName={words.cancelSpoken}
          disabled={screen.merging}
          onClick={moves.cancel}
        >
          {words.cancel}
        </Button>
      </div>
      <LargeTitle title={words.title} summary={words.pageSummary} />
      <CustomerMergeBody screen={screen} moves={moves} />
    </div>
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
  if (screen.step === 'find') return <MergeFindPart find={screen.find} />;
  if (read.kind === 'unavailable') {
    return <MergeUnavailablePart unavailable={read.unavailable} onBack={moves.cancel} />;
  }
  if (read.kind === 'ready') return <MergePairPart screen={screen} view={read.value} />;
  return (
    <Card
      read={read.kind === 'failed' ? read : { kind: 'loading' }}
      loadingLabel={words.loading}
      errorTitle={words.readFailed}
      retryLabel={words.tryAgain}
    />
  );
}
