import { useSetupReady } from '@heliogrid/data/react';
import { DOOR_SEGMENT } from '@heliogrid/domain';
import { setupReadyWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { SetupReady } from '@heliogrid/ui';
import { Linking } from 'react-native';
import { linkingOptions } from '../../navigation/linking';
import { InsetDoor } from '../shared/InsetDoor';

/* Leads, by its public address (`M01-61`): closing setup takes this screen away and brings the
   shell's routes in on the next render, so Leads is opened as its link, once they are. */
const LEADS_LINK = `${linkingOptions.prefixes[0]}${DOOR_SEGMENT.leads}`;

/**
 * *You're ready* on the phone (`SCR-M01-06`, `M01-26`), mounted for an owner whose company has not
 * closed setup. Door one records the step, then opens Leads. The demo door opens nothing until
 * `T-M01-029`.
 */
export function SetupReadyScreen() {
  const { t } = useI18n();
  const ready = useSetupReady();
  if (ready.company.status === 'pending') return null;
  const words = setupReadyWords(t);
  return (
    <InsetDoor>
      <SetupReady
        words={{
          ...words,
          companyLine:
            ready.company.status === 'ready' ? words.companyLine(ready.company.name) : '',
        }}
        demo={ready.demo}
        leaving={ready.leaving}
        onStartWithLead={async () => {
          await ready.startWithLead();
          void Linking.openURL(LEADS_LINK).catch(() => undefined);
        }}
        onOpenDemo={() => undefined}
        unreachable={ready.company.status === 'failed'}
        retrying={ready.retrying}
        onTryAgain={ready.tryAgain}
      />
    </InsetDoor>
  );
}
