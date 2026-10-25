'use client';
import { useBranding, useSession } from '@heliogrid/data/react';
import { opensSettingsRow, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { brandingPageWords, brandingWords, SHELL, settingsRowName } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type BrandingPart,
  type BrandingPreview,
  BrandingSettings,
  brandingDocumentOf,
  LeaveConfirm,
  useFormat,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { useImageFile } from '../../lib/use-image-file';
import { settingsRowPath } from '../settings';
import { BrandingFullSize } from './components/BrandingFullSize';
import { BrandingUnread } from './components/BrandingUnread';
import { RemoveLogoConfirm } from './components/RemoveLogoConfirm';

/**
 * Branding behind `More` on the web (`SCR-M01-18`, `M01-50`): the proposal cover or the link page
 * as the customer gets them, and the logo, colour and letterhead that change them. What is read,
 * edited and saved is `useBranding`'s; the page body is `BrandingSettings`. This holds the web's
 * own parts — the picker, the full-size view, the two confirms and the leave guard (D1 A). Only a
 * person whose presets open the row reaches it (`F7-48`).
 */
export function BrandingScreen() {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'branding')) notFound();
  return <BrandingIn />;
}

function BrandingIn() {
  const { t } = useI18n();
  const { pack, date } = useFormat();
  const router = useRouter();
  const guarded = useGuardedMove();
  const page = useBranding();
  const chooseLogoFile = useImageFile(page.chooseLogo);

  const [preview, setPreview] = useState<BrandingPreview>('proposal');
  const [part, setPart] = useState<BrandingPart>('logo');
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  const [removeAsked, setRemoveAsked] = useState(false);
  const [leaveAsked, setLeaveAsked] = useState<(() => void) | null>(null);
  useLeaveGuard(page.changed, (leave) => setLeaveAsked(() => leave));

  const facts = brandingDocumentOf(page.cover, pack.taxIdLabel);
  const words = brandingWords(t, {
    limits: page.logo.limits,
    companyName: facts.companyName,
    taxLabel: pack.taxIdLabel,
  });
  const { fieldErrors, ...said } = brandingPageWords(t, page, {
    date: (epochMs) => date(new Date(epochMs)),
  });
  const title = settingsRowName(t, 'branding');
  const closeLabel = t(SHELL.close);

  if (page.status === 'unread') {
    return <BrandingUnread title={title} words={words} onTryAgain={page.retryRead} />;
  }

  const draft = page.draft;
  const leave = () => {
    const move = leaveAsked;
    setLeaveAsked(null);
    page.discard();
    move?.();
  };
  return (
    <div className="hg-shell-page">
      <BrandingSettings
        words={words}
        loading={page.status === 'loading'}
        title={title}
        {...said}
        preview={preview}
        onPreview={setPreview}
        part={part}
        onPart={setPart}
        document={facts}
        unsaved={page.changed}
        onRetry={page.save}
        onChooseLogo={chooseLogoFile}
        onRemoveLogo={() => setRemoveAsked(true)}
        colour={draft?.brandColour ?? null}
        onColour={(value) => page.edit({ kind: 'colour', value })}
        letterheadFields={{ ...page.fields, ...fieldErrors }}
        onOpenFullSize={() => setFullSizeOpen(true)}
        onOpenProfile={() =>
          guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT.company_profile)))
        }
        {...(page.changed
          ? { act: { saving: page.saving, onSave: page.save, onDiscard: page.discard } }
          : {})}
      />
      <BrandingFullSize
        open={fullSizeOpen}
        onClose={() => setFullSizeOpen(false)}
        preview={preview}
        words={words}
        closeLabel={closeLabel}
        document={facts}
        colour={draft?.brandColour ?? null}
      />
      <RemoveLogoConfirm
        open={removeAsked}
        words={words}
        closeLabel={closeLabel}
        onRemove={() => {
          setRemoveAsked(false);
          page.removeLogo();
        }}
        onKeep={() => setRemoveAsked(false)}
      />
      <LeaveConfirm
        open={leaveAsked !== null}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onLeave={leave}
        onKeep={() => setLeaveAsked(null)}
      />
    </div>
  );
}
