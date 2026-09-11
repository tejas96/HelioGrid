import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Stepper } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The flow's three steps over the header (`SCR-M01-02` decision 4): gated, because the company
 * details read the verified account and cannot be jumped to before it exists; going back stays
 * open. The length is also spoken in the number step's body copy, never only here.
 */
export function SignupProgress({ current }: { current: 0 | 1 | 2 }) {
  const t = useTranslate();
  return (
    <View style={styles.lead}>
      <Stepper
        variant="progress"
        label={t(COMPANY_SIGNUP.flowLabel)}
        steps={[
          t(COMPANY_SIGNUP.stepYourNumber),
          t(COMPANY_SIGNUP.stepCode),
          t(COMPANY_SIGNUP.stepYourCompany),
        ]}
        current={current}
        reachability="entered"
      />
    </View>
  );
}
