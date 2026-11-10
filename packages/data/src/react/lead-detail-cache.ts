'use client';
import { type LeadDetail, type LeadField, taskErrorCodeSchema } from '@heliogrid/contracts';
import {
  type LeadActFailure,
  QUALIFY_CHOICES,
  type QualifyChoiceQuestion,
} from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { LeadActRefusedError } from '../crm/lifecycle-repository';
import { ApiError, DataError } from '../errors/errors';
import { useTenantId } from './use-tenant-id';

/** Why an act on the lead came back undone, from what the client threw. */
export function leadActFailureOf(error: unknown): LeadActFailure {
  if (error instanceof LeadActRefusedError) return { kind: 'refused', refusal: error.refusal };
  if (error instanceof ApiError && error.code === taskErrorCodeSchema.enum.NUMBER_NOT_DIALLABLE) {
    return { kind: 'not_diallable' };
  }
  return {
    kind: 'failed',
    failure: error instanceof DataError ? error.failure : 'unreadable_answer',
    code: error instanceof ApiError ? error.code : undefined,
    message: error instanceof Error ? error.message : '',
  };
}

/**
 * The fields one edit answers for, copied from its answer onto the lead as it stands: two answers
 * saved at once land in either order, and neither may put the other back to what it was.
 */
export function patchEdited(
  standing: LeadDetail,
  answer: LeadDetail,
  fields: readonly LeadField[],
): LeadDetail {
  let lead = standing.lead;
  let customer = standing.customer;
  let qualify = standing.qualify;
  let canDial = standing.canDial;
  for (const field of fields) {
    if (field === 'monthlyBill') lead = { ...lead, monthlyBill: answer.lead.monthlyBill };
    else if (field === 'doNotCall') {
      customer = { ...customer, doNotCall: answer.customer.doNotCall };
      canDial = answer.canDial;
    } else if (field === 'preferredLanguage') {
      customer = { ...customer, preferredLanguage: answer.customer.preferredLanguage };
    } else if (isChoiceField(field)) {
      qualify = { ...qualify, [field]: answer.qualify[field] };
    }
  }
  return { ...standing, lead, customer, qualify, canDial };
}

function isChoiceField(field: LeadField): field is QualifyChoiceQuestion {
  return field in QUALIFY_CHOICES;
}

/** How every act on the lead lands: the lead as it now stands, then every CRM read asked again. */
export interface LeadDetailCache {
  /** The lead an act answered with, then the CRM's reads refreshed. */
  landed(lead: LeadDetail): void;
  /** The fields an edit answered for, copied onto the lead, then the CRM's reads refreshed. */
  edited(answer: LeadDetail, fields: readonly LeadField[]): void;
  /** Nothing to copy — a task, a contact — so the CRM's reads are asked again. */
  refresh(): void;
}

export function useLeadDetailCache(leadId: string): LeadDetailCache {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const refresh = useCallback(() => {
    /* A refresh cancels a read already out: one begun before this act landed would answer stale. */
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
  }, [queryClient, tenantId]);
  return useMemo(() => {
    const key = queryKeys.crm.lead(tenantId, leadId);
    return {
      landed: (lead) => {
        queryClient.setQueryData(key, lead);
        refresh();
      },
      edited: (answer, fields) => {
        queryClient.setQueryData<LeadDetail>(key, (standing) =>
          standing === undefined ? answer : patchEdited(standing, answer, fields),
        );
        refresh();
      },
      refresh,
    };
  }, [queryClient, tenantId, leadId, refresh]);
}
