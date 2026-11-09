/**
 * The customer messages the product composes (`F6-26`, `F6-27`): the closed key list and the one
 * composer. Each key's words are tenant content per language (`F6-27`), never catalog copy.
 */
export {
  type ComposedMessage,
  composeMessage,
  MESSAGE_TEMPLATE_KEYS,
  type MessageTemplateKey,
} from './templates';
