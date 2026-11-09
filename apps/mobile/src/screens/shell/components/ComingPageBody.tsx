import type { OnItsWayWords } from '@heliogrid/i18n';
import { Button, OnItsWay } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';

/** A page whose module has not landed: what it will do, and the way home. */
export function ComingPageBody({ words }: { words: OnItsWayWords }) {
  const navigation = useNavigation();
  return (
    <OnItsWay
      {...words}
      action={
        <Button variant="primary" size="lg" onClick={() => navigation.navigate('Shell')}>
          {words.goToHome}
        </Button>
      }
    />
  );
}
