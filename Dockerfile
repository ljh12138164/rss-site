FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install --global pnpm@11.23.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY server/api/package.json server/api/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GA_ID
ENV SITE_URL=https://news.ljhboard.cn
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
RUN pnpm --filter @rss-site/web build
# The preparation script is outside Next's route tracing. Install its complete
# dependency tree separately so it does not depend on standalone's pnpm links.
RUN npm install --prefix /mtran-runtime --omit=dev --ignore-scripts --no-audit --no-fund mtranserver@4.0.33

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    MT_CONFIG_DIR=/app/data/mtran/config \
    MT_MODEL_DIR=/app/data/mtran/models
RUN mkdir -p /app/data/mtran/config /app/data/mtran/models && chown -R bun:bun /app
COPY --from=builder --chown=bun:bun /app/apps/web/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=bun:bun /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=bun:bun /app/apps/web/scripts/prepare-translation.mjs ./apps/web/scripts/prepare-translation.mjs
COPY --from=builder --chown=bun:bun /mtran-runtime/node_modules ./translation/node_modules
RUN mkdir -p /app/apps/web/node_modules && \
    ln -sfn /app/translation/node_modules/mtranserver /app/apps/web/node_modules/mtranserver
USER bun
# Fail image construction, rather than container startup, if Bun cannot resolve it.
RUN cd /app/apps/web && bun -e "const { MTran } = await import('mtranserver'); if (typeof MTran !== 'function') throw new Error('Missing MTran export')"
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=300s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
CMD ["sh", "-c", "bun apps/web/scripts/prepare-translation.mjs && exec bun apps/web/server.js"]
