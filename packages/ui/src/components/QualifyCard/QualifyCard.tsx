import { QUALIFY_QUESTIONS } from '@heliogrid/domain';
import { useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { FoldHead } from '../FoldHead';
import type { QualifyCardProps, QualifyMarkAct } from './QualifyCard.types';
import { QualifyQuestion } from './QualifyQuestion';

/**
 * The six qualifying questions inline on the lead (`M02-39`): no form and no submit — each answer
 * saves alone as it is given, the count and the dots follow the record, and Mark qualified sits
 * under them because the person decides, never the answers (`M02-45`).
 */
export function QualifyCard({
  questions,
  answered,
  onAnswer,
  onRetry,
  markQualified,
  foldable,
  words,
}: QualifyCardProps) {
  const [opened, setOpen] = useState(!foldable);
  /* A save that came back undone opens the card, folded or not: its Try again is inside. */
  const failed =
    questions.some((each) => each.save?.status === 'failed') ||
    (markQualified !== null && markQualified.failure !== null);
  const open = opened || failed;
  const count = words.count(answered, QUALIFY_QUESTIONS.length);
  const dots = (
    <span className="hg-qualify-dots" aria-hidden="true">
      {questions.map((each) => (
        <span
          key={each.question}
          className="hg-qualify-dot"
          data-on={each.saved === null ? undefined : 'true'}
          data-failed={each.save?.status === 'failed' ? 'true' : undefined}
        />
      ))}
    </span>
  );
  return (
    <Card className="hg-qualify">
      {foldable ? (
        <FoldHead
          title={words.title}
          meta={count}
          aside={dots}
          open={open}
          onToggle={() => setOpen(!opened)}
        />
      ) : (
        <div className="hg-qualify-head">
          <Text variant="h3">{words.title}</Text>
          <Text variant="caption" color="secondary">
            {count}
          </Text>
          {dots}
        </div>
      )}
      {open
        ? questions.map((view) => (
            <QualifyQuestion
              key={view.question}
              view={view}
              onAnswer={onAnswer}
              onRetry={onRetry}
              words={words}
            />
          ))
        : null}
      {open && markQualified !== null ? <MarkQualified act={markQualified} words={words} /> : null}
    </Card>
  );
}

function MarkQualified({ act, words }: { act: QualifyMarkAct; words: QualifyCardProps['words'] }) {
  return (
    <div className="hg-qualify-mark">
      <Button
        variant="secondary"
        size="md"
        loading={act.pending}
        icon={<ShellGlyph name="tick" size="sm" tone="secondary" />}
        onClick={act.onPress}
      >
        {words.markQualified}
      </Button>
      <span className="hg-qualify-mark-line">{words.markQualifiedLine}</span>
      {act.failure === null ? null : (
        <p className="hg-qualify-mark-fail" role="alert">
          {act.failure}
        </p>
      )}
    </div>
  );
}
