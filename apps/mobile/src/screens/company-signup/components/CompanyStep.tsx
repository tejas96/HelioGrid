import { createTenantSchema } from '@heliogrid/contracts';
import { type CompanySignup, useSteerDroppedOnEdit } from '@heliogrid/data/react';
import type { SessionUser } from '@heliogrid/domain';
import { useZodForm } from '@heliogrid/forms';
import { COMPANY_SIGNUP, companySignupWords, joinSteerWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Text, TintedBlock } from '@heliogrid/ui';
import { View } from 'react-native';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { LanguageControl } from '../../shared/LanguageControl';
import { styles } from '../styles';
import { AccountCard } from './AccountCard';
import { CompanyFacts } from './CompanyFacts';
import { CompanyFields } from './CompanyFields';
import { JoinSteer } from './JoinSteer';
import { SignupProgress } from './SignupProgress';

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). When the details match a company that exists, the same fields stay and the steer
 * takes the primary's place under them (`M01-09`); a changed detail drops the steer, a request
 * that did not go through adds its danger block under the title, and while one is on its way the
 * values are facts (`SCR-M01-02` decisions 25 and 26). The form holds only its fields; the write,
 * the steer and their waits are `useCompanySignup`'s; the words of the four frames are
 * `companySignupWords`'.
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
  const form = useZodForm(createTenantSchema, {
    defaultValues: { companyName: '', ownerName: user.name, city: '' },
  });
  useSteerDroppedOnEdit(signup, form.watch);
  const steered = joining ? signup.found : null;

  const create = form.handleSubmit((values) => void signup.submit(values));
  const frame = {
    restored,
    writing: signup.creation === 'creating',
    failed: signup.creation === 'failed',
  };
  const words = companySignupWords(t, frame);

  if (steered !== null) {
    const { failure } = joinSteerWords(t, signup.requesting === 'failed');
    return (
      <InsetDoorFrame
        trailing={<LanguageControl />}
        footer={<JoinSteer company={steered} phoneE164={user.phoneE164} signup={signup} />}
      >
        <SignupProgress current={2} />
        <View style={styles.titleBlock}>
          <Text variant="h2">{t(COMPANY_SIGNUP.joinTitle)}</Text>
        </View>
        {failure === null ? null : (
          <View style={styles.block}>
            <TintedBlock tone="danger" title={failure.title} body={failure.body} />
          </View>
        )}
        {signup.requesting === 'sending' ? (
          <CompanyFacts values={form.getValues()} />
        ) : (
          <CompanyFields form={form} withHelpers={false} />
        )}
      </InsetDoorFrame>
    );
  }

  return (
    <InsetDoorFrame
      trailing={<LanguageControl />}
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
      <SignupProgress current={2} />
      <View style={styles.titleBlock}>
        <Text variant="h2">{words.title}</Text>
        {words.intro === null ? null : (
          <Text variant="body" color="secondary">
            {words.intro}
          </Text>
        )}
      </View>
      {frame.failed ? (
        <View style={styles.block}>
          <TintedBlock
            tone="danger"
            title={t(SIGN_IN.ourSideFailed)}
            body={t(COMPANY_SIGNUP.nothingCreated)}
          />
        </View>
      ) : (
        <AccountCard phoneE164={user.phoneE164} />
      )}
      {frame.restored && !frame.failed ? (
        <View style={styles.resumeLine}>
          <Text variant="body-sm" color="secondary">
            {t(COMPANY_SIGNUP.resumeLine)}
          </Text>
        </View>
      ) : null}
      {frame.writing ? (
        <CompanyFacts values={form.getValues()} />
      ) : (
        <CompanyFields form={form} underAccount={!(frame.failed || frame.restored)} />
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
