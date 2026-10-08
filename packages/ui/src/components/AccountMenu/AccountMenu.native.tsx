import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { ShellAction } from '../AppShell/ShellAction.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Menu } from '../Menu/Menu.native';
import { accountMenuProps } from './AccountMenu.logic';
import type { AccountMenuProps } from './AccountMenu.types';

/** The avatar, filling its 44 button, and its menu: the grievance contact and sign-out. */
export function AccountMenu(props: AccountMenuProps) {
  const avatar = <Avatar name={props.name} size={MIN_TOUCH_TARGET} />;
  const trigger = <ShellAction round label={props.triggerName} icon={avatar} />;
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
