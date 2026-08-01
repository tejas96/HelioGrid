import { useSession } from '@heliogrid/data/react';
import { DONE_DWELL_MS } from '@heliogrid/domain';
import { theme } from '@heliogrid/tokens/theme';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GalleryScreen } from '../screens/gallery/GalleryScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LoginScreen } from '../screens/login/LoginScreen';
import { Spinner } from '../ui';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The session gate lives HERE, not in App.tsx: while the session is resolving we show a
 * boot spinner, then mount exactly one of the two stacks. Swapping stacks — rather than
 * navigating — means a signed-out user has no authenticated screen left in the history to
 * go back to.
 *
 * The gate reads the shared session store, so it needs no fetch of its own and no
 * `onSignedIn` callback threaded down into the login screen: verifying moves the store, and
 * this re-renders. The 'checking' branch stays because SessionStatus declares it and the
 * Better Auth rebuild will resolve a persisted session asynchronously; the walkthrough stub
 * has nothing to check for and starts anonymous.
 *
 * The swap is DELAYED by DONE_DWELL_MS. Authentication is instant, but the login screen's
 * done step has to be visible for the design to survive — and on web the equivalent pause
 * is a `router.push` the login controller schedules. Timing and navigation are the app's
 * job; the store only decides whether the user is authenticated.
 */
export function RootNavigator() {
  const { status } = useSession();
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setDwellElapsed(false);
      return;
    }
    const timer = setTimeout(() => setDwellElapsed(true), DONE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'checking') {
    return (
      <View style={styles.boot}>
        <Spinner />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' && dwellElapsed ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
