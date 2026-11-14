import { IN_FORMATS, type ProposalStep } from '@heliogrid/domain';
import { renderHook, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import type { BuilderStepModel } from '../../src/react/proposal-builder-model';
import { useProposalBuilderScreen } from '../../src/react/use-proposal-builder-screen';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/** The builder's view model mounted on the sell origin, and how a case reads it. Asserts nothing of its own. */

export const intents = () => ({ toStep: vi.fn(), toLead: vi.fn(), toProposal: vi.fn() });
const labels = { newPart: (n: number) => `Part ${n}`, warrantyYears: (n: number) => `${n} years` };

export async function mounted(step: ProposalStep | null = 'system', moves = intents()) {
  const view = renderHook(
    () =>
      useProposalBuilderScreen(PROPOSAL, {
        step,
        formats: IN_FORMATS,
        reader: 'en',
        intents: moves,
        labels,
      }),
    { wrapper: provided() },
  );
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return { view, moves };
}

export type Screen = Awaited<ReturnType<typeof mounted>>['view']['result']['current'];

export function readyOf(screen: Screen) {
  if (screen.read.kind !== 'ready') throw new Error('the builder is not read yet');
  return screen.read.value;
}
export function stepOf<Step extends BuilderStepModel['step']>(screen: Screen, step: Step) {
  const model = readyOf(screen).step;
  if (model.step !== step) throw new Error(`the step in view is ${model.step}, not ${step}`);
  return model as Extract<BuilderStepModel, { step: Step }>;
}
export const bodies = () => sell.sent.map((write) => write.body as Record<string, unknown>);
