/**
 * The customer link (`F5`): one tokenised link per named contact, serving the proposal, then the
 * progress, then the solar file — no login, no account. This package holds its vocabulary and its
 * pure rules; the token, its storage and every page are the api's and the web's.
 */

export { CREW_MESSAGE_FACTS, type CrewMessageFact, crewMessageMissing } from './crew-message-facts';
export {
  type CrewMessageRules,
  callRequestDueAt,
  consentedCallTime,
  crewMessageMoment,
  isCrewMessageDue,
} from './moments';
export { type NamedPersonCandidates, namedPersonOf } from './named-person';
export {
  DEFAULT_LINK_SCOPES,
  effectiveRights,
  type LinkFacts,
  type LinkServing,
  linkPhaseOf,
  linkServing,
  mayRespond,
} from './rights';
export {
  ACCEPTANCE_CHALLENGES,
  type AcceptanceChallenge,
  DEVICE_CLASSES,
  type DeviceClass,
  LINK_CEILINGS,
  LINK_EVENT_TYPES,
  LINK_FAILURE_REASONS,
  LINK_PHASES,
  LINK_RESPOND_ACTS,
  LINK_SCOPES,
  LINK_SECTIONS,
  LINK_STATUSES,
  LINK_TEXT_LIMIT,
  type LinkEventType,
  type LinkFailureReason,
  type LinkPhase,
  type LinkRespondAct,
  type LinkScope,
  type LinkSection,
  type LinkStatus,
  QUESTION_STATES,
  type QuestionState,
} from './vocabulary';
