import { type ReactNode, useEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Card, IconCircle } from '../Card/Card';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { ScopeNote, scopeNotePanelFrame } from '../ScopeNote/ScopeNote';
import type { RoleCardLine, RoleCardProps, RoleCardWords } from './RoleCard.types';

/**
 * The role card on the web: its head, then its rows, or their loading lines. *Try again* leaves
 * with the error card, so once the card is back focus goes to the presets' name, which stays.
 */
export function RoleCard({ words, layout, read }: RoleCardProps) {
  const presets = useRef<HTMLSpanElement>(null);
  const retried = useRef(false);
  useEffect(() => {
    if (!retried.current || read.kind === 'failed') return;
    retried.current = false;
    presets.current?.focus({ preventScroll: true });
  }, [read.kind]);
  const frame = classNames(
    'hg-role-card',
    layout === 'bounded' ? 'hg-role-card-bounded' : undefined,
  );
  if (read.kind === 'failed') {
    return (
      <Card
        className={frame}
        read={{
          ...read,
          retry: () => {
            retried.current = true;
            read.retry();
          },
        }}
        errorTitle={words.error.title}
        errorMessage={words.error.body}
        retryLabel={words.error.retry}
      />
    );
  }
  return (
    <Card className={frame}>
      <div className="hg-role-card-body">
        <div className="hg-role-card-head">
          <IconCircle size={40}>
            <ShellGlyph name="briefcase" size="md" tone="accent" />
          </IconCircle>
          <div className="hg-role-card-names">
            <span ref={presets} tabIndex={-1} className="hg-role-card-presets">
              {words.presets}
            </span>
            {words.credit === null ? null : (
              <span className="hg-role-card-credit">{words.credit}</span>
            )}
          </div>
        </div>
        {read.kind === 'loading' ? (
          <Waiting words={words} />
        ) : (
          <Rows words={words} layout={layout} />
        )}
      </div>
    </Card>
  );
}

/**
 * Bounded, the rows scroll in a named region under the head that stays; flowing, they are part of
 * the card and the surface around it scrolls. The note closes the last list.
 */
function Rows({ words, layout }: { words: RoleCardWords; layout: RoleCardProps['layout'] }) {
  const note =
    words.note === null ? null : (
      <ScopeNote
        className="hg-role-card-note"
        variant="panel"
        title={words.note.title}
        message={words.note.message}
      />
    );
  const lists = (
    <div className="hg-role-card-lists">
      <Section title={words.canDo} lines={words.grants} glyph="tick-long" tone="success">
        {words.limits.length === 0 ? note : null}
      </Section>
      {words.limits.length === 0 ? null : (
        <Section title={words.cannotDo} lines={words.limits} glyph="eye-off" tone="secondary">
          {note}
        </Section>
      )}
    </div>
  );
  if (layout === 'flowing') return lists;
  return (
    /* A tab stop, so the keyboard can scroll the rows to the note. */
    // biome-ignore lint/a11y/useSemanticElements: a scrolling list of phrases, not a page landmark.
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region must take focus to scroll.
    <div className="hg-role-card-region" role="region" aria-label={words.region} tabIndex={0}>
      {lists}
    </div>
  );
}

function Section({
  title,
  lines,
  glyph,
  tone,
  children,
}: {
  title: string;
  lines: readonly RoleCardLine[];
  glyph: ShellGlyphName;
  tone: 'success' | 'secondary';
  children?: ReactNode;
}) {
  return (
    <section className="hg-role-card-section">
      <h3 className="hg-role-card-overline">{title}</h3>
      <ul className="hg-role-card-lines">
        {lines.map((line) => (
          <li key={line.key} className="hg-role-card-line">
            <ShellGlyph name={glyph} size="md" tone={tone} />
            <span className="hg-role-card-phrase">{line.text}</span>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

/**
 * The rows wait as lines, as many as the rows they stand for, and the note as three lines in the
 * note's own panel, so the wait is the size of what it stands for.
 */
function Waiting({ words }: { words: RoleCardWords }) {
  const note = (
    <div
      className={classNames(scopeNotePanelFrame.className, 'hg-role-card-note')}
      data-variant={scopeNotePanelFrame['data-variant']}
    >
      <LoadingBars
        className="hg-role-card-note-lines"
        inBusyRegion
        bars={['line', 'line', 'line']}
      />
    </div>
  );
  return (
    <div className="hg-role-card-region" role="status" aria-busy="true" aria-label={words.loading}>
      <div className="hg-role-card-lists">
        <section className="hg-role-card-section">
          <h3 className="hg-role-card-overline">{words.canDo}</h3>
          <LoadingBars inBusyRegion bars={words.grants.map(() => 'line')} />
          {words.limits.length === 0 ? note : null}
        </section>
        {words.limits.length === 0 ? null : (
          <section className="hg-role-card-section">
            <h3 className="hg-role-card-overline">{words.cannotDo}</h3>
            <LoadingBars inBusyRegion bars={words.limits.map(() => 'line')} />
            {note}
          </section>
        )}
      </div>
    </div>
  );
}
