# ADR-0018: worker image additionally carries Chromium + Noto fonts for Playwright PDF
# rendering with correct Devanagari shaping — added when the DocumentRenderPort lands
# (Track B). Base stays node:22-slim + pnpm deploy pruning.
#
# ADR-0025: this image runs the TEMPORAL worker. It carries the pre-built workflow bundle and
# no bundler — see the assertion below for why that is the point rather than an omission.
FROM node:22-slim AS build
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
# inject-workspace-packages=true. Verified 2026-07-30 — the image could not build.
RUN pnpm --filter @heliogrid/worker --prod --legacy deploy /out

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
# Carries dist/workflow-bundle.js with it — the artifact the runtime loads by path.
COPY --from=build /repo/apps/worker/dist ./dist
CMD ["node", "dist/main.js"]
