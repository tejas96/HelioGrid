import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles';

/**
 * The merge's act bar in the shell's foot: inside the page's gutter and above the home indicator,
 * whose band the keyboard covers when it rises (`ShellFrame`'s `footBandUnderKeyboard`).
 */
export function MergeFoot({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.foot, { paddingBottom: theme.spacing['sp-4'] + insets.bottom }]}>
      {children}
    </View>
  );
}
