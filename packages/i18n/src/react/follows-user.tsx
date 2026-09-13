import type { UiLanguage } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import type { I18nRuntime } from '../runtime';
import { HelioI18nProvider, type LocaleChange } from './provider';

/**
 * The mount follows the signed-in person's language (`F3-02`), and a language the person chooses
 * HERE is persisted through the one path both platforms share (`F3-04`).
 *
 * Both apps wrote this, and the two copies differed only by web's `<html lang>` half. It lives
 * here rather than in `packages/data` because a provider is i18n's, and the SESSION is passed in
 * rather than read here because `packages/i18n` may not import `data` (`architecture.md` §2:
 * allowed deps are contracts, domain and config). That boundary is why `follow` and `onChosen`
 * are props: each app still asks its own `useSession()`, which is two lines rather than twenty.
 */
export interface LanguageFollowsUserProps {
  /** The mount's runtime, built in a `useState` initialiser — never at module scope. */
  runtime: I18nRuntime;
  /** The signed-in person's own language, or null when nobody is signed in. */
  follow: UiLanguage | null;
  /** Persist a language the person chose on THIS mount. Never called for a followed change. */
  onChosen: (next: UiLanguage) => void;
  /**
   * What only web has: `<html lang>` and `dir`, which the server wrote for the source locale and
   * which assistive technology reads on every switch. Absent on the phone, which has no document.
   */
  onDocumentLanguage?: (change: LocaleChange) => void;
  children: ReactNode;
}

export function LanguageFollowsUser({
  runtime,
  follow,
  onChosen,
  onDocumentLanguage,
  children,
}: LanguageFollowsUserProps) {
  const onLocaleChange = useCallback(
    (change: LocaleChange) => {
      onDocumentLanguage?.(change);
      if (change.source === 'user') onChosen(change.locale);
    },
    [onChosen, onDocumentLanguage],
  );
  return (
    <HelioI18nProvider runtime={runtime} follow={follow} onLocaleChange={onLocaleChange}>
      {children}
    </HelioI18nProvider>
  );
}
