'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import { STATED_FIGURE_TIER } from '@heliogrid/domain';
import {
  type CustomerProgressWords,
  customerProgressWords,
  customerProposalWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  AfterHint,
  type FocusAfter,
  HueTile,
  ProvenanceTier,
  ShellGlyph,
  Text,
  Timeline,
  type TimelineItem,
  type TimelineStatus,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import { AskOnlyFrame } from './AskOnlyFrame';
import { PageCard, PageNote } from './CustomerFrame';
import { PersonCard } from './PersonCard';
import { ProgressPayments } from './ProgressPayments';
import { QuestionsCard } from './ProposalAnswer';

type Progress = NonNullable<CustomerPage['progress']>;

/**
 * The customer's page after the deal is won (`SCR-F5-02`, `F5-61`): where the work stands, who is
 * waited on and since when, the installation day, and the money — its receipts as the company
 * recorded them and how to pay the part now due. No percentage, no invented date (`F5-66`), and
 * nothing here is held back over money (`F5-60`).
 */
export function ProgressPhase({
  screen,
  page,
  progress,
  focusAfter,
}: {
  screen: CustomerPageScreen;
  page: CustomerPage;
  progress: Progress;
  /** Where focus lands once a toast is closed: the page itself. */
  focusAfter: FocusAfter;
}) {
  const t = useTranslate();
  const format = useFormat();
  const toasts = useToasts();
  const { company, person } = page;
  const facts = { companyName: company.name, personName: person?.name ?? null };
  const words = customerProgressWords(t, facts);
  const proposalWords = customerProposalWords(t, {
    ...facts,
    customerName: null,
    customerSegment: null,
    personPhone: person === null ? null : format.phone(person.phoneE164),
  });
  const personCard =
    person === null ? null : (
      <PersonCard
        name={person.name}
        phoneE164={person.phoneE164}
        role={proposalWords.person.manager}
        callLabel={proposalWords.person.call(person.name)}
      />
    );
  const cancelled = progress.cancelledOn;
  return (
    <AskOnlyFrame
      screen={screen}
      page={page}
      main={
        <>
          {cancelled === null ? (
            <>
              <StagesCard progress={progress} words={words} />
              <InstallationCard progress={progress} words={words} />
            </>
          ) : (
            <PageNote tone="neutral" title={words.cancelled.title(format.date(cancelled))}>
              <Text color="secondary">{words.cancelled.line}</Text>
            </PageNote>
          )}
          <ProgressPayments
            payments={progress.payments}
            receiptsOnly={cancelled !== null}
            screen={screen}
            words={words}
            onNotOpened={() => toasts.push({ tone: 'danger', title: words.payments.notOpened })}
          />
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

/** The stages as one list (`F5-62`): done, the one waited on with its start and usual length, ahead. */
function StagesCard({ progress, words }: { progress: Progress; words: CustomerProgressWords }) {
  const format = useFormat();
  const { stages, wait } = progress;
  const at = stages.findIndex((stage) => stage.state !== 'done');
  const size = progress.capacityKw === null ? null : format.number(progress.capacityKw);
  const items = stages.map((stage, index) =>
    stageItem(stage, index === at || stage.state === 'waiting' ? wait : null, words, format),
  );
  return (
    <PageCard glass>
      <div className="hg-cust-over-row">
        <Text variant="overline" color="secondary" as="span">
          {words.over(size)}
        </Text>
        {/* The size the rep typed, carried onto the customer's page, states its tier (`F8-01`). */}
        {size === null ? null : <ProvenanceTier tier={STATED_FIGURE_TIER} />}
      </div>
      <Text variant="h1">{headlineOf(progress, at, words, format.word)}</Text>
      <Timeline items={items} />
    </PageCard>
  );
}

/** What the page says first (`F5-65`): the step, and who is waited on — never a percentage. */
function headlineOf(
  progress: Progress,
  at: number,
  words: CustomerProgressWords,
  word: (kind: 'party', key: string) => string,
) {
  const { stages, wait } = progress;
  const now = stages[at];
  if (now === undefined) return words.headline.allDone;
  return wait === null
    ? words.headline.now(at + 1, stages.length, now.label)
    : words.headline.waiting(at + 1, stages.length, word('party', wait.party));
}

/**
 * One stage on the rail: done, the current one (a clock in its node while it waits on someone), or
 * ahead. A wait says who, why and since when (`F5-63`), then its usual length or that none is known.
 */
function stageItem(
  stage: Progress['stages'][number],
  wait: Progress['wait'],
  words: CustomerProgressWords,
  format: ReturnType<typeof useFormat>,
): TimelineItem {
  const waiting = stage.state !== 'done' && wait !== null;
  const base = {
    id: stage.stage,
    label: stage.label,
    status: waiting ? 'current' : railStatusOf(stage.state),
  };
  if (waiting) {
    return {
      ...base,
      icon: <ShellGlyph name="clock" size="sm" tone="current" />,
      description: words.stage.waitingSince(
        format.word('party', wait.party),
        format.date(wait.since),
        format.word('reason', wait.reason),
      ),
      content: (
        <Text variant="body-sm" color="secondary">
          {wait.typicalDays === null
            ? words.stage.endNotKnown
            : words.stage.usually(wait.typicalDays)}
        </Text>
      ),
    };
  }
  if (stage.on !== null) return { ...base, description: format.date(stage.on) };
  if (stage.state === 'current') return { ...base, description: words.stage.inProgress };
  return base;
}

/** A stage's place on the rail: done, ahead, and every other state the one at work now. */
function railStatusOf(state: Progress['stages'][number]['state']): TimelineStatus {
  if (state === 'done') return 'done';
  return state === 'ahead' ? 'upcoming' : 'current';
}

/** The installation day's four facts (`F5-68`): each as told, and "not yet known" where none was. */
function InstallationCard({
  progress,
  words,
}: {
  progress: Progress;
  words: CustomerProgressWords;
}) {
  const format = useFormat();
  const day = progress.installation;
  if (day.on === null) {
    return (
      <PageCard title={words.day.title}>
        <Text color="secondary">{words.day.notScheduled}</Text>
      </PageCard>
    );
  }
  const time = day.startTime === null ? null : format.time(day.startTime);
  const facts = [
    {
      glyph: 'calendar-check',
      label: words.day.when,
      value: words.day.whenValue(format.date(day.on), time),
    },
    { glyph: 'people', label: words.day.who, value: day.crewLead?.name ?? words.day.notKnown },
    {
      glyph: 'clock',
      label: words.day.howLong,
      value: day.durationDays === null ? words.day.notKnown : words.day.days(day.durationDays),
    },
    {
      glyph: 'bell',
      label: words.day.expect,
      value: day.disturbance === null ? words.day.notKnown : words.day.expectValue(day.disturbance),
    },
  ] as const;
  return (
    <PageCard title={words.day.title}>
      <dl className="hg-cust-four">
        {facts.map((fact) => (
          <div key={fact.glyph}>
            <HueTile glyph={fact.glyph} hue="accent" size={theme.spacing['sp-10']} />
            <span>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </span>
          </div>
        ))}
      </dl>
      {day.crewLead === null ? null : (
        <AfterHint glyph="phone">
          {words.day.crewLead(day.crewLead.name, format.phone(day.crewLead.phoneE164))}
        </AfterHint>
      )}
    </PageCard>
  );
}
