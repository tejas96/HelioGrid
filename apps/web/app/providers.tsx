'use client';
import { UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider, useSession } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import { createFormsValidationMessage, createI18nRuntime, type I18nRuntime } from '@heliogrid/i18n';
import { LanguageFollowsUser, type LocaleChange } from '@heliogrid/i18n/react';
import { MarketProvider, PortalHost } from '@heliogrid/ui';
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
   * A module-scope store would be a live identity leak, because the store asks the server
   * who the cookies belong to. Same reason DataProvider builds its QueryClient in a useState
   * initialiser.
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

  return (
    <DataProvider layer={dataLayer}>
      <SessionLanguage runtime={i18nRuntime}>
        {/* The launch market until a tenant's pack is read — the door runs before any tenant exists
            — and the ONE portal host every menu, sheet and modal escapes its screen through. */}
        <MarketProvider>
          <PortalHost>{children}</PortalHost>
        </MarketProvider>
      </SessionLanguage>
    </DataProvider>
  );
}

/**
 * Inside `DataProvider`, because the language the mount follows is the signed-in person's
 * (`F3-02`) and only the session knows who that is. The FOLLOW is `@heliogrid/i18n/react`'s and
 * shared with the phone; what stays here is web's alone — `<html lang>` and `dir`, which the
 * server wrote for the source locale and which assistive technology reads on every switch.
 */
function SessionLanguage({ runtime, children }: { runtime: I18nRuntime; children: ReactNode }) {
  const { user, setInterfaceLanguage } = useSession();
  const onDocumentLanguage = useCallback(({ meta }: LocaleChange) => {
    document.documentElement.lang = meta.tag;
    document.documentElement.dir = meta.dir;
  }, []);
  return (
    <LanguageFollowsUser
      runtime={runtime}
      follow={user?.interfaceLanguage ?? null}
      onChosen={(next) => void setInterfaceLanguage(next)}
      onDocumentLanguage={onDocumentLanguage}
    >
      {children}
    </LanguageFollowsUser>
  );
}
