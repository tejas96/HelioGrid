// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalLinksScreen } from '../../src/react/use-proposal-links-screen';
import { LINK, links } from './links-origin';
import { PROPOSAL } from './proposals-fixtures';
import { provided, refusalWith, sell } from './proposals-origin';

/**
 * A deal's named links through the real client (`SCR-M06-20`, `F5-30`, `F5-76`): Turn off is said
 * only once the server turned the link off; a new link keeps its retry key across a retry and takes
 * a fresh one for a new ask; a new address goes to the clipboard.
 */

const ANIL = { contactId: null, label: 'Anil at the office' };

async function mounted() {
  const copied: string[] = [];
  const moves = {
    copy: (text: string, done: () => void) => {
      copied.push(text);
      done();
    },
  };
  const view = renderHook(() => useProposalLinksScreen(PROPOSAL, moves), { wrapper: provided() });
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return { view, copied };
}

const statusOf = (screen: ReturnType<typeof useProposalLinksScreen>, id: string) =>
  screen.read.kind === 'ready'
    ? screen.read.value.links.find((one) => one.id === id)?.status
    : undefined;

describe('Turn off — said once the link is off, never before', () => {
  it('a refused Turn off says nothing landed, shows why at the link, and the link reads active', async () => {
    sell.writes = [
      { status: 422, body: refusalWith('LINK_ACT_REFUSED', { refusal: 'already_revoked' }) },
    ];
    const { view } = await mounted();

    act(() => view.result.current.askRevoke(LINK));
    act(() => view.result.current.revoke(LINK));
    expect(view.result.current.said).toBeNull();
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({
        linkId: LINK,
        failure: { kind: 'refused', refusal: 'already_revoked' },
      }),
    );

    expect(view.result.current.said).toBeNull();
    expect(statusOf(view.result.current, LINK)).toBe('active');
  });

  it('a Turn off that lands is said with the link’s name, and the link reads off', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const { view } = await mounted();

    act(() => view.result.current.revoke(LINK));
    expect(view.result.current.said).toBeNull();
    expect(view.result.current.pending).toEqual({ linkId: LINK, act: 'revoke' });
    await waitFor(() =>
      expect(view.result.current.said).toEqual({ act: 'revoke', label: 'Anil Deshmukh' }),
    );

    expect(statusOf(view.result.current, LINK)).toBe('revoked');
  });
});

describe('a new link and a new address', () => {
  it('a retry after a dropped answer carries the same key; a new ask a fresh one', async () => {
    sell.writes = ['drop'];
    const { view, copied } = await mounted();

    act(() => view.result.current.newLink.make(ANIL));
    await waitFor(() => expect(view.result.current.newLink.failure).not.toBeNull());
    act(() => view.result.current.newLink.make(ANIL));
    await waitFor(() => expect(copied).toHaveLength(1));
    act(() => view.result.current.newLink.make({ ...ANIL, label: 'Sunita at home' }));
    await waitFor(() => expect(links.sent).toHaveLength(3));

    const [first, retry, fresh] = links.sent;
    expect(first?.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(retry?.key).toBe(first?.key);
    expect(fresh?.key).not.toBe(first?.key);
    expect(view.result.current.said).toMatchObject({ act: 'mint' });
  });

  it('a new address goes to the clipboard and the link is named', async () => {
    const { view, copied } = await mounted();

    act(() => view.result.current.remint(LINK));
    await waitFor(() =>
      expect(view.result.current.said).toEqual({ act: 'remint', label: 'Anil Deshmukh' }),
    );

    expect(copied).toEqual([expect.stringMatching(/^https:\/\/app\.heliogrid\.in\/p\//)]);
    expect(links.sent[0]?.body).toMatchObject({ revokeEarlier: false });
  });
});
