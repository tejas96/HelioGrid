// @vitest-environment happy-dom
import type { ComposedMessage, ProjectDetail } from '@heliogrid/contracts';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  type ProjectProposalMoves,
  useProjectProposalRows,
} from '../../src/react/use-project-proposal-rows';
import { aProject, PROJECT_ID, READER } from './projects-fixtures';
import { mountedOver, origin, readsOf, settle } from './projects-origin';

/**
 * What a project says of its proposal (`T-M06-025`, `T-F5-002`) through the real client: the version
 * in force and where it leads, and the evening-before crew message — read only once its sheet
 * opens, never sent by the product, handed to the chat or the clipboard by a person.
 */

const PROPOSAL_ID = '01a30000-0000-7000-8000-00000000b001';
const CREW_MESSAGE = `/projects/${PROJECT_ID}/crew-message`;
const DAY = {
  on: '2026-11-20',
  startTime: '09:00',
  durationDays: 2,
  disturbance: null,
  crewLead: { userId: READER.userId, name: READER.name, phoneE164: '+919900000002' },
};

interface Done {
  versions: string[];
  chats: ComposedMessage[];
  copied: string[];
  /** The device refuses the clipboard. */
  refuses: boolean;
}

function movesOf(done: Done): ProjectProposalMoves {
  return {
    toVersions: (id) => void done.versions.push(id),
    openChat: (message) => void done.chats.push(message),
    copy: (text, copied, notCopied) => {
      if (done.refuses) return notCopied();
      done.copied.push(text);
      copied();
    },
  };
}

function mounted(project: ProjectDetail | null, refuses = false) {
  const done: Done = { versions: [], chats: [], copied: [], refuses };
  const view = mountedOver(() => useProjectProposalRows(project, movesOf(done)));
  return { view, done };
}

const project = (over: Partial<ProjectDetail>): ProjectDetail => ({ ...aProject(), ...over });

describe('the version in force', () => {
  it.each([
    ['an api built before proposals', undefined, 0],
    ['a deal won with no accepted proposal', null, 0],
    ['a version in force', { proposalId: PROPOSAL_ID, number: 'PRP-0042', version: 2 }, 1],
  ])('%s: its versions open only when one is held', (_, proposalVersion, opened) => {
    const { view, done } = mounted(project({ proposalVersion, newerVersion: 3 }));
    expect(view.result.current.version).toEqual(proposalVersion);
    expect(view.result.current.newerVersion).toBe(3);

    act(() => view.result.current.openVersions());

    expect(done.versions).toEqual(opened === 0 ? [] : [PROPOSAL_ID]);
  });
});

describe('the evening-before crew message', () => {
  it.each([
    ['nothing known', undefined, [], ['start_time', 'duration', 'crew_lead', 'crew']],
    ['the day set and a crew', DAY, [{ userId: READER.userId, name: READER.name }], []],
  ])('%s: the row asks for what it still lacks', (_, installation, crew, missing) => {
    const { view } = mounted(project({ installation, crew, crewMessageDue: true }));
    expect(view.result.current.crewDue).toBe(true);
    expect(view.result.current.crewMissing).toEqual(missing);
  });

  it('is read only once its sheet opens', async () => {
    const { view } = mounted(project({ crewMessageDue: true }));
    await settle();
    expect(readsOf(CREW_MESSAGE)).toBe(0);

    act(() => view.result.current.crew.openSheet());

    await waitFor(() => expect(view.result.current.crew.message.kind).toBe('ready'));
    expect(readsOf(CREW_MESSAGE)).toBe(1);
    act(() => view.result.current.crew.close());
    expect(view.result.current.crew.open).toBe(false);
  });

  it.each([
    ['a market with a chat app opens the chat and says nothing', 'chat', false, null],
    ['no chat app: the words are copied, and it says so', null, false, 'copied'],
    ['no chat app and a refused clipboard says it was not copied', null, true, 'not_copied'],
  ] as const)('%s', (_, chatUri, refuses, said) => {
    const { view, done } = mounted(project({ crewMessageDue: true }), refuses);
    const message = { ...origin.crewMessage, chatUri: chatUri === null ? null : 'https://wa.me/1' };

    act(() => view.result.current.crew.share(message));

    expect(done.chats).toEqual(chatUri === null ? [] : [message]);
    expect(done.copied).toEqual(chatUri === null && !refuses ? [message.text] : []);
    expect(view.result.current.crew.said).toBe(said);
    act(() => view.result.current.crew.dismissSaid());
    expect(view.result.current.crew.said).toBeNull();
  });

  it('Copy puts the words themselves on the clipboard', () => {
    const { view, done } = mounted(project({ crewMessageDue: true }));
    act(() => view.result.current.crew.copy(origin.crewMessage));
    expect(done.copied).toEqual([origin.crewMessage.text]);
    expect(view.result.current.crew.said).toBe('copied');
  });

  it('no project read yet holds nothing and reads nothing', async () => {
    const { view } = mounted(null);
    expect(view.result.current.crewDue).toBe(false);
    expect(view.result.current.crewMissing).toEqual([]);
    act(() => view.result.current.crew.openSheet());
    await settle();
    expect(readsOf(CREW_MESSAGE)).toBe(0);
  });
});
