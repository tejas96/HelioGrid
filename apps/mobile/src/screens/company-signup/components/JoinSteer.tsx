import type { RequestedCompany } from '@heliogrid/contracts';
import type { CompanySignup } from '@heliogrid/data/react';
import { COMPANY_SIGNUP, joinSteerFinding, joinSteerWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, TintedBlock, useFormat } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The join steer under the scrolling fields (`M01-09`, `SCR-M01-02` decisions 9, 18, 19): the
 * company and its city, where a request goes — its owner, never a name — and both roads
 * full-size, a steer and not a block. While the request is on its way the join road spins and the
 * other waits, so one press cannot both ask and create (decision 26).
 */
export function JoinSteer({
  company,
  phoneE164,
  signup,
}: {
  company: RequestedCompany;
  phoneE164: string;
  signup: CompanySignup;
}) {
  const t = useTranslate();
  const format = useFormat();
  const words = joinSteerWords(t, signup.requesting === 'failed');
  const finding = joinSteerFinding(t, company, format.phone(phoneE164));
  const sending = signup.requesting === 'sending';
  return (
    <View style={styles.joinFooter}>
      <TintedBlock tone="info" title={finding.title} body={finding.body} />
      <View style={styles.joinRoads}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={sending}
          spokenName={
            words.failure === null
              ? t(COMPANY_SIGNUP.requestToJoinLabel, { company: company.companyName })
              : undefined
          }
          onClick={() => void signup.requestToJoin()}
        >
          {words.primary}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={sending}
          onClick={() => void signup.createAnyway()}
        >
          {t(COMPANY_SIGNUP.createAnyway)}
        </Button>
      </View>
    </View>
  );
}
