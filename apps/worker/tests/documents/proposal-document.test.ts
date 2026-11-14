import type { ActivityOptions } from '@temporalio/workflow';
import { ActivityFailure } from '@temporalio/workflow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proposalDocument } from '../../src/modules/documents/documents.workflows';

/**
 * A proposal version's PDF run (`F5-39`): the render is tried twice in all, then the run fails and
 * the operator is told; the PDF's bytes never ride the workflow. The steps are stubbed by name —
 * the sequence is what is under test, and Temporal's own retry honours the options it is given.
 */

type Step = (input: unknown) => Promise<unknown>;
// Hoisted with the mock below, which runs before this file's imports.
const { steps, optionsOf } = vi.hoisted(() => ({
  steps: new Map<string, ReturnType<typeof vi.fn<Step>>>(),
  optionsOf: new Map<string, ActivityOptions>(),
}));

vi.mock('@temporalio/workflow', async (actual) => ({
  ...(await actual<typeof import('@temporalio/workflow')>()),
  proxyActivities: (options: ActivityOptions) =>
    new Proxy(
      {},
      {
        get: (_, name: string) => {
          optionsOf.set(name, options);
          const step = steps.get(name) ?? vi.fn<Step>();
          steps.set(name, step);
          return step;
        },
      },
    ),
}));

const version = { tenantId: '00000000-0000-4000-8000-000000000001', versionId: 'v-1' };
const page = {
  kind: 'page',
  url: 'http://web/print/proposal/v-1?grant=g',
  origins: ['http://web', 'http://api'],
  put: { url: 'http://store/bucket/key?signed', headers: { 'content-type': 'application/pdf' } },
};
const printed = { byteSize: 1_950_000, checksumSha256: 'c2hhMjU2' };
const step = (name: string) => {
  const found = steps.get(name);
  if (found === undefined) throw new Error(`the workflow never named ${name}`);
  return found;
};
const failedStep = (type: string) =>
  new ActivityFailure('the step failed', type, '1', 'MAXIMUM_ATTEMPTS_REACHED', undefined);

describe('the proposal document run', () => {
  beforeEach(() => {
    for (const one of steps.values()) one.mockReset();
    step('proposalDocumentPage').mockResolvedValue(page);
    step('renderPagePdf').mockResolvedValue(printed);
    step('keepProposalDocument').mockResolvedValue({ fileId: 'file-1' });
  });

  it('prints to the store and keeps what was printed: only small facts pass between steps', async () => {
    expect(await proposalDocument(version)).toEqual({ fileId: 'file-1' });
    expect(step('renderPagePdf')).toHaveBeenCalledWith({
      url: page.url,
      origins: page.origins,
      put: page.put,
    });
    expect(step('keepProposalDocument')).toHaveBeenCalledWith({ ...version, ...printed });
    expect(step('proposalDocumentFailed')).not.toHaveBeenCalled();
  });

  it('tries a render twice in all, never without end', () => {
    expect(optionsOf.get('renderPagePdf')?.retry?.maximumAttempts).toBe(2);
  });

  it('a render that fails both tries fails the run and tells the operator once', async () => {
    const failure = failedStep('renderPagePdf');
    step('renderPagePdf').mockRejectedValue(failure);
    await expect(proposalDocument(version)).rejects.toBe(failure);
    expect(step('keepProposalDocument')).not.toHaveBeenCalled();
    expect(step('proposalDocumentFailed')).toHaveBeenCalledTimes(1);
    expect(step('proposalDocumentFailed')).toHaveBeenCalledWith(version);
  });

  it('a store that does not hold what was printed fails the run and tells the operator', async () => {
    const failure = failedStep('keepProposalDocument');
    step('keepProposalDocument').mockRejectedValue(failure);
    await expect(proposalDocument(version)).rejects.toBe(failure);
    expect(step('proposalDocumentFailed')).toHaveBeenCalledWith(version);
  });

  it('a kept PDF is answered without printing', async () => {
    step('proposalDocumentPage').mockResolvedValue({ kind: 'kept', fileId: 'file-0' });
    expect(await proposalDocument(version)).toEqual({ fileId: 'file-0' });
    expect(step('renderPagePdf')).not.toHaveBeenCalled();
  });
});
