// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useSetupReady } from '../../src/react/use-setup-ready';
import { answeredCompanyFacts } from './branding-origin';
import { listeningOrigin } from './origin-wire';

/**
 * *You're ready*'s demo door through the real client (`SCR-M01-06`, `D376`): until the demo can be
 * read (`T-M01-029`) its *Try again* reads the company again — once per press, and never twice
 * while one read is still out.
 */
const reads = { company: 0, holdMs: 0 };

const listening = listeningOrigin((req, res) => {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (path === '/tenants/me' && req.method === 'GET') {
    reads.company += 1;
    setTimeout(() => answeredCompanyFacts(req, res), reads.holdMs);
    return;
  }
  answeredCompanyFacts(req, res);
});

afterEach(() => {
  cleanup();
  Object.assign(reads, { company: 0, holdMs: 0 });
});

async function mounted() {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useSetupReady(), { wrapper });
  await waitFor(() => expect(view.result.current.company.kind).toBe('ready'));
  return view;
}

describe("the demo door's Try again on You're ready", () => {
  it('reads the company once more', async () => {
    const view = await mounted();
    const before = reads.company;
    act(() => view.result.current.retryDemo());
    await waitFor(() => expect(reads.company).toBe(before + 1));
    await waitFor(() => expect(view.result.current.retrying).toBe(false));
    expect(view.result.current.company.kind).toBe('ready');
  });

  it('a second press while the read is out sends nothing', async () => {
    const view = await mounted();
    const before = reads.company;
    reads.holdMs = 200;
    act(() => {
      view.result.current.retryDemo();
      view.result.current.retryDemo();
    });
    await waitFor(() => expect(view.result.current.retrying).toBe(true));
    await waitFor(() => expect(view.result.current.retrying).toBe(false));
    expect(reads.company).toBe(before + 1);
  });
});
