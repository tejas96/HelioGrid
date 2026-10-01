import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { Avatar, Menu, ShellAction, ShellGlyph } from '@heliogrid/ui';

interface AccountMenuProps {
  name: string;
  onGrievance: () => void;
  onSignOut: () => void;
}

/**
 * The avatar's menu: the published grievance contact (`F1-59`) and sign-out (`MS12-19`), as the
 * export draws them — two items, neither destructive.
 */
export function AccountMenu({ name, onGrievance, onSignOut }: AccountMenuProps) {
  const t = useTranslate();
  return (
    <Menu
      label={t(SHELL.account)}
      align="end"
      trigger={
        <ShellAction
          label={t(SHELL.accountOf, { name })}
          icon={<Avatar name={name} size={theme.spacing['sp-10']} />}
        />
      }
      items={[
        {
          key: 'grievance',
          label: t(SHELL.grievanceOfficer),
          icon: <ShellGlyph name="shield" size="md" />,
          onSelect: onGrievance,
        },
        {
          key: 'sign-out',
          label: t(SHELL.signOut),
          icon: <ShellGlyph name="sign-out" size="md" />,
          onSelect: onSignOut,
        },
      ]}
    />
  );
}
