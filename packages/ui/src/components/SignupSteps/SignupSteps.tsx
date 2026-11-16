import { Stepper } from '../Stepper';
import type { SignupStepsProps } from './SignupSteps.types';

/**
 * The step a person is on: one overline — *STEP 2 OF 3 · YOUR COMPANY* — over the `Stepper`'s
 * numbered bars, the done ones and the one in view filled. From the door's breakpoint each bar
 * carries its step's number and name, and the one in view fills once as the step opens. The
 * separator is drawn (`SignupSteps.css`), so no word sits in the markup.
 */
export function SignupSteps({ words, current }: SignupStepsProps) {
  const total = words.steps.length;
  return (
    <section className="hg-signup-steps" aria-label={words.label}>
      <p className="hg-signup-steps-words hg-overline">
        <span>{words.stepper.counter({ current: current + 1, total })}</span>
        <span className="hg-signup-steps-name">{words.steps[current]}</span>
      </p>
      {/* The rail repeats what the overline says, so it is hidden from a screen reader: no second
          landmark of the same name. */}
      <div className="hg-signup-steps-rail" aria-hidden="true">
        <Stepper
          variant="numbered-bars"
          words={words.stepper}
          steps={[...words.steps]}
          current={current}
          fillIn
        />
      </div>
    </section>
  );
}
