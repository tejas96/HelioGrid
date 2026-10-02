import type { ReactElement, ReactNode } from 'react';
import type { MenuProps } from '../Menu/Menu.types';
import type { AccountMenuProps } from './AccountMenu.types';

/** The drawn parts each half supplies: the avatar's button and the two items' glyphs. */
export interface AccountMenuParts {
  trigger: ReactElement;
  grievanceGlyph: ReactNode;
  signOutGlyph: ReactNode;
}

/** The menu itself, the same on both halves: its name, its edge and its two items. */
export function accountMenuProps(props: AccountMenuProps, parts: AccountMenuParts): MenuProps {
  return {
    label: props.menuLabel,
    align: props.align,
    trigger: parts.trigger,
    items: [
      {
        key: 'grievance',
        label: props.grievanceLabel,
        icon: parts.grievanceGlyph,
        onSelect: props.onGrievance,
      },
      {
        key: 'sign-out',
        label: props.signOutLabel,
        icon: parts.signOutGlyph,
        onSelect: props.onSignOut,
      },
    ],
  };
}
