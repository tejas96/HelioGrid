import { createTenantSchema } from '@heliogrid/contracts';
import { type CompanySignup, failureOf, useSteerDroppedOnEdit } from '@heliogrid/data/react';
import type { SessionUser } from '@heliogrid/domain';
import { Controller, useZodForm } from '@heliogrid/forms';
import {
  COMPANY_SIGNUP,
  type CompanyFieldHelpers,
  companyFacts,
  companyFieldWords,
  companySignupWords,
  signupStepsWords,
} from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  DoorFrame,
  DoorLanguage,
  SignupAccount,
  SignupFacts,
  type SignupFieldBinder,
  SignupFields,
  SignupSteps,
  Text,
  TintedBlock,
} from '@heliogrid/ui';
import { JoinFailureBlock, JoinRoads, JoinSteerBlock } from './JoinSteer';

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). The number, the resume line and every finding about the person are the identity
 * half's (`SCR-M01-02` decisions 11 and 22); the fields and the facts are the task's, and the
 * primary is the frame's held action, pinned under the scrolling fields (decision 9). When the
 * details match a company that exists, the same fields stay and the steer — the finding and both
 * roads — takes the primary's place (`M01-09`); a changed detail drops the steer, and while a
 * request is on its way the values are facts, as they are while the company is written
 * (decision 26). The form holds only its fields; the write, the steer and their waits are
 * `useCompanySignup`'s; the words of its frames are `companySignupWords`'. Each field is bound by
 * its own `Controller`, so a keystroke re-renders one input and never this step.
 */
export function CompanyStep({
  user,
  restored,
  joining,
  signup,
}: {
  user: SessionUser;
  restored: boolean;
  /** The view is `join` (`signupView`): the steer replaces the primary. */
  joining: boolean;
  signup: CompanySignup;
}) {
  const t = useTranslate();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const form = useZodForm(createTenantSchema, {
    defaultValues: { companyName: '', ownerName: user.name, city: '' },
  });
  useSteerDroppedOnEdit(signup, form.watch);
  const steered = joining ? signup.found : null;

  const create = form.handleSubmit((values) => void signup.submit(values));
  const frame = {
    restored,
    writing: signup.creation === 'creating',
    failure: failureOf(signup.creation),
    fieldRefused: form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0,
  };
  const words = companySignupWords(t, frame);
  const steps = <SignupSteps words={signupStepsWords(t)} current={2} />;
  const facts = <SignupFacts facts={companyFacts(t, form.getValues())} />;
  /** Under the join steer the fields carry no helpers: the steer's one sentence is its finding. */
  const bindWith =
    (helpers: CompanyFieldHelpers | undefined): SignupFieldBinder =>
    (name, draw) => (
      <Controller
        control={form.control}
        name={name}
        render={({ field, fieldState }) =>
          draw({
            value: field.value,
            onChange: field.onChange,
            ...companyFieldWords(t, name, {
              helpers,
              value: field.value,
              error: fieldState.error,
            }),
          })
        }
      />
    );

  if (steered !== null) {
    const steer = <JoinSteerBlock company={steered} phoneE164={user.phoneE164} />;
    return (
      <DoorFrame
        trailing={language}
        taskMeasure="steps"
        lead={steps}
        identity={
          <>
            <div className="hg-door-title">
              <Text variant="h1">{t(COMPANY_SIGNUP.joinTitle)}</Text>
            </div>
            <JoinFailureBlock signup={signup} />
            <div className="hg-signup-wide-only">{steer}</div>
          </>
        }
        footer={
          <div className="hg-signup-join-footer">
            <div className="hg-signup-narrow-only">{steer}</div>
            <JoinRoads company={steered} signup={signup} />
          </div>
        }
      >
        {signup.requesting === 'sending' ? facts : <SignupFields bind={bindWith(undefined)} />}
      </DoorFrame>
    );
  }

  return (
    <DoorFrame
      trailing={language}
      taskMeasure="steps"
      lead={steps}
      identity={
        <>
          <div className="hg-door-title">
            <Text variant="h1">{words.title}</Text>
            {words.intro === null ? null : (
              <Text variant="body-lg" color="secondary">
                {words.intro}
              </Text>
            )}
          </div>
          {words.block !== null ? (
            <TintedBlock {...words.block} className="hg-signup-finding" />
          ) : (
            <SignupAccount
              words={{ label: t(COMPANY_SIGNUP.yourAccount), verified: t(COMPANY_SIGNUP.verified) }}
              phoneE164={user.phoneE164}
            />
          )}
          {frame.restored && frame.failure === null ? (
            <Text variant="body-sm" color="secondary">
              {t(COMPANY_SIGNUP.resumeLine)}
            </Text>
          ) : null}
        </>
      }
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={frame.writing || signup.checking}
          onClick={create}
        >
          {words.primary}
        </Button>
      }
    >
      {frame.writing ? facts : <SignupFields bind={bindWith(words.helpers)} />}
      {words.caption === null ? null : (
        <Text variant="caption" color="secondary">
          {words.caption}
        </Text>
      )}
    </DoorFrame>
  );
}
