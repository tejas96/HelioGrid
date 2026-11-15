// @vitest-environment happy-dom
import type { CoverPicture } from '@heliogrid/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCoverPhoto } from '../../src/react/use-cover-photo';
import { anImage, NEW_LOGO, origin, provided, refusal, SAVED_LOGO } from './branding-origin';

/**
 * The company's own cover photo on Proposal defaults (`T-M01-030`) through the real client: an
 * image the company may store is stored the moment it is chosen and then named in the page's draft;
 * one the device refuses sends nothing; a store that fails names nothing and says so.
 */

const TENANT = '01a30000-0000-7000-8000-000000000001';
const SAVED_URL = 'https://files.test/cover.jpg';

function mounted(saved: CoverPicture | undefined) {
  const stored: CoverPicture[] = [];
  const view = renderHook(
    () =>
      useCoverPhoto(
        TENANT,
        { picture: saved, url: saved?.kind === 'own' ? SAVED_URL : null },
        (picture) => void stored.push(picture),
      ),
    { wrapper: provided() },
  );
  return { view, stored };
}

describe('useCoverPhoto — stored when chosen, named in the draft once stored', () => {
  it.each([
    ['a platform picture', { kind: 'platform', key: 'villa' } as const, null, null],
    ['none chosen yet', undefined, null, null],
    [
      'the company’s own photo',
      { kind: 'own', fileId: SAVED_LOGO } as const,
      SAVED_URL,
      SAVED_LOGO,
    ],
  ])('%s draws what is saved', (_, saved, picture, fileId) => {
    const { view } = mounted(saved);
    expect(view.result.current.picture).toBe(picture);
    expect(view.result.current.held).toEqual(fileId === null ? null : { kind: 'own', fileId });
  });

  it('an image it may store is stored as a company file, drawn, and named in the draft', async () => {
    const { view, stored } = mounted({ kind: 'platform', key: 'home' });

    act(() => view.result.current.choose(anImage()));

    expect(view.result.current.storing).toBe(true);
    await waitFor(() => expect(stored).toEqual([{ kind: 'own', fileId: NEW_LOGO }]));
    expect(view.result.current.storing).toBe(false);
    expect(view.result.current.picture).toBe('blob:logo');
    expect(view.result.current.held).toEqual({ kind: 'own', fileId: NEW_LOGO });
    expect(view.result.current.refused).toBe(false);
    expect(origin.declares).toBe(1);
  });

  it.each([
    ['a type the company may not store', anImage(800, 4, 'image/gif')],
    ['an image past the size limit', anImage(800, 50 * 1024 * 1024)],
  ])('%s is refused on the device and sends nothing', async (_, image) => {
    const { view, stored } = mounted(undefined);

    act(() => view.result.current.choose(image));

    expect(view.result.current.refused).toBe(true);
    expect(view.result.current.storing).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(origin.declares).toBe(0);
    expect(stored).toEqual([]);
  });

  it('a store that fails names nothing and says so; the saved photo still draws', async () => {
    origin.completes.push({ status: 500, body: refusal('INTERNAL') });
    const { view, stored } = mounted({ kind: 'own', fileId: SAVED_LOGO });

    act(() => view.result.current.choose(anImage()));

    await waitFor(() => expect(view.result.current.refused).toBe(true));
    expect(stored).toEqual([]);
    expect(view.result.current.picture).toBe(SAVED_URL);
    expect(view.result.current.held).toEqual({ kind: 'own', fileId: SAVED_LOGO });
  });
});
