import type { ComposedMessage } from '@heliogrid/contracts';
import type { MessageSheetAct, MessageSheetProps, MessageSheetWords } from './MessageSheet.types';

/**
 * The sheet's acts as both halves draw them: each button's look, its rail while it is out, and
 * the other acts inert until it answers. The PDF is offered only where the message has a document.
 */
export function messageActsOf(props: MessageSheetProps, composed: ComposedMessage) {
  const { pending, words, onPdf } = props;
  const act = (kind: MessageSheetAct, main: boolean, onClick: () => void) => ({
    variant: main ? ('primary' as const) : ('secondary' as const),
    size: 'lg' as const,
    fullWidth: true,
    loading: pending === kind,
    disabled: pending !== null && pending !== kind,
    onClick,
  });
  return {
    out: pending !== null,
    bubble: {
      text: composed.text,
      link: composed.link,
      ...(words.linkToCome === undefined ? {} : { linkToCome: words.linkToCome }),
      note: words.note,
      name: words.bubbleName,
    },
    share: act('share', true, () => props.onShare(composed)),
    copy: act('copy', false, () => props.onCopy(composed)),
    pdf:
      words.pdf === undefined || onPdf === undefined
        ? null
        : { label: words.pdf, button: act('pdf', false, onPdf) },
  };
}

/** The sheet's frame on both halves: its read, and no way out while an act is out. */
export function messageSheetOf(props: MessageSheetProps) {
  const { words, pending } = props;
  return {
    open: props.open,
    onClose: () => {
      if (pending === null) props.onClose();
    },
    closeLabel: words.close,
    title: words.title,
    dismissible: pending === null,
    read: props.message,
    loadingLabel: words.loading,
    errorTitle: words.failedTitle,
    errorMessage: words.failedMessage,
    retryLabel: words.retry,
  };
}

/** The copy act's glyph: a link where the message carries one (*Copy link*), else the words (*Copy message*). */
export function copyGlyphOf(words: MessageSheetWords): 'link' | 'clipboard' {
  return words.linkToCome === undefined ? 'clipboard' : 'link';
}
