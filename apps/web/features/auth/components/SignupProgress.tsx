import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Stepper } from '@heliogrid/ui';

/**
 * The flow's three steps atop the task column (`SCR-M01-02` decisions 2 and 13): gated, because
 * the company details read the verified account and cannot be jumped to before it exists; going
 * back stays open. From the door's breakpoint the component's numbered form with the steps
 * spelled out; under it the phone's track and counter, where 335px holds no step names — both
 * in the DOM, company-signup.css shows one of the two, never both. The length is also spoken in
 * the number step's body copy, never only here.
 */
export function SignupProgress({ current }: { current: 0 | 1 | 2 }) {
  const t = useTranslate();
  const label = t(COMPANY_SIGNUP.flowLabel);
  const steps = [
    t(COMPANY_SIGNUP.stepYourNumber),
    t(COMPANY_SIGNUP.stepCode),
    t(COMPANY_SIGNUP.stepYourCompany),
  ];
  return (
    <>
      <div className="hg-signup-progress-phone">
        <Stepper
          variant="progress"
          label={label}
          steps={steps}
          current={current}
          reachability="entered"
        />
      </div>
      <div className="hg-signup-progress-desktop">
        <Stepper
          variant="numbered"
          label={label}
          steps={steps}
          current={current}
          reachability="entered"
        />
      </div>
    </>
  );
}
