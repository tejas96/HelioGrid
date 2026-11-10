'use client';
import {
  type Activity,
  type CrmMessageTemplateKey,
  type KnownActivity,
  knownActivitySchema,
  type LeadDetail,
} from '@heliogrid/contracts';
import {
  can,
  type LeadActDays,
  type LeadDetailSection,
  type LeadDetailView,
  leadActDaysOf,
  leadDetailViewOf,
  type Read,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { type LeadActs, type LeadSheetSend, useLeadActs } from './use-lead-acts';
import { type LeadAssign, useLeadAssign } from './use-lead-assign';
import { type LeadContactSave, type LeadContacts, useLeadContacts } from './use-lead-contacts';
import { type LeadMessage, useLeadMessage } from './use-lead-message';
import { type LeadQualify, useLeadQualify } from './use-lead-qualify';
import { type LeadSurveyor, useLeadSurveyors } from './use-lead-surveyors';
import { type LeadTasks, useLeadTasks } from './use-lead-tasks';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** The lead as the screen draws it: the read, and domain's view of it. */
export interface LeadDetailShown {
  readonly lead: LeadDetail;
  readonly view: LeadDetailView;
}

/**
 * The lead read — never empty, as one record's is not — or `unavailable` when it answered 404: gone
 * from the reader's scope or removed, the honest landing a notice opened after a reassignment meets.
 */
export type LeadDetailRead =
  | Exclude<Read<LeadDetailShown>, { readonly kind: 'empty' }>
  | { readonly kind: 'unavailable' };

/** One timeline entry: a kind this build knows, with its body — or one a newer server learned. */
export type LeadTimelineEntry =
  | { readonly known: true; readonly activity: KnownActivity }
  | { readonly known: false; readonly activity: Activity };

/** The timeline (`M02-35`), newest first by the server's apply order, a page at a time. */
export interface LeadTimeline {
  readonly read: Read<readonly LeadTimelineEntry[]>;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  loadMore(): void;
}

/** Lead Detail (`SCR-M02-04`) as both screens draw it, assembled once (Law 11). */
export interface LeadDetailScreen {
  readonly read: LeadDetailRead;
  /** Today and tomorrow on the tenant's clock: the first days a visit, call-back or wake may take. */
  readonly days: LeadActDays;
  readonly section: LeadDetailSection;
  setSection(section: LeadDetailSection): void;
  readonly timeline: LeadTimeline;
  readonly qualify: LeadQualify;
  readonly acts: LeadActs;
  /** Books the visit — or, with one booked, reschedules it as a no-show (`M02-48`). */
  sendVisit(visit: Extract<LeadSheetSend, { kind: 'visit' }>['visit']): void;
  /** The messages on offer: the follow-up, and the visit confirmation once a visit is booked. */
  readonly templates: readonly CrmMessageTemplateKey[];
  readonly message: LeadMessage;
  readonly contacts: LeadContacts;
  /** Saves the contact sheet's contact and closes the sheet once it lands. */
  saveContact(contact: LeadContactSave['contact']): void;
  readonly surveyors: Read<readonly LeadSurveyor[]>;
  readonly tasks: LeadTasks;
  readonly assign: LeadAssign;
  /** The reader may merge this customer with another (`crm.merge_customers`: Owner, Sales Manager). */
  readonly canMerge: boolean;
}

const TIMELINE_PAGE = 20;

function entryOf(activity: Activity): LeadTimelineEntry {
  const known = knownActivitySchema.safeParse(activity);
  return known.success ? { known: true, activity: known.data } : { known: false, activity };
}

/** Fills `LeadDetailScreen` for one lead; `timeZone` is the tenant's clock (`F1-10`). */
export function useLeadDetailScreen(leadId: string, timeZone: string): LeadDetailScreen {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const canMerge = can(useSession().user?.tenant?.roles ?? [], 'crm.merge_customers');
  const [section, setSection] = useState<LeadDetailSection>('timeline');
  const query = useQuery({
    queryKey: queryKeys.crm.lead(tenantId, leadId),
    queryFn: ({ signal }) => repositories.leads.detail(leadId, signal),
    enabled: tenantId !== '',
  });
  const lead = query.data ?? null;
  const acts = useLeadActs(leadId, timeZone);
  const qualify = useLeadQualify(leadId, lead);
  const tasks = useLeadTasks(leadId);
  const assign = useLeadAssign(leadId, lead);
  const sheet = acts.sheet;
  const contacts = useLeadContacts(leadId, lead, sheet?.kind === 'contact');
  const surveyors = useLeadSurveyors(sheet?.kind === 'visit');
  const visitId = lead?.visit?.id ?? null;
  const message = useLeadMessage(
    leadId,
    sheet?.kind === 'message'
      ? {
          template: sheet.template,
          visitId: sheet.template === 'visit_confirmation' ? visitId : null,
        }
      : null,
  );
  const pages = usePaginatedList({
    queryKey: queryKeys.crm.leadTimeline(tenantId, leadId, TIMELINE_PAGE),
    fetchPage: (page) =>
      repositories.activities.leadTimeline(leadId, { page, limit: TIMELINE_PAGE }),
    enabled: tenantId !== '',
  });
  const entries = useMemo(() => pages.shown.map(entryOf), [pages.shown]);
  const nowEpoch = Date.now();
  const days = leadActDaysOf(nowEpoch, timeZone);

  /* A 404 wins over a lead already shown: a reassignment away leaves nothing this reader may see. */
  const gone = query.error instanceof ApiError && query.error.status === 404;
  const answer = recordReadOf(query);
  const read: LeadDetailRead = gone
    ? { kind: 'unavailable' }
    : answer.kind !== 'ready'
      ? answer
      : {
          kind: 'ready',
          value: {
            lead: answer.value,
            view: leadDetailViewOf(answer.value, {
              nowEpoch,
              saves: qualify.saves,
              lastSaved: qualify.lastSaved,
              doneHere: tasks.doneHere,
            }),
          },
        };

  return {
    canMerge,
    read,
    days,
    section,
    setSection,
    timeline: {
      read: pages.read.kind === 'ready' ? { kind: 'ready', value: entries } : pages.read,
      total: pages.totalCount,
      hasMore: pages.hasNextPage,
      loadingMore: pages.isFetchingNextPage,
      loadMore: () => void pages.fetchNextPage(),
    },
    qualify,
    acts: {
      ...acts,
      close: () => {
        if (!contacts.saving) acts.close();
      },
      open: (next) => {
        if (next.kind === 'contact') contacts.reset();
        acts.open(next);
      },
    },
    sendVisit: (visit) => acts.send({ kind: 'visit', visit, replaces: visitId }),
    templates: visitId === null ? ['follow_up_nudge'] : ['follow_up_nudge', 'visit_confirmation'],
    message,
    contacts,
    saveContact: (contact) => {
      if (sheet?.kind !== 'contact') return;
      void contacts.save({ contactId: sheet.contactId, contact }).then((saved) => {
        if (saved) acts.close();
      });
    },
    surveyors,
    tasks,
    assign,
  };
}
