# heliogrid-temporal — the deployment CANDIDATE image.
#
# Pinned BY DIGEST, not by tag: `1.30.6` was rebuilt inside the window this stack was authored,
# and an image nobody can fetch again proves nothing durable. The digest set moves together —
# server, admin-tools (schema tool + CLI) and the SDK — see infra/temporal/README.md §1.
#
# The admin tools are IN the runtime image on purpose. Schema bootstrap and one-minor upgrades
# run against a live cluster with `temporal-sql-tool` at the SERVER's exact version; shipping a
# separate tool image is how the two drift and how an upgrade runs the wrong schema.
FROM temporalio/admin-tools:1.30.6@sha256:d6218349ac4468ea97877dedaa5351b16364983946dbde49811d93011da649c6 AS tools

FROM temporalio/server:1.30.6@sha256:c8ade0075f9d9da43c206de2b255c80be49db384045bd1ff76bd58d0f408a314

USER root
# `postgresql-client` is NOT optional dressing: `scripts/backup.sh` runs `pg_dump` and the
# server image does not ship it. Without this the backup runbook fails on the machine, at the
# moment an operator most needs it to work — found by running the script in the image
# (2026-08-26). The client MAJOR must be >= the server's; pinning the alpine package keeps the
# image reproducible.
RUN apk add --no-cache postgresql16-client curl

# temporal-sql-tool, the CLI and the schema files, at the server's exact version.
COPY --from=tools /usr/local/bin/temporal-sql-tool /usr/local/bin/temporal-sql-tool
COPY --from=tools /usr/local/bin/temporal          /usr/local/bin/temporal
COPY --from=tools /etc/temporal/schema             /etc/temporal/schema

COPY config/server.template.yaml /etc/temporal/config/server.template.yaml
COPY config/dynamicconfig        /etc/temporal/dynamicconfig
COPY scripts/                    /etc/temporal/deploy-scripts/
RUN chmod +x /etc/temporal/deploy-scripts/*.sh

# The config is RENDERED at start (see render-config.sh) and the server is told exactly where
# to read it: a file at the conventional ./config/<env>.yaml is IGNORED in favour of an
# embedded env-driven template — measured 2026-08-25.
ENV TEMPORAL_SERVER_CONFIG_FILE_PATH=/etc/temporal/config/server.yaml
# internal-frontend must be STARTED, not merely configured: the default service list is
# frontend,history,matching,worker and Temporal's own system worker then has nothing to call.
ENV TEMPORAL_SERVICES=frontend,internal-frontend,history,matching,worker
# NOT set, ever: TEMPORAL_ALLOW_NO_AUTH. The server refuses to start without an authorizer
# unless that flag is given, and never giving it is what stops an unauthenticated cluster
# appearing during a debugging session and staying.

EXPOSE 7233 9090
ENTRYPOINT ["/etc/temporal/deploy-scripts/render-config.sh"]
CMD ["temporal-server", "start"]
