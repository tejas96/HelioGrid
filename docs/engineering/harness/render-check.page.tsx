'use client';
import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { EXPECTED_COMPONENTS } from './expected-components';
import { FixtureRow } from './FixtureRow';
import { FIXTURES_A } from './fixtures/A';
import { FIXTURES_B } from './fixtures/B';
import { FIXTURES_C } from './fixtures/C';
import { FIXTURES_D } from './fixtures/D';
import { FIXTURES_E } from './fixtures/E';
import type { Fixture } from './types';

/**
 * `/render-check` — mounts every design-system component once, one per row, each fenced behind
 * its own error boundary (see FixtureRow). Screenshot fodder for a human, and machine-readable
 * for a script: `[data-ok]` / `[data-fail]` per component, counts on the summary header.
 *
 * The expected census is the FOLDER LIST under packages/ui/src/components
 * (see expected-components.ts), never a number typed here — a typed number cannot notice a gap.
 */

const FIXTURES: readonly Fixture[] = [
  ...FIXTURES_A,
  ...FIXTURES_B,
  ...FIXTURES_C,
  ...FIXTURES_D,
  ...FIXTURES_E,
].sort((a, b) => a.name.localeCompare(b.name));

const MISSING: readonly string[] = EXPECTED_COMPONENTS.filter(
  (name) => !FIXTURES.some((fixture) => fixture.name === name),
);

const pageStyle: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 'var(--sp-8) var(--sp-6) var(--sp-24)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sp-10)',
};

const summaryStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: 'var(--sp-4) var(--sp-5)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--surface-edge)',
  background: 'var(--surface-alt)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--fs-h3)',
  lineHeight: 'var(--lh-h3)',
  color: 'var(--text-heading)',
};

const lineStyle: CSSProperties = {
  margin: 'var(--sp-2) 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-body-sm)',
  color: 'var(--text-secondary)',
};

const missingStyle: CSSProperties = { ...lineStyle, color: 'var(--danger-text)' };

function Summary({ okCount, failCount }: { okCount: number; failCount: number }) {
  return (
    <header
      data-total={FIXTURES.length}
      data-ok-count={okCount}
      data-fail-count={failCount}
      data-missing={MISSING.join(',')}
      data-expected={EXPECTED_COMPONENTS.length}
      style={summaryStyle}
    >
      <h1 style={titleStyle}>Render check</h1>
      <p style={lineStyle}>
        {FIXTURES.length} fixtures · {okCount} ok · {failCount} failed ·{' '}
        {EXPECTED_COMPONENTS.length} component folders · {MISSING.length} without a fixture
      </p>
      {MISSING.length > 0 ? <p style={missingStyle}>No fixture: {MISSING.join(', ')}</p> : null}
    </header>
  );
}

export default function RenderCheckPage() {
  const [failed, setFailed] = useState<readonly string[]>([]);
  const [mounted, setMounted] = useState(false);

  /*
   * Fixtures mount in the BROWSER only. React error boundaries do not run during server
   * rendering — a throwing component would take the whole route down before any boundary
   * could fence it, which is precisely the failure this harness exists to survive.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  const onFail = useCallback((name: string) => {
    setFailed((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  return (
    <main style={pageStyle}>
      <Summary okCount={mounted ? FIXTURES.length - failed.length : 0} failCount={failed.length} />
      {mounted
        ? FIXTURES.map((fixture) => (
            <FixtureRow key={fixture.name} fixture={fixture} onFail={onFail} />
          ))
        : null}
    </main>
  );
}
