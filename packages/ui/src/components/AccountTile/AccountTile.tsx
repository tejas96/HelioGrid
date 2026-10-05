import { Text } from '../../primitives/Text/Text';
import type { AccountTileProps } from './AccountTile.types';

export function AccountTile({ overline, account }: AccountTileProps) {
  return (
    <div className="hg-account-tile">
      <Text variant="overline" color="secondary">
        {overline}
      </Text>
      <span className="hg-account-tile__account">
        <Text variant="body-sm" bold>
          {account}
        </Text>
      </span>
    </div>
  );
}
