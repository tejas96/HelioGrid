import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyState } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';

/** A page this person's shell does not offer (`F7-48`), inside the shell: the heading and the way home. */
export function ShellNotFoundState() {
  const t = useTranslate();
  const navigation = useNavigation();
  return (
    <EmptyState
      title={t(SHELL.notFound)}
      action={
        <Button variant="primary" size="lg" onClick={() => navigation.navigate('Shell')}>
          {t(SHELL.goToHome)}
        </Button>
      }
    />
  );
}
