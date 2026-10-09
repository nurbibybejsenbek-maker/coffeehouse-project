# Multi-stage build for Next.js application

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && corepack prepare pnpm@latest --activate && pnpm run build; \
  else \
    npm run build; \
  fi

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy Prisma Client files (including WASM for SQLite) from builder
# Use --mount to access builder's node_modules and copy Prisma files
RUN --mount=from=builder,source=/app/node_modules,target=/tmp/builder_node_modules \
    mkdir -p node_modules && \
    if [ -d "/tmp/builder_node_modules/.pnpm" ]; then \
      find /tmp/builder_node_modules/.pnpm -path "*/.prisma*" -type d -exec cp -r {} ./node_modules/ \; 2>/dev/null || true; \
      find /tmp/builder_node_modules/.pnpm -path "*/@prisma*" -type d -exec cp -r {} ./node_modules/ \; 2>/dev/null || true; \
    fi

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Change ownership of all files to nextjs user BEFORE switching user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use entrypoint script to run migrations and start server
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

