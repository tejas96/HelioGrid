import type { RequestedCompany } from '@heliogrid/contracts';
import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Text, useFormat } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles as door } from '../../shared/door-styles';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { LanguageControl } from '../../shared/LanguageControl';
import { styles } from '../styles';

/**
 * Where *Request to join* lands (`SCR-M01-02` request-sent, decision 20): what was sent and to
 * whom, who it was sent as, and the one route back to creating, pinned under the column. Off the
 * flow, so it carries no step header.
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
    <InsetDoorFrame
      trailing={<LanguageControl />}
      footer={
        <View style={styles.sentRoute}>
          <Text variant="body-sm" color="secondary" align="center">
            {t(COMPANY_SIGNUP.changedMind)}
          </Text>
          <Button variant="secondary" size="lg" fullWidth onClick={onCreateInstead}>
            {t(COMPANY_SIGNUP.createOwnInstead)}
          </Button>
        </View>
      }
    >
      <View style={[styles.offFlowTitle, styles.sentTitleTop]}>
        <Text variant="h2">{t(COMPANY_SIGNUP.sentTitle)}</Text>
        <Text variant="body" color="secondary">
          {t(COMPANY_SIGNUP.sentBody, { company: company.companyName, city: company.city })}
        </Text>
      </View>
      <View style={styles.sentAs}>
        <Text variant="overline" color="secondary">
          {t(COMPANY_SIGNUP.sentAs)}
        </Text>
        <Text variant="body-sm" bold>
          {name}
        </Text>
        <Text variant="mono" bold>
          {format.phone(phoneE164)}
        </Text>
      </View>
      <View style={door.spacer} />
    </InsetDoorFrame>
  );
}
