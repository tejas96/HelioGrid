'use client';
import { type BrandingPart, type BrandingPreview, opensSettingsRow } from '@heliogrid/domain';
import { useState } from 'react';
import { type BrandingPage, useBranding } from './use-branding';
import { type LeaveAsk, useLeaveAsk } from './use-leave-ask';
import { useSession } from './use-session';

/**
 * Branding (`SCR-M01-18`, `M01-50`) as both screens draw it, assembled once (Law 11, `F7-30`): the
 * page as read, edited and saved, which preview and which part are shown, the full-size view, the
 * logo's remove ask and the ask before leaving a held change.
 */
export interface BrandingScreen {
  /** The person's presets open the Branding row (`F7-48`); the web answers not found without. */
  readonly allowed: boolean;
  readonly page: BrandingPage;
  readonly preview: BrandingPreview;
  readonly part: BrandingPart;
  readonly fullSizeOpen: boolean;
  readonly removeAsked: boolean;
  readonly leave: LeaveAsk;
  choosePreview(next: BrandingPreview): void;
  choosePart(next: BrandingPart): void;
  openFullSize(): void;
  closeFullSize(): void;
  askRemoveLogo(): void;
  keepLogo(): void;
  /** Clears the logo in the draft, which raises the act bar; nothing is stored until *Save*. */
  removeLogo(): void;
}

export function useBrandingScreen(): BrandingScreen {
  const { user } = useSession();
  const page = useBranding();
  const [preview, setPreview] = useState<BrandingPreview>('proposal');
  const [part, setPart] = useState<BrandingPart>('logo');
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  const [removeAsked, setRemoveAsked] = useState(false);
  const leave = useLeaveAsk(page.discard);
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'branding'),
    page,
    preview,
    part,
    fullSizeOpen,
    removeAsked,
    leave,
    choosePreview: setPreview,
    choosePart: setPart,
    openFullSize: () => setFullSizeOpen(true),
    closeFullSize: () => setFullSizeOpen(false),
    askRemoveLogo: () => setRemoveAsked(true),
    keepLogo: () => setRemoveAsked(false),
    removeLogo: () => {
      setRemoveAsked(false);
      page.removeLogo();
    },
  };
}
