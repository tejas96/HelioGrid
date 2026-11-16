import { useImperativeHandle, useRef } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Switch } from '../Switch/Switch';
import { BuilderSaveMark } from './BuilderSaveMark';
import { BuilderStageView } from './BuilderStage';
import { type BuilderPlace, builderPlace } from './ProposalBuilder.logic';
import type { BuilderStep, ProposalBuilderProps } from './ProposalBuilder.types';
import './BuilderDesktop.css';

/** What a rail node shows: the step's number while it is in view, else its standing's mark. */
function RailNode({
  step,
  now,
  number,
  part,
}: {
  step: BuilderStep;
  now: boolean;
  number: number;
  part: boolean;
}) {
  /* A settings page's part has no number and no standing: it wears its own glyph. */
  if (part) return <ShellGlyph name={step.glyph} size="sm" />;
  if (now) return <span className="hg-pbf-rail-node">{number}</span>;
  return (
    <span className="hg-pbf-rail-node">
      <ShellGlyph name={step.standing === 'to_do' ? 'alert' : 'check'} size="sm" />
    </span>
  );
}

function Rail({ props, place }: { props: ProposalBuilderProps; place: BuilderPlace }) {
  const { words } = props;
  return (
    <nav className="hg-pbf-rail" aria-label={words.steps}>
      {props.steps.map((step, index) => {
        const now = index === place.index;
        return (
          <Pressable
            key={step.key}
            className="hg-pbf-rail-step"
            accessibilityLabel={
              props.parts === undefined ? words.spokenStep(step.title, step.standing) : step.title
            }
            accessibilityState={{ current: now }}
            onPress={() => props.onStep(step.key)}
          >
            <span
              className="hg-pbf-rail-in"
              data-now={now ? '' : undefined}
              data-stand={props.parts === undefined ? step.standing : undefined}
            >
              <RailNode step={step} now={now} number={index + 1} part={props.parts !== undefined} />
              <span className="hg-pbf-rail-word">{step.title}</span>
            </span>
          </Pressable>
        );
      })}
    </nav>
  );
}

/** The top bar: a draft's — close, title, Quick and Generate — or a settings page's own head. */
function BuilderBar({ props }: { props: ProposalBuilderProps }) {
  const { words, quick, parts } = props;
  const status = (
    <span className="hg-pbf-bar-status">
      {props.status}
      <BuilderSaveMark save={props.save} words={words} />
    </span>
  );
  if (parts !== undefined) {
    return (
      <header className="hg-pbf-bar">
        <div className="hg-pbf-bar-start">
          <span className="hg-pbf-bar-name">
            {parts.trail}
            {status}
          </span>
        </div>
        <div className="hg-pbf-bar-end">
          <span className="hg-pbf-bar-note">{parts.note}</span>
          <Button variant="primary" size="md" onClick={props.onGenerate}>
            {words.generate}
          </Button>
        </div>
      </header>
    );
  }
  return (
    <header className="hg-pbf-bar">
      <div className="hg-pbf-bar-start">
        <IconButton size={44} label={words.close} onClick={props.onClose}>
          <ShellGlyph name="close" size="sm" tone="primary" />
        </IconButton>
        <span className="hg-pbf-bar-name">
          <span className="hg-pbf-bar-title">{props.title}</span>
          {status}
        </span>
      </div>
      <div className="hg-pbf-bar-end">
        {quick === undefined ? null : (
          <span className="hg-pbf-quick">
            <Switch
              checked={quick.on}
              onChange={quick.onChange}
              label={words.quick}
              toggleAt="start"
            />
          </span>
        )}
        <Button
          variant="primary"
          size="md"
          iconRight={<ShellGlyph name="document" size="sm" tone="inverse" />}
          onClick={props.onGenerate}
        >
          {words.generate}
        </Button>
      </div>
    </header>
  );
}

/** The desktop's builder: top bar, the labelled rail, the stage, and the step in its card. */
export function BuilderDesktop(props: ProposalBuilderProps) {
  const { words, payable, stage } = props;
  const place = builderPlace(props.steps, props.current);
  const { step, next, previous } = place;
  const heading = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(props.titleRef, () => ({ focus: () => heading.current?.focus() }));
  if (step === undefined) return null;
  const toFix = props.toFix ?? 0;
  const forward = place.last ? props.onGenerate : () => next && props.onStep(next.key);
  const lastWord = toFix > 0 ? words.lastToFix(toFix) : words.last;
  const lastGlyph = props.parts === undefined ? 'document' : 'check';
  return (
    <div className="hg-pbf" data-form="desktop">
      <BuilderBar props={props} />
      <Rail props={props} place={place} />
      <div className="hg-pbf-body" data-stage={stage === undefined ? undefined : ''}>
        {stage === undefined ? null : <BuilderStageView stage={stage} />}
        <section className="hg-pbf-editor">
          <div className="hg-pbf-editor-head" key={step.key}>
            <span className="hg-pbf-over hg-overline">
              {words.stepOf(place.index + 1, place.total)}
            </span>
            <h1 ref={heading} tabIndex={-1} className="hg-pbf-editor-heading hg-focus-target">
              {step.heading}
            </h1>
          </div>
          <div className="hg-pbf-editor-body">{props.children}</div>
          <div className="hg-pbf-editor-foot">
            <Button
              variant="secondary"
              size="lg"
              disabled={place.first}
              onClick={() => previous && props.onStep(previous.key)}
            >
              {words.back}
            </Button>
            <span className="hg-pbf-pay">
              {payable === undefined ? null : (
                <>
                  <span className="hg-pbf-pay-label">{payable.label}</span>
                  <span className="hg-pbf-pay-figure">{payable.text}</span>
                </>
              )}
            </span>
            <Button
              variant="primary"
              size="lg"
              iconRight={
                <ShellGlyph
                  name={place.last ? lastGlyph : 'arrow-right'}
                  size="sm"
                  tone="inverse"
                />
              }
              onClick={forward}
            >
              {next === undefined ? lastWord : words.next(next.title)}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
