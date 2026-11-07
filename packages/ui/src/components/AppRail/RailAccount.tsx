import { Text } from '../../primitives/Text/Text';
import type { RailAccount as RailAccountProps } from './AppRail.types';

/**
 * The sidebar's foot: the person signed in — their avatar menu, name, role and company — and the
 * theme switch under them. Folded, the avatar alone.
 */
export function RailAccount({ account, folded }: { account: RailAccountProps; folded: boolean }) {
  if (folded) return <div className="hg-app-rail-avatar">{account.menu}</div>;
  return (
    <div className="hg-app-rail-account">
      <div className="hg-app-rail-account-who">
        {account.menu}
        <div className="hg-app-rail-account-words">
          <Text variant="body-sm" bold oneLine>
            {account.name}
          </Text>
          {account.caption === undefined ? null : (
            <Text variant="caption" color="secondary" oneLine>
              {account.caption}
            </Text>
          )}
        </div>
      </div>
      {account.appearance}
    </div>
  );
}
