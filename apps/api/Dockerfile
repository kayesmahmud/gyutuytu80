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

# npm's macOS-generated lock file doesn't resolve Linux-musl native bindings
# (npm/cli#4828). Install sharp's musl bindings explicitly for Alpine.
RUN npm install --no-save \
    @img/sharp-linuxmusl-x64 \
    @img/sharp-libvips-linuxmusl-x64

# ---- Stage 2: Build shared packages + API ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all node_modules (including nested workspace-specific ones)
COPY --from=deps /app .
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared packages in dependency order
# upload-utils normally uses tsup (rollup) but rollup has platform-specific
# native bindings. Use tsc directly and patch exports to avoid the dependency.
RUN npm run build -w packages/types && \
    npm run build -w packages/utils && \
    cd packages/upload-utils && npx tsc --module commonjs --moduleResolution node && \
    node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.exports;delete p.module;fs.writeFileSync('package.json',JSON.stringify(p,null,2))" && \
    cd /app && \
    npm run build -w packages/api-client

# Build database package for production (source is .ts, prod needs .js).
# Compile as CommonJS so extensionless relative imports work at runtime.
# Also strip "type":"module" so Node treats .js files as CJS.
RUN cd packages/database && npx tsc --noCheck --module commonjs --moduleResolution node && \
    node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); delete p.type; p.main='./dist/index.js'; p.exports={'.': {types:'./dist/index.d.ts', import:'./dist/index.js', require:'./dist/index.js', default:'./dist/index.js'}}; fs.writeFileSync('package.json', JSON.stringify(p,null,2))"

# Build Express API (--noCheck skips type checking, handled separately in CI)
RUN cd apps/api && npx tsc --noCheck

# ---- Stage 3: Production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# sharp needs native image processing libs (runtime only, not dev headers)
RUN apk add --no-cache vips

# Copy built API and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/upload-utils/dist ./packages/upload-utils/dist
COPY --from=builder /app/packages/upload-utils/package.json ./packages/upload-utils/
COPY --from=builder /app/packages/api-client/dist ./packages/api-client/dist
COPY --from=builder /app/packages/api-client/package.json ./packages/api-client/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/package.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 5000

CMD ["node", "apps/api/dist/index.js"]
