'use client';
import type {
  ProposalTemplate,
  ProposalTemplateRead,
  TimelineTemplateRead,
} from '@heliogrid/contracts';
import {
  allReads,
  type BankDetails,
  type CompanyLetterhead,
  mapRead,
  onPlatformTemplate,
  type Read,
  type SettingsStanding,
  type TemplateDefaults,
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
  UI_SOURCE_LOCALE,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { DataError } from '../errors/errors';
import { useAction } from './action';
import type { BrandingCover } from './branding-cover';
import { useRepositories } from './context';
import { pageRead } from './page-read';
import { richTextWireOf } from './proposal-template-view';
import { readOf } from './read';
import { type BankDraft, bankWriteOf, useBankTyped } from './use-bank-typed';
import { useBranding } from './use-branding';
import { useSession } from './use-session';

/** The Proposal template page as both screens consume it (Law 11, `SCR-M01-19`). */
export interface ProposalTemplatePage {
  /**
   * The template and the timeline as saved, ready once Branding's cover has answered or failed;
   * `failed` when a read got no answer before then.
   */
  readonly read: Read<TemplateSaved>;
  /** Why the last save did not land; `null` while none failed. */
  readonly saveFailure: DataError | null;
  readonly draft: TemplateDraft | null;
  readonly standing: SettingsStanding | null;
  /** Which record differs from what is saved: any raises the act bar; the stage notes only the template. */
  readonly changed: {
    readonly template: boolean;
    readonly timeline: boolean;
    readonly bank: boolean;
  };
  readonly saving: boolean;
  /** Every part is HelioGrid's: the teaching banner shows. */
  readonly teaching: boolean;
  /** What the terms refuse as they stand, before any save. */
  readonly refusals: { readonly terms: TemplateRefusal | null };
  /** The part whose field refuses the draft — the screen opens it when *Save template* is refused. */
  readonly refusedPart: 'terms' | null;
  /** The cover's company facts and colour, as Branding draws them: the same cover on both pages. */
  readonly cover: BrandingCover | null;
  readonly brandColour: string | null;
  /** The bank the documents print, from the profile's one write-point (`M01-31`); null when none is set. */
  readonly bankName: string | null;
  /** The company's own cover photo as a short-lived address, while the saved picture is its own. */
  readonly coverPhotoUrl: string | null;
  /** The company's facts as the cover prints them (`companyLetterhead`); null until Branding answers. */
  readonly company: CompanyLetterhead | null;
  /** The account every proposal prints, as typed here and not yet saved, or as the profile holds it. */
  readonly bank: BankDraft;
  edit(edit: TemplateEdit): void;
  discard(): void;
  /** Sends only the records that changed, the template first. */
  save(): void;
}

/** Neither a read nor the save waits for a connection: held back offline, each would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

const UNCHANGED = { template: false, timeline: false, bank: false } as const;

/** Branding's read with no answer: the page is drawn without its cover, never held back by it. */
const COVER_FAILED = { kind: 'ready', value: null } as const;

function savedOf(template: ProposalTemplateRead, timeline: TimelineTemplateRead): TemplateSaved {
  const { changed: _template, coverPhotoUrl: _photo, ...content } = template;
  return { template: content, phases: timeline.phases };
}

function templateWireOf(template: TemplateSaved['template']): ProposalTemplate {
  return {
    cover: template.cover,
    sectionsIncluded: [...template.sectionsIncluded],
    defaultTerms: richTextWireOf(template.defaultTerms),
    ...(template.coverPicture === undefined ? {} : { coverPicture: template.coverPicture }),
  };
}

/** The company's own cover photo's address, where the saved picture is its own. */
function photoUrlOf(template: ProposalTemplateRead | undefined): string | null {
  return template?.coverPhotoUrl ?? null;
}

/** What one save sends: the two records as held, and the account when it was typed here. */
interface Sent {
  readonly saved: TemplateSaved;
  readonly draft: TemplateDraft;
  readonly bank: BankDetails | null;
}

/**
 * `SCR-M01-19`'s reads and its one *Save template*. Each record is sent only while it differs from
 * what is held as saved, and its answer replaces what is held at once — so when the template lands
 * and the timeline does not, the next save sends the timeline alone. `defaults` are the platform's
 * terms and phases in the reader's words (`documentDefaults`): a part holding them is HelioGrid's.
 */
export function useProposalTemplate(defaults: TemplateDefaults): ProposalTemplatePage {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const branding = useBranding();
  const tenantId = user?.tenant?.id ?? '';
  const reader = user?.interfaceLanguage ?? UI_SOURCE_LOCALE;
  const templateKey = queryKeys.settings.proposalTemplate(tenantId, reader);
  const timelineKey = queryKeys.settings.timelineTemplate(tenantId, reader);

  const template = useQuery({
    queryKey: templateKey,
    queryFn: ({ signal }) => repositories.settings.proposalTemplate(reader, signal),
    ...ASKED_ONCE,
  });
  const timeline = useQuery({
    queryKey: timelineKey,
    queryFn: ({ signal }) => repositories.settings.timelineTemplate(reader, signal),
    ...ASKED_ONCE,
  });
  const profile = useQuery({
    queryKey: queryKeys.settings.businessProfile(tenantId),
    queryFn: ({ signal }) => repositories.settings.businessProfile(signal),
    ...ASKED_ONCE,
  });

  const own = mapRead(allReads([readOf(template), readOf(timeline)]), ([held, phases]) =>
    savedOf(held, phases),
  );
  // The cover is Branding's: the page waits for its answer, and draws without it when it failed.
  const cover = branding.read.kind === 'failed' ? COVER_FAILED : branding.read;
  const read = pageRead(
    mapRead(allReads([own, cover]), ([value]) => value),
    [readOf(profile), branding.read],
  );
  const saved = own.kind === 'ready' ? own.value : null;
  const opened = saved === null ? null : templateDraftOf(saved);
  const [typed, setTyped] = useState<TemplateDraft | null>(null);
  const draft = typed ?? opened;
  const bank = useBankTyped(profile.data);

  // A save changes the template for every reader; the copies held in other languages are let go,
  // so a language switch asks again rather than showing the template from before the save.
  const dropOtherReaders = (every: readonly unknown[]) =>
    queryClient.removeQueries({
      queryKey: every,
      predicate: (query) => query.queryKey[every.length] !== reader,
    });

  const save = useAction(
    async (sent: Sent) => {
      const writes = templateWritesOf(sent.saved, sent.draft);
      if (writes.template !== undefined) {
        const answer = await repositories.settings.saveProposalTemplate(
          templateWireOf(writes.template),
        );
        queryClient.setQueryData(templateKey, answer);
        dropOtherReaders(queryKeys.settings.proposalTemplates(tenantId));
      }
      if (writes.timeline !== undefined) {
        const phases = writes.timeline.phases.map((phase) => ({ ...phase }));
        queryClient.setQueryData(
          timelineKey,
          await repositories.settings.saveTimelineTemplate({ phases }),
        );
        dropOtherReaders(queryKeys.settings.timelineTemplates(tenantId));
      }
      if (sent.bank !== null && profile.data !== undefined) {
        queryClient.setQueryData(
          queryKeys.settings.businessProfile(tenantId),
          await repositories.settings.saveBusinessProfile({
            ...profile.data,
            ...bankWriteOf(sent.bank),
          }),
        );
      }
    },
    // Only what the save sent is let go: an edit typed while it was out stays held.
    {
      onDone: (_answer, sent) => {
        setTyped((held) => (held === sent.draft ? null : held));
        bank.sent(sent.bank);
      },
    },
  );

  const changed =
    saved === null || draft === null
      ? UNCHANGED
      : { ...templateChanged(saved, draft), bank: bank.changed };
  return {
    read,
    saveFailure: save.failure === null ? null : (save.failure as DataError),
    draft,
    // Read off what is saved, never the draft: an edit not yet saved says nothing about the last save.
    standing:
      opened === null
        ? null
        : templateStanding(opened, template.data?.changed, timeline.data?.changed, defaults),
    changed,
    saving: save.pending,
    teaching: draft !== null && onPlatformTemplate(draft, defaults),
    refusals: { terms: draft === null ? null : termsRefusal(draft) },
    refusedPart: draft === null ? null : templateRefusedPart(draft),
    cover: branding.cover,
    brandColour: branding.draft?.brandColour ?? null,
    bankName: profile.data?.bankDetails?.bankName ?? null,
    coverPhotoUrl: photoUrlOf(template.data),
    company: branding.company,
    bank: bank.draft,
    // From what was last held, never from this render: two edits can land before the next one.
    edit: (next) => {
      if (opened !== null) setTyped((was) => templateEdit(was ?? opened, next));
    },
    discard: () => {
      setTyped(null);
      bank.drop();
      save.clear();
    },
    save: () => {
      if (saved !== null && draft !== null && templateSendable(draft)) {
        void save.run({ saved, draft, bank: bank.changed ? bank.typed : null });
      }
    },
  };
}
