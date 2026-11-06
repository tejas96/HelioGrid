import type { SignupStepsProps } from './SignupSteps.types';

/**
 * The step a person is on, said quietly: one overline — *STEP 2 OF 3 · YOUR COMPANY* — and a dot
 * per step. The separator is drawn (`SignupSteps.css`), so no word sits in the markup.
 */
export function SignupSteps({ words, current }: SignupStepsProps) {
  const total = words.steps.length;
  return (
    <section className="hg-signup-steps" aria-label={words.label}>
      <p className="hg-signup-steps-words">
        <span>{words.stepper.counter({ current: current + 1, total })}</span>
        <span className="hg-signup-steps-name">{words.steps[current]}</span>
      </p>
      <span className="hg-signup-steps-dots" aria-hidden="true">
        {words.steps.map((step, index) => (
          <span
            key={step}
            className="hg-signup-steps-dot"
            data-state={index < current ? 'done' : index === current ? 'current' : 'next'}
          />
        ))}
      </span>
    </section>
  );
}
