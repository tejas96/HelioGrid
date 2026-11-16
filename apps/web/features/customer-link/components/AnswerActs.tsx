'use client';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import type { CustomerProposalWords } from '@heliogrid/i18n';
import { Button, ShellGlyph } from '@heliogrid/ui';

/** Which answers the page still takes (`F5-21`: scopes ∩ phase, one answer per version). */
export interface Answering {
  /** Accept, a change or a decline is still open on this version. */
  readonly mayRespond: boolean;
  /** A question or a call may be asked: the page's shared ceiling is not met. */
  readonly mayAsk: boolean;
}

/**
 * The page's two acts (`F5-43`, `F5-52`): Accept, and the one door to everything else. On a phone
 * they sit in the bar that stays in thumb reach; at the desktop's room, in the card beside the
 * content. After an answer only the question and the call are left.
 */
export function AnswerActs({
  screen,
  answering,
  wide,
  words,
}: {
  screen: CustomerPageScreen;
  answering: Answering;
  /** The desktop's card: full words and one button a row. */
  wide: boolean;
  words: CustomerProposalWords;
}) {
  const { mayRespond, mayAsk } = answering;
  const waiting = screen.acting !== null;
  if (!mayRespond && !mayAsk) return null;
  return (
    <>
      {mayRespond ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth={wide}
          disabled={waiting}
          icon={<ShellGlyph name="check" />}
          onClick={() => screen.open('accept')}
        >
          {wide ? words.acts.acceptWide : words.acts.accept}
        </Button>
      ) : null}
      <Button
        variant="secondary"
        size="lg"
        fullWidth={wide}
        disabled={waiting}
        icon={<ShellGlyph name="chat" />}
        onClick={() => screen.open('more')}
      >
        {mayRespond ? (wide ? words.acts.askWide : words.acts.askOrChange) : words.acts.askOnly}
      </Button>
    </>
  );
}
