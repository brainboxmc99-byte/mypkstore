FROM node:20-alpine AS builder
RUN npm install -g pnpm@9
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run typecheck:libs
RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/mypkstore run build
RUN pnpm --filter @workspace/api-server run build
RUN mkdir -p artifacts/api-server/dist/public && \
    cp -r artifacts/mypkstore/dist/public/* artifacts/api-server/dist/public/

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/artifacts/api-server/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
