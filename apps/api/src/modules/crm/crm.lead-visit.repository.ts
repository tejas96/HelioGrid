import type { Visit } from '@heliogrid/contracts';
import { type DbTransaction, leadVisitBooking, tenant, userAccount } from '@heliogrid/db';
import { clockTimeHhmm, clockTimeOfMinutes, localDate, localMinutes } from '@heliogrid/domain';
import { and, desc, eq, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { memberNameOf } from './crm.lead-columns.repository';

const surveyor = alias(userAccount, 'surveyor');

/**
 * The booked visit in force: the newest booking no reschedule has replaced, its moment on the
 * tenant's clock (`F1-10`).
 */
export async function visitOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<Visit | null> {
  const replacement = alias(leadVisitBooking, 'replacement');
  const [booking] = await tx
    .select({
      id: leadVisitBooking.id,
      scheduledAt: leadVisitBooking.scheduledAt,
      surveyorId: leadVisitBooking.surveyorUserId,
      surveyorName: memberNameOf(surveyor),
      address: leadVisitBooking.address,
      rescheduledFromId: leadVisitBooking.rescheduledFromId,
      bookedAt: leadVisitBooking.createdAt,
      timeZone: tenant.timezone,
    })
    .from(leadVisitBooking)
    .innerJoin(surveyor, eq(surveyor.id, leadVisitBooking.surveyorUserId))
    .innerJoin(tenant, eq(tenant.id, leadVisitBooking.tenantId))
    .where(
      and(
        eq(leadVisitBooking.tenantId, tenantId),
        eq(leadVisitBooking.leadId, leadId),
        notExists(
          tx
            .select({ id: replacement.id })
            .from(replacement)
            .where(
              and(
                eq(replacement.tenantId, leadVisitBooking.tenantId),
                eq(replacement.rescheduledFromId, leadVisitBooking.id),
              ),
            ),
        ),
      ),
    )
    .orderBy(desc(leadVisitBooking.createdAt), desc(leadVisitBooking.id))
    .limit(1);
  if (booking === undefined) return null;
  const at = booking.scheduledAt.getTime();
  return {
    id: booking.id,
    date: localDate(at, booking.timeZone),
    time: clockTimeHhmm(clockTimeOfMinutes(localMinutes(at, booking.timeZone))),
    surveyor: { userId: booking.surveyorId, name: booking.surveyorName ?? '' },
    address: booking.address,
    rescheduledFromId: booking.rescheduledFromId,
    bookedAt: booking.bookedAt.toISOString(),
  };
}
