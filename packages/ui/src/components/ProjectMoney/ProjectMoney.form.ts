import type { PayRequest, ProjectPayments, TranslatedText } from '@heliogrid/contracts';
import type { ReferenceStanding } from '@heliogrid/domain';
import type {
  MoneyPhoto,
  MoneyQrFullProps,
  MoneySheetForm,
  MoneySheetProps,
  MoneySheetWords,
  MoneyTyped,
} from './ProjectMoney.parts.types';

/** The sheet open over the payments screen, as the screen's read holds it. */
export type MoneySheetOpen =
  | { readonly kind: 'collect' | 'record' | 'waive'; readonly partId: string }
  | { readonly kind: 'reverse'; readonly entryId: string };

/** A money act the sheets send. */
export type MoneySheetAct =
  | { readonly kind: 'record'; readonly typed: MoneyTyped }
  | {
      readonly kind: 'reverse';
      readonly entryId: string;
      // biome-ignore lint/plugin/copy-prop-type: the reason the person typed — a fact
      readonly reason: string;
    }
  | {
      readonly kind: 'waive';
      readonly partId: string;
      // biome-ignore lint/plugin/copy-prop-type: the reason the person typed — a fact
      readonly reason: string;
    }
  | { readonly kind: 'shared'; readonly partId: string };

/** What the sheets read from the payments screen — `useProjectPayments` fills it. */
export interface MoneySheetScreen {
  readonly sheet: MoneySheetOpen | null;
  open(sheet: MoneySheetOpen): void;
  send(act: MoneySheetAct): void;
  readonly photo: { readonly file: { readonly name: string }; readonly preview: string } | null;
  removePhoto(): void;
  readonly recorder: string;
  readonly reference: { readonly standing: ReferenceStanding; check(typed: string): void };
}

/** The platform's own parts: how the message leaves, the QR held up, the photo chooser. */
export interface MoneySheetPlatform {
  /** Opens the request in the customer's chat app (`PayRequest.chatUri`). */
  openChat(uri: string, partId: string): void;
  sendMessage(text: string, partId: string): void;
  readonly fullScreen: ((partId: string) => void) | null;
  pickPhoto(): void;
}

/**
 * The money sheet's form, from the sheet the screen holds and the payments it read: the same on
 * the web and the phone, so both ask for the same facts and send the same acts. A part or entry
 * that is gone since the sheet opened closes it.
 */
export function moneySheetFormOf(
  screen: MoneySheetScreen,
  payments: ProjectPayments,
  platform: MoneySheetPlatform,
): MoneySheetForm | null {
  const { sheet } = screen;
  if (sheet === null) return null;
  if (sheet.kind === 'reverse') {
    const entry = payments.entries.find((one) => one.id === sheet.entryId);
    if (entry === undefined) return null;
    return {
      kind: 'reverse',
      amount: entry.amount,
      onSend: (reason) => screen.send({ kind: 'reverse', entryId: entry.id, reason }),
    };
  }
  const part = payments.parts.find((one) => one.id === sheet.partId);
  if (part === undefined) return null;
  switch (sheet.kind) {
    case 'collect': {
      const request = payments.requests.find((one) => one.partId === part.id);
      if (request === undefined) return null;
      const { fullScreen } = platform;
      const { chatUri } = request;
      return {
        kind: 'collect',
        part,
        request,
        payTo: payments.payTo,
        projectName: payments.name ?? payments.number,
        onChat: chatUri === null ? null : () => platform.openChat(chatUri, part.id),
        onSend: (text) => platform.sendMessage(text, part.id),
        onFullScreen: fullScreen === null ? null : () => fullScreen(part.id),
        onRecord: () => screen.open({ kind: 'record', partId: part.id }),
      };
    }
    case 'record':
      return {
        kind: 'record',
        part,
        modes: payments.modes,
        today: payments.today,
        photo: photoOf(screen.photo),
        onPickPhoto: platform.pickPhoto,
        onRemovePhoto: screen.removePhoto,
        recorder: screen.recorder,
        reference: screen.reference.standing,
        onReference: screen.reference.check,
        onSend: (typed) => screen.send({ kind: 'record', typed }),
      };
    case 'waive':
      return {
        kind: 'waive',
        part,
        onSend: (reason) => screen.send({ kind: 'waive', partId: part.id, reason }),
      };
  }
}

function photoOf(photo: MoneySheetScreen['photo']): MoneyPhoto | null {
  return photo === null ? null : { name: photo.file.name, preview: photo.preview };
}

/** What the payments page's acts read from the screen. */
export interface MoneyPageScreen {
  open(sheet: MoneySheetOpen): void;
  readonly online: boolean;
  readonly attaching: readonly string[];
}

/** The platform's own ways with a payment's receipt and photo. */
export interface MoneyPagePlatform {
  shareReceipt(entryId: string): void;
  receiptPdf(entryId: string): void;
  addPhoto(entryId: string): void;
  openPhoto(fileId: string): void;
}

/**
 * The payments page's acts, the same on the web and the phone: each part's and payment's act opens
 * its sheet, and the receipt and photo go the platform's way.
 */
export function moneyPageActsOf(screen: MoneyPageScreen, platform: MoneyPagePlatform) {
  return {
    online: screen.online,
    attaching: screen.attaching,
    onCollect: (partId: string) => screen.open({ kind: 'collect', partId }),
    onRecord: (partId: string) => screen.open({ kind: 'record', partId }),
    onReverse: (entryId: string) => screen.open({ kind: 'reverse', entryId }),
    onWaive: (partId: string) => screen.open({ kind: 'waive', partId }),
    onShareRequest: (partId: string) => screen.open({ kind: 'collect', partId }),
    onShareReceipt: platform.shareReceipt,
    onReceiptPdf: platform.receiptPdf,
    onAddPhoto: platform.addPhoto,
    onOpenPhoto: platform.openPhoto,
  };
}

/** What the open sheet and the full-screen QR read from the screen, beyond the form's facts. */
export interface MoneySheetsScreen extends MoneySheetScreen {
  close(): void;
  readonly sending: boolean;
  readonly failureField: 'reference' | null;
  readonly fullQr: PayRequest | null;
  showQr(partId: string | null): void;
}

/**
 * The money sheet's and the full-screen QR's props, the same on the web and the phone. `failure`
 * is the last refusal in the person's words; `money` formats the UPI limit the sheet names.
 */
export function moneySheetsOf(
  screen: MoneySheetsScreen,
  payments: ProjectPayments,
  platform: MoneySheetPlatform,
  said: {
    readonly words: MoneySheetWords;
    readonly failure: TranslatedText | null;
    money(amount: string): string;
  },
): { readonly sheet: MoneySheetProps; readonly qr: MoneyQrFullProps } {
  const { words } = said;
  const limit = payments.payTo.upiLimit;
  return {
    sheet: {
      form: moneySheetFormOf(screen, payments, platform),
      words,
      onClose: screen.close,
      sending: screen.sending,
      failure: said.failure,
      failureField: screen.failureField,
      upiLimit: limit === null ? null : said.money(limit),
    },
    qr: {
      request: screen.fullQr,
      payTo: payments.payTo,
      words,
      onClose: () => screen.showQr(null),
    },
  };
}
