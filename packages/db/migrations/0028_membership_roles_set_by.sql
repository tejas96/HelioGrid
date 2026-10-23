-- 0028 · who last set a person's roles (T-M01-010 part a): the role card's credit line
-- (SCR-M01-10 ruling 15) names whoever last wrote the membership's roles — the inviter at the join,
-- the owner at a role change. The founder's stays null: nobody set it.
--
-- tenant_membership is already tenant-scoped, all four; app_user already holds SELECT and UPDATE on
-- it, so the column needs no grant of its own.
--
-- Additive: a nullable column old code never reads; new code reads null as "no credit line".

ALTER TABLE "tenant_membership" ADD COLUMN "roles_set_by_user_id" uuid;
ALTER TABLE "tenant_membership" ADD CONSTRAINT "tenant_membership_roles_set_by_user_id_user_account_id_fk" FOREIGN KEY ("roles_set_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;

-- The memberships written before this column: the latest role change that was written (a blocked
-- attempt changed nothing), else the inviter of the invite the person accepted.
UPDATE "tenant_membership" AS m
SET "roles_set_by_user_id" = coalesce(
	(
		SELECT a."actor_ref"
		FROM "audit_log_entry" AS a
		WHERE a."tenant_id" = m."tenant_id"
			AND a."event_type" = 'team.roles_changed'
			AND a."blocked" = false
			AND a."subject_kind" = 'tenant_membership'
			AND a."subject_ref" = m."id"
		ORDER BY a."occurred_at" DESC
		LIMIT 1
	),
	(
		SELECT i."inviter_user_id"
		FROM "audit_log_entry" AS a
		JOIN "invitation" AS i ON i."id" = a."subject_ref" AND i."tenant_id" = a."tenant_id"
		WHERE a."tenant_id" = m."tenant_id"
			AND a."event_type" = 'team.invite_accepted'
			AND a."blocked" = false
			AND a."actor_ref" = m."user_account_id"
		ORDER BY a."occurred_at" DESC
		LIMIT 1
	)
);
