import type { TokenStorage } from '@heliogrid/data';
import * as Keychain from 'react-native-keychain';

/**
 * The platform half of @heliogrid/data's TokenStorage port — the ONE piece of the data path
 * that cannot be shared, because RN has no cookie jar and web's session is an HttpOnly
 * cookie JavaScript may not read. Keychain, NEVER AsyncStorage, for anything
 * credential-shaped: keychain also tolerates colon-separated keys, which is why the custom
 * adapter beat expo-secure-store when this was first written.
 */
const SERVICE = 'heliogrid.auth.session';

export const keychainStorage: TokenStorage = {
  async get() {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    return creds === false ? null : creds.password;
  },
  async set(value) {
    await Keychain.setGenericPassword('heliogrid', value, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  },
  async clear() {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};
