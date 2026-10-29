/**
 * The `ActorClass` line's words (`packages/ui`'s `ActorClassWords`): who or what did something, in
 * the reader's language. A person is a name; every other class states its class in words, so an
 * automatic resurface never reads as a human act (`M07-06`, `SCR-M07-04`).
 */
import type { Translator } from '../runtime';

/** Each class as a filter offers it — the same ids `ActivityStream`'s filter uses. */
const ACTOR_CLASS_LABEL = {
  person: /*i18n*/ { id: 'A person' },
  agent: /*i18n*/ { id: 'The agent' },
  system: /*i18n*/ { id: 'The system' },
  customer: /*i18n*/ { id: 'The customer' },
} as const;

/** What happened and who by, with no name. */
const ACTOR_UNNAMED = {
  person: /*i18n*/ { id: 'A team member' },
  agent: /*i18n*/ { id: 'HelioGrid agent' },
  system: /*i18n*/ { id: 'Automatic' },
  customer: /*i18n*/ { id: 'The customer' },
} as const;

/** What happened and who by, with the actor's name. */
const ACTOR_NAMED = {
  agent: /*i18n*/ { id: '{name} · agent' },
  system: /*i18n*/ { id: 'Automatic · {name}' },
  customer: /*i18n*/ { id: '{name} · customer' },
} as const;

/** Who a task's verb names, with no name. */
const ORIGIN_UNNAMED = {
  person: /*i18n*/ { id: 'a team member' },
  agent: /*i18n*/ { id: 'the agent' },
  system: /*i18n*/ { id: 'a rule' },
  customer: /*i18n*/ { id: 'the customer' },
} as const;

/** Who a task's verb names, with the actor's name. */
const ORIGIN_NAMED = {
  agent: /*i18n*/ { id: '{name}, the agent' },
  system: /*i18n*/ { id: 'a rule · {name}' },
  customer: /*i18n*/ { id: '{name}, the customer' },
} as const;

const ACTOR_ORIGIN = {
  /** Why a task exists — the verb, then who: "Created by the agent". */
  sentence: /*i18n*/ { id: '{verb} {actor}' },
  createdBy: /*i18n*/ { id: 'Created by' },
} as const;

/** Every word `ActorClass` prints, in the reader's language. */
export function actorClassWords(t: Translator['t']) {
  return {
    label: {
      person: t(ACTOR_CLASS_LABEL.person),
      agent: t(ACTOR_CLASS_LABEL.agent),
      system: t(ACTOR_CLASS_LABEL.system),
      customer: t(ACTOR_CLASS_LABEL.customer),
    },
    unnamed: {
      person: t(ACTOR_UNNAMED.person),
      agent: t(ACTOR_UNNAMED.agent),
      system: t(ACTOR_UNNAMED.system),
      customer: t(ACTOR_UNNAMED.customer),
    },
    named: {
      agent: (name: string) => t(ACTOR_NAMED.agent, { name }),
      system: (name: string) => t(ACTOR_NAMED.system, { name }),
      customer: (name: string) => t(ACTOR_NAMED.customer, { name }),
    },
    originUnnamed: {
      person: t(ORIGIN_UNNAMED.person),
      agent: t(ORIGIN_UNNAMED.agent),
      system: t(ORIGIN_UNNAMED.system),
      customer: t(ORIGIN_UNNAMED.customer),
    },
    originNamed: {
      agent: (name: string) => t(ORIGIN_NAMED.agent, { name }),
      system: (name: string) => t(ORIGIN_NAMED.system, { name }),
      customer: (name: string) => t(ORIGIN_NAMED.customer, { name }),
    },
    origin: (verb: string, actor: string) => t(ACTOR_ORIGIN.sentence, { verb, actor }),
    createdBy: t(ACTOR_ORIGIN.createdBy),
  };
}
