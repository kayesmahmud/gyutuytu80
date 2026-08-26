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
COPY packages/auth-core/package.json packages/auth-core/
COPY packages/messaging-core/package.json packages/messaging-core/
COPY packages/upload-utils/package.json packages/upload-utils/
COPY packages/translations/package.json packages/translations/

# Copy .npmrc for private registry auth (@untitledui-pro)
COPY .npmrc ./

RUN npm install

# npm's macOS-generated lock file doesn't resolve Linux-musl native bindings
# (npm/cli#4828). Install sharp's musl bindings explicitly for Alpine.
# PINNED to match sharp@0.34.5 in the lockfile — unversioned pulls @latest, and a
# newer libvips (cpp.so.8.17.3) mismatches the binary, so `import sharp` throws
# ERR_DLOPEN_FAILED at startup and the API crash-loops (optimizeImage is imported
# at module load by editors.routes.ts and others).
RUN npm install --no-save \
    @img/sharp-linuxmusl-x64@0.34.5 \
    @img/sharp-libvips-linuxmusl-x64@1.2.4

# ---- Stage 2: Build shared packages + API ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all node_modules (including nested workspace-specific ones)
COPY --from=deps /app .
COPY . .

# Generate Prisma client (DATABASE_URL needed at generate-time but not used for codegen)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
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

# Build auth-core for production the same way as database: source is .ts, prod
# runs compiled .js via `node`. Compile to CommonJS (extensionless relative
# imports + the @thulobazaar/database require resolve at runtime) and rewrite
# package.json to point at dist. Must run AFTER database (auth-core imports it).
RUN cd packages/auth-core && npx tsc --noCheck --module commonjs --moduleResolution node && \
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
# AI moderation policy library (.md files live outside src/, see lib/ai/policies.ts)
COPY --from=builder /app/apps/api/policies ./apps/api/policies
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/prisma.config.ts ./packages/database/prisma.config.ts
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
COPY --from=builder /app/packages/auth-core/dist ./packages/auth-core/dist
COPY --from=builder /app/packages/auth-core/package.json ./packages/auth-core/
COPY --from=builder /app/package.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 5000

CMD ["node", "apps/api/dist/index.js"]
