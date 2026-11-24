import { useHomeToday, useMyDay, useShellScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow, type StandingDestination } from '@heliogrid/domain';
import {
  accessRemovedWords,
  BLOCK,
  connectionWords,
  homeBlocksWords,
  homeGreeting,
  homeHeadWords,
  myDaySummary,
  todayLine,
  verbLabel,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AccessRemoved,
  Button,
  HomeBlocks,
  HomeHead,
  NoConnection,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  type ParamListBase,
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { type ComponentProps, useCallback, useRef } from 'react';
import { useWindowDimensions, type View } from 'react-native';
import { FirstRunMark } from './components/FirstRunMark';
import { GrievanceNote } from './components/GrievanceNote';
import { HomeMoneyDue } from './components/HomeMoneyDue';
import { HomeToday } from './components/HomeToday';
import { InstallerHome } from './components/InstallerHome';
import { MyDayHome } from './components/MyDayHome';
import { OwnerHome } from './components/OwnerHome';
import { ShellFrame } from './components/ShellFrame';
import { ShellTopBar } from './components/ShellTopBar';
import { tabRoute } from './doors';
import { usePillActionRef } from './pill-slot';
import { switcherWidth } from './styles';
import { useOpenDoor } from './use-open-tab';

/**
 * The phone shell (`SCR-SHELL-01`): the person's home inside the top bar and the pill. Every fact
 * is `useShellScreen()`'s, the web's too — the home, the switcher, the verb, the slots, the marks
 * (Law 11) — and every part is `packages/ui`'s, shared with the web; this composes. A device gone
 * offline sees the one no-connection screen instead of blocks that would wait forever (`F8-36`).
 * A removal is checked before anything loaded, since a read in flight comes back refused once the
 * company has removed the person.
 */
export function ShellScreen() {
  const t = useTranslate();
  const format = useFormat();
  const { width } = useWindowDimensions();
  const screen = useShellScreen();
  const today = useHomeToday();
  const myDayCounts = useMyDay().counts;
  const navigation = useNavigation();
  const { shell, grievance, connection } = screen;
  const titleRef = useRef<View>(null);
  const actionRef = usePillActionRef();
  const openDoor = useOpenDoor();
  usePreloadTabs(shell.destinations);
  const note = <GrievanceNote open={grievance.isOpen} onClose={grievance.close} />;

  if (!connection.online)
    return <NoConnection {...connectionWords(t)} onRetry={connection.retry} />;
  if (shell.accessRemoved) {
    return (
      <ShellFrame topBar={<ShellTopBar screen={screen} nameOnly />} pill={false}>
        <AccessRemoved
          {...accessRemovedWords(t, shell.companyName)}
          onAction={screen.signOut}
          pending={screen.signingOut}
          onGrievance={grievance.open}
        />
        {note}
      </ShellFrame>
    );
  }

  const home = shell.home;
  const head = home === null ? null : homeHeadWords(t, home.home, shell.homes);
  const verb = shell.homeVerb;
  const openRow = (row: SettingsRow) =>
    navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT[row] });
  return (
    <ShellFrame
      topBar={<ShellTopBar screen={screen} />}
      pill={shell.destinations !== null}
      inView="home"
    >
      {home === null || head === null ? null : (
        <>
          <HomeHead
            {...head}
            dateLine={todayLine(t, format.date(new Date()))}
            greeting={homeGreeting(t, today.dayPart, today.personName)}
            summary={myDaySummary(t, myDayCounts)}
            entries={head.entries.map((entry) => ({
              ...entry,
              key: entry.preset,
              onSelect: () => shell.chooseHome(entry.preset),
            }))}
            switcherWidth={switcherWidth(width)}
            titleAnchor={titleRef}
            action={
              verb === null ? undefined : (
                <Button
                  size="prominent"
                  fullWidth
                  icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
                  onClick={() => openDoor(verb)}
                >
                  {verbLabel(t, verb)}
                </Button>
              )
            }
          />
          <OwnerHome />
          <MyDayHome />
          <HomeMoneyDue />
          <HomeToday today={today} open={openRow} />
          <InstallerHome />
          {homeBlocksWords(t, home).blocks.length === 0 ? null : (
            <HomeBlocks
              {...homeBlocksWords(t, home)}
              read={shell.read}
              loadingLabel={t(BLOCK.loading)}
            />
          )}
        </>
      )}
      <MarkInFront shell={shell} anchors={{ switchHome: titleRef, action: actionRef }} />
      {note}
    </ShellFrame>
  );
}

/**
 * A mark points at THIS screen's controls. Under a door a link opened, the home is mounted but not
 * in front, and its mark would draw over the door: it waits for the home. Only the mark reads
 * focus, so the whole home is not drawn again each time a tab is left or shown.
 */
function MarkInFront(props: ComponentProps<typeof FirstRunMark>) {
  return useIsFocused() ? <FirstRunMark {...props} /> : null;
}

/**
 * The person's other tabs, drawn once the home is in front and the phone is idle: the first tap
 * on a destination then shows a page already drawn, not one built while the person waits. Run from
 * the focus event, so it draws nothing again itself.
 */
function usePreloadTabs(destinations: readonly StandingDestination[] | null) {
  const tabs = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  useFocusEffect(
    useCallback(() => {
      if (destinations === null) return undefined;
      const idle = requestIdleCallback(() => {
        for (const destination of destinations) {
          if (destination !== 'home') tabs.preload(tabRoute[destination]);
        }
      });
      return () => cancelIdleCallback(idle);
    }, [destinations, tabs]),
  );
}
