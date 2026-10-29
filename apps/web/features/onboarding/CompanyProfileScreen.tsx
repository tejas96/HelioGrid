'use client';
import { useCompanyProfile } from '@heliogrid/data/react';
import type { CompanyProfileLife } from '@heliogrid/domain';
import { COMPANY_PROFILE, companyProfileStepWords, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CompanyProfile, ToastHost, useFormat, useToasts } from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useRef } from 'react';
import { useImageFile } from '../../lib/use-image-file';

/**
 * The company profile on the web (`SCR-M01-05`): the third setup step, drawn by the inside
 * group's gate for an owner whose company still owes it (`M01-24`), or the settings page behind
 * `More` (`M01-29`), which only a person whose presets open its row reaches (`F7-48`). What is
 * read, typed and saved, and who may open it, is `useCompanyProfile`'s, the phone's too, and every
 * word is `companyProfileStepWords`'. A chosen logo is read from its file by `useImageFile`. This
 * composes.
 */
export function CompanyProfileScreen({ life }: { life: CompanyProfileLife }) {
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const toasts = useToasts();
  const step = useCompanyProfile(life, {
    onSaved: () => toasts.push({ tone: 'neutral', title: t(COMPANY_PROFILE.saved) }),
  });
  const chooseLogoFile = useImageFile(step.chooseLogo);
  /* A closed toast hands the keyboard back to the page it spoke about. */
  const page = useRef<HTMLDivElement>(null);
  if (!step.allowed) notFound();
  const profile = (
    <CompanyProfile
      life={life}
      words={companyProfileStepWords(t, locale, step, pack)}
      values={step.values}
      open={step.open}
      onOpen={step.openPart}
      onEdit={step.edit}
      onChooseSegment={step.chooseSegment}
      onDeclareSize={step.declareSize}
      saving={step.saving}
      onSave={step.save}
      read={step.read}
      onContinueWithout={step.continueWithout}
      logoPicture={step.logoPicture}
      onChooseLogo={chooseLogoFile}
    />
  );
  // Inside the shell the page takes the shell's region, as every page behind `More` does; a save
  // that lands there says so (`SCR-M01-05` ruling 59).
  if (life !== 'settings') return profile;
  return (
    <div ref={page} tabIndex={-1} className="hg-shell-page hg-focus-target">
      {profile}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={page}
      />
    </div>
  );
}
