import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactElement } from 'react';

/** The four actor classes — `person | agent | system | customer`. */
export type ActorClassName = 'person' | 'agent' | 'system' | 'customer';

/** The glyph each class draws. `agent` is the brand gradient object, not an outlined icon. */
export type ActorGlyphName = 'user' | 'agent' | 'cog' | 'customer';

/** The tone the glyph is inked in — the words themselves stay in the caller's `color`. */
export type ActorTone = 'neutral' | 'accent' | 'info';

export interface ActorClassProps {
  actorClass?: ActorClassName;
  /** The name, where there is one — a fact. A person is a name; every other class still states its class. */
  actor?: string;
  /**
   * `stream` — what happened and who by ("HelioGrid agent", "Automatic"): the `ActivityStream` form.
   * `origin` — why a task exists ("Created by a rule · no contact in 3 days"): the task form.
   */
  form?: 'stream' | 'origin';
  /**
   * The act, in `origin` form: "Created by", "Reopened by", "Resurfaced by" (SCR-M07-04). Without
   * it, `words.createdBy`.
   */
  verb?: TranslatedText;
  /** The rule's own name, as the company wrote it — M07-06's "a rep always sees WHY a task exists". */
  rule?: string;
  size?: number;
  color?: string;
  /** The class's words in the reader's language (`@heliogrid/i18n`'s `actorClassWords`). */
  words: ActorClassWords;
}

/**
 * A spec object or a ready node — what every host's attribution prop takes. A bare class name
 * carries no words, and the words are the caller's, so it comes as a spec.
 */
export type ActorClassSpec = ActorClassProps | ReactElement;

/** The classes that print a name beside their class; a person IS the name. */
export type NamedActorClass = Exclude<ActorClassName, 'person'>;

/**
 * Every word the actor line prints, in the reader's language. A person is a name; every other
 * class states its class in words, so an automatic resurface never reads as a human act.
 */
export interface ActorClassWords {
  /** Each class as a filter offers it — "A person", "The agent", "The system", "The customer". */
  label: Record<ActorClassName, TranslatedText>;
  /** `stream` form with no name — "A team member", "HelioGrid agent", "Automatic", "The customer". */
  unnamed: Record<ActorClassName, TranslatedText>;
  /** `stream` form with a name — "Ravi · agent", "Automatic · <name>", "Asha · customer". */
  named: Record<NamedActorClass, (name: string) => TranslatedText>;
  /** `origin` form's actor with no name — "a team member", "the agent", "a rule", "the customer". */
  originUnnamed: Record<ActorClassName, TranslatedText>;
  /** `origin` form's actor with a name — "Ravi, the agent", "a rule · <name>", "Asha, the customer". */
  originNamed: Record<NamedActorClass, (name: string) => TranslatedText>;
  /** The `origin` sentence — "<verb> <actor>": "Created by the agent". */
  origin: (verb: string, actor: string) => TranslatedText;
  /** The verb a caller that names none gets — "Created by". */
  createdBy: TranslatedText;
}

export interface ActorClassDescriptor {
  glyph: ActorGlyphName;
  tone: ActorTone;
}

/**
 * One vocabulary, three hosts (`ActivityStream.entry`, `NextAction.origin`, `Transcript`'s turns):
 * the glyph and the tone each class draws. The words are the caller's (`ActorClassWords`).
 */
export const ACTOR_CLASSES: Record<ActorClassName, ActorClassDescriptor> = {
  person: { glyph: 'user', tone: 'neutral' },
  agent: { glyph: 'agent', tone: 'info' },
  system: { glyph: 'cog', tone: 'neutral' },
  customer: { glyph: 'customer', tone: 'accent' },
};

export interface ActorClassOption {
  value: ActorClassName;
  label: TranslatedText;
}

/** `FilterSet` options for the four classes, in one order, so every host filters alike. */
export function actorClassOptions(words: ActorClassWords): ActorClassOption[] {
  const order: ActorClassName[] = ['person', 'agent', 'system', 'customer'];
  return order.map((value) => ({ value, label: words.label[value] }));
}

/** Who did it, in `stream` form: a person with a name is the name itself. */
function streamWords(words: ActorClassWords, actorClass: ActorClassName, actor?: string): string {
  if (actor === undefined) return words.unnamed[actorClass];
  return actorClass === 'person' ? actor : words.named[actorClass](actor);
}

/** The actor after the verb, in `origin` form. */
function originActor(words: ActorClassWords, actorClass: ActorClassName, actor?: string): string {
  if (actor === undefined) return words.originUnnamed[actorClass];
  return actorClass === 'person' ? actor : words.originNamed[actorClass](actor);
}

/** The words this spec renders — one implementation, so both platforms print the same sentence. */
export function actorWords({
  actorClass = 'system',
  actor,
  form = 'stream',
  verb,
  rule,
  words,
}: ActorClassProps): string {
  const said =
    form === 'origin'
      ? words.origin(verb ?? words.createdBy, originActor(words, actorClass, actor))
      : streamWords(words, actorClass, actor);
  return rule !== undefined ? `${said} · ${rule}` : said;
}
