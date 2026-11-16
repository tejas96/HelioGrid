'use client';
import type { CustomerPage, TranslatedText } from '@heliogrid/contracts';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import { customerProposalWords, customerSolarFileWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AfterHint,
  AfterRow,
  AfterRows,
  Button,
  type FocusAfter,
  ProposalPicture,
  ShellGlyph,
  Text,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import { documentGlyphOf } from '../constants';
import { usePageMoves } from '../hooks/use-page-moves';
import { AskOnlyFrame } from './AskOnlyFrame';
import { PageCard } from './CustomerFrame';
import { PersonCard } from './PersonCard';
import { QuestionsCard } from './ProposalAnswer';

/**
 * The customer's solar file (`SCR-F5-03`, `F5-70`…`F5-73`): the same address, for the life of the
 * system — its documents as the checklist completed them, none invented; a referral ask that names
 * a number and no money; and a named person still on it after the project closed.
 */
export function SolarFilePhase({
  screen,
  page,
  handover,
  focusAfter,
}: {
  screen: CustomerPageScreen;
  page: CustomerPage;
  handover: NonNullable<CustomerPage['handover']>;
  /** Where focus lands once a toast is closed: the page itself. */
  focusAfter: FocusAfter;
}) {
  const t = useTranslate();
  const format = useFormat();
  const toasts = useToasts();
  const moves = usePageMoves(screen.fileLink);
  const { company, person } = page;
  const words = customerSolarFileWords(t);
  const proposalWords = customerProposalWords(t, {
    companyName: company.name,
    customerName: null,
    customerSegment: null,
    personName: person?.name ?? null,
    personPhone: person === null ? null : format.phone(person.phoneE164),
  });
  const say = (title: TranslatedText, tone: 'success' | 'danger') => toasts.push({ tone, title });
  const personCard =
    person === null ? null : (
      <PersonCard
        name={person.name}
        phoneE164={person.phoneE164}
        role={proposalWords.person.contact}
        callLabel={proposalWords.person.call(person.name)}
      />
    );
  const referTo = handover.referTo;
  return (
    <AskOnlyFrame
      screen={screen}
      page={page}
      main={
        <>
          <ProposalPicture className="hg-cust-hero hg-cust-hero-short" name="evening" shade="cover">
            <div className="hg-cust-hero-words hg-cust-hero-words-short">
              {handover.switchedOnAt === null ? null : (
                <span>{words.switchedOn(format.date(handover.switchedOnAt))}</span>
              )}
              <h1>{words.title}</h1>
            </div>
          </ProposalPicture>
          <PageCard title={words.documents}>
            {handover.documents.length === 0 ? (
              <Text color="secondary">{words.none}</Text>
            ) : (
              <AfterRows>
                {handover.documents.map((file) => (
                  <AfterRow
                    key={file.fileId}
                    glyph={documentGlyphOf(file.row)}
                    hue="accent"
                    title={file.row === null ? file.name : format.word('row', file.row)}
                    aside={<ShellGlyph name="download" size="sm" />}
                    onOpen={() =>
                      void moves.openFile(file.fileId).then((opened) => {
                        if (!opened) say(words.notOpened, 'danger');
                      })
                    }
                  />
                ))}
              </AfterRows>
            )}
            <AfterHint glyph="info">{words.keep}</AfterHint>
          </PageCard>
          {referTo === null ? null : (
            <PageCard title={words.referTitle} glass>
              <Text color="secondary">{words.referLine}</Text>
              <div className="hg-cust-refer">
                <span className="hg-cust-mono">{format.phone(referTo)}</span>
                <Button
                  variant="secondary"
                  icon={<ShellGlyph name="clipboard" />}
                  onClick={() =>
                    moves.copy(
                      format.phone(referTo),
                      () => say(words.copied, 'success'),
                      () => say(words.notCopied, 'danger'),
                    )
                  }
                >
                  {words.copy}
                </Button>
              </div>
            </PageCard>
          )}
          <QuestionsCard questions={page.questions ?? []} words={proposalWords} />
          <div className="hg-cust-phone-only">{personCard}</div>
        </>
      }
      personCard={personCard}
      words={proposalWords}
      toasts={toasts}
      focusAfter={focusAfter}
    />
  );
}
