import { theme } from '@heliogrid/theme';
import { ShellAction } from '../AppShell/ShellAction';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import { Menu } from '../Menu/Menu';
import { accountMenuProps } from './AccountMenu.logic';
import type { AccountMenuProps } from './AccountMenu.types';
import { AccountRow } from './AccountRow';

/**
 * The avatar, and its menu: the grievance contact and sign-out. The web draws it at the rail's
 * foot, where `SCR-SHELL-01`'s desktop frames size the avatar 32 inside the 44 button.
 */
export function AccountMenu(props: AccountMenuProps) {
  const avatar = <Avatar name={props.name} size={theme.spacing['sp-8']} />;
  const trigger =
    props.row === undefined ? (
      <ShellAction round label={props.triggerName} icon={avatar} />
    ) : (
      <AccountRow name={props.name} caption={props.row.caption} label={props.triggerName} />
    );
  const grievanceGlyph = <ShellGlyph name="shield" size="md" />;
  return (
    <Menu
      {...accountMenuProps(props, {
        trigger,
        grievanceGlyph,
        signOutGlyph: <ShellGlyph name="sign-out" size="md" />,
      })}
    />
  );
}
