import type { LeadDetail, TranslatedText } from '@heliogrid/contracts';
import type {
  LeadActFailure,
  LeadDetailView,
  LeadQuickAct,
  LeadQuickStanding,
  LeadStateAct,
  QualifyQuestion,
} from '@heliogrid/domain';
import type { LeadDockWords } from '../LeadActionDock/LeadActionDock.logic';
import type { LeadActionDockLayout } from '../LeadActionDock/LeadActionDock.types';
import type { LeadHeroWords } from '../LeadHero/LeadHero.types';
import type { QualifyCardWords } from '../QualifyCard/QualifyCard.types';

/** The sheets these cards open; the screen's `acts.open` takes them among its others. */
export type LeadWorkCardsSheet =
  | { readonly kind: 'log' | 'visit' | Exclude<LeadStateAct, LeadQuickAct> }
  | { readonly kind: 'message'; readonly template: 'follow_up_nudge' };

/** What the cards read and press on the lead's screen; `useLeadDetailScreen` satisfies it. */
export interface LeadWorkCardsScreen {
  /** Opens the assign picker from the owner chip (`M02-29`). */
  readonly assign: { show(): void };
  readonly acts: {
    open(sheet: LeadWorkCardsSheet): void;
    /** Wake up now or reopen: no sheet, so the act's own pill says it is out or came back. */
    quick(act: LeadQuickAct): void;
    readonly quickStanding: LeadQuickStanding | null;
  };
  readonly qualify: {
    answer(question: QualifyQuestion, value: string | null): void;
    retry(question: QualifyQuestion): void;
    readonly markQualified: {
      run(): void;
      readonly pending: boolean;
      readonly failure: LeadActFailure | null;
    };
  };
  /** The reader may merge this customer with another (`crm.merge_customers`). */
  readonly canMerge: boolean;
}

/** Every word the cards say, built in `@heliogrid/i18n` (`leadWorkCardsWords`) over this lead. */
export interface LeadWorkCardsWords {
  readonly hero: LeadHeroWords;
  readonly dock: LeadDockWords;
  readonly qualify: QualifyCardWords;
  /** Why an act came back undone, said where the person acted. */
  readonly failure: (failure: LeadActFailure) => TranslatedText;
}

/**
 * **The lead as a rep works it on a call** (`SCR-M02-04`, `M02-32`), both platforms: the hero with
 * its stage, owner and value in the tenant's money, the five actions with the state acts, and the
 * six questions inline (`M02-39`). What they read and press is `useLeadDetailScreen`'s; the screen
 * supplies its own ways out.
 */
export interface LeadWorkCardsProps {
  readonly screen: LeadWorkCardsScreen;
  readonly lead: LeadDetail;
  readonly view: LeadDetailView;
  /** The desktop's hero names the lead itself; on the phone the large title already does. */
  readonly identity: boolean;
  readonly layout: LeadActionDockLayout;
  /** Quick add with this lead as the referrer (`M02-16`). */
  readonly onAddReferral: (leadId: string) => void;
  /** Customer merge with this customer as the survivor (`M02-63`), offered to who may merge. */
  readonly onMerge: (survivorId: string) => void;
  readonly words: LeadWorkCardsWords;
}
