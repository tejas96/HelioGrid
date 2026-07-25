import notifee from '@notifee/react-native';

/**
 * Notifee owns rich local display + channels. FCM/APNs remote push activates when the
 * Firebase project credentials land (google-services.json / GoogleService-Info.plist —
 * external paperwork); @react-native-firebase/messaging is installed but not initialised
 * until then. PushPort registration wires in the Track A slice.
 */
export async function showLocalNotification(title: string, body: string) {
  await notifee.requestPermission();
  const channelId = await notifee.createChannel({ id: 'default', name: 'Default' });
  await notifee.displayNotification({ title, body, android: { channelId } });
}
