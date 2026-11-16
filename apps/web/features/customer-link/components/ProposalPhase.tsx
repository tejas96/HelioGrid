'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import {
  type CustomerPageScreen,
  type ProposalPageFactsRead,
  useProposalReaderDocument,
} from '@heliogrid/data/react';
import {
  customerProposalWords,
  customerSheetWords,
  proposalDocumentReadWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AfterSummary,
  Button,
  Card,
  Provenance,
  ProvenanceTier,
  ShellGlyph,
  Text,
  useFormat,
} from '@heliogrid/ui';
import { type Ref, useRef } from 'react';
import { AnswerActs, type Answering } from './AnswerActs';
import { AnswerSheets } from './AnswerSheets';
import { CustomerFrame } from './CustomerFrame';
import { PersonCard } from './PersonCard';
import { AnswerNote, CallNote, QuestionsCard } from './ProposalAnswer';
import { ProposalCards, ProposalHero } from './ProposalSections';

/**
 * The customer's page while it is a proposal (`SCR-F5-01`, `F5-32`): read in one sitting on a
 * phone, the price before any heavy picture has come (`F5-07`), every figure with its tier and its
 * disclosure, Accept and a question one tap away, and a named person on it throughout (`F5-55`).
 */
export function ProposalPhase({
  screen,
  page,
  proposal,
  pageRef,
  onPdf,
}: {
  screen: CustomerPageScreen;
  page: CustomerPage;
  proposal: NonNullable<CustomerPage['proposal']>;
  pageRef: Ref<HTMLDivElement>;
  onPdf: () => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { company, person } = page;
  const { document } = proposal;
  const { taxName } = screen.market;
  const note = useRef<HTMLDivElement>(null);
  const pages = useProposalReaderDocument({ document }, format, taxName, (input) =>
    proposalDocumentReadWords(t, { ...input, format }),
  );
  /* A version always holds its price; a page without one is not drawn half (`CustomerPageBody`). */
  if (pages === null) return null;
  const { snapshot, facts } = pages;
  const blocks = pages.words.blocks;
  const version = document.version ?? 1;
  const words = customerProposalWords(t, {
    companyName: company.name,
    customerName: snapshot.deal.clientName ?? null,
    customerSegment: snapshot.deal.segment,
    personName: person?.name ?? null,
    personPhone: person === null ? null : format.phone(person.phoneE164),
  });
  const { money, fields } = snapshot;
  const payable = format.moneyPlain(money.figures.payable.value);
  const answering: Answering = {
    mayRespond: proposal.mayRespond && proposal.answer === null,
    mayAsk: page.mayAsk,
  };
  const size = fields.system.capacityKw === null ? null : format.number(fields.system.capacityKw);
  const taxed = money.taxes.length > 0;
  const sheets = customerSheetWords(t, person?.name ?? null);
  const personCard =
    person === null ? null : (
      <PersonCard
        name={person.name}
        phoneE164={person.phoneE164}
        role={words.person.contact}
        callLabel={words.person.call(person.name)}
      />
    );
  const firstPayment =
    proposal.advance === null
      ? []
      : [{ label: sheets.accept.first, value: format.moneyPlain(proposal.advance), mono: true }];

  return (
    <CustomerFrame
      company={company}
      pageRef={pageRef}
      main={
        <>
          <ProposalHero
            snapshot={snapshot}
            coverSrc={document.company.coverPhotoUrl}
            taxName={taxName}
            words={words}
          />
          <AnswerNote proposal={proposal} payable={payable} words={words} noteRef={note} />
          <CallNote proposal={proposal} words={words} />
          <ProposalCards
            snapshot={snapshot}
            categories={screen.categories}
            logoSrc={document.company.logoUrl}
            blocks={blocks}
            generationTier={facts.generationTier}
            words={words}
          />
          <QuestionsCard questions={page.questions ?? []} words={words} />
          <div className="hg-cust-phone-only">{personCard}</div>
          <footer className="hg-cust-foot">
            <span>{words.foot.version(document.number, version, snapshot.validityDays)}</span>
            <Button
              variant="ghost"
              size="sm"
              loading={screen.pdf.file.kind === 'making'}
              icon={<ShellGlyph name="download" size="sm" />}
              onClick={onPdf}
            >
              {words.foot.pdf}
            </Button>
          </footer>
          <PdfLine screen={screen} late={words.foot.pdfLate} failed={words.foot.pdfFailed} />
        </>
      }
      side={
        <>
          <SideCard
            screen={screen}
            snapshot={snapshot}
            generationTier={facts.generationTier}
            answering={answering}
            words={words}
          />
          {personCard}
        </>
      }
      bar={
        answering.mayRespond || answering.mayAsk ? (
          <AnswerActs screen={screen} answering={answering} wide={false} words={words} />
        ) : undefined
      }
      after={
        <AnswerSheets
          screen={screen}
          company={company}
          personName={person?.name ?? null}
          answering={answering}
          focusAfter={note}
          accept={
            <AfterSummary
              rows={[
                { label: sheets.accept.system, value: sheets.accept.systemValue(size, version) },
                { label: sheets.accept.price(taxed ? taxName : null), value: payable, mono: true },
                ...firstPayment,
              ]}
            />
          }
        />
      }
    />
  );
}

/** The desktop's card beside the content (`F5-43`): the price, what it nets to, and both acts. */
function SideCard({
  screen,
  snapshot,
  generationTier,
  answering,
  words,
}: {
  screen: CustomerPageScreen;
  snapshot: NonNullable<CustomerPageScreen['snapshot']>;
  generationTier: ProposalPageFactsRead['generationTier'];
  answering: Answering;
  words: ReturnType<typeof customerProposalWords>;
}) {
  const format = useFormat();
  const { money, savings, generation } = snapshot;
  const years = savings?.paybackYears ?? null;
  const incentive = money.figures.incentive;
  return (
    <Card as="section" surface="raised" className="hg-cust-sidecard">
      <div className="hg-cust-over-row">
        <Text variant="overline" color="secondary" as="span">
          {words.side.over}
        </Text>
        <ProvenanceTier tier={money.figures.payable.tier} />
      </div>
      <Text variant="display" as="p" className="hg-cust-price">
        {format.moneyPlain(money.figures.payable.value)}
      </Text>
      {incentive === null ? null : (
        <Text color="secondary">
          {words.side.afterSubsidy(
            format.moneyPlain(incentive.value),
            format.moneyPlain(money.figures.netCost.value),
          )}{' '}
          <ProvenanceTier tier={incentive.tier} />
          {money.figures.netCost.tier === incentive.tier ? null : (
            <ProvenanceTier tier={money.figures.netCost.tier} />
          )}
        </Text>
      )}
      {generation === null ? null : (
        <span className="hg-cust-facts">
          {words.side.facts(
            format.number(Math.round(generation.yearlyKwh)),
            years === null
              ? null
              : format.number(years, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          )}
          <Provenance tier={generationTier} energySource={generation.source} />
        </span>
      )}
      <div className="hg-cust-acts">
        <AnswerActs screen={screen} answering={answering} wide words={words} />
      </div>
    </Card>
  );
}

/** What became of the PDF the customer asked for, said beside its button. */
function PdfLine({
  screen,
  late,
  failed,
}: {
  screen: CustomerPageScreen;
  late: string;
  failed: string;
}) {
  const { kind } = screen.pdf.file;
  if (kind !== 'late' && kind !== 'unread') return null;
  return (
    <div role="status">
      <Text variant="body-sm" color="danger">
        {kind === 'late' ? late : failed}
      </Text>
    </div>
  );
}
