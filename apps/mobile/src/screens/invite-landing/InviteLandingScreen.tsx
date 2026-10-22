import { useFirstRunOwed, useInviteLanding } from '@heliogrid/data/react';
import { inviteLandingWords } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { DoorLanguage, InviteLanding } from '@heliogrid/ui';
import {
  CommonActions,
  StackActions,
  type StaticScreenProps,
  useNavigation,
} from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { APP_ENTRY_ROUTES, firstRunRoute, useEntry } from '../../navigation/guards';
import { InsetDoor } from '../shared/InsetDoor';

type Props = StaticScreenProps<{ token: string }>;

/**
 * The invite landing on the phone (`SCR-M01-08`, `M01-13`), opened by `heliogrid://invite/<token>`
 * signed out or signed in. Once the join admits the session the App group mounts its first screen
 * (`landingFor`), and this screen hands the person there — or, for an account the join named from
 * the invite, to First-Run Profile (`SCR-M01-09`) — (`useHandOffAfterJoin`); *Sign in to
 * HelioGrid* opens the door, or that first screen for a person already inside.
 */
export function InviteLandingScreen({ route }: Props) {
  const { token } = route.params;
  // A second link reuses this route with new params: keyed by the token, its landing starts afresh.
  return <InviteLandingFor key={token} token={token} />;
}

function InviteLandingFor({ token }: { token: string }) {
  const t = useTranslate();
  const navigation = useNavigation();
  const entry = useEntry();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const handOff = useHandOffAfterJoin();
  const { state, frame, typeCode, press } = useInviteLanding(token, handOff);

  const signIn = () => {
    if (entry === null) navigation.dispatch(StackActions.popTo('Login'));
    else navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: entry }] }));
  };

  const { cooldownLeft, triesLeft } = state.code;
  return (
    <InsetDoor>
      <InviteLanding
        language={language}
        words={inviteLandingWords(t, frame, state.invite, { cooldownLeft, triesLeft })}
        frame={frame}
        phone={state.invite?.phoneE164 ?? null}
        code={state.code.code}
        onCode={typeCode}
        onPress={press}
        onSignIn={signIn}
      />
    </InsetDoor>
  );
}

/**
 * After the join, the landing hands the person to the App group's first screen. Done from the
 * join's answer and from navigation events, never from this screen's render: the admitted session
 * mounts the App group and takes this screen out of focus, and the navigator pauses an unfocused
 * screen's renders, so an effect here would never see the join. The group mounts in the
 * navigator's own update, so the reset waits for the first state that holds an entry route.
 */
function useHandOffAfterJoin(): () => void {
  const navigation = useNavigation();
  const firstRunOwed = useFirstRunOwed();
  const joined = useRef(false);
  const handOff = useCallback(() => {
    if (!joined.current) return;
    const names: readonly string[] = navigation.getState()?.routeNames ?? [];
    const entry = APP_ENTRY_ROUTES.find((route) => names.includes(route));
    if (entry === undefined) return;
    joined.current = false;
    const next = firstRunOwed() && names.includes(firstRunRoute) ? firstRunRoute : entry;
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: next }] }));
  }, [navigation, firstRunOwed]);
  useEffect(() => navigation.addListener('state', handOff), [navigation, handOff]);
  return useCallback(() => {
    joined.current = true;
    handOff();
  }, [handOff]);
}
