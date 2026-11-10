import { describe, expect, it } from 'vitest';
import { NOTIFICATION_REGISTRY } from '../../src/notifications/registry';
import { NOTIFICATION_TYPES } from '../../src/notifications/types';

/** The M02 events `F6-10`'s matrix names: the escalation, the assignment and the enquiry. */
const M02_EVENTS = ['lead_unassigned_24h', 'lead_assigned', 'lead_enquiry'] as const;

describe('the notification registry holds the CRM’s events (F6-05, F6-10)', () => {
  it.each(M02_EVENTS)(
    'every M02 event the matrix names is registered with recipients and channels — %s',
    (type) => {
      expect(NOTIFICATION_TYPES).toContain(type);
      const registration = NOTIFICATION_REGISTRY[type];
      expect(registration.raisedBy).toBe('crm');
      expect(registration.recipients.length).toBeGreaterThan(0);
      expect(registration.channels).toContain('in_app');
    },
  );
});
