'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import { type CustomerProposalWords, toastHostWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type FocusAfter, ToastHost, type useToasts } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { AnswerActs, type Answering } from './AnswerActs';
import { AnswerSheets } from './AnswerSheets';
import { CustomerFrame } from './CustomerFrame';

/**
 * The frame of a page that takes questions and no answer — the progress page and the solar file:
 * the person and the ask beside the content on the desktop, the ask in the phone's bar, and the
 * sheets and the toasts the page raises.
 */
export function AskOnlyFrame({
  screen,
  page,
  main,
  personCard,
  words,
  toasts,
  focusAfter,
}: {
  screen: CustomerPageScreen;
  page: CustomerPage;
  main: ReactNode;
  personCard: ReactNode;
  words: CustomerProposalWords;
  toasts: ReturnType<typeof useToasts>;
  /** Where focus lands once a sheet's act or a toast has gone: the page itself. */
  focusAfter: FocusAfter;
}) {
  const t = useTranslate();
  const { company, person } = page;
  const answering: Answering = { mayRespond: false, mayAsk: page.mayAsk };
  return (
    <CustomerFrame
      company={company}
      main={main}
      side={
        <>
          {personCard}
          <AnswerActs screen={screen} answering={answering} wide words={words} />
        </>
      }
      bar={
        page.mayAsk ? (
          <AnswerActs screen={screen} answering={answering} wide={false} words={words} />
        ) : undefined
      }
      after={
        <>
          <AnswerSheets
            screen={screen}
            company={company}
            personName={person?.name ?? null}
            answering={answering}
            focusAfter={focusAfter}
          />
          <ToastHost
            toasts={toasts.toasts}
            onDismiss={toasts.dismiss}
            {...toastHostWords(t)}
            focusAfter={focusAfter}
          />
        </>
      }
    />
  );
}
