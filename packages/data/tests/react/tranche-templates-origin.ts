import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  IDEMPOTENCY_KEY_HEADER,
  type TrancheTemplate,
  type TrancheTemplateWrite,
} from '@heliogrid/contracts';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useTrancheTemplates } from '../../src/react/use-tranche-templates';
import { type Answer, answeredCompanyFacts } from './branding-origin';
import { listeningOrigin, send, writeBodyOf } from './origin-wire';

export { refusal } from './origin-wire';

/**
 * The Payment terms page end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): an origin holding the company's templates and answering the tranche routes in the
 * contract's shapes, each write and each preview the way a case needs.
 */

const line = (
  en: string,
  percent: string,
  dueOnStage: TrancheTemplate['lines'][number]['dueOnStage'],
) => ({
  label: { en },
  percent,
  dueOnStage,
});

export const seededTemplates = (): TrancheTemplate[] => [
  {
    id: '01a30000-0000-7000-8000-0000000000a1',
    name: { en: 'Standard 10/60/20/10' },
    isDefault: true,
    archived: false,
    changed: false,
    lines: [
      line('Advance on signing', '10.00', 'won'),
      line('Before dispatch', '60.00', 'material_ordered'),
      line('On installation', '20.00', 'installation'),
      line('On commissioning', '10.00', 'commissioned'),
    ],
  },
  {
    id: '01a30000-0000-7000-8000-0000000000a2',
    name: { en: 'Standard 30/60/10' },
    isDefault: false,
    archived: false,
    changed: false,
    lines: [
      line('Advance on signing', '30.00', 'won'),
      line('Before dispatch', '60.00', 'material_ordered'),
      line('On commissioning', '10.00', 'commissioned'),
    ],
  },
];

interface Write {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
  readonly key: string | undefined;
}

interface TermsOrigin {
  items: TrancheTemplate[];
  /** The next answers to each kind of request; an exhausted list answers it applied. */
  lists: Answer[];
  writes: Answer[];
  previews: Answer[];
  sent: Write[];
  listReads: number;
}

const fresh = (): TermsOrigin => ({
  items: seededTemplates(),
  lists: [],
  writes: [],
  previews: [],
  sent: [],
  listReads: 0,
});

export const termsOrigin: TermsOrigin = fresh();

const SAVED_BY = {
  at: '2026-10-26T10:00:00.000Z',
  by: { id: '01a30000-0000-7000-8000-000000000002', name: 'Rajesh Kulkarni' },
};

async function answered(req: IncomingMessage, res: ServerResponse, answers: Answer[]) {
  const answer = answers.shift() ?? { status: 200 };
  if (answer === 'drop') {
    req.socket.destroy();
    return null;
  }
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  if (answer.status === 200) return answer;
  send(res, req, answer.status, answer.body);
  return null;
}

/** The api's sample: ₹4,20,000, each share of it exact. */
function schedule(lines: readonly { percent: string }[]) {
  const amounts = lines.map((one) => `${(Number(one.percent) * 4200).toFixed(2)}`);
  return { currencyCode: 'INR', contract: '420000.00', amounts };
}

function applied(path: string, body: unknown): { status: number; body: TrancheTemplate } {
  const [, , , id, act] = path.split('/');
  if (id === undefined) {
    const made = { ...(body as TrancheTemplateWrite), id: '01a30000-0000-7000-8000-0000000000b1' };
    const template = { ...made, isDefault: false, archived: false, changed: true };
    termsOrigin.items.push(template);
    return { status: 201, body: template };
  }
  const was = termsOrigin.items.find((item) => item.id === id) as TrancheTemplate;
  const now =
    act === undefined
      ? { ...was, ...(body as TrancheTemplateWrite), changed: true }
      : { ...was, archived: act === 'archive', isDefault: act === 'make-default' || was.isDefault };
  termsOrigin.items = termsOrigin.items.map((item) => (item.id === id ? now : item));
  return { status: 200, body: now };
}

async function answer(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (answeredCompanyFacts(req, res)) return;
  if (!path.startsWith('/settings/tranche-templates')) {
    return send(res, req, 404, { code: 'NOT_FOUND', message: 'Not found', requestId: 'test' });
  }
  if (req.method === 'GET') {
    termsOrigin.listReads += 1;
    if ((await answered(req, res, termsOrigin.lists)) === null) return;
    const lastSaved = termsOrigin.items.some((item) => item.changed) ? SAVED_BY : null;
    return send(res, req, 200, { items: termsOrigin.items, lastSaved });
  }
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  if (path === '/settings/tranche-templates/preview') {
    if ((await answered(req, res, termsOrigin.previews)) === null) return;
    return send(res, req, 200, schedule((write.body as { lines: { percent: string }[] }).lines));
  }
  const key = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
  termsOrigin.sent.push({ method: req.method ?? '', path, body: write.body, key });
  if ((await answered(req, res, termsOrigin.writes)) === null) return;
  const done = applied(path, write.body);
  send(res, req, done.status, done.body);
}

const listening = listeningOrigin((req, res) => void answer(req, res));

afterEach(() => {
  cleanup();
  Object.assign(termsOrigin, fresh());
});

/** The Payment terms page, mounted in the real provider over the origin, its list answered. */
export async function mounted(ready = true) {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useTrancheTemplates('en'), { wrapper });
  if (ready) await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return view;
}
