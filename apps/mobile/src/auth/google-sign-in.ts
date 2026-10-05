import type { OpenGoogle } from '@heliogrid/data/react';
import type { GoogleSheetResult } from '@heliogrid/domain';
import { GoogleSignin, isCancelledResponse } from '@react-native-google-signin/google-signin';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../env';

let configured = false;

/**
 * The phone's Google sheet (`M01-02`): Google's own library on the device, which hands back an ID
 * token the server checks — no secret is on the device (ruled at the task's /start). The token's
 * audience is the WEB client on Android and the iOS client on iOS; the api accepts both. The last
 * Google login is signed out first, so the chooser shows on every press and a shared field phone
 * never signs the previous person's Google in silently. Every failure is `failed`; a back-out is
 * `cancelled`, which the door keeps silent.
 */
export const openGoogle: OpenGoogle = async () => {
  if (!configured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    configured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut();
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return { kind: 'cancelled' };
    const { idToken, user } = response.data;
    if (idToken === null) return { kind: 'failed' };
    return { kind: 'token', token: { idToken, nonce: null, email: user.email } };
  } catch {
    return { kind: 'failed' } satisfies GoogleSheetResult;
  }
};
