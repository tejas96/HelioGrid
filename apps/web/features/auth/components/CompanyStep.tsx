import { createTenantSchema } from '@heliogrid/contracts';
import type { SessionUser } from '@heliogrid/data';
import { useCompanySignup } from '@heliogrid/data/react';
import { useZodForm } from '@heliogrid/forms';
import { COMPANY_SIGNUP, companySignupWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, DoorFrame, Text, TintedBlock } from '@heliogrid/ui';
import { AccountCard } from './AccountCard';
import { CompanyFacts } from './CompanyFacts';
import { CompanyFields } from './CompanyFields';
import { LanguageControl } from './LanguageControl';
import { SignupProgress } from './SignupProgress';

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). The number, the resume line and the not-created finding are the identity half's
 * (`SCR-M01-02` decisions 11 and 22); the fields, the facts and the primary are the task's. The
 * form holds only its fields (the contract's schema through the forms layer); the write's wait
 * and refusal are `useCompanySignup`'s; the words of the four frames are `companySignupWords`'.
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
    <DoorFrame
      trailing={<LanguageControl />}
      taskMeasure="steps"
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
          {frame.failed ? (
            <TintedBlock
              tone="danger"
              title={t(SIGN_IN.ourSideFailed)}
              body={t(COMPANY_SIGNUP.nothingCreated)}
              className="hg-signup-finding"
            />
          ) : (
            <AccountCard phoneE164={user.phoneE164} />
          )}
          {frame.restored && !frame.failed ? (
            <Text variant="body-sm" color="secondary">
              {t(COMPANY_SIGNUP.resumeLine)}
            </Text>
          ) : null}
        </>
      }
    >
      <SignupProgress current={2} />
      {frame.writing ? <CompanyFacts values={form.getValues()} /> : <CompanyFields form={form} />}
      <Button variant="primary" size="lg" fullWidth loading={frame.writing} onClick={create}>
        {words.primary}
      </Button>
      {words.caption === null ? null : (
        <Text variant="caption" color="secondary">
          {words.caption}
        </Text>
      )}
    </DoorFrame>
  );
}
