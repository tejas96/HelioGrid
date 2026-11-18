'use client';
import type { DesignWire, LeadDetail } from '@heliogrid/contracts';
import { can, isClosedState, type Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { DesignActRefusedError } from '../studio/studio-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** Where the lead's designs lead. */
export interface LeadDesignsMoves {
  /** A design just made: its Site details open. */
  toSiteDetails(designId: string): void;
  toDesign(designId: string): void;
}

/** Why an act on the lead's designs came back undone: the lead closed meanwhile, or anything else. */
export type LeadDesignActFailure = 'host_closed' | 'other';

export interface LeadDesignsSection {
  /** The lead's designs, newest change first; read once the section is in view. */
  readonly read: Read<readonly DesignWire[]>;
  /** The reader holds the design grant (`studio.create_edit_designs`). */
  readonly canDesign: boolean;
  /** Who is reading, so their own designs say "You"; `null` while nobody is signed in. */
  readonly readerId: string | null;
  /** The lead is lost, disqualified or junk: no design is made on it until it is reopened. */
  readonly closed: boolean;
  /** *Create design*: the lead's next design is made and its Site details open. */
  create(): void;
  /** *Copy as a variant*: a new draft with the source's roof or ground, and its Site details open. */
  copy(designId: string): void;
  open(designId: string): void;
  recommend(designId: string, recommended: boolean): void;
  /** An act is out: every act waits for its answer. */
  readonly busy: boolean;
  readonly failure: LeadDesignActFailure | null;
  /** *Create design* itself is out — not a copy, not a recommend: the dock, where it is pressed, says so. */
  readonly creating: boolean;
  /** *Create design* itself came back undone. */
  readonly createFailure: LeadDesignActFailure | null;
}

type Made = { readonly copyOf: string | null };
type Mark = { readonly designId: string; readonly recommended: boolean };

const failureOf = (error: unknown): LeadDesignActFailure | null => {
  if (error === null) return null;
  return error instanceof DesignActRefusedError && error.refusal === 'host_closed'
    ? 'host_closed'
    : 'other';
};

/**
 * The lead's Designs section and the dock's *Create design* (`T-M05-001`). Fills
 * `LeadDesignsSection` for one lead; `shown` is whether the section is in view — the dock's create
 * works either way.
 */
export function useLeadDesignsSection(
  leadId: string,
  lead: LeadDetail | null,
  shown: boolean,
  moves: LeadDesignsMoves,
): LeadDesignsSection {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { user } = useSession();
  const canDesign = can(user?.tenant?.roles ?? [], 'studio.create_edit_designs');
  const key = queryKeys.studio.leadDesigns(tenantId, leadId);
  const latestMoves = useRef(moves);
  latestMoves.current = moves;
  /* One submission keeps its moment, so the same ask sent again carries the same retry key. */
  const held = useRef<{ readonly ask: string; readonly capturedAt: string } | null>(null);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      repositories.studio.designsOf(leadId, signal).then((set) => set.designs),
    enabled: tenantId !== '' && shown,
  });

  /** The lead's own read counts its designs for the tab: it reads again with the list. */
  const reread = async () => {
    await queryClient.invalidateQueries({ queryKey: key, exact: true });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.crm.lead(tenantId, leadId),
      exact: true,
    });
  };

  const make = useAction(
    ({ copyOf }: Made) => {
      const ask = JSON.stringify({ leadId, copyOf });
      if (held.current?.ask !== ask) held.current = { ask, capturedAt: new Date().toISOString() };
      return repositories.studio.create(leadId, { copyOf, capturedAt: held.current.capturedAt });
    },
    {
      onDone: async (made) => {
        held.current = null;
        queryClient.setQueryData(queryKeys.studio.design(tenantId, made.design.id), made);
        await reread();
        latestMoves.current.toSiteDetails(made.design.id);
      },
    },
  );
  const mark = useAction(
    ({ designId, recommended }: Mark) => repositories.studio.recommend(designId, recommended),
    {
      onDone: (set) => {
        queryClient.setQueryData(key, set.designs);
      },
    },
  );

  /** The act last sent was *Create design* itself, which the dock also offers. */
  const plain = useRef(false);
  const busy = make.pending || mark.pending;
  /** One act at a time: a second way in pressed in the same frame finds the first one out. */
  const free = () => !make.isOut() && !mark.isOut();
  const clear = () => {
    make.clear();
    mark.clear();
  };
  return {
    read: readOf(query, (designs) => designs.length === 0),
    canDesign,
    readerId: user?.id ?? null,
    closed: lead !== null && isClosedState(lead.lead.state),
    create: () => {
      if (!free()) return;
      clear();
      plain.current = true;
      void make.run({ copyOf: null });
    },
    copy: (designId) => {
      if (!free()) return;
      clear();
      plain.current = false;
      void make.run({ copyOf: designId });
    },
    open: (designId) => latestMoves.current.toDesign(designId),
    recommend: (designId, recommended) => {
      if (!free()) return;
      clear();
      plain.current = false;
      void mark.run({ designId, recommended });
    },
    busy,
    failure: failureOf(make.failure) ?? failureOf(mark.failure),
    creating: plain.current && make.pending,
    createFailure: plain.current ? failureOf(make.failure) : null,
  };
}
