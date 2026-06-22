# syntax=docker/dockerfile:1

# ---- base ---------------------------------------------------------------
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Pin pnpm explicitly so Corepack never resolves "latest" against the registry
# (which is non-deterministic and breaks builds without network/DNS). The pinned
# version must match `packageManager` in package.json.
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

# ---- deps (full install, cached) ---------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build (prisma generate + next build) ------------------------------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy URL so `next build` never needs a live DB (all pages are dynamic).
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build
# Pre-bundle the seed into a self-contained CJS file so the slim runner can seed
# with plain `node` (Next bundles deps like @prisma/adapter-pg/zod into the server
# output, leaving them unresolvable for a standalone script). The generated
# @prisma/client stays external — it resolves via the standalone node_modules.
RUN pnpm exec esbuild prisma/seed.ts --bundle --platform=node --format=cjs \
    --external:@prisma/client --external:pg-native --external:pg-cloudflare \
    --outfile=prisma/seed.cjs

# ---- dev (full toolchain; used by docker-compose.yml) ------------------
FROM base AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm prisma:seed && pnpm dev -p 3000 -H 0.0.0.0"]

# ---- runner (slim standalone; used by docker-compose.prod.yml) ---------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Global Prisma CLI gives a clean, symlink-free `prisma migrate deploy` at boot,
# without pnpm's symlinked node_modules. The seed runs from a pre-bundled CJS file.
RUN npm install -g prisma@7.8.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next standalone server + assets.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Migration + seed assets (applied by the entrypoint before the server starts).
# prisma/ includes the pre-bundled seed.cjs produced in the build stage.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
