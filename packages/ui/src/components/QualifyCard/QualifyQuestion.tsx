import type { QualifyQuestionView, QualifyQuestion as Question } from '@heliogrid/domain';
import { type RefObject, useRef } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap';
import { NumberField } from '../NumberField';
import type { QualifyCardProps } from './QualifyCard.types';

interface QualifyQuestionProps {
  view: QualifyQuestionView;
  onAnswer: QualifyCardProps['onAnswer'];
  onRetry: QualifyCardProps['onRetry'];
  words: QualifyCardProps['words'];
}

/**
 * One qualifying question (`M02-39`): its words, where its answer stands — not asked, on its way,
 * saved — and its answer: the bill typed, or one chip of its set. An answer that came back unsaved
 * says so here, with Try again; once that goes, focus lands on the question's own words.
 */
export function QualifyQuestion({ view, onAnswer, onRetry, words }: QualifyQuestionProps) {
  const heading = useRef<HTMLSpanElement>(null);
  const { question, save } = view;
  const failed = save?.status === 'failed';
  return (
    <div className="hg-qualify-question" data-failed={failed ? 'true' : undefined}>
      <div className="hg-qualify-label-row">
        <span ref={heading} tabIndex={-1} className="hg-qualify-label hg-focus-target">
          {words.question[question]}
        </span>
        <Standing view={view} words={words} />
      </div>
      {question === 'monthlyBill' ? (
        <Bill view={view} onAnswer={onAnswer} words={words} />
      ) : (
        <Choices view={view} question={question} onAnswer={onAnswer} words={words} />
      )}
      {failed ? (
        <FailLine onRetry={() => onRetry(question)} heading={heading} words={words} />
      ) : null}
    </div>
  );
}

function Standing({ view, words }: Pick<QualifyQuestionProps, 'view' | 'words'>) {
  if (view.save?.status === 'saving') {
    return <span className="hg-qualify-saving">{words.saving}</span>;
  }
  if (view.savedMark) {
    return (
      <span className="hg-qualify-saved" role="status">
        <ShellGlyph name="tick" size="sm" tone="success" />
        {words.saved}
      </span>
    );
  }
  if (view.saved === null && view.save === null) {
    return <NamedGap gap={words.notAsked} scale="cell" />;
  }
  return null;
}

function Bill({ view, onAnswer, words }: Omit<QualifyQuestionProps, 'onRetry'>) {
  const { pack } = useFormat();
  return (
    <NumberField
      label={words.question.monthlyBill}
      labelSpokenOnly
      words={words.billField}
      value={view.shown === null ? undefined : Number(view.shown)}
      onCommit={(value) => onAnswer('monthlyBill', String(value))}
      onClear={() => onAnswer('monthlyBill', null)}
      currency
      outOfRange="refuse"
      min={0}
      precision={pack.minorUnitDigits}
      provenance="assumed"
      density="functional"
    />
  );
}

function Choices({
  view,
  question,
  onAnswer,
  words,
}: Omit<QualifyQuestionProps, 'onRetry'> & { question: Exclude<Question, 'monthlyBill'> }) {
  const failedValue = view.save?.status === 'failed' ? view.save.value : null;
  return (
    <div className="hg-qualify-choices" role="radiogroup" aria-label={words.question[question]}>
      {view.choices.map((value) => {
        const chosen = view.shown === value;
        return (
          <Pressable
            key={value}
            className="hg-chip-target hg-chip-target--expressive"
            accessibilityRole="radio"
            accessibilityState={{ checked: chosen }}
            haptic="selection"
            onPress={() => onAnswer(question, value)}
          >
            <Chip active={chosen} tone={failedValue === value ? 'danger' : 'neutral'}>
              {failedValue === value ? <ShellGlyph name="alert" size="sm" tone="danger" /> : null}
              {words.choice(question, value)}
            </Chip>
          </Pressable>
        );
      })}
    </div>
  );
}

function FailLine({
  onRetry,
  heading,
  words,
}: {
  onRetry: () => void;
  heading: RefObject<HTMLSpanElement | null>;
  words: QualifyCardProps['words'];
}) {
  const leaving = useFocusAfter(heading);
  return (
    <div className="hg-qualify-fail" role="alert">
      <ShellGlyph name="alert" size="sm" tone="danger" />
      <span className="hg-qualify-fail-words">{words.notSaved}</span>
      <Button variant="secondary" size="sm" onClick={leaving(onRetry)}>
        {words.retry}
      </Button>
    </div>
  );
}
