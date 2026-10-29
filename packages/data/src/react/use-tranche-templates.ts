'use client';
import type {
  TrancheSchedulePreview,
  TrancheTemplate,
  TrancheTemplateList,
} from '@heliogrid/contracts';
import {
  type AllocationVerdict,
  canAddTranche,
  canRemoveTranche,
  onSeededTermsOnly,
  type Read,
  type SettingsStanding,
  type TrancheCard,
  type TrancheDraft,
  type TrancheEdit,
  type TrancheLineRead,
  type TrancheRefusals,
  type TrancheTemplateRead,
  trancheCardsOf,
  trancheDraftChanged,
  trancheDraftOf,
  trancheEdit,
  trancheNewDraft,
  tranchePreviewLines,
  trancheRefusals,
  trancheSendable,
  trancheStanding,
  trancheVerdictOf,
  trancheWriteOf,
  type UiLanguage,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { answerOf, type DataError } from '../errors/errors';
import { TRANCHE_TEMPLATE_ACTS, type TrancheTemplateAct } from '../settings/repository';
import { useAction } from './action';
import type { BrandingCover } from './branding-cover';
import { useRepositories } from './context';
import { readOf } from './read';
import { useBranding } from './use-branding';
import { useSession } from './use-session';
import { useTrancheSchedule } from './use-tranche-schedule';

/** The open editor: the draft, the one verdict, what it refuses, and the schedule it previews. */
export interface PaymentTermsEditor {
  readonly draft: TrancheDraft;
  /** Opened by *Add payment terms* — it stays so after its first save lands, so its name field stays. */
  readonly made: boolean;
  /** The template as saved; `null` for *Add payment terms*. */
  readonly saved: TrancheTemplateRead | null;
  readonly changed: boolean;
  /** The ONE verdict the meter draws and *Save terms* reads (`M01-54`). */
  readonly verdict: AllocationVerdict;
  readonly refusals: TrancheRefusals;
  /** A refused *Save terms* was pressed: the fields now say what they refuse. */
  readonly refusalsShown: boolean;
  readonly canAdd: boolean;
  readonly canRemove: boolean;
  readonly saving: boolean;
  readonly saveFailure: DataError | null;
  /** The save was refused because another owner moved the template meanwhile (409): the banner says the api's words, and the list is read again. */
  readonly saveConflict: boolean;
  /** What the preview shows; `null` for a new template before its first whole edit. */
  readonly preview: {
    readonly source: 'saved' | 'draft';
    readonly lines: readonly TrancheLineRead[];
    /** The api's amounts for these lines (`F4-04`); `null` until an answer comes. */
    readonly schedule: TrancheSchedulePreview | null;
  } | null;
}

/** The Payment terms page as both screens consume it (Law 11, `SCR-M01-20`). */
export interface PaymentTermsPage {
  /** The list of templates as read; the cards and the standing are drawn from it once it came. */
  readonly read: Read<TrancheTemplateList>;
  readonly cards: {
    readonly inUse: readonly TrancheCard[];
    readonly archived: readonly TrancheCard[];
  };
  readonly standing: SettingsStanding | null;
  /** Only the two given splits exist, untouched: the teaching banner shows. */
  readonly seededOnly: boolean;
  readonly editor: PaymentTermsEditor | null;
  /** The act on its way, if any. */
  readonly acting: TrancheTemplateAct | null;
  /** The last act the api refused or never answered — the screen's toast; nothing changed. */
  readonly actFailure: DataError | null;
  /** The preview's letterhead, as Branding draws it; `null` while it loads or when it failed. */
  readonly cover: BrandingCover | null;
  readonly brandColour: string | null;
  open(id: string): void;
  openNew(): void;
  edit(edit: TrancheEdit): void;
  /** Drops the edit and closes the editor; the screen asks first when `changed`. */
  close(): void;
  /** Nothing changed closes and sends nothing; a refused draft shows its refusals and sends nothing. */
  save(): void;
  act(id: string, act: TrancheTemplateAct): void;
  dismissActFailure(): void;
}

interface Editing {
  readonly opened: TrancheDraft;
  /** Opened by *Add payment terms*: it keeps its name field after its first save lands. */
  readonly made: boolean;
  readonly draft: TrancheDraft;
  readonly refusalsShown: boolean;
}

/** No read and no write waits for a connection: held back offline, each would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

const CONFLICT = 409;

/**
 * `SCR-M01-20`'s reads, its editor and its five acts. A write's answer replaces the template in
 * the list at once, and the list is read again for what the answer does not carry — the saved line,
 * and the default that stepped down.
 */
export function useTrancheTemplates(language: UiLanguage): PaymentTermsPage {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const branding = useBranding();
  const tenantId = user?.tenant?.id ?? '';
  const listKey = queryKeys.settings.trancheTemplates(tenantId);

  const list = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => repositories.settings.trancheTemplates(signal),
    ...ASKED_ONCE,
  });
  const templates = list.data?.items ?? [];
  const [editing, setHeld] = useState<Editing | null>(null);
  // The editor as last set, read by `save`: a field that commits on blur lands in the same press
  // that saves, before this render's `editing` has caught up with it.
  const latest = useRef<Editing | null>(null);
  const setEditing = (next: Editing | null | ((was: Editing | null) => Editing | null)) => {
    latest.current = typeof next === 'function' ? next(latest.current) : next;
    setHeld(latest.current);
  };

  const held = (template: TrancheTemplate) =>
    queryClient.setQueryData<TrancheTemplateList>(listKey, (was) =>
      was === undefined ? was : { ...was, items: withTemplate(was.items, template) },
    );
  const readAgain = () => queryClient.invalidateQueries({ queryKey: listKey });

  const save = useAction(
    ({ draft }: Editing) => {
      const body = trancheWriteOf(draft);
      const write = { name: body.name, lines: body.lines.map((line) => ({ ...line })) };
      return draft.id === null
        ? repositories.settings.createTrancheTemplate(write)
        : repositories.settings.saveTrancheTemplate(draft.id, write);
    },
    {
      onDone: (template, sent) => {
        held(template);
        void readAgain();
        // Only the editor the save was sent from is touched, and only the draft it sent is let go.
        // An edit typed there while it was out stays open, now on the saved template, so its next
        // save replaces it — a create is never sent twice. Another editor opened meanwhile is left
        // as it is.
        setEditing((was) => {
          if (was === null || was.draft === sent.draft) return null;
          if (was.opened !== sent.opened) return was;
          return {
            ...was,
            opened: trancheDraftOf(template, language),
            draft: { ...was.draft, id: template.id },
          };
        });
      },
      onFailed: (error) => {
        if (answerOf(error)?.status === CONFLICT) void readAgain();
      },
    },
  );

  // Keyed by the act, so the screen can tell which one is out; `act` lets one go at a time.
  const acts = useAction(
    ({ id, act }: { id: string; act: TrancheTemplateAct }) =>
      repositories.settings.actOnTrancheTemplate(id, act),
    {
      key: ({ act }) => act,
      onDone: (template, { act }) => {
        held(template);
        void readAgain();
        if (act === 'archive') setEditing(null);
      },
      onFailed: (error) => {
        if (answerOf(error)?.status === CONFLICT) void readAgain();
      },
    },
  );

  const saved =
    editing?.draft.id == null
      ? null
      : (templates.find((template) => template.id === editing.draft.id) ?? null);
  const preview = editing === null ? null : tranchePreviewLines(saved, editing.draft);
  const priced = useTrancheSchedule(tenantId, editing?.opened ?? null, preview);

  return {
    read: readOf(list),
    cards: trancheCardsOf(templates),
    standing: list.data === undefined ? null : trancheStanding(list.data.lastSaved, templates),
    seededOnly: onSeededTermsOnly(templates),
    editor:
      editing === null
        ? null
        : editorOf(editing, saved, {
            saving: save.pending,
            saveFailure: save.failure === null ? null : (save.failure as DataError),
            saveConflict: answerOf(save.failure)?.status === CONFLICT,
            preview: priced,
          }),
    acting: TRANCHE_TEMPLATE_ACTS.find((act) => acts.pendingFor(act)) ?? null,
    actFailure: acts.failure === null ? null : (acts.failure as DataError),
    cover: branding.cover,
    brandColour: branding.draft?.brandColour ?? null,
    open: (id) => {
      const template = templates.find((one) => one.id === id);
      if (template === undefined) return;
      const draft = trancheDraftOf(template, language);
      save.clear();
      setEditing({ opened: draft, draft, made: false, refusalsShown: false });
    },
    openNew: () => {
      const draft = trancheNewDraft(language);
      save.clear();
      setEditing({ opened: draft, draft, made: true, refusalsShown: false });
    },
    // From what was last held, never from this render: two edits can land before the next one.
    edit: (next) =>
      setEditing((was) => (was === null ? was : { ...was, draft: trancheEdit(was.draft, next) })),
    close: () => {
      setEditing(null);
      save.clear();
    },
    save: () => {
      const open = latest.current;
      if (open === null || save.isOut()) return;
      if (!trancheDraftChanged(open.opened, open.draft)) return setEditing(null);
      if (!trancheSendable(open.draft)) return setEditing({ ...open, refusalsShown: true });
      void save.run(open);
    },
    act: (id, act) => {
      if (!acts.isOut()) void acts.run({ id, act });
    },
    dismissActFailure: acts.clear,
  };
}

/** The open editor as the screens read it, off the draft and what the save is doing. */
function editorOf(
  editing: Editing,
  saved: TrancheTemplateRead | null,
  sending: Pick<PaymentTermsEditor, 'saving' | 'saveFailure' | 'saveConflict' | 'preview'>,
): PaymentTermsEditor {
  return {
    draft: editing.draft,
    made: editing.made,
    saved,
    changed: trancheDraftChanged(editing.opened, editing.draft),
    verdict: trancheVerdictOf(editing.draft),
    refusals: trancheRefusals(editing.draft),
    refusalsShown: editing.refusalsShown,
    canAdd: canAddTranche(editing.draft),
    canRemove: canRemoveTranche(editing.draft),
    ...sending,
  };
}

/** The list with a write's answer in place, or added at its end when it is new. */
function withTemplate(items: readonly TrancheTemplate[], template: TrancheTemplate) {
  const known = items.some((item) => item.id === template.id);
  return known
    ? items.map((item) => (item.id === template.id ? template : item))
    : [...items, template];
}
