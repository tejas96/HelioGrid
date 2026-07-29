import * as Keychain from 'react-native-keychain';

/**
 * Better Auth `storage` adapter over react-native-keychain (docs/03 §10, verified
 * pattern): keychain tolerates Better Auth's colon-separated keys — expo-secure-store
 * does not, which is why the custom adapter is the cleaner path. NEVER AsyncStorage
 * for tokens (apps/mobile/CLAUDE.md). Consumed by the Track A auth slice + spike S1.
 */

const SERVICE_PREFIX = 'heliogrid.auth';

export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const keychainStorage: AuthStorage = {
  async getItem(key) {
    const creds = await Keychain.getGenericPassword({ service: `${SERVICE_PREFIX}.${key}` });
    return creds === false ? null : creds.password;
  },
  async setItem(key, value) {
    await Keychain.setGenericPassword('heliogrid', value, {
      service: `${SERVICE_PREFIX}.${key}`,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  },
};
