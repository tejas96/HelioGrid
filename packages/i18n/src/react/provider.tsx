'use client';
import type { UiLanguage } from '@heliogrid/contracts';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LANGUAGE_META, type LanguageMeta } from '../languages';
import type { I18nRuntime } from '../runtime';

/** The one language surface a screen sees, identical on web and React Native. */
export interface I18nControls {
  locale: UiLanguage;
  meta: LanguageMeta;
  /** Async on BOTH platforms — the catalog is fetched. Never a synchronous variant on one. */
  setLocale(next: UiLanguage): Promise<void>;
  t: I18nRuntime['t'];
}

/** Why the language moved: the person chose it on this mount, or the mount followed their choice. */
export type LocaleChangeSource = 'user' | 'follow';

export interface LocaleChange {
  locale: UiLanguage;
  meta: LanguageMeta;
  source: LocaleChangeSource;
}

const I18nControlsContext = createContext<I18nControls | null>(null);

export interface HelioI18nProviderProps {
  /**
   * The mount's runtime, built in a `useState` initialiser. Passed IN rather than created
   * here so the app can also hand it to `installFormsErrorMap` — zod's error map is a
   * process global and cannot come out of a React context.
   */
  runtime: I18nRuntime;
  /**
   * The language this mount FOLLOWS (`F3-02`): the signed-in person's own, from the session,
   * or null while nobody is signed in. When it CHANGES to a language other than the active
   * one the provider switches — so "the app follows the person" is written here once, never
   * as an effect in each app root (Law 11). A value equal to the active language is a no-op,
   * which is what keeps persist → session → follow from looping; and only a change of the
   * prop acts, so a person's own switch is never undone by the value it will shortly become.
   * Back to null — a sign-out — returns the mount to the language it rests in: nobody's language
   * is the device's, or the one chosen on the door, never the previous person's.
   */
  follow?: UiLanguage | null;
  /**
   * The device's own language where the set holds it (`F3-03`): what the mount rests in until a
   * language is chosen on the door. Read once, at mount. Omitted, the mount rests in the
   * language its runtime started with.
   */
  device?: UiLanguage;
  /**
   * Runs after every successful switch, saying why it happened — where an app syncs
   * `<html lang>` (every switch) or persists a choice (`source: 'user'` alone).
   */
  onLocaleChange?: (change: LocaleChange) => void;
  children: ReactNode;
}

/**
 * Wraps Lingui's own provider so both platforms get ONE API. Every switch goes through
 * here: a screen never calls `i18n.activate` itself, because a screen cannot know whether
 * the catalog it is activating has been fetched. The children never remount on a switch —
 * the catalog swaps on the same instance and Lingui re-renders what reads it — which is what
 * keeps a half-typed form intact across the change (`F3-04`).
 */
export function HelioI18nProvider({
  runtime,
  follow,
  device,
  onLocaleChange,
  children,
}: HelioI18nProviderProps) {
  const [locale, setLocaleState] = useState<UiLanguage>(runtime.locale);

  const announce = useCallback(
    (next: UiLanguage, source: LocaleChangeSource) => {
      setLocaleState(next);
      onLocaleChange?.({ locale: next, meta: LANGUAGE_META[next], source });
    },
    [onLocaleChange],
  );

  // The last `follow` value acted on, so only a CHANGE of the prop moves the language — a
  // re-render with the same value, or the person's own switch, must never trigger it. And the
  // language this mount rests in while it follows no one — the device's, then whatever was chosen
  // on the door: where it returns when there is no one to follow, so a shared device's sign-in
  // screen never keeps the previous person's language.
  const followed = useRef<UiLanguage | null | undefined>(undefined);
  const resting = useRef<UiLanguage>(device ?? runtime.locale);

  const setLocale = useCallback(
    async (next: UiLanguage) => {
      await runtime.setLocale(next);
      // A follow that overtook this switch owns the mount now: nothing was chosen.
      if (runtime.locale !== next) return;
      if (followed.current === null || followed.current === undefined) resting.current = next;
      announce(next, 'user');
    },
    [runtime, announce],
  );

  useEffect(() => {
    if (follow === followed.current) return;
    followed.current = follow;
    if (follow === undefined) return;
    const target = follow ?? resting.current;
    if (target === runtime.locale) {
      // Nothing to switch, but the runtime is still told: a catalog asked for earlier and still
      // loading must not arrive after this and move the mount off the person's language.
      void runtime.setLocale(target);
      return;
    }
    runtime
      .setLocale(target)
      .then(() => {
        // Announce only if no later `follow` overtook this one. A ref, not a cleanup flag: React
        // re-runs an effect it just cleaned up in Strict Mode, and a flag would swallow the switch.
        // Nor if the person chose another language while this one loaded: the runtime kept theirs.
        if (followed.current === follow && runtime.locale === target) announce(target, 'follow');
      })
      // The runtime keeps the language it had; nothing here is the person's to see (`F3-05`).
      .catch(() => undefined);
  }, [follow, runtime, announce]);

  const controls = useMemo<I18nControls>(
    () => ({ locale, meta: LANGUAGE_META[locale], setLocale, t: runtime.t }),
    [locale, setLocale, runtime],
  );

  return (
    <LinguiProvider i18n={runtime.i18n}>
      <I18nControlsContext.Provider value={controls}>{children}</I18nControlsContext.Provider>
    </LinguiProvider>
  );
}

export function useI18n(): I18nControls {
  const controls = useContext(I18nControlsContext);
  if (!controls) throw new Error('useI18n must be used inside <HelioI18nProvider>.');
  return controls;
}

/** For hooks and event handlers, where a `<Trans>` element is not what you need. */
export function useTranslate(): I18nControls['t'] {
  return useI18n().t;
}
