import type { RequestedCompany } from '@heliogrid/contracts';
import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, DoorFrame, Text, useFormat } from '@heliogrid/ui';
import { LanguageControl } from './LanguageControl';

/**
 * Where *Request to join* lands (`SCR-M01-02` request-sent, decisions 20 and 24): what was sent
 * and to whom in the identity half; who it was sent as and the one route back to creating in the
 * task column. Off the flow, so it carries no step header.
 */
export function JoinRequestSent({
  company,
  name,
  phoneE164,
  onCreateInstead,
}: {
  company: RequestedCompany;
  name: string;
  phoneE164: string;
  onCreateInstead: () => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  return (
    <DoorFrame
      trailing={<LanguageControl />}
      taskMeasure="steps"
      identity={
        <div className="hg-door-title">
          <Text variant="h1">{t(COMPANY_SIGNUP.sentTitle)}</Text>
          <Text variant="body-lg" color="secondary">
            {t(COMPANY_SIGNUP.sentBody, { company: company.companyName, city: company.city })}
          </Text>
        </div>
      }
    >
      <div className="hg-signup-sent-as">
        <Text variant="overline" color="secondary">
          {t(COMPANY_SIGNUP.sentAs)}
        </Text>
        <Text variant="body-sm" bold>
          {name}
        </Text>
        <Text variant="mono" bold>
          {format.phone(phoneE164)}
        </Text>
      </div>
      <div className="hg-signup-sent-route">
        <Text variant="body-sm" color="secondary" align="center">
          {t(COMPANY_SIGNUP.changedMind)}
        </Text>
        <Button variant="secondary" size="lg" fullWidth onClick={onCreateInstead}>
          {t(COMPANY_SIGNUP.createOwnInstead)}
        </Button>
      </div>
    </DoorFrame>
  );
}
