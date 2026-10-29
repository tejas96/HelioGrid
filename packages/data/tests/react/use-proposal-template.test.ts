// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mounted, refusal, templateOrigin } from './proposal-template-origin';

/**
 * The Proposal template page's one save, end to end through the real client (`SCR-M01-19`): only
 * the record that changed is sent, a failure keeps the draft, a second press sends nothing, and a
 * save that landed half sends only the rest next time.
 */
describe('the Proposal template page — its reads and its one save, through the real client', () => {
  it('reads a company that never saved as nothing set, with its bank and cover', async () => {
    const view = await mounted();

    expect(view.result.current.standing).toEqual({ kind: 'never-set' });
    expect(view.result.current.changed).toEqual({ template: false, timeline: false });
    expect(view.result.current.bankName).toBe('HDFC Bank');
    expect(view.result.current.cover).toMatchObject({ companyName: 'Suryodaya Solar Pvt Ltd' });
  });

  it('only the changed record is sent', async () => {
    const view = await mounted();

    act(() => view.result.current.edit({ kind: 'move', from: 1, to: 0 }));
    expect(view.result.current.changed).toEqual({ template: false, timeline: true });
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.changed.timeline).toBe(false));

    expect(templateOrigin.templateBodies).toHaveLength(0);
    expect(templateOrigin.timelineBodies).toHaveLength(1);
    expect(view.result.current.standing).toMatchObject({ kind: 'saved', name: 'Rajesh Kulkarni' });
  });

  it('a failed save keeps the draft', async () => {
    const view = await mounted();
    templateOrigin.templateSaves = [{ status: 500, body: refusal('INTERNAL') }];

    act(() => view.result.current.edit({ kind: 'section', section: 'performance' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.saveFailure).not.toBeNull());

    expect(view.result.current.changed.template).toBe(true);
    expect(view.result.current.draft?.template.sectionsIncluded).not.toContain('performance');
  });

  it('a save with no answer keeps the draft, and its failure says so', async () => {
    const view = await mounted();
    templateOrigin.templateSaves = ['drop'];

    act(() => view.result.current.edit({ kind: 'section', section: 'performance' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.saveFailure).not.toBeNull());

    expect(view.result.current.changed.template).toBe(true);
  });

  it('a second save while one runs sends nothing', async () => {
    const view = await mounted();
    templateOrigin.templateSaves = [{ status: 200, afterMs: 200 }];

    act(() => view.result.current.edit({ kind: 'section', section: 'components' }));
    act(() => {
      view.result.current.save();
      view.result.current.save();
    });
    await waitFor(() => expect(view.result.current.changed.template).toBe(false));

    expect(templateOrigin.templateBodies).toHaveLength(1);
  });

  it('after a half save only the rest is sent', async () => {
    const view = await mounted();
    templateOrigin.timelineSaves = [{ status: 500, body: refusal('INTERNAL') }];

    act(() => view.result.current.edit({ kind: 'section', section: 'components' }));
    act(() => view.result.current.edit({ kind: 'move', from: 1, to: 0 }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.saveFailure).not.toBeNull());
    expect(view.result.current.changed).toEqual({ template: false, timeline: true });

    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.changed.timeline).toBe(false));

    expect(templateOrigin.templateBodies).toHaveLength(1);
    expect(templateOrigin.timelineBodies).toHaveLength(2);
    expect(view.result.current.read.kind).toBe('ready');
  });

  it('a draft a field refuses is never sent', async () => {
    const view = await mounted();

    act(() =>
      view.result.current.edit({
        kind: 'terms',
        language: 'en',
        value: { version: 1, blocks: [] },
      }),
    );
    act(() => view.result.current.save());

    expect(view.result.current.saving).toBe(false);
    expect(templateOrigin.templateBodies).toHaveLength(0);
  });

  it('discarding lets go of every edit', async () => {
    const view = await mounted();

    act(() => view.result.current.edit({ kind: 'delete', key: 0 }));
    act(() => view.result.current.discard());

    expect(view.result.current.changed).toEqual({ template: false, timeline: false });
    expect(view.result.current.draft?.phases).toHaveLength(8);
  });

  it('a refused save names the part to open', async () => {
    const view = await mounted();

    act(() =>
      view.result.current.edit({
        kind: 'terms',
        language: 'en',
        value: { version: 1, blocks: [] },
      }),
    );

    expect(view.result.current.refusedPart).toBe('terms');
  });

  it('an unsaved edit leaves the standing line as the last save had it', async () => {
    const view = await mounted();

    act(() => view.result.current.edit({ kind: 'section', section: 'performance' }));

    expect(view.result.current.standing).toEqual({ kind: 'never-set' });
  });

  it('a company with no bank reads none', async () => {
    templateOrigin.bankName = null;
    const view = await mounted();

    expect(view.result.current.bankName).toBeNull();
  });
});
