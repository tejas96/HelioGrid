import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * The native side of push (`F6-13`) — the one place this app touches Firebase or Notifee.
 *
 * It answers two questions and does one thing: may we push, what is this handset's token, and
 * show a message that arrived while the app was in front. Everything downstream — who gets the
 * token, when a push is owed, what it says — is the server's; nothing here decides.
 *
 * Android 13+ and iOS both require an explicit grant. A refusal is a legitimate answer and not an
 * error: `F6-06` makes the record the truth, so a person who says no still has a full inbox.
 *
 * NOTHING HERE MAY THROW. Push is best effort by contract, and an app that dies because push
 * failed contradicts the law it implements — a person with no notifications must still have
 * their whole product. Every call into the platform is therefore contained here, and each
 * answers "no" rather than raising: no permission, no token, no subscription. The failure this
 * rule was written for was real — an unconfigured Firebase on iOS threw out of a mount effect
 * and took the render tree down to a blank screen.
 */

/**
 * Notifee needs a channel on Android before anything can be displayed. One channel, named for
 * what it carries; per-type channels would be a second grouping vocabulary beside `F6-15`'s.
 */
const ANDROID_CHANNEL = 'heliogrid-work';

/** Asks once. Returns false when the person declined, or when the platform declined for them. */
export async function askToPush(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * This handset's FCM token, or null when there is none to have.
 *
 * On iOS the token is minted from an APNs token, which a SIMULATOR can never obtain — so a
 * simulator answers null and the app carries on with its inbox. That is the honest shape of the
 * limitation, not a bug to work around.
 */
export async function pushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/** The platform the server stores against the token, so the transport can shape its payload. */
export const thisPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

/**
 * Shows a message that arrived while the app was in FRONT. The operating system draws a push on
 * its own only when the app is backgrounded; in the foreground it hands the payload over and
 * says nothing, so without this a notification would silently not appear.
 */
export async function showInForeground(title: string, body: string): Promise<void> {
  try {
    await notifee.createChannel({
      id: ANDROID_CHANNEL,
      name: 'Work',
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      title,
      body,
      android: { channelId: ANDROID_CHANNEL, pressAction: { id: 'default' } },
    });
  } catch {
    /* The record is the truth (`F6-06`); a notification we could not draw loses nothing. */
  }
}

/**
 * Every arrival, foreground and tapped, with the deep link the payload carries.
 *
 * `subjectKind` and `subjectRef` are what the server puts in `data` — a notification is a
 * pointer to a real record and never a dead announcement (`F6-02`). Routing on them belongs to
 * the navigator and lands with the first screen that has a subject to route to.
 */
export function onPushArrived(
  handle: (arrival: {
    title: string;
    body: string;
    subjectKind?: string;
    subjectRef?: string;
  }) => void,
): () => void {
  try {
    return subscribe(handle);
  } catch {
    /* No messaging on this device, or no Firebase app: the inbox still works. */
    return () => {};
  }
}

function subscribe(
  handle: (arrival: {
    title: string;
    body: string;
    subjectKind?: string;
    subjectRef?: string;
  }) => void,
): () => void {
  const unsubscribe = messaging().onMessage(async (remote) => {
    const title = remote.notification?.title ?? '';
    const body = remote.notification?.body ?? '';
    if (title.length > 0 || body.length > 0) await showInForeground(title, body);
    handle({
      title,
      body,
      subjectKind: remote.data?.subjectKind as string | undefined,
      subjectRef: remote.data?.subjectRef as string | undefined,
    });
  });
  return unsubscribe;
}
