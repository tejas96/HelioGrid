'use client';
import { LOCALES } from '@heliogrid/i18n';
import { Trans } from '@lingui/react';
import Link from 'next/link';
import { useLocale } from './providers';

/** Scaffold landing — proves the shared catalog + macro chain on web (per-user language, D25). */
export default function Home() {
  const { locale, setLocale } = useLocale();
  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <section className="hg-card w-full max-w-md">
        <p className="hg-overline">HelioGrid</p>
        <h1 className="hg-h1">
          <Trans id="Foundations ready" />
        </h1>
        <p className="hg-muted">
          <Trans id="Field-first CRM, surveys and design for solar EPCs." />
        </p>
        <Link href="/design" className="hg-btn-primary">
          Open the design reference
        </Link>
        <fieldset className="hg-seg" aria-label="Language">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              className="hg-seg-chip"
              aria-pressed={locale === l}
              onClick={() => setLocale(l)}
            >
              {l}
            </button>
          ))}
        </fieldset>
      </section>
    </main>
  );
}
