import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { CategoryHue } from '../Avatar/Avatar.types';
import { HueTile } from '../HueTile/HueTile';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { FieldSave, StepFact, StepNotice } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { saveActOf, saveFaultOf } from './step-controls';

/** A notice a step raises (`M06-30`, `T-M06-023`): what is so, what to do, and the act that does it. */
export function StepNote({
  notice,
  tone,
  glyph,
}: {
  notice: StepNotice;
  tone: 'danger' | 'warning' | 'info';
  glyph: ShellGlyphName;
}) {
  const body = (
    <>
      <ShellGlyph name={glyph} size="md" />
      <span className="hg-pst-note-words">
        <span className="hg-pst-note-title">{notice.title}</span>
        <span className="hg-pst-note-line">{notice.line}</span>
      </span>
      {notice.act === undefined ? null : (
        <span className="hg-pst-note-act">{notice.act.label}</span>
      )}
    </>
  );
  return notice.act === undefined ? (
    <div className="hg-pst-note" data-tone={tone} role="status">
      {body}
    </div>
  ) : (
    <Pressable className="hg-pst-note" onPress={notice.act.onPress}>
      <span className="hg-pst-note-in" data-tone={tone}>
        {body}
      </span>
    </Pressable>
  );
}

/** A quiet line under a step's controls: who may change something, or where a change reaches. */
export function StepHint({
  glyph = 'info',
  children,
}: {
  glyph?: ShellGlyphName;
  children: ReactNode;
}) {
  return (
    <p className="hg-pst-hint">
      <ShellGlyph name={glyph} size="sm" />
      <span>{children}</span>
    </p>
  );
}

/** Read-only facts, one row each: a glyph, what it is, and its value as written. */
export function StepFacts({ facts }: { facts: readonly StepFact[] }) {
  return (
    <div className="hg-pst-facts hg-pst-tile">
      {facts.map((fact) => (
        <div className="hg-pst-fact" key={fact.key}>
          <ShellGlyph name={fact.glyph} size="md" />
          <span className="hg-pst-fact-words">
            <span className="hg-pst-fact-label">{fact.label}</span>
            <span className="hg-pst-fact-value">{fact.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** A worded act set in a step's own flow — *Add a step*, *Reset*. */
export function LinkAct({
  glyph,
  label,
  onPress,
  quiet = false,
}: {
  glyph: ShellGlyphName;
  label: TranslatedText;
  onPress: () => void;
  quiet?: boolean;
}) {
  return (
    <Pressable className="hg-pst-link" onPress={onPress}>
      <span className="hg-pst-link-in" data-quiet={quiet ? '' : undefined}>
        <ShellGlyph name={glyph} size="sm" />
        {label}
      </span>
    </Pressable>
  );
}

/** What a field's last commit came to, under the field it belongs to (`T-M06-023`). */
export function FieldSaveLine({
  save,
  words,
}: {
  save: FieldSave | undefined;
  words: ProposalStepWords;
}) {
  if (save === undefined) return null;
  if (save.kind === 'saved' || save.kind === 'saving') {
    return (
      <span className="hg-pst-saved" role="status">
        {save.kind === 'saved' ? <ShellGlyph name="check" size="sm" tone="success" /> : null}
        {save.kind === 'saved' ? (save.reason ?? words.saved) : words.saving}
      </span>
    );
  }
  const act = saveActOf(save);
  const line = (
    <span className="hg-pst-fault">
      <ShellGlyph name="alert-circle" size="sm" tone="warning" />
      {saveFaultOf(save, words)}
    </span>
  );
  return act === undefined ? (
    <span role="status">{line}</span>
  ) : (
    <Pressable className="hg-pst-fault-press" onPress={act}>
      {line}
    </Pressable>
  );
}

/** One folded row's head and body. The body is in the page always; folded, it is only out of sight. */
export function FoldRow({
  glyph,
  hue,
  title,
  value,
  open,
  onToggle,
  aside,
  children,
}: {
  glyph: ShellGlyphName;
  hue: CategoryHue | HueTileTone;
  title: TranslatedText;
  value: TranslatedText;
  open?: boolean;
  onToggle?: () => void;
  /** A control in the head itself — the incentive's switch. Then the row does not fold. */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const head = (
    <>
      <HueTile glyph={glyph} hue={hue} size={36} />
      <span className="hg-pst-fold-words">
        <span className="hg-pst-fold-title">{title}</span>
        <span className="hg-pst-fold-value">{value}</span>
      </span>
    </>
  );
  if (onToggle === undefined) {
    return (
      <div className="hg-pst-fold">
        <div className="hg-pst-fold-head">
          {head}
          {aside}
        </div>
      </div>
    );
  }
  return (
    <div className="hg-pst-fold" data-open={open === true ? '' : undefined}>
      <Pressable
        className="hg-pst-fold-press"
        accessibilityState={{ expanded: open === true }}
        onPress={onToggle}
      >
        <span className="hg-pst-fold-head">
          {head}
          <span className="hg-pst-fold-chevron">
            <ShellGlyph name="chevron" size="sm" />
          </span>
        </span>
      </Pressable>
      <div className="hg-pst-fold-body" inert={open === true ? undefined : true}>
        <div className="hg-pst-fold-inner">{children}</div>
      </div>
    </div>
  );
}
