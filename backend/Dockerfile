FROM oven/bun:1 AS builder
WORKDIR /app

# Root-Workspace + Frontend-Stub (nötig damit Workspace-Auflösung klappt)
COPY package.json bun.lock ./
RUN mkdir -p frontend && echo '{"name":"frontend-stub"}' > frontend/package.json
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Backend-Dependencies (vom Root aus installieren, Workspaces werden aufgelöst)
COPY backend/package.json backend/tsconfig.json ./backend/
RUN bun install

# Build
COPY backend/src ./backend/src
RUN bun build ./backend/src/index.ts --outdir ./backend/dist --target bun

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
# node_modules liegt im Root (wegen Workspace-Install von dort)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
EXPOSE 3000
# Die Dist-Datei ist ein Standalone-Bundle, einfach ausführen
CMD ["bun", "run", "dist/index.js"]
