import type { ReactNode } from 'react';
import { SettingsLayout } from '../../../features/settings';

/** Every page under /more — routing only; the settings list beside a page is the layout's. */
export default function MoreLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
