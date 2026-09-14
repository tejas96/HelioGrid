# ADR-0018: each app builds its own image — node:22-slim + pnpm deploy pruning.
FROM node:26-slim@sha256:14bf3eac4bf209d906d3c41256597d3ab1f926b2e93a79e9bdfe1efd32454239 AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @heliogrid/api...
RUN pnpm --filter @heliogrid/api... run build
# `--legacy` is REQUIRED on pnpm 10: without it `deploy` aborts with
# ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE unless the workspace sets
# inject-workspace-packages=true. Without the flag the image does not build at all.
RUN pnpm --filter @heliogrid/api --prod --legacy deploy /out

# The base is pinned BY DIGEST, as infra/compose.yaml pins postgres: `22-slim` is a moving
# pointer, and an image nobody can re-fetch cannot be the one that was proven. Move it with
# `docker pull node:22-slim` and the digest it resolves to, deliberately.
FROM node:26-slim@sha256:14bf3eac4bf209d906d3c41256597d3ab1f926b2e93a79e9bdfe1efd32454239
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 8084

# The base image carries an unprivileged `node` (uid 1000). Everything above ran as root and the
# copies are owned by root, which is what we want: the runtime may READ its own code and write
# nothing. A container broken into from the network then starts with no way to rewrite the app,
# install a package, or bind a privileged port.
USER node
CMD ["node", "dist/main.js"]
