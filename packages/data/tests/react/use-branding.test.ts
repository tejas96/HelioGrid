// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { anImage, mounted, origin, refusal, SAVED_LOGO, savedWithLogo } from './branding-origin';

/**
 * The Branding page's one save, end to end through the real client (`SCR-M01-18`, `D237`): every
 * answer a save can meet, the logo held on the device until the act, and the save never read as
 * done when the logo did not land.
 */
describe('the Branding page — its reads and its one save, through the real client', () => {
  it('reads a company that never saved as nothing set, with the cover’s company facts', async () => {
    const view = await mounted();
    expect(view.result.current.standing).toEqual({ kind: 'never-set' });
    expect(view.result.current.changed).toBe(false);
    expect(view.result.current.company).toMatchObject({
      companyName: 'Suryodaya Solar Pvt Ltd',
      registration: { value: '27AABCS1429P1ZQ' },
    });
  });

  it('an edit raises the change, and the previews take the draft’s colour before any save', async () => {
    const view = await mounted();
    act(() => view.result.current.edit({ kind: 'colour', value: '#0070FC' }));
    expect(view.result.current.changed).toBe(true);
    expect(view.result.current.draft?.brandColour).toBe('#0070FC');
    expect(origin.bodies).toHaveLength(0);
  });

  it('a save sends one write and the page reads who saved', async () => {
    const view = await mounted();
    act(() => view.result.current.edit({ kind: 'colour', value: '#0D7A4F' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.changed).toBe(false));
    expect(origin.bodies).toEqual([{ brandColour: '#0D7A4F', letterhead: null }]);
    expect(view.result.current.standing).toMatchObject({ kind: 'saved', name: 'Rajesh Kulkarni' });
  });

  it('a failed save keeps the draft', async () => {
    const view = await mounted();
    origin.saves = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.result.current.edit({ kind: 'colour', value: '#B3401F' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.status).toBe('save-failed'));
    expect(view.result.current.saveFailure).not.toBeNull();
    expect(view.result.current.draft?.brandColour).toBe('#B3401F');
    expect(view.result.current.changed).toBe(true);
  });

  it('a save with no answer keeps the draft, and its failure says so', async () => {
    const view = await mounted();
    origin.saves = ['drop'];
    act(() => view.result.current.edit({ kind: 'colour', value: '#B3401F' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.status).toBe('save-failed'));
    expect(view.result.current.draft?.brandColour).toBe('#B3401F');
  });

  it('a second save while one runs sends nothing', async () => {
    const view = await mounted();
    origin.saves = [{ status: 200, afterMs: 200 }];
    act(() => view.result.current.edit({ kind: 'colour', value: '#0D7A4F' }));
    act(() => {
      view.result.current.save();
      view.result.current.save();
    });
    await waitFor(() => expect(view.result.current.changed).toBe(false));
    expect(origin.bodies).toHaveLength(1);
  });

  it('an edit typed while a save is out stays held', async () => {
    const view = await mounted();
    origin.saves = [{ status: 200, afterMs: 200 }];
    act(() => view.result.current.edit({ kind: 'colour', value: '#0D7A4F' }));
    act(() => view.result.current.save());
    act(() => view.result.current.edit({ kind: 'tagline', value: 'Rooftop solar since 2011' }));
    await waitFor(() => expect(view.result.current.saving).toBe(false));
    expect(view.result.current.draft?.tagline).toBe('Rooftop solar since 2011');
    expect(view.result.current.changed).toBe(true);
  });

  it('a refused logo uploads nothing and keeps the saved one', async () => {
    savedWithLogo();
    const view = await mounted();
    act(() => view.result.current.chooseLogo(anImage(800, 3_000_000)));
    expect(view.result.current.logo.refusal).not.toBeNull();
    expect(view.result.current.draft?.logoFileId).toBe(SAVED_LOGO);
    expect(view.result.current.changed).toBe(false);
    act(() => view.result.current.chooseLogo(anImage(300)));
    expect(view.result.current.logo.refusal).not.toBeNull();
    expect(origin.declares).toBe(0);
  });

  it('a refusal is let go once the logo is removed', async () => {
    savedWithLogo();
    const view = await mounted();
    act(() => view.result.current.chooseLogo(anImage(800, 3_000_000)));
    expect(view.result.current.logo.refusal).not.toBeNull();
    act(() => view.result.current.removeLogo());
    expect(view.result.current.logo.refusal).toBeNull();
  });

  it('a discarded logo is never stored', async () => {
    const view = await mounted();
    act(() => view.result.current.chooseLogo(anImage()));
    expect(view.result.current.changed).toBe(true);
    act(() => view.result.current.discard());
    expect(view.result.current.changed).toBe(false);
    expect(origin.declares).toBe(0);
  });

  it('a chosen logo is stored at the act and sent with the colour in one write', async () => {
    const view = await mounted();
    act(() => view.result.current.chooseLogo(anImage()));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.changed).toBe(false));
    expect(origin.declares).toBe(1);
    expect(origin.bodies).toHaveLength(1);
    expect(origin.bodies[0]?.logoFileId).toBe(origin.logoFileId);
    expect(view.result.current.draft?.logoFileId).toBe(origin.logoFileId);
  });

  it('a logo the server reads as another type is refused at the logo', async () => {
    const view = await mounted();
    origin.completes = [{ status: 422, body: refusal('FILE_CONTENT_MISMATCH') }];
    act(() => view.result.current.chooseLogo(anImage()));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.logo.refusal).not.toBeNull());
    expect(origin.bodies).toHaveLength(0);
  });

  it('a removed logo is saved as none', async () => {
    savedWithLogo();
    const view = await mounted();
    act(() => view.result.current.removeLogo());
    expect(view.result.current.changed).toBe(true);
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.changed).toBe(false));
    expect(origin.bodies[0]).toMatchObject({ logoFileId: null });
    expect(view.result.current.draft?.logoFileId).toBeNull();
  });

  it('an answer without the logo it was sent reads as not saved', async () => {
    savedWithLogo();
    origin.stripsLogo = true;
    const view = await mounted();
    act(() => view.result.current.removeLogo());
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.status).toBe('save-failed'));
    expect(view.result.current.changed).toBe(true);
  });
});
