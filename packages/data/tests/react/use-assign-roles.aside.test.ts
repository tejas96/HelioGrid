// @vitest-environment happy-dom
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { type AssignRolesEditor, useAssignRoles } from '../../src/react/use-assign-roles';
import { type Team, useTeam } from '../../src/react/use-team';
import { baseUrlOf, FINANCE, ISHA, OWNER, origin, VIKRAM } from './assign-roles-origin';

/**
 * Assign Roles stepping aside for the Roles reference and coming back (`T-M01-014` AC-5): Team
 * unmounts on the web, so the ticks must outlive it — under the provider that both screens share.
 */
interface Seen {
  team: Team;
  editor: AssignRolesEditor;
  cache: QueryClient;
}
const seen: { now: Seen | null } = { now: null };
const notes = { onRemoved: () => undefined, onUndoFailed: () => undefined };

function TeamHost() {
  const team = useTeam('en');
  seen.now = { team, editor: useAssignRoles(team, notes), cache: useQueryClient() };
  return null;
}

function now(): Seen {
  if (seen.now === null) throw new Error('Team is not mounted');
  return seen.now;
}

/** The provider stays; Team inside it comes and goes, as a page change does. */
async function mountTeam() {
  origin.roster = [structuredClone(OWNER), structuredClone(VIKRAM), structuredClone(ISHA)];
  const layer = createDataLayer({ baseUrl: baseUrlOf(), language: () => 'en' });
  const tree = (team: boolean): ReactNode => {
    const children = team ? createElement(TeamHost) : null;
    return createElement(DataProvider, { layer, children });
  };
  const view = render(tree(true));
  await waitFor(() => expect(now().team.load).toBe('ready'));
  return {
    leave: () => {
      view.rerender(tree(false));
      seen.now = null;
    },
    come: async () => {
      view.rerender(tree(true));
      await waitFor(() => expect(seen.now).not.toBeNull());
    },
  };
}

function openAndTickVikram() {
  const row = now().team.roster.find((held) => held.id === VIKRAM.membershipId);
  act(() => (row ? now().editor.openerOf(row)?.() : undefined));
  act(() => now().editor.pick([...VIKRAM.roles, FINANCE]));
}

afterEach(() => {
  vi.useRealTimers();
  seen.now = null;
});

describe('Assign Roles steps aside for the Roles reference', () => {
  it('resumes the ticks once', async () => {
    const page = await mountTeam();
    openAndTickVikram();
    act(() => now().editor.stepAside());
    expect(now().editor.open).toBe(false);
    page.leave();
    await page.come();
    act(() => now().editor.resume());
    await waitFor(() => expect(now().editor.open).toBe(true));
    expect(now().editor.person?.id).toBe(VIKRAM.membershipId);
    expect(now().editor.picked).toContain(FINANCE);

    act(() => now().editor.close());
    act(() => now().editor.resume());
    await waitFor(() => expect(now().team.load).toBe('ready'));
    expect(now().editor.open).toBe(false);
  });

  it('keeps the draft past gcTime', async () => {
    const page = await mountTeam();
    openAndTickVikram();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    act(() => now().editor.stepAside());
    page.leave();
    vi.advanceTimersByTime(60 * 60 * 1000);
    vi.useRealTimers();
    await page.come();
    act(() => now().editor.resume());
    await waitFor(() => expect(now().editor.open).toBe(true));
    expect(now().editor.picked).toContain(FINANCE);
  });

  it('waits for the roster', async () => {
    const page = await mountTeam();
    openAndTickVikram();
    act(() => now().editor.stepAside());
    const { cache } = now();
    page.leave();
    /* A cold list: the roster must be read again, slowly, before the draft can be judged. */
    cache.removeQueries({ queryKey: ['team'] });
    origin.readDelayMs = 300;
    await page.come();
    act(() => now().editor.resume());
    expect(now().team.load).toBe('loading');
    await waitFor(() => expect(now().editor.open).toBe(true), { timeout: 3000 });
    expect(now().editor.picked).toContain(FINANCE);
  });

  it('drops a draft for a person it no longer opens', async () => {
    const page = await mountTeam();
    openAndTickVikram();
    act(() => now().editor.stepAside());
    page.leave();
    const vikram = origin.roster.find((held) => held.membershipId === VIKRAM.membershipId);
    if (vikram) vikram.status = 'deactivated';
    await page.come();
    await act(() => now().team.reread());
    act(() => now().editor.resume());
    await waitFor(() => expect(now().team.load).toBe('ready'));
    expect(now().editor.open).toBe(false);
  });

  it('keeps nothing while the editor is closed', async () => {
    const page = await mountTeam();
    act(() => now().editor.stepAside());
    page.leave();
    await page.come();
    act(() => now().editor.resume());
    await waitFor(() => expect(now().team.load).toBe('ready'));
    expect(now().editor.open).toBe(false);
  });
});
