import { QUALIFY_QUESTIONS } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
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
  words,
}: QualifyCardProps) {
  return (
    <Card className="hg-qualify">
      <div className="hg-qualify-head">
        <span className="hg-qualify-title">{words.title}</span>
        <span className="hg-qualify-count">{words.count(answered, QUALIFY_QUESTIONS.length)}</span>
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
      </div>
      {questions.map((view) => (
        <QualifyQuestion
          key={view.question}
          view={view}
          onAnswer={onAnswer}
          onRetry={onRetry}
          words={words}
        />
      ))}
      {markQualified === null ? null : <MarkQualified act={markQualified} words={words} />}
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
