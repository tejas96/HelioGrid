'use client';
import { UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import {
  createI18nRuntime,
  disclosureWords,
  type I18nRuntime,
  provenanceWords,
} from '@heliogrid/i18n';
import { HelioI18nProvider, type LocaleChange, useI18n } from '@heliogrid/i18n/react';
import {
  DisclosureWordsProvider,
  LoadingBars,
  MarketProvider,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { type ReactNode, type RefObject, useCallback, useRef } from 'react';

/**
 * The customer's page reads in the READER's language (`F5-08`) — the contact's, else the customer's,
 * else the company's — never the browser's and never a signed-in rep's. So the page owns its own
 * language mount, apart from the app's: its own runtime, following the language the page's read
 * names, with the market's formats and the honesty labels' words bound to it.
 *
 * Until the reader's catalog has come, the page draws its loading bars rather than another
 * language's words: a Marathi reader never meets a flash of English. A language the reader picks
 * on the page is theirs for the rest of the visit: the page's read no longer moves it.
 */
export function CustomerReader({
  language,
  children,
}: {
  /** The reader's language once the page has answered; `null` before, and the mount then rests. */
  language: UiLanguage | null;
  children: ReactNode;
}) {
  /* One runtime per mount, built once and never at module scope (`packages/i18n/CLAUDE.md`). */
  const mount = useRef<I18nRuntime | null>(null);
  mount.current ??= createI18nRuntime(UI_SOURCE_LOCALE);
  /* Set by the switch itself, before the words it moves draw again: a ref, not state. */
  const chosen = useRef(false);
  const onLocaleChange = useCallback(({ locale, meta, source }: LocaleChange) => {
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    if (source === 'user') chosen.current = true;
  }, []);
  return (
    <HelioI18nProvider
      runtime={mount.current}
      follow={chosen.current ? undefined : (language ?? undefined)}
      onLocaleChange={onLocaleChange}
    >
      <ReaderWords awaiting={language} chosen={chosen}>
        {children}
      </ReaderWords>
    </HelioI18nProvider>
  );
}

function ReaderWords({
  awaiting,
  chosen,
  children,
}: {
  awaiting: UiLanguage | null;
  chosen: RefObject<boolean>;
  children: ReactNode;
}) {
  const { locale, t } = useI18n();
  /* The followed catalog is still on its way: hold the words, not the wrong ones. Once the reader
     picks a language nothing is followed, so nothing is awaited. */
  const arriving = !chosen.current && awaiting !== null && awaiting !== locale;
  return (
    <MarketProvider language={locale}>
      <ProvenanceWordsProvider value={provenanceWords(t)}>
        <DisclosureWordsProvider value={disclosureWords(t)}>
          {arriving ? (
            <div className="hg-cust-arriving" aria-busy="true">
              <LoadingBars inBusyRegion bars={['panel', 'row', 'row', 'row']} />
            </div>
          ) : (
            children
          )}
        </DisclosureWordsProvider>
      </ProvenanceWordsProvider>
    </MarketProvider>
  );
}
