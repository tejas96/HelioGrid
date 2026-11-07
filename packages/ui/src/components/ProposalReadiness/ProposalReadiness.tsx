import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { ListRow } from '../ListRow/ListRow';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { ProgressRing } from '../ProgressRing/ProgressRing';
import { StatusChip } from '../StatusChip/StatusChip';
import type { ProposalReadinessProps, ReadinessStep } from './ProposalReadiness.types';

type CssVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The first-proposal hero and its steps (`ProposalReadiness.types.ts`): the ring, what the steps
 * are for and the next one as the hero's action, then every step as a row rising into place.
 */
export function ProposalReadiness({
  words,
  done,
  total,
  steps,
  next,
  loading,
}: ProposalReadinessProps) {
  return (
    <div className="hg-readiness">
      <HeroPanel label={words.overline}>
        {loading ? (
          <LoadingBars bars={['panel']} label={words.loading} />
        ) : (
          <div className="hg-readiness-body">
            <div className="hg-readiness-head">
              <div className="hg-readiness-words">
                <Text variant="h2" as="h2">
                  {words.title}
                </Text>
                <Text variant="body" color="secondary">
                  {words.line}
                </Text>
              </div>
              <ProgressRing
                share={total === 0 ? 0 : done / total}
                value={`${done}/${total}`}
                caption={words.done}
                spokenName={words.count}
              />
            </div>
            {next === null ? null : <NextStep step={next} words={words} />}
          </div>
        )}
      </HeroPanel>
      {loading ? null : (
        <ul className="hg-readiness-steps" aria-label={words.stepsName}>
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="hg-readiness-step"
              style={{ '--i': String(Math.min(index, 8)) } as CssVars}
            >
              <ListRow
                icon={<ShellGlyph name={step.icon} size="md" tone="accent" />}
                title={step.label}
                subtitle={step.detail}
                subtitleWrap
                trailing={<StepMark step={step} doneWord={words.done} />}
                onClick={step.onOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The next step, inside the hero: its glyph, its name and what it fills in, and the way there. */
function NextStep({
  step,
  words,
}: {
  step: ReadinessStep;
  words: ProposalReadinessProps['words'];
}) {
  return (
    <div className="hg-readiness-next">
      <span className="hg-readiness-next-icon" aria-hidden="true">
        <ShellGlyph name={step.icon} size="md" tone="accent" />
      </span>
      <div className="hg-readiness-next-words">
        <Text variant="overline" color="secondary">
          {words.next}
        </Text>
        <Text variant="body" bold>
          {step.label}
        </Text>
        <Text variant="body-sm" color="secondary">
          {step.detail}
        </Text>
      </div>
      <Button variant="primary" size="md" onClick={step.onOpen}>
        {words.continueLabel}
      </Button>
    </div>
  );
}

/** Done says so with its glyph and word; a step still open leads on; an unjudged one draws nothing. */
function StepMark({ step, doneWord }: { step: ReadinessStep; doneWord: TranslatedText }) {
  if (step.done === true) return <StatusChip label={doneWord} tone="success" />;
  if (step.done === false) return <ShellGlyph name="chevron-right" size="sm" />;
  return null;
}
