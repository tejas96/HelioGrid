import type { Translator } from '../runtime';

type T = Translator['t'];

/** The builder's ask before a way out, while a value is not stored (`T-M06-023`). */
const LEAVE = {
  title: /*i18n*/ { id: 'Leave without saving?' },
  body: /*i18n*/ { id: 'Some of what you typed is not saved yet. It is lost if you leave.' },
  discard: /*i18n*/ { id: 'Discard and leave' },
  keep: /*i18n*/ { id: 'Keep editing' },
} as const;

/** `LeaveConfirm`'s words for the proposal builder, both apps. */
export function proposalBuilderLeaveWords(t: T) {
  return {
    title: t(LEAVE.title),
    body: t(LEAVE.body),
    discard: t(LEAVE.discard),
    keep: t(LEAVE.keep),
  };
}
