'use client';
import { MARK_WON_VALUE_REFUSAL } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { MarkWonRefusedError } from '../projects/projects-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { useProjectPeople } from './use-project-people';
import { useWonBasis } from './use-proposal-hand-off';
import { useTenantId } from './use-tenant-id';

/** What *Mark won* sends: the final value as typed, the promised date, the manager. */
export interface MarkWonDraft {
  readonly finalValue: string;
  readonly expectedInstallOn: string;
  readonly managerId: string;
}

/** The project a *Mark won* started. */
export interface MarkWonStarted {
  readonly projectId: string;
  readonly number: string;
}

const NO_DRAFT: MarkWonDraft = { finalValue: '', expectedInstallOn: '', managerId: '' };

/** Why a *Mark won* did not land, as the sheet says it. */
export type MarkWonFailure =
  | 'already_won'
  | 'lead_closed'
  | 'value_not_accepted'
  | 'finer_than_currency'
  | 'value_needed'
  | 'date_in_past'
  | 'not_a_manager'
  | 'failed';

/**
 * *Mark won* on a lead (`M07-62`): who can manage the project, read only while the sheet
 * is open, and the send — one key per open sheet, so a retry after a dropped answer finds the
 * project the first send made (`F4-07`). The won lead and the board read again after it lands.
 */
export function useMarkWon(leadId: string) {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<MarkWonDraft>(NO_DRAFT);
  const [started, setStarted] = useState<MarkWonStarted | null>(null);
  /* One submission keeps its moment: the same draft sent again is the same body, so its retry key
     holds and the server answers the project the first send made. */
  const held = useRef<{ readonly draft: string; readonly capturedAt: string } | null>(null);
  /** The draft the last send carried — the field a refusal names is that draft's. */
  const lastSent = useRef<MarkWonDraft>(NO_DRAFT);
  const managers = useProjectPeople(opened ? 'manager' : null);
  /* What the lead's proposal gives the win (`M07-62`): read each time the sheet opens. */
  const basis = useWonBasis(leadId, opened);
  const lockedValue =
    basis.kind === 'ready' && basis.value.basis === 'accepted_version'
      ? basis.value.finalValue
      : null;
  const send = useAction(
    (sent: MarkWonDraft) => {
      lastSent.current = sent;
      const body = JSON.stringify(sent);
      if (held.current?.draft !== body)
        held.current = { draft: body, capturedAt: new Date().toISOString() };
      return repositories.projects.markWon(leadId, {
        ...sent,
        capturedAt: held.current.capturedAt,
      });
    },
    {
      onDone: async (made) => {
        held.current = null;
        setStarted(made);
        // The lead and the leads list read won; the owner home counts the deal (`M13-01`).
        await queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.owner(tenantId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
        // The lead's proposal now reads won, and its open tasks are closed (`M06-55`).
        await queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all(tenantId) });
      },
      // The customer answered again since the sheet read its value: read the value they accepted.
      onFailed: (error) => {
        if (error instanceof MarkWonRefusedError && error.refusal === MARK_WON_VALUE_REFUSAL) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.proposals.wonBasis(tenantId, leadId),
          });
        }
      },
    },
  );
  const clear = () => {
    held.current = null;
    send.clear();
  };
  return {
    opened,
    open: () => setOpened(true),
    /** Every way out — refused while the send is out. A started project leaves a fresh draft. */
    close: () => {
      if (send.isOut()) return;
      setOpened(false);
      clear();
      if (started !== null) {
        setStarted(null);
        setDraft(NO_DRAFT);
      }
    },
    /** The sheet's draft, kept while it is closed; an edit takes the last failure's line away. */
    draft,
    change: (next: MarkWonDraft) => {
      setDraft(next);
      send.clear();
    },
    managers,
    /**
     * The proposal the win stands on: an accepted version fills the value, which is then shown and
     * never typed; otherwise the typed value and the company's default terms stand (`M07-62`).
     */
    basis,
    sending: send.pending,
    failure: failureOf(send.failure, lastSent.current),
    /** The project this sheet started, once it landed: its number, and the way to it. */
    started,
    /** Sends the draft — with the accepted version's value where one stands, never a typed one. */
    send: (sent: MarkWonDraft) =>
      send.run(lockedValue === null ? sent : { ...sent, finalValue: lockedValue }),
    clear,
  };
}
export type MarkWon = ReturnType<typeof useMarkWon>;

/** A refused field, said under the field it names (`F4-04`). */
function failureOf(error: unknown, draft: MarkWonDraft): MarkWonFailure | null {
  if (error === null) return null;
  if (error instanceof MarkWonRefusedError) {
    if (error.refusal === MARK_WON_VALUE_REFUSAL) return 'value_not_accepted';
    return error.refusal === 'stage_reached' ? 'already_won' : 'lead_closed';
  }
  if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
    const paths = new Set(error.details?.map((detail) => detail.path) ?? []);
    // The picked manager lost the grant, or left, after the list was read: theirs to pick again.
    if (paths.has('managerId')) return 'not_a_manager';
    // The company's day turned between the pick and the send: the day picked is now behind it.
    if (paths.has('expectedInstallOn')) return 'date_in_past';
    return Number(draft.finalValue) > 0 ? 'finer_than_currency' : 'value_needed';
  }
  return 'failed';
}
