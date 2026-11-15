'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import { customerBusyWords, customerOffWords, customerProposalWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyScene, ShellGlyph, useFormat } from '@heliogrid/ui';
import { CustomerFrame } from './CustomerFrame';
import { PersonCard } from './PersonCard';

/**
 * The page of a link that cannot serve (`SCR-F5-04`, `F5-25`): what happened, what to do, and a
 * person with a number — never a blank page, and nothing about the proposal or the customer.
 */
export function LinkOffPage({ page, onRetry }: { page: CustomerPage; onRetry: () => void }) {
  const t = useTranslate();
  const format = useFormat();
  const { company, person } = page;
  const reason = page.off?.reason ?? 'ended';
  const facts = { companyName: company.name, personName: person?.name ?? null };
  const words = customerOffWords(t, facts, reason);
  const contact = customerProposalWords(t, {
    ...facts,
    customerName: null,
    customerSegment: null,
    personPhone: person === null ? null : format.phone(person.phoneE164),
  }).person;
  return (
    <CustomerFrame
      company={company}
      centred
      main={
        <div className="hg-cust-off">
          <EmptyScene name={reason === 'busy' ? 'filter' : 'search'} />
          <h1>{words.title}</h1>
          <p>{words.line}</p>
          {words.retry === null ? null : (
            <Button variant="secondary" icon={<ShellGlyph name="retry" />} onClick={onRetry}>
              {words.retry}
            </Button>
          )}
          {person === null ? null : (
            <PersonCard
              name={person.name}
              phoneE164={person.phoneE164}
              role={contact.contact}
              callLabel={contact.call(person.name)}
            />
          )}
        </div>
      }
    />
  );
}

/** Too many visits across every link (`F5-78`): the page never learned whose address this is. */
export function LinkBusyPage({ onRetry }: { onRetry: () => void }) {
  const words = customerBusyWords(useTranslate());
  return (
    <CustomerFrame
      company={null}
      centred
      main={
        <div className="hg-cust-off">
          <EmptyScene name="filter" />
          <h1>{words.title}</h1>
          <p>{words.line}</p>
          <Button variant="secondary" icon={<ShellGlyph name="retry" />} onClick={onRetry}>
            {words.retry}
          </Button>
        </div>
      }
    />
  );
}
