# ADR-0018: each app builds its own image — node:22-slim + pnpm deploy pruning.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @heliogrid/api...
RUN pnpm --filter @heliogrid/api... run build
RUN pnpm --filter @heliogrid/api --prod deploy /out

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]
