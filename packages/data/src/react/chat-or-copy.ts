import type { ComposedMessage } from '@heliogrid/contracts';

/** The two hand-offs a composed message can take: its chat, or the clipboard. */
export interface MessageHandOff {
  openChat(message: ComposedMessage): void;
  copy(text: string, copied: () => void, notCopied: () => void): void;
}

/**
 * Sends the words to the customer's chat; where the market names no chat app (`chatUri` null) the
 * words are copied instead, and `copied` or `notCopied` says which — never a hand-off that silently
 * did nothing. Both apps' share acts go through here.
 */
export function chatOrCopy(
  moves: MessageHandOff,
  message: ComposedMessage,
  said: { chatted(): void; copied(): void; notCopied(): void },
): void {
  if (message.chatUri === null) {
    moves.copy(message.text, said.copied, said.notCopied);
    return;
  }
  moves.openChat(message);
  said.chatted();
}
