# ADR-0018: worker image additionally carries Chromium + Noto fonts for Playwright PDF
# rendering with correct Devanagari shaping — added when the DocumentRenderPort lands
# (Track B). Base stays node:22-slim + pnpm deploy pruning.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @heliogrid/worker...
RUN pnpm --filter @heliogrid/worker... run build
# `--legacy` is REQUIRED on pnpm 10: without it `deploy` aborts with
# ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE unless the workspace sets
# inject-workspace-packages=true. Verified 2026-07-30 — the image could not build.
RUN pnpm --filter @heliogrid/worker --prod --legacy deploy /out

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
COPY --from=build /repo/apps/worker/dist ./dist
CMD ["node", "dist/main.js"]
