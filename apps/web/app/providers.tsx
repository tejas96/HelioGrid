'use client';
import type { UiLanguage } from '@heliogrid/contracts';
import { UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import {
  createFormsValidationMessage,
  createI18nRuntime,
  type LanguageMeta,
} from '@heliogrid/i18n';
import { HelioI18nProvider } from '@heliogrid/i18n/react';
import { type ReactNode, useCallback, useState } from 'react';
import { API_URL } from '../lib/env';

/**
 * App-wide providers: the shared data layer (transport, repositories, session) plus the
 * Lingui catalog (per-USER language, D25 — switching re-renders immediately).
 * No `storage`: the browser owns the session cookie (see TokenStorage in @heliogrid/data).
 */
export function Providers({ children }: { children: ReactNode }) {
  /*
   * Built PER MOUNT, never at module scope. The session store holds mutable state in a
   * closure, and Next evaluates this module on the SERVER too, where module scope is
   * shared across every request — one visitor's session would be readable by the next.
   * Harmless while the walkthrough stub starts anonymous; a live identity leak the moment
   * a real SessionStore lands behind the same interface. Same reason DataProvider builds
   * its QueryClient in a useState initialiser.
   *
   * The i18n runtime is here for the SAME reason and used to be the counter-example: a
   * module-level `setupI18n('en')` meant one shared, mutable active locale for every
   * concurrent server render.
   */
  const [dataLayer] = useState(() => createDataLayer({ baseUrl: API_URL }));
  const [i18nRuntime] = useState(() => {
    const runtime = createI18nRuntime(UI_SOURCE_LOCALE);
    /*
     * zod's error map is a PROCESS GLOBAL, so it cannot be per-request. Installing it here
     * binds it to THIS mount's translator, which is correct on the client: one mount has
     * one active language. Server-side translation uses createTranslator() and never this
     * map (packages/i18n/src/copy/validation.ts states the boundary).
     */
    installFormsErrorMap(createFormsValidationMessage(runtime.t));
    return runtime;
  });

  // `<html lang>` is written by the server in layout.tsx; a client switch has to move it,
  // or assistive technology keeps announcing the previous language's pronunciation rules.
  const syncDocumentLanguage = useCallback(
    ({ meta }: { locale: UiLanguage; meta: LanguageMeta }) => {
      document.documentElement.lang = meta.tag;
      document.documentElement.dir = meta.dir;
    },
    [],
  );

  return (
    <DataProvider layer={dataLayer}>
      <HelioI18nProvider runtime={i18nRuntime} onLocaleChange={syncDocumentLanguage}>
        {children}
      </HelioI18nProvider>
    </DataProvider>
  );
}
