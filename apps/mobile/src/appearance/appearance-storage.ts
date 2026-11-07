import { type Appearance, appearanceOf } from '@heliogrid/domain';
import * as Keychain from 'react-native-keychain';

/**
 * The appearance kept on this phone. React Native ships no plain key-value store and this app
 * takes none (no AsyncStorage), so the keychain holds it under its own service, apart from the
 * session. A read that fails answers `device`, so the app always opens.
 */
const SERVICE = 'heliogrid.appearance';

export async function readAppearance(): Promise<Appearance> {
  try {
    const stored = await Keychain.getGenericPassword({ service: SERVICE });
    return (stored === false ? null : appearanceOf(stored.password)) ?? 'device';
  } catch {
    return 'device';
  }
}

export async function keepAppearance(next: Appearance): Promise<void> {
  try {
    await Keychain.setGenericPassword('appearance', next, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  } catch {
    // The switch still applies for this run; it is only not kept.
  }
}
