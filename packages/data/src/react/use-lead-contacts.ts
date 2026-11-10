'use client';
import type {
  AddContact,
  ContactRoleLabel,
  DedupeMatchWire,
  LeadDetail,
} from '@heliogrid/contracts';
import {
  type LeadActFailure,
  mapRead,
  type Read,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf, useLeadDetailCache } from './lead-detail-cache';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/** A contact's save: adding one (`contactId` null) or changing one. */
export interface LeadContactSave {
  readonly contactId: string | null;
  readonly contact: AddContact;
}

/**
 * The customer's contacts and calling facts on the lead (`M02-34`, `M02-37`): add and edit a
 * contact — a number someone else holds comes back with that record's facts, pointing to Merge —
 * name the one primary, add a role label of the company's own, and switch do-not-call or the
 * preferred language. A save that came back undone says so in the card or the sheet.
 */
export interface LeadContacts {
  /** The company's role labels — read once a contact sheet asks for them. */
  readonly labels: Read<readonly ContactRoleLabel[]>;
  readonly addingLabel: boolean;
  /** The label just added, so the role field picks it. */
  readonly addedLabelId: string | null;
  addLabel(text: string): void;
  readonly saving: boolean;
  readonly saveFailure: LeadActFailure | null;
  /** The record the typed number already belongs to; nothing was saved. */
  readonly phoneTaken: DedupeMatchWire | null;
  /** Answers true once the contact landed, so the sheet closes. */
  save(save: LeadContactSave): Promise<boolean>;
  /** Clears the last save's refusal and failure — a sheet opening afresh. */
  reset(): void;
  /** The row whose primary is being named; `undefined` when none is. */
  readonly primaryPending: string | null | undefined;
  setPrimary(contactId: string | null): void;
  /** Do-not-call as last asked for while its save is out, else as recorded. */
  readonly doNotCall: boolean;
  /** Flips from the value last asked for, never from what a switch hands back. */
  toggleDoNotCall(): void;
  /** The language as last asked for while its save is out, else as recorded — a newer one as sent. */
  readonly language: string | null;
  /** A language the set does not hold sends nothing. */
  setLanguage(language: string | null): void;
  readonly callingPending: boolean;
  /** A calling fact or a primary that came back undone. */
  readonly cardFailure: LeadActFailure | null;
}

export function useLeadContacts(
  leadId: string,
  lead: LeadDetail | null,
  labelsWanted: boolean,
): LeadContacts {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const cache = useLeadDetailCache(leadId);
  const [phoneTaken, setPhoneTaken] = useState<DedupeMatchWire | null>(null);
  const [addedLabelId, setAddedLabelId] = useState<string | null>(null);
  const askedDoNotCall = useRef<boolean | null>(null);
  const [askedLanguage, setAskedLanguage] = useState<{ value: UiLanguage | null } | null>(null);
  const pendingPrimary = useRef<string | null>(null);
  const customerId = lead?.customer.id ?? '';

  const labelsKey = queryKeys.crm.contactRoleLabels(tenantId);
  const labelsQuery = useQuery({
    queryKey: labelsKey,
    queryFn: ({ signal }) => repositories.contacts.roleLabels(signal),
    enabled: labelsWanted && tenantId !== '',
  });

  const contactSave = useAction(({ contactId, contact }: LeadContactSave) =>
    contactId === null
      ? repositories.contacts.add(customerId, contact)
      : repositories.contacts.edit(contactId, contact),
  );
  const labelAdd = useAction((text: string) => repositories.contacts.addRoleLabel(text), {
    onDone: (label) => {
      setAddedLabelId(label.id);
      void queryClient.invalidateQueries({ queryKey: labelsKey });
    },
  });
  const primary = useAction(
    (contactId: string | null) => repositories.contacts.setPrimary(customerId, { contactId }),
    {
      onFailed: () => cache.refresh(),
      onDone: (customer) => {
        queryClient.setQueryData<LeadDetail>(queryKeys.crm.lead(tenantId, leadId), (standing) =>
          standing === undefined ? standing : { ...standing, customer },
        );
        cache.refresh();
      },
    },
  );
  const calling = useAction(
    (edit: { doNotCall: boolean } | { preferredLanguage: UiLanguage | null }) =>
      repositories.leadEdits.edit(leadId, { ...edit, capturedAt: new Date().toISOString() }),
    {
      key: (edit) => ('doNotCall' in edit ? 'doNotCall' : 'preferredLanguage'),
      onDone: (answer, edit) =>
        cache.edited(answer, ['doNotCall' in edit ? 'doNotCall' : 'preferredLanguage']),
    },
  );
  const settle = () => {
    if (calling.isOut()) return;
    askedDoNotCall.current = null;
    setAskedLanguage(null);
  };

  const recordedDoNotCall = lead?.customer.doNotCall ?? false;
  const cardFailure = primary.failure ?? calling.failure;
  return {
    labels: mapRead(readOf(labelsQuery), (answer) => answer.items),
    addingLabel: labelAdd.pending,
    addedLabelId,
    addLabel: (text) => void labelAdd.run(text),
    saving: contactSave.pending,
    saveFailure: contactSave.failure === null ? null : leadActFailureOf(contactSave.failure),
    phoneTaken,
    save: async (save) => {
      setPhoneTaken(null);
      const answer = await contactSave.run(save);
      if (answer.kind !== 'done') return false;
      if (answer.output.kind === 'phone_taken') {
        setPhoneTaken(answer.output.match);
        return false;
      }
      cache.refresh();
      return true;
    },
    reset: () => {
      setPhoneTaken(null);
      setAddedLabelId(null);
      contactSave.clear();
    },
    primaryPending: primary.pending ? pendingPrimary.current : undefined,
    setPrimary: (contactId) => {
      if (primary.isOut()) return;
      pendingPrimary.current = contactId;
      void primary.run(contactId);
    },
    doNotCall: askedDoNotCall.current ?? recordedDoNotCall,
    toggleDoNotCall: () => {
      if (calling.isOut('doNotCall')) return;
      const next = !(askedDoNotCall.current ?? recordedDoNotCall);
      askedDoNotCall.current = next;
      void calling.run({ doNotCall: next }).then(settle);
    },
    language:
      askedLanguage === null ? (lead?.customer.preferredLanguage ?? null) : askedLanguage.value,
    setLanguage: (language) => {
      const known = UI_LANGUAGES.find((member) => member === language) ?? null;
      if ((language !== null && known === null) || calling.isOut('preferredLanguage')) return;
      setAskedLanguage({ value: known });
      void calling.run({ preferredLanguage: known }).then(settle);
    },
    callingPending: calling.pending,
    cardFailure: cardFailure === null ? null : leadActFailureOf(cardFailure),
  };
}
