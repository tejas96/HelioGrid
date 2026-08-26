#!/usr/bin/env sh
# One-minor Temporal upgrade. Rehearsed against the local stack
# (infra/temporal/scripts/probe-upgrade.sh) before this was written.
#
# TWO RULES, and neither is negotiable:
#
#  1. ONE MINOR AT A TIME. Skipping a minor is not slow, it is unsupported, and the failure
#     surfaces after the old binary is gone.
#  2. SCHEMA FIRST, with the NEW version's temporal-sql-tool, while the OLD server is still
#     running. Schemas are backward compatible; binaries are not backward compatible with a
#     schema they do not know. Doing it the other way starts a new server against an old schema.
#
# The single-machine consequence, stated so nobody is surprised: this deploy PAUSES
# orchestration. Persisted workflows recover afterwards and lose nothing; in-flight activities
# are drained by kill_timeout. There is no HA machine to fail over to.
set -eu

TARGET="${1:?usage: upgrade.sh <target-version, exactly one minor above current>}"

cat <<PLAN
Upgrade to ${TARGET}

  0  Take a backup FIRST — scripts/backup.sh. An upgrade is the moment you most want one,
     and the moment you are least able to take one calmly.
  1  Update the schema with ${TARGET}'s temporal-sql-tool while the CURRENT server runs:
       fly ssh console -a heliogrid-temporal -C "sh /etc/temporal/deploy-scripts/bootstrap-schema.sh"
     ...from an image already built at ${TARGET}, or by running the ${TARGET} admin-tools
     image against the same database.
  2  Confirm the OLD server still serves the updated schema:
       temporal operator cluster health   → SERVING
  3  Move the binary: bump both digests in the Dockerfile, rebuild, deploy.
  4  Confirm: cluster health SERVING, temporal-server --version reports ${TARGET}, and a
     workflow that was in flight before step 3 still completes.
  5  Roll back by re-pinning the previous digests. The schema does NOT roll back — it does not
     need to, because it is backward compatible with the previous minor. That is the whole
     reason step 1 comes first.
PLAN
