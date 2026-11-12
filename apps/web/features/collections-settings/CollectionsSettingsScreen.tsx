'use client';
import { useCollectionsSettings } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { collectionsSettingsWords, settingsSavedLine } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CollectionsSettings, LargeTitle, useFormat } from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { settingsRowPath } from '../shell';

/**
 * How customers pay you, behind `More` on the web (`SCR-M11-04`): the owner at a desk, setting the
 * company's UPI ID once and testing it with a one-rupee QR from their own phone. The bank account
 * is the business profile's, edited there. What is read and saved is `useCollectionsSettings`'s,
 * the phone's too. Only a person whose presets open the row reaches it (`F7-48`).
 */
export function CollectionsSettingsScreen() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const screen = useCollectionsSettings();
  const room = useRef<HTMLDivElement>(null);
  if (!screen.allowed) notFound();
  const words = collectionsSettingsWords(
    t,
    { pack: format.pack, language: locale },
    { oneUnit: format.money('1') },
  );
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <LargeTitle title={words.title} />
      <CollectionsSettings
        read={screen.read}
        words={words}
        savedLine={settingsSavedLine(t, screen.standing, {
          date: (epochMs) => format.date(new Date(epochMs)),
        })}
        saving={screen.saving}
        failure={screen.failure}
        draft={screen.draft}
        onEdit={screen.edit}
        changed={screen.changed}
        onSave={() => void screen.save()}
        onEditBank={() => router.push(settingsRowPath(SETTINGS_SEGMENT.company_profile))}
        focusAfter={room}
      />
    </div>
  );
}
