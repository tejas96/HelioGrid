'use client';
import { type Locale, setupI18n } from '@heliogrid/i18n';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

/**
 * App-wide providers: shared Lingui catalog (per-USER language, D25 — switching
 * re-renders immediately) + TanStack Query for the typed ts-rest client.
 * Locale persists to the user profile once auth screens land (Track A).
 */
const i18nInstance = setupI18n('en');
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18nInstance}>
        <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
