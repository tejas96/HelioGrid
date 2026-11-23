'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, StudioView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, ShellGlyph, useFormat } from '@heliogrid/ui';
import { type Ref, useEffect, useRef } from 'react';
import { pillOf } from './StudioBarPills';
import { type BarAct, type BarView, barViewOf } from './StudioBarViews';

/** The bar's worded acts: the main one primary, one not built yet off with its reason. */
function BarActs({ acts }: { acts: readonly BarAct[] }) {
  return acts.map((act) => (
    <Button
      key={act.key}
      variant={act.secondary ? 'secondary' : 'primary'}
      size="md"
      icon={act.icon === undefined ? undefined : <ShellGlyph name={act.icon} size="sm" />}
      iconRight={
        act.iconRight === undefined ? undefined : <ShellGlyph name={act.iconRight} size="sm" />
      }
      {...(act.coming === undefined
        ? { onClick: act.onPress }
        : { disabled: true, disabledReason: act.coming })}
    >
      {act.label}
    </Button>
  ));
}

/** The live sentence: the region stays; a new sentence inside it is a new line, and slides in. */
function BarLine({ status, bad }: Pick<BarView, 'status' | 'bad'>) {
  return status === null ? null : (
    <span key={String(status)} className="hg-studio-bar-line">
      {bad ? <ShellGlyph name="alert-circle" size="sm" tone="current" /> : null}
      {status}
    </span>
  );
}

/**
 * The one bottom bar of the roof step (`T-M05-002`, parts b and e). Before a roof it is a card:
 * the site, where things stand, and Draw myself (no picture: Draw on the grid). While drawing, a
 * slim pill: the magnet and Close shape. With a roof it is slim again: a moment's words when there
 * is one — what an act did, a refusal in the error colour — and the next step; a roof just closed
 * is a card for that moment, with what it became and its chips. It never names a roof, its area or
 * the count: Roofs holds those.
 */
export function StudioBottomBar({
  barRef,
  name,
  studio,
  view,
  units,
  editing,
  place,
  words,
  part,
  crowded,
  magnet,
  phone,
}: {
  barRef: Ref<HTMLDivElement>;
  name: TranslatedText;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  editing: StudioEditing;
  /** The site's place, which the bar names before a roof. */
  place: string | null;
  words: StudioCanvasWords;
  /** Focus mode: the whole bar, its status line alone, or none. */
  part: FocusParts['bottomBar'];
  /** The corner held is crowded by another on the screen: the bar asks for a closer look. */
  crowded: boolean;
  /** Focus mode's magnet. */
  magnet: FocusParts['magnet'];
  /** A phone-width screen, where the keyboard covers the foot. */
  phone: boolean;
}) {
  const format = useFormat();
  const { bar } = studio;
  const pill = pillOf(studio, words, part === 'hidden', phone);
  const shown = barViewOf(name, place, editing, {
    studio,
    view,
    units,
    words,
    format,
    crowded,
    editable: editing.kind === 'editor',
    part,
    magnetPart: magnet,
  });
  const { mark, title, status, bad, chips, acts, tools } = shown;
  const actsHolder = useRef<HTMLSpanElement>(null);
  const kind = pill === null ? (bar?.kind ?? 'start') : `pill-${bar?.kind}`;
  // A bar act that swaps the bar (Draw myself, Close shape, Cancel) takes its own button away:
  // focus goes to the new bar's main act, never lost to the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the bar's kind is what swaps the acts
  useEffect(() => {
    if (document.activeElement !== document.body) return;
    const holder = actsHolder.current;
    const next =
      holder?.querySelector<HTMLButtonElement>('button[data-variant="primary"]:not(:disabled)') ??
      holder?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    // A bar with no act of its own (a pill's Lock, Hide or Remove just done) takes focus itself.
    (next ?? document.querySelector<HTMLElement>('.hg-studio-bar.hg-focus-target'))?.focus();
  }, [kind]);
  // The size card holds Place roof while the phone's keyboard covers the foot: nothing shows here.
  if (pill === null && bar?.kind === 'typing') {
    return <div ref={barRef} className="hg-studio-glass hg-studio-bar" data-hidden="true" inert />;
  }
  if (pill !== null) {
    return (
      <div ref={barRef} className="hg-studio-glass hg-studio-bar" data-kind="pill">
        <span ref={actsHolder} className="hg-studio-bar-acts">
          {pill}
        </span>
      </div>
    );
  }
  const hasActs = acts.length > 0 || Boolean(tools);
  // A slim bar with nothing to say and nothing to press (a reader's, at rest) is not drawn.
  const gone = part === 'hidden' || (shown.slim && status === null && !hasActs);
  if (shown.slim) {
    return (
      <div
        ref={barRef}
        className="hg-studio-glass hg-studio-bar hg-focus-target"
        tabIndex={-1}
        data-kind="pill"
        data-tone={bad ? 'bad' : undefined}
        data-hidden={gone}
        inert={gone}
      >
        <span className="hg-studio-pill-text" role="status">
          <BarLine status={status} bad={bad} />
        </span>
        {hasActs ? (
          <span ref={actsHolder} className="hg-studio-bar-acts">
            {tools}
            <BarActs acts={acts} />
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div
      ref={barRef}
      className="hg-studio-glass hg-studio-bar hg-focus-target"
      tabIndex={-1}
      data-tone={bad ? 'bad' : undefined}
      data-chips={Boolean(chips)}
      data-hidden={gone}
      inert={gone}
    >
      <span className="hg-studio-bar-mark" data-mark={mark} aria-hidden>
        <ShellGlyph name={mark} size="sm" />
      </span>
      <span className="hg-studio-bar-words">
        <span className="hg-studio-bar-name">{title}</span>
        <span className="hg-studio-bar-status" role="status">
          <BarLine status={status} bad={false} />
        </span>
        {chips}
      </span>
      {hasActs ? (
        <span ref={actsHolder} className="hg-studio-bar-acts">
          {tools}
          <BarActs acts={acts} />
        </span>
      ) : null}
    </div>
  );
}
