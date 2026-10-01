import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyState, ShellGlyph } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

interface AccessRemovedProps {
  companyName: string | null;
  onSignInAgain: () => void;
  onGrievance: () => void;
}

/**
 * Frame 8 (`S1.wrong.4`): the company removed this person, said plainly, with no pill and no bell
 * — every read would be refused. Its one way on signs out to the door; "Contact your admin" opened
 * nothing, so it is not offered. The grievance contact stays reachable: a removed person is still
 * a data subject (`F1-59`).
 */
export function AccessRemoved({ companyName, onSignInAgain, onGrievance }: AccessRemovedProps) {
  const t = useTranslate();
  const title =
    companyName === null
      ? t(SHELL.accessRemoved)
      : t(SHELL.accessRemovedFrom, { company: companyName });
  return (
    <View style={styles.centre}>
      <EmptyState
        icon={<ShellGlyph name="lock" size="xl" tone="primary" />}
        title={title}
        description={t(SHELL.nothingLost)}
        action={<Button onClick={onSignInAgain}>{t(SHELL.signInWithAnother)}</Button>}
      />
      <Button variant="ghost" onClick={onGrievance}>
        {t(SHELL.grievanceOfficer)}
      </Button>
    </View>
  );
}
