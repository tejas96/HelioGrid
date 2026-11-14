// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LinkDeviceClass } from '../../src/customer-link/public-repository';
import { useCustomerLinkPage } from '../../src/react/use-customer-link-page';
import { NEWER_VERSION_ID, SERVED_VERSION_ID } from './proposals-fixtures';
import { provided, refusalWith, sell, TOKEN } from './proposals-origin';

/**
 * The customer's page through the real client (`F5-19`, `F5-27`, `F5-47`, `T-F5-007`): signed-out,
 * the open sent once by a page that drew for a visitor and never for a company's own person, and
 * every act answering the page as it now stands.
 */

const opens = () => sell.sent.filter((write) => write.path.endsWith('/opened'));

async function mounted(deviceClass: LinkDeviceClass | null = 'phone') {
  const view = renderHook(
    ({ drawnOn }: { drawnOn: LinkDeviceClass | null }) =>
      useCustomerLinkPage(TOKEN, { deviceClass: drawnOn }),
    { wrapper: provided(), initialProps: { drawnOn: deviceClass } },
  );
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

describe('the open — the product’s own evidence, sent by a drawn page alone', () => {
  it('a visitor’s drawn page sends one open with its device class, and never a second', async () => {
    sell.signedIn = false;
    const view = await mounted();

    await waitFor(() => expect(opens()).toHaveLength(1));
    expect(opens()[0]?.body).toEqual({ deviceClass: 'phone' });

    view.rerender({ drawnOn: 'phone' });
    act(() => view.result.current.viewed({ section: 'price', seconds: 12 }));
    await waitFor(() =>
      expect(sell.sent.some((write) => write.path.endsWith('/viewed'))).toBe(true),
    );
    expect(opens()).toHaveLength(1);
  });

  it('a company’s own person opening the link sends no open and no view time', async () => {
    sell.signedIn = true;
    const view = await mounted();

    act(() => view.result.current.viewed({ section: 'price', seconds: 12 }));
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(view.result.current.read.kind).toBe('ready');
    expect(sell.sent).toHaveLength(0);
  });

  it('nothing is sent before the page has drawn; the open goes once it has', async () => {
    sell.signedIn = false;
    const view = await mounted(null);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(opens()).toHaveLength(0);

    view.rerender({ drawnOn: 'desktop' });
    await waitFor(() => expect(opens()).toHaveLength(1));
    expect(opens()[0]?.body).toEqual({ deviceClass: 'desktop' });
  });

  it('a link that cannot serve records no open', async () => {
    sell.signedIn = false;
    sell.page = 'off';
    const view = await mounted();
    await new Promise((resolve) => setTimeout(resolve, 80));

    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.off).toEqual({ reason: 'revoked' });
    expect(opens()).toHaveLength(0);
  });
});

describe('the page and its acts', () => {
  it('an address no link has is gone — no company, no person, no retry to offer', async () => {
    sell.page = 'gone';
    const view = await mounted();

    expect(view.result.current.read.kind).toBe('failed');
    expect(view.result.current.unserved).toBe('gone');
  });

  it('Accept answers the page as it now stands', async () => {
    sell.signedIn = false;
    const view = await mounted();

    act(() => view.result.current.act({ kind: 'accept', versionId: SERVED_VERSION_ID }));
    await waitFor(() => expect(view.result.current.done).toBe('accept'));

    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.proposal?.answer?.kind).toBe('accept');
    expect(read.kind === 'ready' && read.value.proposal?.mayRespond).toBe(false);
    expect(view.result.current.acting).toBeNull();
  });

  it('a second press while an answer is out sends nothing', async () => {
    sell.signedIn = true;
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.act({ kind: 'accept', versionId: SERVED_VERSION_ID }));
    act(() =>
      view.result.current.act({ kind: 'decline', versionId: SERVED_VERSION_ID, reason: null }),
    );
    expect(view.result.current.acting).toBe('accept');
    await waitFor(() => expect(view.result.current.done).toBe('accept'));

    expect(sell.sent).toHaveLength(1);
  });

  it('an answer the server did not take says why, and the page is read again', async () => {
    sell.signedIn = true;
    sell.writes = [
      { status: 422, body: refusalWith('LINK_ACT_NOT_TAKEN', { refusal: 'already_answered' }) },
    ];
    const view = await mounted();
    sell.page = 'answered';

    act(() => view.result.current.act({ kind: 'accept', versionId: SERVED_VERSION_ID }));
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({
        kind: 'not_taken',
        act: 'accept',
        refusal: 'already_answered',
      }),
    );

    await waitFor(() => {
      const { read } = view.result.current;
      expect(read.kind === 'ready' && read.value.proposal?.answer?.kind).toBe('accept');
    });
    expect(view.result.current.done).toBeNull();
  });

  it('a refusal that reads the page onto a newer version gets that version’s PDF', async () => {
    const later = new Date(Date.now() + 5 * 60_000).toISOString();
    sell.pdf = { url: 'https://files.example/v1.pdf', expiresAt: later };
    sell.writes = [
      { status: 422, body: refusalWith('LINK_ACT_NOT_TAKEN', { refusal: 'version_superseded' }) },
    ];
    const view = await mounted();
    act(() => view.result.current.pdf.ask());
    await waitFor(() => expect(view.result.current.pdf.file).toMatchObject({ kind: 'made' }));

    sell.page = 'newer';
    sell.pdf = { url: 'https://files.example/v2.pdf', expiresAt: later };
    act(() => view.result.current.act({ kind: 'accept', versionId: SERVED_VERSION_ID }));
    await waitFor(() => {
      const { read } = view.result.current;
      expect(read.kind === 'ready' && read.value.proposal?.versionId).toBe(NEWER_VERSION_ID);
    });

    await waitFor(() =>
      expect(view.result.current.pdf.file).toMatchObject({
        kind: 'made',
        download: { url: 'https://files.example/v2.pdf' },
      }),
    );
  });
});
