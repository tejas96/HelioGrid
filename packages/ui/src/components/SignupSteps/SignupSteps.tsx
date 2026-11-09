import type { SignupStepsProps } from './SignupSteps.types';

/**
 * The step a person is on: one overline — *STEP 2 OF 3 · YOUR COMPANY* — over a rail of three
 * tracks, the done ones and the one in view filled with the logo's light. From the door's breakpoint
 * each track carries its step's name. The separator is drawn (`SignupSteps.css`), so no word sits
 * in the markup; the rail repeats what the overline says, so it is hidden from screen readers.
 */
export function SignupSteps({ words, current }: SignupStepsProps) {
  const total = words.steps.length;
  return (
    <section className="hg-signup-steps" aria-label={words.label}>
      <p className="hg-signup-steps-words">
        <span>{words.stepper.counter({ current: current + 1, total })}</span>
        <span className="hg-signup-steps-name">{words.steps[current]}</span>
      </p>
      <span className="hg-signup-steps-rail" aria-hidden="true">
        {words.steps.map((step, index) => (
          <span
            key={step}
            className="hg-signup-steps-step"
            data-state={index < current ? 'done' : index === current ? 'current' : 'next'}
          >
            <span className="hg-signup-steps-track">
              <span className="hg-signup-steps-fill" />
            </span>
            <span className="hg-signup-steps-label">{step}</span>
          </span>
        ))}
      </span>
    </section>
  );
}
