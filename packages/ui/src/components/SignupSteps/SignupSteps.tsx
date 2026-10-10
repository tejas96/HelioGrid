import { Stepper } from '../Stepper/Stepper';
import type { SignupStepsProps } from './SignupSteps.types';

/** Both forms are in the DOM; `SignupSteps.css` shows one of the two, never both. */
export function SignupSteps({ words, current }: SignupStepsProps) {
  const steps = [...words.steps];
  return (
    <>
      <div className="hg-signup-steps-track">
        <Stepper
          variant="progress"
          label={words.label}
          steps={steps}
          current={current}
          reachability="entered"
        />
      </div>
      <div className="hg-signup-steps-numbered">
        <Stepper
          variant="numbered"
          label={words.label}
          steps={steps}
          current={current}
          reachability="entered"
        />
      </div>
    </>
  );
}
