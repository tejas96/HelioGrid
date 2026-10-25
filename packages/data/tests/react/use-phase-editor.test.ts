// @vitest-environment happy-dom
import type { TimelinePhase } from '@heliogrid/domain';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type PhaseOpen, usePhaseEditor } from '../../src/react/use-phase-editor';

/**
 * The phase editor's flow (`SCR-M01-19` m19-g): an opening shows its own phase on its first frame,
 * a refusal is said only once the person tried, and *Save phase* hands on only a whole phase.
 */
const SURVEY: TimelinePhase = {
  name: { en: 'Site survey and design' },
  description: { en: 'We measure your roof.' },
};

describe('the phase editor', () => {
  it('an opening shows its phase on its very first frame', () => {
    const frames: string[] = [];
    const view = renderHook(
      ({ open }: { open: PhaseOpen | null }) => {
        const editor = usePhaseEditor(open, () => undefined);
        frames.push(editor.phase.name.en);
        return editor;
      },
      { initialProps: { open: null as PhaseOpen | null } },
    );

    frames.length = 0;
    view.rerender({ open: { key: 0, phase: SURVEY } });

    expect(frames[0]).toBe('Site survey and design');
    expect(frames).not.toContain('');
  });

  it('a new opening forgets what the last one typed', () => {
    const view = renderHook(
      ({ open }: { open: PhaseOpen | null }) => usePhaseEditor(open, () => undefined),
      {
        initialProps: { open: { key: 0, phase: SURVEY } as PhaseOpen | null },
      },
    );

    act(() => view.result.current.editName('Survey'));
    expect(view.result.current.phase.name.en).toBe('Survey');
    view.rerender({ open: { key: null } });

    expect(view.result.current.phase.name.en).toBe('');
    expect(view.result.current.language).toBe('en');
  });

  it('a refusal is said only once the person tried, and a whole phase is handed on', () => {
    const onSave = vi.fn();
    /* One opening, held as a screen holds it in state: the same object on every render. */
    const adding: PhaseOpen = { key: null };
    const view = renderHook(() => usePhaseEditor(adding, onSave));

    expect(view.result.current.shown).toEqual({ name: null, description: null });
    act(() => view.result.current.save());
    expect(view.result.current.shown).toEqual({
      name: 'needs-english',
      description: 'needs-english',
    });
    expect(onSave).not.toHaveBeenCalled();

    act(() => view.result.current.editName('Handover'));
    act(() => view.result.current.chooseLanguage('hi'));
    act(() => view.result.current.editName('हैंडओवर'));
    act(() => view.result.current.chooseLanguage('en'));
    act(() => view.result.current.editWhat('We hand the plant over.'));
    act(() => view.result.current.save());

    expect(onSave).toHaveBeenCalledWith(null, {
      name: { en: 'Handover', hi: 'हैंडओवर' },
      description: { en: 'We hand the plant over.' },
    });
  });
});
