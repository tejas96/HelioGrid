'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { type StudioEditing, type StudioScreen, usePassingMessage } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, MessageTone, StudioView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, IconButton, ShellGlyph, type ShellGlyphName, useFormat } from '@heliogrid/ui';
import { type Ref, useEffect, useRef } from 'react';
import { pillOf } from './StudioBarPills';
import { alertMessagesOf, type BarView, barMessagesOf } from './StudioBarViews';

const TONE_GLYPH: Readonly<Record<MessageTone, ShellGlyphName>> = {
  info: 'info',
  warning: 'alert-triangle',
  error: 'alert-circle',
};

/**
 * The one bottom bar of the studio (`T-M05-002`). It is there only when there is something to
 * say: one message — information, a warning or an error — with its one act when it has its own,
 * and ×. With nothing to say it is not there, and the roof keeps the screen. While a job is in
 * hand (drawing, typing the size, your picture's card) the foot is that job's slim pill instead.
 */
export function StudioBottomBar({
  barRef,
  studio,
  view,
  units,
  editing,
  words,
  part,
  crowded,
  phone,
  sheet,
  onAway,
}: {
  /** The foot the camera measures; `null` while a panel holds the foot (a roof's sheet, Roofs, the picker). */
  barRef: Ref<HTMLDivElement> | null;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  editing: StudioEditing;
  words: StudioCanvasWords;
  /** Focus mode: the whole bar, its words alone, or none. */
  part: FocusParts['bottomBar'];
  /** The corner held is crowded by another on the screen: the bar asks for a closer look. */
  crowded: boolean;
  /** A phone-width screen, where the keyboard covers the foot. */
  phone: boolean;
  /** A panel holds the foot (a roof's sheet, Roofs, the picker): only what must not wait is said, on its top edge. */
  sheet: boolean;
  /** Where focus goes once a message is closed: the map. */
  onAway: () => void;
}) {
  const format = useFormat();
  const { bar } = studio;
  const pill = sheet ? null : pillOf(studio, words, part === 'hidden', phone);
  // The size card holds Place roof while the phone's keyboard covers the foot: nothing shows there.
  const typing = pill === null && bar?.kind === 'typing';
  // A job holds the foot — its pill, the size card, or a panel (a roof's sheet, Roofs, the picker).
  const job = sheet || part === 'hidden' || pill !== null || typing;
  const facts = { studio, view, units, words, format, crowded, part };
  // Every message is known to the hook, so one closed stays closed through a job; while a job
  // holds the foot only what must not wait shows, above it. The worst shows; an info line with
  // nothing to press goes by itself, × closes any.
  const urgent = new Set(alertMessagesOf(editing, facts).map((alert) => alert.key));
  const { shown, close: hide } = usePassingMessage(
    barMessagesOf(editing, { ...facts, part: part === 'hidden' ? 'main' : part }),
    (message) => !job || urgent.has(message.key),
  );
  const actsHolder = useRef<HTMLSpanElement>(null);
  const kind = pill === null ? (bar?.kind ?? 'start') : `pill-${bar?.kind}`;
  // A bar act that swaps the bar (Close shape, Cancel) takes its own button away:
  // focus goes to the new bar's main act, never lost to the page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the bar's kind is what swaps the acts
  useEffect(() => {
    if (document.activeElement !== document.body) return;
    const holder = actsHolder.current;
    const next =
      holder?.querySelector<HTMLButtonElement>('button[data-variant="primary"]:not(:disabled)') ??
      holder?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    next?.focus();
  }, [kind]);
  // The camera measures the foot: empty, the pill, or nothing while a panel holds it. A message
  // is never measured, so the roof does not move as one comes and goes; the tools lift above it.
  const foot = sheet ? null : pill !== null ? (
    <div ref={barRef} className="hg-studio-glass hg-studio-bar" data-kind="pill">
      <span ref={actsHolder} className="hg-studio-bar-acts">
        {pill}
      </span>
    </div>
  ) : (
    <div
      ref={barRef}
      className="hg-studio-glass hg-studio-bar"
      data-hidden="true"
      data-empty
      inert
    />
  );
  if (shown === null) return foot;
  return (
    <>
      {foot}
      <BarMessage
        shown={shown}
        job={job}
        actsHolder={job ? undefined : actsHolder}
        closeName={shown.closeLabel ?? words.closeCard}
        onClose={() => {
          hide();
          shown.onClose?.();
          onAway();
        }}
      />
    </>
  );
}

/** One message: its sign by its tone, its title and line, its chips, its one act and ×. */
function BarMessage({
  shown,
  job,
  actsHolder,
  closeName,
  onClose,
}: {
  shown: BarView;
  /** A job holds the foot: the message stands above it. */
  job: boolean;
  actsHolder: Ref<HTMLSpanElement> | undefined;
  closeName: TranslatedText;
  onClose: () => void;
}) {
  const card = shown.title !== null || shown.chips !== null;
  return (
    <div
      className="hg-studio-glass hg-studio-bar"
      data-kind={card ? 'card' : 'line'}
      data-tone={shown.tone}
      data-above-job={job}
    >
      <span className="hg-studio-bar-sign" aria-hidden>
        <ShellGlyph name={TONE_GLYPH[shown.tone]} size="md" tone="current" />
      </span>
      <span className="hg-studio-bar-words">
        {shown.title === null ? null : <span className="hg-studio-bar-name">{shown.title}</span>}
        <span
          key={shown.key}
          className="hg-studio-bar-line"
          role={shown.tone === 'info' ? 'status' : 'alert'}
        >
          {shown.line}
        </span>
        {shown.chips}
      </span>
      <span ref={actsHolder} className="hg-studio-bar-acts">
        {shown.act === null ? null : (
          <Button variant="primary" size="md" onClick={shown.act.onPress}>
            {shown.act.label}
          </Button>
        )}
        <IconButton label={closeName} variant="ghost" onClick={onClose}>
          <ShellGlyph name="close" size="md" />
        </IconButton>
      </span>
    </div>
  );
}
