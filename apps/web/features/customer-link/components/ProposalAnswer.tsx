'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import type { CustomerProposalWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { AfterHint, LottieMoment, StatusChip, useFormat } from '@heliogrid/ui';
import type { Ref } from 'react';
import { PageCard, PageNote } from './CustomerFrame';

type Proposal = NonNullable<CustomerPage['proposal']>;

/**
 * What the customer answered, on the page at once (`F5-48`): an Accept says when, what was accepted
 * and the three next steps, and that nothing is paid now; a Decline says so and names the person; a
 * change request shows its words and that a new version will appear at this same address.
 */
export function AnswerNote({
  proposal,
  payable,
  words,
  noteRef,
}: {
  proposal: Proposal;
  /** The version's payable as the page prints it. */
  payable: string;
  words: CustomerProposalWords;
  /** The note's focus handle: where focus lands once the answer's sheet has gone. */
  noteRef: Ref<HTMLElement>;
}) {
  const format = useFormat();
  const { answer, advance, document } = proposal;
  if (answer === null) return null;
  const when = words.when(format.date(answer.at), format.clockAt(answer.at));
  if (answer.kind === 'accept') {
    return (
      <PageNote
        tone="success"
        title={words.answer.acceptedTitle}
        noteRef={noteRef}
        moment={<LottieMoment name="celebrate" size={theme.spacing['sp-24']} />}
      >
        <p>{words.answer.acceptedMeta(when, document.version ?? 1, payable)}</p>
        <ol className="hg-cust-steps">
          {words.answer.steps(advance === null ? null : format.moneyPlain(advance)).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </PageNote>
    );
  }
  if (answer.kind === 'decline') {
    return (
      <PageNote tone="neutral" title={words.answer.declinedTitle} noteRef={noteRef}>
        <p>{words.answer.declinedLine(when)}</p>
      </PageNote>
    );
  }
  return (
    <PageNote tone="info" title={words.answer.changeTitle} noteRef={noteRef}>
      {answer.words === null ? null : (
        <p className="hg-cust-said">{words.answer.changeWords(answer.words)}</p>
      )}
      <p>{words.answer.changeLine}</p>
    </PageNote>
  );
}

/** The call the customer asked for, and when it will come (`F5-54`). */
export function CallNote({
  proposal,
  words,
}: {
  proposal: Proposal;
  words: CustomerProposalWords;
}) {
  const format = useFormat();
  const call = proposal.callRequest;
  if (call === null) return null;
  const when = words.when(format.date(call.dueAt), format.clockAt(call.dueAt));
  return (
    <PageNote tone="info" title={words.answer.callTitle}>
      <p>{words.answer.callLine(when)}</p>
    </PageNote>
  );
}

/**
 * Every question this link received (`F5-52`, `F5-53`), in every phase: acknowledged, never
 * answered here — the reply is a call, and the page promises no time for it.
 */
export function QuestionsCard({
  questions,
  words,
}: {
  questions: NonNullable<CustomerPage['questions']>;
  words: CustomerProposalWords;
}) {
  if (questions.length === 0) return null;
  return (
    <PageCard title={words.cards.questions}>
      <ul className="hg-cust-asked">
        {questions.map((question) => (
          <li key={question.id}>
            <span>{words.question.asked(question.text)}</span>
            <StatusChip
              tone={question.state === 'received' ? 'success' : 'neutral'}
              label={question.state === 'received' ? words.question.received : words.question.sent}
              density="functional"
            />
          </li>
        ))}
      </ul>
      <AfterHint glyph="info-circle">{words.question.willCall}</AfterHint>
    </PageCard>
  );
}
