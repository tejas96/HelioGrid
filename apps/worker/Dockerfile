# ADR-0018: the image carries Chromium + Noto fonts for Playwright PDF rendering with correct
# Devanagari shaping (`03-tech-stack.md` §16) — the renderer on the `heliogrid-documents` queue.
# Base stays node:22-slim + pnpm deploy pruning.
#
# ADR-0025: this image runs the TEMPORAL worker. It carries the pre-built workflow bundle and
# no bundler — see the assertion below for why that is the point rather than an omission.
FROM node:26-slim@sha256:36793bcbb160a6a16cede1e62b93f84e26b78a972a8a4c0b879c1c12f22761ec AS build
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
FROM node:26-slim@sha256:36793bcbb160a6a16cede1e62b93f84e26b78a972a8a4c0b879c1c12f22761ec
ENV NODE_ENV=production
# Outside any home directory: the browser is installed as root and run as `node`.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY --from=build /out .
# Carries dist/workflow-bundle.js with it — the artifact the runtime loads by path.
COPY --from=build /repo/apps/worker/dist ./dist
# The Chromium build the pinned `playwright` drives, with the system libraries it needs, and the
# faces every document prints in: Latin and Devanagari (fonts-noto-core) and mono (F7-09). A
# document whose face is missing prints empty boxes, never an error.
RUN node node_modules/playwright/cli.js install --with-deps chromium \
    && apt-get update \
    && apt-get install -y --no-install-recommends fonts-noto-core fonts-noto-mono \
    && rm -rf /var/lib/apt/lists/*

# The base image carries an unprivileged `node` (uid 1000). Everything above ran as root and the
# copies are owned by root, which is what we want: the runtime may READ its own code and write
# nothing. A container broken into from the network then starts with no way to rewrite the app,
# install a package, or bind a privileged port.
USER node
CMD ["node", "dist/main.js"]
