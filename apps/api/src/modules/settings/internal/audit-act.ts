import type { AuditEventType, AuditSubjectKind } from '@heliogrid/domain';
import type { Act } from '../../../common/auth/session-context';
import type { AuditEntryToWrite } from '../../audit/audit.public';

/**
 * A settings change as the log records it (`F2-22`: tenant settings, branding and tranche edits
 * are covered events). The event name says the whole change, so no payload rides with it; the
 * row itself holds what was saved.
 */
export function settingsAct(
  eventType: AuditEventType,
  tenantId: string,
  subject: { readonly kind: AuditSubjectKind; readonly ref: string },
  act: Act,
): AuditEntryToWrite {
  return {
    tenantId,
    eventType,
    actorKind: 'tenant_user',
    actorRef: act.actorUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: subject.kind,
    subjectRef: subject.ref,
    changePayload: null,
  };
}
