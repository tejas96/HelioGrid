'use client';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/** One person who can take the visit. */
export interface LeadSurveyor {
  readonly userId: string;
  readonly name: string;
}

/**
 * Who can survey the site (`M02-46`, `D15`): every active member whose roles capture surveys —
 * survey capability is not a gatekeeper — as the booking route itself judges them, so a person
 * who may book but not manage the team reads it too. Read once Book visit opens.
 */
export function useLeadSurveyors(wanted: boolean): Read<readonly LeadSurveyor[]> {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const query = useQuery({
    queryKey: queryKeys.crm.visitSurveyors(tenantId),
    queryFn: ({ signal }) => repositories.visits.surveyors(signal),
    enabled: wanted && tenantId !== '',
  });
  return readOf(query, (surveyors) => surveyors.length === 0);
}
