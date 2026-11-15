'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import {
  type CustomerPageScreen as ScreenModel,
  useCustomerPageScreen,
} from '@heliogrid/data/react';
import { customerProposalWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FailedRead, type FocusHandle, LoadingBars, useFormat } from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useRef } from 'react';
import { CustomerFrame } from './components/CustomerFrame';
import { CustomerReader } from './components/CustomerReader';
import { LinkBusyPage, LinkOffPage } from './components/LinkOffPage';
import { ProgressPhase } from './components/ProgressPhase';
import { ProposalPhase } from './components/ProposalPhase';
import { SolarFilePhase } from './components/SolarFilePhase';
import { useDeviceClass } from './hooks/use-device-class';
import { useOpenedPdf } from './hooks/use-opened-pdf';
import { useSectionViews } from './hooks/use-section-views';
import './customer-link.css';
import './customer-cards.css';
import './customer-phases.css';

/**
 * The customer's one page (`F5-19`): the proposal, then the progress, then the solar file, at one
 * address, with no login (`F5-01`) — or the honest page of a link that cannot serve (`F5-25`). The
 * page a server render already read is drawn at once; what it reads, sends and holds is
 * `useCustomerPageScreen`'s, and this composes it in the reader's own language (`F5-08`).
 */
export function CustomerPageScreen({
  token,
  initial,
}: {
  token: string;
  /** The page the server read for the first paint; `null` where it could not. */
  initial: CustomerPage | null;
}) {
  const format = useFormat();
  const deviceClass = useDeviceClass();
  const screen = useCustomerPageScreen(token, {
    deviceClass,
    formats: format.pack,
    ...(initial === null ? {} : { initial }),
  });
  /* No link has this address: there is no company and no person to name (`T-F5-004`). */
  if (screen.unserved === 'gone') notFound();
  return (
    <CustomerReader language={screen.language}>
      <CustomerPageBody screen={screen} />
    </CustomerReader>
  );
}

function CustomerPageBody({ screen }: { screen: ScreenModel }) {
  const pageRef = useSectionViews(screen.viewed);
  const top = useRef<FocusHandle>(null);
  const openPdf = useOpenedPdf(screen.pdf);
  const { read } = screen;
  if (read.kind === 'loading') return <PageWaiting />;
  if (read.kind === 'failed') {
    return screen.unserved === 'busy' ? (
      <LinkBusyPage onRetry={read.retry} />
    ) : (
      <PageFailed onRetry={read.retry} focusAfter={top} />
    );
  }
  const page = read.value;
  const reload = () => window.location.reload();
  if (page.kind === 'off') return <LinkOffPage page={page} onRetry={reload} />;
  if (page.kind === 'proposal' && page.proposal !== undefined && screen.snapshot !== null) {
    return (
      <ProposalPhase
        screen={screen}
        page={page}
        proposal={page.proposal}
        pageRef={pageRef}
        onPdf={openPdf}
      />
    );
  }
  if (page.kind === 'progress' && page.progress !== undefined) {
    return <ProgressPhase screen={screen} page={page} progress={page.progress} focusAfter={top} />;
  }
  if (page.kind === 'handover' && page.handover !== undefined) {
    return <SolarFilePhase screen={screen} page={page} handover={page.handover} focusAfter={top} />;
  }
  /* A page a newer server has learned: said as not loaded, with its retry, never drawn half. */
  return <PageFailed onRetry={reload} focusAfter={top} />;
}

function PageWaiting() {
  const words = customerProposalWords(useTranslate(), NOBODY);
  return (
    <CustomerFrame
      company={null}
      main={<LoadingBars label={words.read.loading} bars={['panel', 'row', 'row', 'row']} />}
    />
  );
}

function PageFailed({
  onRetry,
  focusAfter,
}: {
  onRetry: () => void;
  focusAfter: React.RefObject<FocusHandle | null>;
}) {
  const words = customerProposalWords(useTranslate(), NOBODY);
  return (
    <CustomerFrame
      company={null}
      centred
      main={
        <FailedRead
          title={words.read.failedTitle}
          message={words.read.failedLine}
          retryLabel={words.read.retry}
          onRetry={onRetry}
          focusAfter={focusAfter}
        />
      }
    />
  );
}

/** Before the page has answered it knows no company and no person: its words name none. */
const NOBODY = {
  companyName: '',
  customerName: null,
  customerSegment: null,
  personName: null,
  personPhone: null,
};
