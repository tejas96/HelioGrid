import { createTenantSchema } from '@heliogrid/contracts';
import type { SessionUser } from '@heliogrid/data';
import { type CompanyCreation, useCompanySignup } from '@heliogrid/data/react';
import { useZodForm } from '@heliogrid/forms';
import { COMPANY_SIGNUP, SIGN_IN, type Translator } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { DoorFrame } from '../../shared/DoorFrame';
import { LanguageControl } from '../../shared/LanguageControl';
import { TintedBlock } from '../../shared/TintedBlock';
import { styles } from '../styles';
import { AccountCard } from './AccountCard';
import { CompanyFacts } from './CompanyFacts';
import { CompanyFields } from './CompanyFields';
import { SignupProgress } from './SignupProgress';

/** The four frames one structure draws (`SCR-M01-02`): normal, resumed (`M01-10`), writing, and the company not created. */
interface Frame {
  readonly restored: boolean;
  readonly writing: boolean;
  readonly failed: boolean;
}

function frameOf(restored: boolean, creation: CompanyCreation): Frame {
  return { restored, writing: creation === 'creating', failed: creation === 'failed' };
}

/** The title over the fields; the intro follows it only on the normal frame. */
function heading(t: Translator['t'], frame: Frame): { title: string; intro: string | null } {
  if (frame.failed) return { title: t(COMPANY_SIGNUP.couldNotCreate), intro: null };
  if (frame.restored) return { title: t(COMPANY_SIGNUP.welcomeBack), intro: null };
  const intro = frame.writing ? null : t(COMPANY_SIGNUP.threeThings);
  return { title: t(COMPANY_SIGNUP.yourCompany), intro };
}

function primaryLabel(t: Translator['t'], frame: Frame): string {
  if (frame.writing) return t(COMPANY_SIGNUP.creatingYourCompany);
  return frame.failed ? t(SIGN_IN.tryAgain) : t(COMPANY_SIGNUP.createCompany);
}

/** The caption under the fields: what the write means while it runs, what a refusal did not do. */
function caption(t: Translator['t'], frame: Frame): string | null {
  if (frame.writing) return t(COMPANY_SIGNUP.writtenNow);
  return frame.failed ? t(COMPANY_SIGNUP.errorFoot) : null;
}

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). The form holds only its fields (the contract's schema through the forms layer);
 * the write's wait and refusal are `useCompanySignup`'s.
 */
export function CompanyStep({ user, restored }: { user: SessionUser; restored: boolean }) {
  const t = useTranslate();
  const signup = useCompanySignup();
  const form = useZodForm(createTenantSchema, {
    defaultValues: { companyName: '', ownerName: user.name, city: '' },
  });
  const create = form.handleSubmit((values) => void signup.create(values));
  const frame = frameOf(restored, signup.creation);
  const words = heading(t, frame);
  const foot = caption(t, frame);

  return (
    <DoorFrame
      trailing={<LanguageControl />}
      footer={
        <Button variant="primary" size="lg" fullWidth loading={frame.writing} onClick={create}>
          {primaryLabel(t, frame)}
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
      {foot === null ? null : (
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {foot}
          </Text>
        </View>
      )}
    </DoorFrame>
  );
}
