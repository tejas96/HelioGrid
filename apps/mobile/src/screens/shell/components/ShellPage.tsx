import type { TranslatedText } from '@heliogrid/contracts';
import { useShellScreen } from '@heliogrid/data/react';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { MobileTopBar, ShellAction, ShellGlyph } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { usePillItems } from '../use-pill-items';
import { GrievanceNote } from './GrievanceNote';
import { ShellFrame, type ShellFrameProps } from './ShellFrame';
import { ShellTopBar } from './ShellTopBar';

/** A page opened from a list: its title, and its way back with the name the control speaks. */
interface DrillDown {
  title: TranslatedText;
  back: TranslatedText;
  onBack: () => void;
}

/**
 * A page inside the shell that is not the home: the shell's top bar with the account's acts, the
 * pill with `inView` lit when the pill names it, and the grievance note — written once for every
 * such screen (`PlaceholderScreen`, the settings list and its rows). A page opened from a list
 * (`drillDown`) has a bar of its own instead: its round way back, its title and the one search
 * (`SCR-M01-05`, `m-settings`; `SCR-SHELL-01` decision 8), lifting once content scrolls under it;
 * the pill stays (`F7-22`).
 */
export function ShellPage({
  inView,
  drillDown,
  stickyHead,
  lead,
  pad,
  foot,
  children,
}: {
  inView?: string;
  drillDown?: DrillDown;
  /** A list page's search and filters, held at the top while the list scrolls (`ShellFrame`). */
  stickyHead?: ReactNode;
  /** What scrolls away above the held head (`ShellFrame`). */
  lead?: ReactNode;
  /** The page's side padding (`ShellFrame`). */
  pad?: ShellFrameProps['pad'];
  /** An act bar in the pill's place while it shows (`ShellFrame`). */
  foot?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslate();
  const screen = useShellScreen();
  const actionRef = useRef<View>(null);
  const navigation = useNavigation();
  // biome-ignore lint/plugin/screen-assembly: the native scroll view's offset, told as it scrolls; only the phone's drill-down bar lifts on it
  const [scrolled, setScrolled] = useState(false);
  const items = usePillItems(screen.shell, actionRef);
  const lit = inView !== undefined && items.some((item) => item.key === inView);
  return (
    <ShellFrame
      topBar={
        drillDown === undefined ? (
          <ShellTopBar screen={screen} />
        ) : (
          <MobileTopBar
            searchLabel={t(SHELL.search)}
            notificationsLabel={t(SHELL.notifications)}
            title={drillDown.title}
            scrolled={scrolled}
            onSearchClick={() => navigation.navigate('Search')}
            leading={
              <ShellAction
                round
                label={drillDown.back}
                onClick={drillDown.onBack}
                icon={<ShellGlyph name="chevron-left" size="md" tone="primary" />}
              />
            }
          />
        )
      }
      items={items}
      inView={lit ? inView : undefined}
      onScrolledChange={drillDown === undefined ? undefined : setScrolled}
      stickyHead={stickyHead}
      lead={lead}
      pad={pad}
      foot={foot}
    >
      {children}
      <GrievanceNote open={screen.grievance.isOpen} onClose={screen.grievance.close} />
    </ShellFrame>
  );
}
