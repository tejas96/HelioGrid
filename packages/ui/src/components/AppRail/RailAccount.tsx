import { AccountMenu } from '../AccountMenu/AccountMenu';
import { AppearanceSwitch } from '../AppearanceSwitch/AppearanceSwitch';
import type { RailAccount as RailAccountProps } from './AppRail.types';

/**
 * The sidebar's foot: the person signed in — one row, avatar, name, role and company, that opens
 * their menu — and the theme switch under them. Folded, the theme's one button over the avatar.
 */
export function RailAccount({ account, folded }: { account: RailAccountProps; folded: boolean }) {
  if (folded) {
    return (
      <div className="hg-app-rail-avatar">
        {account.appearance === undefined ? null : (
          <AppearanceSwitch {...account.appearance} form="step" />
        )}
        <AccountMenu {...account.menu} />
      </div>
    );
  }
  return (
    <div className="hg-app-rail-account">
      <AccountMenu
        {...account.menu}
        row={account.caption === undefined ? {} : { caption: account.caption }}
      />
      {account.appearance === undefined ? null : (
        <AppearanceSwitch {...account.appearance} form="icons" />
      )}
    </div>
  );
}
