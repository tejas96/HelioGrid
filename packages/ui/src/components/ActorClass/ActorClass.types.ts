import type { ReactElement } from 'react';

/** The four actor classes — `person | agent | system | customer`. */
export type ActorClassName = 'person' | 'agent' | 'system' | 'customer';

/** The glyph each class draws. `agent` is the brand gradient object, not an outlined icon. */
export type ActorGlyphName = 'user' | 'agent' | 'cog' | 'customer';

/** The tone the glyph is inked in — the words themselves stay in the caller's `color`. */
export type ActorTone = 'neutral' | 'accent' | 'info';

export interface ActorClassProps {
  actorClass?: ActorClassName;
  /** The name, where there is one. A person is a name; every other class still states its class. */
  actor?: string;
  /**
   * `stream` — what happened and who by ("HelioGrid agent", "Automatic"): the `ActivityStream` form.
   * `origin` — why a task exists ("Created by a rule · no contact in 3 days"): the task form.
   */
  form?: 'stream' | 'origin';
  /** The act, in `origin` form: "Created by", "Reopened by", "Resurfaced by" (SCR-M07-04). */
  verb?: string;
  /** The rule's own name — M07-06's "a rep always sees WHY a task exists". */
  rule?: string;
  size?: number;
  color?: string;
}

/** A spec object, a bare class name, or a ready node — what every host's attribution prop takes. */
export type ActorClassSpec = ActorClassName | ActorClassProps | ReactElement;

export interface ActorClassDescriptor {
  label: string;
  glyph: ActorGlyphName;
  tone: ActorTone;
  /** The `stream` wording — what happened, and who by. */
  word: (name?: string) => string;
  /** The `origin` wording — the tail of "<verb> …", so a task can say why it exists. */
  origin: (name?: string) => string;
}

/**
 * One vocabulary, three hosts (`ActivityStream.entry`, `NextAction.origin`, `Transcript`'s turns).
 * A person is a name; every other class states its class in words, so an automatic resurface can
 * never read as a human act even when a person's name sits beside it.
 */
export const ACTOR_CLASSES: Record<ActorClassName, ActorClassDescriptor> = {
  person: {
    label: 'A person',
    glyph: 'user',
    tone: 'neutral',
    word: (name) => name ?? 'A team member',
    origin: (name) => name ?? 'a team member',
  },
  agent: {
    label: 'The agent',
    glyph: 'agent',
    tone: 'info',
    word: (name) => (name !== undefined ? `${name} · agent` : 'HelioGrid agent'),
    origin: (name) => (name !== undefined ? `${name}, the agent` : 'the agent'),
  },
  system: {
    label: 'The system',
    glyph: 'cog',
    tone: 'neutral',
    word: (name) => (name !== undefined ? `Automatic · ${name}` : 'Automatic'),
    origin: (name) => (name !== undefined ? `a rule · ${name}` : 'a rule'),
  },
  customer: {
    label: 'The customer',
    glyph: 'customer',
    tone: 'accent',
    word: (name) => (name !== undefined ? `${name} · customer` : 'The customer'),
    origin: (name) => (name !== undefined ? `${name}, the customer` : 'the customer'),
  },
};

export interface ActorClassOption {
  value: ActorClassName;
  label: string;
}

/** `FilterSet` options for the four classes, in one order, so every host filters alike. */
export function actorClassOptions(): ActorClassOption[] {
  const order: ActorClassName[] = ['person', 'agent', 'system', 'customer'];
  return order.map((value) => ({ value, label: ACTOR_CLASSES[value].label }));
}

/** The words this spec renders — one implementation, so both platforms print the same sentence. */
export function actorWords({
  actorClass = 'system',
  actor,
  form = 'stream',
  verb = 'Created by',
  rule,
}: ActorClassProps): string {
  const descriptor = ACTOR_CLASSES[actorClass];
  const words = form === 'origin' ? `${verb} ${descriptor.origin(actor)}` : descriptor.word(actor);
  return rule !== undefined ? `${words} · ${rule}` : words;
}
