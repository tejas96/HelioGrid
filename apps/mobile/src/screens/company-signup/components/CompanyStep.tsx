import { createTenantSchema } from '@heliogrid/contracts';
import type { SessionUser } from '@heliogrid/data';
import { useCompanySignup } from '@heliogrid/data/react';
import { useZodForm } from '@heliogrid/forms';
import { COMPANY_SIGNUP, companySignupWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Text, TintedBlock } from '@heliogrid/ui';
import { View } from 'react-native';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { LanguageControl } from '../../shared/LanguageControl';
import { styles } from '../styles';
import { AccountCard } from './AccountCard';
import { CompanyFacts } from './CompanyFacts';
import { CompanyFields } from './CompanyFields';
import { SignupProgress } from './SignupProgress';

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). The form holds only its fields (the contract's schema through the forms layer);
 * the write's wait and refusal are `useCompanySignup`'s; the words of the four frames are
 * `companySignupWords`'.
 */
export function CompanyStep({ user, restored }: { user: SessionUser; restored: boolean }) {
  const t = useTranslate();
  const signup = useCompanySignup();
  const form = useZodForm(createTenantSchema, {
    defaultValues: { companyName: '', ownerName: user.name, city: '' },
  });
  const create = form.handleSubmit((values) => void signup.create(values));
  const frame = {
    restored,
    writing: signup.creation === 'creating',
    failed: signup.creation === 'failed',
  };
  const words = companySignupWords(t, frame);

  return (
    <InsetDoorFrame
      trailing={<LanguageControl />}
      footer={
        <Button variant="primary" size="lg" fullWidth loading={frame.writing} onClick={create}>
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
        <CompanyFields form={form} afterBlock={frame.failed || frame.restored} />
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
