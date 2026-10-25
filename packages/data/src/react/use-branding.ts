'use client';
import type { BrandingRead, BrandingSave } from '@heliogrid/contracts';
import {
  type BrandingDraft,
  type BrandingDraftWrite,
  type BrandingEdit,
  type BrandingSaved,
  brandingChanged,
  brandingDraftOf,
  brandingEdit,
  brandingSendable,
  brandingStanding,
  brandingWriteOf,
  type CompanyLetterhead,
  type CompanyLogoCaptureFacts,
  companyProfileValuesAtRead,
  companyProfileView,
  type SettingsStanding,
  taxPackOf,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { DataError } from '../errors/errors';
import { type BrandingCover, type BrandingFields, coverOf, fieldsOf } from './branding-cover';
import { useRepositories } from './context';
import { type ChosenPicture, useCompanyLogo } from './use-company-logo';
import { useSession } from './use-session';

/** The Branding page as both screens consume it (Law 11, `SCR-M01-18`). */
export interface BrandingPage {
  /** The reads are out, they answered, one got no answer, or the last save did not land. */
  readonly status: 'loading' | 'ready' | 'unread' | 'save-failed';
  /** Why the last save did not land; the banner says it in the shared failure words. */
  readonly saveFailure: DataError | null;
  readonly draft: BrandingDraft | null;
  readonly standing: SettingsStanding | null;
  /** Something differs from what customers receive now — what raises the act bar. */
  readonly changed: boolean;
  readonly saving: boolean;
  /** The company's facts as the cover prints them (`companyLetterhead`): name, address, registration. */
  readonly company: CompanyLetterhead | null;
  /** What both previews print, from the draft: the tenant's own values only (`T-M01-029`). */
  readonly cover: BrandingCover | null;
  readonly logo: CompanyLogoCaptureFacts;
  /** The last chosen file's name, which a refusal names it by; `null` where the device gave none. */
  readonly chosenName: string | null;
  edit(edit: BrandingEdit): void;
  /** The letterhead's three fields as typed and the edit each makes — the editor's fields. */
  readonly fields: BrandingFields;
  chooseLogo(image: ChosenPicture): void;
  removeLogo(): void;
  /** Drops every edit and the chosen image; nothing was stored, so nothing is left behind. */
  discard(): void;
  /** Stores a chosen logo, then sends the one write. */
  save(): void;
  retryRead(): void;
}

/** Neither a read nor the save waits for a connection: held back offline, each would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

/** What the page holds as saved: branding as read, with the profile's logo beside it. */
function savedOf(read: BrandingRead, profileLogo: string | null): BrandingSaved {
  return {
    brandColour: read.brandColour,
    letterhead: read.letterhead,
    logoFileId: read.logoFileId === undefined ? profileLogo : read.logoFileId,
  };
}

/** The domain's write as the wire takes it: the same values, the lines a list the client may own. */
function wireOf(write: BrandingDraftWrite): BrandingSave {
  const { letterhead } = write;
  return {
    ...write,
    letterhead: letterhead === null ? null : { ...letterhead, lines: [...letterhead.lines] },
  };
}

/** An api built before the save carried the logo strips it: the answer then names no logo. */
class LogoNotSaved extends Error {}

/**
 * `SCR-M01-18`'s reads and its one save. Nothing is written before the act; a chosen logo is held
 * on the device, stored at the act, and sent with the branding in ONE write, which the api lands
 * in one transaction. The answer replaces the branding held here and the profile's logo, so the
 * Business profile page shows the same logo without a read (`D237`).
 */
export function useBranding(): BrandingPage {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const brandingKey = queryKeys.settings.branding(tenantId);
  const profileKey = queryKeys.settings.businessProfile(tenantId);

  const branding = useQuery({
    queryKey: brandingKey,
    queryFn: ({ signal }) => repositories.settings.branding(signal),
    ...ASKED_ONCE,
  });
  const profile = useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => repositories.settings.businessProfile(signal),
    ...ASKED_ONCE,
  });
  const registrations = useQuery({
    queryKey: queryKeys.settings.taxRegistrations(tenantId),
    queryFn: ({ signal }) => repositories.settings.taxRegistrations(signal),
    ...ASKED_ONCE,
  });
  const companyRead = useQuery({
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }) => repositories.tenant.me(signal),
    networkMode: 'always',
  });
  const marketCode = companyRead.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
    ...ASKED_ONCE,
  });

  const saved = useMemo(
    () =>
      branding.data === undefined || profile.data === undefined
        ? null
        : savedOf(branding.data, profile.data.logoFileId),
    [branding.data, profile.data],
  );
  const company = useMemo(() => {
    const tax = pack.data === undefined ? null : taxPackOf(pack.data.tax);
    if (profile.data === undefined || registrations.data === undefined || tax === null) return null;
    const stored = { profile: profile.data, registrations: registrations.data.registrations };
    return companyProfileView(companyProfileValuesAtRead(stored, tax), stored, tax).letterhead;
  }, [profile.data, registrations.data, pack.data]);

  const [typed, setTyped] = useState<BrandingDraft | null>(null);
  const [chosenName, setChosenName] = useState<string | null>(null);
  // Set before the request leaves, so a second press in the same frame finds it out.
  const sending = useRef(false);
  const draft = typed ?? (saved === null ? null : brandingDraftOf(saved));
  const logo = useCompanyLogo(tenantId, draft?.logoFileId);

  const save = useMutation({
    networkMode: 'always',
    mutationFn: async (sent: {
      saved: BrandingSaved;
      draft: BrandingDraft;
      image: ChosenPicture | null;
    }) => {
      const storedNow = sent.image === null ? null : await logo.store(sent.image);
      // The api found another type in the bytes: refused at the logo, and nothing is written.
      if (sent.image !== null && storedNow === null) return { logoRefused: true } as const;
      const draft =
        storedNow === null
          ? sent.draft
          : brandingEdit(sent.draft, { kind: 'logoStored', fileId: storedNow });
      const write = brandingWriteOf(sent.saved, draft);
      const answer = await repositories.settings.saveBranding(wireOf(write));
      if ('logoFileId' in write && answer.logoFileId !== write.logoFileId) throw new LogoNotSaved();
      queryClient.setQueryData(brandingKey, answer);
      queryClient.setQueryData<typeof profile.data>(profileKey, (held) =>
        held === undefined || answer.logoFileId === undefined
          ? held
          : { ...held, logoFileId: answer.logoFileId },
      );
      return { logoRefused: false } as const;
    },
    onSettled: () => {
      sending.current = false;
    },
    onSuccess: (result, sent) => {
      if (sent.image !== null) (result.logoRefused ? logo.refuse : logo.saved)(sent.image);
      if (result.logoRefused) return;
      logo.dismiss();
      // Only the draft the save sent is let go: an edit typed while it was out stays held.
      setTyped((held) => (held === null || held === sent.draft ? null : held));
    },
  });
  const { mutate, isPending, isError, error } = save;

  const reads = [branding, profile, registrations, companyRead, pack];
  const changed =
    saved !== null && draft !== null && (logo.chosen !== null || brandingChanged(saved, draft));
  // From what was last held, never from this render: two edits can land before the next one.
  const apply = (next: BrandingEdit) => {
    if (saved !== null) setTyped((was) => brandingEdit(was ?? brandingDraftOf(saved), next));
  };
  return {
    status: statusOf(
      saved !== null,
      reads.some((read) => read.isError),
      isError,
    ),
    saveFailure: isError && !(error instanceof LogoNotSaved) ? (error as DataError) : null,
    draft,
    standing: saved === null ? null : brandingStanding(saved, branding.data?.changed),
    changed,
    saving: isPending,
    company,
    cover: company === null || draft === null ? null : coverOf(company, draft, logo.picture),
    logo: logo.facts,
    chosenName,
    edit: apply,
    fields: fieldsOf(draft, apply),
    chooseLogo: (image) => {
      setChosenName(image.name ?? null);
      logo.choose(image);
    },
    removeLogo: () => {
      if (logo.chosen !== null) logo.saved(logo.chosen);
      logo.dismiss();
      apply({ kind: 'logoRemoved' });
    },
    discard: () => {
      if (logo.chosen !== null) logo.saved(logo.chosen);
      logo.dismiss();
      setTyped(null);
      save.reset();
    },
    save: () => {
      if (saved === null || draft === null || sending.current || !brandingSendable(draft)) return;
      sending.current = true;
      mutate({ saved, draft, image: logo.chosen });
    },
    retryRead: () => {
      for (const query of reads) {
        if (query.isError) void query.refetch();
      }
    },
  };
}

/** A failed save outranks the reads it followed; a read with no answer outranks the wait for the rest. */
function statusOf(read: boolean, unread: boolean, saveFailed: boolean): BrandingPage['status'] {
  if (read) return saveFailed ? 'save-failed' : 'ready';
  return unread ? 'unread' : 'loading';
}
