import { useBranding } from '@heliogrid/data/react';
import { brandingPageWords, brandingWords, SHELL } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type BrandingPart,
  type BrandingPreview,
  BrandingSettings,
  brandingDocumentOf,
  useFormat,
} from '@heliogrid/ui';
import { useState } from 'react';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { useLeaveAsk } from '../shared/use-leave-ask';
import { ShellPage } from '../shell/components/ShellPage';
import { BrandingActBar, BrandingUnread } from './components/BrandingActBar';
import { BrandingLeaveAsk, RemoveLogoAsk } from './components/BrandingAsks';
import { BrandingFullSize } from './components/BrandingFullSize';
import { useBrandingActs } from './hooks/use-branding-acts';

/**
 * Branding behind `More` on the phone (`SCR-M01-18`, the 375 frames): the settings page's bar holds
 * the title and the way back, the shared page draws the stage and the editor, and while a change is
 * held the act bar stands in the pill's place (s18-m). What is read, edited and saved is
 * `useBranding`'s; this screen holds which preview, which part and which overlay is open.
 */
export function BrandingSettingsScreen() {
  const drillDown = useSettingsDrillDown('branding');
  const { t } = useI18n();
  const format = useFormat();
  const page = useBranding();
  const [preview, setPreview] = useState<BrandingPreview>('proposal');
  const [part, setPart] = useState<BrandingPart>('logo');
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  const [removeAsked, setRemoveAsked] = useState(false);
  const leave = useLeaveAsk(page.changed);
  const { save, pickLogo, openProfile } = useBrandingActs(page);

  const { taxIdLabel } = format.pack;
  const words = brandingWords(t, {
    limits: page.logo.limits,
    companyName: page.company?.companyName ?? '',
    taxLabel: taxIdLabel,
  });
  const { fieldErrors, ...said } = brandingPageWords(t, page, {
    date: (epochMs) => format.date(new Date(epochMs)),
  });
  const document = brandingDocumentOf(page.cover, taxIdLabel);
  const colour = page.draft?.brandColour ?? null;

  if (page.read.kind === 'failed') {
    return (
      <ShellPage inView="more" drillDown={drillDown}>
        <BrandingUnread words={words} onTryAgain={page.read.retry} />
      </ShellPage>
    );
  }

  const removeLogo = () => {
    setRemoveAsked(false);
    page.removeLogo();
  };
  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      foot={
        page.changed ? (
          <BrandingActBar
            words={words}
            saving={page.saving}
            onSave={save}
            onDiscard={page.discard}
          />
        ) : undefined
      }
    >
      <BrandingSettings
        words={words}
        read={page.read}
        {...said}
        preview={preview}
        onPreview={setPreview}
        part={part}
        onPart={setPart}
        document={document}
        unsaved={page.changed}
        onRetry={save}
        onChooseLogo={pickLogo}
        onPickLogo={pickLogo}
        onRemoveLogo={() => setRemoveAsked(true)}
        colour={colour}
        onColour={(hex) => page.edit({ kind: 'colour', value: hex })}
        letterheadFields={{ ...page.fields, ...fieldErrors }}
        onOpenFullSize={() => setFullSizeOpen(true)}
        onOpenProfile={openProfile}
      />
      <BrandingFullSize
        open={fullSizeOpen}
        preview={preview}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        colour={colour}
        onClose={() => setFullSizeOpen(false)}
      />
      <RemoveLogoAsk
        open={removeAsked}
        words={words}
        closeLabel={t(SHELL.close)}
        onKeep={() => setRemoveAsked(false)}
        onRemove={removeLogo}
      />
      <BrandingLeaveAsk words={words} leave={leave} onDiscard={page.discard} />
    </ShellPage>
  );
}
