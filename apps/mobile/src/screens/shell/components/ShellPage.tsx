import { useSession, useShell } from '@heliogrid/data/react';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { IconButton, MIN_TOUCH_TARGET, MobileTopBar, ShellGlyph } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { usePillItems } from '../use-pill-items';
import { GrievanceNote } from './GrievanceNote';
import { ShellFrame } from './ShellFrame';
import { ShellTopBar } from './ShellTopBar';

/** A page opened from a list: its title, and its way back with the name the control speaks. */
interface DrillDown {
  title: string;
  back: string;
  onBack: () => void;
}

/**
 * A page inside the shell that is not the home: the shell's top bar with the account's acts, the
 * pill with `inView` lit when the pill names it, and the grievance note — written once for every
 * such screen (`PlaceholderScreen`, the settings list and its rows). A page opened from a list
 * (`drillDown`) has a bar of its own instead: its way back and its title alone (`SCR-M01-05`,
 * `m-settings`); the pill stays (`F7-22`).
 */
export function ShellPage({
  inView,
  drillDown,
  children,
}: {
  inView?: string;
  drillDown?: DrillDown;
  children: ReactNode;
}) {
  const t = useTranslate();
  const session = useSession();
  const shell = useShell();
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const lit = inView !== undefined && items.some((item) => item.key === inView);
  return (
    <ShellFrame
      topBar={
        drillDown === undefined ? (
          <ShellTopBar
            companyName={shell.companyName}
            account={{
              personName: session.user?.name ?? '',
              onGrievance: () => setGrievance(true),
              onSignOut: () => void session.signOut(),
            }}
          />
        ) : (
          <MobileTopBar
            searchLabel={t(SHELL.search)}
            notificationsLabel={t(SHELL.notifications)}
            title={drillDown.title}
            leading={
              <IconButton label={drillDown.back} size={MIN_TOUCH_TARGET} onClick={drillDown.onBack}>
                <ShellGlyph name="chevron-left" size="md" tone="primary" />
              </IconButton>
            }
          />
        )
      }
      items={items}
      inView={lit ? inView : undefined}
    >
      {children}
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
