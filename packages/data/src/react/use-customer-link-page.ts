'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import type { Read, TransportFailure } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import {
  LinkActNotTakenError,
  type LinkDeviceClass,
  type LinkSectionViewed,
} from '../customer-link/public-repository';
import { answerOf, DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { type MadeFileRead, useMadeFile } from './use-made-file';
import { useSession } from './use-session';

/** What the customer may do on their page. */
export type LinkActKind = 'accept' | 'negotiate' | 'decline' | 'question' | 'call';

export type LinkAct =
  | { readonly kind: 'accept'; readonly versionId: string }
  | { readonly kind: 'negotiate'; readonly versionId: string; readonly words: string }
  | { readonly kind: 'decline'; readonly versionId: string; readonly reason: string | null }
  | { readonly kind: 'question'; readonly text: string }
  /** `at` is the time the customer named; `null` asks for the next lawful moment (`F5-54`). */
  | { readonly kind: 'call'; readonly at: string | null };

/** Why an act on the page was not recorded; nothing partial was written (`F5-47`). */
export type LinkActFailure =
  /**
   * The server did not take it — the version already took its answer, a newer one is shared, the
   * deal is won or closed, the link is off or its hourly ceiling is met. The page was read again
   * and shows what stands.
   */
  | { readonly kind: 'not_taken'; readonly act: LinkActKind; readonly refusal: string }
  /** Too many visits across every link just now (`F5-78`). */
  | { readonly kind: 'busy'; readonly act: LinkActKind }
  | {
      readonly kind: 'failed';
      readonly act: LinkActKind;
      readonly failure: TransportFailure | null;
    };

/** The customer's page as read — never empty: a link answers its page, or it is not one. */
export type CustomerPageRead = Exclude<Read<CustomerPage>, { readonly kind: 'empty' }>;

export interface CustomerLinkPageOptions {
  /**
   * The kind of device the page drew on, once the page HAS drawn — `null` before. The open is sent
   * only after it is known, so a link preview that never renders never counts (`T-F5-007`).
   */
  readonly deviceClass: LinkDeviceClass | null;
  /** The page a server render already read, so the first paint needs no second read. */
  readonly initial?: CustomerPage;
}

/**
 * The customer's one page (`SCR-F5-01`…`04`, `F5-19`): signed-out, the link's token its whole
 * authority. One read answers the proposal, the progress, the solar file or why the link cannot
 * serve; every act answers the page as it now stands. An open is the product's own evidence
 * (`F5-27`): it is sent once, after the page drew for a person, and never while a company session
 * is on this device — a rep opening their own link is not the customer.
 */
export interface CustomerLinkPage {
  readonly read: CustomerPageRead;
  /**
   * Why a read that failed did: `gone` — no link has this address, so there is no company and no
   * person to name and no retry to offer; `busy` — the ceiling across all links (`F5-78`), try
   * again shortly. `null` for any other failure, and whenever the page is there.
   */
  readonly unserved: 'gone' | 'busy' | null;
  act(act: LinkAct): void;
  /** The act that is out; every other answer control waits for it. */
  readonly acting: LinkActKind | null;
  /** The act that landed last — the page already shows it; this names it for the moment after. */
  readonly done: LinkActKind | null;
  readonly failure: LinkActFailure | null;
  clear(): void;
  /** How long a section was on screen; never sent for a company's own person. */
  viewed(viewed: LinkSectionViewed): void;
  /** The PDF of the version the page shows: nothing is read until its `ask`. */
  readonly pdf: MadeFileRead;
  /** A short-lived link to a file the page lists — a receipt, a handover document. */
  fileLink(fileId: string): Promise<string | null>;
}

const NOT_FOUND = 'NOT_FOUND';
const RATE_LIMITED = 'RATE_LIMITED';
/** A token the api could not read as one is the same dead address as one nobody minted. */
const GONE_CODES: ReadonlySet<string> = new Set([NOT_FOUND, 'VALIDATION_FAILED']);

export function useCustomerLinkPage(
  token: string,
  { deviceClass, initial }: CustomerLinkPageOptions,
): CustomerLinkPage {
  const { customerLinkPublic } = useRepositories();
  const queryClient = useQueryClient();
  const { status } = useSession();
  const [done, setDone] = useState<LinkActKind | null>(null);
  const [failure, setFailure] = useState<LinkActFailure | null>(null);
  const key = queryKeys.customerLink.page(token);
  const page = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => customerLinkPublic.page(token, signal),
    initialData: initial,
  });

  /* The open: once per mount, after the page drew, for a visitor with no company session. */
  const opened = useRef(false);
  const serves = page.data !== undefined && page.data.kind !== 'off';
  const visitor = status === 'anonymous';
  useEffect(() => {
    if (opened.current || !serves || !visitor || deviceClass === null) return;
    opened.current = true;
    // Evidence, not a step of the page: a beacon that fails changes nothing the customer sees.
    void customerLinkPublic.opened(token, deviceClass).catch(() => undefined);
  }, [serves, visitor, deviceClass, customerLinkPublic, token]);

  const send = useAction(
    (act: LinkAct) => {
      switch (act.kind) {
        case 'accept':
          return customerLinkPublic.accept(token, act.versionId);
        case 'negotiate':
          return customerLinkPublic.negotiate(token, act.versionId, act.words);
        case 'decline':
          return customerLinkPublic.decline(token, act.versionId, act.reason);
        case 'question':
          return customerLinkPublic.question(token, act.text);
        case 'call':
          return customerLinkPublic.callRequest(token, act.at);
      }
    },
    {
      onDone: (answered, act) => {
        queryClient.setQueryData(key, answered);
        setDone(act.kind);
      },
      onFailed: (error, act) => {
        setFailure(linkActFailureOf(error, act.kind));
        // After a refusal the page shows the earlier answer or the newer version (`F5-47`).
        if (error instanceof LinkActNotTakenError)
          void queryClient.invalidateQueries({ queryKey: key });
      },
    },
  );
  const out = useRef<LinkActKind | null>(null);

  const shown = page.data?.kind === 'off' ? null : (page.data?.proposal?.versionId ?? null);
  const pdf = useMadeFile(
    queryKeys.customerLink.pdf(token, shown),
    (signal) => customerLinkPublic.pdf(token, signal),
    serves,
  );

  return {
    read: recordReadOf(page),
    unserved: page.data === undefined ? unservedOf(page.error) : null,
    act: (act) => {
      if (send.isOut()) return;
      out.current = act.kind;
      setFailure(null);
      setDone(null);
      void send.run(act);
    },
    acting: send.pending ? out.current : null,
    done,
    failure,
    clear: () => {
      setFailure(null);
      setDone(null);
      send.clear();
    },
    viewed: (viewed) => {
      if (!visitor || !serves) return;
      void customerLinkPublic.sectionViewed(token, viewed).catch(() => undefined);
    },
    pdf,
    fileLink: (fileId) =>
      customerLinkPublic.file(token, fileId).then(
        (download) => download.url,
        () => null,
      ),
  };
}

function unservedOf(error: unknown): 'gone' | 'busy' | null {
  const code = answerOf(error)?.code;
  if (code === undefined) return null;
  if (GONE_CODES.has(code)) return 'gone';
  return code === RATE_LIMITED ? 'busy' : null;
}

function linkActFailureOf(error: unknown, act: LinkActKind): LinkActFailure {
  if (error instanceof LinkActNotTakenError) {
    return { kind: 'not_taken', act, refusal: error.refusal };
  }
  if (answerOf(error)?.code === RATE_LIMITED) return { kind: 'busy', act };
  return { kind: 'failed', act, failure: error instanceof DataError ? error.failure : null };
}
