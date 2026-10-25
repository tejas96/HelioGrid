'use client';
import type {
  ProposalTemplate,
  ProposalTemplateRead,
  TimelineTemplateRead,
} from '@heliogrid/contracts';
import {
  aboutRefusal,
  onPlatformTemplate,
  type SettingsStanding,
  type TemplateDraft,
  type TemplateEdit,
  type TemplateRefusal,
  type TemplateSaved,
  templateChanged,
  templateDraftOf,
  templateEdit,
  templateRefusedPart,
  templateSendable,
  templateStanding,
  templateWritesOf,
  termsRefusal,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { DataError } from '../errors/errors';
import type { BrandingCover } from './branding-cover';
import { useRepositories } from './context';
import { richTextWireOf } from './proposal-template-view';
import { useBranding } from './use-branding';
import { useSession } from './use-session';

/** The Proposal template page as both screens consume it (Law 11, `SCR-M01-19`). */
export interface ProposalTemplatePage {
  /** The reads are out, they answered, one got no answer, or the last save did not land. */
  readonly status: 'loading' | 'ready' | 'unread' | 'save-failed';
  readonly saveFailure: DataError | null;
  readonly draft: TemplateDraft | null;
  readonly standing: SettingsStanding | null;
  /** Which record differs from what is saved: either raises the act bar; the stage notes only the template. */
  readonly changed: { readonly template: boolean; readonly timeline: boolean };
  readonly saving: boolean;
  /** Every part is HelioGrid's: the teaching banner shows. */
  readonly teaching: boolean;
  /** What the terms and the about text refuse as they stand, before any save. */
  readonly refusals: {
    readonly terms: TemplateRefusal | null;
    readonly about: TemplateRefusal | null;
  };
  /** The part whose field refuses the draft — the screen opens it when *Save template* is refused. */
  readonly refusedPart: 'cover' | 'terms' | null;
  /** The cover's company facts and colour, as Branding draws them: the same cover on both pages. */
  readonly cover: BrandingCover | null;
  readonly brandColour: string | null;
  /** The bank the documents print, from the profile's one write-point (`M01-31`); null when none is set. */
  readonly bankName: string | null;
  edit(edit: TemplateEdit): void;
  discard(): void;
  /** Sends only the records that changed, the template first. */
  save(): void;
  retryRead(): void;
}

/** Neither a read nor the save waits for a connection: held back offline, each would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

const UNCHANGED = { template: false, timeline: false } as const;

function savedOf(template: ProposalTemplateRead, timeline: TimelineTemplateRead): TemplateSaved {
  const { changed: _template, ...content } = template;
  return { template: content, phases: timeline.phases };
}

function templateWireOf(template: TemplateSaved['template']): ProposalTemplate {
  const terms = Object.entries(template.defaultTerms).map(
    ([language, value]) => [language, richTextWireOf(value)] as const,
  );
  return {
    cover: template.cover,
    sectionsIncluded: [...template.sectionsIncluded],
    defaultTerms: Object.fromEntries(terms) as ProposalTemplate['defaultTerms'],
  };
}

/**
 * `SCR-M01-19`'s reads and its one *Save template*. Each record is sent only while it differs from
 * what is held as saved, and its answer replaces what is held at once — so when the template lands
 * and the timeline does not, the next save sends the timeline alone.
 */
export function useProposalTemplate(): ProposalTemplatePage {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const branding = useBranding();
  const tenantId = user?.tenant?.id ?? '';
  const templateKey = queryKeys.settings.proposalTemplate(tenantId);
  const timelineKey = queryKeys.settings.timelineTemplate(tenantId);

  const template = useQuery({
    queryKey: templateKey,
    queryFn: ({ signal }) => repositories.settings.proposalTemplate(signal),
    ...ASKED_ONCE,
  });
  const timeline = useQuery({
    queryKey: timelineKey,
    queryFn: ({ signal }) => repositories.settings.timelineTemplate(signal),
    ...ASKED_ONCE,
  });
  const profile = useQuery({
    queryKey: queryKeys.settings.businessProfile(tenantId),
    queryFn: ({ signal }) => repositories.settings.businessProfile(signal),
    ...ASKED_ONCE,
  });

  const saved = useMemo(
    () =>
      template.data === undefined || timeline.data === undefined
        ? null
        : savedOf(template.data, timeline.data),
    [template.data, timeline.data],
  );
  const opened = useMemo(() => (saved === null ? null : templateDraftOf(saved)), [saved]);
  const [typed, setTyped] = useState<TemplateDraft | null>(null);
  // Set before the request leaves, so a second press in the same frame finds it out.
  const sending = useRef(false);
  const draft = typed ?? opened;

  const save = useMutation({
    networkMode: 'always',
    mutationFn: async (sent: { saved: TemplateSaved; draft: TemplateDraft }) => {
      const writes = templateWritesOf(sent.saved, sent.draft);
      if (writes.template !== undefined) {
        const answer = await repositories.settings.saveProposalTemplate(
          templateWireOf(writes.template),
        );
        queryClient.setQueryData(templateKey, answer);
      }
      if (writes.timeline !== undefined) {
        const phases = writes.timeline.phases.map((phase) => ({ ...phase }));
        queryClient.setQueryData(
          timelineKey,
          await repositories.settings.saveTimelineTemplate({ phases }),
        );
      }
    },
    onSettled: () => {
      sending.current = false;
    },
    // Only the draft the save sent is let go: an edit typed while it was out stays held.
    onSuccess: (_answer, sent) => setTyped((held) => (held === sent.draft ? null : held)),
  });
  const { mutate, isPending, isError, error } = save;

  const reads = [template, timeline, profile];
  const changed = saved === null || draft === null ? UNCHANGED : templateChanged(saved, draft);
  return {
    status: statusOf(
      saved !== null && branding.status !== 'loading',
      reads.some((read) => read.isError) || branding.status === 'unread',
      isError,
    ),
    saveFailure: isError ? (error as DataError) : null,
    draft,
    // Read off what is saved, never the draft: an edit not yet saved says nothing about the last save.
    standing:
      opened === null
        ? null
        : templateStanding(opened, template.data?.changed, timeline.data?.changed),
    changed,
    saving: isPending,
    teaching: draft !== null && onPlatformTemplate(draft),
    refusals: {
      terms: draft === null ? null : termsRefusal(draft),
      about: draft === null ? null : aboutRefusal(draft),
    },
    refusedPart: draft === null ? null : templateRefusedPart(draft),
    cover: branding.cover,
    brandColour: branding.draft?.brandColour ?? null,
    bankName: profile.data?.bankDetails?.bankName ?? null,
    // From what was last held, never from this render: two edits can land before the next one.
    edit: (next) => {
      if (opened !== null) setTyped((was) => templateEdit(was ?? opened, next));
    },
    discard: () => {
      setTyped(null);
      save.reset();
    },
    save: () => {
      if (saved === null || draft === null || sending.current || !templateSendable(draft)) return;
      sending.current = true;
      mutate({ saved, draft });
    },
    retryRead: () => {
      for (const query of reads) {
        if (query.isError) void query.refetch();
      }
      branding.retryRead();
    },
  };
}

/** A failed save outranks the reads it followed; a read with no answer outranks the wait for the rest. */
function statusOf(
  read: boolean,
  unread: boolean,
  saveFailed: boolean,
): ProposalTemplatePage['status'] {
  if (read) return saveFailed ? 'save-failed' : 'ready';
  return unread ? 'unread' : 'loading';
}
