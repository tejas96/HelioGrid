import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { AccountMenu } from '../AccountMenu/AccountMenu.native';
import { AppearanceSwitch } from '../AppearanceSwitch/AppearanceSwitch.native';
import type { RailAccount as RailAccountProps } from './AppRail.types';

/**
 * The sidebar's foot, as OneOhm's: the theme switch across the rail's width, and under it the person
 * signed in — one row, avatar, name, role and company, that opens their menu. Folded, the theme's
 * one button over the avatar.
 */
export function RailAccount({ account, folded }: { account: RailAccountProps; folded: boolean }) {
  if (folded) {
    return (
      <View style={styles.avatar}>
        {account.appearance === undefined ? null : (
          <AppearanceSwitch {...account.appearance} form="step" />
        )}
        <AccountMenu {...account.menu} />
      </View>
    );
  }
  return (
    <View style={styles.account}>
      {account.appearance === undefined ? null : (
        <AppearanceSwitch {...account.appearance} form="icons" />
      )}
      <AccountMenu
        {...account.menu}
        row={account.caption === undefined ? {} : { caption: account.caption }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  account: {
    gap: theme.spacing['sp-3'],
  },
});
