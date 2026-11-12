import type { PaymentPhoto, PaymentsScreen } from '@heliogrid/data/react';
import { filePickWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { AppState, Linking, Share } from 'react-native';
import { pickReceiptPhoto } from '../../../files/pick-file';
import { askAmong } from '../../shared/use-file-pick';

/**
 * The payments page's phone moves — the platform adapter: back to the project, the customer's chat
 * opened with the message typed, the phone's own share sheet for the pay message and the receipt
 * (the person sends them; after a hand-off the page asks whether it went out, and records it only
 * on their yes), the receipt PDF opened in the phone's viewer — which shares it on — the camera or
 * photos for a receipt photo, and the collect sheet the Money card opens on arrival.
 */
export function usePaymentMoves(
  projectId: string,
  screen: PaymentsScreen,
  collect: string | undefined,
) {
  const navigation = useNavigation();
  const pickPhoto = useReceiptPhotoPick();
  useCollectOnArrival(screen, collect);
  return {
    back: () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('ProjectDetail', { projectId });
    },
    sheet: {
      openChat: (uri: string, partId: string) => {
        void Linking.openURL(uri).then(
          () => askOnReturn(() => screen.handedOff(partId)),
          () => undefined,
        );
      },
      // iOS says whether the share was dismissed; Android always answers "shared". Either way the
      // product cannot know the message went out, so it asks (`M11-26`).
      sendMessage: (text: string, partId: string) => {
        void Share.share({ message: text }).then(
          (result) => {
            if (result.action === Share.sharedAction) screen.handedOff(partId);
          },
          () => undefined,
        );
      },
      fullScreen: (partId: string) => screen.showQr(partId),
      pickPhoto: () => pickPhoto(screen.pickPhoto),
    },
    receiptPdf: (entryId: string) => {
      void screen.receiptPdf(entryId).then(
        (url) =>
          url === null
            ? screen.say({ kind: 'receiptPreparing' })
            : Linking.openURL(url).catch(() => screen.say({ kind: 'receiptFailed' })),
        () => screen.say({ kind: 'receiptFailed' }),
      );
    },
    addPhoto: (entryId: string) => pickPhoto((photo) => screen.addPhoto(entryId, photo)),
    shareReceipt: (entryId: string) => {
      void screen.receipt(entryId).then(
        (receipt) => Share.share({ message: receipt.text }).catch(() => undefined),
        () => screen.say({ kind: 'receiptFailed' }),
      );
    },
    openPhoto: (fileId: string) => {
      void screen
        .fileLink(fileId)
        .then((url) => Linking.openURL(url))
        .catch(() => screen.say({ kind: 'photoFailed' }));
    },
  };
}

/** The camera or the photos, as the system offers them; the picked photo goes where `then` says. */
function useReceiptPhotoPick(): (then: (photo: PaymentPhoto) => void) => void {
  const { t } = useI18n();
  const format = useFormat();
  const words = filePickWords(t);
  const photoName = () => {
    const now = new Date();
    return words.photoName(format.date(now), format.clockAt(now.toISOString()));
  };
  const pickFrom = (fromCamera: boolean, then: (photo: PaymentPhoto) => void) => {
    void pickReceiptPhoto(fromCamera, photoName()).then(
      (photo) => {
        if (photo !== null) then(photo);
      },
      () => undefined,
    );
  };
  return (then) =>
    askAmong(words.photoTitle, [words.camera, words.photos], words.cancel, (index) =>
      pickFrom(index === 0, then),
    );
}

/**
 * A `collect` part in the route opens its collect sheet once the payments are read; the part is
 * then taken off the route, so the next *Remind* for this screen — already in the stack, and handed
 * the same part again — opens it again.
 */
function useCollectOnArrival(screen: PaymentsScreen, partId: string | undefined) {
  const navigation = useNavigation();
  // Only a reader who may share the request has its sheet opened for them (`M11-53`).
  const ready = screen.read.kind === 'ready' && screen.read.value.acts.share;
  useEffect(() => {
    if (partId === undefined || !ready) return;
    screen.open({ kind: 'collect', partId });
    navigation.setParams({ collect: undefined });
  }, [partId, ready, screen, navigation]);
}

/**
 * Asks whether the request went out once the person is back from the other app — asked while they
 * were away, the question would be gone before they could answer it.
 */
function askOnReturn(ask: () => void): void {
  const watching = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    watching.remove();
    ask();
  });
}
