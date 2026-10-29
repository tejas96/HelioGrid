import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';

/** One grant or limit phrase, keyed by its line in domain's `ROLE_CARD_LINES`. */
export interface RoleCardLine {
  readonly key: string;
  readonly text: string;
}

/** Every word the card draws, already translated: `@heliogrid/i18n`'s `roleCardWords`. */
export interface RoleCardWords {
  /** The held presets' names, joined. */
  readonly presets: TranslatedText;
  /** *Last set by …*; `null` when nobody set the roles (the founder) or the name has not arrived. */
  readonly credit: TranslatedText | null;
  readonly canDo: TranslatedText;
  readonly cannotDo: TranslatedText;
  /** The rows' region name. */
  readonly region: TranslatedText;
  /** The rows' name while they wait. */
  readonly loading: TranslatedText;
  readonly grants: readonly RoleCardLine[];
  /** Empty for a person who lacks nothing: no *What you cannot do*. */
  readonly limits: readonly RoleCardLine[];
  /** Who adds a teammate; `null` when the person does it themself, or no owner name has arrived. */
  readonly note: { readonly title: TranslatedText; readonly message: TranslatedText } | null;
  readonly error: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly retry: TranslatedText;
  };
}

/**
 * How the card meets its holder. `bounded` — the first-run door and the phone's reopened sheet: the
 * card takes the room its holder leaves, its head stays and its rows scroll inside it, in two
 * columns when the card is wide. `flowing` — the reopened side panel: one column at its full
 * height, and the panel around it scrolls.
 */
export type RoleCardLayout = 'bounded' | 'flowing';

/**
 * The role card (`SCR-M01-10`): the person's presets and who set them, what they can do, what
 * they cannot, and who to ask. While the rows wait, the head draws and the rows are loading lines;
 * a failed read draws the error card with *Try again*.
 */
export interface RoleCardProps {
  readonly words: RoleCardWords;
  readonly layout: RoleCardLayout;
  /** The card's reads: the rows wait while it is out; a failed read is the error card and its *Try again*. */
  readonly read: Read<unknown>;
}

/**
 * The card's reopened life (`m-reopened`, `d-reopened`): the sheet at 375, whose body holds still
 * while the card's rows scroll, and the 480 right panel from 720, which scrolls the card whole;
 * titled for the role, with its close.
 */
export interface RoleCardSurfaceProps extends Omit<RoleCardProps, 'layout'> {
  readonly open: boolean;
  readonly onClose: () => void;
  /** *Your role* or *Your roles*. */
  readonly title: TranslatedText;
  readonly closeLabel: TranslatedText;
}
