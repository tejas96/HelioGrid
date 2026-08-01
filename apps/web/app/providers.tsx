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
const dataLayer = createDataLayer({ baseUrl: API_URL });

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'en',
  setLocale: () => undefined,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function Providers({ children }: { children: ReactNode }) {
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
