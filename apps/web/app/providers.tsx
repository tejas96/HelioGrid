'use client';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { type Locale, setupI18n } from '@heliogrid/i18n';
import { I18nProvider } from '@lingui/react';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { API_URL } from '../lib/env';

/**
 * App-wide providers: the shared data layer (transport, repositories, session) plus the
 * Lingui catalog (per-USER language, D25 — switching re-renders immediately).
 * No `storage`: the browser owns the session cookie (see TokenStorage in @heliogrid/data).
 */
const i18nInstance = setupI18n('en');

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'en',
  setLocale: () => undefined,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function Providers({ children }: { children: ReactNode }) {
  /*
   * Built PER MOUNT, never at module scope. The session store holds mutable state in a
   * closure, and Next evaluates this module on the SERVER too, where module scope is
   * shared across every request — one visitor's session would be readable by the next.
   * Harmless while the walkthrough stub starts anonymous; a live identity leak the moment
   * a real SessionStore lands behind the same interface. Same reason DataProvider builds
   * its QueryClient in a useState initialiser.
   */
  const [dataLayer] = useState(() => createDataLayer({ baseUrl: API_URL }));
  const [locale, setLocaleState] = useState<Locale>('en');
  const setLocale = useCallback((l: Locale) => {
    i18nInstance.activate(l);
    setLocaleState(l);
  }, []);

  return (
    <DataProvider layer={dataLayer}>
      <I18nProvider i18n={i18nInstance}>
        <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
      </I18nProvider>
    </DataProvider>
  );
}
