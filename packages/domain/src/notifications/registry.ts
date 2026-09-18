import type {
  NotificationChannel,
  NotificationRecipientRule,
  NotificationSource,
  NotificationType,
  NotificationUrgency,
} from './types';

/**
 * What registering a type fixes (`F6-05`): who raises it, who receives it, where it is delivered
 * and how soon. No grouping class — `F6-12` groups records by type and subject within a day, and
 * whether a type groups at all is its urgency, so a column for it would be a second vocabulary
 * that can only drift from the first.
 */
export interface NotificationRegistration {
  readonly raisedBy: NotificationSource;
  /** At least one, and more where the matrix addresses several people at once. */
  readonly recipients: readonly [NotificationRecipientRule, ...NotificationRecipientRule[]];
  /** `in_app` is on every row — the record is the truth (`F6-06`) — and push rides on top. */
  readonly channels: readonly [NotificationChannel, ...NotificationChannel[]];
  readonly urgency: NotificationUrgency;
}

/**
 * The registry (`F6-05`): every type, with its registration. "No unregistered notification can
 * exist" is this TYPE rather than a rule anyone has to remember — `Record` means a type with no
 * registration and a registration for no type each fail to compile, so the mistake is
 * unrepresentable instead of caught.
 *
 * Every cell is read from the event matrix and none is invented. Delivery — resolving a recipient
 * rule to people, holding a push for quiet hours, honouring a mute — reads this and is built by
 * the slice that owns those rows.
 */
export const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationRegistration> = {
  proposal_opened: {
    raisedBy: 'proposals',
    recipients: ['subject_owner'],
    channels: ['in_app', 'push'],
    urgency: 'standard',
  },
  /** The one immediate type here: a call going wrong is worth interrupting someone for. */
  agent_escalation: {
    raisedBy: 'sales_execution',
    recipients: ['subject_owner'],
    channels: ['in_app', 'push'],
    urgency: 'immediate',
  },
  /** No push: the day's list is the surface, and the record is the nudge beside it. */
  follow_up_due: {
    raisedBy: 'sales_execution',
    recipients: ['subject_owner'],
    channels: ['in_app'],
    urgency: 'standard',
  },
  survey_submitted: {
    raisedBy: 'survey',
    recipients: ['subject_assignee'],
    channels: ['in_app', 'push'],
    urgency: 'standard',
  },
  design_returned: {
    raisedBy: 'design',
    recipients: ['subject_owner'],
    channels: ['in_app', 'push'],
    urgency: 'standard',
  },
  /** No push: the sign-off queue is the surface a holder works from. */
  signoff_requested: {
    raisedBy: 'design',
    recipients: ['capability_holders'],
    channels: ['in_app'],
    urgency: 'standard',
  },
  payment_due: {
    raisedBy: 'payments',
    recipients: ['capability_holders', 'epc_owner'],
    channels: ['in_app', 'push'],
    urgency: 'standard',
  },
  lead_unassigned_24h: {
    raisedBy: 'crm',
    recipients: ['epc_owner'],
    channels: ['in_app', 'push'],
    urgency: 'standard',
  },
  /** An announcement from the platform; its subject is the company it is addressed to. */
  system: {
    raisedBy: 'platform',
    recipients: ['epc_owner'],
    channels: ['in_app'],
    urgency: 'standard',
  },
};
