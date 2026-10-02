import { theme } from '@heliogrid/theme';
import { ShellAction } from '../AppShell/ShellAction.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Menu } from '../Menu/Menu.native';
import { accountMenuProps } from './AccountMenu.logic';
import type { AccountMenuProps } from './AccountMenu.types';

/** The avatar, and its menu: the grievance contact and sign-out. */
export function AccountMenu(props: AccountMenuProps) {
  const avatar = <Avatar name={props.name} size={theme.spacing['sp-10']} />;
  const trigger = <ShellAction label={props.triggerName} icon={avatar} />;
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
