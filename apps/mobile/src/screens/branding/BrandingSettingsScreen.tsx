import { useBrandingScreen } from '@heliogrid/data/react';
import { brandingPageWords, brandingWords, SHELL } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { BrandingSettings, brandingDocumentOf, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { BrandingActBar, BrandingUnread } from './components/BrandingActBar';
import { BrandingLeaveAsk, RemoveLogoAsk } from './components/BrandingAsks';
import { BrandingFullSize } from './components/BrandingFullSize';
import { useBrandingActs } from './hooks/use-branding-acts';

/**
 * Branding behind `More` on the phone (`SCR-M01-18`, the 375 frames): the settings page's bar holds
 * the title and the way back, the shared page draws the stage and the editor, and while a change is
 * held the act bar stands in the pill's place (s18-m). What it draws is `useBrandingScreen`'s, the
 * web's too; the phone's own parts are the photo library, the keyboard and the way back.
 */
export function BrandingSettingsScreen() {
  const drillDown = useSettingsDrillDown('branding');
  const { t } = useI18n();
  const format = useFormat();
  const screen = useBrandingScreen();
  const { page } = screen;
  const { save, pickLogo, openProfile } = useBrandingActs(screen);
  /* A saved or discarded change takes the act bar away: the screen reader goes on to the page. */
  const body = useRef<View>(null);

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
            focusAfter={body}
          />
        ) : undefined
      }
    >
      <View ref={body}>
        <BrandingSettings
          words={words}
          read={page.read}
          {...said}
          preview={screen.preview}
          onPreview={screen.choosePreview}
          part={screen.part}
          onPart={screen.choosePart}
          document={document}
          unsaved={page.changed}
          onRetry={save}
          onChooseLogo={pickLogo}
          onPickLogo={pickLogo}
          onRemoveLogo={screen.askRemoveLogo}
          colour={colour}
          onColour={(hex) => page.edit({ kind: 'colour', value: hex })}
          letterheadFields={{ ...page.fields, ...fieldErrors }}
          onOpenFullSize={screen.openFullSize}
          onOpenProfile={openProfile}
        />
      </View>
      <BrandingFullSize
        open={screen.fullSizeOpen}
        preview={screen.preview}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        colour={colour}
        onClose={screen.closeFullSize}
      />
      <RemoveLogoAsk
        open={screen.removeAsked}
        words={words}
        closeLabel={t(SHELL.close)}
        onKeep={screen.keepLogo}
        onRemove={screen.removeLogo}
      />
      <BrandingLeaveAsk words={words} leave={screen.leave} />
    </ShellPage>
  );
}
