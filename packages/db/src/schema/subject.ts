import { SUBJECT_KINDS } from '@heliogrid/domain';
import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * What a record points AT — the kind half of the suite's ONE polymorphic pointer (`F2-22`,
 * `F6-02`). It belongs to no single table: the audit entry and the notification both name their
 * subject with it, so it sits beside neither. pgEnum hand-mirrors domain's tuple (`M17` proves
 * the pair equal).
 */
export const subjectKind = pgEnum('subject_kind', SUBJECT_KINDS);
