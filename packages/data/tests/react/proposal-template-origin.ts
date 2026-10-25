import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  ProposalTemplate,
  ProposalTemplateRead,
  TimelineTemplate,
  TimelineTemplateRead,
} from '@heliogrid/contracts';
import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
  DEFAULT_TIMELINE_PHASES,
} from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useProposalTemplate } from '../../src/react/use-proposal-template';
import { type Answer, answeredCompanyFacts } from './branding-origin';
import { listeningOrigin, send, writeBodyOf } from './origin-wire';

export { refusal } from './origin-wire';

/**
 * The Proposal template page end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): an origin that answers the company's facts as Branding's does, and the two template
 * routes in the contract's shapes, each save the way a case needs.
 */

const SAVED_BY = {
  at: '2026-10-25T10:00:00.000Z',
  by: { id: '01a30000-0000-7000-8000-000000000002', name: 'Rajesh Kulkarni' },
};

const platformTemplate = (): ProposalTemplateRead =>
  structuredClone({
    cover: null,
    sectionsIncluded: [...DEFAULT_SECTIONS_INCLUDED],
    defaultTerms: DEFAULT_TERMS,
    changed: null,
  }) as ProposalTemplateRead;

const platformTimeline = (): TimelineTemplateRead =>
  structuredClone({ phases: DEFAULT_TIMELINE_PHASES, changed: null }) as TimelineTemplateRead;

interface TemplateOrigin {
  template: ProposalTemplateRead;
  timeline: TimelineTemplateRead;
  /** The next answers to each save; an exhausted list answers it applied. */
  templateSaves: Answer[];
  timelineSaves: Answer[];
  templateBodies: ProposalTemplate[];
  timelineBodies: TimelineTemplate[];
  bankName: string | null;
}

export const templateOrigin: TemplateOrigin = {
  template: platformTemplate(),
  timeline: platformTimeline(),
  templateSaves: [],
  timelineSaves: [],
  templateBodies: [],
  timelineBodies: [],
  bankName: 'HDFC Bank',
};

async function answerSave(
  req: IncomingMessage,
  res: ServerResponse,
  record: 'template' | 'timeline',
) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const answers =
    record === 'template' ? templateOrigin.templateSaves : templateOrigin.timelineSaves;
  if (record === 'template') templateOrigin.templateBodies.push(write.body as ProposalTemplate);
  else templateOrigin.timelineBodies.push(write.body as TimelineTemplate);
  const answer = answers.shift() ?? { status: 200 };
  if (answer === 'drop') return void req.socket.destroy();
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  if (answer.status !== 200) return send(res, req, answer.status, answer.body);
  const saved = { ...(write.body as object), changed: SAVED_BY };
  if (record === 'template') templateOrigin.template = saved as ProposalTemplateRead;
  else templateOrigin.timeline = saved as TimelineTemplateRead;
  send(res, req, 200, saved);
}

function answer(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const saving = req.method === 'PUT';
  if (path === '/settings/proposal-template') {
    return saving
      ? void answerSave(req, res, 'template')
      : send(res, req, 200, templateOrigin.template);
  }
  if (path === '/settings/timeline-template') {
    return saving
      ? void answerSave(req, res, 'timeline')
      : send(res, req, 200, templateOrigin.timeline);
  }
  if (answeredCompanyFacts(req, res, templateOrigin.bankName)) return;
  send(res, req, 404, { code: 'NOT_FOUND', message: 'Not found', requestId: 'test' });
}

const listening = listeningOrigin(answer);

afterEach(() => {
  cleanup();
  Object.assign(templateOrigin, {
    template: platformTemplate(),
    timeline: platformTimeline(),
    templateSaves: [],
    timelineSaves: [],
    templateBodies: [],
    timelineBodies: [],
    bankName: 'HDFC Bank',
  });
});

/** The Proposal template page, mounted in the real provider over the origin, its reads answered. */
export async function mounted() {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useProposalTemplate(), { wrapper });
  await waitFor(() => expect(view.result.current.status).toBe('ready'));
  return view;
}
