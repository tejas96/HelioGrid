import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { HueTile } from '../HueTile/HueTile';
import { Switch } from '../Switch/Switch';
import type { BuilderStep, ProposalStepListProps } from './ProposalBuilder.types';
import { riseOrder } from './rise';
import './ProposalStepList.css';

function StepRow({
  step,
  index,
  now,
  props,
}: {
  step: BuilderStep;
  index: number;
  now: boolean;
  props: ProposalStepListProps;
}) {
  const { words } = props;
  /* A step Quick mode hides stands on its default, whatever its own standing says. */
  const standing = step.quiet === true && step.standing !== 'to_do' ? 'default' : step.standing;
  return (
    <Pressable
      className="hg-pbf-steprow"
      accessibilityState={{ current: now }}
      onPress={() => props.onStep(step.key)}
    >
      <span
        className="hg-pbf-steprow-in"
        data-now={now ? '' : undefined}
        data-quiet={step.quiet === true ? '' : undefined}
        style={riseOrder(index)}
      >
        <HueTile
          glyph={step.glyph}
          hue={step.standing === 'to_do' ? 'warning' : 'ocean'}
          size={36}
          stroke={1.7}
        />
        <span className="hg-pbf-steprow-words">
          <span className="hg-pbf-steprow-name">{step.heading}</span>
          {step.summary === undefined ? null : (
            <span className="hg-pbf-steprow-line">{step.summary}</span>
          )}
        </span>
        <span className="hg-pbf-stand" data-stand={standing}>
          <ShellGlyph name={standing === 'to_do' ? 'alert-circle' : 'tick-small'} size="sm" />
          {words.standing[standing]}
        </span>
      </span>
    </Pressable>
  );
}

/**
 * Every step in one list (`M06-24`): the phone's capsule opens it, and so does a long title the
 * capsule had to cut. A step Quick mode hides is offered quietly; opening it is the expansion.
 */
export function ProposalStepList(props: ProposalStepListProps) {
  const { words, quick } = props;
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.closeLabel}
      showClose
      title={words.title}
      desktop="modal"
      footer={
        <div className="hg-pbf-sheet-foot">
          <Button variant="primary" size="lg" fullWidth onClick={props.onGenerate}>
            {words.generate}
          </Button>
          <span className="hg-pbf-foot-note">{words.note}</span>
        </div>
      }
    >
      <div className="hg-pbf-steplist">
        {quick === undefined ? null : (
          <div className="hg-pbf-quickrow">
            <Switch
              checked={quick.on}
              onChange={quick.onChange}
              label={words.quickLabel}
              description={words.quickLine}
            />
          </div>
        )}
        <div className="hg-pbf-steps">
          {props.steps.map((step, index) => (
            <StepRow
              key={step.key}
              step={step}
              index={index}
              now={step.key === props.current}
              props={props}
            />
          ))}
        </div>
      </div>
    </EditorSurface>
  );
}
