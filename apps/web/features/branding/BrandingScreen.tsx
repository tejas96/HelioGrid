'use client';
import { type BrandingScreen as Branding, useBrandingScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { brandingPageWords, brandingWords, SHELL, settingsRowName } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { BrandingSettings, brandingDocumentOf, LeaveConfirm, useFormat } from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { useImageFile } from '../../lib/use-image-file';
import { settingsRowPath } from '../settings';
import { BrandingFullSize } from './components/BrandingFullSize';
import { BrandingUnread } from './components/BrandingUnread';
import { RemoveLogoConfirm } from './components/RemoveLogoConfirm';

/**
 * Branding behind `More` on the web (`SCR-M01-18`, `M01-50`): the proposal cover or the link page
 * as the customer gets them, and the logo, colour and letterhead that change them. What it draws
 * is `useBrandingScreen`'s, the phone's too; the page body is `BrandingSettings`. The web's own
 * parts are the picker, the full-size view, the two confirms and the leave guard (D1 A). Only a
 * person whose presets open the row reaches it (`F7-48`).
 */
export function BrandingScreen() {
  const screen = useBrandingScreen();
  if (!screen.allowed) notFound();
  return <BrandingIn screen={screen} />;
}

function BrandingIn({ screen }: { screen: Branding }) {
  const { t } = useI18n();
  const { pack, date } = useFormat();
  const router = useRouter();
  const guarded = useGuardedMove();
  const { page } = screen;
  const chooseLogoFile = useImageFile(page.chooseLogo);
  useLeaveGuard(page.changed, screen.leave.ask);
  /* One page element through a failed read and the page that follows it: *Try again* leaves with
     the failure, and the focus goes here. */
  const frame = useRef<HTMLDivElement>(null);

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

  if (page.read.kind === 'failed') {
    return (
      <div ref={frame} tabIndex={-1} className="hg-shell-page hg-focus-target">
        <BrandingUnread
          title={title}
          words={words}
          onTryAgain={page.read.retry}
          focusAfter={frame}
        />
      </div>
    );
  }

  const draft = page.draft;
  return (
    <div ref={frame} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <BrandingSettings
        words={words}
        read={page.read}
        title={title}
        {...said}
        preview={screen.preview}
        onPreview={screen.choosePreview}
        part={screen.part}
        onPart={screen.choosePart}
        document={facts}
        unsaved={page.changed}
        onRetry={page.save}
        onChooseLogo={chooseLogoFile}
        onRemoveLogo={screen.askRemoveLogo}
        colour={draft?.brandColour ?? null}
        onColour={(value) => page.edit({ kind: 'colour', value })}
        letterheadFields={{ ...page.fields, ...fieldErrors }}
        onOpenFullSize={screen.openFullSize}
        onOpenProfile={() =>
          guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT.company_profile)))
        }
        {...(page.changed
          ? { act: { saving: page.saving, onSave: page.save, onDiscard: page.discard } }
          : {})}
      />
      <BrandingFullSize
        open={screen.fullSizeOpen}
        onClose={screen.closeFullSize}
        preview={screen.preview}
        words={words}
        closeLabel={closeLabel}
        document={facts}
        colour={draft?.brandColour ?? null}
      />
      <RemoveLogoConfirm
        open={screen.removeAsked}
        words={words}
        closeLabel={closeLabel}
        onRemove={screen.removeLogo}
        onKeep={screen.keepLogo}
      />
      <LeaveConfirm
        open={screen.leave.asking}
        title={words.leaveTitle}
        body={words.leaveBody}
        discard={words.leaveConfirm}
        keep={words.keepEditing}
        onLeave={screen.leave.leave}
        onKeep={screen.leave.stay}
      />
    </div>
  );
}
