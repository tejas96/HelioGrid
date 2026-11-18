'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { DesignActRefusedError } from '../studio/studio-repository';
import { type Action, useAction } from './action';
import { useRepositories } from './context';
import { useTenantId } from './use-tenant-id';

/** Why a design act came back undone: the lead closed meanwhile, or anything else. */
export type DesignActFailure = 'host_closed' | 'other';

/** A failure in the words a design act answers with. */
export function designActFailureOf(error: unknown): DesignActFailure | null {
  if (error === null) return null;
  return error instanceof DesignActRefusedError && error.refusal === 'host_closed'
    ? 'host_closed'
    : 'other';
}

export interface MakeDesign {
  readonly leadId: string;
  /** The design copied as a variant; `null` for an empty one. */
  readonly copyOf: string | null;
}

/**
 * **Make a design on a lead** — the one way every door makes one: the lead's *Create design* and
 * *Copy as a variant*, and *With 3D design* in the start sheet. One submission keeps its moment, so
 * the same ask sent again carries the same retry key and finds the design the first send made
 * (`F4-07`). The design's own read is kept, and every list that shows it is read again: the lead's
 * designs, the lead's count, and the Proposals page.
 */
export function useCreateDesign(onMade: (designId: string) => void): Action<MakeDesign, unknown> {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const latestMade = useRef(onMade);
  latestMade.current = onMade;
  const held = useRef<{ readonly ask: string; readonly capturedAt: string } | null>(null);
  return useAction(
    ({ leadId, copyOf }: MakeDesign) => {
      const ask = JSON.stringify({ leadId, copyOf });
      if (held.current?.ask !== ask) held.current = { ask, capturedAt: new Date().toISOString() };
      return repositories.studio.create(leadId, { copyOf, capturedAt: held.current.capturedAt });
    },
    {
      onDone: async (made, { leadId }) => {
        held.current = null;
        queryClient.setQueryData(queryKeys.studio.design(tenantId, made.design.id), made);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.studio.leadDesigns(tenantId, leadId),
            exact: true,
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.crm.lead(tenantId, leadId),
            exact: true,
          }),
          queryClient.invalidateQueries({ queryKey: queryKeys.proposals.lists(tenantId) }),
        ]);
        latestMade.current(made.design.id);
      },
    },
  );
}
