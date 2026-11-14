import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * The sheets the customer answers on (`SCR-F5-01`, `F5-43`, `F5-52`…`F5-54`): Accept, the four
 * ways to ask, and each of them. In the customer's voice; a suggestion or a reason the customer
 * taps is sent as its own words, in the language they read it in.
 */
type T = Translator['t'];

const ACCEPT = {
  title: /*i18n*/ { id: 'Accept this proposal?' },
  system: /*i18n*/ { id: 'System' },
  systemValue: /*i18n*/ { id: '{size} kW rooftop solar · version {version}' },
  systemPlain: /*i18n*/ { id: 'Rooftop solar · version {version}' },
  priceWithTax: /*i18n*/ { id: 'Price with {tax}' },
  price: /*i18n*/ { id: 'Price' },
  first: /*i18n*/ { id: 'First payment, after the call' },
  confirm: /*i18n*/ { id: 'Yes, I accept' },
  note: /*i18n*/ { id: 'You pay nothing now. {person} calls you first.' },
  notePlain: /*i18n*/ { id: 'You pay nothing now. We call you first.' },
} satisfies Record<string, MessageRef>;

const MORE = {
  title: /*i18n*/ { id: 'How can we help?' },
  ask: /*i18n*/ { id: 'Ask a question' },
  askLine: /*i18n*/ { id: '{person} calls you with the answer' },
  askLinePlain: /*i18n*/ { id: 'We call you with the answer' },
  call: /*i18n*/ { id: 'Request a call' },
  callLine: /*i18n*/ { id: 'Pick a time that suits you' },
  change: /*i18n*/ { id: 'Ask for a change' },
  changeLine: /*i18n*/ { id: 'Size, price, brand or payment plan' },
  decline: /*i18n*/ { id: 'Decline' },
  declineLine: /*i18n*/ { id: 'Tell us this is not for you' },
} satisfies Record<string, MessageRef>;

const ASK = {
  title: /*i18n*/ { id: 'Ask a question' },
  label: /*i18n*/ { id: 'Your question' },
  placeholder: /*i18n*/ { id: 'For example: is the structure rust-proof?' },
  rustProof: /*i18n*/ { id: 'Is the structure rust-proof?' },
  cleaning: /*i18n*/ { id: 'Who cleans the panels?' },
  moving: /*i18n*/ { id: 'What if I move house?' },
  send: /*i18n*/ { id: 'Send question' },
} satisfies Record<string, MessageRef>;

const CALL = {
  title: /*i18n*/ { id: 'When shall we call?' },
  group: /*i18n*/ { id: 'Time' },
  today: /*i18n*/ { id: 'Today, {from}–{to}' },
  tomorrow: /*i18n*/ { id: 'Tomorrow, {from}–{to}' },
  soon: /*i18n*/ { id: 'As soon as possible' },
  hint: /*i18n*/ { id: 'We only call because you asked.' },
  send: /*i18n*/ { id: 'Request the call' },
} satisfies Record<string, MessageRef>;

const CHANGE = {
  title: /*i18n*/ { id: 'What would you like changed?' },
  label: /*i18n*/ { id: 'Your request' },
  placeholder: /*i18n*/ { id: 'Tell us in your own words' },
  bigger: /*i18n*/ { id: 'A bigger system' },
  cheaper: /*i18n*/ { id: 'A lower price' },
  brand: /*i18n*/ { id: 'Another brand' },
  plan: /*i18n*/ { id: 'An easier payment plan' },
  send: /*i18n*/ { id: 'Send request' },
} satisfies Record<string, MessageRef>;

const DECLINE = {
  title: /*i18n*/ { id: 'Decline this proposal?' },
  why: /*i18n*/ { id: 'Why? You do not have to say.' },
  price: /*i18n*/ { id: 'The price' },
  notNow: /*i18n*/ { id: 'Not now' },
  another: /*i18n*/ { id: 'Another company' },
  roof: /*i18n*/ { id: 'My roof' },
  confirm: /*i18n*/ { id: 'Decline proposal' },
  note: /*i18n*/ { id: 'You can still call {person} later.' },
  notePlain: /*i18n*/ { id: 'You can still call us later.' },
} satisfies Record<string, MessageRef>;

const SHEET = {
  close: /*i18n*/ { id: 'Close' },
  back: /*i18n*/ { id: 'Back' },
} satisfies Record<string, MessageRef>;

/** A time the customer may pick for a call: its day and its two hours, as the format writes them. */
export interface CallSlotWords {
  readonly day: 'today' | 'tomorrow';
  readonly from: string;
  readonly to: string;
}

/** The answer sheets' words; `personName` is `null` where the page names no one. */
export function customerSheetWords(t: T, personName: string | null) {
  const person = personName;
  return {
    close: t(SHEET.close),
    back: t(SHEET.back),
    accept: {
      title: t(ACCEPT.title),
      system: t(ACCEPT.system),
      systemValue: (size: string | null, version: number) =>
        size === null
          ? t(ACCEPT.systemPlain, { version })
          : t(ACCEPT.systemValue, { size, version }),
      price: (tax: string | null) =>
        tax === null ? t(ACCEPT.price) : t(ACCEPT.priceWithTax, { tax }),
      first: t(ACCEPT.first),
      confirm: t(ACCEPT.confirm),
      note: person === null ? t(ACCEPT.notePlain) : t(ACCEPT.note, { person }),
    },
    more: {
      title: t(MORE.title),
      ask: t(MORE.ask),
      askLine: person === null ? t(MORE.askLinePlain) : t(MORE.askLine, { person }),
      call: t(MORE.call),
      callLine: t(MORE.callLine),
      change: t(MORE.change),
      changeLine: t(MORE.changeLine),
      decline: t(MORE.decline),
      declineLine: t(MORE.declineLine),
    },
    ask: {
      title: t(ASK.title),
      label: t(ASK.label),
      placeholder: t(ASK.placeholder),
      suggestions: [t(ASK.rustProof), t(ASK.cleaning), t(ASK.moving)] as readonly TranslatedText[],
      send: t(ASK.send),
    },
    call: {
      title: t(CALL.title),
      group: t(CALL.group),
      slot: (slot: CallSlotWords) =>
        t(slot.day === 'today' ? CALL.today : CALL.tomorrow, { from: slot.from, to: slot.to }),
      soon: t(CALL.soon),
      hint: t(CALL.hint),
      send: t(CALL.send),
    },
    change: {
      title: t(CHANGE.title),
      label: t(CHANGE.label),
      placeholder: t(CHANGE.placeholder),
      suggestions: [
        t(CHANGE.bigger),
        t(CHANGE.cheaper),
        t(CHANGE.brand),
        t(CHANGE.plan),
      ] as readonly TranslatedText[],
      send: t(CHANGE.send),
    },
    decline: {
      title: t(DECLINE.title),
      why: t(DECLINE.why),
      reasons: [
        t(DECLINE.price),
        t(DECLINE.notNow),
        t(DECLINE.another),
        t(DECLINE.roof),
      ] as readonly TranslatedText[],
      confirm: t(DECLINE.confirm),
      note: person === null ? t(DECLINE.notePlain) : t(DECLINE.note, { person }),
    },
  };
}
export type CustomerSheetWords = ReturnType<typeof customerSheetWords>;
