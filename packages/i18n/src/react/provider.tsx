'use client';
import type { UiLanguage } from '@heliogrid/contracts';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { LANGUAGE_META, type LanguageMeta } from '../languages';
import type { I18nRuntime } from '../runtime';

/** The one language surface a screen sees, identical on web and React Native. */
export interface I18nControls {
  locale: UiLanguage;
  meta: LanguageMeta;
  /** Async on BOTH platforms — the catalog is fetched. Never a synchronous variant on one. */
  setLocale(next: UiLanguage): Promise<void>;
  t(id: string, values?: Record<string, unknown>): string;
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
   * Runs after a successful switch — where an app syncs `<html lang>` or persists a choice.
   * One object rather than two positional arguments: a listener that needs only the metadata
   * can destructure it, instead of taking a parameter it ignores in the first position.
   */
  onLocaleChange?: (change: { locale: UiLanguage; meta: LanguageMeta }) => void;
  children: ReactNode;
}

/**
 * Wraps Lingui's own provider so both platforms get ONE API. Every switch goes through
 * here: a screen never calls `i18n.activate` itself, because a screen cannot know whether
 * the catalog it is activating has been fetched.
 */
export function HelioI18nProvider({ runtime, onLocaleChange, children }: HelioI18nProviderProps) {
  const [locale, setLocaleState] = useState<UiLanguage>(runtime.locale);

  const setLocale = useCallback(
    async (next: UiLanguage) => {
      await runtime.setLocale(next);
      setLocaleState(next);
      onLocaleChange?.({ locale: next, meta: LANGUAGE_META[next] });
    },
    [runtime, onLocaleChange],
  );

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
