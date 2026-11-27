'use client';
import type { DesignWire, LeadDetail } from '@heliogrid/contracts';
import { can, isClosedState, type Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { readOf } from './read';
import { type DesignActFailure, designActFailureOf, useCreateDesign } from './use-create-design';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** Where the lead's designs lead. */
export interface LeadDesignsMoves {
  /** A design just made: its Site details open. */
  toSiteDetails(designId: string): void;
  toDesign(designId: string): void;
}

/** Why an act on the lead's designs came back undone: the lead closed meanwhile, or anything else. */
export type LeadDesignActFailure = DesignActFailure;

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
  /**
   * The dock's *Design*: the lead's newest design opens where it has one, read first when the list
   * is not in yet; a lead with none makes its first.
   */
  design(): void;
  /** *Copy as a variant*: a new draft with the source's roof or ground, and its Site details open. */
  copy(designId: string): void;
  open(designId: string): void;
  recommend(designId: string, recommended: boolean): void;
  /** An act is out: every act waits for its answer. */
  readonly busy: boolean;
  readonly failure: LeadDesignActFailure | null;
  /** *Create design* itself is out — not a copy, not a recommend: the dock, where it is pressed, says so. */
  readonly creating: boolean;
  /** *Create design* itself, or the dock's *Design* reading the list, came back undone. */
  readonly createFailure: LeadDesignActFailure | null;
  /** The dock's *Design* is reading the list to open the newest: the dock says so where it is pressed. */
  readonly opening: boolean;
}

type Mark = { readonly designId: string; readonly recommended: boolean };

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
  const designsOf = ({ signal }: { signal: AbortSignal }) =>
    repositories.studio.designsOf(leadId, signal).then((set) => set.designs);
  const query = useQuery({ queryKey: key, queryFn: designsOf, enabled: tenantId !== '' && shown });

  const make = useCreateDesign((designId) => latestMoves.current.toSiteDetails(designId));
  const mark = useAction(
    ({ designId, recommended }: Mark) => repositories.studio.recommend(designId, recommended),
    {
      onDone: (set) => {
        queryClient.setQueryData(key, set.designs);
      },
    },
  );

  /** The dock's *Design* reading the list, and that read come back undone. */
  const [opening, setOpening] = useState(false);
  const [lookFailed, setLookFailed] = useState(false);
  /** The act last sent was *Create design* itself, which the dock also offers. */
  const plain = useRef(false);
  const busy = make.pending || mark.pending;
  /** One act at a time: a second way in pressed in the same frame finds the first one out. */
  const free = () => !make.isOut() && !mark.isOut();
  const clear = () => {
    make.clear();
    mark.clear();
    setLookFailed(false);
  };
  const create = () => {
    if (!free()) return;
    clear();
    plain.current = true;
    void make.run({ leadId, copyOf: null });
  };
  /** A dock press waits on the list: a second press meanwhile reads it no second time. */
  const looking = useRef(false);
  /**
   * The list to open from: the one read when it still holds as many designs as the lead counts,
   * else read again, so a list read before another device made a design never sends the press to
   * make a second one.
   */
  const listFor = (count: number | null) => {
    const held = queryClient.getQueryData<readonly DesignWire[]>(key);
    return held !== undefined && (count === null || held.length === count)
      ? Promise.resolve(held)
      : queryClient.fetchQuery({ queryKey: key, queryFn: designsOf, staleTime: 0 });
  };
  return {
    read: readOf(query, (designs) => designs.length === 0),
    canDesign,
    readerId: user?.id ?? null,
    closed: lead !== null && isClosedState(lead.lead.state),
    create,
    design: () => {
      if (!free() || looking.current) return;
      if (lead?.sections.designs === 0) {
        create();
        return;
      }
      looking.current = true;
      setOpening(true);
      clear();
      void listFor(lead?.sections.designs ?? null)
        .then((designs) => {
          const [newest] = designs;
          if (newest === undefined) create();
          else latestMoves.current.toDesign(newest.id);
        })
        // A list that could not be read opens nothing and makes nothing: the dock says so, and
        // the press is free again.
        .catch(() => setLookFailed(true))
        .finally(() => {
          looking.current = false;
          setOpening(false);
        });
    },
    copy: (designId) => {
      if (!free()) return;
      clear();
      plain.current = false;
      void make.run({ leadId, copyOf: designId });
    },
    open: (designId) => latestMoves.current.toDesign(designId),
    recommend: (designId, recommended) => {
      if (!free()) return;
      clear();
      plain.current = false;
      void mark.run({ designId, recommended });
    },
    busy,
    failure: designActFailureOf(make.failure) ?? designActFailureOf(mark.failure),
    creating: plain.current && make.pending,
    createFailure:
      (plain.current ? designActFailureOf(make.failure) : null) ?? (lookFailed ? 'other' : null),
    opening,
  };
}
