# ADR-0018: worker image additionally carries Chromium + Noto fonts for Playwright PDF
# rendering with correct Devanagari shaping — added when the DocumentRenderPort lands
# (Track B). Base stays node:22-slim + pnpm deploy pruning.
#
# ADR-0025: this image runs the TEMPORAL worker. It carries the pre-built workflow bundle and
# no bundler — see the assertion below for why that is the point rather than an omission.
FROM node:25-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @heliogrid/worker...
RUN pnpm --filter @heliogrid/worker... run build

# FAIL THE IMAGE if the workflow bundle is missing. The runtime deliberately has no bundler:
# bundling at boot would need the workflow SOURCE in the image and would move a
# determinism-breaking import from a CI failure to a production one. Without this line the
# image builds fine and the worker refuses to start on the machine instead.
RUN test -s /repo/apps/worker/dist/workflow-bundle.js \
    || (echo "workflow bundle missing — run build:workflows" && exit 1)

# `--legacy` is REQUIRED on pnpm 10: without it `deploy` aborts with
# ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE unless the workspace sets
# inject-workspace-packages=true. Without the flag the image does not build at all.
RUN pnpm --filter @heliogrid/worker --prod --legacy deploy /out

# The base is pinned BY DIGEST, as infra/compose.yaml pins postgres: `22-slim` is a moving
# pointer, and an image nobody can re-fetch cannot be the one that was proven. Move it with
# `docker pull node:22-slim` and the digest it resolves to, deliberately.
FROM node:25-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
# Carries dist/workflow-bundle.js with it — the artifact the runtime loads by path.
COPY --from=build /repo/apps/worker/dist ./dist

# The base image carries an unprivileged `node` (uid 1000). Everything above ran as root and the
# copies are owned by root, which is what we want: the runtime may READ its own code and write
# nothing. A container broken into from the network then starts with no way to rewrite the app,
# install a package, or bind a privileged port.
USER node
CMD ["node", "dist/main.js"]
