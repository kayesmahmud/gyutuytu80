# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files for workspaces
COPY package.json package-lock.json ./

# Copy all workspace package.json files
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/api-client/package.json packages/api-client/
COPY packages/database/package.json packages/database/
COPY packages/messaging-core/package.json packages/messaging-core/
COPY packages/upload-utils/package.json packages/upload-utils/
COPY packages/translations/package.json packages/translations/

# Copy .npmrc for private registry auth (@untitledui-pro)
COPY .npmrc ./

RUN npm install

# ---- Stage 2: Build shared packages + Next.js ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all node_modules (including nested workspace-specific ones like apps/web/node_modules/tailwindcss v4)
COPY --from=deps /app .
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared packages in dependency order
# upload-utils uses tsup (rollup) which needs platform-specific native bindings;
# compile with tsc directly instead to avoid rollup dependency
RUN npm run build -w packages/types && \
    npm run build -w packages/utils && \
    cd packages/upload-utils && npx tsc --module commonjs --moduleResolution node && cd /app && \
    npm run build -w packages/api-client

# NEXT_PUBLIC_ vars must be set at build time (inlined into client-side JS)
ARG NEXT_PUBLIC_API_URL=https://api.thulobazaar.com.np
ARG NEXT_PUBLIC_SITE_URL=https://thulobazaar.com.np
ARG NEXT_PUBLIC_API_HOSTNAME=api.thulobazaar.com.np
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_HOSTNAME=$NEXT_PUBLIC_API_HOSTNAME

# Build Next.js with Turbopack (default in Next.js 16, handles Tailwind v4 @import natively)
RUN cd apps/web && npx next build

# ---- Stage 3: Production image (alpine is fine — only runs pure JS) ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3333

CMD ["node", "apps/web/server.js"]
