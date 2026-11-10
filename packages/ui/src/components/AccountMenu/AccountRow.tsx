import { theme } from '@heliogrid/theme';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import type { AccountRowProps } from './AccountMenu.types';

/** What `Menu` hands its trigger: the open state, and the press and key that open it. */
interface MenuHanded {
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu';
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

/** The account as one row that opens its menu: avatar, name, the quiet line and an up-down mark. */
export function AccountRow({ name, caption, label, ...handed }: AccountRowProps & MenuHanded) {
  return (
    <button type="button" className="hg-account-row" aria-label={label} {...handed}>
      <Avatar name={name} size={theme.spacing['sp-8']} />
      <span className="hg-account-row-words">
        <Text variant="body-sm" bold oneLine>
          {name}
        </Text>
        {caption === undefined ? null : (
          <Text variant="caption" color="tertiary" oneLine>
            {caption}
          </Text>
        )}
      </span>
      <ShellGlyph name="chevrons-up-down" size="sm" tone="secondary" />
    </button>
  );
}
