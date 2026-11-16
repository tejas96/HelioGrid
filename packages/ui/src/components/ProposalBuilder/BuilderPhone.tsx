import { useEffect, useImperativeHandle, useRef } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IconButton } from '../IconButton/IconButton';
import { BuilderSaveMark } from './BuilderSaveMark';
import { builderPlace, trackAt } from './ProposalBuilder.logic';
import type { ProposalBuilderProps } from './ProposalBuilder.types';

/** A settings page's parts as one scrolling row (`T-M01-030`): the one in view is the ink pill. */
function PartTabs({ props, at }: { props: ProposalBuilderProps; at: number }) {
  const row = useRef<HTMLDivElement>(null);
  /* The part in view is brought into the row's room: a part past its edge would read as unchosen. */
  useEffect(() => {
    row.current?.children[at]?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [at]);
  return (
    <div ref={row} className="hg-pbf-tabs" role="tablist" aria-label={props.words.steps}>
      {props.steps.map((item, index) => (
        <Pressable
          key={item.key}
          className="hg-pbf-tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: index === at }}
          onPress={() => props.onStep(item.key)}
        >
          <span className="hg-pbf-tab-in" data-now={index === at ? '' : undefined}>
            <ShellGlyph name={item.glyph} size="sm" />
            {item.title}
          </span>
        </Pressable>
      ))}
    </div>
  );
}

/** The phone's builder: icon bar, track, title, the step, and the floating dock. */
export function BuilderPhone(props: ProposalBuilderProps) {
  const { words, steps, current, parts } = props;
  const place = builderPlace(steps, current);
  const { step, next, previous } = place;
  const heading = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(props.titleRef, () => ({ focus: () => heading.current?.focus() }));
  if (step === undefined) return null;
  const at = place.index + 1;
  const forward = place.last ? props.onGenerate : () => next && props.onStep(next.key);
  return (
    <div className="hg-pbf" data-form="phone">
      <header className="hg-pbf-top">
        <IconButton size={44} label={words.close} onClick={props.onClose}>
          <ShellGlyph
            name={parts === undefined ? 'close' : 'chevron-left'}
            size="sm"
            tone="primary"
          />
        </IconButton>
        {parts === undefined ? (
          <Pressable
            className="hg-pbf-capsule"
            accessibilityLabel={words.openSteps(at, place.total, step.title)}
            onPress={props.onOpenSteps}
          >
            <span className="hg-pbf-capsule-count">{words.count(at, place.total)}</span>
            <span className="hg-pbf-capsule-title">{step.title}</span>
            <ShellGlyph name="chevrons-up-down" size="sm" />
          </Pressable>
        ) : (
          <span className="hg-pbf-capsule hg-pbf-capsule-still">
            <span className="hg-pbf-capsule-title">{props.title}</span>
          </span>
        )}
        {props.onPreview === undefined ? (
          <span className="hg-pbf-top-gap" />
        ) : (
          <IconButton size={44} label={words.preview} onClick={props.onPreview}>
            <ShellGlyph name="eye" size="sm" tone="primary" />
          </IconButton>
        )}
      </header>
      {parts === undefined ? (
        <div className="hg-pbf-track" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.key}
              className="hg-pbf-track-part"
              data-at={trackAt(index, place.index)}
              data-todo={item.standing === 'to_do' && index !== place.index ? '' : undefined}
            />
          ))}
        </div>
      ) : (
        <PartTabs props={props} at={place.index} />
      )}
      <div className="hg-pbf-scroll">
        <div className="hg-pbf-title" key={step.key}>
          <h1 ref={heading} tabIndex={-1} className="hg-pbf-heading hg-focus-target">
            {step.heading}
          </h1>
          <p className="hg-pbf-under">
            <span>{props.customerLine}</span>
            <BuilderSaveMark save={props.save} words={words} />
          </p>
        </div>
        {props.children}
      </div>
      <div className="hg-pbf-dock">
        <IconButton
          size={52}
          variant="ghost"
          className="hg-pbf-dock-back"
          label={words.back}
          disabled={place.first}
          onClick={() => previous && props.onStep(previous.key)}
        >
          <ShellGlyph name="chevron-left" size="md" tone="primary" />
        </IconButton>
        <Pressable className="hg-pbf-dock-next" onPress={forward}>
          <span className="hg-pbf-dock-word">
            {next === undefined ? words.last : words.next(next.title)}
          </span>
          <ShellGlyph
            name={place.last ? (parts === undefined ? 'document' : 'check') : 'arrow-right'}
            size="md"
            tone="inverse"
          />
        </Pressable>
      </div>
    </div>
  );
}
