'use client';
import type { OnboardingProgress, Tenant } from '@heliogrid/contracts';
import {
  announcesSave,
  COMPANY_PROFILE_UNREAD,
  type CompanyLogoCaptureFacts,
  type CompanyProfileField,
  type CompanyProfileLife,
  type CompanyProfilePart,
  type CompanyProfileStored,
  type CompanyProfileValues,
  type CompanyProfileView,
  companyProfileEdited,
  companyProfileOpenAtRead,
  companyProfileSaveOf,
  companyProfileValuesAtRead,
  companyProfileView,
  registrationsChanged,
  type TaxPack,
  type TenantSegment,
  taxPackOf,
  whatYouSellAnsweredBy,
  whatYouSellUnanswered,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { type ChosenPicture, useCompanyLogo } from './use-company-logo';
import { useSession } from './use-session';

/** The company profile in one of its lives, as both screens consume it (Law 11). */
export interface CompanyProfileStep extends CompanyProfileView {
  readonly life: CompanyProfileLife;
  /** The reads are still out, they answered, one got no answer, or the last save did not land. */
  readonly status: 'loading' | 'ready' | 'unread' | 'save-failed';
  readonly values: CompanyProfileValues;
  readonly open: CompanyProfilePart | null;
  /** The profile was read without the two answers of the step before. */
  readonly arrivedUndeclared: boolean;
  readonly saving: boolean;
  readonly logo: CompanyLogoCaptureFacts;
  /** The chosen image, or the stored logo's; `null` while there is neither. */
  readonly logoPicture: string | null;
  /** Checks the image against the logo's limits and holds it for the save. */
  chooseLogo(image: ChosenPicture): void;
  openPart(part: CompanyProfilePart | null): void;
  edit(field: CompanyProfileField, typed: string): void;
  chooseSegment(segment: TenantSegment): void;
  declareSize(kwp: number): void;
  /**
   * Stores a chosen logo, writes the profile, then the registrations when they changed; in setup,
   * then records the step before when this save answers it, then its own step. Settings records
   * no step: its company passed setup long ago, and a save there must not move it.
   */
  save(): void;
  /** Asks again for the reads that got no answer. */
  retryRead(): void;
  /** Moves on with nothing saved; the next sign-in asks for the step again. */
  continueWithout(): void;
}

/** What a save came to: the logo refused before anything was written, or the progress setup moved to. */
interface Saved {
  readonly logoRefused: boolean;
  readonly progress: OnboardingProgress | null;
}

interface Draft {
  readonly values: CompanyProfileValues;
  readonly open: CompanyProfilePart | null;
}

/** Neither a read nor the save waits for a connection: held back offline, each would spin with no end. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY, networkMode: 'always' } as const;

/**
 * `SCR-M01-05`'s reads and its way on. The tax rules are the api's own pack, so the field's live
 * check and the api's check of the save cannot disagree (`M01-25`). Nothing is written before the
 * act; each write replaces its record whole, so a save that failed half way is sent again whole.
 * The step's answer replaces the progress `useLanding` holds, which is what moves the person on.
 * In settings nothing moves, so `onSaved` is told when a save lands and wrote — the screen says so
 * (`SCR-M01-05` ruling 59); a refused logo wrote nothing and is not a save.
 */
export function useCompanyProfile(
  life: CompanyProfileLife,
  { onSaved }: { onSaved?: () => void } = {},
): CompanyProfileStep {
  const { user, putOffSetup } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const profileKey = queryKeys.settings.businessProfile(tenantId);
  const registrationsKey = queryKeys.settings.taxRegistrations(tenantId);
  const progressKey = queryKeys.setup.progress(tenantId);

  const profile = useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => repositories.settings.businessProfile(signal),
    ...ASKED_ONCE,
  });
  const registrations = useQuery({
    queryKey: registrationsKey,
    queryFn: ({ signal }) => repositories.settings.taxRegistrations(signal),
    ...ASKED_ONCE,
  });
  // The shell's key: the home that opens after the step does not ask for the company again.
  const company = useQuery({
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }) => repositories.tenant.me(signal),
    networkMode: 'always',
  });
  const marketCode = company.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
    ...ASKED_ONCE,
  });

  const stored = useMemo<CompanyProfileStored | null>(
    () =>
      profile.data === undefined || registrations.data === undefined
        ? null
        : { profile: profile.data, registrations: registrations.data.registrations },
    [profile.data, registrations.data],
  );
  const tax = useMemo(
    () => (pack.data === undefined ? null : taxPackOf(pack.data.tax)),
    [pack.data],
  );
  const read = stored !== null && tax !== null ? { stored, tax } : null;
  // Fixed at the first read: a save replaces the profile held here before its last write lands,
  // and an answer the owner took out on this screen never arrived missing.
  const arrivedUndeclared = useRef<boolean | null>(null);
  if (arrivedUndeclared.current === null && stored !== null) {
    arrivedUndeclared.current = whatYouSellUnanswered(stored.profile).length > 0;
  }
  // A pack that answers without tax rules is no answer: the registration could not be checked.
  const unread =
    profile.isError ||
    registrations.isError ||
    company.isError ||
    pack.isError ||
    (pack.data !== undefined && tax === null);

  const [typed, setTyped] = useState<Draft | null>(null);
  const asRead = useMemo<Draft | null>(
    () =>
      stored === null || tax === null
        ? null
        : {
            values: companyProfileValuesAtRead(stored, tax),
            open: companyProfileOpenAtRead(stored, tax, life),
          },
    [stored, tax, life],
  );
  const draft = typed ?? asRead;
  const logo = useCompanyLogo(tenantId, profile.data?.logoFileId);

  const save = useMutation({
    networkMode: 'always',
    mutationFn: async (sent: {
      values: CompanyProfileValues;
      stored: CompanyProfileStored;
      tax: TaxPack;
      logo: ChosenPicture | null;
    }): Promise<Saved> => {
      const logoStoredNow = sent.logo === null ? null : await logo.store(sent.logo);
      // The api found another type in the bytes: the image is refused at its field and nothing is
      // written, or the same save would fail for ever.
      if (sent.logo !== null && logoStoredNow === null)
        return { logoRefused: true, progress: null };
      const writes = companyProfileSaveOf(sent.values, sent.stored, sent.tax, logoStoredNow);
      const saved = await repositories.settings.saveBusinessProfile(writes.profile);
      queryClient.setQueryData(profileKey, saved);
      // The shell's company, which the home and *You're ready* name, takes the saved name at once.
      queryClient.setQueryData<Tenant>(queryKeys.shell.tenant(tenantId), (held) =>
        held === undefined ? held : { ...held, companyName: saved.companyName },
      );
      if (registrationsChanged(sent.stored.registrations, writes.registrations)) {
        const list = await repositories.settings.saveTaxRegistrations({
          registrations: [...writes.registrations],
        });
        queryClient.setQueryData(registrationsKey, list);
      }
      if (life === 'settings') return { logoRefused: false, progress: null };
      const progress = queryClient.getQueryData<OnboardingProgress>(progressKey);
      if (whatYouSellAnsweredBy(writes.profile, progress?.steps ?? {})) {
        await repositories.onboarding.recordStep('what_you_sell', 'completed');
      }
      return {
        logoRefused: false,
        progress: await repositories.onboarding.recordStep('business_profile', writes.step),
      };
    },
    onSuccess: (saved, sent) => {
      if (sent.logo !== null) (saved.logoRefused ? logo.refuse : logo.saved)(sent.logo);
      if (saved.progress !== null) queryClient.setQueryData(progressKey, saved.progress);
      if (announcesSave(life, saved.logoRefused)) onSaved?.();
    },
  });
  const { mutate, isPending, isError } = save;

  const held = read !== null && draft !== null ? { ...read, ...draft } : null;
  // From what was last held, never from this render: two reports can land before the next one.
  const change = (next: (draft: Draft) => Draft) => {
    if (asRead !== null) setTyped((was) => next(was ?? asRead));
  };
  const edited = (next: (values: CompanyProfileValues) => CompanyProfileValues) =>
    change(({ values, open }) => ({ values: next(values), open }));
  return {
    life,
    status: statusOf(held !== null, unread, isError),
    values: held?.values ?? COMPANY_PROFILE_UNREAD.values,
    open: held?.open ?? null,
    ...(held === null
      ? COMPANY_PROFILE_UNREAD.view
      : companyProfileView(held.values, held.stored, held.tax, logo.chosen !== null)),
    arrivedUndeclared: arrivedUndeclared.current ?? false,
    saving: isPending,
    logo: logo.facts,
    logoPicture: logo.picture,
    chooseLogo: logo.choose,
    openPart: (part) => change(({ values }) => ({ values, open: part })),
    edit: (field, text) => edited((values) => companyProfileEdited(values, field, text)),
    chooseSegment: (segment) => edited((values) => ({ ...values, segment })),
    declareSize: (kwp) => edited((values) => ({ ...values, typicalSystemKwp: kwp })),
    save: () => {
      if (held !== null && !isPending) mutate({ ...held, logo: logo.chosen });
    },
    retryRead: () => {
      for (const query of [profile, registrations, company, pack]) {
        if (query.isError) void query.refetch();
      }
      if (pack.data !== undefined && tax === null) void pack.refetch();
    },
    // Settings sits in no corridor: there is no step to put off.
    continueWithout: () => {
      if (life === 'setup') putOffSetup('business_profile');
    },
  };
}

/** A failed save outranks the reads it followed; a read with no answer outranks the wait for the rest. */
function statusOf(
  read: boolean,
  unread: boolean,
  saveFailed: boolean,
): CompanyProfileStep['status'] {
  if (read) return saveFailed ? 'save-failed' : 'ready';
  return unread ? 'unread' : 'loading';
}
