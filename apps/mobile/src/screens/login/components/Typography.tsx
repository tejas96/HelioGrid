import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { AppText } from '../../../ui';
import { styles } from '../styles';

/** Screen-local typography shorthands for LoginScreen (apps/mobile/CLAUDE.md §Local
 *  conventions — screen-folder satellites). Promotion into src/ui needs an owner ruling. */

export function H1({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <AppText role="h1" weight="700" style={style}>
      {children}
    </AppText>
  );
}

export function Small({
  children,
  color,
  weight,
  mono,
}: {
  children: ReactNode;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
  mono?: boolean;
}) {
  return (
    <AppText role="body-sm" color={color} weight={weight} mono={mono} style={styles.small}>
      {children}
    </AppText>
  );
}
