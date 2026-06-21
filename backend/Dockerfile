FROM oven/bun:1 AS builder
WORKDIR /app

# Abhängigkeiten
COPY packages/shared ./packages/shared
COPY backend/package.json backend/tsconfig.json ./backend/
WORKDIR /app/backend
RUN bun install

# Build
COPY backend/src ./src
RUN bun build src/index.ts --outdir ./dist --target bun

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
