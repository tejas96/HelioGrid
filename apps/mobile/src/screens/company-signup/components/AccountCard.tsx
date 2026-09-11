import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { PhoneValue, StatusChip } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The verified number as a fact, not a field (`SCR-M01-02` decision 1): after verification it is
 * the account, so there is nothing to edit and no Change control — the system's value and the
 * system's chip for its standing.
 */
export function AccountCard({ phoneE164 }: { phoneE164: string }) {
  const t = useTranslate();
  return (
    <View style={styles.accountCard}>
      <PhoneValue label={t(COMPANY_SIGNUP.yourAccount)} value={phoneE164} />
      <StatusChip status="verified" label={t(COMPANY_SIGNUP.verified)} tone="success" />
    </View>
  );
}
