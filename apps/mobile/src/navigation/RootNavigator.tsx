import { theme } from '@heliogrid/tokens/theme';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { api } from '../data/api-client';
import { GalleryScreen } from '../screens/gallery/GalleryScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LoginScreen } from '../screens/login/LoginScreen';
import { Spinner } from '../ui';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The session gate lives HERE, not in App.tsx (ADR-0020): while we are checking the
 * keychain-jar session we show a boot spinner, then mount exactly one of the two stacks.
 * Swapping stacks — rather than navigating — means a signed-out user has no authenticated
 * screen left in the history to go back to.
 */
export function RootNavigator() {
  const [session, setSession] = useState<'checking' | 'out' | 'in'>('checking');

  const refresh = useCallback(async () => {
    try {
      const res = await api.auth.me.query({});
      setSession(res.status === 200 ? 'in' : 'out');
    } catch {
      // Unreachable api (offline / dev server down): land on the login gate — it owns the
      // offline treatment.
      setSession('out');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (session === 'checking') {
    return (
      <View style={styles.boot}>
        <Spinner />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session === 'out' ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onSignedIn={() => void refresh()} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
          </>
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
