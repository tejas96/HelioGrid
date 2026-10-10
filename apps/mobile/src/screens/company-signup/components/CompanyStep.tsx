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
  joinSteerWords,
  signupStepsWords,
} from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  DoorLanguage,
  SignupAccount,
  SignupFacts,
  type SignupFieldBinder,
  SignupFields,
  SignupSteps,
  Text,
  TintedBlock,
} from '@heliogrid/ui';
import { View } from 'react-native';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { styles } from '../styles';
import { JoinSteer } from './JoinSteer';

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). When the details match a company that exists, the same fields stay and the steer
 * takes the primary's place under them (`M01-09`); a changed detail drops the steer, a request
 * that did not go through adds its danger block under the title, and while one is on its way the
 * values are facts (`SCR-M01-02` decisions 25 and 26). The form holds only its fields; the write,
 * the steer and their waits are `useCompanySignup`'s; the words of its frames are
 * `companySignupWords`'. Each field is bound by its own `Controller`, so a keystroke re-renders
 * one input — a controlled native input whose value lags the keyboard drops characters. The step
 * itself re-renders only when the set of refused fields changes after a press.
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
    const { failure } = joinSteerWords(t, failureOf(signup.requesting));
    return (
      <InsetDoorFrame
        trailing={language}
        footer={<JoinSteer company={steered} phoneE164={user.phoneE164} signup={signup} />}
      >
        {steps}
        <View style={styles.titleBlock}>
          <Text variant="h2">{t(COMPANY_SIGNUP.joinTitle)}</Text>
        </View>
        {failure === null ? null : (
          <View style={styles.block}>
            <TintedBlock {...failure} />
          </View>
        )}
        {signup.requesting === 'sending' ? facts : <SignupFields bind={bindWith(undefined)} />}
      </InsetDoorFrame>
    );
  }

  return (
    <InsetDoorFrame
      trailing={language}
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
      {steps}
      <View style={styles.titleBlock}>
        <Text variant="h2">{words.title}</Text>
        {words.intro === null ? null : (
          <Text variant="body" color="secondary">
            {words.intro}
          </Text>
        )}
      </View>
      {words.block !== null ? (
        <View style={styles.block}>
          <TintedBlock {...words.block} />
        </View>
      ) : (
        <SignupAccount
          words={{ label: t(COMPANY_SIGNUP.yourAccount), verified: t(COMPANY_SIGNUP.verified) }}
          phoneE164={user.phoneE164}
        />
      )}
      {frame.restored && frame.failure === null ? (
        <View style={styles.resumeLine}>
          <Text variant="body-sm" color="secondary">
            {t(COMPANY_SIGNUP.resumeLine)}
          </Text>
        </View>
      ) : null}
      {frame.writing ? (
        facts
      ) : (
        <SignupFields
          bind={bindWith(words.helpers)}
          underAccount={frame.failure === null && !frame.restored}
        />
      )}
      {words.caption === null ? null : (
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {words.caption}
          </Text>
        </View>
      )}
    </InsetDoorFrame>
  );
}
