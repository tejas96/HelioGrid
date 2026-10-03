import { useShell, useUnreadCount } from '@heliogrid/data/react';
import { offersDoor } from '@heliogrid/domain';
import { accountMenuWords, NOTIFICATION_CENTRE, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { AccountMenu, LogoTile, MobileTopBar, Text } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { NotificationSheet } from '../../notifications';
import { DESTINATION_ROUTE } from '../doors';

interface ShellTopBarProps {
  /** The company's name, or none while it loads or after it failed — the bar then shows none. */
  companyName: string | null;
  /** The person and the avatar's acts. Absent on Frame 8, whose bar names the company and nothing else. */
  account?: { personName: string; onGrievance: () => void; onSignOut: () => void };
}

/**
 * The product's tile, then the company's name as words (`F7-07`: the tenant appears by name, no
 * chip — it opens nothing), Search, the bell with its unread count from the records (`F6-17`),
 * which opens the notification centre over the screen in view, and the avatar. Frame 8 keeps the
 * tile and the name only (`SCR-SHELL-01`): every read is refused there.
 */
export function ShellTopBar({ companyName, account }: ShellTopBarProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  const shell = useShell();
  const unread = useUnreadCount();
  const [centreOpen, setCentreOpen] = useState(false);
  const offersLeads = offersDoor(shell, 'leads');
  const goToLeads = () => {
    setCentreOpen(false);
    navigation.navigate(DESTINATION_ROUTE.leads);
  };
  return (
    <>
      <MobileTopBar
        brand={<LogoTile size={theme.spacing['sp-8']} radius={theme.radius['r-sm']} />}
        tenant={
          companyName === null ? undefined : (
            <Text variant="body" bold oneLine>
              {companyName}
            </Text>
          )
        }
        searchLabel={t(SHELL.search)}
        notificationsLabel={t(SHELL.notifications)}
        notificationsName={t(NOTIFICATION_CENTRE.bellName, { count: unread ?? 0 })}
        notifications={account === undefined ? undefined : (unread ?? undefined)}
        onSearchClick={account === undefined ? undefined : () => navigation.navigate('Search')}
        onNotificationsClick={account === undefined ? undefined : () => setCentreOpen(true)}
        avatar={
          account === undefined ? undefined : (
            <AccountMenu
              {...accountMenuWords(t, account.personName)}
              name={account.personName}
              align="end"
              onGrievance={account.onGrievance}
              onSignOut={account.onSignOut}
            />
          )
        }
      />
      {centreOpen ? (
        <NotificationSheet
          onClose={() => setCentreOpen(false)}
          onGoToLeads={offersLeads ? goToLeads : undefined}
        />
      ) : null}
    </>
  );
}
