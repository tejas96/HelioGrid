'use client';
import type { HandoverPreview, ProjectDetail } from '@heliogrid/contracts';
import type { ChecklistRowMaker, ProjectStage, Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** A referral named at handover (`M08-47`): the person, and the number they are reached on. */
export interface ReferralDraft {
  readonly name: string;
  readonly phoneE164: string;
}

/**
 * How long the handed-over project is looked at again while its pack is being made — every
 * `PACK_LOOK_MS`, `PACK_LOOKS` times — before the screen says it is late and offers its retry.
 * The server makes the pack a few seconds after the handover, and a pack of many pages took close
 * to half a minute on a busy worker — 18 seconds called a pack late that landed soon after. Longer
 * than this is a worker that is behind, and polling on would only spend the person's data.
 */
export const PACK_LOOK_MS = 3000;
export const PACK_LOOKS = 10;

/**
 * The handover pack (`M08-46`): no file to put in one (`empty` — the server makes none), what it
 * will hold before the handover (`unmade`), then being made, ready to download — with the files
 * it could not read left out — late, or `unreadable`: made with no file it could read, so none.
 */
export type HandoverPack =
  | { readonly kind: 'empty' }
  | { readonly kind: 'unmade'; readonly files: number }
  | { readonly kind: 'making'; readonly files: number }
  | {
      readonly kind: 'ready';
      readonly files: number;
      readonly leftOut: number;
      readonly fileId: string;
    }
  | { readonly kind: 'late'; readonly files: number }
  | { readonly kind: 'unreadable'; readonly files: number };

export interface Handover {
  /** What handover checks, and the message in the customer's own language. */
  readonly preview: Exclude<Read<HandoverPreview>, { readonly kind: 'empty' }>;
  /** The project has reached its last stage: the moment, the pack and the referral are drawn. */
  readonly handedOver: boolean;
  readonly pack: HandoverPack;
  /** Looks for a late pack again, for as long as the first wait. */
  lookAgain(): void;
  /** Asks the referral as a new lead, marked as referred by this customer; never a credit. */
  refer(draft: ReferralDraft): void;
  readonly referring: boolean;
  /** The name the referral was added under, once it landed as a new lead. */
  readonly referred: string | null;
  /**
   * The number that already belongs to a customer — nothing new was made — so the ask says so only
   * while that number is the one typed; null when the last ask made a lead or none was asked.
   */
  readonly referralKnown: string | null;
  readonly referralFailed: boolean;
  /** The message was copied — said beside it, never as a delivery (the desktop's Copy). */
  readonly copied: boolean;
  markCopied(): void;
}

const HANDED_OVER = 'handed_over' satisfies ProjectStage;
const PACK_MAKER = 'handover' satisfies ChecklistRowMaker;

/** The pack's file once the server has put it on its checklist row; null before. */
function packFileOf(project: ProjectDetail): string | null {
  const row = project.documents.find((document) => document.madeBy === PACK_MAKER);
  return row?.files[0]?.fileId ?? null;
}

function packOf(files: number, project: ProjectDetail | undefined, late: boolean): HandoverPack {
  if (files === 0) return { kind: 'empty' };
  if (project?.stage !== HANDED_OVER) return { kind: 'unmade', files };
  const fileId = packFileOf(project);
  const leftOut = project.packLeftOut;
  if (fileId !== null) {
    return { kind: 'ready', files: files - (leftOut ?? 0), leftOut: leftOut ?? 0, fileId };
  }
  // The server made the pack and read none of its files: there is no pack to wait for.
  if (leftOut !== null) return { kind: 'unreadable', files };
  return late ? { kind: 'late', files } : { kind: 'making', files };
}

/** How long the pack is looked for, from the first answer that showed the project without it. */
const PACK_WAIT_MS = PACK_LOOK_MS * PACK_LOOKS;

/**
 * The pack, looked for again while it is made: the project's own read, every `PACK_LOOK_MS` from
 * the first answer that showed it handed over without one, for `PACK_LOOKS` looks. The wait is
 * measured by the answers themselves — a look that failed answers too — so a server that keeps
 * failing ends it as surely as one that answers without the pack, and a look the person asks for
 * starts it again.
 */
function useHandoverPack(projectId: string, files: number, open: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [lookedFrom, setLookedFrom] = useState<number | null>(null);
  const looksLeft = (answeredAt: number) =>
    lookedFrom === null || answeredAt - lookedFrom < PACK_WAIT_MS;
  const project = useQuery({
    queryKey: queryKeys.projects.detail(tenantId, projectId),
    queryFn: ({ signal }) => repositories.projects.detail(projectId, signal),
    enabled: tenantId !== '' && open,
    refetchInterval: (query) =>
      packOf(files, query.state.data, false).kind === 'making' &&
      looksLeft(Math.max(query.state.dataUpdatedAt, query.state.errorUpdatedAt))
        ? PACK_LOOK_MS
        : false,
  });
  const answeredAt = Math.max(project.dataUpdatedAt, project.errorUpdatedAt);
  const pack = packOf(files, project.data, !looksLeft(answeredAt));
  const waiting = pack.kind === 'making' || pack.kind === 'late';
  useEffect(() => {
    if (waiting && lookedFrom === null) setLookedFrom(answeredAt);
  }, [waiting, lookedFrom, answeredAt]);
  return {
    handedOver: project.data?.stage === HANDED_OVER,
    pack,
    lookAgain: () => {
      setLookedFrom(Date.now());
      void project.refetch();
    },
  };
}

/**
 * The handover (`SCR-M08-06`): what it checks and the message it hands over, read while the flow is
 * open, and the pack the server makes from the checklist once it is handed over; the act itself is
 * the project's (`useProjectScreen`'s `send({ kind: 'handover' })`). The referral ask in the same
 * flow becomes the CRM's referral lead (`M08-47`, `M02-16`).
 */
export function useHandover(projectId: string, customerId: string, open: boolean): Handover {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [referred, setReferred] = useState<string | null>(null);
  const [known, setKnown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const preview = useQuery({
    queryKey: queryKeys.projects.handover(tenantId, projectId),
    queryFn: ({ signal }) => repositories.projects.handoverPreview(projectId, signal),
    enabled: tenantId !== '' && open,
  });
  const { handedOver, pack, lookAgain } = useHandoverPack(
    projectId,
    preview.data?.pack.files ?? 0,
    open,
  );
  const refer = useAction(
    (draft: ReferralDraft) =>
      repositories.leadCapture.create({
        phoneE164: draft.phoneE164,
        name: draft.name,
        referredBy: { customerId },
        capturedAt: new Date().toISOString(),
      }),
    {
      onDone: (outcome, draft) => {
        setKnown(outcome.kind === 'duplicate' ? draft.phoneE164 : null);
        setReferred(outcome.kind === 'created' ? draft.name : null);
        return queryClient.invalidateQueries({ queryKey: ['crm', tenantId] });
      },
    },
  );
  return {
    preview: recordReadOf(preview),
    handedOver,
    pack,
    lookAgain,
    refer: (draft) => void refer.run(draft),
    referring: refer.pending,
    referred,
    referralKnown: known,
    referralFailed: refer.failure !== null,
    copied,
    markCopied: () => setCopied(true),
  };
}
