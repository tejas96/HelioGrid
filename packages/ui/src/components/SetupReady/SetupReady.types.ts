import type { TranslatedText } from '@heliogrid/contracts';
import type { DemoDoor, Read } from '@heliogrid/domain';

/** One door's words: its name, the line under it, and its one act. */
export interface SetupReadyDoorWords {
  title: TranslatedText;
  line: TranslatedText;
  act: TranslatedText;
}

/** Every word *You're ready* draws; `@heliogrid/i18n`'s `setupReadyWords` writes them. */
export interface SetupReadyWords {
  title: TranslatedText;
  /** The company read back: *Suryodaya Solar Solutions is set up.* */
  companyLine: (company: string) => TranslatedText;
  lead: SetupReadyDoorWords;
  demo: SetupReadyDoorWords & {
    /** The `Demo` mark beside the door's name, so it is on screen before the tap (brief decision 7). */
    badge: TranslatedText;
    /** Laid over the door's loading card. */
    loading: TranslatedText;
    /** The door's error card's title. */
    failed: TranslatedText;
  };
  /** The wall when the company cannot be read. */
  wall: { title: TranslatedText; line: TranslatedText };
  tryAgain: TranslatedText;
}

/**
 * *You're ready*, setup's last screen (`SCR-M01-06`, `M01-26`): the heading with the company read
 * back, and exactly two doors, each a card with one act — the card itself is not a target (brief
 * decision 4). Door one starts with a real lead; door two opens the demo project and follows
 * `demo`, keeping the ready door's height while it loads or fails, so nothing above it moves.
 * A failed read of the company draws the wall in their place: both doors are server acts, so
 * neither is offered, and the line says the company is set up. Nothing draws while it is read.
 */
export interface SetupReadyProps {
  /** The company's name, read back in the company line. */
  read: Read<string>;
  words: SetupReadyWords;
  demo: DemoDoor;
  /** Door one's answer is being recorded: its act shows it is working. */
  leaving: boolean;
  onStartWithLead: () => void;
  onOpenDemo: () => void;
  /** The demo door's *Try again*: *You're ready* is read again (`SCR-M01-06` m-error-demo). */
  onRetryDemo: () => void;
  /** The wall's *Try again* is out: the company is being read again. */
  retrying: boolean;
}
