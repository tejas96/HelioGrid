import type { QuickAddDone } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { quickAddDoneToast } from '../src/copy/quick-add';
import { createTranslator } from '../src/runtime';

describe('quickAddDoneToast — what a finished capture leaves (SCR-M02-01)', () => {
  it.each([
    [{ kind: 'saved', leadId: 'lead-1' }, 'Lead saved', 'Open'],
    [{ kind: 'enquiry_logged', leadId: 'lead-1', name: 'Priya Sharma' }, null, null],
    [{ kind: 'owner_asked', ownerName: null }, null, null],
  ] as const)('%o', async (done: QuickAddDone, title, open) => {
    const { t } = await createTranslator('en');
    const opened: string[] = [];
    const toast = quickAddDoneToast(t, done, (leadId) => opened.push(leadId));
    expect(toast.tone).toBe('success');
    if (title !== null) expect(toast.title).toBe(title);
    const act = 'act' in toast ? toast.act : undefined;
    expect(act?.label ?? null).toBe(open);
    act?.onAct();
    expect(opened).toEqual(open === null ? [] : ['lead-1']);
  });
});
