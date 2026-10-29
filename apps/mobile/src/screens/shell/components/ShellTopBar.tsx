import type { ShellScreen } from '@heliogrid/data/react';
import { accountMenuWords, NOTIFICATION_CENTRE, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AccountMenu, MobileTopBar } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { NotificationSheet } from '../../notifications';
import { DESTINATION_ROUTE } from '../doors';

interface ShellTopBarProps {
  /**
   * The page's `useShellScreen()`: the company's name (none while it loads or after it failed — the
   * bar then shows none), the bell, its centre and the avatar's acts.
   */
  screen: ShellScreen;
  /** Frame 8's bar names the company and nothing else. */
  nameOnly?: boolean;
}

/**
 * The product's tile, then the company's name as words (`F7-07`: the tenant appears by name, no
 * chip — it opens nothing), Search, the bell with its unread count from the records (`F6-17`),
 * which opens the notification centre over the screen in view, and the avatar. Frame 8 keeps the
 * tile and the name only (`SCR-SHELL-01`): every read is refused there.
 */
export function ShellTopBar({ screen, nameOnly = false }: ShellTopBarProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  const { centre, unread } = screen;
  const goToLeads = () => {
    centre.close();
    navigation.navigate(DESTINATION_ROUTE.leads);
  };
  return (
    <>
      <MobileTopBar
        company={screen.shell.companyName ?? undefined}
        searchLabel={t(SHELL.search)}
        notificationsLabel={t(SHELL.notifications)}
        notificationsName={t(NOTIFICATION_CENTRE.bellName, { count: unread ?? 0 })}
        notifications={nameOnly ? undefined : (unread ?? undefined)}
        onSearchClick={nameOnly ? undefined : () => navigation.navigate('Search')}
        onNotificationsClick={nameOnly ? undefined : centre.open}
        avatar={
          nameOnly ? undefined : (
            <AccountMenu
              {...accountMenuWords(t, screen.personName)}
              name={screen.personName}
              align="end"
              onGrievance={screen.grievance.open}
              onSignOut={screen.signOut}
            />
          )
        }
      />
      {centre.isOpen ? (
        <NotificationSheet
          onClose={centre.close}
          onGoToLeads={screen.offersLeads ? goToLeads : undefined}
        />
      ) : null}
    </>
  );
}
