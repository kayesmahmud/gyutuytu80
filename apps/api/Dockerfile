# ---- Stage 1: Install dependencies ----
FROM node:20-slim AS deps
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

# ---- Stage 2: Build shared packages + API ----
FROM node:20-slim AS builder
WORKDIR /app

# Copy all node_modules (including nested workspace-specific ones)
COPY --from=deps /app .
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared packages in dependency order
RUN npm run build -w packages/types && \
    npm run build -w packages/utils && \
    npm run build -w packages/upload-utils && \
    npm run build -w packages/api-client

# Build database package for production (source is .ts, prod needs .js)
RUN cd packages/database && npx tsc --noCheck && \
    node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.main='./dist/index.js'; p.exports={'.': {import:'./dist/index.js', types:'./dist/index.d.ts'}}; fs.writeFileSync('package.json', JSON.stringify(p,null,2))"

# Build Express API (--noCheck skips type checking, handled separately in CI)
RUN cd apps/api && npx tsc --noCheck

# ---- Stage 3: Production image (slim, not alpine — native modules need glibc) ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy built API and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/package.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 5000

CMD ["node", "apps/api/dist/index.js"]
