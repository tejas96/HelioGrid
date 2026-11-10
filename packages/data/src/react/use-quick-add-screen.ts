'use client';
import type { CreateLead, LogEnquiry } from '@heliogrid/contracts';
import {
  can,
  checkableNumberOf,
  type DealSegment,
  DOOR_SEGMENT,
  type FormatPack,
  NUMBER_CHECK_SETTLE_MS,
  type NumberCheck,
  numberCheckOf,
  type PhoneRefusal,
  phoneRefusalOf,
  type QuickAddDone,
  type QuickAddDraft,
  type QuickAddDuplicate,
  type QuickAddMatch,
  quickAddCaptureOf,
  quickAddDraftFor,
  quickAddDuplicateOf,
  subjectAddressOf,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
import { companyRead } from './shell-reads';
import { type QuickAddAct, useQuickAddSheetActs } from './use-quick-add-sheet-acts';
import { useSession } from './use-session';
import { useSettled } from './use-settled';
import { useTenantId } from './use-tenant-id';

export type { QuickAddAct } from './use-quick-add-sheet-acts';

export interface QuickAddOptions {
  /** The market's phone spec: the live check asks once the number is whole (`M02-07`). */
  readonly pack: FormatPack;
  /** The referring lead, when quick add opens from its *Add a referral* (`M02-16`); else `null`. */
  readonly referredBy: string | null;
  /** The capture closed with nothing created — ✕, Esc, the backdrop, Back: the route's way out. */
  readonly onClosed: () => void;
  /**
   * A lead to open — *Open existing* on a record the person may see (`M02-08`), or the saved
   * toast's *Open*: the route goes to its address, the one both apps read (`M01-61`).
   */
  readonly onOpenLead: (address: string) => void;
  /** A capture finished and its sheet closed: the screen says what it came to. */
  readonly onDone: (done: QuickAddDone) => void;
}

/** Who referred the lead, as its chip names them: their name, else their number (`M02-16`). */
export interface QuickAddReferrer {
  readonly name: string | null;
  readonly phoneE164: string;
}

/**
 * Quick add (`SCR-M02-01`) as both screens draw it, assembled once (Law 11): the four fields, the
 * live number check, Save and its answers, the referral, and the duplicate sheet over the capture.
 */
export interface QuickAddScreen {
  /** The reader may add a lead (`crm.add_edit_leads`); the door answers anyone else not found. */
  readonly allowed: boolean;
  /** The capture is open over the leads page. */
  readonly open: boolean;
  readonly draft: QuickAddDraft;
  setPhone(phoneE164: string): void;
  setName(name: string): void;
  setCity(city: string): void;
  setSegment(segment: DealSegment): void;
  /** The line under the phone (`M02-07`). */
  readonly check: NumberCheck;
  /** Why the pressed Save sent nothing, said at the phone; cleared as the number changes. */
  readonly phoneRefusal: PhoneRefusal | null;
  /** Grows each time focus belongs on the phone — a refused Save. */
  readonly phoneFocus: number;
  /** The referrer once read; `null` for a plain capture. */
  readonly referrer: QuickAddReferrer | null;
  /** A save is out: the fields are inert and a second press sends nothing. */
  readonly saving: boolean;
  /** Why the last save came back undone, the typing kept; `null` while none did. */
  readonly saveFailure: DataError | null;
  save(): void;
  dismissSaveFailure(): void;
  /**
   * ✕, Esc, the backdrop, Back: nothing is created. Does nothing while a save or an act is out, or
   * while the duplicate sheet stands over the capture.
   */
  close(): void;
  /** Opens a fresh capture over the page the last one closed on. */
  reopen(): void;
  /** Opens a lead the capture named — the saved toast's *Open*. */
  openLead(leadId: string): void;
  /** The duplicate a check or a save met; the sheet stands over the capture while it is set. */
  readonly duplicate: QuickAddDuplicate | null;
  /** The sheet's act that is out, or came back undone. */
  readonly act: QuickAddAct | null;
  openExisting(): void;
  logEnquiry(): void;
  keepBoth(reason: string): void;
  /** The sheet's close: nothing is created, and the capture is back with its typing (`M02-09`). */
  dismissDuplicate(): void;
}

export function useQuickAddScreen(options: QuickAddOptions): QuickAddScreen {
  const { pack, referredBy } = options;
  const repositories = useRepositories();
  const client = useQueryClient();
  const tenantId = useTenantId();
  const roles = useSession().user?.tenant?.roles ?? [];
  const reading = tenantId !== '';
  const latest = useRef(options);
  latest.current = options;

  const company = useQuery(companyRead(repositories, tenantId, reading));
  const declared = quickAddDraftFor(company.data?.segment ?? null);
  const [open, setOpen] = useState(true);
  const [typed, setTyped] = useState({ phoneE164: '', name: '', city: '' });
  /* `undefined` until the person chooses: the company's declared segment stands for it till then. */
  const [chosen, setChosen] = useState<DealSegment | undefined>(undefined);
  const draft: QuickAddDraft = { ...typed, segment: chosen ?? declared.segment };

  const checkable = checkableNumberOf(pack, typed.phoneE164);
  const settled = useSettled(checkable, NUMBER_CHECK_SETTLE_MS);
  const match = useQuery({
    queryKey: queryKeys.crm.match(tenantId, settled ?? ''),
    queryFn: ({ signal }): Promise<QuickAddMatch | null> =>
      repositories.leadCapture.match(settled ?? '', signal),
    enabled: reading && open && settled !== null,
  });
  const check = numberCheckOf(checkable, settled, readOf(match));

  const referral = useQuery({
    queryKey: queryKeys.crm.lead(tenantId, referredBy ?? ''),
    queryFn: ({ signal }) => repositories.leads.detail(referredBy ?? '', signal),
    enabled: reading && referredBy !== null,
  });
  const referrerOf = referral.data?.customer;

  const [phoneRefusal, setPhoneRefusal] = useState<PhoneRefusal | null>(null);
  const [phoneFocus, setPhoneFocus] = useState(0);
  const [saveMatch, setSaveMatch] = useState<QuickAddMatch | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  /* One capture keeps one capture time, so a retried save is the same request (its retry key). */
  const capturedAt = useRef<string | null>(null);
  const typedCapture = (): LogEnquiry | null => {
    const capture = quickAddCaptureOf(pack, draft);
    if (capture === null) return null;
    capturedAt.current ??= new Date().toISOString();
    return { ...capture, capturedAt: capturedAt.current };
  };

  const fresh = () => {
    setTyped({ phoneE164: '', name: '', city: '' });
    setChosen(undefined);
    setPhoneRefusal(null);
    setSaveMatch(null);
    setDismissedFor(null);
    capturedAt.current = null;
  };
  const finish = (done: QuickAddDone) => {
    setOpen(false);
    fresh();
    void client.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
    latest.current.onDone(done);
  };

  /** A create, the referral and *Keep both* riding along: a number already someone's opens the sheet. */
  const create = async (body: CreateLead) => {
    const outcome = await repositories.leadCapture.create(body);
    if (outcome.kind === 'duplicate') setSaveMatch(outcome.match);
    else finish({ kind: 'saved', leadId: outcome.lead.lead.id });
  };
  const referredByBody = async (): Promise<Pick<CreateLead, 'referredBy'>> => {
    if (referredBy === null) return {};
    const read = { queryKey: queryKeys.crm.lead(tenantId, referredBy) };
    const lead = await client.fetchQuery({
      ...read,
      queryFn: ({ signal }) => repositories.leads.detail(referredBy, signal),
    });
    return { referredBy: { customerId: lead.customer.id } };
  };
  const saving = useAction(async (capture: LogEnquiry) =>
    create({ ...capture, ...(await referredByBody()) }),
  );

  const known = check.kind === 'known' && dismissedFor !== checkable ? check.match : null;
  const sheetMatch = open ? (saveMatch ?? known) : null;
  const duplicate = sheetMatch === null ? null : quickAddDuplicateOf(sheetMatch, roles, Date.now());
  const sheet = useQuickAddSheetActs({
    duplicate,
    typedCapture,
    finish,
    create: async (capture, keepBoth) =>
      create({ ...capture, ...(await referredByBody()), keepBoth }),
    openLead: (leadId) => {
      setOpen(false);
      fresh();
      openLead(leadId);
    },
  });

  const openLead = (leadId: string) =>
    latest.current.onOpenLead(subjectAddressOf('lead', leadId) ?? DOOR_SEGMENT.leads);
  const busy = () => saving.isOut() || sheet.isOut();
  const setPhone = (phoneE164: string) => {
    setTyped((was) => ({ ...was, phoneE164 }));
    setPhoneRefusal(null);
    setSaveMatch(null);
  };

  return {
    allowed: can(roles, 'crm.add_edit_leads'),
    open,
    draft,
    setPhone,
    setName: (name) => setTyped((was) => ({ ...was, name })),
    setCity: (city) => setTyped((was) => ({ ...was, city })),
    setSegment: setChosen,
    check,
    phoneRefusal,
    phoneFocus,
    referrer:
      referrerOf === undefined
        ? null
        : {
            name: referrerOf.name ?? referral.data?.lead.name ?? null,
            phoneE164: referrerOf.phoneE164,
          },
    saving: saving.pending,
    saveFailure: saving.failure instanceof DataError ? saving.failure : null,
    save: () => {
      if (busy()) return;
      const capture = typedCapture();
      if (capture === null) {
        setPhoneRefusal(phoneRefusalOf(pack, typed.phoneE164));
        setPhoneFocus((count) => count + 1);
        return;
      }
      void saving.run(capture);
    },
    dismissSaveFailure: saving.clear,
    close: () => {
      /* The sheet stands over the capture: its own close answers first, and the capture waits. */
      if (busy() || duplicate !== null) return;
      setOpen(false);
      fresh();
      latest.current.onClosed();
    },
    openLead,
    reopen: () => {
      fresh();
      saving.clear();
      setOpen(true);
    },
    duplicate,
    act: sheet.act,
    openExisting: sheet.openExisting,
    logEnquiry: sheet.logEnquiry,
    keepBoth: sheet.keepBoth,
    dismissDuplicate: () => {
      if (sheet.isOut()) return;
      sheet.clear();
      setSaveMatch(null);
      setDismissedFor(checkable);
    },
  };
}
