import { accountMenuWords, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { AccountMenu, LogoTile, MobileTopBar, Text } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';

interface ShellTopBarProps {
  /** The company's name, or none while it loads or after it failed — the bar then shows none. */
  companyName: string | null;
  /** The person and the avatar's acts. Absent on Frame 8, whose bar names the company and nothing else. */
  account?: { personName: string; onGrievance: () => void; onSignOut: () => void };
}

/**
 * The product's tile, then the company's name as words (`F7-07`: the tenant appears by name, no
 * chip — it opens nothing), Search, the bell with no count until a record gives one, the avatar.
 * Frame 8 keeps the tile and the name only (`SCR-SHELL-01`): every read is refused there.
 */
export function ShellTopBar({ companyName, account }: ShellTopBarProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  return (
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
      onSearchClick={account === undefined ? undefined : () => navigation.navigate('Search')}
      onNotificationsClick={
        account === undefined ? undefined : () => navigation.navigate('Notifications')
      }
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
  );
}
